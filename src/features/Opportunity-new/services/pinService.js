import activitiesApi from './activitiesApi';
import { API_CONFIG } from '../constants/activityConstants';

class PinService {
  constructor() {
    // Pin state cache to reduce API calls
    this.pinStateCache = new Map();
    this.pendingRequests = new Map();
  }

  // Toggle pin status with optimistic updates and error recovery
  async togglePinStatus(activityId, currentPinState, activityCategory) {
    try {
      // Check if there's already a pending request for this activity
      if (this.pendingRequests.has(activityId)) {
        console.warn('Pin request already pending for activity:', activityId);
        return {
          success: false,
          error: 'Request already in progress',
          originalState: currentPinState
        };
      }

      // Mark request as pending
      this.pendingRequests.set(activityId, true);

      console.log('PinService: Toggling pin status for activity:', {
        activityId,
        currentPinState,
        activityCategory,
        newState: !currentPinState
      });

      // Use the toggle endpoint (GET request that toggles the current state)
      const response = await activitiesApi.togglePinActivity(activityId, 'Activity');

      // Check response structure - be flexible with different response formats
      const responseData = response?.data;
      console.log('PinService: API Response:', {
        status: response?.status,
        responseData: responseData,
        activityId,
        currentPinState
      });

      const isSuccess = response?.status === 200 ||
        responseData?.content?.Status === "Success" ||
        responseData?.Status === "Success" ||
        responseData?.success === true;

      if (isSuccess) {
        // Try to get the new pin state from response, otherwise assume toggle
        const newPinState = responseData?.content?.Data?.IsPinned !== undefined
          ? responseData.content.Data.IsPinned
          : responseData?.Data?.IsPinned !== undefined
            ? responseData.Data.IsPinned
            : responseData?.IsPinned !== undefined
              ? responseData.IsPinned
              : !currentPinState; // Fallback to toggle assumption

        // Update cache
        this.setCachedPinState(activityId, newPinState);

        console.log('PinService: Pin toggle successful:', {
          activityId,
          currentPinState,
          newPinState,
          response: responseData
        });

        return {
          success: true,
          newPinState: newPinState,
          message: responseData?.content?.Message ||
            responseData?.Message ||
            `Activity ${newPinState ? 'pinned' : 'unpinned'} successfully`,
          data: responseData?.content?.Data || responseData?.Data
        };
      } else {
        throw new Error(
          responseData?.content?.Message ||
          responseData?.Message ||
          responseData?.error ||
          'Failed to update pin status'
        );
      }
    } catch (error) {
      console.error('PinService: Pin toggle error:', {
        activityId,
        currentPinState,
        activityCategory,
        error: error.message,
        response: error.response?.data
      });

      // Determine error type for better user experience
      let errorMessage = 'Failed to update pin status';
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Permission denied. You cannot pin this activity.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Activity not found or no longer exists.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        originalState: currentPinState,
        statusCode: error.response?.status
      };
    } finally {
      // Clear pending request
      this.pendingRequests.delete(activityId);
    }
  }

  // Batch update pin states for multiple activities
  async batchUpdatePins(activityUpdates) {
    const results = [];
    const batchSize = 5; // Process in small batches to avoid overwhelming the server

    console.log('PinService: Starting batch pin update for', activityUpdates.length, 'activities');

    for (let i = 0; i < activityUpdates.length; i += batchSize) {
      const batch = activityUpdates.slice(i, i + batchSize);

      const batchPromises = batch.map(update =>
        this.togglePinStatus(update.activityId, update.currentState, update.activityCategory)
          .then(result => ({
            activityId: update.activityId,
            ...result
          }))
          .catch(error => ({
            activityId: update.activityId,
            success: false,
            error: error.message
          }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to be gentle on the server
      if (i + batchSize < activityUpdates.length) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY / 2));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    console.log('PinService: Batch update completed:', {
      total: results.length,
      successful,
      failed
    });

    return {
      success: failed === 0,
      results,
      summary: {
        total: results.length,
        successful,
        failed
      }
    };
  }

  // Cache management methods
  getCachedPinState(activityId) {
    const cached = this.pinStateCache.get(activityId);
    if (cached && this.isCacheValid(activityId)) {
      return cached.state;
    }
    return null;
  }

  setCachedPinState(activityId, pinState) {
    this.pinStateCache.set(activityId, {
      state: pinState,
      timestamp: Date.now()
    });
  }

  isCacheValid(activityId, maxAge = 300000) { // 5 minutes default
    const cached = this.pinStateCache.get(activityId);
    return cached && (Date.now() - cached.timestamp) < maxAge;
  }

  clearCache() {
    this.pinStateCache.clear();
    console.log('PinService: Cache cleared');
  }

  // Utility method to sort activities with pinned items at top
  sortActivitiesByPinStatus(activities) {
    if (!Array.isArray(activities)) {
      return activities;
    }

    return [...activities].sort((a, b) => {
      // First sort by pin status (pinned items first)
      if (a.IsPinned !== b.IsPinned) {
        return b.IsPinned ? 1 : -1;
      }

      // Then sort by date (newest first)
      const dateA = new Date(a.DateScheduled || a.Date || a.DueDate);
      const dateB = new Date(b.DateScheduled || b.Date || b.DueDate);
      return dateB - dateA;
    });
  }

  // Analytics tracking method
  trackPinAction(action, activityId, activityType, userId = null, contactId = null) {
    try {
      // This would integrate with your analytics service
      const trackingData = {
        event: 'activity_pin_action',
        action: action, // 'pin' or 'unpin'
        activityId: activityId,
        activityType: activityType,
        timestamp: new Date().toISOString(),
        userId: userId,
        contactId: contactId
      };

      console.log('PinService: Tracking pin action:', trackingData);

      // Example: Send to analytics service
      // analyticsService.track(trackingData);
    } catch (error) {
      console.warn('PinService: Failed to track pin action:', error);
    }
  }
}

// Export singleton instance
export default new PinService();