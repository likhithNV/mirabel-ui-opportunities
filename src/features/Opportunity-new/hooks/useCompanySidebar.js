import { useState, useEffect, useRef } from "react";
import apiService from "../services/apiService";
import { getCurrentUserId } from "@/utils/userUtils";
import { toast } from "@/features/Opportunity/hooks/use-toast";
import pinService from "../services/pinService.js";
import {
    ACTIVITY_TYPES,
    ACTIVITY_SOURCE_TYPES,
    ACTIVITY_SOURCE_TYPE_USER,
    API_CONFIG,
    FILTER_KEYS,
    TABS_WITH_USER_SYSTEM_FILTER,
    ERROR_MESSAGES,
    API_ENDPOINTS,
    DEFAULT_FILTER_STATE,
    FILTER_AVAILABILITY_RULES,
    API_STATUS
} from "../constants/activityConstants";


export const useCompanySidebar = (selectedCompany, opportunities, editableCompanyData) => {
    // Remove the duplicate companyData state since we'll use editableCompanyData
    const [tabData, setTabData] = useState({
        all: null,
        notes: null,
        calls: null,
        meetings: null,
        emails: null,
        tasks: null,
    });

    // Track which tabs have been fetched to distinguish between "not fetched" and "empty results"
    const [fetchedTabs, setFetchedTabs] = useState(new Set());
    const [loadingStates, setLoadingStates] = useState({
        global: false,
        all: false,
        notes: false,
        calls: false,
        meetings: false,
        emails: false,
        tasks: false,
    });

    // Add saving states for better UX
    const [savingStates, setSavingStates] = useState({
        notes: false,
        calls: false,
        meetings: false,
    });
    const [errorStates, setErrorStates] = useState({
        global: null,
        all: null,
        notes: null,
        calls: null,
        meetings: null,
        emails: null,
        tasks: null,
    });
    const [activeTab, setActiveTab] = useState("all");

    // Filter states for the activity icon bar - using defaults from guide
    const [filterStates, setFilterStates] = useState(DEFAULT_FILTER_STATE);

    // Add refs to track current requests and prevent race conditions
    const fetchTimeoutRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const currentFetchRef = useRef(null);

    // Form states
    const [callForm, setCallForm] = useState({
        note: "",
        scheduledDate: "",
        scheduledTime: "",
        activityType: "",
        callDisposition: "",
        assignedBy: "",
        assignedTo: "",
        isPrivate: false,
        addToTaskList: false
    });
    const [meetingForm, setMeetingForm] = useState({
        note: "",
        scheduledDate: "",
        scheduledTime: "",
        activityType: "",
        assignedBy: "",
        assignedTo: "",
        isPrivate: false,
        addToTaskList: false,
    });
    const [noteForm, setNoteForm] = useState({
        note: "",
        activityType: "",
        assignedBy: "",
        assignedTo: "",
        isPrivate: false,
        addToTaskList: false
    });

    // Get contact ID from opportunities with enhanced debugging
    const getContactId = () => {


        if (!selectedCompany || !opportunities) {
            return null;
        }

        // Detect if this is proposals data (has ContactDetails.Name)
        const isProposalView = Array.isArray(opportunities) && opportunities.length > 0 && opportunities[0].ContactDetails && opportunities[0].ContactDetails.Name;
        let opportunity;
        if (isProposalView) {
            // For proposals, match by ContactDetails.Name
            opportunity = opportunities.find(
                (opp) => opp.ContactDetails && opp.ContactDetails.Name === selectedCompany
            );
        } else {
            // For opportunities, match by companyName or company
            opportunity = opportunities.find(
                (opp) => opp.companyName === selectedCompany || opp.company === selectedCompany
            );
        }



        if (!opportunity) {

            return null;
        }

        // Check all possible contact ID fields
        const contactId = opportunity?.ContactDetails?.ID ||
            opportunity?.contactId ||
            opportunity?.ContactID ||
            opportunity?.SubContactDetails?.ID;

        return contactId;
    };

    // Set loading state for specific tab
    const setTabLoading = (tab, loading) => {
        setLoadingStates((prev) => ({ ...prev, [tab]: loading }));
    };

    // Set error state for specific tab
    const setTabError = (tab, error) => {
        setErrorStates((prev) => ({ ...prev, [tab]: error }));
    };

    // Comprehensive API payload builder following the guide specifications
    const buildApiPayload = (tabName, contactId, currentFilterStates = filterStates) => {
        // Get ActivityType based on tab name
        const getActivityTypeCode = (tab) => {
            const activityTypeMap = {
                all: ACTIVITY_TYPES.ALL,
                notes: ACTIVITY_TYPES.NOTES,
                calls: ACTIVITY_TYPES.CALLS,
                meetings: ACTIVITY_TYPES.MEETINGS,
                emails: ACTIVITY_TYPES.EMAILS,
                tasks: ACTIVITY_TYPES.TASKS,
            };
            return activityTypeMap[tab.toLowerCase()] || ACTIVITY_TYPES.ALL;
        };

        // Determine ActivitySourceTypeUser based on Current User filter
        const activitySourceTypeUser = currentFilterStates[FILTER_KEYS.CURRENT_USER_ONLY]
            ? ACTIVITY_SOURCE_TYPE_USER.CURRENT_USER_ONLY  // 3 = Current user only
            : ACTIVITY_SOURCE_TYPE_USER.ALL_USERS;         // 2 = All users

        // Determine ActivitySourceType based on User Notes filter and tab availability
        let activitySourceType = ACTIVITY_SOURCE_TYPES.ALL_INCLUDING_SYSTEM; // Default: 2 = All including system

        // Only apply User Notes filter for specific tabs
        if (FILTER_AVAILABILITY_RULES.USER_SYSTEM_FILTER_TABS.includes(tabName.toLowerCase())) {
            activitySourceType = currentFilterStates[FILTER_KEYS.USER_NOTES_ONLY]
                ? ACTIVITY_SOURCE_TYPES.USER_ONLY           // 0 = User notes only
                : ACTIVITY_SOURCE_TYPES.ALL_INCLUDING_SYSTEM; // 2 = All including system
        }

        // Build complete payload according to guide specifications
        const payload = {
            ActivityType: getActivityTypeCode(tabName),
            LimitChars: API_CONFIG.LIMIT_CHARS,
            UserID: getCurrentUserId(),
            ContactID: contactId,
            IsPrimaryAndSubContacts: currentFilterStates[FILTER_KEYS.COMPANY_WIDE], // Company scope
            ActivitySourceType: activitySourceType,                               // User vs System
            ActivitySourceTypeUser: activitySourceTypeUser,                      // Current user vs All users
            IsPinned: currentFilterStates[FILTER_KEYS.PINNED_ONLY]               // Pinned filter
        };

        console.debug("Built API payload:", {
            tab: tabName,
            filters: currentFilterStates,
            payload
        });

        return payload;
    };

    // Validate filter combinations and provide warnings
    const validateFilterCombination = (filterState) => {
        const isEmptyResultExpected = (
            filterState[FILTER_KEYS.CURRENT_USER_ONLY] &&
            filterState[FILTER_KEYS.USER_NOTES_ONLY] &&
            filterState[FILTER_KEYS.COMPANY_WIDE] &&
            filterState[FILTER_KEYS.PINNED_ONLY]
        );

        if (isEmptyResultExpected) {
            console.warn("Very restrictive filter combination may return no results", filterState);
        }

        return isEmptyResultExpected;
    };

    // Check if API call should be made based on filter changes
    const shouldMakeApiCall = (currentState, newState) => {
        const filterKeys = Object.keys(FILTER_KEYS);
        return filterKeys.some(key =>
            currentState[FILTER_KEYS[key]] !== newState[FILTER_KEYS[key]]
        );
    };

    // Remove the fetchCompanyDetails function and related company data logic
    // since we're getting company data from useCompanyData hook

    // Generic function to fetch single tab data using comprehensive payload builder
    const fetchSingleTabData = async (tabName, contactId, currentFilterStates = filterStates) => {
        let response;

        if (tabName === "tasks") {
            // Tasks use a different endpoint and don't support all filters
            response = await apiService.get(`${API_ENDPOINTS.TASKS_DETAILS}/${contactId}`);
        } else {
            // Use comprehensive payload builder for all other tabs
            const payload = buildApiPayload(tabName, contactId, currentFilterStates);
            response = await apiService.post(API_ENDPOINTS.ACTIVITIES, payload);
        }

        // Extract content data from axios response structure
        const contentData = response?.content;

        // Comprehensive error handling based on guide specifications
        if (contentData?.Status === API_STATUS.SUCCESS) {
            let data = [];

            if (tabName === "tasks") {
                // Tasks have a different response structure - data is in List
                data = contentData.List || [];
            } else {
                // Other activities use List
                data = contentData.List || [];
            }

            // Return empty array for null/undefined data - this indicates no results found
            const processedData = Array.isArray(data) ? data : [];

            // Sort activities: pinned first, then by date descending (as per guide)
            return processedData.sort((a, b) => {
                // First priority: pinned status
                const aPinned = a.IsPinned || a.isPinned || false;
                const bPinned = b.IsPinned || b.isPinned || false;

                if (aPinned && !bPinned) return -1; // a comes first (pinned)
                if (!aPinned && bPinned) return 1;  // b comes first (pinned)

                // Second priority: date descending (most recent first)
                const aDate = new Date(a.CreatedOn || a.ActivityDate || a.Date || 0);
                const bDate = new Date(b.CreatedOn || b.ActivityDate || b.Date || 0);

                return bDate.getTime() - aDate.getTime(); // Descending order
            });
        } else {
            // Handle different error types based on guide specifications
            if (contentData?.Status === API_STATUS.SUCCESS && contentData.List === null) {
                return []; // Explicitly return empty array for null results
            } else if (contentData?.Status === API_STATUS.UNAUTHORIZED) {
                throw new Error(ERROR_MESSAGES.AUTHENTICATION_ERROR);
            } else if (contentData?.Status === API_STATUS.FORBIDDEN) {
                throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
            } else if (contentData?.Status === API_STATUS.BAD_REQUEST) {
                throw new Error(ERROR_MESSAGES.VALIDATION_ERROR);
            } else {
                throw new Error(`Failed to fetch ${tabName} data: ${contentData?.Status || ERROR_MESSAGES.GENERIC_ERROR}`);
            }
        }
    };

    // Fetch all tabs data at once with improved error handling
    const fetchAllTabsData = async (retryCount = 0, maxRetries = 2) => {
        const contactId = getContactId();
        if (!contactId) {
            // Wait a bit for data to stabilize before retrying
            if (retryCount < maxRetries) {
                retryTimeoutRef.current = setTimeout(() => {
                    fetchAllTabsData(retryCount + 1, maxRetries);
                }, 1000 * (retryCount + 1));
                return;
            }
            setTabError("global", ERROR_MESSAGES.CONTACT_ID_NOT_FOUND);
            return;
        }

        // Only show loading on first attempt
        if (retryCount === 0) {
            setTabLoading("global", true);
        }
        setTabError("global", null);

        const tabs = ["all", "notes", "calls", "meetings", "emails", "tasks"];

        try {
            // Fetch all tabs concurrently
            const results = await Promise.allSettled(
                tabs.map(tab => fetchSingleTabData(tab, contactId, filterStates))
            );

            const newTabData = { ...tabData };
            const newErrorStates = { ...errorStates };

            results.forEach((result, index) => {
                const tabName = tabs[index];

                if (result.status === "fulfilled") {
                    newTabData[tabName] = result.value;
                    newErrorStates[tabName] = null;
                } else {
                    console.error(`Error fetching ${tabName} data:`, result.reason);
                    newErrorStates[tabName] = result.reason.message;
                }
            });

            setTabData(newTabData);
            setErrorStates(newErrorStates);
        } catch (err) {
            console.error("Error fetching all tabs data:", err);
            setTabError("global", err.message);
        } finally {
            setTabLoading("global", false);
        }
    };

    // Refresh all tabs data
    const refreshAllTabsData = async () => {
        await fetchAllTabsData(0, 2); // Start fresh with retry logic
    };

    // Generic function to fetch single tab data (for individual refreshes)
    const fetchTabData = async (tabName, currentFilterStates = filterStates) => {
        const contactId = getContactId();
        if (!contactId) {
            setTabError(tabName, ERROR_MESSAGES.CONTACT_ID_NOT_FOUND);
            return;
        }

        setTabLoading(tabName, true);
        setTabError(tabName, null);

        try {
            const data = await fetchWithRetry(
                () => fetchSingleTabData(tabName, contactId, currentFilterStates),
                API_CONFIG.MAX_RETRIES,
                API_CONFIG.BASE_RETRY_DELAY
            );

            setTabData((prev) => ({ ...prev, [tabName]: data }));

            // Mark this tab as fetched
            setFetchedTabs(prev => new Set([...prev, tabName]));

        } catch (err) {
            console.error(`Error fetching ${tabName} data after retries:`, err);

            // Provide user-friendly error messages
            let errorMessage = ERROR_MESSAGES.GENERIC_ERROR;
            if (err.message.includes("timeout")) {
                errorMessage = ERROR_MESSAGES.REQUEST_TIMEOUT;
            } else if (err.message.includes("401") || err.message.includes("403")) {
                errorMessage = ERROR_MESSAGES.PERMISSION_DENIED;
            } else if (err.message.includes("404")) {
                errorMessage = ERROR_MESSAGES.NOT_FOUND;
            } else if (err.message.includes("500")) {
                errorMessage = ERROR_MESSAGES.SERVER_ERROR;
            }

            setTabError(tabName, errorMessage);
        } finally {
            setTabLoading(tabName, false);
        }
    };

    // Handle tab change with auto-reset logic as per guide specifications
    const handleTabChange = (newTab) => {
        const oldTab = activeTab;
        setActiveTab(newTab);

        // Auto-reset logic based on guide Rule 2
        const newFilterStates = { ...filterStates };

        // Check if switching FROM Notes/All/Emails TO Calls/Meetings/Tasks
        const previousTabSupportsUserSystem = FILTER_AVAILABILITY_RULES.USER_SYSTEM_FILTER_TABS.includes(oldTab.toLowerCase());
        const newTabSupportsUserSystem = FILTER_AVAILABILITY_RULES.USER_SYSTEM_FILTER_TABS.includes(newTab.toLowerCase());

        if (previousTabSupportsUserSystem && !newTabSupportsUserSystem) {
            // Reset user notes filter to default when switching away from supported tabs
            newFilterStates[FILTER_KEYS.USER_NOTES_ONLY] = DEFAULT_FILTER_STATE[FILTER_KEYS.USER_NOTES_ONLY];
            console.debug("Auto-reset: User Notes filter reset due to tab change", {
                from: oldTab,
                to: newTab,
                resetValue: DEFAULT_FILTER_STATE[FILTER_KEYS.USER_NOTES_ONLY]
            });
        }

        // Update filter states if they changed
        if (JSON.stringify(newFilterStates) !== JSON.stringify(filterStates)) {
            setFilterStates(newFilterStates);
        }

        // Validate filter combination for new tab
        validateFilterCombination(newFilterStates);

        // Check if this specific tab has been fetched before
        const hasBeenFetched = fetchedTabs.has(newTab);
        const tabHasError = errorStates[newTab];
        const tabIsLoading = loadingStates[newTab];

        if (!hasBeenFetched && !tabHasError && !tabIsLoading) {
            console.debug("Fetching data for new tab:", newTab);
            fetchTabData(newTab);
        }
    };

    // Refresh specific tab data
    const refreshTabData = (tabName) => {
        fetchTabData(tabName);
    };

    // Handle filter changes from ActivityIconBar with comprehensive validation
    const handleFilterChange = async (filterType, filterValue, allFilters) => {
        const previousFilterStates = { ...filterStates };

        // Update filter states
        setFilterStates(allFilters);

        // Validate filter combination
        const isEmptyResultExpected = validateFilterCombination(allFilters);

        // Check if API call should be made
        if (!shouldMakeApiCall(previousFilterStates, allFilters)) {
            console.debug("Skipping API call - no filter changes detected", {
                previous: previousFilterStates,
                new: allFilters
            });
            return;
        }

        console.debug("Applying filter change:", {
            filterType,
            filterValue,
            allFilters,
            tab: activeTab,
            isEmptyResultExpected
        });

        try {
            // Refresh the current tab data with new filters
            await fetchTabData(activeTab, allFilters);
        } catch (error) {
            console.error(`Error applying ${filterType} filter:`, error);

            // Provide specific error handling based on error type
            let errorMessage = ERROR_MESSAGES.FILTER_APPLY_ERROR;
            if (error.message.includes("timeout")) {
                errorMessage = ERROR_MESSAGES.REQUEST_TIMEOUT;
            } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
                errorMessage = ERROR_MESSAGES.AUTHENTICATION_ERROR;
            } else if (error.message.includes("403") || error.message.includes("Forbidden")) {
                errorMessage = ERROR_MESSAGES.PERMISSION_DENIED;
            } else if (error.message.includes("network")) {
                errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
            }

            setTabError(activeTab, `${errorMessage}: ${error.message}`);

            // Retry once after a short delay for network errors
            if (error.message.includes("network") || error.message.includes("timeout")) {
                setTimeout(() => {
                    console.debug("Retrying filter application after error");
                    fetchTabData(activeTab, allFilters);
                }, API_CONFIG.RETRY_DELAY);
            }
        }
    };

    // Enhanced error handling with exponential backoff
    const fetchWithRetry = async (fetchFunction, maxRetries = API_CONFIG.MAX_RETRIES, baseDelay = API_CONFIG.BASE_RETRY_DELAY) => {
        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fetchFunction();
            } catch (error) {
                lastError = error;

                if (attempt < maxRetries - 1) {
                    const delay = baseDelay * Math.pow(2, attempt);
                    console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);

                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    };

    // Add call functionality with updated payload structure
    const handleAddCall = async () => {
        const contactId = getContactId();
        if (!contactId) return;

        // Set loading state
        setSavingStates(prev => ({ ...prev, calls: true }));

        try {
            const payload = {
                notificationType: "Calls",
                notificationJson: {
                    Contacts: {
                        ID: contactId,
                        Name: selectedCompany,
                        FirstName: editableCompanyData?.firstName || "",
                        LastName: editableCompanyData?.lastName || ""
                    },
                    CallDisposition: callForm.callDisposition || "",
                    IsPrivate: callForm.isPrivate || false,
                    Note: callForm.note,
                    ActivityType: callForm.activityType || "",
                    ActivityRep: { ID: callForm.assignedBy ? callForm.assignedBy : -1 },
                    MeetingDate: callForm.scheduledDate,
                    MeetingTime: callForm.scheduledTime,
                    IsAddtoTaskList: callForm.addToTaskList || false,
                    RepAssignedTo: {
                        ID: callForm.assignedTo ? callForm.assignedTo : -1
                    },
                    IsAIScheduled: false
                },
                bulkInsertNotificationJson: {}
            };

            await apiService.post("/services/crm/activities/save", payload);

            // Reset form and refresh calls tab
            setCallForm({
                note: "",
                scheduledDate: "",
                scheduledTime: "",
                activityType: "",
                callDisposition: "",
                assignedBy: "",
                assignedTo: "",
                isPrivate: false,
                addToTaskList: false
            });
            refreshTabData("calls");
            refreshTabData("all");
        } catch (err) {
            console.error("Error adding call:", err);
            // You could add toast notification here
        } finally {
            // Always clear loading state
            setSavingStates(prev => ({ ...prev, calls: false }));
        }
    };

    // Add meeting functionality with updated payload structure
    const handleAddMeeting = async () => {
        const contactId = getContactId();
        if (!contactId) return;

        // Set loading state
        setSavingStates(prev => ({ ...prev, meetings: true }));

        try {
            const payload = {
                notificationType: "Meetings",
                notificationJson: {
                    Contacts: {
                        ID: contactId,
                        Name: selectedCompany,
                        FirstName: editableCompanyData?.firstName || "",
                        LastName: editableCompanyData?.lastName || ""
                    },
                    IsPrivate: meetingForm.isPrivate || false,
                    Note: meetingForm.note,
                    ActivityType: meetingForm.activityType || "",
                    ActivityRep: { ID: meetingForm.assignedBy ? meetingForm.assignedBy : -1 },
                    MeetingDate: meetingForm.scheduledDate,
                    MeetingTime: meetingForm.scheduledTime,
                    IsAddtoTaskList: meetingForm.addToTaskList || false,
                    RepAssignedTo: {
                        ID: meetingForm.assignedTo ? meetingForm.assignedTo : -1
                    },
                    IsAIScheduled: false
                },
                bulkInsertNotificationJson: {}
            };

            await apiService.post("/services/crm/activities/save", payload);

            // Reset form and refresh meetings tab
            setMeetingForm({
                note: "",
                scheduledDate: "",
                scheduledTime: "",
                activityType: "",
                assignedBy: "",
                assignedTo: "",
                isPrivate: false,
                addToTaskList: false
            });
            refreshTabData("meetings");
            refreshTabData("all");
        } catch (err) {
            console.error("Error adding meeting:", err);
            // You could add toast notification here
        } finally {
            // Always clear loading state
            setSavingStates(prev => ({ ...prev, meetings: false }));
        }
    };

    // Add note functionality - Updated to use correct API endpoint and payload
    const handleAddNote = async () => {
        const contactId = getContactId();
        if (!contactId) return;

        // Set loading state
        setSavingStates(prev => ({ ...prev, notes: true }));

        try {
            const payload = {
                notificationType: "Notes",
                notificationJson: {
                    Contacts: {
                        ID: contactId,
                        Name: selectedCompany,
                        FirstName: editableCompanyData?.firstName || "",
                        LastName: editableCompanyData?.lastName || ""
                    },
                    IsPrivate: noteForm.isPrivate || false,
                    Note: noteForm.note,
                    ActivityType: noteForm.activityType || "",
                    ActivityRep: { ID: noteForm.assignedBy ? noteForm.assignedBy : -1 },
                    MeetingDate: "",
                    MeetingTime: "",
                    IsAddtoTaskList: noteForm.addToTaskList || false,
                    RepAssignedTo: {
                        ID: noteForm.assignedTo ? noteForm.assignedTo : -1
                    },
                    IsAIScheduled: false
                },
                bulkInsertNotificationJson: {}
            };

            await apiService.post("/services/crm/activities/save", payload);

            // Reset form and refresh notes tab
            setNoteForm({
                note: "",
                activityType: "",
                assignedBy: "",
                assignedTo: "",
                isPrivate: false,
                addToTaskList: false
            });
            refreshTabData("notes");
            refreshTabData("all");
        } catch (err) {
            console.error("Error adding note:", err);
            // You could add toast notification here
        } finally {
            // Always clear loading state
            setSavingStates(prev => ({ ...prev, notes: false }));
        }
    };

    // Initial load with proper cleanup and debouncing
    useEffect(() => {


        // Clear any existing timeouts
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }

        // Abort any ongoing fetch
        if (currentFetchRef.current) {
            currentFetchRef.current.abort();
            currentFetchRef.current = null;
        }

        if (selectedCompany && opportunities && opportunities.length > 0) {
            // Check if the selected company exists in the current opportunities
            const companyExists = opportunities.some(opp =>
                (opp.companyName || opp.company) === selectedCompany ||
                (opp.ContactDetails && opp.ContactDetails.Name === selectedCompany)
            );

            if (!companyExists) {
                return;
            }

            // Reset states
            setTabData({ all: null, notes: null, calls: null, meetings: null, emails: null, tasks: null });
            setFetchedTabs(new Set());
            setErrorStates({
                global: null,
                all: null,
                notes: null,
                calls: null,
                meetings: null,
                emails: null,
                tasks: null,
            });

            // Add a small delay to allow data to stabilize before making requests
            fetchTimeoutRef.current = setTimeout(() => {

                // Only load the default active tab data initially (lazy loading for others)

                fetchTabData(activeTab);
            }, 300); // 300ms delay to allow data to stabilize

        } else if (selectedCompany && (!opportunities || opportunities.length === 0)) {
            // No opportunities available, show appropriate error
            setTabData({ all: null, notes: null, calls: null, meetings: null, emails: null, tasks: null });
            setFetchedTabs(new Set());
        }

        // Cleanup function
        return () => {
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            if (currentFetchRef.current) {
                currentFetchRef.current.abort();
                currentFetchRef.current = null;
            }
        };
    }, [selectedCompany, opportunities]); // eslint-disable-line react-hooks/exhaustive-deps

    // Helper function to check if current state represents "no results found"
    const isEmptyState = (tabName) => {
        const tabHasBeenFetched = fetchedTabs.has(tabName);
        const tabHasData = tabData[tabName] && Array.isArray(tabData[tabName]) && tabData[tabName].length > 0;
        const tabHasError = errorStates[tabName];
        const tabIsLoading = loadingStates[tabName];

        // It's an empty state if:
        // 1. Tab has been fetched successfully
        // 2. No data exists or data array is empty
        // 3. No error occurred
        // 4. Not currently loading
        return tabHasBeenFetched && !tabHasData && !tabHasError && !tabIsLoading;
    };

    // Helper function to get empty state message based on active filters
    const getEmptyStateMessage = (tabName) => {
        const activeFilters = [];

        if (filterStates[FILTER_KEYS.CURRENT_USER_ONLY]) {
            activeFilters.push("your activities only");
        }

        if (filterStates[FILTER_KEYS.USER_NOTES_ONLY] && TABS_WITH_USER_SYSTEM_FILTER.includes(tabName)) {
            activeFilters.push("user notes only");
        }

        if (filterStates[FILTER_KEYS.COMPANY_WIDE]) {
            activeFilters.push("company-wide scope");
        }

        if (filterStates[FILTER_KEYS.PINNED_ONLY]) {
            activeFilters.push("pinned activities only");
        }

        const baseMessage = `No ${tabName === 'all' ? 'activities' : tabName} found`;

        if (activeFilters.length > 0) {
            return `${baseMessage} for: ${activeFilters.join(', ')}`;
        }

        return `${baseMessage} for this contact`;
    };

    // Handle activity updates (for optimistic UI updates from pin operations)
    const handleActivityUpdate = (updatedActivities) => {
        if (!Array.isArray(updatedActivities)) {
            console.warn('handleActivityUpdate: Expected array, received:', typeof updatedActivities);
            return;
        }

        // Sort activities with pinned items at top
        const sortedActivities = pinService.sortActivitiesByPinStatus(updatedActivities);

        // Update the current active tab's data
        setTabData(prev => ({
            ...prev,
            [activeTab]: sortedActivities
        }));

        console.debug('Activity data updated for tab:', activeTab, 'Count:', sortedActivities.length);
    };

    // Show toast notifications
    const showToast = (message, type = 'default') => {
        const toastConfig = {
            title: type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info',
            description: message,
        };

        if (type === 'error') {
            toastConfig.variant = 'destructive';
        }

        toast(toastConfig);
    };

    return {
        tabData,
        loadingStates,
        savingStates,
        errorStates,
        activeTab,
        filterStates,
        callForm,
        setCallForm,
        meetingForm,
        setMeetingForm,
        noteForm,
        setNoteForm,
        handleTabChange,
        refreshTabData,
        refreshAllTabsData,
        handleFilterChange,
        handleAddCall,
        handleAddMeeting,
        handleAddNote,
        isEmptyState,
        getEmptyStateMessage,
        onActivityUpdate: handleActivityUpdate,
        onShowToast: showToast,
    };
};
