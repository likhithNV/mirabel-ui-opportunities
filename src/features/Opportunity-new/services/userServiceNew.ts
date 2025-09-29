import axiosService from '@/services/axiosService.js';
import { getCurrentUserId } from '@/utils/userUtils';
import { API_URLS } from '@/utils/apiUrls';

export const userServiceNew = {
  async getUsersForDropdown(): Promise<Array<{display: string; value: string; id: string}>> {
    const endpoint = API_URLS.USER.ACCOUNTS_MASTER(getCurrentUserId());
    const response = await axiosService.get(endpoint);
    const users = response?.content?.List || [];
    return users
      .map((u: any) => ({
        display: u.Display || `${u.FirstName ?? ''} ${u.LastName ?? ''}`.trim() || 'Unknown User',
        // Keep raw id here; add IE=...~ only when building API payloads
        value: String(u.Value ?? ''),
        id: String(u.Value ?? '')
      }))
      .filter((u: any) => u.display && u.display !== 'Unknown User');
  },

  async getSavedSearches(): Promise<{ allOpportunities: any[]; myOpportunities: any[] }> {
    const endpoint = `/services/crm/contacts/search/SavedSearchesList/22/${getCurrentUserId()}/1`;
    const response = await axiosService.get(endpoint);
    const searches = response?.content?.List || [];
    const filtered = Array.isArray(searches) ? searches : [];

    const allOpportunities = filtered.filter((s: any) =>
      (s.Type === 'Recent Search' || !s.Type || s.Type === 'All Opportunities') &&
      s.Name !== 'Latest Search' && s.Name !== 'Recent Search'
    );

    const myOpportunities = filtered.filter((s: any) =>
      s.Type === 'My Opportunities' && s.Name !== 'Latest Search' && s.Name !== 'Recent Search'
    );

    return { allOpportunities, myOpportunities };
  },

  async saveSearch({ apiPayload }: { apiPayload: any }): Promise<{ success: boolean; searchId?: number; message?: string }> {
    const wrappedPayload = {
      OpportunitySearch: apiPayload || {},
      PageType: 1,
      IsRecentSearch: true
    };
    const response = await axiosService.post('/services/SavedSearch/', wrappedPayload);
    const status = response?.content?.Status || response?.content?.status;
    if (status === 'Success') {
      return {
        success: true,
        searchId: response?.content?.ID,
        message: 'Search saved successfully'
      };
    }
    return { success: false, message: response?.content?.Message || 'Failed to save search' };
  }
};

export default userServiceNew;
