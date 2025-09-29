import axiosService from './axiosService.js';
import { getUserInfo } from '../utils/sessionHelpers';
import {
  API_USER_ACCOUNT_GET,
  API_USER_ACCOUNT_UPDATE,
  API_USER_LIST_GET,
  API_USER_CREATE,
  API_USER_UPDATE,
  API_USER_DELETE,
} from '../utils/apiUrls';

/**
 * User Service for handling user-related API calls
 */

// Get current user account information
export const getUserAccount = async () => {
  try {
    const response = await axiosService.get(API_USER_ACCOUNT_GET);
    return response;
  } catch (error) {
    console.error('Error fetching user account:', error);
    throw error;
  }
};

// Update current user account
export const updateUserAccount = async (userData) => {
  try {
    const response = await axiosService.post(API_USER_ACCOUNT_UPDATE, userData);
    return response;
  } catch (error) {
    console.error('Error updating user account:', error);
    throw error;
  }
};

// Get list of users (for admin)
export const getUserList = async (params = {}) => {
  try {
    const response = await axiosService.getWithParams(API_USER_LIST_GET, params);
    return response;
  } catch (error) {
    console.error('Error fetching user list:', error);
    throw error;
  }
};

// Create new user (for admin)
export const createUser = async (userData) => {
  try {
    const response = await axiosService.post(API_USER_CREATE, userData);
    return response;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update user (for admin)
export const updateUser = async (userId, userData) => {
  try {
    const response = await axiosService.post(API_USER_UPDATE, { ...userData, userId });
    return response;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user (for admin)
export const deleteUser = async (userId) => {
  try {
    const response = await axiosService.delete(`${API_USER_DELETE}${userId}`);
    return response;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Get user permissions - Fixed to derive from session data
export const getUserPermissions = async () => {
  try {
    // Get user info from session (similar to ASP.NET SessionManager)
    const userInfo = getUserInfo();
    
    // Derive permissions from user role, similar to ASP.NET logic
    const isAdmin = userInfo?.isAdmin || false;
    const isSA = userInfo?.isSA || false;
    
    // Permission logic matching ASP.NET: IsAdmin || IsSA
    const hasAdminAccess = isAdmin || isSA;
    
    // console.log('User permissions derived:', {
    //   userInfo,
    //   isAdmin,
    //   isSA,
    //   hasAdminAccess
    // });
    
    return {
      canManageUsers: hasAdminAccess,
      canManageNavigation: hasAdminAccess,
      canManageWebsite: hasAdminAccess,
      isAdmin: isAdmin,
      isSA: isSA,
      hasAdminAccess: hasAdminAccess
    };
  } catch (error) {
    console.error('Error deriving user permissions:', error);
    // Return default permissions if session data is unavailable
    return {
      canManageUsers: false,
      canManageNavigation: false,
      canManageWebsite: false,
      isAdmin: false,
      isSA: false,
      hasAdminAccess: false
    };
  }
}; 

export const saveSearch = async (searchData) => {
  try {
    // console.log('Saving search with data:', searchData);
    
    // Wrap the API payload in the expected structure
    const wrappedPayload = {
      OpportunitySearch: searchData.apiPayload || {},
      PageType: 1,
      IsRecentSearch: true
    };
    
    // const payload = {
    //   Name: searchData.name || 'Latest Search',
    //   SearchCriteria: JSON.stringify(wrappedPayload),
    //   Type: searchData.type || 'All Opportunities', // 'All Opportunities' or 'My Opportunities'
    //   UserID: getCurrentUserId(),
    //   IsDefault: false,
    //   ResultType: searchData.resultType || 1, // 1 for Opportunity, 2 for Proposal
    //   ...searchData.additionalFields
    // };
    
    const response = await axiosService.post('/services/SavedSearch/', wrappedPayload);
    
    // console.log('Save search API response:', response);
    
    if (response?.content?.Status === 'Success') {
      // console.log('Search saved successfully with ID:', response.content.ID);
      return {
        success: true,
        searchId: response.content.ID,
        message: 'Search saved successfully'
      };
    } else {
      throw new Error(response?.content?.Message || 'Failed to save search');
    }
    
  } catch (error) {
    // console.error('Failed to save search:', error);
    throw error;
  }
};

export const loadSavedSearch = async (searchId) => {
  try {
    // console.log('Loading saved search with ID:', searchId);
    
    const response = await axiosService.get(`/services/SavedSearch/${searchId}`);
    
    // console.log('Load saved search API response:', response);
    
    if (response?.content?.SearchCriteria) {
      const searchCriteria = JSON.parse(response.content.SearchCriteria);
      
      // Extract the OpportunitySearch from the wrapped payload
      let apiPayload = searchCriteria;
      if (searchCriteria.OpportunitySearch) {
        apiPayload = searchCriteria.OpportunitySearch;
      }
      
      return {
        success: true,
        searchData: {
          name: response.content.Name,
          type: response.content.Type,
          resultType: response.content.ResultType,
          apiPayload: apiPayload,
          createdDate: response.content.CreatedDate
        }
      };
    } else {
      throw new Error('Invalid saved search data');
    }
    
  } catch (error) {
    // console.error('Failed to load saved search:', error);
    throw error;
  }
};

export const getRecentSearchData = async () => {
  try {
    // console.log('Fetching recent search data...');
    
    const response = await axiosService.get('/services/SavedSearch/RecentView/1/Recent Search/-1');
    
    // console.log('Recent search API response:', response);
    
    if (response?.content?.Status === 'Success' && response?.content?.Data) {
      // Parse the Data field which contains the search criteria as JSON string
      const searchData = JSON.parse(response.content.Data);
      
      // console.log('Parsed search data:', searchData);
      
      // Convert the API payload to form field format
      const { convertApiPayloadToFormFields, convertApiResponseToSearchParams } = await import('@/features/Opportunity-new/utils/savedSearchConverter');
      const formFields = convertApiPayloadToFormFields(searchData);
      const searchParams = convertApiResponseToSearchParams(response);
      
      // console.log('Converted form fields:', formFields);
      // console.log('Converted searchParams:', searchParams);
      
      return {
        success: true,
        formFields,
        searchParams,
        rawData: searchData,
        searchId: response.content.Value || null
      };
    } else {
      // console.warn('No recent search data found or invalid response format');
      return {
        success: false,
        formFields: {},
        searchParams: {},
        rawData: null,
        searchId: null
      };
    }
    
  } catch (error) {
    // console.error('Failed to fetch recent search data:', error);
    return {
      success: false,
      formFields: {},
      searchParams: {},
      rawData: null,
      searchId: null,
      error: error.message
    };
  };
};

  export const getProposalRecentSearchData = async () => {
    try {
      // console.log('🚀 Fetching proposal recent search data...');
      // console.log('📡 API Endpoint: /services/SavedSearch/RecentView/1/Recent Search/2');
      
      const response = await axiosService.get('/services/SavedSearch/RecentView/1/Recent Search/2');
      
      // console.log('📥 Raw API response:', response);
      
      if (response?.content?.Status === 'Success' && response?.content?.Data) {
        // console.log('✅ API call successful, parsing data...');
        
        // Parse the Data field which contains the search criteria as JSON string
        const searchData = JSON.parse(response.content.Data);
        
        // console.log('📊 Parsed search data:', searchData);
        
        // Convert the API payload to form field format
        const { convertApiPayloadToFormFields, convertApiResponseToSearchParams } = await import('@/features/Opportunity-new/utils/savedSearchConverter');
        
        // console.log('🔄 Converting API payload to form fields...');
        const formFields = convertApiPayloadToFormFields(searchData);
        // console.log('📋 Converted form fields:', formFields);
        
        // console.log('🔄 Converting to searchParams format...');
        const searchParams = convertApiResponseToSearchParams(response);
        // console.log('📋 Converted searchParams:', searchParams);
        
        const result = {
          success: true,
          formFields,
          searchParams,
          rawData: searchData,
          searchId: response.content.Value || null
        };
        
        // console.log('✅ Final result object:', result);
        return result;
        
      } else {
        // console.warn('⚠️ No proposal recent search data found or invalid response format');
        // console.log('📊 Response content:', response?.content);
        
        const result = {
          success: false,
          formFields: {},
          searchParams: {},
          rawData: null,
          searchId: null
        };
        
        // console.log('❌ Returning empty result:', result);
        return result;
      }
      
    } catch (error) {
      // console.error('❌ Failed to fetch proposal recent search data:', error);
      
      const result = {
        success: false,
        formFields: {},
        searchParams: {},
        rawData: null,
        searchId: null,
        error: error.message
      };
      
      // console.log('❌ Returning error result:', result);
      return result;
    }
  };