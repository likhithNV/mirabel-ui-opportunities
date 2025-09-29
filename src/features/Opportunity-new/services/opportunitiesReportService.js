import { getCurrentUserId } from '../../../utils/userUtils';
import { logger } from '../../../components/shared/logger';
import apiService from './apiService';

/**
 * Service for handling opportunities/report/all API calls
 * Based on the existing pattern from the old Opportunity folder
 */
export class OpportunitiesReportService {
  
  /**
   * Execute search using the opportunities/report/all endpoint
   * @param {Object} searchPayload - The complete search payload
   * @returns {Promise<Object>} Search results with opportunities data
   */
  async executeSearch(searchPayload) {
    try {
      logger.info('OpportunitiesReportService: Executing search with payload:', searchPayload);

      // Call the opportunities/report/all API endpoint
      const response = await apiService.post('/services/opportunities/report/all/', searchPayload);
      
      logger.info('OpportunitiesReportService: API response received:', response);

      if (response?.content) {
        // Extract data using the same structure as the old implementation
        let opportunities = [];
        let totalCount = 0;
        let opportunityResult = {};
        let apiColumnConfig = [];

        // Extract data from response - the response has {responseHeader, content} structure
        const responseData = response;
        logger.info('OpportunitiesReportService: Full response data structure:', responseData);

        // Check if we have the nested content structure
        if (responseData && responseData.content && responseData.content.Data) {
          logger.info('OpportunitiesReportService: Using response.content.Data path');
          const contentData = responseData.content.Data;
          
          opportunities = contentData.Opportunities || [];
          totalCount = contentData.Total || opportunities.length;
          opportunityResult = (contentData.OpportunityResult && contentData.OpportunityResult[0]) || {};
          
          // Check for ColumnConfig in the main search response
          if (contentData.ColumnConfig && Array.isArray(contentData.ColumnConfig)) {
            logger.info('OpportunitiesReportService: Found ColumnConfig in search response:', contentData.ColumnConfig);
            apiColumnConfig = contentData.ColumnConfig.map(item => ({
              id: item.PropertyMappingName ? item.PropertyMappingName.toLowerCase() : item.DBColumnsNames?.toLowerCase(),
              label: item.VisibleColumns || item.PropertyMappingName || item.DBColumnsNames,
              dbName: item.DBColumnsNames,
              propertyMappingName: item.PropertyMappingName,
              visibleColumns: item.VisibleColumns,
              isDefault: item.IsDefault,
              groupBy: item.GroupBy,
              sortOrder: item.SortOrder
            }));
          }
        } else if (responseData && responseData.content && responseData.content.List) {
          logger.info('OpportunitiesReportService: Using response.content.List path (fallback)');
          opportunities = responseData.content.List || [];
          totalCount = responseData.content.TotalCount || opportunities.length;
          opportunityResult = {};
        } else {
          logger.warn('OpportunitiesReportService: No valid data structure found in response:', responseData);
          opportunities = [];
          totalCount = 0;
        }

        // Calculate statistics from the data
        const statistics = this.calculateStatistics(opportunities, opportunityResult);

        const result = {
          success: true,
          results: opportunities,
          totalCount: totalCount,
          opportunityResult: opportunityResult,
          apiColumnConfig: apiColumnConfig,
          statistics: statistics,
          pageInfo: {
            currentPage: response.content.CurPage || 1,
            pageSize: response.content.PageSize || 25,
            totalPages: Math.ceil((totalCount || 0) / (response.content.PageSize || 25))
          }
        };

        logger.info('OpportunitiesReportService: Final processed result:', result);
        logger.info('OpportunitiesReportService: Opportunities count:', opportunities.length);
        logger.info('OpportunitiesReportService: First opportunity:', opportunities[0]);

        return result;
      } else {
        throw new Error('Invalid search results response');
      }
      
    } catch (error) {
      logger.error('OpportunitiesReportService: Failed to execute search:', error);
      throw error;
    }
  }

  /**
   * Build default search payload for initial load
   * @param {Object} overrides - Any overrides to the default payload
   * @returns {Object} Complete search payload
   */
  buildDefaultPayload(overrides = {}) {
    const defaultPayload = {
      "IDs": null,
      "CustomerID": "",
      "CustomerName": "",
      "OppName": "",
      "Type": "",
      "BusinessUnit": "",
      "Source": "",
      "Products": "",
      "LossReason": "",
      "AssignedTo": "",
      "Arth": "",
      "SalesPresenter": null,
      "Stage": "",
      "CreatedBy": "",
      "CreatedFrom": "",
      "CreatedTo": "",
      "CloseFrom": "",
      "CloseTo": "",
      "ActualCloseFrom": "",
      "ActualCloseTo": "",
      "Status": "all",
      "UserID": getCurrentUserId() || 1,
      "Probability": "",
      "AdvSearch": {
        "UserID": "",
        "CategoryID": "",
        "ContactGroup": "",
        "Contact": "",
        "ContactIDs": "",
        "Name": "",
        "Agency": "",
        "City": "",
        "LastContactOption": "-1",
        "LastContactFromDate": "",
        "LastContactToDate": "",
        "State": "",
        "Email": "",
        "Phone": "",
        "Mobile": "",
        "Priority": "",
        "Country": "",
        "County": "",
        "Zip": "",
        "SubContacts": -1,
        "IsAgency": -1,
        "CheckProductionSelected": false,
        "CurrentContractID": 0,
        "BusinessUnit": -1,
        "Product": -1,
        "IssueYear": -1,
        "IssueID": -1,
        "From": "",
        "To": "",
        "ContactType": "",
        "BudgetPlanningFrom": "",
        "BudgetPlanningTo": "",
        "CustomFieldXML": "",
        "SelectedContactIDs": "",
        "EmailVerificationStatus": "",
        "IsQuickSearch": false,
        "Activity": "",
        "ActivitySalesRep": "",
        "IsGifter": false,
        "SubscriptionStartDateFrom": "",
        "SubscriptionStartDateTo": "",
        "SubscriptionEndDateFrom": "",
        "SubscriptionEndDateTo": "",
        "SubscriptionBusinessUnit": "",
        "SubscriptionProduct": "",
        "CustomerType": -1,
        "IsDigitalAdsAdvertiser": -1,
        "Address": null,
        "ContactAddedDateFrom": null,
        "ContactAddedDateTo": null,
        "LeadQuality": null,
        "LeadTypes": null,
        "ListID": 0,
        "LeadSources": null,
        "ProspectingStages": null,
        "WorkFlows": null,
        "ProspectingStageID": 0,
        "ProspectingStageFromDate": null,
        "ProspectingStageToDate": null,
        "LeadStatus": null,
        "InActive": false,
        "CampaignStatus": null,
        "CampaignName": null,
        "CampaignSubject": null,
        "CampaignCreatedDateFrom": "",
        "CampaignCreatedDateTo": "",
        "CampaignScheduleDateFrom": null,
        "CampaignScheduleDateTo": null,
        "CampaignActivity": null,
        "PageType": 0,
        "SelectedCampaignIDs": "",
        "MKMContactIds": "",
        "CampaignsFrom": "",
        "SubsidiaryParentCompany": "",
        "ProductTags": "",
        "BusinessUnitTags": ""
      },
      "Action": null,
      "PageSize": 25,
      "CurPage": 1,
      "SortBy": "",
      "ListName": "Latest Search",
      "ViewType": 0,
      "ResultType": 1,
      "ProposalRep": "",
      "ProposalName": "",
      "ProposalStatus": "",
      "ProposalIDs": null,
      "ProposalApprovalStatus": "",
      "ProposalESignStatus": "",
      "ProposalCreateDateRangeFrom": "",
      "ProposalCreateDateRangeTo": "",
      "Mode": null,
      "ProposalTotalRangeFrom": "",
      "ProposalTotalRangeTo": "",
      "InternalApprovalStage": null,
      "IssueYear": "",
      "Issue": "",
      "IssueStartDate": "",
      "IssueEndDate": "",
      "IssueFromDate": "",
      "IssueToDate": "",
      "IssuebasedSearch": "",
      "ListID": 0
    };

    // Merge with any overrides
    return { ...defaultPayload, ...overrides };
  }

  /**
   * Calculate statistics from the opportunities data
   * @param {Array} opportunities - Array of opportunity records
   * @param {Object} opportunityResult - Summary data from API
   * @returns {Object} Statistics object for the UI
   */
  calculateStatistics(opportunities, opportunityResult) {
    const stats = {
      totalOpportunities: opportunities.length,
      totalValue: 0,
      averageValue: 0,
      openOpportunities: 0,
      closedWon: 0,
      closedLost: 0
    };

    if (opportunities.length === 0) {
      return stats;
    }

    // Calculate from opportunity result if available
    if (opportunityResult) {
      stats.totalValue = opportunityResult.TotalAmount || 0;
      stats.totalOpportunities = opportunityResult.TotalCount || opportunities.length;
      stats.averageValue = stats.totalOpportunities > 0 ? stats.totalValue / stats.totalOpportunities : 0;
    } else {
      // Calculate from individual records
      opportunities.forEach(opp => {
        const amount = parseFloat(opp.Amount || opp.TotalAmount || 0);
        stats.totalValue += amount;

        const status = (opp.Status || '').toLowerCase();
        if (status.includes('open') || status.includes('active')) {
          stats.openOpportunities++;
        } else if (status.includes('won') || status.includes('closed won')) {
          stats.closedWon++;
        } else if (status.includes('lost') || status.includes('closed lost')) {
          stats.closedLost++;
        }
      });

      stats.averageValue = stats.totalOpportunities > 0 ? stats.totalValue / stats.totalOpportunities : 0;
    }

    return stats;
  }

  /**
   * Get initial data for the search results page
   * @returns {Promise<Object>} Initial search results
   */
  async getInitialData(newParams=null) {
    try {
      const defaultPayload = this.buildDefaultPayload(newParams);
      return await this.executeSearch(defaultPayload);
    } catch (error) {
      logger.error('OpportunitiesReportService: Failed to get initial data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const opportunitiesReportService = new OpportunitiesReportService();
export default opportunitiesReportService;