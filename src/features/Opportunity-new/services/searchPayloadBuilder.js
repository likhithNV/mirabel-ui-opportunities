import { getCurrentUserId } from '../../../utils/userUtils';
import { logger } from '../../../components/shared/logger';

/**
 * Service for building API payloads from Advanced Search form data
 * Handles both opportunities and proposals search payloads
 */
export class SearchPayloadBuilder {

  /**
   * Format multi-select values with IE= prefix
   * @param {string|Array} value - The value to format
   * @returns {string} Formatted value
   */
  formatMultiSelectValue(value) {
    if (!value) return '';

    // If it's already formatted (contains IE=), return as is
    if (typeof value === 'string' && value.includes('IE=')) {
      return value;
    }
    
    if (Array.isArray(value)) {
      // If array, format each value
      return value
        .filter(v => v && typeof v === 'string' ? v.trim() : v)
        .map(v => `IE=${String(v).trim()}~`).join('');
    }
    
    // If string, split by comma and format each value
    if (typeof value === 'string') {
      const values = value.split(',').filter(v => v.trim());
      return values.map(v => `IE=${v.trim()}~`).join('');
    }
    
    // Fallback: just return as string
    return String(value);
  }

  /**
   * Format text search values with SW= prefix
   * @param {string} value - The value to format
   * @returns {string} Formatted value
   */
  formatTextSearchValue(value) {
    let formattedValue = '';
    if(Array.isArray(value)) {
      formattedValue = value.length > 0 ? value[0] : '';
    } else {
      formattedValue = value;
    }
    if (!formattedValue) return '';

    // If it's already formatted (contains SW=), return as is
    if (formattedValue.includes('SW=')) return formattedValue;

    // Format with SW= prefix
    return `SW=${formattedValue.trim()}~`;
  }

  /**
   * Format date to MM/DD/YYYY format
   * @param {string} dateString - The date string to format
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Parse business unit value
   * @param {string|number} businessUnit - The business unit value
   * @returns {number} Parsed business unit ID
   */
  parseBusinessUnit(businessUnit) {
    if (!businessUnit) return -1;
    if (typeof businessUnit === 'number') return businessUnit;
    if (typeof businessUnit === 'string') {
      // If it's already formatted with IE=, extract the value
      if (businessUnit.includes('IE=')) {
        const match = businessUnit.match(/IE=([^~]+)~/);
        if (match && match[1]) {
          const parsed = parseInt(match[1]);
          return isNaN(parsed) ? -1 : parsed;
        }
      }
      const parsed = parseInt(businessUnit);
      return isNaN(parsed) ? -1 : parsed;
    }
    return -1;
  }

  /**
   * Extract field value from form data with section prefix
   * @param {Object} formData - The form data object
   * @param {string} sectionName - The section name
   * @param {string} fieldKey - The field key
   * @returns {any} The field value
   */
  getFieldValue(formData, sectionName, fieldKey) {
    const fieldKeyWithSection = `${fieldKey}`;
    return formData[fieldKeyWithSection];
  }

  /**
   * Build opportunities search payload from form data
   * @param {Object} formData - The Advanced Search form data
   * @returns {Object} API payload for opportunities search
   */
  buildOpportunitiesPayload(formData) {
    logger.info('SearchPayloadBuilder: Building opportunities payload from form data:', formData);

    const payload = {
      "IDs": null,
      "CustomerID": this.getFieldValue(formData, 'Quick Search', 'customerId') || "",
      "CustomerName": this.getFieldValue(formData, 'Quick Search', 'companyName') ? 
        this.formatTextSearchValue(this.getFieldValue(formData, 'Quick Search', 'companyName')) : "",
      "OppName": this.getFieldValue(formData, 'Quick Search', 'opportunityName') ? 
        this.formatTextSearchValue(this.getFieldValue(formData, 'Quick Search', 'opportunityName')) : "",
      "Type": this.getFieldValue(formData, 'Opportunity Details', 'type') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Opportunity Details', 'type')) : "",
      "BusinessUnit": this.getFieldValue(formData, 'Opportunity Details', 'businessUnit') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Opportunity Details', 'businessUnit')) : "",
      "Source": this.getFieldValue(formData, 'Opportunity Details', 'source') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Opportunity Details', 'source')) : "",
      "Products": this.getFieldValue(formData, 'Opportunity Details', 'products') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Opportunity Details', 'products')) : "",
      "LossReason": this.getFieldValue(formData, 'Opportunity Details', 'winLossReason') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Opportunity Details', 'winLossReason')) : "",
      "AssignedTo": this.getFieldValue(formData, 'Opportunity Details', 'assignedRep') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Opportunity Details', 'assignedRep')) : "",
      "Arth": this.getFieldValue(formData, 'Opportunity Details', 'arth') || "",
      "SalesPresenter": this.getFieldValue(formData, 'Opportunity Details', 'salesPresenter') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Opportunity Details', 'salesPresenter')) : null,
      "Stage": this.getFieldValue(formData, 'Opportunity Details', 'stage') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Opportunity Details', 'stage')) : "",
      "CreatedBy": this.getFieldValue(formData, 'Opportunity Details', 'createdRep') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Opportunity Details', 'createdRep')) : "",
      "CreatedFrom": this.formatDate(this.getFieldValue(formData, 'Date Ranges', 'createdDateFrom')) || "",
      "CreatedTo": this.formatDate(this.getFieldValue(formData, 'Date Ranges', 'createdDateTo')) || "",
      "CloseFrom": this.formatDate(this.getFieldValue(formData, 'Date Ranges', 'projectedCloseDateFrom')) || "",
      "CloseTo": this.formatDate(this.getFieldValue(formData, 'Date Ranges', 'projectedCloseDateTo')) || "",
      "ActualCloseFrom": this.formatDate(this.getFieldValue(formData, 'Date Ranges', 'actualCloseDateFrom')) || "",
      "ActualCloseTo": this.formatDate(this.getFieldValue(formData, 'Date Ranges', 'actualCloseDateTo')) || "",
      "Status": this.getFieldValue(formData, 'Opportunity Details', 'status') || "all",
      "UserID": getCurrentUserId() || 1,
      "Probability": this.getFieldValue(formData, 'Opportunity Details', 'probability') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Opportunity Details', 'probability')) : "",
      "AdvSearch": {
        "UserID": "",
        "CategoryID": "",
        "ContactGroup": "",
        "Contact": "",
        "ContactIDs": "",
        "Name": "",
        "Agency": "",
        "City": this.getFieldValue(formData, 'Contact Information', 'city') ? 
          this.formatMultiSelectValue(this.getFieldValue(formData, 'Contact Information', 'city')) : "",
        "LastContactOption": "-1",
        "LastContactFromDate": "",
        "LastContactToDate": "",
        "State": this.getFieldValue(formData, 'Contact Information', 'state') ? 
          this.formatMultiSelectValue(this.getFieldValue(formData, 'Contact Information', 'state')) : "",
        "Email": this.getFieldValue(formData, 'Contact Information', 'contactEmail') ? 
          this.formatTextSearchValue(this.getFieldValue(formData, 'Contact Information', 'contactEmail')) : "",
        "Phone": this.getFieldValue(formData, 'Contact Information', 'contactPhone') ? 
          this.formatTextSearchValue(this.getFieldValue(formData, 'Contact Information', 'contactPhone')) : "",
        "Mobile": this.getFieldValue(formData, 'Contact Information', 'mobile') || "",
        "Priority": this.getFieldValue(formData, 'Contact Information', 'priority') || "",
        "Country": this.getFieldValue(formData, 'Contact Information', 'country') ? 
          this.formatMultiSelectValue(this.getFieldValue(formData, 'Contact Information', 'country')) : "",
        "County": this.getFieldValue(formData, 'Contact Information', 'county') ? 
          this.formatMultiSelectValue(this.getFieldValue(formData, 'Contact Information', 'county')) : "",
        "Zip": this.getFieldValue(formData, 'Contact Information', 'zipPostalCode') || "",
        "SubContacts": -1,
        "IsAgency": -1,
        "CheckProductionSelected": false,
        "CurrentContractID": 0,
        "BusinessUnit": this.parseBusinessUnit(this.getFieldValue(formData, 'Opportunity Details', 'businessUnit')),
        "Product": this.getFieldValue(formData, 'Opportunity Details', 'products') ? 
          parseInt(this.getFieldValue(formData, 'Opportunity Details', 'products')) : -1,
        "IssueYear": -1,
        "IssueID": -1,
        "From": "",
        "To": "",
        "ContactType": this.getFieldValue(formData, 'Contact Information', 'contactType') || "",
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
        "Address": this.getFieldValue(formData, 'Contact Information', 'address') || null,
        "ContactAddedDateFrom": null,
        "ContactAddedDateTo": null,
        "LeadQuality": this.getFieldValue(formData, 'Lead Information', 'leadQuality') || null,
        "LeadTypes": this.getFieldValue(formData, 'Lead Information', 'leadType') || null,
        "ListID": (() => { const v = this.getFieldValue(formData, '', 'ListID'); return v ? parseInt(v) : undefined; })(),
        "LeadSources": this.getFieldValue(formData, 'Lead Information', 'leadSource') || null,
        "ProspectingStages": null,
        "WorkFlows": null,
        "ProspectingStageID": 0,
        "ProspectingStageFromDate": null,
        "ProspectingStageToDate": null,
        "LeadStatus": this.getFieldValue(formData, 'Lead Information', 'leadStatus') || null,
        "InActive": false,
        "CampaignStatus": null,
        "CampaignName": this.getFieldValue(formData, 'Marketing', 'campaign') || null,
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
        "ProductTags": this.getFieldValue(formData, 'Additional', 'tags') || "",
        "BusinessUnitTags": ""
      },
      "Action": null,
      "PageSize": 25,
      "CurPage": 1,
      "SortBy": "",
      "ListName": "Latest Search",
      "ViewType": 0,
      "ResultType": 1, // 1 for opportunities
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
      "ListID": (() => { const v = this.getFieldValue(formData, '', 'ListID'); return v ? parseInt(v) : undefined; })()
    };

    logger.info('SearchPayloadBuilder: Built opportunities payload:', payload);
    return payload;
  }

  /**
   * Build proposals search payload from form data
   * @param {Object} formData - The Advanced Search form data
   * @returns {Object} API payload for proposals search
   */
  buildProposalsPayload(formData) {
    logger.info('SearchPayloadBuilder: Building proposals payload from form data:', formData);

    const payload = {
      "IDs": null,
      "CustomerID": this.getFieldValue(formData, 'Quick Search', 'customerId') || "",
      "CustomerName": this.getFieldValue(formData, 'Quick Search', 'companyName') ? 
        this.formatTextSearchValue(this.getFieldValue(formData, 'Quick Search', 'companyName')) : "",
      "OppName": this.getFieldValue(formData, 'Quick Search', 'opportunityName') ? 
        this.formatTextSearchValue(this.getFieldValue(formData, 'Quick Search', 'opportunityName')) : "",
      "Type": this.getFieldValue(formData, 'Proposal Details', 'type') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Proposal Details', 'type')) : "",
      "BusinessUnit": this.getFieldValue(formData, 'Proposal Details', 'businessUnit') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Proposal Details', 'businessUnit')) : "",
      "Source": this.getFieldValue(formData, 'Proposal Details', 'source') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Proposal Details', 'source')) : "",
      "Products": this.getFieldValue(formData, 'Proposal Details', 'products') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Proposal Details', 'products')) : "",
      "LossReason": "",
      "AssignedTo": this.getFieldValue(formData, 'Proposal Details', 'assignedRep') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Proposal Details', 'assignedRep')) : "",
      "Arth": "",
      "SalesPresenter": this.getFieldValue(formData, 'Proposal Details', 'salesPresenter') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Proposal Details', 'salesPresenter')) : null,
      "Stage": "",
      "CreatedBy": this.getFieldValue(formData, 'Proposal Details', 'createdRep') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Proposal Details', 'createdRep')) : "",
      "CreatedFrom": this.formatDate(this.getFieldValue(formData, 'Date Ranges', 'createdDateFrom')) || "",
      "CreatedTo": this.formatDate(this.getFieldValue(formData, 'Date Ranges', 'createdDateTo')) || "",
      "CloseFrom": "",
      "CloseTo": "",
      "ActualCloseFrom": "",
      "ActualCloseTo": "",
      "Status": this.getFieldValue(formData, 'Proposal Details', 'status') || "all",
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
        "City": this.getFieldValue(formData, 'Contact Information', 'city') ? 
          this.formatMultiSelectValue(this.getFieldValue(formData, 'Contact Information', 'city')) : "",
        "LastContactOption": "-1",
        "LastContactFromDate": "",
        "LastContactToDate": "",
        "State": this.getFieldValue(formData, 'Contact Information', 'state') ? 
          this.formatMultiSelectValue(this.getFieldValue(formData, 'Contact Information', 'state')) : "",
        "Email": this.getFieldValue(formData, 'Contact Information', 'contactEmail') ? 
          this.formatTextSearchValue(this.getFieldValue(formData, 'Contact Information', 'contactEmail')) : "",
        "Phone": this.getFieldValue(formData, 'Contact Information', 'contactPhone') ? 
          this.formatTextSearchValue(this.getFieldValue(formData, 'Contact Information', 'contactPhone')) : "",
        "Mobile": this.getFieldValue(formData, 'Contact Information', 'mobile') || "",
        "Priority": this.getFieldValue(formData, 'Contact Information', 'priority') || "",
        "Country": this.getFieldValue(formData, 'Contact Information', 'country') ? 
          this.formatMultiSelectValue(this.getFieldValue(formData, 'Contact Information', 'country')) : "",
        "County": this.getFieldValue(formData, 'Contact Information', 'county') ? 
          this.formatMultiSelectValue(this.getFieldValue(formData, 'Contact Information', 'county')) : "",
        "Zip": this.getFieldValue(formData, 'Contact Information', 'zipPostalCode') || "",
        "SubContacts": -1,
        "IsAgency": -1,
        "CheckProductionSelected": false,
        "CurrentContractID": 0,
        "BusinessUnit": this.parseBusinessUnit(this.getFieldValue(formData, 'Proposal Details', 'businessUnit')),
        "Product": this.getFieldValue(formData, 'Proposal Details', 'products') ? 
          parseInt(this.getFieldValue(formData, 'Proposal Details', 'products')) : -1,
        "IssueYear": -1,
        "IssueID": -1,
        "From": "",
        "To": "",
        "ContactType": this.getFieldValue(formData, 'Contact Information', 'contactType') || "",
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
        "Address": this.getFieldValue(formData, 'Contact Information', 'address') || null,
        "ContactAddedDateFrom": null,
        "ContactAddedDateTo": null,
        "LeadQuality": this.getFieldValue(formData, 'Lead Information', 'leadQuality') || null,
        "LeadTypes": this.getFieldValue(formData, 'Lead Information', 'leadType') || null,
        "ListID": (() => { const v = this.getFieldValue(formData, '', 'ListID'); return v ? parseInt(v) : undefined; })(),
        "LeadSources": this.getFieldValue(formData, 'Lead Information', 'leadSource') || null,
        "ProspectingStages": null,
        "WorkFlows": null,
        "ProspectingStageID": 0,
        "ProspectingStageFromDate": null,
        "ProspectingStageToDate": null,
        "LeadStatus": this.getFieldValue(formData, 'Lead Information', 'leadStatus') || null,
        "InActive": false,
        "CampaignStatus": null,
        "CampaignName": this.getFieldValue(formData, 'Marketing', 'campaign') || null,
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
        "ProductTags": this.getFieldValue(formData, 'Additional', 'tags') || "",
        "BusinessUnitTags": ""
      },
      "Action": null,
      "PageSize": 25,
      "CurPage": 1,
      "SortBy": "",
      "ListName": "Latest Search",
      "ViewType": 0,
      "ResultType": 2, // 2 for proposals
      "ProposalRep": this.getFieldValue(formData, 'Proposal Details', 'proposalRep') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Proposal Details', 'proposalRep')) : "",
      "ProposalName": this.getFieldValue(formData, 'Quick Search', 'proposalName') ? 
        this.formatTextSearchValue(this.getFieldValue(formData, 'Quick Search', 'proposalName')) : "",
      "ProposalStatus": this.getFieldValue(formData, 'Proposal Details', 'proposalStatus') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Proposal Details', 'proposalStatus')) : "",
      "ProposalIDs": this.getFieldValue(formData, 'Quick Search', 'proposalId') ? 
        this.formatTextSearchValue(this.getFieldValue(formData, 'Quick Search', 'proposalId')) : null,
      "ProposalApprovalStatus": this.getFieldValue(formData, 'Proposal Details', 'proposalApprovalStatus') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Proposal Details', 'proposalApprovalStatus')) : "",
      "ProposalESignStatus": this.getFieldValue(formData, 'Proposal Details', 'proposalESignStatus') || "",
      "ProposalCreateDateRangeFrom": this.formatDate(this.getFieldValue(formData, 'Date Ranges', 'proposalCreatedDateFrom')) || "",
      "ProposalCreateDateRangeTo": this.formatDate(this.getFieldValue(formData, 'Date Ranges', 'proposalCreatedDateTo')) || "",
      "Mode": null,
      "ProposalTotalRangeFrom": this.getFieldValue(formData, 'Financial', 'proposalAmountFrom') || "",
      "ProposalTotalRangeTo": this.getFieldValue(formData, 'Financial', 'proposalAmountTo') || "",
      "InternalApprovalStage": this.getFieldValue(formData, 'Proposal Details', 'proposalApprovalStages') ? 
        this.formatMultiSelectValue(this.getFieldValue(formData, 'Proposal Details', 'proposalApprovalStages')) : null,
      "IssueYear": "",
      "Issue": "",
      "IssueStartDate": "",
      "IssueEndDate": "",
      "IssueFromDate": "",
      "IssueToDate": "",
      "IssuebasedSearch": "",
      "ListID": (() => { const v = this.getFieldValue(formData, '', 'ListID'); return v ? parseInt(v) : undefined; })()
    };

    logger.info('SearchPayloadBuilder: Built proposals payload:', payload);
    return payload;
  }

  /**
   * Build search payload based on search type
   * @param {Object} formData - The Advanced Search form data
   * @param {string} searchType - 'opportunities' or 'proposals'
   * @returns {Object} API payload
   */
  buildPayload(formData, searchType = 'opportunities') {
    debugger;
    if (searchType === 'proposals') {
      return this.buildProposalsPayload(formData);
    } else {
      return this.buildOpportunitiesPayload(formData);
    }
  }
}

// Export singleton instance
export const searchPayloadBuilder = new SearchPayloadBuilder();
export default searchPayloadBuilder;