import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Save, X } from 'lucide-react';
import { OpportunityFormData } from '../../types/opportunity';

interface EditOpportunityHeaderProps {
  opportunityId?: string;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  isAddMode: boolean;
  formData: OpportunityFormData;
  hasValidationErrors: () => boolean;
}

const EditOpportunityHeader: React.FC<EditOpportunityHeaderProps> = ({
  onCancel,
  onSave,
  isSaving,
  isAddMode,
  formData,
  hasValidationErrors
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side - Back button and title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Opportunities
          </Button>
          
          <div className="border-l border-gray-300 pl-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {isAddMode ? 'Add New Opportunity' : `Edit Opportunity`}
            </h1>
            {!isAddMode && formData.name && (
              <p className="text-sm text-gray-500 mt-1">
                {formData.name}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-3">
          {/* Validation status indicator */}
          {hasValidationErrors() && (
            <span className="text-sm text-red-600 font-medium">
              Please fix validation errors
            </span>
          )}
          
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          
          <Button
            onClick={onSave}
            disabled={isSaving || hasValidationErrors()}
          
          >
            <Save className="h-4 w-4 px-1" />
            {isSaving ? 'Saving...' : isAddMode ? 'Create Opportunity' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditOpportunityHeader;