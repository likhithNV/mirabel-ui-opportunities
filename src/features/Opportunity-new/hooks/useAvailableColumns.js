
import { useState, useEffect } from 'react';
import apiService from '@/features/Opportunity-new/Services/apiService';

export const useAvailableColumns = (shouldUseApi = true, pageType = "opportunities") => {
  const [availableColumns, setAvailableColumns] = useState([]);
  const [columnsByGroup, setColumnsByGroup] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shouldUseApi) {
      setIsLoading(false);
      return;
    }

    const fetchAvailableColumns = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let response;
        if (pageType === "proposals") {
          console.log('Fetching available columns for proposals...');
          response = await apiService.getProposalAvailableColumns();
        } else {
          console.log('Fetching available columns for opportunities...');
          response = await apiService.getAvailableColumns();
        }
        
        console.log(`Available columns API response for ${pageType}:`, response);
        
        if (response?.content?.Status === 'Success' && response?.content?.List) {
          const columns = response.content.List;
          console.log(`Parsed ${pageType} columns:`, columns);
          setAvailableColumns(columns);
          
          // Group columns by GroupBy property
          const grouped = columns.reduce((acc, column) => {
            const group = column.GroupBy || 'Standard Fields';
            if (!acc[group]) {
              acc[group] = [];
            }
            acc[group].push(column);
            return acc;
          }, {});
          
          console.log(`Grouped ${pageType} columns:`, grouped);
          setColumnsByGroup(grouped);
        } else {
          console.warn(`Invalid response format for ${pageType} columns:`, response);
          setAvailableColumns([]);
          setColumnsByGroup({});
        }
      } catch (err) {
        console.error(`Failed to fetch ${pageType} available columns:`, err);
        setError(err.message);
        setAvailableColumns([]);
        setColumnsByGroup({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableColumns();
  }, [shouldUseApi, pageType]);

  return { availableColumns, columnsByGroup, isLoading, error };
};
