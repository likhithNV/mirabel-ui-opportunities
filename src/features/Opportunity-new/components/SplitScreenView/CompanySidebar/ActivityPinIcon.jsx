import React from "react";
import { Pin, Loader2 } from "lucide-react";

const ActivityPinIcon = ({
  activity,
  onPinToggle,
  isLoading = false,
  size = "small",
}) => {
  const handleClick = (e) => {
    e.stopPropagation(); // Prevent activity selection
    if (!isLoading && onPinToggle) {
      onPinToggle(
        activity.ID,
        activity.IsPinned,
        activity.ActivityCategory || activity.EventType
      );
    }
  };

  const iconSize = size === "small" ? "h-3 w-3" : "h-4 w-4";

  return (
    <button
      className={`pin-icon inline-flex items-center justify-center rounded-sm transition-all duration-200 p-1 ${
        activity.IsPinned
          ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
      } ${isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      onClick={handleClick}
      disabled={isLoading}
      title={activity.IsPinned ? "Unpin activity" : "Pin activity"}
      aria-label={`${activity.IsPinned ? "Unpin" : "Pin"} this ${(
        activity.EventType || "activity"
      ).toLowerCase()}`}
      aria-pressed={activity.IsPinned}
    >
      {isLoading ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : (
        <Pin
          className={`${iconSize} ${activity.IsPinned ? "fill-current" : ""}`}
          aria-hidden="true"
        />
      )}

      {/* Screen reader only text */}
      <span className="sr-only">
        {activity.IsPinned ? "Currently pinned" : "Not pinned"}
      </span>
    </button>
  );
};

export default ActivityPinIcon;
