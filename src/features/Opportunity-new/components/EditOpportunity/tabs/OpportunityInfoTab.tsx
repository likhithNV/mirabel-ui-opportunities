import React, { useState, useEffect } from 'react';
import { FormInput } from '../../ui/FormInput';
import { FormSelect } from '../../ui/FormSelect';
import FloatingLabelSelect from '@/shared/components/ui/FloatingLabelSelect';
import { FloatingMultiSelect } from '@/shared/components/ui/FloatingMultiSelect';
import { SimpleMultiSelect } from '@/shared/components/ui/SimpleMultiSelect';

import { Textarea } from '@/shared/components/ui/textarea';
import { TabProps } from '../../../types/opportunity';
import {
  OPPORTUNITY_STATUS_OPTIONS,
  OPPORTUNITY_PROBABILITY_OPTIONS,
  OPPORTUNITY_LEAD_SOURCES,
  OPPORTUNITY_LEAD_TYPES,
  OPPORTUNITY_LEAD_STATUS
} from '../../../constants/opportunityOptions';
import { useBasicInfoHandlers } from '@/features/Opportunity/components/EditOpportunity/BasicInfo/useBasicInfoHandlers';
import { useLazyDropdownData } from '../../../hooks/useLazyDropdownData';
import CustomerSearchBar from '../shared//CustomerSearchBar';
import { useRequiredFields } from '../../../hooks/useRequiredFields';
import { FloatingSelect } from '@/components/ui/FloatingSelect';

interface OpportunityInfoTabProps extends TabProps {
  isAddMode: boolean;
}

const OpportunityInfoTab: React.FC<OpportunityInfoTabProps> = ({
  formData,
  handleInputChange,
  handleBatchInputChange,
  getFieldError,
  hasSubmitted,
  isAddMode
}) => {
  const [isCustomerSelected, setIsCustomerSelected] = useState(false);
  const [contactLoaded, setContactLoaded] = useState(false);
  // Load required fields configuration
  const { isFieldRequired, isLoading: isLoadingRequiredFields } = useRequiredFields();

  // Check if customer is selected
  useEffect(() => {
    const customerSelected = !!(formData.customerId || formData.contactDetails?.ID || formData.company);
    setIsCustomerSelected(customerSelected);
    setContactLoaded(false);
  }, [formData.customerId, formData.contactDetails?.ID, formData.company]);
  // Use lazy loading for dropdown data
  const {
    opportunityTypes: apiOpportunityTypes,
    businessUnits: businessUnitOptionsToUse,
    products: productOptionsToUse,
    users: userOptionsToUse,
    contacts: contactOptions,
    lossReasons: apiLossReasons,
    stages: apiStages,
    isLoadingOpportunityTypes,
    isLoadingBusinessUnits,
    isLoadingProducts,
    isLoadingUsers,
    isLoadingContacts,
    isLoadingLossReasons,
    isLoadingStages,
    loadOpportunityTypes,
    loadBusinessUnits,
    loadProducts,
    loadUsers,
    loadContacts,
    loadLossReasons,
    loadStages,
    resetProducts,
    resetContacts
  } = useLazyDropdownData(formData, !isAddMode); // Pass isEditMode = !isAddMode

  // Check if fields should be disabled based on customer selection in Add mode
  const shouldDisableFields = isAddMode && !isCustomerSelected;

  // Check if specific fields should be disabled due to proposal linking
  const shouldDisableProposalLinkedFields = (fieldName: string) => {
    const isProposalLinked = !!(formData.proposalId && formData.proposalId.trim() !== '');
    if (!isProposalLinked) return false;

    // Fields that should be disabled when proposals are linked
    const proposalLinkedFields = ['amount', 'product', 'businessUnit'];
    return proposalLinkedFields.includes(fieldName);
  };

  const addModeStatusOptions = [
    { value: "Open", label: "Open" },
    { value: "Won", label: "Won" },
    { value: "Lost", label: "Lost" }
  ];

  // Customer selection handler for Add mode
  const handleCustomerSelect = (customer: any) => {
    if (customer) {
      handleBatchInputChange({
        company: customer.name || customer.company,
        customerId: customer.id,
        contactDetails: {
          ID: customer.id,
          Name: customer.name || customer.company
        },
        // Enable fields by setting default values
        amount: "0",
        probability: "10",
        status: "Open",
        createdBy: "Current User",
        createdDate: new Date().toISOString().split('T')[0],
        forecastRevenue: "0"
      });
      setIsCustomerSelected(true);
    } else {
      // Clear customer data
      handleBatchInputChange({
        company: "",
        customerId: "",
        contactDetails: {},
        amount: "",
        probability: "",
        status: "",
        businessUnit: [],
        businessUnitId: [],
        businessUnitDetails: [],
        product: [],
        productId: [],
        productDetails: []
      });
      setIsCustomerSelected(false);
    }
  };

  // Use the existing handlers from the working implementation
  const {
    handleOpportunityTypeChange,
    handleStageChange,
    handleBusinessUnitChange: originalHandleBusinessUnitChange,
    handleProductChange,
    handleAssignedRepChange,
    handleSalesPresenterChange,
    handleLossReasonChange,
    handleContactNameChange,
  } = useBasicInfoHandlers(
    handleInputChange,
    handleBatchInputChange,
    businessUnitOptionsToUse,
    apiOpportunityTypes,
    productOptionsToUse,
    userOptionsToUse,
    apiLossReasons,
    apiStages,
    contactOptions
  );

  // Enhanced business unit change handler that filters products


  // Check if proposal is linked to determine field disable state
  const isProposalLinked = !!(formData.proposalId && formData.proposalId.trim() !== '');

  // Get the display value for opportunity type
  const getOpportunityTypeDisplayValue = () => {
    if (typeof formData.opportunityType === "object" && formData.opportunityType?.name) {
      return formData.opportunityType.name;
    }
    if (typeof formData.opportunityType === "string") {
      return formData.opportunityType;
    }
    return "";
  };

  return (
    <div className="space-y-2">
      {/* Customer Search Bar - Only in Add Mode */}
      {isAddMode && (
        <div >
          <CustomerSearchBar
            onSearch={() => { }}
            onCustomerSelect={handleCustomerSelect}
            placeholder="Type customer name to search..."
          />
        </div>
      )}

      {/* Basic Information Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 relative" style={{ zIndex: 1 }}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Row 1: Name (6), Company (4), Status (2) */}
          <div className="md:col-span-6">
            <FormInput
              label="Opportunity Name"
              value={formData.name || ''}
              onChange={(value) => handleInputChange('name', value)}
              error={getFieldError('name')}
              placeholder="Enter opportunity name"
              required={isFieldRequired('OpportunityName')}
              disabled={shouldDisableFields}
            />
          </div>

          <div className="md:col-span-4">
            <FormInput
              label="Company Name"
              value={formData.company || ''}
              onChange={(value) => handleInputChange('company', value)}
              error={getFieldError('company')}
              placeholder="Enter company name"
              required={isFieldRequired('CompanyName')}
              disabled={(formData.contactDetails?.ID && formData.contactDetails.ID > 0) || (formData.opportunityId && formData.opportunityId.trim() !== '') || shouldDisableFields}
            />
          </div>

          <div className="md:col-span-2">
            <FormSelect
              label="Status"
              value={formData.status || ''}
              onChange={(value) => handleInputChange('status', value)}
              options={isAddMode ? addModeStatusOptions : OPPORTUNITY_STATUS_OPTIONS}
              error={getFieldError('status')}
              required={isFieldRequired('status')}
              disabled={shouldDisableFields}
              clearable={false}
            />
          </div>

          {/* Row 2: Contact (4), Stage (4), Amount (2), Probability (2) */}
          <div className="md:col-span-4">
            <div className="relative" style={{ zIndex: 9997 }}>

              <FormSelect
                label="Contact Name"
                value={formData.contactName || ''}
                onChange={handleContactNameChange}
                options={(contactOptions || []).map(contact => ({
                  value: contact.id,
                  label: contact.value
                }))}
                error={getFieldError('contactName')}
                required={isFieldRequired('contact')}
                disabled={isLoadingContacts || shouldDisableFields}
                placeholder={isLoadingContacts ? "Loading..." : "Select contact"}
                onFocus={() => {

                  const hasExistingValue = !!formData.contactName;
                  const shouldLoadData = isAddMode || !hasExistingValue;
                  if (!contactLoaded && shouldLoadData) {
                    loadContacts();
                    setContactLoaded(true);
                  }
                }}
                clearable={false}
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="relative" style={{ zIndex: 9996 }}>
              <FormSelect
                label="Stage"
                value={formData.stageDetails?.ID || ''}
                onChange={handleStageChange}
                options={(apiStages || []).map(stage => {
                  console.log(stage);
                  return {
                    value: stage.id,
                    label: stage.label
                  };
                })}
                error={getFieldError('stageDetails')}
                required={isFieldRequired('stage')}
                disabled={isLoadingStages || shouldDisableFields}
                placeholder={isLoadingStages ? "Loading..." : "Select stage"}
                clearable={false}
                onFocus={() => {
                  loadStages();
                }}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <FormInput
              label="Amount"
              type="number"
              value={formData.amount || ''}
              onChange={(value) => handleInputChange('amount', value)}
              error={getFieldError('amount')}
              placeholder="0.00"
              disabled={(!isAddMode && formData.proposalId && formData.proposalId.trim() !== '') || shouldDisableProposalLinkedFields("amount") || (isAddMode && !formData.customerId && !formData.contactDetails?.ID)}
              required={isFieldRequired('amount')}
            />
          </div>

          <div className="md:col-span-2">
            <div className="relative" style={{ zIndex: 9999 }}>
              <FormSelect
                label="Probability (%)"
                value={formData.probability || ''}
                onChange={(value) => handleInputChange('probability', value)}
                options={OPPORTUNITY_PROBABILITY_OPTIONS}
                error={getFieldError('probability')}
                required={isFieldRequired('probability')}
                disabled={shouldDisableFields}
                clearable={true}
                placeholder='Choose Probability (%)'
              />
            </div>
          </div>
          {/* Row 3: Opportunity Type (4), Business Unit (4), Product (4) */}
          <div className="md:col-span-4">
            <div className="relative" style={{ zIndex: 9995 }}>
              <FormSelect
                label="Opportunity Type"
                value={getOpportunityTypeDisplayValue()}
                onChange={handleOpportunityTypeChange}
                options={apiOpportunityTypes || []}
                error={getFieldError('opportunityType')}
                required={isFieldRequired('opportunityType')}
                disabled={isLoadingOpportunityTypes || shouldDisableFields}
                placeholder={isLoadingOpportunityTypes ? "Loading..." : "Select opportunity type"}
                clearable={false}
                onFocus={loadOpportunityTypes}

              />
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="relative" style={{ zIndex: 9992 }}>


              <FloatingMultiSelect
                label="Business Unit"
                value={formData.businessUnitId || []}
                onChange={(values) => handleInputChange('businessUnitId', values)}
                // onChange={handleBusinessUnitChange}
                options={(businessUnitOptionsToUse || []).map(option => ({
                  value: option.id,
                  label: option.label
                }))}
                placeholder={isLoadingBusinessUnits ? "Loading..." : "Select business units"}
                disabled={
                  isLoadingBusinessUnits ||
                  (!isAddMode && formData.proposalId && formData.proposalId.trim() !== '') ||
                  shouldDisableProposalLinkedFields("businessUnit") ||
                  (isAddMode && !formData.customerId && !formData.contactDetails?.ID)
                }
                className="w-full"
                required={isFieldRequired('businessUnit')}
                searchable={true}
                showSelectedCount={true}
                onDropdownVisibleChange={(open) => {
                  console.log('Business Unit dropdown visible change:', open);
                  // Only load data if in Add mode or no existing values
                  const hasExistingValues = formData.businessUnitId && formData.businessUnitId.length > 0;
                  const shouldLoadData = isAddMode || !hasExistingValues;
                  if (open && shouldLoadData) {
                    console.log('Loading business units - Add mode:', isAddMode, 'Has existing values:', hasExistingValues);
                    loadBusinessUnits();
                  }
                }}
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="relative" style={{ zIndex: 9998 }}>
              <FloatingMultiSelect
                label="Product"
                value={formData.productId || []}
                onChange={(values) => handleInputChange('productId', values)}
                options={(productOptionsToUse || []).map(option => ({
                  value: option.id,
                  label: option.label
                }))}
                placeholder={isLoadingProducts ? "Loading..." : "Select products"}
                disabled={
                  isLoadingProducts ||
                  (!isAddMode && formData.proposalId && formData.proposalId.trim() !== '') ||
                  shouldDisableProposalLinkedFields("product") ||
                  (isAddMode && !formData.customerId && !formData.contactDetails?.ID)
                }
                className="w-full"
                required={isFieldRequired('product')}
                searchable={true}
                showSelectedCount={true}
                onDropdownVisibleChange={(open) => {
                  console.log('Product dropdown visible change:', open);
                  // Only load data if in Add mode or no existing values
                  const hasExistingValues = formData.productId && formData.productId.length > 0;
                  const shouldLoadData = isAddMode || !hasExistingValues;
                  if (open && shouldLoadData) {
                    console.log('Loading products - Add mode:', isAddMode, 'Has existing values:', hasExistingValues);
                    loadProducts();
                  }
                }}
              />
            </div>
          </div>

          {/* Row 4: Primary Campaign Source (4), Projected Close Date (3), Assign To (5) */}
          <div className="md:col-span-4">
            <FormInput
              label="Primary Campaign Source"
              value={formData.primaryCampaignSource || ''}
              onChange={(value) => handleInputChange('primaryCampaignSource', value)}
              placeholder="Enter campaign source"
              required={isFieldRequired('primaryCampaignSource')}
              disabled={shouldDisableFields}
            />
          </div>

          <div className="md:col-span-3">
            <FormInput
              label="Projected Close Date"
              type="date"
              value={formData.projCloseDate || ''}
              onChange={(value) => handleInputChange('projCloseDate', value)}
              error={getFieldError('projCloseDate')}
              required={isFieldRequired('projCloseDate')}
              disabled={shouldDisableFields}
            />
          </div>

          <div className="md:col-span-5">
            <div className="relative" style={{ zIndex: 9994 }}>
              <FormSelect
                label="Assign To"
                value={formData.assignedRepDetails?.Name || formData.assignedRep || ''}
                onChange={handleAssignedRepChange}
                options={userOptionsToUse || []}
                required={isFieldRequired('assignedRep')}
                disabled={isLoadingUsers || shouldDisableFields}
                placeholder={isLoadingUsers ? "Loading..." : "Select assigned rep"}
                onFocus={() => {
                  const hasExistingValue = !!(formData.assignedRepDetails?.Name || formData.assignedRep);
                  const shouldLoadData = isAddMode || !hasExistingValue;
                  if (shouldLoadData) {
                    loadUsers();
                  }
                }}
              />
            </div>
          </div>

          {/* Row 5: Sales Representative (4), Closed Lost Reason (4), Forecast Revenue (4) - disabled */}
          <div className="md:col-span-4">
            <div className="relative" style={{ zIndex: 9993 }}>
              <FormSelect
                label="Sales Representative"
                value={formData.salesPresenterDetails?.Name || formData.salesPresentation || ''}
                onChange={handleSalesPresenterChange}
                options={userOptionsToUse || []}
                required={isFieldRequired('salesPresentation')}
                disabled={isLoadingUsers || shouldDisableFields}
                placeholder={isLoadingUsers ? "Loading..." : "Select sales representative"}
                onFocus={() => {
                  const hasExistingValue = !!(formData.salesPresenterDetails?.Name || formData.salesPresentation);
                  const shouldLoadData = isAddMode || !hasExistingValue;
                  if (shouldLoadData) {
                    loadUsers();
                  }
                }}
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="relative" style={{ zIndex: 9992 }}>
              <FormSelect
                label="Closed Lost Reason"
                value={formData.lossReasonDetails?.Name || formData.lostReason || ''}
                onChange={handleLossReasonChange}
                options={apiLossReasons || []}
                required={isFieldRequired('lostReason')}
                disabled={isLoadingLossReasons || shouldDisableFields}
                placeholder={isLoadingLossReasons ? "Loading..." : "Select loss reason"}
                onFocus={() => {
                  const hasExistingValue = !!(formData.lossReasonDetails?.Name || formData.lostReason);
                  const shouldLoadData = isAddMode || !hasExistingValue;
                  if (shouldLoadData) {
                    loadLossReasons();
                  }
                }}
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <FormInput
              label="Forecast Revenue"
              type="number"
              value={formData.forecastRevenue || ''}
              onChange={(value) => handleInputChange('forecastRevenue', value)}
              placeholder="0.00"
              disabled={true} // Always disabled - calculated field
            />
          </div>

          {/* Row 6: Created By (4) - disabled, Created Date (3) - disabled */}
          <div className="md:col-span-4">
            <FormInput
              label="Created By"
              value={formData.createdBy || ''}
              onChange={(value) => handleInputChange('createdBy', value)}
              error={getFieldError('createdBy')}
              placeholder="Enter creator name"
              disabled={true} // Always disabled - system field
            />
          </div>

          <div className="md:col-span-3">
            <FormInput
              label="Created Date"
              type="date"
              value={formData.createdDate || ''}
              onChange={(value) => handleInputChange('createdDate', value)}
              error={getFieldError('createdDate')}
              disabled={true} // Always disabled - system field
            />
          </div>

          {/* Row 7: Notes (12) - moved to top section */}
          <div className="md:col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter notes (minimum 10 characters required)"
              rows={3}
              disabled={shouldDisableFields}
              className={`w-full h-9 px-3 text-sm border rounded-md focus:outline-none 
          bg-white transition-colors border-gray-300 focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500'
                }`}
            />
            {getFieldError('notes') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('notes')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityInfoTab;