import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import SavedViewsTab from "./SavedViewsTab";
import AddViewTab from "./AddViewTab";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { useSavedViews } from "@/features/Opportunity-new/hooks/useSavedViews";
import { UserId } from "@/features/Opportunity-new/constants/opportunityOptions";
import { getCurrentUserId } from "@/utils/userUtils";

import { mapApiColumnsToTableColumns } from "@/features/Opportunity-new/utils/columnMapping";
import apiService from "@/features/Opportunity-new/services/apiService";
import Loader from "@/shared/components/ui/loader";

const ViewsSidebar = ({
  isOpen,
  onClose,
  columnOrder,
  onColumnOrderChange,
  onViewSelected,
  pageType = "opportunities", // Default to opportunities for backward compatibility
  handleRefetch = () => {},
  // setLoading = () => {}
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("saved");
  const [saveAsViewData, setSaveAsViewData] = useState(null);
  const [editViewData, setEditViewData] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewToDelete, setViewToDelete] = useState(null);

  // Make API calls for both opportunities and proposals
  const { savedViews, isLoading, error } = useSavedViews(refreshKey, pageType);

  // Deprecated: saving handled inside AddViewTab
  const handleSaveView = () => {};

  // When switching tabs, cancel edit/save-as if moving to Saved Views
  const handleTabsChange = (value) => {
    setActiveTab(value);
    if (value === "saved") {
      setEditViewData(null);
      setSaveAsViewData(null);
    }
  };

  const handleViewSaved = async (options = {}) => {
    // Add a delay to ensure the API has processed the new view
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Refresh the saved views list and switch back to saved views tab

    setRefreshKey((prev) => prev + 1);

    setActiveTab("saved");
    setSaveAsViewData(null);
    setEditViewData(null);

    // For proposals, also notify the parent component to refresh the grid
    if (pageType === "proposals" && onViewSelected) {
      // Create a dummy view object to trigger grid refresh
      const dummyView = { NameOfView: "View Saved - Refresh Grid" };
      onViewSelected(dummyView);
    }

    // For opportunities: after editing any view, re-apply that view (mirror switch view behavior)
    const wasEdit = !!options?.wasEdit;
    const editedViewId = options?.viewId || editViewData?.viewId;
    if (
      pageType === "opportunities" &&
      wasEdit &&
      editedViewId &&
      onViewSelected
    ) {
      try {
        // Fetch latest view details to get updated VisibleColumns/order
        const detailsResp = await apiService.getViewDetails(editedViewId);
        let updatedView = {
          ID: editedViewId,
          NameOfView: options?.viewName || editViewData?.viewName,
        };
        if (
          detailsResp?.content?.Status === "Success" &&
          Array.isArray(detailsResp?.content?.List) &&
          detailsResp.content.List.length > 0
        ) {
          updatedView = { ...detailsResp.content.List[0] };
        }
        await onViewSelected(updatedView);
      } catch {
        // Fall back to notifying parent with minimal view data
        await onViewSelected({
          ID: editedViewId,
          NameOfView: options?.viewName || editViewData?.viewName,
        });
      }
    }
  };

  const handleLoadView = async (view) => {
    console.log("ViewsSidebar: Loading view:", view?.NameOfView);

    if (!view || !view.ID) {
      console.error("ViewsSidebar: Invalid view provided to handleLoadView");
      return;
    }

    try {
      // Step 1: Get detailed view information including visible columns
      console.log("ViewsSidebar: Fetching view details for ID:", view.ID);
      // setLoading(true);
      let viewDetailsResponse = null;
      try {
        viewDetailsResponse = await apiService.getViewDetails(view.ID);
      } catch (detailsError) {
        console.warn(
          "ViewsSidebar: Failed to get view details, using provided view data:",
          detailsError.message
        );
      } finally {
        // setLoading(false);
      }

      let visibleColumns = view.VisibleColumns;

      // Check if we got detailed view data with visible columns
      if (
        viewDetailsResponse?.content?.Status === "Success" &&
        viewDetailsResponse?.content?.List?.length > 0
      ) {
        const viewDetails = viewDetailsResponse.content.List[0];
        visibleColumns = viewDetails.VisibleColumns || view.VisibleColumns;
        console.log(
          "ViewsSidebar: Updated visible columns from view details:",
          visibleColumns
        );
      } else {
        console.log(
          "ViewsSidebar: Using visible columns from original view:",
          visibleColumns
        );
      }

      // Step 2: Create the correct payload based on pageType
      let updatePayload;

      if (pageType === "proposals") {
        // Use the specific payload structure for proposals
        updatePayload = {
          NameOfView: view.NameOfView,
          IsDefault: true,
          VisibleColumns: visibleColumns,
          DBColumnsNames: "",
          User: {
            ID: getCurrentUserId(), // Use userId from userUtils
          },
          ID: view.ID,
          PageType: 1, // Always 1 for both opportunities and proposals
          ViewType: view.ViewType,
          productType: 2, // 2 for proposals
        };
      } else {
        // Keep the existing payload structure for opportunities
        updatePayload = {
          NameOfView: view.NameOfView,
          IsDefault: true,
          VisibleColumns: visibleColumns,
          DBColumnsNames: view.DBColumnsNames || "",
          User: { ID: view.User?.ID > 0 ? view.User?.ID : UserId },
          ID: view.ID,
          PageType: view.PageType || 1,
          ViewType: view.ViewType || 0,
          productType: 1, // 1 for opportunities
        };
      }

      console.log("ViewsSidebar: Updating view with payload:", updatePayload);

      try {
        // setLoading(true);
        await apiService.updateView(updatePayload);
        console.log("ViewsSidebar: View updated successfully");
      } catch (updateError) {
        console.error("ViewsSidebar: Failed to update view:", updateError);
        // Continue with the operation even if update fails
      } finally {
        // setLoading(false);
      }

      // Also save this as the user's default view preference (as per documentation)
      try {
        const userPageViewPayload = {
          DefaultViewID: view.ID,
          PageName: pageType === "proposals" ? 2 : 1, // 1 for opportunities, 2 for proposals
        };
        console.log(
          "ViewsSidebar: Saving user page view preference:",
          userPageViewPayload
        );

        // setLoading(true);
        await apiService.saveUserPageView(userPageViewPayload);
        console.log(
          "ViewsSidebar: User page view preference saved successfully"
        );
      } catch (error) {
        console.warn(
          "ViewsSidebar: Failed to save user page view preference:",
          error.message
        );
        // Don't fail the entire operation if this fails
      } finally {
        // setLoading(false);
      }

      // Step 3: For opportunities, skip manual column updates - let API column config handle it
      if (pageType === "opportunities") {
        //refetch
        //setrefetch
        handleRefetch();
        console.log(
          "ViewsSidebar: For opportunities, relying on API column config instead of manual column updates"
        );
        // Skip manual column order changes - the useApiData hook will fetch
        // the correct column configuration for this view via the /services/AdvSearches/ResultViewColumn API
      } else {
        // For proposals, keep the existing column mapping logic
        const filteredColumns = mapApiColumnsToTableColumns(visibleColumns);

        // Validate that we got columns
        if (filteredColumns.length === 0) {
          console.error(
            "Step 3: ERROR - No columns were mapped from visible columns:",
            visibleColumns
          );
          console.error(
            "Step 3: This should not happen - check the mapping logic"
          );
        }

        // Step 4: Update the column order in the table for proposals
        if (onColumnOrderChange) {
          onColumnOrderChange(filteredColumns);
        }
        handleRefetch();
      }

      // Step 5: Create view object with updated visible columns for parent component
      const updatedView = {
        ...view,
        VisibleColumns: visibleColumns,
        IsDefault: true,
      };

      // Step 6: Notify parent component that a view was selected so it can refetch data
      if (onViewSelected) {
        console.log(
          "ViewsSidebar: Notifying parent component of view selection:",
          updatedView.NameOfView
        );
        try {
          await onViewSelected(updatedView);
          console.log("ViewsSidebar: Parent component notified successfully");
        } catch (parentError) {
          console.error(
            "ViewsSidebar: Error notifying parent component:",
            parentError
          );
          // Don't throw the error, just log it
        }
      } else {
        console.warn("ViewsSidebar: No onViewSelected callback provided");
      }

      // Step 7: Refresh the views list to show updated IsDefault status

      setRefreshKey((prev) => prev + 1);

      // Step 8: Close the sidebar

      onClose();
    } catch (error) {
      console.error("Failed to load view:", error);
    }
  };

  const handleDeleteView = (viewId) => {
    // Show confirmation dialog for both opportunities and proposals
    const view = savedViews.find((v) => v.ID === viewId);

    if (view) {
      setViewToDelete(view);
      setDeleteDialogOpen(true);
    } else {
      console.error("View not found in savedViews array for ID:", viewId);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!viewToDelete) {
      console.error("No view to delete - viewToDelete is null/undefined");
      return;
    }

    try {
      if (pageType === "proposals") {
        await apiService.deleteProposalView(viewToDelete.ID);
      } else {
        // For opportunities, call the delete API
        await apiService.deleteOpportunityView(viewToDelete.ID);
      }

      // Refresh the views list after successful deletion for both page types

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to delete view:", error);
      console.error("Error details:", error.message, error.stack);
    } finally {
      // Close dialog and reset state

      setDeleteDialogOpen(false);
      setViewToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setViewToDelete(null);
  };

  // Inline name update removed

  const handleSaveAsView = (view) => {
    // Set the view data for the Add View tab
    setSaveAsViewData({
      originalViewName: view.NameOfView,
      visibleColumns: view.VisibleColumns,
    });

    // Clear edit data if any
    setEditViewData(null);

    // Switch to Add View tab
    setActiveTab("add");
  };

  const handleEditView = (view) => {
    // Set the view data for editing
    setEditViewData({
      viewId: view.ID,
      viewName: view.NameOfView,
      visibleColumns: view.VisibleColumns,
      isPublicView: view.ViewType === 2, // PUBLIC_VIEWS = 2
    });

    // Clear save as data if any
    setSaveAsViewData(null);

    // Switch to Add View tab (which will show as Edit View)
    setActiveTab("add");
  };

  const handleClearEditData = () => {
    setEditViewData(null);
    setSaveAsViewData(null);
  };

  const getTabTitle = () => {
    if (editViewData) return "EDIT VIEW";
    return "ADD VIEW";
  };

  // Show loading for both page types
  if (isLoading) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-1/2 min-w-[600px] max-w-[900px] z-50 bg-white"
        >
          <SheetHeader className="border-b border-gray-100 pb-3">
            <SheetTitle className="text-lg font-semibold text-blue-600">
              Views
            </SheetTitle>
          </SheetHeader>
          <div className="flex justify-center items-center h-64">
            <Loader text="Loading saved views..." />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Show error for both page types
  if (error) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-1/2 min-w-[600px] max-w-[900px] z-50 bg-white"
        >
          <SheetHeader className="border-b border-gray-100 pb-3">
            <SheetTitle className="text-lg font-semibold text-blue-600">
              Views
            </SheetTitle>
          </SheetHeader>
          <div className="flex justify-center items-center h-64 text-red-500">
            Error loading views: {error}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40"
          style={{ backdropFilter: "blur(1px)" }}
        />
      )}

      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-1/2 min-w-[600px] max-w-[900px] z-50 bg-white shadow-2xl border-l border-gray-200"
        >
          <SheetHeader className="border-b border-gray-100 pb-3 mb-4">
            <SheetTitle className="text-lg font-semibold text-blue-600 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Views - {pageType === "proposals" ? "Proposals" : "Opportunities"}
            </SheetTitle>
          </SheetHeader>

          <div className="h-[calc(100vh-113px)] overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={handleTabsChange}
              className="w-full h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 bg-[#EAF3FF] rounded-xl p-1 mb-4">
                <TabsTrigger
                  value="saved"
                  className="font-medium py-2 rounded-lg transition-colors data-[state=active]:bg-[linear-gradient(180deg,#0C4A6E,#36A3FF)] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=inactive]:text-slate-600 data-[state=inactive]:bg-transparent"
                >
                  Saved Views
                </TabsTrigger>
                <TabsTrigger
                  value="add"
                  className="font-medium py-2 rounded-lg transition-colors data-[state=active]:bg-[linear-gradient(180deg,#0C4A6E,#36A3FF)] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=inactive]:text-slate-600 data-[state=inactive]:bg-transparent"
                >
                  {getTabTitle()}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent
                  value="saved"
                  className="h-full mt-0 overflow-hidden"
                >
                  <SavedViewsTab
                    savedViews={savedViews}
                    onLoadView={handleLoadView}
                    onDeleteView={handleDeleteView}
                    onSaveAsView={handleSaveAsView}
                    onEditView={handleEditView}
                    loggedInUserID={getCurrentUserId()}
                  />
                </TabsContent>

                <TabsContent
                  value="add"
                  className="h-full mt-0 overflow-hidden"
                >
                  <AddViewTab
                    columnOrder={columnOrder}
                    onSaveView={handleSaveView}
                    onViewSaved={handleViewSaved}
                    saveAsViewData={saveAsViewData}
                    editViewData={editViewData}
                    onClearSaveAsData={() => setSaveAsViewData(null)}
                    onClearEditData={handleClearEditData}
                    onCloseSidebar={onClose}
                    pageType={pageType}
                    showPublicViewOption={true}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog - For both opportunities and proposals */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        viewName={viewToDelete?.NameOfView || ""}
      />
    </>
  );
};

export default ViewsSidebar;
