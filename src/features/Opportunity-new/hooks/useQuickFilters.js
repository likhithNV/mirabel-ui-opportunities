import { useMemo } from 'react';

/**
 * Build quick filter definitions for EnhancedFilterBar
 * Keeps SearchResults lean by moving filter config here
 */
export function useQuickFilters({
  searchType,
  filters,
  setFilters,
  setSearchParams,
  repsOptions,
  quickStatusOptions,
  probabilityOptions
}) {
  return useMemo(() => {
    if (searchType === 'proposals') {
      return [
        {
          id: 'proposalReps',
          placeholder: 'All Proposal Reps',
          type: 'multi-select',
          options: repsOptions,
          value: Array.isArray(filters.proposalReps) ? filters.proposalReps : [],
          onChange: (values) => {
            const allToken = 'all';
            let next = Array.isArray(values) ? [...values] : [];
            const hasAllNow = next.includes(allToken);
            const hadAllPrev = Array.isArray(filters.proposalReps) && filters.proposalReps.includes(allToken);
            if (hasAllNow && !hadAllPrev) {
              next = [allToken];
            } else if (hasAllNow && hadAllPrev && next.length > 1) {
              next = next.filter(v => v !== allToken);
            } else {
              next = next.filter(v => v !== allToken);
            }
            setSearchParams(prev => ({ ...prev, proposalReps: next }));
            setFilters(prev => ({ ...prev, proposalReps: next }));
          }
        }
      ]
    }

    return [
      {
        id: 'opportunities',
        placeholder: 'All Opportunities',
        options: quickStatusOptions,
        value: (filters.ListID ? String(filters.ListID) : ''),
        onChange: (value) => {
          if (value && String(value).startsWith('__group_')) return;
          const nextVal = value ? value : undefined;
          if (nextVal && /^\d+$/.test(String(nextVal))) {
            setSearchParams?.(prev => ({ ...prev, ListID: parseInt(String(nextVal), 10), quickStatus: '' }));
            setFilters(prevState => ({ ...prevState, ListID: parseInt(String(nextVal), 10) }));
          } else {
            setSearchParams?.(prev => ({ ...prev, ListID: undefined }));
            setFilters(prevState => ({ ...prevState, ListID: undefined }));
          }
        }
      },
      {
        id: 'probability',
        placeholder: 'All Probability',
        type: 'multi-select',
        options: probabilityOptions,
        value: Array.isArray(filters.probability) ? filters.probability : [],
        onChange: (values) => {
          const prev = Array.isArray(filters.probability) ? filters.probability : [];
          let next = Array.isArray(values) ? [...values] : [];
          const hasAllNow = next.includes('all');
          const hadAllPrev = prev.includes('all');
          if (hasAllNow && !hadAllPrev) {
            next = ['all'];
          } else if (hasAllNow && hadAllPrev && next.length > 1) {
            next = next.filter(v => v !== 'all');
          } else if (!hasAllNow && hadAllPrev) {
          } else {
            next = next.filter(v => v !== 'all');
          }
          setSearchParams(prev => ({ ...prev, probability: next.filter(v => v !== 'all') }));
          setFilters(prevState => ({ ...prevState, probability: next }));
        }
      },
      {
        id: 'reps',
        placeholder: 'All Reps',
        type: 'multi-select',
        options: repsOptions,
        value: Array.isArray(filters.reps) ? filters.reps : [],
        onChange: (values) => {
          const prev = Array.isArray(filters.reps) ? filters.reps : [];
          let next = Array.isArray(values) ? [...values] : [];
          const allToken = 'all';
          const hasAllNow = next.includes(allToken);
          const hadAllPrev = prev.includes(allToken);
          if (hasAllNow && !hadAllPrev) {
            next = [allToken];
          } else if (hasAllNow && hadAllPrev && next.length > 1) {
            next = next.filter(v => v !== allToken);
          } else if (!hasAllNow && hadAllPrev) {
          } else {
            next = next.filter(v => v !== allToken);
          }
          setSearchParams(prev => ({ ...prev, assignedRep: next.filter(rep => rep !== allToken) }));
          setFilters(prevState => ({ ...prevState, reps: next }));
        }
      }
    ]
  }, [searchType, filters, setFilters, setSearchParams, repsOptions, quickStatusOptions, probabilityOptions])
}

export default useQuickFilters;


