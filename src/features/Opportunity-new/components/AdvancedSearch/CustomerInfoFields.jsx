import React from "react";
import FloatingLabelInput from "@/shared/components/ui/FloatingLabelInput";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import { OPPORTUNITY_OPTIONS } from "@OpportunityConstants/opportunityOptions";
import AutocompleteSelect from "@/components/shared/AutocompleteSelect";
import { getAutocompleteValue } from "@OpportunityUtils/searchUtils";

const CustomerInfoFields = ({
  handleInputChange,
  handleSelectChange,
  searchParams = {},
}) => {
  const handleFieldChange = (field) => (value) => {
    handleInputChange({ target: { name: field, value } });
  };

  const handleSelectFieldChange = (field) => (value) => {
    handleSelectChange(field, value);
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Row 1 - Company Details - company name gets more space */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-5 space-y-2">
          <AutocompleteSelect
            label="Company Name"
            value={
              Array.isArray(searchParams.companyName)
                ? searchParams.companyName
                : getAutocompleteValue(searchParams.companyName)
            }
            onChange={(values) =>
              handleSelectFieldChange("companyName")(values.join(","))
            }
            placeholder="Type to search companies..."
            className="w-full"
          />
        </div>
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <MultiSelectDropdown
            id="industry"
            label="Industry"
            value={
              Array.isArray(searchParams.industry)
                ? searchParams.industry
                : searchParams.industry
                ? [searchParams.industry]
                : []
            }
            onChange={handleSelectFieldChange("industry")}
            options={[
              "Technology",
              "Software",
              "Healthcare",
              "Finance",
              "Banking",
              "Insurance",
              "Manufacturing",
              "Automotive",
              "Retail",
              "E-commerce",
              "Education",
              "Government",
              "Non-profit",
              "Real Estate",
              "Construction",
              "Energy",
              "Utilities",
              "Telecommunications",
              "Media",
              "Entertainment",
              "Transportation",
              "Logistics",
              "Agriculture",
              "Hospitality",
              "Food & Beverage",
              "Pharmaceutical",
              "Biotechnology",
              "Legal Services",
              "Consulting",
              "Other",
            ].map((opt) => ({ value: opt, label: opt }))}
            placeholder="Select industry"
          />
        </div>
        <div className="col-span-12 sm:col-span-3 space-y-2">
          <FloatingLabelInput
            id="customer-id"
            label="Customer ID"
            value={searchParams.customerId || ""}
            onChange={handleFieldChange("customerId")}
          />
        </div>
      </div>

      {/* Row 2 - Company Size and Personnel - optimized for different field types */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-3 space-y-2">
          <MultiSelectDropdown
            id="company-size"
            label="Company Size"
            value={
              Array.isArray(searchParams.companySize)
                ? searchParams.companySize
                : searchParams.companySize
                ? [searchParams.companySize]
                : []
            }
            onChange={handleSelectFieldChange("companySize")}
            options={OPPORTUNITY_OPTIONS.companySize}
            placeholder="Select size"
          />
        </div>
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <FloatingLabelInput
            id="account-manager"
            label="Account Manager"
            value={searchParams.accountManager || ""}
            onChange={handleFieldChange("accountManager")}
          />
        </div>
        <div className="col-span-12 sm:col-span-2 space-y-2">
          <FloatingLabelInput
            id="customer-since"
            label="Customer Since"
            type="date"
            value={searchParams.customerSince || ""}
            onChange={handleFieldChange("customerSince")}
          />
        </div>
        <div className="col-span-12 sm:col-span-3 space-y-2">
          <MultiSelectDropdown
            id="timeframe"
            label="Timeframe"
            value={
              Array.isArray(searchParams.timeframe)
                ? searchParams.timeframe
                : searchParams.timeframe
                ? [searchParams.timeframe]
                : []
            }
            onChange={handleSelectFieldChange("timeframe")}
            options={OPPORTUNITY_OPTIONS.timeframe}
            placeholder="Select timeframe"
          />
        </div>
      </div>

      {/* Row 3 - Decision Maker and Solution - better spacing for text vs dropdown */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <FloatingLabelInput
            id="decision-maker"
            label="Decision Maker"
            value={searchParams.decisionMaker || ""}
            onChange={handleFieldChange("decisionMaker")}
          />
        </div>
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <MultiSelectDropdown
            id="current-solution"
            label="Current Solution"
            value={
              Array.isArray(searchParams.currentSolution)
                ? searchParams.currentSolution
                : searchParams.currentSolution
                ? [searchParams.currentSolution]
                : []
            }
            onChange={handleSelectFieldChange("currentSolution")}
            options={OPPORTUNITY_OPTIONS.solution}
            placeholder="Select solution"
          />
        </div>
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <FloatingLabelInput
            id="budget"
            label="Budget"
            type="number"
            value={searchParams.budget || ""}
            onChange={handleFieldChange("budget")}
          />
        </div>
      </div>

      {/* Row 4 - Budget Range - compact for number inputs */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-3 space-y-2">
          <FloatingLabelInput
            id="budget-min"
            label="Budget (Min)"
            type="number"
            value={searchParams.budgetMin || ""}
            onChange={handleFieldChange("budgetMin")}
          />
        </div>
        <div className="col-span-12 sm:col-span-3 space-y-2">
          <FloatingLabelInput
            id="budget-max"
            label="Budget (Max)"
            type="number"
            value={searchParams.budgetMax || ""}
            onChange={handleFieldChange("budgetMax")}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoFields;
