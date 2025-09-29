import React, { useState, useEffect } from "react";
import FloatingLabelInput from "@/shared/components/ui/FloatingLabelInput";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import { userService } from "../../services/userService";
import AutocompleteSelect from "@/components/shared/AutocompleteSelect";
import { getAutocompleteValue } from "@OpportunityUtils/searchUtils";
import EnhancedOpportunityNameField from "./EnhancedOpportunityNameField";

const BasicSearchFields = ({
  handleInputChange,
  handleSelectChange,
  searchParams = {},
}) => {
  console.log("BasicSearchFields - searchParams:", searchParams);
  console.log(
    "BasicSearchFields - primaryCampaign value:",
    searchParams.primaryCampaign
  );
  const [opportunityCreators, setOpportunityCreators] = useState([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(true);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [isLoadingBusinessUnits, setIsLoadingBusinessUnits] = useState(true);
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [assignedReps, setAssignedReps] = useState([]);
  const [isLoadingAssignedReps, setIsLoadingAssignedReps] = useState(true);
  const [salesPresenters, setSalesPresenters] = useState([]);
  const [isLoadingSalesPresenters, setIsLoadingSalesPresenters] =
    useState(true);

  useEffect(() => {
    const fetchOpportunityCreators = async () => {
      try {
        setIsLoadingCreators(true);
        const creators = await userService.getOpportunityCreators();
        setOpportunityCreators(creators);
      } catch (error) {
        console.error("Failed to fetch opportunity creators:", error);
        // Set empty array on error
        setOpportunityCreators([]);
      } finally {
        setIsLoadingCreators(false);
      }
    };

    const fetchBusinessUnits = async () => {
      try {
        setIsLoadingBusinessUnits(true);
        const units = await userService.getBusinessUnits();
        setBusinessUnits(units);
      } catch (error) {
        console.error("Failed to fetch business units:", error);
        // Set empty array on error
        setBusinessUnits([]);
      } finally {
        setIsLoadingBusinessUnits(false);
      }
    };

    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const productsList = await userService.getProducts();
        setProducts(productsList);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        // Set empty array on error
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    const fetchCampaigns = async () => {
      try {
        setIsLoadingCampaigns(true);
        const campaignsList = await userService.getCampaigns();
        setCampaigns(campaignsList);
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
        // Set empty array on error
        setCampaigns([]);
      } finally {
        setIsLoadingCampaigns(false);
      }
    };

    const fetchAssignedReps = async () => {
      try {
        setIsLoadingAssignedReps(true);
        const reps = await userService.getOpportunityCreators();
        setAssignedReps(reps);
      } catch (error) {
        console.error("Failed to fetch assigned reps:", error);
        // Set empty array on error
        setAssignedReps([]);
      } finally {
        setIsLoadingAssignedReps(false);
      }
    };

    const fetchSalesPresenters = async () => {
      try {
        setIsLoadingSalesPresenters(true);
        const presenters = await userService.getOpportunityCreators();
        setSalesPresenters(presenters);
      } catch (error) {
        console.error("Failed to fetch sales presenters:", error);
        // Set empty array on error
        setSalesPresenters([]);
      } finally {
        setIsLoadingSalesPresenters(false);
      }
    };

    fetchOpportunityCreators();
    fetchBusinessUnits();
    fetchProducts();
    fetchCampaigns();
    fetchAssignedReps();
    fetchSalesPresenters();
  }, []);

  const handleFieldChange = (field) => (value) => {
    handleInputChange({ target: { name: field, value } });
  };

  const handleSelectFieldChange = (field) => (value) => {
    handleSelectChange(field, value);
  };

  const handleMultiSelectChange = (field) => (values) => {
    handleSelectChange(field, values);
  };

  // Opportunity Name is now handled by AutocompleteSelect

  return (
    <div className="pt-2">
      <div className="space-y-4">
        {/* Row 1 */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 sm:col-span-5">
            <EnhancedOpportunityNameField
              label="Opportunity Name"
              value={
                Array.isArray(searchParams.opportunityNameBasic)
                  ? searchParams.opportunityNameBasic
                  : searchParams.opportunityNameBasic
                  ? [searchParams.opportunityNameBasic]
                  : []
              }
              onChange={handleMultiSelectChange("opportunityName")}
              placeholder="Type opportunity name or select option..."
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <MultiSelectDropdown
              id="created-rep"
              label="Opportunity Creator"
              value={
                Array.isArray(searchParams.createdRep)
                  ? searchParams.createdRep
                  : searchParams.createdRep
                  ? [searchParams.createdRep]
                  : []
              }
              onChange={handleMultiSelectChange("createdRep")}
              options={opportunityCreators}
              placeholder={
                isLoadingCreators ? "Loading creators..." : "Select creator"
              }
              disabled={isLoadingCreators}
            />
          </div>
          <div className="col-span-12 sm:col-span-3">
            <MultiSelectDropdown
              id="business-unit"
              label="Business Unit"
              value={
                Array.isArray(searchParams.businessUnit)
                  ? searchParams.businessUnit
                  : searchParams.businessUnit
                  ? [searchParams.businessUnit]
                  : []
              }
              onChange={handleMultiSelectChange("businessUnit")}
              options={businessUnits}
              placeholder={
                isLoadingBusinessUnits
                  ? "Loading business units..."
                  : "Select business unit"
              }
              disabled={isLoadingBusinessUnits}
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 sm:col-span-3">
            <MultiSelectDropdown
              id="product"
              label="Product"
              value={
                Array.isArray(searchParams.product)
                  ? searchParams.product
                  : searchParams.product
                  ? [searchParams.product]
                  : []
              }
              onChange={handleMultiSelectChange("product")}
              options={products}
              placeholder={
                isLoadingProducts ? "Loading products..." : "Select product"
              }
              disabled={isLoadingProducts}
            />
          </div>
          <div className="col-span-12 sm:col-span-5">
            <AutocompleteSelect
              label="Company Name"
              value={
                Array.isArray(searchParams.companyNameBasic)
                  ? searchParams.companyNameBasic
                  : getAutocompleteValue(searchParams.companyNameBasic)
              }
              onChange={(values) =>
                handleSelectFieldChange("companyNameBasic")(values.join(","))
              }
              placeholder="Type to search companies..."
              className="w-full"
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <MultiSelectDropdown
              id="sales-presenter"
              label="Sales Presenter"
              value={
                Array.isArray(searchParams.salesPresenter)
                  ? searchParams.salesPresenter
                  : searchParams.salesPresenter
                  ? [searchParams.salesPresenter]
                  : []
              }
              onChange={handleMultiSelectChange("salesPresenter")}
              options={salesPresenters}
              placeholder={
                isLoadingSalesPresenters
                  ? "Loading presenters..."
                  : "Select presenter"
              }
              disabled={isLoadingSalesPresenters}
            />
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 sm:col-span-4">
            <MultiSelectDropdown
              id="assigned-rep"
              label="Assigned Rep"
              value={
                Array.isArray(searchParams.assignedRep)
                  ? searchParams.assignedRep
                  : searchParams.assignedRep
                  ? [searchParams.assignedRep]
                  : []
              }
              onChange={handleMultiSelectChange("assignedRep")}
              options={assignedReps}
              placeholder={
                isLoadingAssignedReps ? "Loading reps..." : "Select rep"
              }
              disabled={isLoadingAssignedReps}
            />
          </div>
          <div className="col-span-12 sm:col-span-5">
            <MultiSelectDropdown
              id="primary-campaign"
              label="Primary Campaign Source"
              value={
                Array.isArray(searchParams.primaryCampaign)
                  ? searchParams.primaryCampaign
                  : searchParams.primaryCampaign
                  ? [searchParams.primaryCampaign]
                  : []
              }
              onChange={handleMultiSelectChange("primaryCampaign")}
              options={campaigns}
              placeholder={
                isLoadingCampaigns ? "Loading campaigns..." : "Select campaign"
              }
              disabled={isLoadingCampaigns}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicSearchFields;
