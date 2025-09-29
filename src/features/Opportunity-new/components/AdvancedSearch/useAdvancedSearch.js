
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOpportunitySearch } from "@OpportunityContexts/OpportunitySearchContext";
import { useProposalSearch } from "@OpportunityContexts/ProposalSearchContext";
import { buildSearchJson, getSearchSummary, validateSearchJson } from "../../utils/searchJsonBuilder";
import { userService } from "../../services/userService";

export const useOpportunityAdvancedSearch = () => {
  const [openAccordions, setOpenAccordions] = useState(["primary-fields"]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("opportunities");
  const [isSearching, setIsSearching] = useState(false);
  const [searchJSON, setSearchJSON] = useState(null); // Real-time searchJSON
  const [isLoadingRecentSearch, setIsLoadingRecentSearch] = useState(false);
  const [hasLoadedRecentSearch, setHasLoadedRecentSearch] = useState(false);
  const [componentMounted, setComponentMounted] = useState(false);
  const navigate = useNavigate();
  const { activeFilters, updateFilters, clearAllFilters } = useOpportunitySearch();
  const searchParams = activeFilters;
  const opportunitiesItems = ["primary-fields", "sales-pipeline", "financial-commercial", "opportunity-details", "account-company", "contact-info", "product-solution", "geographic-territory"];

  // Component mount effect
  useEffect(() => {
    console.log('🚀 Opportunity Advanced Search component mounted');
    setComponentMounted(true);
    setHasLoadedRecentSearch(false); // Reset flag on mount
    setSearchJSON(null); // Clear any existing search JSON
    setOpenAccordions(["primary-fields"]); // Reset accordions to default
    setIsExpanded(false); // Reset expansion state
  }, []);

  // Monitor searchParams changes to ensure context is updated
  useEffect(() => {
    console.log('📊 Opportunity searchParams changed:', searchParams);
    console.log('📊 Number of opportunity searchParams keys:', Object.keys(searchParams).length);
  }, [searchParams]);

  // Load recent search data when component mounts or when filters are cleared
  useEffect(() => {
    const loadRecentSearch = async () => {
      try {
        setIsLoadingRecentSearch(true);
        console.log('🔄 Loading recent search data for opportunities...');
        console.log('📊 Current searchParams before API call:', searchParams);

        const recentSearchResult = await userService.getRecentSearchData();

        console.log('📥 API Response received:', recentSearchResult);

        if (recentSearchResult.success && recentSearchResult.searchParams) {
          console.log('✅ Recent search data loaded for opportunities:', recentSearchResult.searchParams);

          // Update the filters with the recent search data in searchParams format
          console.log('🔄 Updating context with API data...');
          updateFilters(recentSearchResult.searchParams, { updateUrl: false });

          // Build searchJSON with the loaded data
          console.log('🔧 Building searchJSON with loaded data...');
          buildSearchJSON(recentSearchResult.searchParams);

          console.log('✅ Opportunity Advanced Search: Form populated with recent search data');
          console.log('📊 Updated searchParams after API call:', recentSearchResult.searchParams);
        } else {
          console.log('⚠️ No recent search data available or failed to load for opportunities');
          console.log('📊 API Response details:', recentSearchResult);
        }
      } catch (error) {
        console.error('❌ Error loading recent search data for opportunities:', error);
      } finally {
        setIsLoadingRecentSearch(false);
        setHasLoadedRecentSearch(true);
        console.log('🏁 Finished loading recent search data');
      }
    };

    // Always load recent search data when component mounts or when filters are empty
    // This ensures we always have the latest saved search data
    console.log('🔍 Checking if should load recent search for opportunities:', {
      componentMounted,
      hasLoadedRecentSearch,
      searchParamsKeys: Object.keys(searchParams).length,
      searchParams
    });
    
    if (componentMounted && (!hasLoadedRecentSearch || Object.keys(searchParams).length === 0)) {
      console.log('🚀 Starting to load recent search data for opportunities...');
      loadRecentSearch();
    } else {
      console.log('⏭️ Skipping API call - component not mounted, already loaded, or existing filters found:', {
        componentMounted,
        hasLoadedRecentSearch,
        searchParams
      });
    }
  }, [componentMounted, hasLoadedRecentSearch]); // Depend on componentMounted and hasLoadedRecentSearch

  // Function to build searchJSON in real-time
  const buildSearchJSON = useCallback((params) => {
    const apiPayload = buildSearchJson(params, 'opportunity');
    const wrappedPayload = {
      OpportunitySearch: apiPayload,
      PageType: 1,
      IsRecentSearch: true
    };
    setSearchJSON(wrappedPayload);
    return wrappedPayload;
  }, []);

  const handleSearch = useCallback(async (e) => {
    if (e) e.preventDefault();
    try {
      setIsSearching(true); // Set loading state to prevent form refresh

      // Use existing searchJSON or build it if not available
      const currentSearchJSON = searchJSON || buildSearchJSON(searchParams);
      const apiPayload = currentSearchJSON.OpportunitySearch;

      // Validate the API payload
      const validation = validateSearchJson(apiPayload);
      if (!validation.isValid) {
        console.error('Advanced Search: Invalid API payload:', validation.errors);
        setIsSearching(false);
        return;
      }

      // Get search summary for logging
      const searchSummary = getSearchSummary(apiPayload);

      // Auto-save the search as "Latest Search" and execute search
      try {
        // Save the search with wrapped payload structure
        await userService.saveSearch({
          apiPayload: apiPayload
        });

        console.log('Advanced Search: Auto-saved search as "Latest Search"');

        // Execute search and get results
        const searchResults = await userService.executeSearchAndGetResults({
          apiPayload: apiPayload,
          resultType: 1
        });

        console.log('Advanced Search: Search results:', searchResults);

        // Navigate to opportunities page with search results
        // Don't update filters here to avoid form refresh - preserve form state
        navigate('/opportunities', {
          state: {
            apiPayload,
            searchJson: apiPayload, // Keep for backward compatibility
            fromAdvancedSearch: true,
            searchSummary,
            searchResults: searchResults.success ? searchResults : null,
            preserveFormState: true // Flag to indicate form state should be preserved
          }
        });

      } catch (saveError) {
        // Don't block the search if save fails, just log the error and continue with normal navigation
        console.warn('Advanced Search: Failed to auto-save/execute search:', saveError);

        console.log('Advanced Search: Generated API payload:', {
          apiPayload,
          summary: searchSummary,
          validation
        });

        // Navigate to opportunities page but pass API payload in state
        // Don't update filters here to avoid form refresh - preserve form state
        navigate('/opportunities', {
          state: {
            apiPayload,
            searchJson: apiPayload, // Keep for backward compatibility
            fromAdvancedSearch: true,
            searchSummary,
            preserveFormState: true // Flag to indicate form state should be preserved
          }
        });
      }

    } catch (error) {
      console.error('Advanced Search: Error during search:', error);
    } finally {
      setIsSearching(false); // Reset loading state
    }
  }, [searchParams, searchJSON, buildSearchJSON, navigate]);

  const handleClearFilters = useCallback(() => {
    clearAllFilters(); // Use clearAllFilters to preserve tab parameter
    setSearchJSON(null); // Clear searchJSON when filters are cleared
    setHasLoadedRecentSearch(false); // Reset flag to allow reloading recent search data
    setComponentMounted(false); // Reset component mounted flag
  }, [clearAllFilters]);

  const handleInputChange = useCallback((e) => {
    const updatedParams = {
      ...searchParams,
      [e.target.name]: e.target.value
    };
    updateFilters(updatedParams, { updateUrl: false });
    // Build searchJSON in real-time
    buildSearchJSON(updatedParams);
  }, [searchParams, updateFilters, buildSearchJSON]);

  const handleSelectChange = useCallback((name, value) => {
    // alert('handleSelectChange')
    const updatedParams = {
      ...searchParams,
      [name]: value
    };
    updateFilters(updatedParams, { updateUrl: false });
    // Build searchJSON in real-time
    buildSearchJSON(updatedParams);
  }, [searchParams, updateFilters, buildSearchJSON]);

  const handleToggleExpandCollapse = useCallback(() => {
    if (isExpanded) {
      setOpenAccordions([]);
      setIsExpanded(false);
    } else {
      setOpenAccordions(opportunitiesItems);
      setIsExpanded(true);
    }
  }, [isExpanded, opportunitiesItems]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  return {
    searchParams,
    openAccordions,
    setOpenAccordions,
    isExpanded,
    activeTab,
    handleSearch,
    handleClearFilters,
    handleInputChange,
    handleSelectChange,
    handleToggleExpandCollapse,
    handleTabChange,
    isSearching,
    searchJSON,
    isLoadingRecentSearch,
    tabKey: componentMounted ? 1 : 0 // Add tabKey for force re-render
  };
};
export const useProposalAdvancedSearch = () => {
  const [openAccordions, setOpenAccordions] = useState(["primary-fields"]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchJSON, setSearchJSON] = useState(null); // Real-time searchJSON
  const [isLoadingRecentSearch, setIsLoadingRecentSearch] = useState(false);
  const [hasLoadedRecentSearch, setHasLoadedRecentSearch] = useState(false);
  const [componentMounted, setComponentMounted] = useState(false);
  const navigate = useNavigate();
  const { activeFilters, updateFilters, clearAllFilters } = useProposalSearch();
  const searchParams = activeFilters;
  const proposalsItems = ["primary-fields", "opportunity-info", "contact-address-info", "proposal-info"];

  // Component mount effect
  useEffect(() => {
    console.log('🚀 Proposal Advanced Search component mounted');
    setComponentMounted(true);
    setHasLoadedRecentSearch(false); // Reset flag on mount
    setSearchJSON(null); // Clear any existing search JSON
    setOpenAccordions(["primary-fields"]); // Reset accordions to default
    setIsExpanded(false); // Reset expansion state
  }, []);

  // Monitor searchParams changes to ensure context is updated
  useEffect(() => {
    console.log('📊 Proposal searchParams changed:', searchParams);
    console.log('📊 Number of proposal searchParams keys:', Object.keys(searchParams).length);
  }, [searchParams]);

  // Load recent search data when component mounts or when filters are cleared
  useEffect(() => {
    const loadRecentSearch = async () => {
      try {
        setIsLoadingRecentSearch(true);
        console.log('🔄 Loading recent search data for proposals...');
        console.log('📊 Current searchParams before API call:', searchParams);

        const recentSearchResult = await userService.getProposalRecentSearchData();

        console.log('📥 API Response received:', recentSearchResult);

        if (recentSearchResult.success && recentSearchResult.searchParams) {
          console.log('✅ Recent search data loaded for proposals:', recentSearchResult.searchParams);

          // Update the filters with the recent search data in searchParams format
          console.log('🔄 Updating context with API data...');
          updateFilters(recentSearchResult.searchParams, { updateUrl: false });

          // Build searchJSON with the loaded data
          console.log('🔧 Building searchJSON with loaded data...');
          buildSearchJSON(recentSearchResult.searchParams);

          console.log('✅ Proposal Advanced Search: Form populated with recent search data');
          console.log('📊 Updated searchParams after API call:', recentSearchResult.searchParams);
        } else {
          console.log('⚠️ No recent search data available or failed to load for proposals');
          console.log('📊 API Response details:', recentSearchResult);
        }
      } catch (error) {
        console.error('❌ Error loading recent search data for proposals:', error);
      } finally {
        setIsLoadingRecentSearch(false);
        setHasLoadedRecentSearch(true);
        console.log('🏁 Finished loading recent search data');
      }
    };

    // Always load recent search data when component mounts or when filters are empty
    // This ensures we always have the latest saved search data
    console.log('🔍 Checking if should load recent search for proposals:', {
      componentMounted,
      hasLoadedRecentSearch,
      searchParamsKeys: Object.keys(searchParams).length,
      searchParams
    });
    
    if (componentMounted && (!hasLoadedRecentSearch || Object.keys(searchParams).length === 0)) {
      console.log('🚀 Starting to load recent search data for proposals...');
      loadRecentSearch();
    } else {
      console.log('⏭️ Skipping API call - component not mounted, already loaded, or existing filters found:', {
        componentMounted,
        hasLoadedRecentSearch,
        searchParams
      });
    }
  }, [componentMounted, hasLoadedRecentSearch]); // Depend on componentMounted and hasLoadedRecentSearch

  // Function to build searchJSON in real-time
  const buildSearchJSON = useCallback((params) => {
    const apiPayload = buildSearchJson(params, 'proposal');
    const wrappedPayload = {
      OpportunitySearch: apiPayload,
      PageType: 1,
      IsRecentSearch: true
    };
    setSearchJSON(wrappedPayload);
    return wrappedPayload;
  }, []);

  const handleSearch = useCallback(async (e) => {
    if (e) e.preventDefault();

    try {
      setIsSearching(true); // Set loading state to prevent form refresh

      // Use existing searchJSON or build it if not available
      const currentSearchJSON = searchJSON || buildSearchJSON(searchParams);
      const apiPayload = currentSearchJSON.OpportunitySearch;

      // Validate the API payload
      const validation = validateSearchJson(apiPayload);
      if (!validation.isValid) {
        console.error('Proposal Advanced Search: Invalid API payload:', validation.errors);
        setIsSearching(false);
        return;
      }

      // Get search summary for logging
      const searchSummary = getSearchSummary(apiPayload);

      // Auto-save the search as "Latest Search" but don't execute search here
      // This prevents duplicate API calls - let the Proposals page handle the API call
      try {
        // Save the search with wrapped payload structure
        await userService.saveSearch({
          name: 'Latest Search',
          type: 'All Opportunities',
          resultType: 2, // 2 for Proposal
          apiPayload: apiPayload
        });

        console.log('Proposal Advanced Search: Auto-saved search as "Latest Search"');

        // Navigate to proposals page with API payload but without pre-fetched results
        // This prevents duplicate API calls - the Proposals page will make the single API call
        navigate('/proposals', {
          state: {
            apiPayload,
            searchJson: apiPayload, // Keep for backward compatibility
            fromAdvancedSearch: true,
            searchSummary,
            preserveFormState: true // Flag to indicate form state should be preserved
          }
        });

      } catch (saveError) {
        // Don't block the search if save fails, just log the error and continue with normal navigation
        console.error('Proposal Advanced Search: Failed to save search, but continuing with navigation:', saveError);
        
        // Navigate to proposals page with API payload even if save failed
        navigate('/proposals', {
          state: {
            apiPayload,
            searchJson: apiPayload, // Keep for backward compatibility
            fromAdvancedSearch: true,
            searchSummary,
            preserveFormState: true // Flag to indicate form state should be preserved
          }
        });
      }

    } catch (error) {
      console.error('Proposal Advanced Search: Error during search:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchParams, searchJSON, buildSearchJSON, navigate]);

  const handleClearFilters = useCallback(() => {
    clearAllFilters(); // Use clearAllFilters to preserve tab parameter
    setSearchJSON(null); // Clear searchJSON when filters are cleared
    setHasLoadedRecentSearch(false); // Reset flag to allow reloading recent search data
    setComponentMounted(false); // Reset component mounted flag
  }, [clearAllFilters]);

  const handleInputChange = useCallback((e) => {
    const updatedParams = {
      ...searchParams,
      [e.target.name]: e.target.value
    };
    updateFilters(updatedParams, { updateUrl: false });
    // Build searchJSON in real-time
    buildSearchJSON(updatedParams);
  }, [searchParams, updateFilters, buildSearchJSON]);

  const handleSelectChange = useCallback((name, value) => {
    const updatedParams = {
      ...searchParams,
      [name]: value
    };
    updateFilters(updatedParams, { updateUrl: false });
    // Build searchJSON in real-time
    buildSearchJSON(updatedParams);
  }, [searchParams, updateFilters, buildSearchJSON]);

  const handleToggleExpandCollapse = useCallback(() => {
    if (isExpanded) {
      setOpenAccordions([]);
      setIsExpanded(false);
    } else {
      setOpenAccordions(proposalsItems);
      setIsExpanded(true);
    }
  }, [isExpanded, proposalsItems]);

  return {
    searchParams,
    openAccordions,
    setOpenAccordions,
    isExpanded,
    handleSearch,
    handleClearFilters,
    handleInputChange,
    handleSelectChange,
    handleToggleExpandCollapse,
    isSearching,
    searchJSON,
    isLoadingRecentSearch,
    tabKey: componentMounted ? 1 : 0 // Add tabKey for force re-render
  };
};
