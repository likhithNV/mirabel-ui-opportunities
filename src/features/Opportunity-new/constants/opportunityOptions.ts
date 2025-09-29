import { session } from "@/utils/session";
// Constants for opportunity form options
export const OPPORTUNITY_STATUS_OPTIONS = [
  { value: 'Open', label: 'Open' },
  { value: 'Won', label: 'Won' },
  { value: 'Lost', label: 'Lost' }
];

export const OPPORTUNITY_PROBABILITY_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '10', label: '10%' },
  { value: '20', label: '20%' },
  { value: '30', label: '30%' },
  { value: '40', label: '40%' },
  { value: '50', label: '50%' },
  { value: '60', label: '60%' },
  { value: '70', label: '70%' },
  { value: '80', label: '80%' },
  { value: '90', label: '90%' },
  { value: '100', label: '100%' }
];

export const OPPORTUNITY_PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' }
];

export const OPPORTUNITY_LEAD_SOURCES = [
  { value: 'Website', label: 'Website' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Cold Call', label: 'Cold Call' },
  { value: 'Email Campaign', label: 'Email Campaign' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'Trade Show', label: 'Trade Show' },
  { value: 'Advertisement', label: 'Advertisement' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Other', label: 'Other' }
];

export const OPPORTUNITY_LEAD_TYPES = [
  { value: 'New Business', label: 'New Business' },
  { value: 'Existing Customer', label: 'Existing Customer' },
  { value: 'Renewal', label: 'Renewal' },
  { value: 'Upsell', label: 'Upsell' },
  { value: 'Cross-sell', label: 'Cross-sell' }
];

export const OPPORTUNITY_LEAD_STATUS = [
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Unqualified', label: 'Unqualified' },
  { value: 'Nurturing', label: 'Nurturing' }
];

// Default stage percentages mapping
export const STAGE_PERCENTAGES: Record<string, number> = {
  'Lead': 0,
  'Discovery': 10,
  '1st Demo': 25,
  'Proposal': 50,
  'Negotiation': 75,
  'Closed Won': 100,
  'Closed Lost': 0
};

// Stage name constants for consistency
export const STAGE_NAMES = {
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
  LEAD: 'Lead',
  DISCOVERY: 'Discovery',
  DEMO: '1st Demo',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation'
} as const;

// Helper function to find stage ID by name from loaded stages
export const findStageIdByName = (stages: Array<{ id: string, name: string }>, stageName: string): string | null => {
  const stage = stages.find(s => s.name === stageName);
  return stage ? stage.id : null;
};


export const UserId=session.UserID;
export const IsAdmin = session.IsAdmin;

// Page type enums for view configuration (based on documentation)
export const enumSavedSearchPageTypes = {
  Opportunity: 1,
  Proposal: 2
};

// Product type enums for opportunities (based on documentation)
export const enumOpportunityPageProductType = {
  Opportunities: 1,
  Proposals: 2
};

// View type enums (based on documentation)
export const enumSearchPageViews = {
  FullScreen: 0,
  KanBan: 1,
  SplitScreen: 2
};

// Extracted dropdown options for better maintainability with industry standards
export const OPPORTUNITY_OPTIONS = {
  status: [
    { value: "Open", label: "Open" },
    { value: "Won", label: "Won" },
    { value: "Lost", label: "Lost" }
  ],
  stage: ["Lead", "Qualification", "Discovery", "Proposal", "Negotiation", "Closed Won", "Closed Lost"],
  rep: ["Courtney Karp", "Michael Scott", "Jim Halpert", "Pam Beesly", "Dwight Schrute", "Angela Martin", "Stanley Hudson", "Phyllis Vance"],
  source: [
    { value: "CK Outbound", label: "CK Outbound" },
    { value: "Inbound", label: "Inbound" },
    { value: "Referral", label: "Referral" },
    { value: "Cold Call", label: "Cold Call" },
    { value: "Website", label: "Website" },
    { value: "Trade Show", label: "Trade Show" },
    { value: "Email Campaign", label: "Email Campaign" },
    { value: "Social Media", label: "Social Media" },
    { value: "Partner", label: "Partner" },
    { value: "Direct Mail", label: "Direct Mail" }
  ],
  leadType: ["New Business", "Existing Client", "Upsell", "Cross-sell", "Renewal", "Expansion", "Replacement"],
  leadStatus: ["New", "Contacted", "Qualified", "Unqualified", "Nurturing", "Converted", "Disqualified", "Follow-up Required"],
  priority: [
    { value: "Critical", label: "Critical" },
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" }
  ],
  industry: [
    "Technology", "Software", "Healthcare", "Finance", "Banking", "Insurance", 
    "Manufacturing", "Automotive", "Retail", "E-commerce", "Education", "Government", 
    "Non-profit", "Real Estate", "Construction", "Energy", "Utilities", "Telecommunications", 
    "Media", "Entertainment", "Transportation", "Logistics", "Agriculture", "Hospitality", 
    "Food & Beverage", "Pharmaceutical", "Biotechnology", "Legal Services", "Consulting", "Other"
  ],
  companySize: [
    { value: "Startup (1-10)", label: "Startup (1-10)" },
    { value: "Small (11-50)", label: "Small (11-50)" },
    { value: "Medium (51-200)", label: "Medium (51-200)" },
    { value: "Large (201-1000)", label: "Large (201-1000)" },
    { value: "Enterprise (1000+)", label: "Enterprise (1000+)" },
    { value: "Fortune 500", label: "Fortune 500" }
  ],
  timeframe: [
    { value: "Immediate (0-30 days)", label: "Immediate (0-30 days)" },
    { value: "Short-term (1-3 months)", label: "Short-term (1-3 months)" },
    { value: "Medium-term (3-6 months)", label: "Medium-term (3-6 months)" },
    { value: "Long-term (6-12 months)", label: "Long-term (6-12 months)" },
    { value: "Extended (12+ months)", label: "Extended (12+ months)" },
    { value: "No Timeline", label: "No Timeline" }
  ],
  territory: [
    { value: "North America", label: "North America" },
    { value: "Europe", label: "Europe" },
    { value: "Asia Pacific", label: "Asia Pacific" },
    { value: "Latin America", label: "Latin America" },
    { value: "Middle East", label: "Middle East" },
    { value: "Africa", label: "Africa" },
    { value: "North", label: "North" },
    { value: "South", label: "South" },
    { value: "East", label: "East" },
    { value: "West", label: "West" },
    { value: "Central", label: "Central" },
    { value: "National", label: "National" },
    { value: "International", label: "International" }
  ],
  contractLength: ["Month-to-Month", "3 months", "6 months", "1 year", "2 years", "3 years", "Multi-year", "Custom Term"],
  state: ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"],
  opportunityType: ["New Business", "Renewal", "Expansion", "Upsell", "Cross-sell", "Replacement", "Competitive Displacement", "Partnership"],
  businessUnit: ["Sales", "Marketing", "IT", "Operations", "Finance", "HR", "Customer Success", "Product", "Engineering", "Business Development"],
  product: [
    "Enterprise Software", "SaaS Platform", "CRM Solution", "ERP System", "Analytics Platform", 
    "Consulting Services", "Support Package", "Training Services", "Custom Development", 
    "Integration Services", "Cloud Services", "Security Solutions", "Mobile App", "API Platform"
  ],
  // Enhanced dropdown options for sales process
  competitor: [
    { value: "Salesforce", label: "Salesforce" },
    { value: "HubSpot", label: "HubSpot" },
    { value: "Microsoft Dynamics", label: "Microsoft Dynamics" },
    { value: "Oracle", label: "Oracle" },
    { value: "SAP", label: "SAP" },
    { value: "Pipedrive", label: "Pipedrive" },
    { value: "Zoho", label: "Zoho" },
    { value: "Monday.com", label: "Monday.com" },
    { value: "Airtable", label: "Airtable" },
    { value: "ServiceNow", label: "ServiceNow" },
    { value: "Workday", label: "Workday" },
    { value: "Adobe", label: "Adobe" },
    { value: "Amazon", label: "Amazon" },
    { value: "Google", label: "Google" },
    { value: "IBM", label: "IBM" },
    { value: "Competitor A", label: "Competitor A" },
    { value: "Competitor B", label: "Competitor B" },
    { value: "Competitor C", label: "Competitor C" },
    { value: "In-house Solution", label: "In-house Solution" },
    { value: "Other", label: "Other" },
    { value: "None", label: "None" }
  ],
  solution: [
    { value: "Legacy System", label: "Legacy System" },
    { value: "Manual Process", label: "Manual Process" },
    { value: "Excel Spreadsheets", label: "Excel Spreadsheets" },
    { value: "Competitor Product", label: "Competitor Product" },
    { value: "In-house Solution", label: "In-house Solution" },
    { value: "No Current Solution", label: "No Current Solution" },
    { value: "Multiple Tools", label: "Multiple Tools" },
    { value: "Paper-based Process", label: "Paper-based Process" },
    { value: "Outdated Software", label: "Outdated Software" },
    { value: "Third-party Service", label: "Third-party Service" }
  ],
  decisionCriteria: [
    { value: "Price/Cost", label: "Price/Cost" },
    { value: "ROI/Value", label: "ROI/Value" },
    { value: "Features/Functionality", label: "Features/Functionality" },
    { value: "Ease of Use", label: "Ease of Use" },
    { value: "Implementation Time", label: "Implementation Time" },
    { value: "Support Quality", label: "Support Quality" },
    { value: "Security", label: "Security" },
    { value: "Scalability", label: "Scalability" },
    { value: "Integration Capabilities", label: "Integration Capabilities" },
    { value: "Vendor Reputation", label: "Vendor Reputation" },
    { value: "References", label: "References" },
    { value: "Compliance", label: "Compliance" },
    { value: "Training Requirements", label: "Training Requirements" },
    { value: "Customization Options", label: "Customization Options" }
  ],
  nextStep: [
    { value: "Schedule Demo", label: "Schedule Demo" },
    { value: "Send Proposal", label: "Send Proposal" },
    { value: "Follow-up Call", label: "Follow-up Call" },
    { value: "Technical Review", label: "Technical Review" },
    { value: "Security Review", label: "Security Review" },
    { value: "Contract Review", label: "Contract Review" },
    { value: "Implementation Planning", label: "Implementation Planning" },
    { value: "Final Approval", label: "Final Approval" },
    { value: "Budget Approval", label: "Budget Approval" },
    { value: "Stakeholder Meeting", label: "Stakeholder Meeting" },
    { value: "Pilot Program", label: "Pilot Program" },
    { value: "Reference Call", label: "Reference Call" },
    { value: "ROI Analysis", label: "ROI Analysis" },
    { value: "Pricing Discussion", label: "Pricing Discussion" }
  ],
  campaign: [
    "Q1 2024 Campaign", "Q2 2024 Campaign", "Q3 2024 Campaign", "Q4 2024 Campaign",
    "Digital Marketing", "Trade Show", "Webinar Series", "Email Campaign", "Partner Campaign", 
    "Content Marketing", "SEO Campaign", "Social Media", "Direct Mail", "Industry Event", "Other"
  ],
  referral: [
    { value: "Partner Network", label: "Partner Network" },
    { value: "Existing Customer", label: "Existing Customer" },
    { value: "Employee Referral", label: "Employee Referral" },
    { value: "Industry Contact", label: "Industry Contact" },
    { value: "LinkedIn Connection", label: "LinkedIn Connection" },
    { value: "Professional Network", label: "Professional Network" },
    { value: "Consultant", label: "Consultant" },
    { value: "Vendor", label: "Vendor" },
    { value: "Conference Contact", label: "Conference Contact" },
    { value: "Social Media", label: "Social Media" },
    { value: "Website", label: "Website" },
    { value: "Other", label: "Other" }
  ],
  winReason: [
    { value: "Best Price", label: "Best Price" },
    { value: "Superior Features", label: "Superior Features" },
    { value: "Excellent Support", label: "Excellent Support" },
    { value: "Quick Implementation", label: "Quick Implementation" },
    { value: "Strong References", label: "Strong References" },
    { value: "Existing Relationship", label: "Existing Relationship" },
    { value: "Best ROI", label: "Best ROI" },
    { value: "Better Security", label: "Better Security" },
    { value: "Easier Integration", label: "Easier Integration" },
    { value: "Vendor Reputation", label: "Vendor Reputation" },
    { value: "Customization Capabilities", label: "Customization Capabilities" },
    { value: "Scalability", label: "Scalability" }
  ],
  lossReason: [
    { value: "Price Too High", label: "Price Too High" },
    { value: "Missing Features", label: "Missing Features" },
    { value: "Chose Competitor", label: "Chose Competitor" },
    { value: "No Budget", label: "No Budget" },
    { value: "Project Cancelled", label: "Project Cancelled" },
    { value: "Poor Timing", label: "Poor Timing" },
    { value: "Lost to Status Quo", label: "Lost to Status Quo" },
    { value: "Implementation Concerns", label: "Implementation Concerns" },
    { value: "Security Issues", label: "Security Issues" },
    { value: "Integration Challenges", label: "Integration Challenges" },
    { value: "Support Concerns", label: "Support Concerns" },
    { value: "Vendor Concerns", label: "Vendor Concerns" },
    { value: "Other", label: "Other" }
  ],
  confidence: [
    { value: "10%", label: "10%" },
    { value: "20%", label: "20%" },
    { value: "30%", label: "30%" },
    { value: "40%", label: "40%" },
    { value: "50%", label: "50%" },
    { value: "60%", label: "60%" },
    { value: "70%", label: "70%" },
    { value: "80%", label: "80%" },
    { value: "90%", label: "90%" },
    { value: "100%", label: "100%" }
  ],
  probability: [
    { value: '0', label: '0%' },
    { value: '10', label: '10%' },
    { value: '20', label: '20%' },
    { value: '30', label: '30%' },
    { value: '40', label: '40%' },
    { value: '50', label: '50%' },
    { value: '60', label: '60%' },
    { value: '70', label: '70%' },
    { value: '80', label: '80%' },
    { value: '90', label: '90%' },
    { value: '100', label: '100%' }
  ]
  
};
