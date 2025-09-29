import axiosService from '@/services/axiosService.js';
import apiService from '../../Opportunity/Services/apiService';
import { getCurrentUserId } from '@/utils/userUtils';
import { API_URLS } from '@/utils/apiUrls';
import { OpportunityFormData } from '../types/opportunity';

// Helper function to format date for API (MM/DD/YYYY format)
const formatDateForApi = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  });
};

// Helper function to format date from API - avoid timezone issues
const formatApiDate = (dateString: string): string => {
  if (!dateString || dateString === "0001-01-01T00:00:00") return "";
  const datePart = dateString.split('T')[0];
  return datePart;
};

// Helper function to safely get nested object values
const safeGet = (obj: any, path: string, defaultValue: any = ''): any => {
  try {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  } catch (e) {
    return defaultValue;
  }
};

// Utility functions for payload formatting (from opportunitiesService.js)
export const getIcodeFromArray = (arr: any[]): string => {
  if (!arr || arr.length === 0) return "";

  let str = "";
  arr.forEach((x) => {
    const value = String(x).trim();
    // If value already starts with IE=, it's already formatted
    if (value.startsWith('IE=')) {
      str += value.replace(/~+$/, '') + '~';
    } else {
      str += `IE=${value}~`;
    }
  });
  return str;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

// Helper function to process probability value for backend
const processProbabilityValue = (probabilityFilter: any): string => {
  if (!probabilityFilter || probabilityFilter === "All") {
    return "";
  }

  // If it's already in IE format, return as is
  if (typeof probabilityFilter === 'string' && probabilityFilter.includes('IE=')) {
    return probabilityFilter;
  }

  // Handle array of probability values
  if (Array.isArray(probabilityFilter)) {
    if (probabilityFilter.length === 0) {
      return "";
    }
    // Process each probability value and combine them
    const numericValues = probabilityFilter.map(prob => {
      if (typeof prob === 'string') {
        return prob.replace('%', '');
      }
      return prob;
    });
    return getIcodeFromArray(numericValues);
  }

  // Handle single string value (backward compatibility)
  if (typeof probabilityFilter === 'string') {
    const numericValue = probabilityFilter.replace('%', '');
    return getIcodeFromArray([numericValue]);
  }

  return "";
};

export class OpportunityService {
  // Get opportunity details by ID
  async getOpportunityDetails(opportunityId: string): Promise<any> {
    try {
      const response = await axiosService.get(`${API_URLS.OPPORTUNITIES.BASE}/${opportunityId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch opportunity details:', error);
      throw error;
    }
  }

    
      

  // Create or update opportunity
  async saveOpportunity(formData: OpportunityFormData): Promise<any> {
    try {
      const payload = this.buildOpportunityPayload(formData);
      console.log('OpportunityService: Saving opportunity with payload:', payload);
      
      const response = await axiosService.post(API_URLS.OPPORTUNITIES.BASE, payload);
      console.log('OpportunityService: Save response:', response);
      
      return response;
    } catch (error) {
      console.error('Failed to save opportunity:', error);
      throw error;
    }
  }

  // Delete opportunity
  async deleteOpportunity(opportunityId: string, userId?: string): Promise<any> {
    try {
      const userIdToUse = userId || getCurrentUserId();
      const response = await axiosService.delete(`${API_URLS.OPPORTUNITIES.BASE}/${opportunityId}/${userIdToUse}`);
      return response;
    } catch (error) {
      console.error('Failed to delete opportunity:', error);
      throw error;
    }
  }

  // Get opportunity history
  async getOpportunityHistory(opportunityId: string): Promise<any> {
    try {
      const response = await axiosService.get(`${API_URLS.OPPORTUNITIES.BASE}/History/${opportunityId}/10/1`);
      return response;
    } catch (error) {
      console.error('Failed to fetch opportunity history:', error);
      throw error;
    }
  }

  // Get opportunity stages
  async getOpportunityStages(): Promise<any> {
    try {
      console.log('OpportunityService: Fetching opportunity stages');
      const response = await axiosService.get(API_URLS.ADMIN.OPPORTUNITY_STAGES);
      console.log('OpportunityService: Stages API Response:', response);
      return response;
    } catch (error) {
      console.error('Failed to fetch opportunity stages:', error);
      throw error;
    }
  }

  // Get required fields configuration from API
  async getRequiredFields(): Promise<any> {
    try {
      console.log('OpportunityService: Fetching required fields configuration');
      const response = await axiosService.get('/services/Admin/RequiredFields/PageName/OpportunityRequiredRequest');
      console.log('OpportunityService: Required fields API Response:', response);
      return response;
    } catch (error) {
      console.error('Failed to fetch required fields configuration:', error);
      throw error;
    }
  }

  // Update opportunity stage via drag and drop
  async updateOpportunityStage(opportunityId: string, stageId: number, userId?: string): Promise<any> {
    try {
      const userIdToUse = userId || getCurrentUserId();
      const endpoint = `/services/Opportunities/Field/PipelineStageID/${opportunityId}/0/${userIdToUse}/Insert`;
      const response = await axiosService.post(endpoint, stageId);
      return response;
    } catch (error) {
      console.error('Failed to update opportunity stage:', error);
      throw error;
    }
  }

  // Build API payload from form data
  private buildOpportunityPayload(formData: OpportunityFormData): any {
    return {
      ID: formData.opportunityId ? parseInt(formData.opportunityId) : 0,
      Name: formData.name || "Opportunity",
      Status: formData.status || "Open",
      CloseDate: formatDateForApi(formData.projCloseDate),
      Amount: formData.amount ? formData.amount.toString() : "0.00",
      Probability: formData.probability ? parseInt(formData.probability) : 0,
      Source: formData.primaryCampaignSource || null,
      Notes: formData.notes || "",
      NextStep: formData.nextSteps || "",
      CreatedDate: formatDateForApi(formData.createdDate),
      ModfiedDate: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6'),
      OppStageDetails: {
        ID: formData.stageDetails?.ID ? parseInt(formData.stageDetails.ID.toString()) : null,
        Stage: formData.stage || ""
      },
      ContactDetails: formData.contactDetails?.ID ? {
        ID: parseInt(formData.contactDetails.ID.toString()),
        SalesRepID: parseInt(formData.assignedRepDetails?.ID?.toString() || '0')
      } : {
        ID: 1611, // Default contact ID
        SalesRepID: parseInt(formData.assignedRepDetails?.ID?.toString() || '0')
      },
      ProductDetails: formData.productDetails && formData.productDetails.length > 0
        ? formData.productDetails.map(product => ({
          Details: null,
          Products: null,
          ListOfProducts: null,
          ID: parseInt(product.ID.toString()) || 0,
          Name: product.Name || ""
        }))
        : formData.product && formData.product.length > 0
          ? formData.product.map((name, index) => ({
            Details: null,
            Products: null,
            ListOfProducts: null,
            ID: parseInt(formData.productId[index]) || 0,
            Name: name
          }))
          : [{
            Details: null,
            Products: null,
            ListOfProducts: null,
            ID: 47,
            Name: "Classified Services"
          }],
      OwnerDetails: {
        ID: parseInt(formData.assignedRepDetails?.ID?.toString() || '0')
      },
      AssignedTODetails: formData.assignedRepDetails?.ID ? {
        ID: parseInt(formData.assignedRepDetails.ID.toString()),
        Name: formData.assignedRepDetails.Name || formData.assignedRep || ""
      } : {
        ID: 71, // Default assigned rep ID
        Name: formData.assignedRep || ""
      },
      SalesPresenterDetails: formData.salesPresenterDetails?.ID ? {
        ID: parseInt(formData.salesPresenterDetails.ID.toString()),
        Name: formData.salesPresenterDetails.Name || formData.salesPresentation || ""
      } : {
        ID: 0,
        Name: "*Unassigned*"
      },
      OppTypeDetails: {
        ID: formData.opportunityType?.id ? parseInt(formData.opportunityType.id) : null,
        Name: formData.opportunityType?.name || ""
      },
      BusinessUnitDetails: formData.businessUnitDetails && formData.businessUnitDetails.length > 0
        ? formData.businessUnitDetails.map(bu => ({
          ID: parseInt(bu.ID.toString()) || 0,
          Name: bu.Name || ""
        }))
        : formData.businessUnit && formData.businessUnit.length > 0
          ? formData.businessUnit.map((name, index) => ({
            ID: parseInt(formData.businessUnitId[index]) || 0,
            Name: name
          }))
          : [{ ID: "", Name: "" }],
      BusinessUnitIDS: formData.businessUnitId && formData.businessUnitId.length > 0
        ? formData.businessUnitId.join(",")
        : "",
      ProductIDS: formData.productId && formData.productId.length > 0
        ? formData.productId.join(",")
        : "",
      OppLossReasonDetails: formData.lossReasonDetails?.ID ? {
        ID: parseInt(formData.lossReasonDetails.ID.toString()),
        Name: formData.lossReasonDetails.Name || formData.lostReason || ""
      } : {
        ID: null,
        Name: formData.lostReason || ""
      },
      StageAction: "Add",
      SubContactDetails: formData.contactDetails?.ID ? {
        ID: parseInt(formData.contactDetails.ID.toString()),
        Name: formData.contactDetails.Name || formData.contactName || ""
      } : {
        ID: 0,
        Name: formData.contactName || ""
      },
      ProposalID: formData.proposalId || ""
    };
  }

  // Map API response to form data
  mapApiResponseToFormData(data: any): OpportunityFormData {
    // Helper functions for multiselect business units
    const getBusinessUnitValues = (data: any): string[] => {
      try {
        if (data.BusinessUnitDetailsArr && Array.isArray(data.BusinessUnitDetailsArr) && data.BusinessUnitDetailsArr.length > 0) {
          return data.BusinessUnitDetailsArr.map((bu: any) => bu.Name || '').filter((name: string) => name);
        }
        if (data.BusinessUnitDetails && data.BusinessUnitDetails.Name) {
          return [data.BusinessUnitDetails.Name];
        }
        return [];
      } catch (e) {
        return [];
      }
    };

    const getBusinessUnitIds = (data: any): string[] => {
      try {
        if (data.BusinessUnitDetailsArr && Array.isArray(data.BusinessUnitDetailsArr) && data.BusinessUnitDetailsArr.length > 0) {
          return data.BusinessUnitDetailsArr.map((bu: any) => bu.ID.toString()).filter((id: string) => id);
        }
        if (data.BusinessUnitDetails && data.BusinessUnitDetails.ID) {
          return [data.BusinessUnitDetails.ID.toString()];
        }
        return [];
      } catch (e) {
        return [];
      }
    };

    const getBusinessUnitDetailsArray = (data: any) => {
      try {
        if (data.BusinessUnitDetailsArr && Array.isArray(data.BusinessUnitDetailsArr) && data.BusinessUnitDetailsArr.length > 0) {
          return data.BusinessUnitDetailsArr.map((bu: any) => ({
            ID: bu.ID,
            Name: bu.Name || ''
          }));
        }
        if (data.BusinessUnitDetails && data.BusinessUnitDetails.Name) {
          return [{
            ID: data.BusinessUnitDetails.ID,
            Name: data.BusinessUnitDetails.Name
          }];
        }
        return [];
      } catch (e) {
        return [];
      }
    };

    // Helper functions for multiselect products
    const getProductValues = (data: any): string[] => {
      try {
        if (data.ProductsArr && Array.isArray(data.ProductsArr) && data.ProductsArr.length > 0) {
          return data.ProductsArr.map((product: any) => product.Name || '').filter((name: string) => name);
        }
        if (data.ProductDetails && data.ProductDetails.Name) {
          return [data.ProductDetails.Name];
        }
        return [];
      } catch (e) {
        return [];
      }
    };

    const getProductIds = (data: any): string[] => {
      try {
        if (data.ProductsArr && Array.isArray(data.ProductsArr) && data.ProductsArr.length > 0) {
          return data.ProductsArr.map((product: any) => product.ID.toString()).filter((id: string) => id);
        }
        if (data.ProductDetails && data.ProductDetails.ID) {
          return [data.ProductDetails.ID.toString()];
        }
        return [];
      } catch (e) {
        return [];
      }
    };

    const getProductDetailsArray = (data: any) => {
      try {
        if (data.ProductsArr && Array.isArray(data.ProductsArr) && data.ProductsArr.length > 0) {
          return data.ProductsArr.map((product: any) => ({
            ID: product.ID,
            Name: product.Name
          }));
        }
        if (data.ProductDetails && data.ProductDetails.Name) {
          return [{
            ID: safeGet(data, 'ProductDetails.ID'),
            Name: safeGet(data, 'ProductDetails.Name')
          }];
        }
        return [];
      } catch (e) {
        return [];
      }
    };

    return {
      opportunityId: data.ID?.toString() || '',
      proposalId: safeGet(data, 'ProposalID'),
      proposalName: safeGet(data, 'ProposalName'),
      name: safeGet(data, 'Name'),
      company: safeGet(data, 'ContactDetails.Name'),
      contactName: safeGet(data, 'SubContactDetails.ContactFullName') ||
        safeGet(data, 'SubContactDetails.ContactName') ||
        `${safeGet(data, 'SubContactDetails.FirstName')} ${safeGet(data, 'SubContactDetails.LastName')}`.trim(),
      status: safeGet(data, 'Status'),
      stage: safeGet(data, 'OppStageDetails.Stage'),
      stageDetails: data.OppStageDetails || {},
      amount: safeGet(data, 'Amount', ''),
      probability: safeGet(data, 'Probability', ''),
      stagePercentage: safeGet(data, 'OppStageDetails.PercentClosed', ''),
      opportunityType: {
        id: safeGet(data, 'OppTypeDetails.ID'),
        name: safeGet(data, 'OppTypeDetails.Name')
      },
      opportunityTypeId: safeGet(data, 'OppTypeDetails.ID'),
      businessUnit: getBusinessUnitValues(data),
      businessUnitId: getBusinessUnitIds(data),
      businessUnitDetails: getBusinessUnitDetailsArray(data),
      product: getProductValues(data),
      productId: getProductIds(data),
      productDetails: getProductDetailsArray(data),
      primaryCampaignSource: safeGet(data, 'Source'),
      assignedRep: safeGet(data, 'AssignedTODetails.Name'),
      assignedRepDetails: {
        ID: safeGet(data, 'AssignedTODetails.ID'),
        Name: safeGet(data, 'AssignedTODetails.Name')
      },
      createdBy: safeGet(data, 'OwnerDetails.Name') || safeGet(data, 'OwnerDetails.SalesRepName'),
      source: safeGet(data, 'Source'),
      leadSource: safeGet(data, 'LeadSource'),
      leadType: safeGet(data, 'LeadType'),
      leadStatus: safeGet(data, 'LeadStatus'),
      salesPresentation: safeGet(data, 'SalesPresenterDetails.Name') || safeGet(data, 'SalesPresenterDetails.SalesRepName'),
      salesPresenterDetails: {
        ID: safeGet(data, 'SalesPresenterDetails.ID'),
        Name: safeGet(data, 'SalesPresenterDetails.Name') || safeGet(data, 'SalesPresenterDetails.SalesRepName')
      },
      projCloseDate: formatApiDate(safeGet(data, 'CloseDate')),
      actualCloseDate: formatApiDate(safeGet(data, 'ActualCloseDate')),
      createdDate: formatApiDate(safeGet(data, 'CreatedDateTo')) || formatApiDate(safeGet(data, 'CreatedDate')),
      description: safeGet(data, 'Description'),
      priority: '',
      location: '',
      remote: false,
      industry: '',
      companySize: '',
      budget: '',
      decisionMaker: safeGet(data, 'SubContactDetails.ContactName'),
      timeframe: '',
      competitors: '',
      nextSteps: safeGet(data, 'NextStep'),
      lastActivity: safeGet(data, 'LastActivity'),
      territory: '',
      campaign: safeGet(data, 'Source'),
      referralSource: '',
      productInterest: getProductValues(data)[0] || '',
      painPoints: '',
      currentSolution: '',
      decisionCriteria: '',
      implementationDate: '',
      contractLength: '',
      renewalDate: '',
      lostReason: safeGet(data, 'OppLossReasonDetails.Name'),
      winReason: '',
      tags: '',
      notes: safeGet(data, 'Notes'),
      forecastRevenue: safeGet(data, 'Amount', ''),
      lossReasonDetails: {
        ID: safeGet(data, 'OppLossReasonDetails.ID'),
        Name: safeGet(data, 'OppLossReasonDetails.Name')
      },
      contactDetails: {
        ID: safeGet(data, 'SubContactDetails.ID'),
        Name: safeGet(data, 'SubContactDetails.ContactFullName') || safeGet(data, 'SubContactDetails.ContactName')
      }
    };
  }
  // Get proposals based on opportunity criteria
  async getProposalsBasedOnOpportunity(type: string, searchParams: any): Promise<any[]> {
    try {
      const response = await axiosService.post(API_URLS.PROPOSALS.BY_CRITERIA, searchParams);
      
      if (response?.content && Array.isArray(response.content.List)) {
        return response.content.List;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch proposals based on opportunity:', error);
      throw error;
    }
  }

  // Search and reporting functionality (from opportunitiesService.js)
  async getOpportunities(filters: any = {}): Promise<any> {
    // Filter out UI-specific parameters that shouldn't be sent to API
    const { fromAdvancedSearch: FROM_ADV, ...apiFilters } = filters;

    // Use searchParams (apiFilters) for mapping payload fields
    const searchParams = apiFilters;

    // Handle opportunity name special values
    let oppNameValue = "";
    if (searchParams.opportunityNameBasic) {
      // For Proposals tab, use the exact value for special selections
      if (searchParams.opportunityName === 'IN=Is Empty~' || searchParams.opportunityName === 'INN=Is Not Empty~') {
        oppNameValue = searchParams.opportunityNameBasic;
      } else {
        // Concatenate if it's an array, otherwise use as-is
        oppNameValue = Array.isArray(searchParams.opportunityNameBasic) ?
          searchParams.opportunityNameBasic.join('') :
          searchParams.opportunityNameBasic;
      }
    } else if (searchParams.opportunityName) {
      // For Opportunities tab, use the exact value for special selections
      if (searchParams.opportunityNameBasic === 'IN=Is Empty~' || searchParams.opportunityNameBasic === 'INN=Is Not Empty~') {
        oppNameValue = searchParams.opportunityName;
      } else {
        // Concatenate if it's an array, otherwise use as-is
        oppNameValue = Array.isArray(searchParams.opportunityName) ?
          searchParams.opportunityName.join('') :
          searchParams.opportunityName;
      }
    }

    // Format Company Name with SW= prefix for search
    let customerNameValue = "";
    if (searchParams.companyNameBasic) {
      customerNameValue = searchParams.companyNameBasic;
    } else if (searchParams.companyName) {
      customerNameValue = searchParams.companyName;
    } else if (searchParams.customerName) {
      customerNameValue = searchParams.customerName;
    }

    // Process probability value for backend
    const probabilityValue = processProbabilityValue(searchParams.probability);

    // Format Email with SW= prefix for search (like company name)
    let emailValue = "";
    if (searchParams.contactEmail) {
      // Split by comma and format each value with SW= prefix and ~ suffix
      const values = Array.isArray(searchParams.contactEmail)
        ? searchParams.contactEmail
        : String(searchParams.contactEmail).split(',').filter(v => v.trim());
      emailValue = values.map((v: string) => `SW=${v.trim()}~`).join('');
    }

    const requestPayload = {
      ActualCloseFrom: formatDate(searchParams.actualCloseFrom) || formatDate(searchParams.actualCloseDate) || formatDate(searchParams.actualCloseDateFrom) || "",
      ActualCloseTo: formatDate(searchParams.actualCloseTo) || formatDate(searchParams.actualCloseDateTo) || "",
      ApprovalStatus: null,
      Arth: searchParams.arth || "  ",
      AssignedTo: searchParams.assignedRepId ? searchParams.assignedRepId.toString() : (searchParams.assignedRep && searchParams.assignedRep !== "All Reps" ? (Array.isArray(searchParams.assignedRep) ? getIcodeFromArray(searchParams.assignedRep) : searchParams.assignedRep) : ""),
      BusinessUnit: searchParams.businessUnit ? getIcodeFromArray(Array.isArray(searchParams.businessUnit) ? searchParams.businessUnit : String(searchParams.businessUnit).split(',').map(v => v.trim()).filter(v => v)) : "",
      CloseFrom: formatDate(searchParams.closeFrom) || formatDate(searchParams.estimatedCloseDate) || "",
      CloseTo: formatDate(searchParams.closeTo) || "",
      CreatedBy: searchParams.createdRep ? getIcodeFromArray(Array.isArray(searchParams.createdRep) ? searchParams.createdRep : String(searchParams.createdRep).split(',').map(v => v.trim()).filter(v => v)) : "",
      CreatedFrom: formatDate(searchParams.createdFrom) || formatDate(searchParams.createdDateFrom) || "",
      CreatedTo: formatDate(searchParams.createdTo) || formatDate(searchParams.createdDateTo) || "",
      CustomerName: customerNameValue,
      LeadQuality: null,
      ListId: searchParams.ListID || 0,
      LossReason: searchParams.lossReason || searchParams.winLossReason || "",
      OppIDs: null,
      OppName: oppNameValue,
      PageSize: 25,
      Probability: probabilityValue,
      Products: searchParams.products ? getIcodeFromArray(Array.isArray(searchParams.products) ? searchParams.products : String(searchParams.products).split(',').map(v => v.trim()).filter(v => v)) : (searchParams.product ? getIcodeFromArray(Array.isArray(searchParams.product) ? searchParams.product : String(searchParams.product).split(',').map(v => v.trim()).filter(v => v)) : ""),
      ProspectStage: null,
      ProspectingStage: -1,
      ProspectingStageFromDate: "",
      ProspectingStageToDate: "",
      Results: 0,
      SalesPresenter: searchParams.salesPresenter || searchParams.salesPresentation ? getIcodeFromArray([searchParams.salesPresenter || searchParams.salesPresentation]) : null,
      Source: searchParams.source ? getIcodeFromArray(Array.isArray(searchParams.source) ? searchParams.source : String(searchParams.source).split(',').map(v => v.trim()).filter(v => v)) : (searchParams.primaryCampaign ? getIcodeFromArray([searchParams.primaryCampaign]) : ""),
      Stage: searchParams.stage ? getIcodeFromArray(Array.isArray(searchParams.stage) ? searchParams.stage : String(searchParams.stage).split(',').map(v => v.trim()).filter(v => v)) : "",
      State: searchParams.state ? getIcodeFromArray(Array.isArray(searchParams.state) ? searchParams.state : String(searchParams.state).split(',').map(v => v.trim()).filter(v => v)) : null,
      Status: searchParams.status || searchParams.quickStatus || "",
      Type: searchParams.type ? getIcodeFromArray([searchParams.type]) : "",
      UserID: getCurrentUserId(),
      WorkFlows: null,
      IDs: null,
      CustomerID: searchParams.customerID || "",
      AdvSearch: {
        UserID: "",
        CategoryID: "",
        ContactGroup: "",
        Contact: "",
        ContactIDs: "",
        Name: "",
        Agency: "",
        City: searchParams.city ? getIcodeFromArray(Array.isArray(searchParams.city) ? searchParams.city : String(searchParams.city).split(',').map(v => v.trim()).filter(v => v)) : null,
        LastContactOption: "-1",
        LastContactFromDate: "",
        LastContactToDate: "",
        Email: emailValue,
        Phone: searchParams.contactPhone || null,
        Mobile: searchParams.mobile || "",
        Priority: searchParams.priority || "",
        Country: searchParams.country ? getIcodeFromArray(Array.isArray(searchParams.country) ? searchParams.country : String(searchParams.country).split(',').map(v => v.trim()).filter(v => v)) : null,
        County: searchParams.county || "",
        Zip: searchParams.postalCode || "",
        SubContacts: -1,
        IsAgency: -1,
        CheckProductionSelected: false,
        CurrentContractID: 0,
        BusinessUnit: searchParams.businessUnit ? parseInt(searchParams.businessUnit) : -1,
        Product: searchParams.product ? parseInt(searchParams.product) : -1,
        IssueYear: -1,
        IssueID: -1,
        From: "",
        To: "",
        ContactType: searchParams.contactType || "",
        BudgetPlanningFrom: "",
        BudgetPlanningTo: "",
        CustomFieldXML: "",
        SelectedContactIDs: "",
        EmailVerificationStatus: "",
        IsQuickSearch: false,
        Activity: "",
        ActivitySalesRep: "",
        IsGifter: false,
        SubscriptionStartDateFrom: "",
        SubscriptionStartDateTo: "",
        SubscriptionEndDateFrom: "",
        SubscriptionEndDateTo: "",
        SubscriptionBusinessUnit: "",
        SubscriptionProduct: "",
        CustomerType: -1,
        IsDigitalAdsAdvertiser: -1,
        Address: searchParams.address || null,
        ContactAddedDateFrom: null,
        ContactAddedDateTo: null,
        LeadQuality: searchParams.leadQuality || null,
        LeadTypes: searchParams.leadType ? getIcodeFromArray(Array.isArray(searchParams.leadType) ? searchParams.leadType : String(searchParams.leadType).split(',').map(v => v.trim()).filter(v => v)) : null,
        ListID: 0,
        LeadSources: searchParams.leadSource ? getIcodeFromArray(Array.isArray(searchParams.leadSource) ? searchParams.leadSource : String(searchParams.leadSource).split(',').map(v => v.trim()).filter(v => v)) : null,
        ProspectingStages: null,
        WorkFlows: null,
        ProspectingStageID: -1,
        ProspectingStageFromDate: "",
        ProspectingStageToDate: "",
        LeadStatus: (() => {
          const leadStatusValue = searchParams.leadStatus || searchParams.LeadStatus || searchParams.leadstatus;
          if (leadStatusValue) {
            const processedValue = getIcodeFromArray(Array.isArray(leadStatusValue) ? leadStatusValue : String(leadStatusValue).split(',').map(v => v.trim()).filter(v => v));
            return processedValue;
          } else {
            return null;
          }
        })(),
        InActive: false,
        CampaignStatus: "",
        CampaignName: searchParams.campaign || searchParams.primaryCampaign || "",
        CampaignSubject: "",
        CampaignCreatedDateFrom: "",
        CampaignCreatedDateTo: "",
        CampaignScheduleDateFrom: "",
        CampaignScheduleDateTo: "",
        CampaignActivity: "",
        PageType: 0,
        SelectedCampaignIDs: "",
        MKMContactIds: "",
        CampaignsFrom: "",
        SubsidiaryParentCompany: "",
        ProductTags: searchParams.tags || "",
        BusinessUnitTags: ""
      },
      Action: null,
      CurPage: searchParams.CurPage !== undefined ? searchParams.CurPage : 1,
      SortBy: "",
      ListName: "Latest Search",
      ViewType: 0,
      ResultType: 1,
      ProposalRep: "",
      ProposalName: "",
      ProposalStatus: "",
      ProposalIDs: "",
      ProposalApprovalStatus: "",
      ProposalESignStatus: "",
      ProposalCreateDateRangeFrom: "",
      ProposalCreateDateRangeTo: "",
      Mode: null,
      ProposalTotalRangeFrom: "",
      ProposalTotalRangeTo: "",
      InternalApprovalStage: "",
      ListID: searchParams.ListID || 0
    };

    try {
      // Fetch opportunities data and column configuration in parallel
      const [response, columnConfigResponse] = await Promise.all([
        axiosService.post(API_URLS.OPPORTUNITIES.REPORT_ALL, requestPayload),
        this.getOpportunityColumnConfig()
      ]);

      // Handle the response structure and extract opportunities
      let opportunities = [];
      let totalCount = 0;
      let opportunityResult = {};
      let apiColumnConfig = [];

      // Extract data from axios response - the response has {responseHeader, content} structure
      const responseData = response;

      // Check if we have the nested content structure
      if (responseData && responseData.content && responseData.content.Data) {
        const contentData = responseData.content.Data;
        opportunities = contentData.Opportunities || [];
        totalCount = contentData.Total || opportunities.length;
        opportunityResult = (contentData.OpportunityResult && contentData.OpportunityResult[0]) || {};

        // Check for ColumnConfig in the main search response
        if (contentData.ColumnConfig && Array.isArray(contentData.ColumnConfig)) {
          apiColumnConfig = contentData.ColumnConfig.map((item: any) => ({
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
      } else if (responseData && responseData.Data) {
        opportunities = responseData.Data.Opportunities || [];
        totalCount = responseData.Data.Total || opportunities.length;
        opportunityResult = (responseData.Data.OpportunityResult && responseData.Data.OpportunityResult[0]) || {};

        // Check for ColumnConfig in the main search response (fallback path)
        if (responseData.Data.ColumnConfig && Array.isArray(responseData.Data.ColumnConfig)) {
          apiColumnConfig = responseData.Data.ColumnConfig.map((item: any) => ({
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
      } else if (Array.isArray(responseData)) {
        opportunities = responseData;
        totalCount = opportunities.length;
      }

      // Process column configuration from the separate API call (only if not found in search response)
      if (apiColumnConfig.length === 0 && columnConfigResponse && columnConfigResponse.content) {
        const columnData = columnConfigResponse.content;

        // Map the column configuration with proper PropertyMappingName handling
        if (Array.isArray(columnData)) {
          apiColumnConfig = columnData.map(item => ({
            id: item.PropertyMappingName ? item.PropertyMappingName.toLowerCase() : item.DBName?.toLowerCase(),
            label: item.DisplayName || item.PropertyMappingName || item.DBName,
            dbName: item.DBName,
            propertyMappingName: item.PropertyMappingName,
            isDefault: item.IsDefault,
            isRequired: item.IsRequired,
            groupBy: item.GroupBy
          }));
        }
      }

      return { opportunities, totalCount, opportunityResult, apiColumnConfig };
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
      return { opportunities: [], totalCount: 0, opportunityResult: {}, apiColumnConfig: [] };
    }
  }

  // Method to get column configuration from API for opportunities
  async getOpportunityColumnConfig(): Promise<any> {
    try {
      console.log('OpportunityService: Fetching opportunity column configuration from API');
      const response = await apiService.get(API_URLS.ADVANCED_SEARCH.RESULT_VIEW_COLUMN_OPPORTUNITIES);
      console.log('OpportunityService: Column config API response:', response);
      return response;
    } catch (error) {
      console.error('OpportunityService: Failed to fetch opportunity column config:', error);
      throw error;
    }
  }

  // Format opportunity data for table display
  formatOpportunityForTable(opportunity: any): any {
    console.log('Formatting opportunity for table:', opportunity);
    console.log('Original opportunity object keys:', Object.keys(opportunity));

    // Handle cases where opportunity might have nested structure or missing properties
    const safeGetValue = (obj: any, path: string, defaultValue: any = '') => {
      try {
        return path.split('.').reduce((current, key) => {
          if (current && typeof current === 'object' && current[key] !== undefined) {
            // Handle the MaxDepthReached structure
            if (current[key] && typeof current[key] === 'object' && current[key]._type === 'MaxDepthReached') {
              return defaultValue;
            }
            return current[key];
          }
          return defaultValue;
        }, obj);
      } catch (e) {
        console.error('Error in safeGetValue:', e);
        return defaultValue;
      }
    };

    const formatted = {
      id: opportunity.ID || Math.random().toString(),
      status: safeGetValue(opportunity, 'Status', 'Open'),
      nextStep: safeGetValue(opportunity, 'NextStep', ''),
      product: safeGetValue(opportunity, 'ProductDetails.Name', opportunity.ProductName || ''),
      opportunityName: safeGetValue(opportunity, 'Name', 'Opportunity'),
      name: safeGetValue(opportunity, 'Name', 'Opportunity'),
      companyName: safeGetValue(opportunity, 'ContactDetails.Name', opportunity.CustomerName || 'Unknown Company'),
      contactName: safeGetValue(opportunity, 'SubContactDetails.Name', opportunity.SubContactName || ''),
      assignedRep: safeGetValue(opportunity, 'AssignedTo', 'Unassigned'),
      stage: safeGetValue(opportunity, 'OppStageDetails.Stage', opportunity.Stage || 'Unknown'),
      amount: opportunity.Amount || 0,
      probability: safeGetValue(opportunity, 'Probability', ''),
      projCloseDate: opportunity.CloseDate ? new Date(opportunity.CloseDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '',
      closeDate: opportunity.CloseDate ? new Date(opportunity.CloseDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '',
      leadStatus: safeGetValue(opportunity, 'LeadStatus', ''),
      actualCloseDate: opportunity.ActualCloseDate || '',
      createdDate: opportunity.CreatedDate || '',
      description: safeGetValue(opportunity, 'Notes', opportunity.Description || ''),
      proposalId: safeGetValue(opportunity, 'ProposalID', ''),
      lossReason: safeGetValue(opportunity, 'OppLossReasonDetails.Name', opportunity.LossReasonName || ''),
      salesPresenter: safeGetValue(opportunity, 'SalesPresenter', ''),
      businessUnit: safeGetValue(opportunity, 'BusinessUnitDetails.Name', opportunity.BusinessUnit || ''),
      createdBy: safeGetValue(opportunity, 'OwnerDetails.Name', opportunity.OwnerName || ''),
      forecastRevenue: opportunity.ForecastRevenue || 0,
      opportunityType: safeGetValue(opportunity, 'OppTypeDetails.Name', opportunity.TypeName || ''),
      source: safeGetValue(opportunity, 'Source', ''),
      lastActivity: safeGetValue(opportunity, 'LastActivity.Display', opportunity.OpportunityField || ''),
      lastActivityDate: safeGetValue(opportunity, 'LastActivity.LastActivity', opportunity.ActivityField || ''),
      opportunityId: opportunity.ID,
      contactId: opportunity.ContactDetails?.ID || opportunity.gsCustomersID || opportunity.contactId,

      // Additional fields that might be used in custom columns
      leadQuality: safeGetValue(opportunity, 'LeadQuality', ''),
      leadType: safeGetValue(opportunity, 'LeadType', ''),
      leadSource: safeGetValue(opportunity, 'LeadSource', ''),
      priority: safeGetValue(opportunity, 'Priority', ''),
      territory: safeGetValue(opportunity, 'Territory', ''),
      campaign: safeGetValue(opportunity, 'Campaign', ''),
      industry: safeGetValue(opportunity, 'Industry', ''),
      revenue: opportunity.Revenue || 0,
      employees: opportunity.Employees || '',
      website: safeGetValue(opportunity, 'Website', ''),
      phone: safeGetValue(opportunity, 'Phone', ''),
      email: safeGetValue(opportunity, 'Email', ''),
      address: safeGetValue(opportunity, 'Address', ''),
      city: safeGetValue(opportunity, 'City', ''),
      state: safeGetValue(opportunity, 'State', ''),
      zipCode: safeGetValue(opportunity, 'ZipCode', ''),
      country: safeGetValue(opportunity, 'Country', ''),

      // Preserve the original ContactDetails object for proper contact ID extraction
      ContactDetails: opportunity.ContactDetails,
      SubContactDetails: opportunity.SubContactDetails,
      OppStageDetails: opportunity.OppStageDetails,
      ContactID: opportunity.ContactDetails?.ID || opportunity.ContactID,

      // Preserve stage data and other original opportunity data
      Stages: opportunity.Stages,
      stageHistory: opportunity.stageHistory,
      CreatedDate: opportunity.CreatedDate,
      ActualCloseDate: opportunity.ActualCloseDate,

      // Add proposal fields
      proposalName: safeGetValue(opportunity, 'Proposal.Name', opportunity.ProposalName || ''),
      proposalStatus: safeGetValue(opportunity, 'Proposal.Status', opportunity.ProposalStatus || ''),
      proposalApprovalStatus: safeGetValue(opportunity, 'Proposal.ApprovalStatus', opportunity.ProposalApprovalStatus || ''),
      proposalHistory: safeGetValue(opportunity, 'ProposalHistory', opportunity.ProposalHistoryIcon || ''),
      proposalESignStatus: safeGetValue(opportunity, 'Proposal.ESignature.Status', opportunity.ProposalESignStatus || ''),
      proposalContact: safeGetValue(opportunity, 'Proposal.SalesContact.Name', opportunity.ProposalContact || ''),
      proposalRep: safeGetValue(opportunity, 'Proposal.SalesRep.Name', opportunity.ProposalRep || ''),
      proposalAmount: opportunity.Proposal?.Amount || opportunity.ProposalAmount || 0,
      internalApprovalStage: safeGetValue(opportunity, 'Proposal.InternalApproval.StageName', opportunity.InternalApprovalStage || ''),

      // Map all remaining fields from the original opportunity object to ensure no data is lost
      ...Object.keys(opportunity).reduce((acc, key) => {
        // Only add fields that don't already exist in the formatted object
        if (!acc.hasOwnProperty(key) && key !== 'ContactDetails' && key !== 'SubContactDetails' && key !== 'OppStageDetails') {
          const value = opportunity[key];
          // Handle nested objects by extracting their Name or Display property if available
          if (value && typeof value === 'object' && value.Name) {
            acc[key] = value.Name;
          } else if (value && typeof value === 'object' && value.Display) {
            acc[key] = value.Display;
          } else if (value !== null && value !== undefined && typeof value !== 'object') {
            acc[key] = value;
          }
        }
        return acc;
      }, {} as any)
    };

    console.log('Formatted opportunity result:', formatted);
    console.log('Formatted opportunity keys:', Object.keys(formatted));
    return formatted;
  }

  async getFormattedOpportunities(filters: any = {}): Promise<any> {
    const { opportunities, totalCount, opportunityResult, apiColumnConfig } = await this.getOpportunities(filters);
    console.log('Raw opportunities before formatting:', opportunities);
    console.log('Raw opportunities type:', typeof opportunities);
    console.log('Is opportunities array?', Array.isArray(opportunities));

    if (!Array.isArray(opportunities)) {
      console.error('Opportunities is not an array:', opportunities);
      return { formatted: [], totalCount: 0, opportunityResult: {} };
    }

    const formatted = opportunities.map(opportunity => this.formatOpportunityForTable(opportunity));
    console.log('Formatted opportunities:', formatted);
    console.log('Formatted opportunities length:', formatted.length);
    return { opportunitiesData: formatted, totalCount, opportunityResult, apiColumnConfig };
  }

  // Kanban drag and drop stage update
  async updateOpportunityStageByDrag(opportunityId: string, stageId: number, loggedInUserId?: string): Promise<any> {
    const userId = loggedInUserId || getCurrentUserId();
    const endpoint = `/services/Opportunities/Field/PipelineStageID/${opportunityId}/0/${userId}/Insert`;
    const response = await axiosService.post(endpoint, stageId);
    return response;
  }

  // Get opportunity metadata
  async getOpportunityTypes(): Promise<any> {
    console.log('OpportunityService: Fetching opportunity types');
    const response = await axiosService.get(API_URLS.ADMIN.OPPORTUNITY_TYPES);
    console.log('OpportunityService: Opportunity Types API Response:', response);
    return response;
  }

  async getOpportunityLossReasons(): Promise<any> {
    console.log('OpportunityService: Fetching opportunity loss reasons');
    const response = await axiosService.get(API_URLS.ADMIN.OPPORTUNITY_LOSS_REASONS);
    console.log('OpportunityService: Loss Reasons API Response:', response);
    return response;
  }

  // async getOpportunityStages(): Promise<any> {
  //   console.log('OpportunityService: Fetching opportunity stages');
  //   const response = await axiosService.get(API_URLS.ADMIN.OPPORTUNITY_STAGES);
  //   console.log('OpportunityService: Stages API Response:', response);
  //   return response;
  // }

  // Toggle a stage timeline date (checkmark columns) using Insert/Delete actions
  async toggleOpportunityStageDate(opportunityId: string, stageId: number, shouldInsert: boolean): Promise<any> {
    try {
      const action = shouldInsert ? 'Insert' : 'Delete';
      const endpoint = `/services/Opportunities/Field/PipelineStageID/${opportunityId}/0/${getCurrentUserId()}/${action}`;
      console.log('OpportunityService: Toggling stage timeline date:', { opportunityId, stageId, action });
      const response = await axiosService.post(endpoint, stageId);
      return response;
    } catch (error) {
      console.error('OpportunityService: Failed to toggle stage timeline date', { opportunityId, stageId, shouldInsert, error });
      throw error;
    }
  }
}

export const opportunityService = new OpportunityService();

// Backward compatibility export
export const opportunitiesService = opportunityService;