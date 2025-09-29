import apiService from './apiService';
import { getCurrentUserId } from '../../../utils/userUtils';
import { logger } from '../../../components/shared/logger';

/**
 * Service for handling proposals/report/all API calls
 * Based on the existing pattern from the old Opportunity folder
 */
export class ProposalsReportService {
  
  /**
   * Execute search using the opportunities/report/all endpoint with ResultType: 2 for proposals
   * @param {Object} searchPayload - The complete search payload
   * @returns {Promise<Object>} Search results with proposals data
   */
  async executeSearch(searchPayload) {
    try {
      logger.info('ProposalsReportService: Executing search with payload:', searchPayload);

      // Ensure ResultType is set to 2 for proposals
      const proposalPayload = {
        ...searchPayload,
        ResultType: 2
      };

      // Call the opportunities/report/all API endpoint with ResultType: 2
      const response = await apiService.post('/services/opportunities/report/all/', proposalPayload);
      
      logger.info('ProposalsReportService: API response received:', response);

      if (response?.content) {
        // Extract data using the same structure as opportunities
        let proposals = [];
        let totalCount = 0;
        let proposalResult = {};
        let apiColumnConfig = [];

        // Extract data from response - the response has {responseHeader, content} structure
        const responseData = response;
        logger.info('ProposalsReportService: Full response data structure:', responseData);

        // Check if we have the nested content structure
        if (responseData && responseData.content && responseData.content.Data) {
          logger.info('ProposalsReportService: Using response.content.Data path');
          const contentData = responseData.content.Data;
          
          // For proposals, the data might be in Proposals array or Opportunities array
          proposals = contentData.Proposals || contentData.Opportunities || [];
          totalCount = contentData.Total || proposals.length;
          proposalResult = (contentData.ProposalResult && contentData.ProposalResult[0]) || 
                          (contentData.OpportunityResult && contentData.OpportunityResult[0]) || {};
          
          // Check for ColumnConfig in the main search response
          if (contentData.ColumnConfig && Array.isArray(contentData.ColumnConfig)) {
            logger.info('ProposalsReportService: Found ColumnConfig in search response:', contentData.ColumnConfig);
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
          logger.info('ProposalsReportService: Using response.content.List path (fallback)');
          proposals = responseData.content.List || [];
          totalCount = responseData.content.TotalCount || proposals.length;
          proposalResult = {};
        } else {
          logger.warn('ProposalsReportService: No valid data structure found in response:', responseData);
          proposals = [];
          totalCount = 0;
        }

        // Calculate statistics from the data
        const statistics = this.calculateStatistics(proposals, proposalResult);

        const result = {
          success: true,
          results: proposals,
          totalCount: totalCount,
          proposalResult: proposalResult,
          // For compatibility with SearchResults component, also include as opportunityResult
          opportunityResult: proposalResult,
          apiColumnConfig: apiColumnConfig,
          statistics: statistics,
          pageInfo: {
            currentPage: response.content.CurPage || 1,
            pageSize: response.content.PageSize || 25,
            totalPages: Math.ceil((totalCount || 0) / (response.content.PageSize || 25))
          }
        };

        logger.info('ProposalsReportService: Final processed result:', result);
        logger.info('ProposalsReportService: Proposals count:', proposals.length);
        logger.info('ProposalsReportService: First proposal:', proposals[0]);

        return result;
      } else {
        throw new Error('Invalid search results response');
      }
      
    } catch (error) {
      logger.error('ProposalsReportService: Failed to execute search:', error);
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
      "Status": "",
      "UserID": getCurrentUserId() || 1,
      "Probability": "",
      "ListID": 0,
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
      "ResultType": 2, // Key difference: 2 for proposals, 1 for opportunities
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
      "InternalApprovalStage": null
    };

    // Merge with any overrides
    return { ...defaultPayload, ...overrides };
  }

  /**
   * Calculate statistics from the proposals data
   * @param {Array} proposals - Array of proposal records
   * @param {Object} proposalResult - Summary data from API
   * @returns {Object} Statistics object for the UI
   */
  calculateStatistics(proposals, proposalResult) {
    const stats = {
      totalProposals: proposals.length,
      totalValue: 0,
      averageValue: 0,
      activeProposals: 0,
      sentProposals: 0,
      approvedProposals: 0
    };

    if (proposals.length === 0) {
      return stats;
    }

    // Calculate from proposal result if available
    if (proposalResult) {
      stats.totalValue = proposalResult.TotalAmount || proposalResult.ProposalsAmount || 0;
      stats.totalProposals = proposalResult.TotalCount || proposalResult.Proposals || proposals.length;
      stats.activeProposals = proposalResult.ActiveProposals || 0;
      stats.sentProposals = proposalResult.SentProposals || 0;
      stats.approvedProposals = proposalResult.ApprovedProposals || 0;
      stats.averageValue = stats.totalProposals > 0 ? stats.totalValue / stats.totalProposals : 0;
    } else {
      // Calculate from individual records
      proposals.forEach(proposal => {
        const amount = parseFloat(proposal.Amount || proposal.TotalAmount || proposal.ProposalTotal || 0);
        stats.totalValue += amount;

        const status = (proposal.Status || proposal.ProposalStatus || '').toLowerCase();
        if (status.includes('active')) {
          stats.activeProposals++;
        } else if (status.includes('sent')) {
          stats.sentProposals++;
        } else if (status.includes('approved')) {
          stats.approvedProposals++;
        }
      });

      stats.averageValue = stats.totalProposals > 0 ? stats.totalValue / stats.totalProposals : 0;
    }

    return stats;
  }

  /**
   * Get initial data for the search results page
   * @returns {Promise<Object>} Initial search results
   */
  async getInitialData(newParams = null) {
    try {
      const defaultPayload = this.buildDefaultPayload(newParams);
      return await this.executeSearch(defaultPayload);
    } catch (error) {
      logger.error('ProposalsReportService: Failed to get initial data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const proposalsReportService = new ProposalsReportService();
export default proposalsReportService;