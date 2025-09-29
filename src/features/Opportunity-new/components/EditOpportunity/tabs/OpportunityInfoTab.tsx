import React, { useState, useEffect } from 'react';
import { FormInput } from '../../ui/FormInput';
import FloatingLabelSelect from '@/shared/components/ui/FloatingLabelSelect';
import { FloatingMultiSelect } from '@/shared/components/ui/FloatingMultiSelect';
import { Textarea } from '@/shared/components/ui/textarea';
import { TabProps } from '../../../types/opportunity';
import {
  OPPORTUNITY_STATUS_OPTIONS,
  OPPORTUNITY_PROBABILITY_OPTIONS,
  OPPORTUNITY_LEAD_SOURCES,
  OPPORTUNITY_LEAD_TYPES,
  OPPORTUNITY_LEAD_STATUS
} from '../../../constants/opportunityOptions';
import { useBasicInfoData } from '@/features/Opportunity/components/EditOpportunity/BasicInfo/useBasicInfoData';
import { useBasicInfoHandlers } from '@/features/Opportunity/components/EditOpportunity/BasicInfo/useBasicInfoHandlers';
import CustomerSearchBar from '../shared//CustomerSearchBar';

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

  // Check if customer is selected
  useEffect(() => {
    const customerSelected = !!(formData.customerId || formData.contactDetails?.ID || formData.company);
    setIsCustomerSelected(customerSelected);
  }, [formData.customerId, formData.contactDetails?.ID, formData.company]);
  // Use the existing data hooks from the working implementation
  const {
    apiOpportunityTypes,
    apiStages,
    businessUnitOptionsToUse,
    productOptionsToUse,
    userOptionsToUse,
    contactOptions,
    apiLossReasons,
    addModeStatusOptions,
    isLoadingOpportunityTypes,
    isLoadingStages,
    isLoadingBusinessUnits,
    isLoadingProducts,
    isLoadingUsers,
    isLoadingContacts,
    isLoadingLossReasons,
    shouldDisableFields,
    shouldDisableProposalLinkedFields,
  } = useBasicInfoData(
    formData,
    isAddMode,
    isCustomerSelected,
    !!(formData.proposalId && formData.proposalId.trim() !== '')
  );

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
        status: "Open", // Default status to avoid validation errors
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
    <div className="space-y-6">
      {/* Customer Search Bar - Only in Add Mode */}
      {isAddMode && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Select Customer</h3>
          <p className="text-sm text-blue-700 mb-4">
            Search and select a customer to enable the opportunity form fields.
          </p>

          <CustomerSearchBar
            onSearch={() => { }}
            onCustomerSelect={handleCustomerSelect}
            placeholder="Type customer name to search..."
          />

          {!isCustomerSelected && (
            <p className="text-sm text-orange-600 mt-3">
              ⚠️ Please select a customer to enable the form fields below.
            </p>
          )}

          {isCustomerSelected && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-700">
                ✅ Customer selected: <strong>{formData.company}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Basic Information Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
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
              required
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
              required
              disabled={(formData.contactDetails?.ID && formData.contactDetails.ID > 0) || (formData.opportunityId && formData.opportunityId.trim() !== '') || shouldDisableFields}
            />
          </div>

          <div className="md:col-span-2">
            <FloatingLabelSelect
              label="Status"
              value={formData.status || ''}
              onChange={(value) => handleInputChange('status', value)}
              options={isAddMode ? addModeStatusOptions : OPPORTUNITY_STATUS_OPTIONS}
              error={getFieldError('status')}
              required
              disabled={shouldDisableFields}
              clearable={false}
            />
          </div>

          {/* Row 2: Contact (4), Stage (4), Amount (2), Probability (2) */}
          <div className="md:col-span-4">
            <FloatingLabelSelect
              label="Contact Name"
              value={formData.contactName || ''}
              onChange={handleContactNameChange}
              options={contactOptions}
              error={getFieldError('contactName')}
              disabled={isLoadingContacts || shouldDisableFields}
              placeholder={isLoadingContacts ? "Loading..." : "Select contact"}
            />
          </div>

          <div className="md:col-span-4">
            <FloatingLabelSelect
              label="Stage"
              value={formData.stageDetails?.Stage || ''}
              onChange={handleStageChange}
              options={apiStages}
              error={getFieldError('stageDetails')}
              required
              disabled={isLoadingStages || shouldDisableFields}
              placeholder={isLoadingStages ? "Loading..." : "Select stage"}
              clearable={false}
            />
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
              required
            />
          </div>

          <div className="md:col-span-2">
            <FloatingLabelSelect
              label="Probability (%)"
              value={formData.probability || ''}
              onChange={(value) => handleInputChange('probability', value)}
              options={OPPORTUNITY_PROBABILITY_OPTIONS}
              error={getFieldError('probability')}
              required
              disabled={shouldDisableFields}
              clearable={false}
            />
          </div>

          {/* Row 3: Opportunity Type (4), Business Unit (4), Product (4) */}
          <div className="md:col-span-4">
            <FloatingLabelSelect
              label="Opportunity Type"
              value={getOpportunityTypeDisplayValue()}
              onChange={handleOpportunityTypeChange}
              options={apiOpportunityTypes}
              error={getFieldError('opportunityType')}
              required
              disabled={isLoadingOpportunityTypes || shouldDisableFields}
              placeholder={isLoadingOpportunityTypes ? "Loading..." : "Select opportunity type"}
              clearable={false}
            />
          </div>

          <div className="md:col-span-4">
            <div className="relative" style={{ zIndex: 1000 }}>
              <FloatingMultiSelect
                label="Business Unit"
                value={formData.businessUnitId || []}
                onChange={(values) => handleInputChange('businessUnitId', values)}
                // onChange={handleBusinessUnitChange}
                options={businessUnitOptionsToUse.map(option => ({
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
                searchable={true}
                showSelectedCount={true}
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="relative" style={{ zIndex: 999 }}>
              <FloatingMultiSelect
                label="Product"
                value={formData.productId || []}
                onChange={(values) => handleInputChange('productId', values)}
                options={productOptionsToUse.map(option => ({
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
                searchable={true}
                showSelectedCount={true}
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
              required
              disabled={shouldDisableFields}
            />
          </div>

          <div className="md:col-span-5">
            <FloatingLabelSelect
              label="Assign To"
              value={formData.assignedRepDetails?.Name || formData.assignedRep || ''}
              onChange={handleAssignedRepChange}
              options={userOptionsToUse}
              disabled={isLoadingUsers || shouldDisableFields}
              placeholder={isLoadingUsers ? "Loading..." : "Select assigned rep"}
            />
          </div>

          {/* Row 5: Sales Representative (4), Closed Lost Reason (4), Forecast Revenue (4) - disabled */}
          <div className="md:col-span-4">
            <FloatingLabelSelect
              label="Sales Representative"
              value={formData.salesPresenterDetails?.Name || formData.salesPresentation || ''}
              onChange={handleSalesPresenterChange}
              options={userOptionsToUse}
              disabled={isLoadingUsers || shouldDisableFields}
              placeholder={isLoadingUsers ? "Loading..." : "Select sales representative"}
            />
          </div>

          <div className="md:col-span-4">
            <FloatingLabelSelect
              label="Closed Lost Reason"
              value={formData.lossReasonDetails?.Name || formData.lostReason || ''}
              onChange={handleLossReasonChange}
              options={apiLossReasons}
              disabled={isLoadingLossReasons || shouldDisableFields}
              placeholder={isLoadingLossReasons ? "Loading..." : "Select loss reason"}
            />
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