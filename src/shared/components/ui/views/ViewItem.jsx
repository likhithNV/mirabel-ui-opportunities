import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Trash2, Copy, Pencil } from "lucide-react";
import { getColumnCount } from "./utils/viewColorUtils";
import {
  UserId,
  IsAdmin,
} from "@/features/Opportunity-new/constants/opportunityOptions";

const ViewItem = ({
  view,
  // index removed (unused)
  isGlobal,
  canEdit = true,
  editingId,
  onLoadView,
  onDeleteView,
  onSaveAsView,
  onEditView,
  loggedInUserID, // Added loggedInUserID prop
}) => {
  // Debug logging
  console.log("ViewItem Debug:", {
    viewName: view.NameOfView,
    viewType: view.ViewType,
    canEdit,
    isGlobal,
    editingId,
    loggedInUserID,
    isAdmin: IsAdmin,
    createdBy: view.CreatedBy,
    isDefault: view.IsDefault,
    visibleColumns: view.VisibleColumns,
  });

  // Define view type enums to match the reference logic
  const enumColumnViewTypes = {
    DEFAULT_VIEWS: 1,
    PUBLIC_VIEWS: 2,
    CUSTOM_VIEWS: 0,
  };

  // Use view.ViewType directly instead of expecting viewType prop
  const viewType = view.ViewType;

  // Logic for Save As visibility based on reference
  const shouldShowSaveAs =
    (viewType === enumColumnViewTypes.PUBLIC_VIEWS &&
      view.CreatedBy === loggedInUserID) ||
    viewType === enumColumnViewTypes.CUSTOM_VIEWS ||
    viewType === enumColumnViewTypes.DEFAULT_VIEWS;

  // Logic for Edit visibility based on reference - with admin check for PUBLIC_VIEWS
  console.log(
    "shouldShowEdit calculation:",
    viewType,
    enumColumnViewTypes,
    "IsAdmin:",
    IsAdmin
  );
  const shouldShowEdit =
    (viewType === enumColumnViewTypes.PUBLIC_VIEWS && IsAdmin) ||
    viewType === enumColumnViewTypes.CUSTOM_VIEWS;
  console.log("shouldShowEdit:", shouldShowEdit, "viewType:", viewType);

  // Logic for Delete visibility based on reference - with admin check for PUBLIC_VIEWS
  console.log(
    "shouldShowDelete calculation:",
    viewType,
    enumColumnViewTypes,
    "IsAdmin:",
    IsAdmin
  );
  const shouldShowDelete =
    (viewType === enumColumnViewTypes.PUBLIC_VIEWS && IsAdmin) ||
    viewType === enumColumnViewTypes.CUSTOM_VIEWS;

  // Use IsDefault instead of activeViewId for highlighting
  const isActive = view.IsDefault;

  return (
    <div
      key={view.ID}
      className={`group flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded cursor-pointer transition-all duration-200 border ${
        isActive
          ? "bg-blue-50 border-blue-200"
          : "border-transparent hover:border-gray-200"
      }`}
      onClick={() => onLoadView(view)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`text-sm font-medium truncate ${
              isActive ? "text-blue-700" : "text-gray-900"
            }`}
          >
            {view.NameOfView}
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0">
            ({getColumnCount(view.VisibleColumns)})
          </span>
        </div>
      </div>

      {/* Action buttons based on conditional logic */}
      {!editingId && (
        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          {/* Duplicate */}
          {shouldShowSaveAs && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onSaveAsView && onSaveAsView(view);
              }}
              className="h-7 w-7 p-1 rounded-md hover:bg-blue-50"
              title="Duplicate View"
            >
              <Copy className="h-4 w-4 text-blue-600" />
            </Button>
          )}

          {/* Edit */}
          {shouldShowEdit && onEditView && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEditView(view);
              }}
              className="h-7 w-7 p-1 rounded-md hover:bg-orange-50"
              title="Edit View"
            >
              <Pencil className="h-4 w-4 text-orange-500" />
            </Button>
          )}

          {/* Delete */}
          {shouldShowDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteView(view.ID);
              }}
              className="h-7 w-7 p-1 rounded-md hover:bg-red-50"
              title="Delete View"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewItem;
