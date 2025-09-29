import React from "react";
import { X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CompanySidebarHeader = ({
  onClose,
  loadingStates,
  editableCompanyData,
}) => {
  return (
    <div className="p-4 border-b border-gray-200 bg-ocean-gradient">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-white" />
          <h2 className="text-lg font-semibold text-white">
            {editableCompanyData.name || "No company name"}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:text-gray-200 hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {loadingStates.company && (
        <div className="mt-2 text-sm text-white/80">
          Loading company details...
        </div>
      )}
    </div>
  );
};

export default CompanySidebarHeader;
