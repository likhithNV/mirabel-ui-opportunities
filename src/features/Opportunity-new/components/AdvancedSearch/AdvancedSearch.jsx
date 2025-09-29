import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown, RotateCcw, Settings, Search } from 'lucide-react';
import SearchResults from '../SearchResults/SearchResults';
import DynamicFormRenderer from './DynamicFormRenderer';
import { OPPORTUNITY_FORM_CONFIG } from '../config/opportunityFormConfig';
import { PROPOSAL_FORM_CONFIG } from '../config/proposalFormConfig';
import { GradientTabBar } from '@/shared/components/ui/GradientTabBar';
import { getProposalRecentSearchData, getRecentSearchData, loadSavedSearch } from '@/services/userService';
import { buildSearchJson } from '@/features/Opportunity/utils/searchJsonBuilder';
import SettingsPanel from '@/components/ui/SettingsPanel';
import { ADVANCED_SEARCH_TABS } from '../../constants/constants';
import viewsApi from '../../services/viewsApi';

const AdvancedSearch = () => {
  const [activeTab, setActiveTab] = useState('opportunities');
  const [opportunitiesFormData, setOpportunitiesFormData] = useState({});
  const [proposalsFormData, setProposalsFormData] = useState({});
  const [openOppSections, setOpenOppSections] = useState(['primary-fields']);
  const [openPropSections, setOpenPropSections] = useState(['primary-fields']);
  const [showResults, setShowResults] = useState(false);
  const [searchParams, setSearchParams] = useState({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Recent search data
  const [isLoadingRecentSearch, setIsLoadingRecentSearch] = useState(false);
  const [hasLoadedRecentSearch, setHasLoadedRecentSearch] = useState(false);
  const [componentMounted, setComponentMounted] = useState(false);
  const [searchJSON, setSearchJSON] = useState(null);

  const currentConfig = activeTab === 'opportunities' ? OPPORTUNITY_FORM_CONFIG : PROPOSAL_FORM_CONFIG;
  const currentOpenSections = activeTab === 'opportunities' ? openOppSections : openPropSections;

  const handleReset = () => {
    if (activeTab === 'opportunities') {
      setOpportunitiesFormData({});
      setOpenOppSections(['primary-fields']);
    } else {
      setProposalsFormData({});
      setOpenPropSections(['primary-fields']);
    }
  };

  const toggleAllSections = () => {
    const allIds = currentConfig.sections.map(s => s.id);
    const allExpanded = allIds.every(id => currentOpenSections.includes(id));
    const newOpen = allExpanded ? [] : allIds;
    if (activeTab === 'opportunities') setOpenOppSections(newOpen); else setOpenPropSections(newOpen);
  };

  const allSectionsExpanded = useMemo(() => {
    const allIds = currentConfig.sections.map(s => s.id);
    return allIds.every(id => currentOpenSections.includes(id));
  }, [currentConfig, currentOpenSections]);

  const handleSearch = () => {
    const currentFormData = activeTab === 'opportunities' ? opportunitiesFormData : proposalsFormData;
    setSearchParams(currentFormData);
    setShowResults(true);
};


// Load recent search data when component mounts or when filters are cleared
useEffect(() => {
    const loadRecentSearch = async () => {
      try {
        // get page settings
        const viewPage = await viewsApi.getPageSettings(1, -1);
        const showType = viewPage.content.Data.ShowType;

        setIsLoadingRecentSearch(true);
        const recentSearchResult = await getRecentSearchData();
        setActiveTab(recentSearchResult.rawData?.ResultType == 2 ? 'proposals' : 'opportunities');


        console.log('📥 API Response received:', recentSearchResult);

        if (recentSearchResult.success && recentSearchResult.searchParams) {
          // Update the filters with the recent search data in searchParams format
          setSearchParams(recentSearchResult.searchParams);
          if(recentSearchResult.rawData?.ResultType == 1 ) { 
            setOpportunitiesFormData(recentSearchResult.searchParams);
          } else {
            setProposalsFormData(recentSearchResult.searchParams);
          }
          // Build searchJSON with the loaded data
          buildSearchJSON(recentSearchResult.searchParams);
          if(showType == 1) {
            // show results if showType is 1
            setShowResults(true);
          }

        } else {
          console.log('⚠️ No recent search data available or failed to load for opportunities');
        }
      } catch (error) {
        console.error('❌ Error loading recent search data for opportunities:', error);
      } finally {
        setIsLoadingRecentSearch(false);
        setHasLoadedRecentSearch(true);
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
    
    if ((!hasLoadedRecentSearch || Object.keys(searchParams).length === 0)) {
      loadRecentSearch();
    } else {
    }
  }, [hasLoadedRecentSearch]); // Depend on componentMounted and hasLoadedRecentSearch

  // Function to build searchJSON in real-time
  const buildSearchJSON = useCallback((params) => {
    const apiPayload = buildSearchJson(params, activeTab);
    const wrappedPayload = {
      OpportunitySearch: apiPayload,
      PageType: 1,
      IsRecentSearch: true
    };
    setSearchJSON(wrappedPayload);
    return wrappedPayload;
  }, []);

  useEffect(() => {
    setOpportunitiesFormData(searchParams);
  }, [searchParams]);

  // If showing results, render the SearchResults component
  if (showResults) {
    return (
      <SearchResults
        searchType={activeTab}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        setShowResults={setShowResults}
      />
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Fixed Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-blue-900">Advanced Search - {activeTab === 'opportunities' ? 'Opportunities' : 'Proposals'}</h1>
            <button 
              onClick={toggleAllSections}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
            >
              <span>{allSectionsExpanded ? 'Collapse All' : 'Expand All'}</span>
              {allSectionsExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
            <button 
              onClick={handleSearch}
              className="flex items-center space-x-2 px-6 py-2 bg-ocean-500 text-white rounded-md hover:bg-ocean-700"
            >
              <Search className="h-4 w-4" />
              <span>Search {activeTab === 'opportunities' ? 'Opportunities' : 'Proposals'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Advanced Search</h2>
              
              {/* Tabs */}
              <GradientTabBar
                tabs={ADVANCED_SEARCH_TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="compact"
                className="mb-1 w-80"
              />
            </div>

            {/* Dynamic Content based on active tab */}
            <div className="px-6 py-4">
              {activeTab === 'opportunities' ? (
                <DynamicFormRenderer
                  config={currentConfig}
                  searchParams={opportunitiesFormData}
                  handleInputChange={(e) => setOpportunitiesFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                  handleSelectChange={(name, value) => setOpportunitiesFormData(prev => ({ ...prev, [name]: value }))}
                  handleSearch={handleSearch}
                  openAccordions={openOppSections}
                  setOpenAccordions={setOpenOppSections}
                  isSearching={false}
                  isLoadingRecentSearch={false}
                />
              ) : (
                <DynamicFormRenderer
                  config={currentConfig}
                  searchParams={proposalsFormData}
                  handleInputChange={(e) => setProposalsFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                  handleSelectChange={(name, value) => setProposalsFormData(prev => ({ ...prev, [name]: value }))}
                  handleSearch={handleSearch}
                  openAccordions={openPropSections}
                  setOpenAccordions={setOpenPropSections}
                  isSearching={false}
                  isLoadingRecentSearch={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default AdvancedSearch;