import React, { useState, useEffect } from 'react';
import apiService from '@/features/Opportunity-new/services/apiService';
import reportsViewsService from '@/features/Opportunity-new/Services/ReportsViewsService';

export const useSavedViews = (refreshKey = 0, pageType = "opportunities") => {
  const [savedViews, setSavedViews] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchSavedViews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`useSavedViews: Fetching saved views for ${pageType}...`);
        
        let response;
        if (pageType === "proposals") {
          response = await apiService.getProposalViews();
        } else if (pageType === "reports" || pageType === "rep-performance") {
          // Use the mock reports service for both reports and rep-performance pages
          const result = await reportsViewsService.getViews(pageType);
          if (result.success) {
            response = { content: { Status: 'Success', List: result.data } };
          } else {
            throw new Error('Failed to fetch reports views');
          }
        } else {
          response = await apiService.getSavedViews();
        }
        
        console.log(`useSavedViews: Raw API response for ${pageType}:`, response);
        
        if (response?.content?.Status === 'Success' && response?.content?.List) {
          console.log(`useSavedViews: Successfully parsed ${pageType} views:`, response.content.List);
          console.log(`useSavedViews: Number of ${pageType} views:`, response.content.List.length);
          setSavedViews(response.content.List);
        } else {
          console.warn(`useSavedViews: Invalid response format or no ${pageType} views found:`, response);
          setSavedViews([]);
        }
      } catch (err) {
        console.error(`useSavedViews: Failed to fetch ${pageType} views:`, err);
        setError(err.message);
        setSavedViews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedViews();
  }, [refreshKey, pageType]);

  console.log(`useSavedViews: Current state for ${pageType} - savedViews:`, savedViews, 'isLoading:', isLoading, 'error:', error);

  return { savedViews, isLoading, error };
};