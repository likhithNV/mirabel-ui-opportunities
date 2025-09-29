import React, { useState } from "react";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import ViewItem from "./ViewItem";

const SavedViewsTab = ({
  savedViews,
  onLoadView,
  onDeleteView,
  onSaveAsView,
  onEditView,
  activeViewId,
  loggedInUserID,
}) => {
  const [editingId] = useState(null);

  // Add debugging to see what we're receiving
  console.log("SavedViewsTab: Received savedViews:", savedViews);
  console.log("SavedViewsTab: savedViews length:", savedViews?.length || 0);

  // Inline rename removed; edit happens in Edit View flow

  // Ensure savedViews is an array and filter safely
  const validSavedViews = Array.isArray(savedViews) ? savedViews : [];

  // Separate views based on User ID: -1 for Global Views, others for My Views
  const globalViews = validSavedViews.filter((view) => {
    const isGlobal = view?.User?.ID === -1;
    console.log(
      `View "${view?.NameOfView}" (ID: ${view?.ID}) - User ID: ${view?.User?.ID}, isGlobal: ${isGlobal}`
    );
    return isGlobal;
  });

  const myViews = validSavedViews.filter((view) => {
    const isMyView =
      view?.User?.ID !== -1 &&
      view?.User?.ID !== undefined &&
      view?.User?.ID !== null;
    console.log(
      `View "${view?.NameOfView}" (ID: ${view?.ID}) - User ID: ${view?.User?.ID}, isMyView: ${isMyView}`
    );
    return isMyView;
  });

  console.log("SavedViewsTab: Global Views count:", globalViews.length);
  console.log("SavedViewsTab: My Views count:", myViews.length);

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 pr-3">
        {validSavedViews.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
            </div>
            <p className="text-gray-500 text-sm">No saved views found</p>
            <p className="text-gray-400 text-xs mt-1">
              Create your first view using the Add View tab
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Global Views Section */}
            {globalViews.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-3 bg-blue-500 rounded"></div>
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    Global Views
                  </h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                <div className="space-y-1">
                  {globalViews.map((view, index) => (
                    <ViewItem
                      key={view.ID}
                      view={view}
                      index={index}
                      isGlobal={true}
                      canEdit={false}
                      activeViewId={activeViewId}
                      editingId={editingId}
                      onLoadView={onLoadView}
                      onDeleteView={onDeleteView}
                      onSaveAsView={onSaveAsView}
                      onEditView={onEditView}
                      loggedInUserID={loggedInUserID}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* My Views Section */}
            {myViews.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-3 bg-green-500 rounded"></div>
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    My Views
                  </h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                <div className="space-y-1">
                  {myViews.map((view, index) => (
                    <ViewItem
                      key={view.ID}
                      view={view}
                      index={index}
                      isGlobal={false}
                      canEdit={true}
                      activeViewId={activeViewId}
                      editingId={editingId}
                      onLoadView={onLoadView}
                      onDeleteView={onDeleteView}
                      onSaveAsView={onSaveAsView}
                      onEditView={onEditView}
                      loggedInUserID={loggedInUserID}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Show message if no custom views but have valid data */}
            {myViews.length === 0 &&
              globalViews.length === 0 &&
              validSavedViews.length > 0 && (
                <div>
                  <div className="text-center py-6">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    </div>
                    <p className="text-gray-500 text-sm">
                      Views found but could not be categorized
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Please check the console for debugging information
                    </p>
                  </div>
                </div>
              )}

            {/* Show message if no custom views */}
            {myViews.length === 0 && globalViews.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-3 bg-green-500 rounded"></div>
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    My Views
                  </h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                <div className="text-center py-6">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  </div>
                  <p className="text-gray-500 text-sm">
                    No custom views created yet
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Use the Add View tab to create your first custom view
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default SavedViewsTab;
