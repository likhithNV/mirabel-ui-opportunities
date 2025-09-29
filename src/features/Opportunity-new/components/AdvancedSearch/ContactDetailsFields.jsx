import React from "react";
import FloatingLabelInput from "../EditOpportunity/FloatingLabelInput";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import AutocompleteSelect from "@/components/shared/AutocompleteSelect";
import EnhancedPhoneField from "@/features/Opportunity/components/AdvancedSearch/EnhancedPhoneField";
import { getAutocompleteValue } from "@OpportunityUtils/searchUtils";

const ContactDetailsFields = ({
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

  const handleMultiSelectChange = (field) => (values) => {
    // For multiselect fields, store values as comma-separated string
    const valueString = Array.isArray(values) ? values.join(",") : values;
    handleSelectChange(field, valueString);
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Row 1 - Contact Info - name and email get more space */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <FloatingLabelInput
            id="contact-name"
            label="Contact Name"
            value={searchParams.contactName || ""}
            onChange={handleFieldChange("contactName")}
          />
        </div>
        <div className="col-span-12 sm:col-span-5 space-y-2">
          <AutocompleteSelect
            label="Email"
            type="email"
            value={getAutocompleteValue(searchParams.contactEmail)}
            onChange={(values) =>
              handleSelectFieldChange("contactEmail")(values.join(","))
            }
            placeholder="Type to search emails..."
            className="w-full"
          />
        </div>
        <div className="col-span-12 sm:col-span-3 space-y-2">
          <FloatingLabelInput
            id="contact-title"
            label="Title"
            value={searchParams.contactTitle || ""}
            onChange={handleFieldChange("contactTitle")}
          />
        </div>
      </div>

      {/* Row 2 - Phone and Role - optimized spacing */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <EnhancedPhoneField
            label="Phone"
            value={
              Array.isArray(searchParams.contactPhone)
                ? searchParams.contactPhone
                : searchParams.contactPhone
                ? typeof searchParams.contactPhone === "string" &&
                  searchParams.contactPhone.includes(",")
                  ? searchParams.contactPhone
                      .split(",")
                      .map((v) => v.trim())
                      .filter((v) => v)
                  : [searchParams.contactPhone]
                : []
            }
            onChange={handleMultiSelectChange("contactPhone")}
            placeholder="Type phone number or select option..."
          />
        </div>
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <MultiSelectDropdown
            id="contact-role"
            label="Contact Role"
            value={
              Array.isArray(searchParams.contactRole)
                ? searchParams.contactRole
                : searchParams.contactRole
                ? [searchParams.contactRole]
                : []
            }
            onChange={handleSelectFieldChange("contactRole")}
            options={[
              { value: "decision-maker", label: "Decision Maker" },
              { value: "influencer", label: "Influencer" },
              { value: "user", label: "User" },
              { value: "champion", label: "Champion" },
              { value: "blocker", label: "Blocker" },
            ]}
            placeholder="Select contact role"
          />
        </div>
      </div>
    </div>
  );
};

export default ContactDetailsFields;
