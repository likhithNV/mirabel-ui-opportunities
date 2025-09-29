import { useState, useEffect } from 'react';
import { getRequiredFields } from '../utils/validation';

interface RequiredFieldConfig {
  [fieldName: string]: {
    required?: boolean;
    isRequired?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export const useRequiredFields = () => {
  const [requiredFields, setRequiredFields] = useState<RequiredFieldConfig>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequiredFields = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const config = await getRequiredFields();

        setRequiredFields(config);
      } catch (err) {
        console.error('Failed to load required fields:', err);
        setError('Failed to load required fields configuration');

        // Set default required fields as fallback
        setRequiredFields({
          name: { required: true, minLength: 3, maxLength: 100 },
          company: { required: true, minLength: 2, maxLength: 1000 },
          status: { required: true },
          stage: { required: true },
          amount: { required: true },
          probability: { required: true, min: 0, max: 100 },
          projCloseDate: { required: true },
          opportunityType: { required: true },
          createdBy: { required: true, minLength: 2, maxLength: 50 },
          createdDate: { required: true }
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRequiredFields();
  }, []);

  const isFieldRequired = (fieldName: string): boolean => {
    if (!requiredFields) return false;
  

    // Handle both object format and array format
    if (Array.isArray(requiredFields)) {
      const field = requiredFields.find((f: any) =>
        f.FeatureName?.toLowerCase() === fieldName.toLowerCase()
      );
      return field?.IsRequired === 2;
    } else {

      return false;
    }
  };

  const getFieldRules = (fieldName: string) => {
    if (!requiredFields) return {};

    // Handle both object format and array format
    if (Array.isArray(requiredFields)) {
      const field = requiredFields.find((f: any) =>
        f.FeatureName?.toLowerCase() === fieldName.toLowerCase() ||
        f.fieldName?.toLowerCase() === fieldName.toLowerCase() ||
        f.name?.toLowerCase() === fieldName.toLowerCase()
      );
      return field || {};
    } else {
      const field = requiredFields[fieldName];
      return field || {};
    }
  };

  return {
    requiredFields,
    isLoading,
    error,
    isFieldRequired,
    getFieldRules
  };
};