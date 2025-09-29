// TypeScript types for the new Opportunity implementation
export interface OpportunityFormData {
  opportunityId: string;
  proposalId: string;
  proposalName: string;
  name: string;
  company: string;
  contactName: string;
  status: 'Open' | 'Won' | 'Lost' | 'Draft';
  stage: string;
  stageDetails: {
    ID?: number;
    Stage?: string;
    PercentClosed?: number;
  };
  amount: string;
  probability: string;
  stagePercentage: string;
  opportunityType: {
    id: string;
    name: string;
  };
  opportunityTypeId: string;
  businessUnit: string[];
  businessUnitId: string[];
  businessUnitDetails: Array<{
    ID: number;
    Name: string;
  }>;
  product: string[];
  productId: string[];
  productDetails: Array<{
    ID: number;
    Name: string;
  }>;
  primaryCampaignSource: string;
  assignedRep: string;
  assignedRepDetails: {
    ID?: number;
    Name?: string;
  };
  createdBy: string;
  
  leadSource: string;
  leadType: string;
  leadStatus: string;
  salesPresentation: string;
  salesPresenterDetails: {
    ID?: number;
    Name?: string;
  };
  projCloseDate: string;
  actualCloseDate: string;
  createdDate: string;
  description: string;
  priority: string;
  location: string;
  remote: boolean;
  industry: string;
  companySize: string;
  budget: string;
  decisionMaker: string;
  timeframe: string;
  competitors: string;
  nextSteps: string;
  lastActivity: string;
  territory: string;
  campaign: string;
  referralSource: string;
  productInterest: string;
  painPoints: string;
  currentSolution: string;
  decisionCriteria: string;
  implementationDate: string;
  contractLength: string;
  renewalDate: string;
  lostReason: string;
  winReason: string;
  tags: string;
  notes: string;
  forecastRevenue: string;
  lossReasonDetails: {
    ID?: number;
    Name?: string;
  };
  contactDetails: {
    ID?: number;
    Name?: string;
  };
  customerId?: string;
  source: string | null | undefined| "";
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface StatusConfirmDialog {
  isOpen: boolean;
  newStatus: string | null;
  pendingChange: any;
}

export interface OpportunityOption {
  value: string;
  label: string;
  id?: string | number;
}

export interface ApiStage {
  ID: number;
  Stage: string;
  PercentClosed: number;
}

export interface ApiOpportunityType {
  ID: number;
  Name: string;
}

export interface ApiUser {
  ID: number;
  Name: string;
  SalesRepName?: string;
}

export interface ApiBusinessUnit {
  ID: number;
  Name: string;
}

export interface ApiProduct {
  ID: number;
  Name: string;
}

export interface ApiLossReason {
  ID: number;
  Name: string;
}

export interface ApiContact {
  ID: number;
  Name: string;
  ContactFullName?: string;
  ContactName?: string;
}

export interface OpportunityFormProps {
  opportunityId?: string;
  isAddMode?: boolean;
}

export interface TabProps {
  formData: OpportunityFormData;
  handleInputChange: (field: string, value: any) => void;
  handleBatchInputChange: (updates: Partial<OpportunityFormData>) => void;
  opportunityId?: string;
  isAddMode?: boolean;
  getFieldError: (fieldName: string) => string | null;
  hasSubmitted: boolean;
}