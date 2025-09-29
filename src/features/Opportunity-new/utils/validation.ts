import { OpportunityFormData, ValidationErrors } from '../types/opportunity';
import { opportunityService } from '../services/opportunityService';
import { apiCache } from './apiCache';



// Get required fields from API with global caching
export const getRequiredFields = async (): Promise<any> => {
  return apiCache.get('requiredFields', async () => {
    try {
      const response = await opportunityService.getRequiredFields();
      return response?.content?.List || response || {};
    } catch (error) {
      console.error('Failed to fetch required fields, using defaults:', error);
      return getDefaultRequiredFields();
    }
  });
};

// Default required fields configuration (fallback)
const getDefaultRequiredFields = () => ({
  name: { required: true, minLength: 3, maxLength: 100 },
  company: { required: true, minLength: 2, maxLength: 1000 },
  status: { required: true },
  stage: { required: true },
  amount: { required: true, conditionallyRequired: 'when no proposal is linked' },
  probability: { required: true, min: 0, max: 100 },
  projCloseDate: { required: true },
  opportunityType: { required: true },
  createdBy: { required: true, minLength: 2, maxLength: 50 },
  createdDate: { required: true }
});

// Check if a field is required based on API configuration
const isFieldRequired = (fieldConfig: any, fieldName: string): boolean => {
  if (!fieldConfig) return false;
  
  // Check if field exists in API response and is marked as required
  // Handle both object format and array format
  if (Array.isArray(fieldConfig)) {
    const field = fieldConfig.find((f: any) => 
      f.FeatureName?.toLowerCase() === fieldName.toLowerCase() ||
      f.fieldName?.toLowerCase() === fieldName.toLowerCase() ||
      f.name?.toLowerCase() === fieldName.toLowerCase()
    );
    return field?.IsRequired === 2 || field?.required === true || field?.isRequired === true;
  } else {
    const field = fieldConfig[fieldName];
    return field?.IsRequired === 2 || field?.required === true || field?.isRequired === true;
  }
};

// Get field validation rules from API configuration
const getFieldRules = (fieldConfig: any, fieldName: string): any => {
  if (!fieldConfig) return {};
  
  // Handle both object format and array format
  if (Array.isArray(fieldConfig)) {
    const field = fieldConfig.find((f: any) => 
      f.FeatureName?.toLowerCase() === fieldName.toLowerCase() ||
      f.fieldName?.toLowerCase() === fieldName.toLowerCase() ||
      f.name?.toLowerCase() === fieldName.toLowerCase()
    );
    return field || {};
  } else {
    const field = fieldConfig[fieldName];
    return field || {};
  }
};

// Validation rules for opportunity form - now API-driven
export const validateRequiredFields = async (formData: OpportunityFormData): Promise<ValidationErrors> => {
  const errors: ValidationErrors = {};
  
  try {
    const requiredFieldsConfig = await getRequiredFields();
    
    // Name validation
    if (isFieldRequired(requiredFieldsConfig, 'name')) {
      if (!formData.name?.trim()) {
        errors.name = 'Opportunity name is required';
      } else {
        const rules = getFieldRules(requiredFieldsConfig, 'name');
        const minLength = rules.minLength || 3;
        const maxLength = rules.maxLength || 100;
        if (formData.name.length < minLength || formData.name.length > maxLength) {
          errors.name = `Opportunity name must be between ${minLength} and ${maxLength} characters`;
        }
      }
    }

    // Company validation
    if (isFieldRequired(requiredFieldsConfig, 'company')) {
      if (!formData.company?.trim()) {
        errors.company = 'Company name is required';
      } else {
        const rules = getFieldRules(requiredFieldsConfig, 'company');
        const minLength = rules.minLength || 2;
        const maxLength = rules.maxLength || 1000;
        if (formData.company.length < minLength || formData.company.length > maxLength) {
          errors.company = `Company name must be between ${minLength} and ${maxLength} characters`;
        }
      }
    }

    // Status validation
    if (isFieldRequired(requiredFieldsConfig, 'status')) {
      if (!formData.status?.trim()) {
        errors.status = 'Status is required';
      }
    }

    // Stage validation
    if (isFieldRequired(requiredFieldsConfig, 'stage')) {
      const stageStr = formData.stage ? String(formData.stage).trim() : '';
      if (!stageStr) {
        errors.stage = 'Stage is required';
      }
    }

    // Amount validation
    if (isFieldRequired(requiredFieldsConfig, 'amount')) {
      const amountStr = formData.amount ? String(formData.amount).trim() : '';
      if (!amountStr && !formData.proposalId) {
        errors.amount = 'Amount is required when no proposal is linked';
      } else if (amountStr && (isNaN(Number(amountStr)) || Number(amountStr) < 0 || Number(amountStr) > 999999999)) {
        errors.amount = 'Amount must be a valid number between 0 and 999,999,999';
      }
    }

    // Probability validation
    if (isFieldRequired(requiredFieldsConfig, 'probability')) {
      const probabilityStr = formData.probability ? String(formData.probability).trim() : '';
      if (!probabilityStr) {
        errors.probability = 'Probability is required';
      } else if (isNaN(Number(probabilityStr)) || Number(probabilityStr) < 0 || Number(probabilityStr) > 100) {
        errors.probability = 'Probability must be between 0 and 100%';
      }
    }

    // Projected close date validation
    if (isFieldRequired(requiredFieldsConfig, 'projCloseDate')) {
      if (!formData.projCloseDate?.trim()) {
        errors.projCloseDate = 'Projected close date is required';
      } else {
        const closeDate = new Date(formData.projCloseDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fiveYearsFromNow = new Date();
        fiveYearsFromNow.setFullYear(today.getFullYear() + 5);

        if (closeDate < today) {
          errors.projCloseDate = 'Projected close date cannot be in the past';
        } else if (closeDate > fiveYearsFromNow) {
          errors.projCloseDate = 'Projected close date must be within 5 years';
        }
      }
    }

    // Opportunity type validation
    if (isFieldRequired(requiredFieldsConfig, 'opportunityType')) {
      const opportunityTypeId = formData.opportunityType?.id ? String(formData.opportunityType.id).trim() : '';
      const opportunityTypeName = formData.opportunityType?.name ? String(formData.opportunityType.name).trim() : '';

      if (!opportunityTypeId || !opportunityTypeName) {
        errors.opportunityType = 'Opportunity type is required and must have valid ID and name';
      }
    }

    // Created by validation
    if (isFieldRequired(requiredFieldsConfig, 'createdBy')) {
      if (!formData.createdBy?.trim()) {
        errors.createdBy = 'Created by is required';
      } else {
        const rules = getFieldRules(requiredFieldsConfig, 'createdBy');
        const minLength = rules.minLength || 2;
        const maxLength = rules.maxLength || 50;
        if (formData.createdBy.length < minLength || formData.createdBy.length > maxLength) {
          errors.createdBy = `Created by must be between ${minLength} and ${maxLength} characters`;
        }
      }
    }

    // Created date validation
    if (isFieldRequired(requiredFieldsConfig, 'createdDate')) {
      if (!formData.createdDate?.trim()) {
        errors.createdDate = 'Created date is required';
      }
    }

    // Conditional validations based on status and stage
    if (formData.status === 'Lost' || formData.stage === 'Closed Lost') {
      if (!formData.lostReason?.trim()) {
        errors.lostReason = 'Lost reason is required when status is Lost or stage is Closed Lost';
      }
      if (!formData.notes?.trim()) {
        errors.notes = 'Notes are required when opportunity is lost';
      }
    }

    // Business logic validations for probability alignment
    if (formData.probability === '0' && formData.status !== 'Lost') {
      errors.status = 'Status must be "Lost" when probability is 0%';
    }

    if (formData.probability === '100' && formData.status !== 'Won') {
      errors.status = 'Status must be "Won" when probability is 100%';
    }

    if (formData.status === 'Lost' && formData.probability !== '0') {
      errors.probability = 'Probability must be 0% for lost opportunities';
    }

    if (formData.status === 'Won' && formData.probability !== '100') {
      errors.probability = 'Probability must be 100% for won opportunities';
    }

    // Stage and status alignment
    if (formData.status === 'Lost' && formData.stage !== 'Closed Lost') {
      errors.stage = 'Stage must be "Closed Lost" when status is Lost';
    }

    if (formData.status === 'Won' && formData.stage !== 'Closed Won') {
      errors.stage = 'Stage must be "Closed Won" when status is Won';
    }

    if (formData.stage === 'Closed Lost' && formData.status !== 'Lost') {
      errors.status = 'Status must be "Lost" when stage is Closed Lost';
    }

    if (formData.stage === 'Closed Won' && formData.status !== 'Won') {
      errors.status = 'Status must be "Won" when stage is Closed Won';
    }

    return errors;
  } catch (error) {
    console.error('Error in validateRequiredFields:', error);
    // Fall back to synchronous validation with defaults
    return validateRequiredFieldsSync(formData);
  }
};

// Synchronous fallback validation using default rules
export const validateRequiredFieldsSync = (formData: OpportunityFormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  const defaultConfig = getDefaultRequiredFields();

  // Name validation
  if (!formData.name?.trim()) {
    errors.name = 'Opportunity name is required';
  } else if (formData.name.length < defaultConfig.name.minLength || formData.name.length > defaultConfig.name.maxLength) {
    errors.name = `Opportunity name must be between ${defaultConfig.name.minLength} and ${defaultConfig.name.maxLength} characters`;
  }

  // Company validation
  if (!formData.company?.trim()) {
    errors.company = 'Company name is required';
  } else if (formData.company.length < defaultConfig.company.minLength || formData.company.length > defaultConfig.company.maxLength) {
    errors.company = `Company name must be between ${defaultConfig.company.minLength} and ${defaultConfig.company.maxLength} characters`;
  }

  // Status validation
  if (!formData.status?.trim()) {
    errors.status = 'Status is required';
  }

  // Stage validation
  const stageStr = formData.stage ? String(formData.stage).trim() : '';
  if (!stageStr) {
    errors.stage = 'Stage is required';
  }

  // Amount validation
  const amountStr = formData.amount ? String(formData.amount).trim() : '';
  if (!amountStr && !formData.proposalId) {
    errors.amount = 'Amount is required when no proposal is linked';
  } else if (amountStr && (isNaN(Number(amountStr)) || Number(amountStr) < 0 || Number(amountStr) > 999999999)) {
    errors.amount = 'Amount must be a valid number between 0 and 999,999,999';
  }

  // Probability validation
  const probabilityStr = formData.probability ? String(formData.probability).trim() : '';
  if (!probabilityStr) {
    errors.probability = 'Probability is required';
  } else if (isNaN(Number(probabilityStr)) || Number(probabilityStr) < 0 || Number(probabilityStr) > 100) {
    errors.probability = 'Probability must be between 0 and 100%';
  }

  // Projected close date validation
  if (!formData.projCloseDate?.trim()) {
    errors.projCloseDate = 'Projected close date is required';
  } else {
    const closeDate = new Date(formData.projCloseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fiveYearsFromNow = new Date();
    fiveYearsFromNow.setFullYear(today.getFullYear() + 5);

    if (closeDate < today) {
      errors.projCloseDate = 'Projected close date cannot be in the past';
    } else if (closeDate > fiveYearsFromNow) {
      errors.projCloseDate = 'Projected close date must be within 5 years';
    }
  }

  // Opportunity type validation
  const opportunityTypeId = formData.opportunityType?.id ? String(formData.opportunityType.id).trim() : '';
  const opportunityTypeName = formData.opportunityType?.name ? String(formData.opportunityType.name).trim() : '';
  if (!opportunityTypeId || !opportunityTypeName) {
    errors.opportunityType = 'Opportunity type is required and must have valid ID and name';
  }

  // Created by validation
  if (!formData.createdBy?.trim()) {
    errors.createdBy = 'Created by is required';
  } else if (formData.createdBy.length < defaultConfig.createdBy.minLength || formData.createdBy.length > defaultConfig.createdBy.maxLength) {
    errors.createdBy = `Created by must be between ${defaultConfig.createdBy.minLength} and ${defaultConfig.createdBy.maxLength} characters`;
  }

  // Created date validation
  if (!formData.createdDate?.trim()) {
    errors.createdDate = 'Created date is required';
  }

  // Conditional validations based on status and stage
  if (formData.status === 'Lost' || formData.stage === 'Closed Lost') {
    if (!formData.lostReason?.trim()) {
      errors.lostReason = 'Lost reason is required when status is Lost or stage is Closed Lost';
    }
    if (!formData.notes?.trim()) {
      errors.notes = 'Notes are required when opportunity is lost';
    }
  }

  // Business logic validations for probability alignment
  if (formData.probability === '0' && formData.status !== 'Lost') {
    errors.status = 'Status must be "Lost" when probability is 0%';
  }

  if (formData.probability === '100' && formData.status !== 'Won') {
    errors.status = 'Status must be "Won" when probability is 100%';
  }

  if (formData.status === 'Lost' && formData.probability !== '0') {
    errors.probability = 'Probability must be 0% for lost opportunities';
  }

  if (formData.status === 'Won' && formData.probability !== '100') {
    errors.probability = 'Probability must be 100% for won opportunities';
  }

  // Stage and status alignment
  if (formData.status === 'Lost' && formData.stage !== 'Closed Lost') {
    errors.stage = 'Stage must be "Closed Lost" when status is Lost';
  }

  if (formData.status === 'Won' && formData.stage !== 'Closed Won') {
    errors.stage = 'Stage must be "Closed Won" when status is Won';
  }

  if (formData.stage === 'Closed Lost' && formData.status !== 'Lost') {
    errors.status = 'Status must be "Lost" when stage is Closed Lost';
  }

  if (formData.stage === 'Closed Won' && formData.status !== 'Won') {
    errors.status = 'Status must be "Won" when stage is Closed Won';
  }

  return errors;
};

export const validateSingleField = async (fieldName: string, value: any, formData: OpportunityFormData): Promise<string | null> => {
  const errors = await validateRequiredFields({ ...formData, [fieldName]: value });
  return errors[fieldName] || null;
};

export const validateSingleFieldSync = (fieldName: string, value: any, formData: OpportunityFormData): string | null => {
  const errors = validateRequiredFieldsSync({ ...formData, [fieldName]: value });
  return errors[fieldName] || null;
};

export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

// Helper functions for business logic validation
export const isLostReasonRequired = (status: string, stage: string): boolean => {
  return status === 'Lost' || stage === 'Closed Lost';
};

export const hasValidLostReason = (lostReason: string): boolean => {
  return lostReason?.trim().length > 0;
};

export const hasValidNotes = (notes: string): boolean => {
  return notes?.trim().length > 0;
};

// Calculate forecast revenue
export const calculateForecastRevenue = (amount: string, probability: string): string => {
  const amountNum = Number(amount || 0);
  const probabilityNum = Number(probability || 0);
  return ((amountNum * probabilityNum) / 100).toString();
};

// Business rule validation functions
export const shouldAmountBeReadOnly = (proposalId: string): boolean => {
  return !!(proposalId && String(proposalId).trim());
};

export const shouldAutoUpdateStage = (probability: string): { stage: string; status: string } | null => {
  const prob = Number(probability);
  if (prob === 0) {
    return { stage: 'Closed Lost', status: 'Lost' };
  }
  if (prob === 100) {
    return { stage: 'Closed Won', status: 'Won' };
  }
  return null;
};

export const shouldAutoUpdateProbability = (status: string): string | null => {
  if (status === 'Lost') return '0';
  if (status === 'Won') return '100';
  return null;
};

export const isValidProbabilityForStatus = (probability: string, status: string): boolean => {
  const prob = Number(probability);
  if (status === 'Lost' && prob !== 0) return false;
  if (status === 'Won' && prob !== 100) return false;
  if (status === 'Open' && (prob === 0 || prob === 100)) return false;
  return true;
};

export const isValidStageForStatus = (stage: string, status: string): boolean => {
  if (status === 'Lost' && stage !== 'Closed Lost') return false;
  if (status === 'Won' && stage !== 'Closed Won') return false;
  if (stage === 'Closed Lost' && status !== 'Lost') return false;
  if (stage === 'Closed Won' && status !== 'Won') return false;
  return true;
};

export const validateDateRange = (dateString: string): { isValid: boolean; error?: string } => {
  if (!dateString) return { isValid: false, error: 'Date is required' };

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fiveYearsFromNow = new Date();
  fiveYearsFromNow.setFullYear(today.getFullYear() + 5);

  if (date < today) {
    return { isValid: false, error: 'Date cannot be in the past' };
  }

  if (date > fiveYearsFromNow) {
    return { isValid: false, error: 'Date must be within 5 years' };
  }

  return { isValid: true };
};