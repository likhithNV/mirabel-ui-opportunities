import { useEffect, useState } from 'react';
import contactsApi from '@/services/contactsApi';
import { opportunityService } from '../services/opportunityService';
import { userServiceNew } from '../services/userServiceNew';
import { logger } from '../../../components/shared/logger';

/**
 * Centralized master data loader for Search Results screens
 * - Lead sources, lead types, stages, prospecting stages
 * - Saved searches grouped into section headers for the Opportunities dropdown
 */
export function useSearchMasterData() {
  const [masterData, setMasterData] = useState({
    leadSources: [],
    leadTypes: [],
    stages: [],
    prospectingStages: []
  });
  const [masterDataLoaded, setMasterDataLoaded] = useState(false);
  const [repsOptions, setRepsOptions] = useState([]);
  const [quickStatusOptions, setQuickStatusOptions] = useState([]);

  useEffect(() => {
    const fetchReps = async () => {
      try {
        const reps = await userServiceNew.getUsersForDropdown();
        const formatted = [{ value: 'all', label: 'All Reps' }, ...reps.map(u => ({ value: u.value, label: u.display }))];
        setRepsOptions(formatted);
      } catch (e) {
        setRepsOptions([{ value: 'all', label: 'All Reps' }]);
      }
    };
    fetchReps();
  }, []);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [leadSourcesResponse, leadTypesResponse, stagesResponse, prospectingStagesResponse, savedSearches] = await Promise.all([
          contactsApi.getLeadSources(),
          contactsApi.getLeadTypes(),
          opportunityService.getOpportunityStages(),
          contactsApi.getProspectingStages(),
          userServiceNew.getSavedSearches()
        ]);

        const leadSources = leadSourcesResponse?.content?.Data?.LeadSources || [];
        const formattedLeadSources = leadSources.map(source => ({
          value: source.Value,
          label: source.Display,
          id: source.Value,
          name: source.Display
        }));

        const leadTypes = leadTypesResponse?.content?.Data?.LeadTypes || [];
        const formattedLeadTypes = leadTypes.map(type => ({
          value: type.Value,
          label: type.Display,
          id: type.Value,
          name: type.Display
        }));

        const stages = stagesResponse?.content?.List || [];
        const formattedStages = stages.map(stage => ({
          id: stage.ID || stage.id,
          name: stage.Stage || stage.Name || stage.name,
          value: stage.ID || stage.id,
          label: stage.Stage || stage.Name || stage.name,
          colorCode: stage.ColorCode || stage.colorCode || '#4fb3ff'
        }));

        const prospectingStages = prospectingStagesResponse?.content?.Data?.ProspectingStages || [];
        const formattedProspectingStages = prospectingStages.map(stage => ({
          value: stage.Value,
          label: stage.Display,
          id: stage.Value,
          name: stage.Display
        }));

        setMasterData({
          leadSources: formattedLeadSources,
          leadTypes: formattedLeadTypes,
          stages: formattedStages,
          prospectingStages: formattedProspectingStages
        });

        // Group Saved Searches (headers + options)
        const grouped = [];
        const allList = savedSearches?.allOpportunities || [];
        const myList = savedSearches?.myOpportunities || [];
        if (allList.length > 0) {
          grouped.push({ value: '__group_all__', label: 'All Opportunities' });
          grouped.push(...allList.map((s) => ({ value: String(s.ID), label: s.Name })));
        }
        if (myList.length > 0) {
          grouped.push({ value: '__group_my__', label: 'My Opportunities' });
          grouped.push(...myList.map((s) => ({ value: String(s.ID), label: s.Name })));
        }
        setQuickStatusOptions(grouped);

        setMasterDataLoaded(true);
      } catch (error) {
        logger.error('useSearchMasterData: Failed to load master data:', error);
        setMasterDataLoaded(true);
      }
    };

    fetchMasterData();
  }, []);

  return {
    masterData,
    masterDataLoaded,
    repsOptions,
    quickStatusOptions,
    setRepsOptions,
    setMasterData,
    setQuickStatusOptions
  };
}

export default useSearchMasterData;


