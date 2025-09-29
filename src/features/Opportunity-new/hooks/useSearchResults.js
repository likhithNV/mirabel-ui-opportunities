import { useState, useEffect, useCallback, useRef } from 'react';
import { opportunitiesReportService } from '../services/opportunitiesReportService';
import { proposalsReportService } from '../services/proposalsReportService';
import { searchPayloadBuilder } from '../services/searchPayloadBuilder';
import { logger } from '../../../components/shared/logger';
import { userServiceNew } from '../services/userServiceNew';

export const useSearchResults = (searchParams, searchType = 'opportunities') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use refs to prevent infinite loops
  const isInitialMount = useRef(true);
  const lastSearchParamsRef = useRef();

  const fetchResults = useCallback(async (params, newParams=null) => {
    setLoading(true);
    setError(null);

    try {
      let results;
      
      // Choose the appropriate service based on search type
      const service = searchType === 'proposals' ? proposalsReportService : opportunitiesReportService;
      
      logger.info(`useSearchResults: Using ${searchType} service`);

      // If quick overrides (newParams) are provided, build default payload with overrides
      if (newParams && Object.keys(newParams).length > 0) {
        logger.info('useSearchResults: Using quick filter overrides');
        results = await service.getInitialData(newParams);
      } else if (!params || Object.keys(params).length === 0) {
        logger.info('useSearchResults: No search params, fetching initial data');
        results = await service.getInitialData(newParams);
      } else {
        if (searchType === 'proposals') {
          // For proposals, use the service's default payload for now
          // TODO: Update this to use searchPayloadBuilder when filter mapping is ready
          logger.info('useSearchResults: Using default proposals payload');
          const apiPayload = searchPayloadBuilder.buildPayload(params, searchType);
          logger.info('useSearchResults: Executing search with API payload:', apiPayload);
          await userServiceNew.saveSearch({
            apiPayload: apiPayload
          });
          results = await service.executeSearch(apiPayload);
        } else {
          logger.info('useSearchResults: Converting form data to API payload');
          // Convert form data to proper API payload
          const apiPayload = searchPayloadBuilder.buildPayload(params, searchType);
          logger.info('useSearchResults: Executing search with API payload:', apiPayload);
          try {
            await userServiceNew.saveSearch({ apiPayload });
          } catch (e) {
            logger.warn('useSearchResults: saveSearch failed, continuing to execute search', e);
          }
          results = await service.executeSearch(apiPayload);
        }
      }

      logger.info('useSearchResults: Results received:', results);
      setData(results);
    } catch (err) {
      logger.error('useSearchResults: Error fetching results:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [searchType]);

  useEffect(() => {
    // Convert searchParams to string for comparison
    const currentParamsString = JSON.stringify(searchParams || {});
    const lastParamsString = JSON.stringify(lastSearchParamsRef.current || {});

    // Only fetch if this is the initial mount or if params actually changed
    if (isInitialMount.current || currentParamsString !== lastParamsString) {
      isInitialMount.current = false;
      lastSearchParamsRef.current = searchParams;
      fetchResults(searchParams);
    }
  }, [searchParams, fetchResults]);

  // No cleanup needed since we removed AbortController

  const refetch = useCallback((newParams=null) => {
    fetchResults(searchParams, newParams);
  }, [fetchResults, searchParams]);

  return {
    data,
    loading,
    error,
    refetch
  };
};