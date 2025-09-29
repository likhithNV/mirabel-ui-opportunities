import axiosService from '@/services/axiosService.js';
import { getCurrentUserId } from '@/utils/userUtils';
import {
  ACTIVITY_TYPES,
  ACTIVITY_SOURCE_TYPES,
  API_CONFIG,
  ACTIVITY_CATEGORY_MAPPINGS,
  API_ENDPOINTS
} from '../constants/activityConstants';

// This is correct: axiosService is already the default export from '@/services/axiosService' and is used as an axios instance.
const axiosInstance = axiosService;

class ActivitiesApi {
  // Method for fetching activities
  async getActivities(contactId) {
    const payload = {
      ActivityType: ACTIVITY_TYPES.ALL,
      LimitChars: API_CONFIG.LIMIT_CHARS,
      UserID: getCurrentUserId(), // Use correct user ID from JWT token
      ContactID: contactId,
      IsPrimaryAndSubContacts: false,
      ActivitySourceType: ACTIVITY_SOURCE_TYPES.USER_ONLY,
      IsPinned: false
    };
    return axiosInstance.post(API_ENDPOINTS.ACTIVITIES, payload);
  }

  // Method for fetching calls with ActivityType 2
  async getCallActivities(contactId) {

    const payload = {
      ActivityType: ACTIVITY_TYPES.CALLS,
      LimitChars: API_CONFIG.LIMIT_CHARS,
      UserID: getCurrentUserId(), // Use correct user ID from JWT token
      ContactID: contactId,
      IsPrimaryAndSubContacts: false,
      ActivitySourceType: ACTIVITY_SOURCE_TYPES.USER_ONLY,
      IsPinned: false
    };

    const response = await axiosInstance.post(API_ENDPOINTS.ACTIVITIES, payload);

    return response;
  }

  // Method for fetching meeting activities with ActivityType 3
  async getMeetingActivities(contactId) {
    const payload = {
      ActivityType: ACTIVITY_TYPES.MEETINGS,
      LimitChars: API_CONFIG.LIMIT_CHARS,
      UserID: getCurrentUserId(), // Use correct user ID from JWT token
      ContactID: contactId,
      IsPrimaryAndSubContacts: false,
      ActivitySourceType: ACTIVITY_SOURCE_TYPES.USER_ONLY,
      IsPinned: false
    };

    const response = await axiosInstance.post(API_ENDPOINTS.ACTIVITIES, payload);
    return response;
  }

  // Method for fetching notes-specific activities
  async getNotesActivities(contactId) {
    const payload = {
      ActivityType: ACTIVITY_TYPES.NOTES,
      LimitChars: API_CONFIG.LIMIT_CHARS,
      UserID: getCurrentUserId(), // Use correct user ID from JWT token
      ContactID: contactId,
      IsPrimaryAndSubContacts: false,
      ActivitySourceType: ACTIVITY_SOURCE_TYPES.ALL_INCLUDING_SYSTEM,
      IsPinned: false
    };
    return axiosInstance.post(API_ENDPOINTS.ACTIVITIES, payload);
  }

  // Method for fetching email activities with ActivityType 7
  async getEmailActivities(contactId) {
    const payload = {
      ActivityType: ACTIVITY_TYPES.EMAILS,
      LimitChars: API_CONFIG.LIMIT_CHARS,
      UserID: getCurrentUserId(), // Use correct user ID from JWT token
      ContactID: contactId,
      IsPrimaryAndSubContacts: false,
      ActivitySourceType: ACTIVITY_SOURCE_TYPES.USER_ONLY,
      IsPinned: false
    };

    const response = await axiosInstance.post(API_ENDPOINTS.ACTIVITIES, payload);
    return response;
  }

  // Method for toggling pin status (single endpoint for both pin/unpin)
  async togglePinActivity(activityID, activityCategory = 'Activity') {
    // Use 'Activity' as the default category since that's what the endpoint expects
    const categoryValue = activityCategory === 'Activity' ? 'Activity' : 'Activity';
    const response = await axiosInstance.get(`${API_ENDPOINTS.PIN_ACTIVITY}/${activityID}/${categoryValue}`);

    return response;
  }

  // Method for fetching activity types
  async getActivityTypes() {
    const response = await axiosInstance.get('/services/Activities/GetActivityTypes');
    return response;
  }

  // Legacy methods for backward compatibility
  async pinActivity(activityID, activityCategory) {
    return this.togglePinActivity(activityID, activityCategory);
  }

  async unpinActivity(activityID, activityCategory) {
    return this.togglePinActivity(activityID, activityCategory);
  }
}

export default new ActivitiesApi();
