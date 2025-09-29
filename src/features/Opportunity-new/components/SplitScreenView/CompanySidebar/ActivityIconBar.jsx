import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RotateCcw,
  Users,
  User,
  FileText,
  BookUser,
  Building2,
  Contact,
  Pin,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FILTER_KEYS,
  TABS_WITH_USER_SYSTEM_FILTER,
  DEFAULT_FILTER_STATE,
  FILTER_AVAILABILITY_RULES,
  ACTIVITY_SOURCE_TYPES,
  ACTIVITY_SOURCE_TYPE_USER,
  API_CONFIG,
  TOOLTIP_MESSAGES,
  FILTER_DISPLAY_NAMES,
  STORAGE_KEYS,
  UI_MESSAGES,
} from "../../../constants/activityConstants";

const ActivityIconBar = ({
  refreshTabData,
  loadingStates,
  onFilterChange,
  activeTab,
  filterStates = {},
}) => {
  // State persistence key
  const STORAGE_KEY = STORAGE_KEYS.ACTIVITY_FILTERS;

  // Initialize filter state based on guide specifications
  const getInitialFilters = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedStored = JSON.parse(stored);
        // Merge with prop values, giving priority to props
        return {
          [FILTER_KEYS.CURRENT_USER_ONLY]:
            filterStates[FILTER_KEYS.CURRENT_USER_ONLY] ??
            parsedStored[FILTER_KEYS.CURRENT_USER_ONLY] ??
            DEFAULT_FILTER_STATE[FILTER_KEYS.CURRENT_USER_ONLY],
          [FILTER_KEYS.USER_NOTES_ONLY]:
            filterStates[FILTER_KEYS.USER_NOTES_ONLY] ??
            parsedStored[FILTER_KEYS.USER_NOTES_ONLY] ??
            DEFAULT_FILTER_STATE[FILTER_KEYS.USER_NOTES_ONLY],
          [FILTER_KEYS.COMPANY_WIDE]:
            filterStates[FILTER_KEYS.COMPANY_WIDE] ??
            parsedStored[FILTER_KEYS.COMPANY_WIDE] ??
            DEFAULT_FILTER_STATE[FILTER_KEYS.COMPANY_WIDE],
          [FILTER_KEYS.PINNED_ONLY]:
            filterStates[FILTER_KEYS.PINNED_ONLY] ??
            parsedStored[FILTER_KEYS.PINNED_ONLY] ??
            DEFAULT_FILTER_STATE[FILTER_KEYS.PINNED_ONLY],
        };
      }
    } catch (error) {
      console.warn(UI_MESSAGES.SESSION_STORAGE_LOAD_ERROR, error);
    }

    return {
      ...DEFAULT_FILTER_STATE,
      ...filterStates,
    };
  };

  // Filter states for each toggle
  const [filters, setFilters] = useState(getInitialFilters);

  // Local loading states for individual buttons
  const [buttonLoading, setButtonLoading] = useState({
    refresh: false,
    currentUser: false,
    userNotes: false,
    companyWide: false,
    pinned: false,
    resetAll: false,
  });

  // Debounce timer ref
  const debounceTimerRef = React.useRef(null);

  // Update filters when filterStates prop changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      ...filterStates,
    }));
  }, [filterStates]);

  // Debounced filter change handler
  const debouncedFilterChange = useCallback(
    (filterType, filterValue, allFilters) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (onFilterChange) {
          onFilterChange(filterType, filterValue, allFilters);
        }
      }, API_CONFIG.DEBOUNCE_DELAY);
    },
    [onFilterChange]
  );

  // Filter toggle handler with proper state management
  const handleFilterToggle = (filterType, buttonKey) => {
    const newFilters = { ...filters, [filterType]: !filters[filterType] };
    setFilters(newFilters);

    // Persist to sessionStorage
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newFilters));
    } catch (error) {
      console.warn(UI_MESSAGES.SESSION_STORAGE_SAVE_ERROR, error);
    }

    // Set loading state for this specific button
    setButtonLoading((prev) => ({ ...prev, [buttonKey]: true }));

    // Call debounced filter change
    debouncedFilterChange(filterType, newFilters[filterType], newFilters);

    // Clear loading state after delay
    setTimeout(() => {
      setButtonLoading((prev) => ({ ...prev, [buttonKey]: false }));
    }, API_CONFIG.BUTTON_LOADING_DELAY);
  };

  // Refresh handler maintaining current filter states
  const handleRefresh = () => {
    setButtonLoading((prev) => ({ ...prev, refresh: true }));
    refreshTabData(activeTab);
    setTimeout(() => {
      setButtonLoading((prev) => ({ ...prev, refresh: false }));
    }, API_CONFIG.REFRESH_LOADING_DELAY);
  };

  // Reset all filters handler
  const handleResetAllFilters = () => {
    const resetFilters = {
      [FILTER_KEYS.CURRENT_USER_ONLY]: false,
      [FILTER_KEYS.USER_NOTES_ONLY]: false,
      [FILTER_KEYS.COMPANY_WIDE]: false,
      [FILTER_KEYS.PINNED_ONLY]: false,
    };

    setFilters(resetFilters);

    // Persist to sessionStorage
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(resetFilters));
    } catch (error) {
      console.warn(UI_MESSAGES.SESSION_STORAGE_SAVE_ERROR, error);
    }

    // Set loading state
    setButtonLoading((prev) => ({ ...prev, resetAll: true }));

    // Call debounced filter change with reset filters
    debouncedFilterChange("reset_all", false, resetFilters);

    // Clear loading state after delay
    setTimeout(() => {
      setButtonLoading((prev) => ({ ...prev, resetAll: false }));
    }, API_CONFIG.BUTTON_LOADING_DELAY);
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((filter) => filter === true);
  }, [filters]);

  // Filter availability rules based on guide
  const isUserSystemFilterAvailable = () => {
    return FILTER_AVAILABILITY_RULES.USER_SYSTEM_FILTER_TABS.includes(
      activeTab.toLowerCase()
    );
  };

  // Tooltip content based on guide specifications
  const getTooltipContent = (filterKey, isActive) => {
    const tooltips = {
      [FILTER_KEYS.CURRENT_USER_ONLY]: {
        active: TOOLTIP_MESSAGES.CURRENT_USER_ACTIVE,
        inactive: TOOLTIP_MESSAGES.CURRENT_USER_INACTIVE,
      },
      [FILTER_KEYS.USER_NOTES_ONLY]: {
        active: TOOLTIP_MESSAGES.USER_NOTES_ACTIVE,
        inactive: TOOLTIP_MESSAGES.USER_NOTES_INACTIVE,
      },
      [FILTER_KEYS.COMPANY_WIDE]: {
        active: TOOLTIP_MESSAGES.COMPANY_WIDE_ACTIVE,
        inactive: TOOLTIP_MESSAGES.COMPANY_WIDE_INACTIVE,
      },
      [FILTER_KEYS.PINNED_ONLY]: {
        active: TOOLTIP_MESSAGES.PINNED_ACTIVE,
        inactive: TOOLTIP_MESSAGES.PINNED_INACTIVE,
      },
    };

    return tooltips[filterKey]
      ? tooltips[filterKey][isActive ? "active" : "inactive"]
      : "";
  };

  // Validate filter combinations and provide warnings
  const isEmptyResultExpected = useMemo(() => {
    return (
      filters[FILTER_KEYS.CURRENT_USER_ONLY] &&
      filters[FILTER_KEYS.USER_NOTES_ONLY] &&
      filters[FILTER_KEYS.COMPANY_WIDE] &&
      filters[FILTER_KEYS.PINNED_ONLY]
    );
  }, [filters]);

  // Get active filter names for analytics/debugging
  const getActiveFilterNames = () => {
    const activeFilters = [];
    if (filters[FILTER_KEYS.CURRENT_USER_ONLY])
      activeFilters.push(FILTER_DISPLAY_NAMES.CURRENT_USER);
    if (filters[FILTER_KEYS.USER_NOTES_ONLY] && isUserSystemFilterAvailable())
      activeFilters.push(FILTER_DISPLAY_NAMES.USER_NOTES);
    if (filters[FILTER_KEYS.COMPANY_WIDE])
      activeFilters.push(FILTER_DISPLAY_NAMES.COMPANY_WIDE);
    if (filters[FILTER_KEYS.PINNED_ONLY])
      activeFilters.push(FILTER_DISPLAY_NAMES.PINNED);
    return activeFilters;
  };

  // Track filter usage for analytics (as per guide)
  useEffect(() => {
    const activeFilters = getActiveFilterNames();
    if (activeFilters.length > 0) {
      // Analytics tracking would go here
      console.debug("Active filters:", {
        filters: activeFilters,
        combination: activeFilters.join("+"),
        tab: activeTab,
        timestamp: new Date().toISOString(),
      });
    }
  }, [filters, activeTab]);

  return (
    <div className="flex items-center justify-center px-2">
      {/* Icon Bar - responsive design */}
      <div className="flex items-center gap-2 overflow-x-auto flex-wrap sm:flex-nowrap">
        {/* Icon 0: ALL - Reset All Filters */}
        <button
          className={`flex items-center gap-1 px-2 h-8 border rounded-md transition-all duration-200 shadow-sm ${
            !hasActiveFilters
              ? "border-blue-400 text-blue-700 bg-blue-100 hover:bg-blue-150"
              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
          }`}
          onClick={handleResetAllFilters}
          disabled={buttonLoading.resetAll}
          title="Show all activities (reset filters)"
        >
          {buttonLoading.resetAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <span className="text-xs font-medium">ALL</span>
            </>
          )}
        </button>

        {/* Icon 1: Refresh/Reload Icon 🔄 */}
        <button
          className="flex items-center justify-center h-8 w-8 border border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 rounded-md transition-all duration-200 shadow-sm"
          onClick={handleRefresh}
          disabled={loadingStates[activeTab] || buttonLoading.refresh}
          title={TOOLTIP_MESSAGES.REFRESH}
        >
          {buttonLoading.refresh || loadingStates[activeTab] ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
        </button>

        {/* Icon 2: Current User Filter Toggle 👤 */}
        <button
          className={`flex items-center justify-center h-8 w-8 border rounded-md transition-all duration-200 shadow-sm ${
            filters[FILTER_KEYS.CURRENT_USER_ONLY]
              ? "border-blue-400 text-blue-700 bg-blue-100 hover:bg-blue-150"
              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
          }`}
          onClick={() =>
            handleFilterToggle(FILTER_KEYS.CURRENT_USER_ONLY, "currentUser")
          }
          disabled={buttonLoading.currentUser}
          title={getTooltipContent(
            FILTER_KEYS.CURRENT_USER_ONLY,
            filters[FILTER_KEYS.CURRENT_USER_ONLY]
          )}
        >
          {buttonLoading.currentUser ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : filters[FILTER_KEYS.CURRENT_USER_ONLY] ? (
            <Users className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </button>

        {/* Icon 3: User vs System Notes Filter 📝 */}
        {isUserSystemFilterAvailable() && (
          <button
            className={`flex items-center justify-center h-8 w-8 border rounded-md transition-all duration-200 shadow-sm ${
              filters[FILTER_KEYS.USER_NOTES_ONLY]
                ? "border-orange-400 text-orange-700 bg-orange-100 hover:bg-orange-150"
                : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
            }`}
            onClick={() =>
              handleFilterToggle(FILTER_KEYS.USER_NOTES_ONLY, "userNotes")
            }
            disabled={buttonLoading.userNotes}
            title={getTooltipContent(
              FILTER_KEYS.USER_NOTES_ONLY,
              filters[FILTER_KEYS.USER_NOTES_ONLY]
            )}
          >
            {buttonLoading.userNotes ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : filters[FILTER_KEYS.USER_NOTES_ONLY] ? (
              <FileText className="h-4 w-4" />
            ) : (
              <BookUser className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Icon 4: Contact/Company Scope Toggle 🏢👤 */}
        <button
          className={`flex items-center justify-center h-8 w-8 border rounded-md transition-all duration-200 shadow-sm ${
            filters[FILTER_KEYS.COMPANY_WIDE]
              ? "border-purple-400 text-purple-700 bg-purple-100 hover:bg-purple-150"
              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
          }`}
          onClick={() =>
            handleFilterToggle(FILTER_KEYS.COMPANY_WIDE, "companyWide")
          }
          disabled={buttonLoading.companyWide}
          title={getTooltipContent(
            FILTER_KEYS.COMPANY_WIDE,
            filters[FILTER_KEYS.COMPANY_WIDE]
          )}
        >
          {buttonLoading.companyWide ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : filters[FILTER_KEYS.COMPANY_WIDE] ? (
            <Building2 className="h-4 w-4" />
          ) : (
            <Contact className="h-4 w-4" />
          )}
        </button>

        {/* Icon 5: Pinned Activities Filter 📌 */}
        <button
          className={`flex items-center justify-center h-8 w-8 border rounded-md transition-all duration-200 shadow-sm ${
            filters[FILTER_KEYS.PINNED_ONLY]
              ? "border-red-400 text-red-700 bg-red-100 hover:bg-red-150"
              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
          }`}
          onClick={() => handleFilterToggle(FILTER_KEYS.PINNED_ONLY, "pinned")}
          disabled={buttonLoading.pinned}
          title={getTooltipContent(
            FILTER_KEYS.PINNED_ONLY,
            filters[FILTER_KEYS.PINNED_ONLY]
          )}
        >
          {buttonLoading.pinned ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Pin className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ActivityIconBar;
