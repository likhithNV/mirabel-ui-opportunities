import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Info,
  X,
  CheckCircle2,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ListChecks,
  CopyX,
  Expand,
  Shrink,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/shared/components/ui/switch";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAvailableColumns } from "@/features/Opportunity-new/hooks/useAvailableColumns";
import apiService from "@/features/Opportunity-new/Services/apiService";
import { proposalService } from "@/features/Opportunity-new/Services/proposalService.js";
import { getCurrentUserId } from "@/utils/userUtils";
import Loader from "@/shared/components/ui/loader";

// Sortable item component for selected columns
const SortableColumnItem = ({ column, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.ID });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center justify-between p-1.5 bg-blue-50 border border-blue-200 rounded transition-all duration-200 shadow-sm cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 shadow-lg z-50" : "hover:bg-blue-100"
      }`}
      title="Drag to reorder"
    >
      <div className="flex items-center gap-2 flex-1">
        <div className="text-blue-600">
          <GripVertical className="h-3 w-3" />
        </div>
        <span className="text-xs font-medium text-blue-900 flex-1 leading-tight truncate">
          {index + 1}. {column.DisplayName}
        </span>
      </div>
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(column);
        }}
        className="text-blue-600 hover:text-blue-800 flex-shrink-0 transition-colors"
        title="Remove column"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

const AddViewTab = ({
  onViewSaved,
  saveAsViewData,
  editViewData,
  onClearSaveAsData,
  onClearEditData,
  onCloseSidebar,
  pageType = "opportunities",
  showPublicViewOption = false,
}) => {
  const [viewName, setViewName] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [isPublicView, setIsPublicView] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showInstructions, setShowInstructions] = useState(() => {
    const saved = localStorage.getItem("hideViewInstructions");
    return saved !== "true";
  });

  // Search/filter state for columns
  const [columnSearch, setColumnSearch] = useState("");

  // Accordion state for field groups
  const [accordionValue, setAccordionValue] = useState([]);
  const [manualCollapsedGroups, setManualCollapsedGroups] = useState(new Set());
  const expandedRef = useRef([]);
  useEffect(() => {
    expandedRef.current = accordionValue;
  }, [accordionValue]);

  // Drag and drop sensors - must be at top level to avoid conditional hook calls
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Use API for both opportunities and proposals
  const shouldUseApi = true;
  const { availableColumns, columnsByGroup, isLoading, error } =
    useAvailableColumns(shouldUseApi, pageType);

  // Handle drag end for reordering selected columns
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setSelectedColumns((items) => {
        const oldIndex = items.findIndex((item) => item.ID === active.id);
        const newIndex = items.findIndex((item) => item.ID === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Utility to map a list of column names to availableColumns preserving order
  const mapNamesToColumnsPreserveOrder = (names, available) => {
    if (!Array.isArray(names) || names.length === 0) return [];
    const usedIds = new Set();
    const byDbName = new Map();
    const byDisplayNameLower = new Map();
    for (const col of available) {
      if (col?.DBName) byDbName.set(col.DBName, col);
      if (col?.DisplayName)
        byDisplayNameLower.set(String(col.DisplayName).toLowerCase(), col);
    }
    const ordered = [];
    for (const rawName of names) {
      const name = String(rawName).trim();
      if (!name) continue;
      let match = byDbName.get(name);
      if (!match) match = byDisplayNameLower.get(name.toLowerCase());
      if (match && !usedIds.has(match.ID)) {
        usedIds.add(match.ID);
        ordered.push(match);
      }
    }
    return ordered;
  };

  // Handle Save As data population
  useEffect(() => {
    if (saveAsViewData && availableColumns.length > 0) {
      // Set view name with "Copy of" prefix
      setViewName(`Copy of ${saveAsViewData.originalViewName}`);

      // Parse the visible columns and find matching available columns
      if (saveAsViewData.visibleColumns) {
        const columnNames = saveAsViewData.visibleColumns
          .split(",")
          .map((col) => col.trim().replace(/^\[|\]$/g, "")) // Remove brackets
          .filter((col) => col && col !== "");

        // Map to available columns preserving the order from visibleColumns
        const orderedMatches = mapNamesToColumnsPreserveOrder(
          columnNames,
          availableColumns
        );

        setSelectedColumns(orderedMatches);
      }
    }
  }, [saveAsViewData, availableColumns]);

  // Handle Edit data population
  useEffect(() => {
    if (editViewData && availableColumns.length > 0) {
      // Set view name
      setViewName(editViewData.viewName);
      setIsPublicView(editViewData.isPublicView);

      // Parse the visible columns and find matching available columns
      if (editViewData.visibleColumns) {
        const columnNames = editViewData.visibleColumns
          .split(",")
          .map((col) => col.trim().replace(/^\[|\]$/g, "")) // Remove brackets
          .filter((col) => col && col !== "");

        // Map to available columns preserving the order from visibleColumns
        const orderedMatches = mapNamesToColumnsPreserveOrder(
          columnNames,
          availableColumns
        );

        setSelectedColumns(orderedMatches);
      }
    }
  }, [editViewData, availableColumns]);

  // Default: collapse all groups. Auto-expand groups that have a selection
  // or contain matches for the current search term. Preserve manual toggles.
  useEffect(() => {
    if (!columnsByGroup) return;
    const groupNames = Object.keys(columnsByGroup);
    const searchText = (columnSearch || "").trim().toLowerCase();

    const autoExpanded = groupNames.filter((groupName) => {
      if (manualCollapsedGroups.has(groupName)) return false;
      const hasSelectionInGroup = selectedColumns.some(
        (col) => (col.GroupBy || "Standard Fields") === groupName
      );
      const matchesSearch =
        !!searchText &&
        columnsByGroup[groupName]?.some((col) =>
          String(col.DisplayName || "")
            .toLowerCase()
            .includes(searchText)
        );
      return hasSelectionInGroup || matchesSearch;
    });

    const union = new Set([...expandedRef.current, ...autoExpanded]);
    manualCollapsedGroups.forEach((g) => union.delete(g));
    setAccordionValue(Array.from(union));
  }, [columnsByGroup, selectedColumns, columnSearch, manualCollapsedGroups]);

  const handleAccordionChange = (nextValues) => {
    const prevValues = new Set(expandedRef.current);
    const nextSet = new Set(nextValues);
    setManualCollapsedGroups((prev) => {
      const updated = new Set(prev);
      prevValues.forEach((g) => {
        if (!nextSet.has(g)) updated.add(g); // manually collapsed
      });
      nextSet.forEach((g) => {
        if (!prevValues.has(g)) updated.delete(g); // manually expanded
      });
      return updated;
    });
    setAccordionValue(nextValues);
  };

  const handleColumnToggle = (column) => {
    setSelectedColumns((prev) => {
      const isSelected = prev.find((col) => col.ID === column.ID);
      if (isSelected) {
        return prev.filter((col) => col.ID !== column.ID);
      } else {
        return [...prev, column];
      }
    });
  };

  const handleSave = async () => {
    if (viewName.trim() && selectedColumns.length > 0) {
      setIsSaving(true);

      try {
        // COMPREHENSIVE DATA REFRESH FLOW AFTER SAVING VIEW:
        //
        // For PROPOSALS:
        // 1. Save view to database with new column order
        // 2. Call proposalService.getColumnConfig() - refreshes column configuration
        // 3. Call proposalService.searchProposals() - refreshes grid data with new order
        // 4. Call onViewSaved() - refreshes views list in sidebar
        // 5. Close views sidebar
        //
        // For OPPORTUNITIES:
        // 1. Save view to database with new column order
        // 2. Call onViewSaved() - triggers parent Pipeline component to:
        //    a) Refresh views list in sidebar (via useSavedViews hook)
        //    b) Trigger handleViewSelected which calls refetchData() to refresh grid
        // 3. Close views sidebar if needed
        //
        // Result: Both grid data AND view sidebar data are refreshed immediately

        if (pageType === "proposals") {
          // For proposals, make real API call with specified payload structure

          // Build the payload based on selected columns
          const fieldIDs = selectedColumns.map((col) => col.ID).join(",");
          const dbColumnNames =
            "," +
            selectedColumns.map((col) => `[${col.DisplayName}]`).join(",");
          const visibleColumns =
            "," + selectedColumns.map((col) => col.DBName).join(",");

          // Calculate CustomFieldIDs - if fieldId < 0 then -1*FieldId else ""
          const customFieldIDs = selectedColumns
            .filter((col) => col.ID < 0)
            .map((col) => -1 * col.ID)
            .join(",");

          const payload = {
            CustomFieldIDs: customFieldIDs,
            DBColumnsNames: dbColumnNames,
            FieldIDs: fieldIDs,
            IsDefault: true,
            IsStandardView: false,
            NameOfView: viewName.trim(),
            PageType: 1,
            ProductType: 2, // 2 for proposals
            User: { ID: getCurrentUserId() },
            ViewType: isPublicView ? 2 : 0, // 0 if public view checkbox is unchecked
            VisibleColumns: visibleColumns,
          };

          // If editing, add the view ID
          if (editViewData) {
            payload.ID = editViewData.viewId;
          }

          const response = editViewData
            ? await apiService.updateView(payload)
            : await apiService.saveCustomView(payload);

          if (response?.content?.Status === "Success") {
            try {
              // Refresh the proposals data to show the new/updated view with correct column order

              await proposalService.getColumnConfig();
              await proposalService.searchProposals({ CurPage: 1 });
            } catch {
              // Continue with form reset even if API calls fail
            }

            // Reset form state
            setViewName("");
            setSelectedColumns([]);
            setIsPublicView(false);

            // Clear temporary data
            if (onClearSaveAsData) {
              onClearSaveAsData();
            }
            if (onClearEditData) {
              onClearEditData();
            }

            // Notify parent component to refresh views list and apply the new view
            if (onViewSaved) {
              onViewSaved({
                wasEdit: !!editViewData,
                viewId: editViewData?.viewId || null,
                viewName: viewName.trim(),
              });
            }

            // Close Views Sidebar for proposals
            if (onCloseSidebar) {
              onCloseSidebar();
            }

            console.log("Proposal view save process completed");
          } else {
            console.error(
              "Failed to save proposal view:",
              response?.content?.Message
            );
          }
        } else {
          // For opportunities, use the existing logic
          const payload = {
            CustomFieldIDs: selectedColumns
              .filter((col) => col.ID < 0)
              .map((col) => -1 * col.ID)
              .join(","),
            DBColumnsNames:
              "," +
              selectedColumns.map((col) => `[${col.DisplayName}]`).join(","),
            FieldIDs: selectedColumns.map((col) => col.ID).join(","),
            IsDefault: true,
            IsStandardView: false,
            NameOfView: viewName.trim(),
            PageType: 1,
            ProductType: 1, // 1 for opportunities
            User: { ID: getCurrentUserId() },
            ViewType: isPublicView ? 2 : 0,
            VisibleColumns:
              "," + selectedColumns.map((col) => col.DBName).join(","),
          };

          if (editViewData) {
            payload.ID = editViewData.viewId;
          }

          const response = editViewData
            ? await apiService.updateView(payload)
            : await apiService.saveCustomView(payload);

          if (response?.content?.Status === "Success") {
            console.log("Opportunities view saved successfully");

            // Reset form state
            setViewName("");
            setSelectedColumns([]);
            setIsPublicView(false);

            // Clear temporary data
            if (onClearSaveAsData) {
              onClearSaveAsData();
            }
            if (onClearEditData) {
              onClearEditData();
            }

            // Notify parent component to refresh views list and trigger data refresh
            // This will cause the parent Pipeline component to refresh both:
            // 1. The views list in the sidebar (via useSavedViews hook)
            // 2. The main opportunities data (via refetchData when view is applied)
            if (onViewSaved) {
              onViewSaved({
                wasEdit: !!editViewData,
                viewId: editViewData?.viewId || null,
                viewName: viewName.trim(),
              });
            }

            // Close Views Sidebar if needed
            if (onCloseSidebar) {
              onCloseSidebar();
            }
          } else {
            // No-op
          }
        }
      } catch {
        // No-op
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDismissInstructions = (dontShowAgain = false) => {
    setShowInstructions(false);
    if (dontShowAgain) {
      localStorage.setItem("hideViewInstructions", "true");
    }
  };

  const isColumnSelected = (column) => {
    return selectedColumns.find((col) => col.ID === column.ID) !== undefined;
  };

  const handleClearData = () => {
    setViewName("");
    setSelectedColumns([]);
    setIsPublicView(false);
    if (onClearSaveAsData) {
      onClearSaveAsData();
    }
    if (onClearEditData) {
      onClearEditData();
    }
  };

  // Note: Expand/Collapse helpers were removed to satisfy linter since not used

  // Compact UI no longer exposes expand/collapse all

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader text="Loading available columns..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading columns: {error}
      </div>
    );
  }

  const selectedCount = selectedColumns.length;
  const totalCount = availableColumns.length;
  const isEditMode = !!editViewData;

  return (
    <div className="h-[calc(100vh-200px)] overflow-y-auto">
      <ScrollArea className="h-full pr-4">
        <div className="space-y-4 p-4">
          {/* Edit notice intentionally removed */}

          {/* Save As Notice */}
          {saveAsViewData && !editViewData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 relative">
              <button
                onClick={handleClearData}
                className="absolute top-3 right-3 text-green-600 hover:text-green-800 transition-colors"
                title="Clear Save As data"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-3 pr-8">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-green-900">
                    Creating Copy of View
                  </h4>
                  <p className="text-sm text-green-800">
                    Pre-populated with columns from "
                    {saveAsViewData.originalViewName}". You can modify the name
                    and adjust columns as needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Proposal Notice */}
          {pageType === "proposals" && !saveAsViewData && !editViewData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 relative">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900">
                    Proposal View Creation
                  </h4>
                  <p className="text-sm text-blue-800">
                    Create custom views for proposals by selecting from
                    available columns. Views will be saved via API and appear in
                    your saved views list.
                  </p>
                </div>
              </div>
            </div>
          )}

          {showInstructions &&
            !saveAsViewData &&
            !editViewData &&
            pageType === "opportunities" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 relative">
                <button
                  onClick={() => handleDismissInstructions(false)}
                  className="absolute top-3 right-3 text-blue-600 hover:text-blue-800 transition-colors"
                  title="Close instructions"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-start gap-3 pr-8">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-3">
                    <h4 className="font-medium text-blue-900">
                      How to Create a Custom View
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>1. Enter a descriptive name for your view</li>
                      <li>2. Select columns from the categories below</li>
                      <li>
                        3. Browse by category (Standard Fields, Opportunity
                        Stage, etc.)
                      </li>
                      <li>4. Click Save to create your custom view</li>
                      <li>
                        5. Your new view will appear in the "Saved Views"
                        section
                      </li>
                    </ul>

                    <button
                      onClick={() => handleDismissInstructions(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors"
                    >
                      Don't show again
                    </button>
                  </div>
                </div>
              </div>
            )}

          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <h3 className="text-lg font-semibold text-blue-900">
                {isEditMode ? "Edit View" : "Create New View"}
              </h3>
              <div className="mt-4 space-y-3">
                {/* Floating label input */}
                <div className="relative">
                  <Input
                    id="view-name-input"
                    placeholder=" "
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                    className="peer w-full h-11 border-gray-300 focus:border-blue-600 ring-0 focus:ring-0 focus-visible:ring-0 ring-offset-0 focus-visible:ring-offset-0 focus:ring-offset-0 outline-none focus:outline-none placeholder-transparent bg-white shadow-none"
                  />
                  <label
                    htmlFor="view-name-input"
                    className={`pointer-events-none absolute left-3 px-1 bg-white transition-all duration-150 rounded-sm ${
                      viewName && viewName.trim() !== ""
                        ? "-top-1 text-xs text-blue-700"
                        : "top-1/2 -translate-y-1/2 text-gray-500"
                    } peer-focus:-top-1.5 peer-focus:text-xs peer-focus:text-blue-700`}
                  >
                    View Name *
                  </label>
                </div>
                {showPublicViewOption && (
                  <div className="flex items-center gap-3 pt-1">
                    <Switch
                      id="publicViewSwitch"
                      checked={isPublicView}
                      onCheckedChange={setIsPublicView}
                    />
                    <Label
                      htmlFor="publicViewSwitch"
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      Make this a global view (visible to all users)
                    </Label>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={
                !viewName.trim() || selectedColumns.length === 0 || isSaving
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200"
            >
              {isSaving
                ? isEditMode
                  ? "Updating..."
                  : "Saving..."
                : `${isEditMode ? "Update" : "Save"} View (${
                    selectedColumns.length
                  } columns selected)`}
            </Button>
          </div>

          {/* Compact select columns card */}
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">
                    Select Columns ({selectedCount} of {totalCount} columns
                    selected)
                  </h3>
                </div>

                <div className="flex items-center gap-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setSelectedColumns(availableColumns)}
                    title="Select all columns"
                    className="p-1 rounded hover:bg-blue-50"
                  >
                    <ListChecks className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedColumns([])}
                    title="Clear selection"
                    className="p-1 rounded hover:bg-blue-50"
                  >
                    <CopyX className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAccordionValue(Object.keys(columnsByGroup || {}))
                    }
                    title="Expand all groups"
                    className="p-1 rounded hover:bg-blue-50 "
                  >
                    <Expand className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccordionValue([])}
                    title="Collapse all groups"
                    className="p-1 rounded hover:bg-blue-50"
                  >
                    <Shrink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Always-visible Manage Column Order, placed between header and search */}
              <div className="mt-2">
                <Label className="text-xs font-medium text-blue-700">
                  Manage Column Order (drag to reorder)
                </Label>
                <ScrollArea className="h-[250px] border border-gray-200 rounded-md p-2 bg-white mt-1">
                  {selectedColumns.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={selectedColumns.map((col) => col.ID)}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-2 gap-1.5">
                          {selectedColumns.map((column, index) => (
                            <SortableColumnItem
                              key={column.ID}
                              column={column}
                              index={index}
                              onRemove={() =>
                                setSelectedColumns((prev) =>
                                  prev.filter((col) => col.ID !== column.ID)
                                )
                              }
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="relative h-full text-gray-400">
                      <div className="absolute mt-[15%] left-1/2 -translate-x-1/2 text-center">
                        <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">
                          No columns selected
                        </p>
                        <p className="text-xs">
                          Use the list below to add columns
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div className="mt-4 space-y-3">
                <Input
                  type="text"
                  placeholder="Search columns..."
                  value={columnSearch}
                  onChange={(e) => setColumnSearch(e.target.value)}
                  className="w-full h-9 text-sm border-gray-300 focus:border-blue-600 ring-0 focus:ring-0 focus-visible:ring-0 ring-offset-0 focus-visible:ring-offset-0 focus:ring-offset-0 outline-none focus:outline-none bg-white shadow-none"
                />
                {/* Secondary expand/collapse toolbar removed to keep a clean, professional UI. Header toolbar contains these actions. */}
                <Accordion
                  type="multiple"
                  value={accordionValue}
                  onValueChange={handleAccordionChange}
                  className="w-full "
                >
                  {Object.entries(columnsByGroup).map(
                    ([groupName, columns]) => {
                      const filtered = columns.filter((c) =>
                        c.DisplayName.toLowerCase().includes(
                          columnSearch.toLowerCase()
                        )
                      );
                      if (filtered.length === 0) return null;
                      return (
                        <AccordionItem
                          key={groupName}
                          value={groupName}
                          className="border-b border-gray-200"
                        >
                          <AccordionTrigger className="text-sm py-2 font-medium text-blue-900 hover:text-blue-700 transition-colors">
                            {groupName || "Basic"} ({filtered.length})
                          </AccordionTrigger>
                          <AccordionContent className="pt-2">
                            <div className="grid grid-cols-2 gap-1">
                              {filtered.map((column) => (
                                <label
                                  key={column.ID}
                                  className="flex items-center gap-2 text-sm p-1 rounded hover:bg-gray-50 cursor-pointer"
                                  onClick={() => handleColumnToggle(column)}
                                >
                                  <Checkbox
                                    checked={isColumnSelected(column)}
                                    onChange={() => {}}
                                    className="flex-shrink-0 ring-0 focus:ring-0 focus-visible:ring-0 ring-offset-0 focus-visible:ring-offset-0 focus:ring-offset-0 outline-none"
                                  />
                                  <span className="text-gray-800">
                                    {column.DisplayName}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    }
                  )}
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default AddViewTab;
