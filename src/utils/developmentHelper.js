// Development helper utilities - matches mirabel.mm.ui pattern

// Development API Configuration - Core credentials for API calls
export const devApiConfig = {
    "baseUrl": "https://tsqb.magazinemanager.com/",
    "domain": "tsqb",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMb2dnZWRJblVzZXJJRCI6IjIxMjciLCJMb2dnZWRJblNpdGVDbGllbnRJRCI6IjEwMjciLCJMb2dnZWRJblNpdGVDdWx0dXJlVUkiOiJlbi1VUyIsIkRhdGVUaW1lIjoiOS8yOS8yMDI1IDY6Mjc6NDYgUE0iLCJMb2dnZWRJblNpdGVDdXJyZW5jeVN5bWJvbCI6IiQiLCJMb2dnZWRJblNpdGVEYXRlRm9ybWF0IjoiIiwiRG9tYWluIjoidHNxYiIsIkxvZ2dlZEluU2l0ZVRpbWVBZGQiOlsiLTEyMCIsIi0xMjAiXSwiU291cmNlIjoiVE1NIiwiRW1haWwiOiJudmxpa2l0aEBtaXJhYmVsdGVjaG5vbG9naWVzLmNvbSIsIklzQVBJVXNlciI6IkZhbHNlIiwiRXh0ZXJuYWxBdXRoIjoiIiwibmJmIjoxNzU5MTcwNDY2LCJleHAiOjE3NTkxNzIyNjYsImlhdCI6MTc1OTE3MDQ2NiwiaXNzIjoiTWFnYXppbmVNYW5hZ2VyIiwiYXVkIjoiKiJ9.bWvmNznN33AixdjKk59ta2bl0zW1mnV2k7yMk1J--bw"
};

// Alternative development config (commented out)
// export const devApiConfig = {
//     "baseUrl": "http://localhost",
//     "domain": "localhost",
//     "token": "eyJhbGciOiJIUzINiIsInR5cCI6IkpXVCJ9.eyJMb2dnZWRJBlVzZXJJRCI6IjEiLCJMb2dnZWRJBlNpdGVDbGllbnRJRCI6Ijk5MjAiLCJMb2dnZWRJBlNpdGVDdWx0dXJlVUkiOiJlbi11cyIsIkRhdGVUaW1lIjoiMzEtMDctMjAyNSAxMTo0OTowNSIsIkxvZ2dlZWRJBlNpdGVDdXJyZW5jeVN5bWJvbCI6IiIsIkxvZ2dlZWRJBlNpdGVEYXRlRm9ybWF0IjoiIiwiRG9tYWluIjoibG9jYWxob3N0IiwiTG9nZ2VkSW5TaXRlVGltZUFkZCI6WyIwIiwiMCJdLCJTb3VyY2UiOiJUTU0iLCJFbWFpbCI6InNhQG1hZ2F6aW5lbWFuYWdlci5jb20iLCJJc0FQSVVzZXIiOiJGYWxzZSIsIm5iZiI6MTc1Mzk2MjU0NSwiZXhwIjoxNzU2OTYyNTQ1LCJpYXQiOjE3NTM5NjI1NDUsImlzcyI6Ik1hZ2F6aW5lTWFuYWdlciIsImF1ZCI6IioifQ.oYMUH3ttGycmsJxUPZkc57kx-DEKbxuaZl4C_ipTPV8"
// };

// Development URL (legacy compatibility)
export const devURL = devApiConfig.baseUrl;

// Promise management for iframe communication
export const promises = {};

// Generate unique request ID
export const getValue = () => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Development session values - references devApiConfig
export const sessionValues = {
    // Core API credentials - referenced from devApiConfig
    "UserID": 1,
    "Email": "sa@magazinemanager.com",
    "Token": devApiConfig.token,
    "Domain": devApiConfig.domain,
    "Host": devApiConfig.baseUrl,

    // Authentication & Session
    "AccessTokenTimeOut": "2025-09-04T01:47:49.87",
    "IsAuthenticated": false,
    "ChangePassword": false,

    // Client & Company Information
    "ClientID": 9920,
    "CompanyName": "Mirabel Development | Test site",
    "CultureUI": "en-us",
    "SiteType": "",
    "TimeAdd": 0,

    // Package & Product Configuration
    "PackageTypeID": 3,
    "ProductType": "10182",
    "PASubProductTypeId": 0,
    "PASubProductTypeName": "",
    "BSASubProductTypeId": 21,
    "BSASubProductTypeName": "Broadstreet",

    // Feature Flags & Permissions
    "IsMKMEnabled": true,
    "IsUserHasMKMAccess": true,
    "IsSiteDataPackEnabled": false,
    "IsUserHasDataPackAccess": false,
    "IsMirabelEmailServiceEnabled": false,
    "IsRepNotificationEnabled": false,
    "CanSendCRMEmail": true,

    // User Profile Information
    "UserName": "sa@magazinemanager.com",
    "EmployeeID": 1,
    "FirstName": "System",
    "LastName": "Administrator",
    "FullName": "System Administrator",
    "DisplayName": "System Administrator",
    "IsAdmin": true,
    "IsSA": true,
    "UserNameID": 1,
    "SalesRepName": "System Administrator",
    "DepartmentID": "1",

    // Content & Version
    "ContentVersion": null
};

// Message handler for iframe communication
export const handleMessage = (event) => {
    try {
        // Only handle messages from the expected origin
        const expectedOrigin = new URL(devURL).origin;
        if (event.origin !== expectedOrigin) {
            return;
        }

        const data = event.data;

        // Handle iframe API responses (like mirabel.mm.ui pattern)
        if (data && data.requestId && promises[data.requestId]) {
            promises[data.requestId](data);
            delete promises[data.requestId];
            return;
        }

        if (data && data.type === 'MM_API_RESPONSE') {
            // Handle different types of responses
            if (data.method === 'login' || data.method === 'auth') {
                // Update session with real authentication data
                if (data.result && data.result.MMClientVars) {
                    localStorage.setItem("MMClientVars", JSON.stringify(data.result.MMClientVars));
                }
            }
        }
    } catch (error) {
        console.error('Development Helper: Error handling message', error);
    }
};

// Check if we're in development mode - Vite specific
export const isDevelopmentMode = () => {
    // Vite provides import.meta.env.DEV for development detection
    const isViteDev = import.meta.env.DEV;
    const isDevMode = import.meta.env.MODE === 'development';
    // For Vite: Use DEV flag or development mode
    const isDev = (isViteDev || isDevMode);

    return isDev;
};

// Initialize development environment
export const initializeDevelopmentEnvironment = () => {
    if (isDevelopmentMode()) {
        // Set session data in localStorage
        localStorage.setItem("MMClientVars", JSON.stringify(sessionValues));
        sessionStorage.setItem("ClientID", sessionValues.ClientID);

        console.log('✅ Development session initialized');
    }
};