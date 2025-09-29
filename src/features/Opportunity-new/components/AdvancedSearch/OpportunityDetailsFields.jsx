import React, { useState, useEffect } from "react";
import FloatingLabelInput from "../EditOpportunity/FloatingLabelInput";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import StageSelector from "./StageSelector";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import Loader from "@/components/ui/loader";
import { OPPORTUNITY_OPTIONS } from "@OpportunityConstants/opportunityOptions";
import { userService } from "../../services/userService";
import FloatingLabelSelect from "../EditOpportunity/FloatingLabelSelect";
import { safeStringToArray } from "@OpportunityUtils/searchUtils";

// Helper to normalize probability values for the dropdown (matching Quick Filters logic)
function normalizeProbabilityValues(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((v) => String(v).replace("%", ""));
  }
  if (typeof val === "string") {
    // Split IE format or comma-separated
    return val
      .split(/[~,]/)
      .filter(Boolean)
      .map((v) => v.replace(/^IE=/, "").replace(/~$/, "").replace("%", ""));
  }
  return [String(val).replace("%", "")];
}

// Helper to normalize selected probability values to plain numbers as strings
function normalizeSelectedProbabilities(values) {
  if (!values) return [];
  return values.map((v) => {
    let str = String(v).trim();
    if (str.startsWith("IE=")) str = str.replace("IE=", "");
    return str.replace("%", "").replace(/~$/, "");
  });
}

const OpportunityDetailsFields = ({
  handleInputChange,
  handleSelectChange,
  searchParams = {},
}) => {
  const [stages, setStages] = useState([]);
  const [isLoadingStages, setIsLoadingStages] = useState(true);
  const [assignedReps, setAssignedReps] = useState([]);
  const [isLoadingAssignedReps, setIsLoadingAssignedReps] = useState(true);

  useEffect(() => {
    const fetchStages = async () => {
      try {
        setIsLoadingStages(true);
        const stagesData = await userService.getStages();
        console.log("Stages data received:", stagesData);

        // Ensure we have a valid array with proper structure
        if (Array.isArray(stagesData) && stagesData.length > 0) {
          // Validate that each stage has the required properties and convert to strings
          const validStages = stagesData
            .filter(
              (stage) =>
                stage && typeof stage === "object" && stage.value && stage.label
            )
            .map((stage) => ({
              value: String(stage.value || ""),
              label: String(stage.label || ""),
            }));
          setStages(validStages);
        } else {
          console.warn("Invalid stages data format:", stagesData);
          setStages([]);
        }
      } catch (error) {
        console.error("Failed to fetch stages:", error);
        setStages([]);
      } finally {
        setIsLoadingStages(false);
      }
    };

    const fetchAssignedReps = async () => {
      try {
        setIsLoadingAssignedReps(true);
        const reps = await userService.getOpportunityCreators();
        console.log("Assigned reps data received:", reps);

        // Ensure we have a valid array with proper structure
        if (Array.isArray(reps) && reps.length > 0) {
          // Validate that each rep has the required properties and convert to strings
          const validReps = reps
            .filter(
              (rep) => rep && typeof rep === "object" && rep.value && rep.label
            )
            .map((rep) => ({
              value: String(rep.value || ""),
              label: String(rep.label || ""),
            }));
          setAssignedReps(validReps);
        } else {
          console.warn("Invalid assigned reps data format:", reps);
          setAssignedReps([]);
        }
      } catch (error) {
        console.error("Failed to fetch assigned reps:", error);
        setAssignedReps([]);
      } finally {
        setIsLoadingAssignedReps(false);
      }
    };

    fetchStages();
    fetchAssignedReps();
  }, []);

  const handleFieldChange = (field) => (value) => {
    handleInputChange({ target: { name: field, value } });
  };

  const handleSelectFieldChange = (field) => (value) => {
    handleSelectChange(field, value);
  };

  const handleMultiSelectChange = (field) => (values) => {
    if (field === "probability") {
      handleSelectChange(field, normalizeSelectedProbabilities(values));
    } else {
      handleSelectChange(field, values);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Row 1 - Core Opportunity Fields */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <MultiSelectDropdown
            id="stage"
            label="Stage"
            value={
              Array.isArray(searchParams.stage)
                ? searchParams.stage
                : searchParams.stage
                ? [searchParams.stage]
                : []
            }
            onChange={handleMultiSelectChange("stage")}
            options={stages.length > 0 ? stages : []}
            placeholder={isLoadingStages ? "Loading stages..." : "Select stage"}
            disabled={isLoadingStages || stages.length === 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-4 space-y-2">
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
            options={assignedReps.length > 0 ? assignedReps : []}
            placeholder={
              isLoadingAssignedReps ? "Loading reps..." : "Select rep"
            }
            disabled={isLoadingAssignedReps || assignedReps.length === 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <MultiSelectDropdown
            id="priority"
            label="Priority"
            value={
              Array.isArray(searchParams.priority)
                ? searchParams.priority
                : searchParams.priority
                ? [searchParams.priority]
                : []
            }
            onChange={handleMultiSelectChange("priority")}
            options={OPPORTUNITY_OPTIONS.priority}
            placeholder="Select priority"
          />
        </div>
      </div>

      {/* Row 2 - Dates and Timelines */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <FloatingLabelInput
            id="estimated-close-date"
            label="Est. Close Date"
            type="date"
            value={searchParams.estimatedCloseDate || ""}
            onChange={handleFieldChange("estimatedCloseDate")}
          />
        </div>
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <FloatingLabelInput
            id="actual-close-date"
            label="Actual Close Date"
            type="date"
            value={searchParams.actualCloseDate || ""}
            onChange={handleFieldChange("actualCloseDate")}
          />
        </div>
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <FloatingLabelInput
            id="timeline"
            label="Timeline"
            value={searchParams.timeline || ""}
            onChange={handleFieldChange("timeline")}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <FloatingLabelSelect
            id="status"
            label="Status"
            value={searchParams.status || ""}
            onChange={handleSelectFieldChange("status")}
            options={OPPORTUNITY_OPTIONS.status}
            placeholder="Select status"
          />
        </div>
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <MultiSelectDropdown
            id="confidence-level"
            label="Confidence Level"
            value={
              Array.isArray(searchParams.confidenceLevel)
                ? searchParams.confidenceLevel
                : searchParams.confidenceLevel
                ? [searchParams.confidenceLevel]
                : []
            }
            onChange={handleMultiSelectChange("confidenceLevel")}
            options={OPPORTUNITY_OPTIONS.confidence}
            placeholder="Select level"
          />
        </div>
        <div className="col-span-12 sm:col-span-4 space-y-2">
          <MultiSelectDropdown
            id="probability"
            label="Probability"
            value={normalizeProbabilityValues(
              safeStringToArray(searchParams.probability)
            )}
            onChange={handleMultiSelectChange("probability")}
            options={[
              { value: "All", label: "All Probabilities" },
              ...OPPORTUNITY_OPTIONS.probability,
            ]}
            placeholder="Select probability"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-6 space-y-2">
          <Label htmlFor="tags" className="text-sm font-medium">
            Tags
          </Label>
          <FloatingLabelInput
            id="tags"
            label=""
            value={searchParams.tags || ""}
            onChange={handleFieldChange("tags")}
            placeholder="Enter tags"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Enter description"
            onChange={handleInputChange}
            rows={3}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetailsFields;
