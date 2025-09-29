import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import AutocompleteSelect from "../../../../components/shared/AutocompleteSelect";
import EnhancedOpportunityNameField from "./EnhancedOpportunityNameField";

import { userService } from "@/features/Opportunity/Services/userService";
import { getAutocompleteValue } from "@OpportunityUtils/searchUtils";
import FloatingLabelSelect from "@/shared/components/ui/FloatingLabelSelect";
import { getSectionColorClass } from "./sectionColors";
import FloatingLabelInput from "@/shared/components/ui/FloatingLabelInput";
import EnhancedPhoneField from "./EnhancedPhoneField";
import EnhancedZipCodeField from "./EnhancedZipCodeField";
import EnhancedProposalIdField from "./EnhancedProposalIdField";
import EnhancedProposalNameField from "./EnhancedProposalNameField";
import ProposalEnhancedOpportunityNameField from "./ProposalEnhancedOpportunityNameField";

// Helper function to extract values from formatted strings (IE=, SW=, etc.)
const extractFormattedValues = (formattedValue) => {
  if (!formattedValue) return [];

  if (Array.isArray(formattedValue)) return formattedValue;

  if (typeof formattedValue === "string") {
    // Handle IE= format (ID-based search values)
    if (formattedValue.includes("IE=")) {
      const matches = formattedValue.match(/IE=([^~]+)~/g);
      if (matches && matches.length > 0) {
        return matches.map((match) => match.replace(/IE=|~/g, ""));
      }
    }
    // Handle SW= format (text-based search values)
    if (formattedValue.includes("SW=")) {
      const matches = formattedValue.match(/SW=([^~]+)~/g);
      if (matches && matches.length > 0) {
        return matches.map((match) => match.replace(/SW=|~/g, ""));
      }
    }
    // Handle comma-separated values
    if (formattedValue.includes(",")) {
      return formattedValue.split(",").filter((v) => v.trim());
    }
    // Handle single value
    return [formattedValue];
  }

  return [];
};

const DynamicFormRenderer = ({
  config,
  searchParams = {},
  handleInputChange,
  handleSelectChange,
  handleSearch,
  openAccordions,
  setOpenAccordions,
  isSearching = false, // New prop to indicate search is in progress
  searchJSON = {},
  isLoadingRecentSearch = false,
}) => {
  const [dropdownData, setDropdownData] = useState({});
  const [loadingStates, setLoadingStates] = useState({});

  // Show loading indicator when loading recent search data
  if (isLoadingRecentSearch) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
          <p className="text-sm text-gray-600">Loading recent search data...</p>
        </div>
      </div>
    );
  }

  // Data source mapping for lazy loading
  const dataSourceMap = {
    opportunityCreators: userService.getOpportunityCreators,
    businessUnits: userService.getBusinessUnits,
    products: userService.getProducts,
    campaigns: userService.getCampaigns,
    campaignSources: userService.getCampaigns,
    assignedReps: userService.getOpportunityCreators,
    salesPresenters: userService.getOpportunityCreators,
    createdReps: userService.getOpportunityCreators,
    proposalReps: userService.getProposalReps,
    proposalApprovalStages: userService.getProposalApprovalStages,
    proposalApprovalStatuses: userService.getProposalApprovalStatuses,
    productCategories: userService.getProducts,
    // Add missing data sources for proposal advanced search
    stages: userService.getStages,
    types: userService.getOpportunityTypes,
    lossReasons: userService.getLossReasons,
    contactCities: userService.getContactCities,
    contactStates: userService.getContactStates,
    contactCountries: userService.getContactCountries,
    contactCounties: userService.getContactCounties,
    // Add lead type and lead status data sources
    leadType: userService.getLeadTypes,
    leadStatus: userService.getLeadStatus,
    countries: userService.getContactCountries,
    states: userService.getContactStates,
    cities: userService.getContactCities,
  };

  // Lazy load dropdown data for individual dropdown when opened
  const loadDropdownData = async (dataSource) => {
    if (dropdownData[dataSource] || loadingStates[dataSource]) {
      return; // Already loaded or currently loading
    }

    if (!dataSourceMap[dataSource]) {
      console.warn(`No data source mapping found for: ${dataSource}`);
      return;
    }

    try {
      console.log(`Loading dropdown data for: ${dataSource}`);
      setLoadingStates((prev) => ({ ...prev, [dataSource]: true }));

      const data = await dataSourceMap[dataSource]();
      const processedData = Array.isArray(data) ? data : [];

      setDropdownData((prev) => ({
        ...prev,
        [dataSource]: processedData,
      }));

      console.log(
        `Successfully loaded ${processedData.length} items for: ${dataSource}`
      );
    } catch (error) {
      console.error(`Failed to load dropdown data for ${dataSource}:`, error);
      setDropdownData((prev) => ({
        ...prev,
        [dataSource]: [],
      }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [dataSource]: false }));
    }
  };

  const handleFieldChange = (fieldName) => (value) => {
    handleInputChange({ target: { name: fieldName, value } });
  };

  const handleSelectFieldChange = (fieldName) => (value) => {
    handleSelectChange(fieldName, value);
  };

  const handleMultiSelectChange = (fieldName) => (values) => {
    handleSelectChange(fieldName, values);
  };

  const getSelectedValues = (fieldName) => {
    const value = searchParams[fieldName];
    if (!value) return [];

    // Extract the actual values from formatted strings
    const extractedValues = extractFormattedValues(value);

    // For dataSource fields, we need to match the extracted values with the dropdown options
    // The dropdown options should have the same value format as what we extracted
    return extractedValues;
  };

  // Helper function to get display values for saved search data
  const getDisplayValues = (fieldName, value, options) => {
    if (!value || !options) return [];

    const extractedValues = extractFormattedValues(value);

    // For dataSource fields, try to match with the loaded options
    if (extractedValues.length > 0 && Array.isArray(options)) {
      return extractedValues.map((extractedValue) => {
        // Try to find a matching option
        const found = options.find((option) => {
          // Handle different value formats
          if (option.value === extractedValue) return true;
          if (option.value === `IE=${extractedValue}~`) return true;
          if (
            typeof option.value === "string" &&
            option.value.replace("IE=", "").replace("~", "") === extractedValue
          )
            return true;
          return false;
        });
        return found ? found.value : extractedValue;
      });
    }

    return extractedValues;
  };

  const renderField = (field) => {
    const {
      fieldName,
      label,
      componentType,
      placeholder,
      type,
      options,
      dataSource,
      gridCols,
    } = field;
    const value = searchParams[fieldName] || "";

    // Enhanced field components
    if (componentType === "enhanced-opportunity-name") {
      return (
        <div
          key={fieldName}
          className={gridCols || "col-span-12 sm:col-span-4"}
        >
          <EnhancedOpportunityNameField
            label={label+'test'}
            value={Array.isArray(value) ? value : value ? [value] : []}
            onChange={handleMultiSelectChange(fieldName)}
            placeholder={placeholder}
          />
        </div>
      );
    }

    if (componentType === "enhanced-proposal-opportunity-name") {
      return (
        <div
          key={fieldName}
          className={gridCols || "col-span-12 sm:col-span-4"}
        >
          <ProposalEnhancedOpportunityNameField
            label={label}
            value={Array.isArray(value) ? value : value ? [value] : []}
            onChange={handleMultiSelectChange(fieldName)}
            placeholder={placeholder}
          />
        </div>
      );
    }

    if (componentType === "enhanced-phone") {
      return (
        <div
          key={fieldName}
          className={gridCols || "col-span-12 sm:col-span-4"}
        >
          <EnhancedPhoneField
            label={label}
            value={value}
            onChange={handleFieldChange(fieldName)}
            placeholder={placeholder}
          />
        </div>
      );
    }

    if (componentType === "enhanced-zipcode") {
      return (
        <div
          key={fieldName}
          className={gridCols || "col-span-12 sm:col-span-4"}
        >
          <EnhancedZipCodeField
            label={label}
            value={value}
            onChange={handleFieldChange(fieldName)}
            placeholder={placeholder}
          />
        </div>
      );
    }

    if (componentType === "enhanced-proposal-id") {
      return (
        <div
          key={fieldName}
          className={gridCols || "col-span-12 sm:col-span-4"}
        >
          <EnhancedProposalIdField
            label={label}
            value={Array.isArray(value) ? value : []}
            onChange={handleMultiSelectChange(fieldName)}
            placeholder={placeholder}
          />
        </div>
      );
    }

    if (componentType === "enhanced-proposal-name") {
      return (
        <div
          key={fieldName}
          className={gridCols || "col-span-12 sm:col-span-4"}
        >
          <EnhancedProposalNameField
            label={label}
            value={Array.isArray(value) ? value : []}
            onChange={handleMultiSelectChange(fieldName)}
            placeholder={placeholder}
          />
        </div>
      );
    }

    // Autocomplete field
    if (componentType === "autocomplete") {
      // Determine type and placeholder based on field name
      let autocompleteType = type || "company";
      let autocompletePlaceholder = placeholder;
      
      // Check if field is email-related
      if (fieldName.toLowerCase().includes("email") || fieldName.toLowerCase().includes("contactemail")) {
        autocompleteType = "email";
        autocompletePlaceholder = autocompletePlaceholder || "Type to search emails...";
      } else if (fieldName.toLowerCase().includes("company") || fieldName.toLowerCase().includes("customername")) {
        autocompleteType = "company";
        autocompletePlaceholder = autocompletePlaceholder || "Type to search companies...";
      }
      
      return (
        <div
          key={fieldName}
          className={gridCols || "col-span-12 sm:col-span-4"}
        >
          <AutocompleteSelect
            label={label}
            value={Array.isArray(value) ? value : getAutocompleteValue(value)}
            onChange={(values) =>
              handleSelectFieldChange(fieldName)(values.join(","))
            }
            placeholder={autocompletePlaceholder}
            className="w-full"
            type={autocompleteType}
          />
        </div>
      );
    }

    // MultiSelect dropdown with individual dropdown lazy loading
    if (componentType === "multiselect") {
      let optionsData = options || [];
      const isDataSourceLoading = loadingStates[dataSource] || false;

      if (dataSource && dropdownData[dataSource]) {
        optionsData = dropdownData[dataSource];
      }

      // Handler for when dropdown button is clicked
      const handleDropdownClick = () => {
        if (
          dataSource &&
          !dropdownData[dataSource] &&
          !loadingStates[dataSource]
        ) {
          loadDropdownData(dataSource);
        }
      };

      // Get the appropriate values for display
      let displayValues = getSelectedValues(fieldName);
      if (dataSource && optionsData.length > 0) {
        displayValues = getDisplayValues(
          fieldName,
          searchParams[fieldName],
          optionsData
        );
      }

      return (
        <div
          key={fieldName}
          className={gridCols || "col-span-12 sm:col-span-4"}
        >
          <div onClick={handleDropdownClick}>
            <MultiSelectDropdown
              id={fieldName}
              label={label}
              value={displayValues}
              onChange={handleMultiSelectChange(fieldName)}
              options={optionsData}
              placeholder={
                isDataSourceLoading
                  ? "Loading..."
                  : placeholder || `Select ${label.toLowerCase()}`
              }
              disabled={isDataSourceLoading}
              isLoading={isDataSourceLoading}
            />
          </div>
        </div>
      );
    }

    // SingleSelect dropdown
    if (componentType === "singleselect") {
      let optionsData = options || [];
      const isDataSourceLoading = loadingStates[dataSource] || false;

      if (dataSource && dropdownData[dataSource]) {
        optionsData = dropdownData[dataSource];
      }

      // Handler for when dropdown button is clicked
      const handleDropdownClick = () => {
        if (
          dataSource &&
          !dropdownData[dataSource] &&
          !loadingStates[dataSource]
        ) {
          loadDropdownData(dataSource);
        }
      };

      return (
        <div
          key={fieldName}
          className={gridCols || "col-span-12 sm:col-span-4"}
        >
          <div onClick={handleDropdownClick}>
            <FloatingLabelSelect
              id={fieldName}
              label={label}
              value={value}
              onChange={handleSelectFieldChange(fieldName)}
              options={optionsData}
              placeholder={
                isDataSourceLoading
                  ? "Loading..."
                  : placeholder || `Select ${label.toLowerCase()}`
              }
              disabled={isDataSourceLoading}
            />
          </div>
        </div>
      );
    }

    // Regular textbox
    if (componentType === "textbox") {
      return (
        <div
          key={fieldName}
          className={gridCols || "col-span-12 sm:col-span-4"}
        >
          <FloatingLabelInput
            id={fieldName}
            label={label}
            value={value}
            onChange={handleFieldChange(fieldName)}
            type={type || "text"}
            placeholder={placeholder}
          />
        </div>
      );
    }

    return null;
  };

  const renderSection = (section) => {
    // Group fields into rows of 12 columns
    const rows = [];
    let currentRow = [];
    let currentRowCols = 0;

    section.fields.forEach((field) => {
      const fieldCols = parseInt(
        field.gridCols?.match(/col-span-12 sm:col-span-(\d+)/)?.[1] || "4"
      );

      if (currentRowCols + fieldCols > 12) {
        // Start new row
        if (currentRow.length > 0) {
          rows.push([...currentRow]);
        }
        currentRow = [field];
        currentRowCols = fieldCols;
      } else {
        // Add to current row
        currentRow.push(field);
        currentRowCols += fieldCols;
      }
    });

    // Add the last row
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return (
      <div className="pt-1">
        <div className="space-y-2">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-12 gap-3">
              {row.map(renderField)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative ${
        isSearching ? "pointer-events-none opacity-75" : ""
      }`}
    >
      {isSearching && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
          <div className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Executing search...</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="space-y-2">
        <Accordion
          type="multiple"
          value={openAccordions}
          onValueChange={setOpenAccordions}
          className="space-y-2"
        >
          {config.sections.map((section, index) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border-0 bg-transparent"
            >
              <AccordionTrigger className="px-0 py-3 text-blue-800 hover:no-underline hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center">
                  <div
                    className={`w-1 h-6 ${getSectionColorClass(
                      section.id
                    )} rounded-full mr-3`}
                  ></div>
                  <span className="text-lg font-semibold">{section.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-3">
                {renderSection(section)}
              </AccordionContent>
              
              {/* Horizontal Separator (except for last section) */}
              {index < config.sections.length - 1 && (
                <hr className="border-gray-200 my-3" />
              )}
            </AccordionItem>
          ))}
        </Accordion>

        <button type="submit" className="hidden">
          Submit
        </button>
      </form>
    </div>
  );
};

export default DynamicFormRenderer;
