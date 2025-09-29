import axiosService from '@/services/axiosService.js';
import { getCurrentUserId, getCurrentUserInfo } from '@/utils/userUtils';
import { isActiveSession } from '@/utils/sessionHelpers';
import { session } from '@/utils/session';
import contactsApi from '../../../services/contactsApi';
import activitiesApi from './activitiesApi';
import adminApi from './adminApi';
import proposalsApi from './proposalsApi';
import viewsApi from './viewsApi';

const axiosInstance = axiosService;
class ApiService {
  constructor() {
    this.httpClient = axiosInstance;
  }

  // Dynamic getters for current auth state
  get baseURL() {
    return this.httpClient.defaults.baseURL;
  }


  get userId() {
    return session.UserID;
  }

  get userInfo() {
    return getCurrentUserInfo();
  }

  get isAuthenticated() {
    return isActiveSession();
  }

  // Base HTTP methods
  async request(endpoint, options = {}) {
    const response = await this.httpClient(endpoint, options);
    return response;
  }

  async get(endpoint, params = {}) {
    const response = await this.httpClient.get(endpoint, { params });

    return response;
  }

  async post(endpoint, data = {}) {
    const response = await this.httpClient.post(endpoint, data);
    return response;
  }

  async put(endpoint, data = {}) {
    const response = await this.httpClient.put(endpoint, data);
    return response;
  }

  async delete(endpoint) {
    const response = await this.httpClient.delete(endpoint);
    return response;
  }

  // Note: Opportunity methods moved to opportunitiesService.js for better organization

  // Contacts methods
  async getCompanyDetails(contactId, config = {}) {
    return contactsApi.getCompanyDetails(contactId, config);
  }

  async getContactNames(contactId) {
    return contactsApi.getContactNames(contactId);
  }

  async searchCustomers(searchText) {
    return contactsApi.searchCustomers(searchText);
  }

  async updateContact(updatePayload) {
    return contactsApi.updateContact(updatePayload);
  }

  // Activities methods
  async getActivities(contactId) {
    return activitiesApi.getActivities(contactId);
  }

  async getCallActivities(contactId) {
    return activitiesApi.getCallActivities(contactId);
  }

  async getMeetingActivities(contactId) {
    return activitiesApi.getMeetingActivities(contactId);
  }

  async getNotesActivities(contactId) {
    return activitiesApi.getNotesActivities(contactId);
  }

  async getEmailActivities(contactId) {
    return activitiesApi.getEmailActivities(contactId);
  }

  async getActivityTypes() {
    return activitiesApi.getActivityTypes();
  }

  // Admin methods
  async getBusinessUnits() {
    return adminApi.getBusinessUnits();
  }

  async getProducts() {
    return adminApi.getProducts();
  }

  async getProductsByCriteria(businessUnitIds = "") {
    return adminApi.getProductsByCriteria(businessUnitIds);
  }

  async getUserAccounts() {
    return adminApi.getUserAccounts();
  }

  // Proposals methods
  async getLinkedProposals(params = {}) {
    return proposalsApi.getLinkedProposals(params);
  }

  // Views methods
  async getSavedViews() {
    return viewsApi.getSavedViews();
  }

  async getProposalViews() {
    return viewsApi.getProposalViews();
  }

  async getAvailableColumns() {
    return viewsApi.getAvailableColumns();
  }

  async getProposalAvailableColumns() {
    return viewsApi.getProposalAvailableColumns();
  }

  async getViewDetails(viewId) {
    return viewsApi.getViewDetails(viewId);
  }

  async saveCustomView(viewData) {
    return viewsApi.saveCustomView(viewData);
  }

  async updateView(viewData) {
    return viewsApi.updateView(viewData);
  }

  async deleteOpportunityView(viewId) {
    return viewsApi.deleteOpportunityView(viewId);
  }

  async deleteProposalView(viewId) {
    return viewsApi.deleteProposalView(viewId);
  }

  async getUserPageView(userId, pageView) {
    return viewsApi.getUserPageView(userId, pageView);
  }

  async saveUserPageView(payload) {
    return viewsApi.saveUserPageView(payload);
  }

  async getPageSettings(pageTypeId, viewId = -1) {
    return viewsApi.getPageSettings(pageTypeId, viewId);
  }

  async getHeaderFieldsViewId(pageType, productType) {
    return viewsApi.getHeaderFieldsViewId(pageType, productType);
  }

  // Settings methods
  async getReportSettings(userId = null, viewId = -1) {
    const currentUserId = userId || this.userId;
    return this.get(`/services/Reports/Settings/${currentUserId}/${viewId}`);
  }

  async updateReportSettings(payload) {
    return this.post('Reports/Settings/', payload);
  }

  // Utility methods
  getApiInfo() {
    return {
      baseURL: this.baseURL,
      isAuthenticated: this.isAuthenticated,
      userId: this.userId,
      userInfo: this.userInfo,
      domain: this.httpClient.defaults.baseURL || ''
    };
  }

  // Force refresh authentication state
  refreshAuth() {
    // This will force httpClient to update its configuration
    // Configuration update handled by axios interceptors
  }
}

export default new ApiService();
