import React from "react";
import { Button } from "@/shared/components/ui/button";
import { X } from "lucide-react";
import Loader from "@/components/ui/loader";
const EditOpportunity = React.lazy(() => import("@/features/Opportunity-new/components/EditOpportunity/EditOpportunity"));

const EditOpportunityPanel = ({ 
  isOpen, 
  onClose, 
  opportunityId,
  onSaveSuccess 
}) => {
  const isLoading = false;
  const isSaving = false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Edit Opportunity {opportunityId ? `#${opportunityId}` : ''}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-0">
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-64"><Loader /></div>
          }>
            <EditOpportunity overrideId={String(opportunityId || '')} />
          </React.Suspense>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default EditOpportunityPanel;