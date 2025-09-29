import React, { useState, useEffect } from 'react';
import CardViewNew from './CardViewNew';
import { EnhancedDataTable } from '@/shared/components/ui/advanced-table';
import { EnhancedFilterBar } from '@/components/ui/EnhancedFilterBar';
import { useSearchResults } from '../../hooks/useSearchResults';
import { ExternalLink, MoreVertical, Edit, Check } from 'lucide-react';
import { OpportunityStatsCards, ProposalStatsCards } from '../Stats';
import { useNavigate } from 'react-router-dom';
import { getDefaultColumnOrder } from '../../hooks/helperData';
import ViewsSidebar from '@/components/ui/views/ViewsSidebar';
import { NewLoader } from '@/components/ui/NewLoader';
import KanbanView from '../kanban/KanbanView';
import { opportunityService } from '../../services/opportunityService';
import { userServiceNew } from '../../services/userServiceNew';
import contactsApi from '@/services/contactsApi';
import { useSearchMasterData } from '../../hooks/useSearchMasterData';
import { useQuickFilters } from '../../hooks/useQuickFilters';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SearchResults = ({ searchParams, setShowResults, searchType = 'opportunities', setSearchParams }) => {
  const { data, loading, error, refetch } = useSearchResults(searchParams, searchType);
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({
    all: searchType === 'opportunities' ? 'All Opportunities' : 'All Proposals',
    probability: searchParams.probability || [],
    // Keep raw rep IDs in UI state; format to IE=...~ only when building payloads
    reps: Array.isArray(searchParams.assignedRep) ? searchParams.assignedRep : [],
    ListID: undefined,
  });
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const [isViewsSidebarOpen, setIsViewsSidebarOpen] = useState(false);

  // Master data and dropdown options via hook
  const {
    masterData,
    masterDataLoaded,
    repsOptions,
    quickStatusOptions
  } = useSearchMasterData();
  const probabilityOptions = [
    { value: 'all', label: 'All Probabilities' },
    ...Array.from({ length: 11 }, (_, i) => ({ value: String(i * 10), label: `${i * 10}%` }))
  ];

  const isOpportunities = searchType === 'opportunities';
  const title = isOpportunities ? 'Opportunities' : 'Proposals';
  // const [isLoading, setIsLoading] = useState(false);

  // Enhance rows with dropdown options
  const enhanceRowsWithOptions = (rows) => {
    return rows.map((row, index) => {
      const stableId = (
        row.id ||
        row.ID ||
        row.OpportunityID ||
        row.ProposalID ||
        row.RecordID ||
        row.GUID ||
        (row.Proposal && (row.Proposal.ID || row.ProposalId)) ||
        `row-${row.Name || row.OpportunityName || ''}-${row.ContactDetails?.ID || ''}-${index}`
      );
      return {
        id: String(stableId),
        ...row,
        _leadSourceOptions: masterData.leadSources,
        _leadTypeOptions: masterData.leadTypes,
        _stages: masterData.stages,
        _prospectingStages: masterData.prospectingStages
      };
    });
  };

  // Build quick filter definitions using hook
  const filterDefinitions = useQuickFilters({
    searchType,
    filters,
    setFilters,
    setSearchParams,
    repsOptions,
    quickStatusOptions,
    probabilityOptions
  });

  // Build params for quick filters → API payload subset
  const buildQuickParams = (override = null) => {
    const f = override || filters;
    const params = {};
    // Include ListID if present (saved search)
    if (f.ListID && /^\d+$/.test(String(f.ListID))) {
      params.ListID = parseInt(String(f.ListID), 10);
    }
    // Probability: selected numeric percentages -> IE-format string array expected downstream
    if (Array.isArray(f.probability) && f.probability.length > 0) {
      // Keep as array of numeric strings; downstream can format to IE=
      params.probability = f.probability;
    }
    // Reps: keep raw ids here; payload layer will add IE=...~
    if (Array.isArray(f.reps) && f.reps.length > 0) {
      params.assignedRep = f.reps;
    }
    // page info
    params.CurPage = page;
    return params;
  };

  // reps loaded via useSearchMasterData

  // Edit functionality
  const handleEditClick = (e, row) => {
    e.stopPropagation();
    const id = row.ID || row.id;
    if (id) {
      if (isOpportunities) {
        window.location.href = `/edit-opportunity/${id}`;
      } else {
        window.location.href = `/edit-proposal/${id}`;
      }
    }
  };

  // Check if edit should be shown
  const shouldShowEdit = (row) => {
    const id = row.ID || row.id;
    if (!id || id === 0 || id === '0') {
      return false;
    }

    const status = (row.Status || '').toLowerCase();
    if (status.includes('closed') || status.includes('locked') || status.includes('archived')) {
      return false;
    }

    return true;
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleFilterClick = () => {
    try {
      // Navigate to advanced search with opportunities tab and preserve current filters
      const advancedSearchParams = new URLSearchParams();

      // Copy all current filters to preserve them, but exclude default "All Opportunities" status
      for (const [key, value] of Object.entries(filters)) {
        // Skip empty values, empty arrays, "All" selections, and default "All Opportunities" status
        if (
          value &&
          value.toString().trim() !== "" &&
          !(key === "status" && value === "All Opportunities")
        ) {
          // Handle array values properly for Advanced Search
          if (Array.isArray(value)) {
            if (value.length > 0) {
              // For multi-select fields, join with commas
              advancedSearchParams.set(key, value.join(","));
            }
            // Skip empty arrays (like when "All Reps" is selected)
          } else {
            // For single values, pass as is
            advancedSearchParams.set(key, value);
          }
        }
      }

      // Set the tab parameter to opportunities
      advancedSearchParams.set("tab", "opportunities");

      const finalUrl = `/app/advanced-search-new`;
      
      // window.open(finalUrl);
      setShowResults(false);
      // navigate(finalUrl);
    } catch (error) {
      
      // Fallback: just refresh the current data if navigation fails
      refetch?.();
    }
  };

  // master data loaded via useSearchMasterData

  // Debug logging removed

  // Helper function to get nested object values
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Generate columns from API ColumnConfig
  const generateColumnsFromConfig = (columnConfig) => {
    if (!columnConfig || !Array.isArray(columnConfig)) {
      logger.info('SearchResults: No column config found, using default columns');
      return getDefaultColumns();
    }

    
    const columns = [];

    // Add edit column first
    columns.push({
      id: 'edit',
      header: '',
      accessor: () => null,
      sortable: false,
      width: 50,
      render: (value, row) => (
        shouldShowEdit(row) ? (
          <button
            onClick={(e) => handleEditClick(e, row)}
            className="h-8 w-8 p-0 rounded hover:bg-gray-50 flex items-center justify-center"
            title={`Edit ${isOpportunities ? 'Opportunity' : 'Proposal'}`}
          >
            <Edit className="h-4 w-4 text-gray-600 hover:text-black" />
          </button>
        ) : (
          <div className="h-8 w-8 flex items-center justify-center">
            {/* Empty space to maintain alignment */}
          </div>
        )
      )
    });

    // Deduplicate columns by PropertyMappingName to prevent duplicates
    const seenMappings = new Set();
    const uniqueColumnConfig = [];

    columnConfig.forEach((col, index) => {
      // Use propertyMappingName as the primary key for deduplication (note: camelCase from service transformation)
      const mappingKey = col.propertyMappingName || col.dbName || col.visibleColumns;

      if (mappingKey && !seenMappings.has(mappingKey)) {
        seenMappings.add(mappingKey);
        uniqueColumnConfig.push(col);
        
      } else {
        
      }
    });

    

    // Debug: Check specifically for Product and Loss Reason columns
    const productColumn = uniqueColumnConfig.find(col =>
      col.propertyMappingName === 'ProductDetails.Name' ||
      col.visibleColumns === 'Product'
    );
    const lossReasonColumn = uniqueColumnConfig.find(col =>
      col.propertyMappingName === 'OppLossReasonDetails.Name' ||
      col.visibleColumns === 'Loss Reason'
    );

    

    uniqueColumnConfig.forEach(col => {
      

      const columnDef = createColumnFromConfig(col);
      if (columnDef) {
        
        columns.push(columnDef);
      } else {
        
      }
    });

    // Add actions column at the end
    columns.push({
      id: 'actions',
      header: '',
      accessor: () => null,
      sortable: false,
      width: 50,
      render: () => (
        <button className="p-1 hover:bg-gray-100 rounded">
          <MoreVertical className="h-4 w-4 text-gray-400" />
        </button>
      )
    });

    

    return columns;
  };

  // Create individual column from API config - following the old system's pattern
  const createColumnFromConfig = (config) => {
    // Use correct case for API fields (note: service transforms to camelCase)
    const propertyMappingName = config.propertyMappingName || config.PropertyMappingName || config.propertyMapping || "";
    const visibleColumns = config.visibleColumns || config.VisibleColumns || config.label || config.displayName || "";
    const dbName = config.dbName || config.DBColumnsNames || config.DBName || "";

    // Helper function to get nested value using dot notation (same as old system)
    const getValueByPath = (obj, path) => {
      if (!path || typeof path !== "string") return null;
      if (path.includes(".")) {
        const parts = path.split(".");
        let current = obj;
        for (const part of parts) {
          if (current && typeof current === "object" && current[part] !== undefined) {
            current = current[part];
          } else {
            return null;
          }
        }
        // If the resolved value is an object with common display props, surface those
        if (current && typeof current === "object") {
          if (current.Name) return current.Name;
          if (current.Display) return current.Display;
          if (current.FullNameWithCompany) return current.FullNameWithCompany;
        }
        return current;
      }
      return obj[path] !== undefined ? obj[path] : null;
    };

    // Use the mapping path from API config to determine column type and rendering
    const mappingPath = propertyMappingName || dbName;
    const pathLc = String(mappingPath || "").toLowerCase();

    

    // Helper function to get column width based on type
    const getColumnWidth = (type) => {
      const widths = {
        'status': 100,
        'assignedRep': 120,
        'stage': 140,
        'companyName': 160,
        'currency': 120,
        'percentage': 100,
        'date': 140,
        'contactName': 160,
        'opportunityName': 200,
        'product': 160,
        'lossReason': 120,
        'proposalId': 100,
        'prospectingStage': 150,
        'leadSource': 140,
        'leadType': 140,
        'text': 120
      };
      return widths[type] || 120;
    };

    // Determine column type based on mapping path (following old system logic)
    let columnType = 'text'; // default
    let renderId = mappingPath;

    // Use exact matching for the specific API column configurations first
    if (mappingPath === 'Status') {
      columnType = 'status';
      renderId = 'status';
    } else if (mappingPath === 'AssignedTo') {
      columnType = 'assignedRep';
      renderId = 'assignedRep';
    } else if (mappingPath === 'OppStageDetails.Stage') {
      columnType = 'stage';
      renderId = 'stage';
    } else if (mappingPath === 'ContactDetails.Name') {
      columnType = 'companyName';
      renderId = 'companyName';
    } else if (mappingPath === 'SubContactDetails.Name') {
      columnType = 'contactName';
      renderId = 'contactName';
    } else if (mappingPath === 'Amount') {
      columnType = 'currency';
      renderId = 'amount';
    } else if (mappingPath === 'Probability') {
      columnType = 'percentage';
      renderId = 'probability';
    } else if (mappingPath === 'CloseDate') {
      columnType = 'date';
      renderId = 'closeDate';
    } else if (mappingPath === 'Name') {
      columnType = 'opportunityName';
      renderId = 'opportunityName';
    } else if (mappingPath === 'ProductDetails.Name') {
      columnType = 'product';
      renderId = 'product';
      logger.info('SearchResults: FOUND Product column mapping!', { mappingPath, visibleColumns });
    } else if (mappingPath === 'OppLossReasonDetails.Name') {
      columnType = 'lossReason';
      renderId = 'lossReason';
      logger.info('SearchResults: FOUND Loss Reason column mapping!', { mappingPath, visibleColumns });
    } else if (mappingPath === 'ProposalID') {
      columnType = 'proposalId';
      renderId = 'proposalId';
    } else if (mappingPath === 'ProspectingStage' || mappingPath === 'SubContactDetails.ProspectingStage' || mappingPath === 'ContactDetails.ProspectingStage') {
      columnType = 'prospectingStage';
      renderId = 'prospectingStage';
      logger.info('SearchResults: FOUND Prospecting Stage column mapping!', { mappingPath, visibleColumns });
    } else if (mappingPath === 'LeadSource' || mappingPath === 'SubContactDetails.LeadSource' || mappingPath === 'ContactDetails.LeadSource') {
      columnType = 'leadSource';
      renderId = 'leadSource';
      logger.info('SearchResults: FOUND Lead Source column mapping!', { mappingPath, visibleColumns });
    } else if (mappingPath === 'LeadType' || mappingPath === 'SubContactDetails.LeadType' || mappingPath === 'ContactDetails.LeadType') {
      columnType = 'leadType';
      renderId = 'leadType';
      logger.info('SearchResults: FOUND Lead Type column mapping!', { mappingPath, visibleColumns });
    } else {
      // Fallback to regex patterns and intelligent detection for other cases
      if (/(^|\.)status$/.test(pathLc)) {
        columnType = 'status';
        renderId = 'status';
      } else if (/(^|\.)assignedto$/.test(pathLc)) {
        columnType = 'assignedRep';
        renderId = 'assignedRep';
      } else if (/oppstagedetails\.stage$/.test(pathLc) || /(^|\.)stage$/.test(pathLc)) {
        columnType = 'stage';
        renderId = 'stage';
      } else if (/(^|\.)customer(name)?$/.test(pathLc) || /contactdetails\.(fullnamewithcompany|name)$/.test(pathLc)) {
        columnType = 'companyName';
        renderId = 'companyName';
      } else if (/(^|\.)amount$/.test(pathLc)) {
        columnType = 'currency';
        renderId = 'amount';
      } else if (/(^|\.)probability$/.test(pathLc)) {
        columnType = 'percentage';
        renderId = 'probability';
      } else if (/(^|\.)closedate$/.test(pathLc)) {
        columnType = 'date';
        renderId = 'closeDate';
      } else if (/subcontactdetails\.name$/.test(pathLc)) {
        columnType = 'contactName';
        renderId = 'contactName';
      } else if (/(^|\.)name$/.test(pathLc)) {
        columnType = 'opportunityName';
        renderId = 'opportunityName';
      } else if (/productdetails\.name$/.test(pathLc)) {
        columnType = 'product';
        renderId = 'product';
      } else if (/opplossreasondetails\.name$/.test(pathLc)) {
        columnType = 'lossReason';
        renderId = 'lossReason';
      } else if (/(^|\.)proposalid$/.test(pathLc)) {
        columnType = 'proposalId';
        renderId = 'proposalId';
      } else if (/(^|\.)prospectingstage$/.test(pathLc) || /contactdetails\.prospectingstage$/.test(pathLc) || /subcontactdetails\.prospectingstage$/.test(pathLc)) {
        columnType = 'prospectingStage';
        renderId = 'prospectingStage';
      } else if (/(^|\.)leadsource$/.test(pathLc) || /contactdetails\.leadsource$/.test(pathLc) || /subcontactdetails\.leadsource$/.test(pathLc)) {
        columnType = 'leadSource';
        renderId = 'leadSource';
      } else if (/(^|\.)leadtype$/.test(pathLc) || /contactdetails\.leadtype$/.test(pathLc) || /subcontactdetails\.leadtype$/.test(pathLc)) {
        columnType = 'leadType';
        renderId = 'leadType';
      } else {
        // For completely unknown columns, try to infer type from visible column name
        const visibleLc = String(visibleColumns || "").toLowerCase();
        if (visibleLc.includes('amount') || visibleLc.includes('total') || visibleLc.includes('revenue')) {
          columnType = 'currency';
          renderId = 'currency';
        } else if (visibleLc.includes('probability') || visibleLc.includes('%')) {
          columnType = 'percentage';
          renderId = 'percentage';
        } else if (visibleLc.includes('date')) {
          columnType = 'date';
          renderId = 'date';
        } else if (visibleLc.includes('status')) {
          columnType = 'status';
          renderId = 'status';
        } else {
          // Default to text for completely unknown columns
          columnType = 'text';
          renderId = mappingPath || 'unknown';
        }
      }
    }

    

    // Create unique ID for the column
    const uniqueId = mappingPath ? mappingPath.replace(/\./g, '_') : (renderId || 'unknown');

    // Helper functions for stage timeline functionality
    const getStageDateByLabel = (row, stageLabel) => {
      if (!stageLabel) return null;
      // 1) Stages dictionary coming from API (preferred)
      if (row.Stages && typeof row.Stages === "object") {
        const direct = row.Stages[stageLabel];
        if (direct) return direct;
      }
      // 2) Flattened keys like Stage_<Name> or stage_<Name>
      const variants = [
        `Stage_${stageLabel}`,
        `stage_${stageLabel}`,
        `Stage_${stageLabel.replace(/\s+/g, "_")}`,
        `stage_${stageLabel.replace(/\s+/g, "_")}`,
      ];
      for (const key of variants) {
        if (row[key]) return row[key];
      }
      return null;
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toLocaleDateString();
      } catch {
        return dateString;
      }
    };

    const handleStageCheckToggle = async (row, stageLabel) => {
      try {
        const stageMeta = masterData.stages.find((s) => s.name === stageLabel);
        if (!stageMeta) {
          console.error("Invalid stage. Please reload and try again.");
          return;
        }

        // Optional: row-level restrictions if provided by API
        const isReadOnly =
          row?.CanView === 1 ||
          row?.canView === 1 ||
          row?.isReadOnly === true;
        if (isReadOnly) {
          console.error("You do not have permission to modify this opportunity.");
          return;
        }

        // Guard: block edits for closed states
        const stageLc = String(row?.stage || "").toLowerCase();
        if (stageLc === "closed won" || stageLc === "closed lost") {
          console.error("Closed opportunities cannot be modified via the grid. Use the Edit page.");
          return;
        }

        const currentDate = getStageDateByLabel(row, stageLabel);
        const shouldInsert = !currentDate;

        // Call the API to toggle the stage date
        await opportunityService.toggleOpportunityStageDate(
          row.ID || row.id,
          stageMeta.id,
          shouldInsert
        );

        // Trigger refresh to update the data
        refetch?.();
      } catch (error) {
        console.error("Stage toggle failed", error);
      }
    };

    // Check if this column represents a stage timeline checkmark
    const labelText = (visibleColumns || propertyMappingName || dbName || '').toLowerCase();
    const isStageTimelineColumn = masterData.stages?.some(
      (s) => String(s.name).toLowerCase() === labelText
    );

    if (
      isStageTimelineColumn &&
      columnType !== "stage" &&
      columnType !== "status" &&
      columnType !== "assignedRep"
    ) {
      const stage = masterData.stages.find(
        (s) => String(s.name).toLowerCase() === labelText
      );
      
      return {
        id: uniqueId,
        header: visibleColumns || propertyMappingName || dbName || 'Unknown',
        accessor: mappingPath,
        sortable: true,
        width: 120,
        columnType: 'stageTimeline',
        render: (value, row) => {
          const stageDate = getStageDateByLabel(row, stage?.name);
          const isCompleted = Boolean(stageDate);
          
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStageCheckToggle(row, stage?.name);
              }}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
              title={
                isCompleted
                  ? `Completed on ${formatDate(stageDate)}`
                  : "Not completed"
              }
            >
              <span
                className={`h-4 w-4 rounded-full flex items-center justify-center ${
                  isCompleted ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <Check className="h-3 w-3 text-white" />
              </span>
              <span className="min-w-[84px] inline-block">
                {isCompleted ? formatDate(stageDate) : ""}
              </span>
            </button>
          );
        }
      };
    }

    // Create base column definition with unique ID based on mapping path
    const baseColumn = {
      id: uniqueId,
      header: visibleColumns || propertyMappingName || dbName || 'Unknown',
      accessor: mappingPath,
      sortable: true,
      width: getColumnWidth(columnType),
      columnType: columnType, // Add for debugging
    };

    // Add type-specific rendering based on column type
    switch (columnType) {
      case 'opportunityName':
        return {
          ...baseColumn,
          render: (value, row) => {
            const displayName = getValueByPath(row, mappingPath) || row.Name || 'Untitled';
            return (
              <a href={`/${searchType}/${row.ID || row.id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center space-x-1">
                <span>{displayName}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            );
          }
        };

      case 'companyName':
        return {
          ...baseColumn,
          render: (value, row) => {
            const companyName = getValueByPath(row, mappingPath) ||
              getNestedValue(row, 'ContactDetails.Name') ||
              getNestedValue(row, 'ContactDetails.CompanyName') ||
              row.CompanyName || 'N/A';
            return <span className="font-medium">{companyName}</span>;
          }
        };

      case 'contactName':
        return {
          ...baseColumn,
          render: (value, row) => {
            const contactName = getValueByPath(row, mappingPath) ||
              getNestedValue(row, 'SubContactDetails.Name') ||
              getNestedValue(row, 'ContactDetails.ContactName') ||
              row.ContactName || 'N/A';
            return <span>{contactName}</span>;
          }
        };

      case 'assignedRep':
        return {
          ...baseColumn,
          render: (value, row) => {
            const assignedTo = getValueByPath(row, mappingPath) || row.AssignedTo;
            if (!assignedTo || assignedTo === 'Unassigned') {
              return <span className="text-sm text-gray-500">Unassigned</span>;
            }
            const initials = assignedTo.split(' ').map(n => n[0]).join('').substring(0, 2);
            const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500'];
            const colorIndex = assignedTo.length % colors.length;
            return (
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-sm font-medium`}>
                  {initials}
                </div>
                <span className="text-sm">{assignedTo}</span>
              </div>
            );
          }
        };

      case 'stage':
        return {
          ...baseColumn,
          render: (value, row) => {
            const stage = getValueByPath(row, mappingPath) ||
              getNestedValue(row, 'OppStageDetails.Stage') ||
              row.Stage || 'Unknown';

            // Import StageDropdown component for inline editing
            const StageDropdown = React.lazy(() => import('../table/StageDropdown'));

            if (!masterDataLoaded || !masterData.stages.length) {
              return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white bg-gray-500">
                  {stage}
                </span>
              );
            }

            return (
              <React.Suspense fallback={
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white bg-gray-500">
                  {stage}
                </span>
              }>
                <StageDropdown
                  stage={stage}
                  opportunityId={row.ID || row.id}
                  onStageChange={(opportunityId, newStage) => {
                    logger.info(`Stage changed for opportunity ${opportunityId} to ${newStage}`);
                    // Trigger refresh to update the data
                    refetch?.();
                  }}
                  stages={masterData.stages}
                  isReadOnly={row.CanView === 1 || row.canView === 1 || row.isReadOnly === true}
                />
              </React.Suspense>
            );
          }
        };

      case 'currency':
      case 'amount':
        return {
          ...baseColumn,
          type: 'currency',
          render: (value, row) => {
            const amount = parseFloat(getValueByPath(row, mappingPath) || row.Amount || 0);
            return <span className="font-medium">${amount.toLocaleString()}</span>;
          }
        };

      case 'status':
        return {
          ...baseColumn,
          render: (value, row) => {
            const status = getValueByPath(row, mappingPath) || row.Status || 'Unknown';

            const getStatusColor = (status) => {
              const statusLower = (status || '').toLowerCase();
              if (statusLower.includes('open') || statusLower.includes('active') || statusLower.includes('draft')) {
                return 'bg-green-100 text-green-800';
              } else if (statusLower.includes('won') || statusLower.includes('approved')) {
                return 'bg-blue-100 text-blue-800';
              } else if (statusLower.includes('lost') || statusLower.includes('rejected')) {
                return 'bg-red-100 text-red-800';
              } else if (statusLower.includes('sent') || statusLower.includes('pending')) {
                return 'bg-yellow-100 text-yellow-800';
              }
              return 'bg-gray-100 text-gray-800';
            };

            return (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {status}
              </span>
            );
          }
        };

      case 'percentage':
      case 'probability':
        return {
          ...baseColumn,
          type: 'percentage',
          render: (value, row) => {
            const probability = getValueByPath(row, mappingPath) || row.Probability || '0';
            return <span>{probability}%</span>;
          }
        };

      case 'date':
      case 'closeDate':
        return {
          ...baseColumn,
          type: 'date',
          render: (value, row) => {
            const dateValue = getValueByPath(row, mappingPath) || row.CloseDate;
            if (!dateValue) return <span className="text-sm">N/A</span>;
            const date = new Date(dateValue);
            return <span className="text-sm">{date.toLocaleDateString()}</span>;
          }
        };

      case 'product':
        return {
          ...baseColumn,
          render: (value, row) => {
            const productName = getValueByPath(row, mappingPath) ||
              getNestedValue(row, 'ProductDetails.Name') || 'N/A';
            return <span className="text-sm">{productName}</span>;
          }
        };

      case 'lossReason':
        return {
          ...baseColumn,
          render: (value, row) => {
            const lossReason = getValueByPath(row, mappingPath) ||
              getNestedValue(row, 'OppLossReasonDetails.Name') || '';
            return lossReason ? <span className="text-sm">{lossReason}</span> : <span className="text-sm text-gray-400">-</span>;
          }
        };

      case 'proposalId':
        return {
          ...baseColumn,
          render: (value, row) => {
            const proposalId = getValueByPath(row, mappingPath) || row.ProposalID || '';
            return proposalId && proposalId !== '0' ? <span className="font-medium">#{proposalId}</span> : <span className="text-sm text-gray-400">-</span>;
          }
        };

      case 'prospectingStage':
        return {
          ...baseColumn,
          render: (value, row) => {
            const prospectingStage = getValueByPath(row, mappingPath) ||
              getNestedValue(row, 'SubContactDetails.ProspectingStage') ||
              getNestedValue(row, 'ContactDetails.ProspectingStage') ||
              row.ProspectingStage || '';

            // Import ProspectingStageDropdown component for inline editing
            const ProspectingStageDropdown = React.lazy(() => import('../table/ProspectingStageDropdown'));

            

            if (!masterDataLoaded || !masterData.prospectingStages.length) {
              return (
                <span className="text-sm text-gray-600 px-3 py-1 rounded-full bg-gray-100">
                  {prospectingStage || 'None'}
                </span>
              );
            }

            return (
              <React.Suspense fallback={
                <span className="text-sm text-gray-600 px-3 py-1 rounded-full bg-gray-100">
                  {prospectingStage || 'None'}
                </span>
              }>
                <ProspectingStageDropdown
                  prospectingStage={prospectingStage}
                  opportunity={row}
                  onStageChange={(opportunityId, newStage) => {
                    logger.info(`Prospecting stage changed for opportunity ${opportunityId} to ${newStage}`);
                    // Trigger refresh to update the data
                    refetch?.();
                  }}
                  prospectingStages={masterData.prospectingStages}
                  onRefresh={refetch}
                />
              </React.Suspense>
            );
          }
        };

      case 'leadSource':
        return {
          ...baseColumn,
          render: (value, row) => {
            const leadSource = getValueByPath(row, mappingPath) ||
              getNestedValue(row, 'SubContactDetails.LeadSource') ||
              getNestedValue(row, 'ContactDetails.LeadSource') ||
              row.LeadSource || '';

            const contactId = row?.SubContactDetails?.ID ||
              row?.gsCustomersID ||
              row?.ContactDetails?.ID;

            const selectedValues = Array.isArray(leadSource)
              ? leadSource
              : typeof leadSource === 'string'
                ? leadSource.split(',').map(s => s.trim()).filter(Boolean)
                : [];

            

            if (!masterDataLoaded || !masterData.leadSources.length) {
              return <span className="text-sm text-gray-500">Loading...</span>;
            }

            return (
              <div onClick={(e) => e.stopPropagation()} className="min-w-[120px]">
                <SimpleMultiSelect
                  options={masterData.leadSources}
                  value={selectedValues}
                  onChange={async (selectedLabels) => {
                    try {
                      // Map selected display names back to their IDs
                      const selectedIds = selectedLabels
                        .map((labelOrId) => {
                          const option = masterData.leadSources.find(
                            (opt) => opt.label === labelOrId || String(opt.value) === String(labelOrId)
                          );
                          return option ? option.value : null;
                        })
                        .filter((id) => id !== null && id !== undefined);

                      if (contactId) {
                        await contactsApi.updateContact({
                          ID: contactId,
                          fieldName: "LeadSource",
                          fieldValue: selectedIds.join(","),
                          IsEmailIDVerificationEnabled: false,
                          IsSubContactUpdate: false,
                        });

                        
                        // Trigger refresh to update the data
                        refetch?.();
                      }
                    } catch (error) {
                      logger.error("Failed to update lead source:", error);
                    }
                  }}
                  placeholder="Select lead sources"
                  className="text-sm"
                />
              </div>
            );
          }
        };

      case 'leadType':
        return {
          ...baseColumn,
          render: (value, row) => {
            const leadType = getValueByPath(row, mappingPath) ||
              getNestedValue(row, 'SubContactDetails.LeadType') ||
              getNestedValue(row, 'ContactDetails.LeadType') ||
              row.LeadType || '';

            const contactId = row?.SubContactDetails?.ID ||
              row?.gsCustomersID ||
              row?.ContactDetails?.ID;

            const selectedValues = Array.isArray(leadType)
              ? leadType
              : typeof leadType === 'string'
                ? leadType.split(',').map(s => s.trim()).filter(Boolean)
                : [];

            

            if (!masterDataLoaded || !masterData.leadTypes.length) {
              return <span className="text-sm text-gray-500">Loading...</span>;
            }

            return (
              <div onClick={(e) => e.stopPropagation()} className="min-w-[120px]">
                <SimpleMultiSelect
                  options={masterData.leadTypes}
                  value={selectedValues}
                  onChange={async (selectedLabels) => {
                    try {
                      const selectedIds = selectedLabels
                        .map((labelOrId) => {
                          const option = masterData.leadTypes.find(
                            (opt) => opt.label === labelOrId || String(opt.value) === String(labelOrId)
                          );
                          return option ? option.value : null;
                        })
                        .filter((id) => id !== null && id !== undefined);

                      if (contactId) {
                        await contactsApi.updateContact({
                          ID: contactId,
                          fieldName: "LeadType",
                          fieldValue: selectedIds.join(","),
                          IsEmailIDVerificationEnabled: false,
                          IsSubContactUpdate: false,
                        });

                        
                        // Trigger refresh to update the data
                        refetch?.();
                      }
                    } catch (error) {
                      logger.error("Failed to update lead type:", error);
                    }
                  }}
                  placeholder="Select lead types"
                  className="text-sm"
                />
              </div>
            );
          }
        };

      default:
        // Generic text column for unmapped fields
        return {
          ...baseColumn,
          render: (value, row) => {
            const cellValue = getValueByPath(row, mappingPath) || value || '-';
            return <span className="text-sm">{cellValue}</span>;
          }
        };
    }
  };

  // Fallback to default columns if no API config
  const getDefaultColumns = () => {
    const baseColumns = [
      {
        id: 'edit',
        header: '',
        accessor: () => null,
        sortable: false,
        width: 50,
        render: (value, row) => (
          shouldShowEdit(row) ? (
            <button
              onClick={(e) => handleEditClick(e, row)}
              className="h-8 w-8 p-0 rounded hover:bg-gray-50 flex items-center justify-center"
              title={`Edit ${isOpportunities ? 'Opportunity' : 'Proposal'}`}
            >
              <Edit className="h-4 w-4 text-gray-600 hover:text-black" />
            </button>
          ) : (
            <div className="h-8 w-8 flex items-center justify-center">
              {/* Empty space to maintain alignment */}
            </div>
          )
        )
      },
      {
        id: 'name',
        header: searchType === 'opportunities' ? 'Opportunity Name' : 'Proposal Name',
        accessor: searchType === 'opportunities' ? 'Name' : 'Proposal',
        sortable: true,
        width: 200,
        render: (value, row) => {
          let displayName = '';
          if (searchType === 'proposals') {
            displayName = getNestedValue(row, 'Proposal.Name') || row.ProposalName || 'Untitled';
          } else {
            displayName = value || row.Name || 'Untitled';
          }
          return (
            <a href={`/${searchType}/${row.ID || row.id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center space-x-1">
              <span>{displayName}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        }
      },
      {
        id: 'company',
        header: 'Company Name',
        accessor: 'ContactDetails',
        sortable: true,
        width: 160,
        render: (value, row) => {
          const companyName = getNestedValue(row, 'ContactDetails.Name') ||
            getNestedValue(row, 'ContactDetails.CompanyName') ||
            row.CompanyName || 'N/A';
          return <span className="font-medium">{companyName}</span>;
        }
      },
      {
        id: 'amount',
        header: searchType === 'proposals' ? 'Proposal Amount' : 'Amount',
        accessor: searchType === 'proposals' ? 'Proposal' : 'Amount',
        sortable: true,
        type: 'currency',
        width: 120,
        render: (value, row) => {
          let amount = 0;
          if (searchType === 'proposals') {
            amount = parseFloat(getNestedValue(row, 'Proposal.Amount') || row.ProposalTotal || 0);
          } else {
            amount = parseFloat(value || row.Amount || 0);
          }
          return <span className="font-medium">${amount.toLocaleString()}</span>;
        }
      },
      {
        id: 'status',
        header: searchType === 'proposals' ? 'Proposal Status' : 'Status',
        accessor: searchType === 'proposals' ? 'Proposal' : 'Status',
        sortable: true,
        width: 100,
        render: (value, row) => {
          let status = '';
          if (searchType === 'proposals') {
            status = getNestedValue(row, 'Proposal.Status') || row.ProposalStatus || 'Unknown';
          } else {
            status = value || row.Status || 'Unknown';
          }

          const getStatusColor = (status) => {
            const statusLower = (status || '').toLowerCase();
            if (statusLower.includes('open') || statusLower.includes('active') || statusLower.includes('draft')) {
              return 'bg-green-100 text-green-800';
            } else if (statusLower.includes('won') || statusLower.includes('approved')) {
              return 'bg-blue-100 text-blue-800';
            } else if (statusLower.includes('lost') || statusLower.includes('rejected')) {
              return 'bg-red-100 text-red-800';
            } else if (statusLower.includes('sent') || statusLower.includes('pending')) {
              return 'bg-yellow-100 text-yellow-800';
            }
            return 'bg-gray-100 text-gray-800';
          };

          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
              {status}
            </span>
          );
        }
      }
    ];

    // Add opportunity-specific columns
    if (isOpportunities) {
      baseColumns.push(
        {
          id: 'stage',
          header: 'Stage',
          accessor: 'OppStageDetails',
          sortable: true,
          width: 140,
          render: (value, row) => {
            const stage = getNestedValue(row, 'OppStageDetails.Stage') || row.Stage || 'Unknown';
            const getStageColor = (stage) => {
              const stageColors = {
                'prospecting': 'bg-purple-500',
                'qualification': 'bg-blue-500',
                'proposal': 'bg-yellow-500',
                'negotiation': 'bg-orange-500',
                'closed won': 'bg-green-500',
                'closed': 'bg-green-500'
              };
              const stageLower = (stage || '').toLowerCase();
              return stageColors[stageLower] || 'bg-gray-500';
            };

            return (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStageColor(stage)}`}>
                {stage}
              </span>
            );
          }
        },
        {
          id: 'probability',
          header: 'Probability (%)',
          accessor: 'Probability',
          sortable: true,
          type: 'percentage',
          width: 140,
          render: (value) => <span>{value || '0'}%</span>
        },
        {
          id: 'projCloseDate',
          header: 'Proj Close Date',
          accessor: 'CloseDate',
          sortable: true,
          type: 'date',
          width: 140,
          render: (value) => {
            if (!value) return <span className="text-sm">N/A</span>;
            const date = new Date(value);
            return <span className="text-sm">{date.toLocaleDateString()}</span>;
          }
        }
      );
    } else {
      // Add proposal-specific columns
      baseColumns.push(
        {
          id: 'proposalId',
          header: 'Proposal ID',
          accessor: 'ProposalID',
          sortable: true,
          width: 100,
          render: (value, row) => {
            const proposalId = value || getNestedValue(row, 'Proposal.ID') || 'N/A';
            return <span className="font-medium">#{proposalId}</span>;
          }
        },
        {
          id: 'proposalRep',
          header: 'Proposal Rep',
          accessor: 'Proposal',
          sortable: true,
          width: 120,
          render: (value, row) => {
            const proposalRep = getNestedValue(row, 'Proposal.SalesRep.Name') || row.ProposalRep || 'Unassigned';
            if (!proposalRep || proposalRep === 'Unassigned') {
              return <span className="text-sm text-gray-500">Unassigned</span>;
            }
            const initials = proposalRep.split(' ').map(n => n[0]).join('').substring(0, 2);
            const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500'];
            const colorIndex = proposalRep.length % colors.length;
            return (
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-sm font-medium`}>
                  {initials}
                </div>
                <span className="text-sm">{proposalRep}</span>
              </div>
            );
          }
        },
        {
          id: 'approvalStatus',
          header: 'Approval Status',
          accessor: 'Proposal',
          sortable: true,
          width: 140,
          render: (value, row) => {
            const approvalStatus = getNestedValue(row, 'Proposal.ApprovalStatus') || row.ApprovalStatus || 'N/A';

            const getApprovalColor = (status) => {
              const statusLower = (status || '').toLowerCase();
              if (statusLower.includes('approved')) {
                return 'bg-green-100 text-green-800';
              } else if (statusLower.includes('pending')) {
                return 'bg-yellow-100 text-yellow-800';
              } else if (statusLower.includes('rejected')) {
                return 'bg-red-100 text-red-800';
              } else if (statusLower.includes('blank')) {
                return 'bg-gray-100 text-gray-600';
              }
              return 'bg-gray-100 text-gray-800';
            };

            return (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getApprovalColor(approvalStatus)}`}>
                {approvalStatus}
              </span>
            );
          }
        },
        {
          id: 'proposalDate',
          header: 'Proposal Date',
          accessor: 'Proposal',
          sortable: true,
          type: 'date',
          width: 140,
          render: (value, row) => {
            const proposalDate = getNestedValue(row, 'Proposal.ProposalDate') || row.ProposalDate;
            if (!proposalDate) return <span className="text-sm">N/A</span>;
            const date = new Date(proposalDate);
            return <span className="text-sm">{date.toLocaleDateString()}</span>;
          }
        }
      );
    }

    // Add common columns
    baseColumns.push(
      {
        id: 'assignedTo',
        header: 'Assigned Rep',
        accessor: 'AssignedTo',
        sortable: true,
        width: 120,
        render: (value) => {
          if (!value || value === 'Unassigned') {
            return <span className="text-sm text-gray-500">Unassigned</span>;
          }
          const initials = value.split(' ').map(n => n[0]).join('').substring(0, 2);
          const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500'];
          const colorIndex = value.length % colors.length;
          return (
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-sm font-medium`}>
                {initials}
              </div>
              <span className="text-sm">{value}</span>
            </div>
          );
        }
      },
      {
        id: 'contactName',
        header: 'Contact Name',
        accessor: 'ContactDetails',
        sortable: true,
        width: 160,
        render: (value, row) => {
          const contactName = getNestedValue(row, 'ContactDetails.ContactName') ||
            getNestedValue(row, 'ContactDetails.Name') ||
            row.ContactName || 'N/A';
          return <span>{contactName}</span>;
        }
      },
      {
        id: 'actions',
        header: '',
        accessor: () => null,
        sortable: false,
        width: 50,
        render: () => (
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>
        )
      }
    );

    return baseColumns;
  };

  const handleRefetch = () => {
    setIsViewsSidebarOpen(false);
    refetch();
  }

  // Define columns for EnhancedDataTable - fully API-driven
  const getColumns = () => {
    // Check multiple possible locations for column config
    const columnConfig = data?.apiColumnConfig || data?.ColumnConfig || data?.content?.Data?.ColumnConfig;

    if (columnConfig && Array.isArray(columnConfig) && columnConfig.length > 0) {
      logger.info('SearchResults: Using API column configuration:', columnConfig);
      return generateColumnsFromConfig(columnConfig);
    }

    // If no API config, return minimal columns to avoid conflicts
    
    return [
      {
        id: 'edit',
        header: '',
        accessor: () => null,
        sortable: false,
        width: 50,
        render: (value, row) => (
          shouldShowEdit(row) ? (
            <button
              onClick={(e) => handleEditClick(e, row)}
              className="h-8 w-8 p-0 rounded hover:bg-gray-50 flex items-center justify-center"
              title={`Edit ${isOpportunities ? 'Opportunity' : 'Proposal'}`}
            >
              <Edit className="h-4 w-4 text-gray-600 hover:text-black" />
            </button>
          ) : (
            <div className="h-8 w-8 flex items-center justify-center">
              {/* Empty space to maintain alignment */}
            </div>
          )
        )
      },
      {
        id: 'name',
        header: 'Name',
        accessor: 'Name',
        sortable: true,
        width: 200,
        render: (value, row) => {
          const displayName = value || row.Name || 'Untitled';
          return (
            <a href={`/${searchType}/${row.ID || row.id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center space-x-1">
              <span>{displayName}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        }
      },
      {
        id: 'actions',
        header: '',
        accessor: () => null,
        sortable: false,
        width: 50,
        render: () => (
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>
        )
      }
    ];
  };

  const columns = getColumns();

  // Prepare stats data from OpportunityResult array
  const opportunityResult = data?.opportunityResult || {};

  const opportunityStatsData = {
    totalCount: opportunityResult.TotIds || 0,
    totalAmount: `$${(opportunityResult.TotOppAmt || 0).toLocaleString()}`,
    totalWon: opportunityResult.Won || 0,
    totalWinAmount: `$${(opportunityResult.WinTotal || 0).toLocaleString()}`,
    totalOpen: opportunityResult.Open || 0,
    totalLost: opportunityResult.Lost || 0,
    winPercentage: `${opportunityResult.WinRatio || 0}%`
  };

  const proposalStatsData = {
    total: opportunityResult.Proposals || 0,
    amount: opportunityResult.ProposalsAmount || 0,
    activeProposals: opportunityResult.ActiveProposals || 0,
    activeProposalsAmount: opportunityResult.ActiveProposalsAmount || 0,
    sentProposals: opportunityResult.SentProposals || 0,
    sentProposalsAmount: opportunityResult.SentProposalsAmount || 0,
    approvedProposals: opportunityResult.ApprovedProposals || 0,
    approvedProposalsAmount: opportunityResult.ApprovedProposalsAmount || 0,
    conversionRate: opportunityResult.Proposals > 0 ?
      `${((opportunityResult.ConvertedToContracts / opportunityResult.Proposals) * 100 || 0).toFixed(1)}%` :
      '0%'
  };


  if (error) return <div className="flex items-center justify-center h-64"><div className="text-red-500">Error: {error.message}</div></div>;

  return (
    <>
      <style>{`
        .search-results-scroll-container {
          height: 100%;
          overflow: auto !important;
          position: relative;
        }
        
        .search-results-scroll-container .enhanced-data-table {
          overflow: visible !important;
          height: auto !important;
        }
        
        .search-results-scroll-container .enhanced-data-table > div {
          overflow: visible !important;
        }
        
        .search-results-scroll-container .overflow-x-auto {
          overflow: visible !important;
        }
        
        .search-results-scroll-container table {
          width: 100% !important;
        }
        
        /* Ensure table header stays visible during scroll */
        .search-results-scroll-container thead {
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          background-color: rgb(243, 244, 246) !important;
        }
      `}</style>
      <div className="h-screen bg-gray-50 flex flex-col">
        {/* Statistics Cards: hide in kanban and split views */}
        {(viewMode !== 'split' && viewMode !== 'kanban') && (
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
            {isOpportunities ? (
              <OpportunityStatsCards stats={opportunityStatsData} />
            ) : (
              <ProposalStatsCards stats={proposalStatsData} />
            )}
          </div>
        )}
        {/* Enhanced Filter Bar */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="px-2">
            <EnhancedFilterBar
              // Data and pagination
              total={data?.totalCount || 0}
              page={page}
              setPage={setPage}
              // Search
              searchQuery={''}
              searchPlaceholder={`Search ${title.toLowerCase()}...`}

              // Filters
              onFilterClick={handleFilterClick}
              filters={filterDefinitions}
              hasActiveFilters={Object.values(filters).some(value =>
                value && !value.toString().startsWith('All')
              )}

              // Actions
              onRefresh={() => refetch(buildQuickParams())}
              onNextPage={() => refetch(buildQuickParams())}
              // View controls
              activeView={viewMode}
              onViewChange={setViewMode}
              onViewsClick={() => setIsViewsSidebarOpen(true)}
              // Hide Kanban view for proposals
              hideViewIcons={searchType === 'proposals' ? ['kanban'] : []}
            />
          </div>
        </div>

        {/* Card View */}
        {loading && (
          <NewLoader />
        )}
        {!loading && viewMode === 'cards' && (
          <CardViewNew
            opportunities={data?.results || []}
            view={viewMode}
            onViewChange={setViewMode}
            filters={filters}
            onFilterChange={(f) => { setFilters(f); refetch(buildQuickParams(f)); }}
            users={[]}
            savedSearches={[]}
            sortConfig={[]}
            onSort={() => { }}
            onRefresh={() => refetch(buildQuickParams())}
            currentPage={1}
            onNextPage={() => { }}
            onPreviousPage={() => { }}
            totalCount={data?.totalCount || 0}
            onCardClick={() => { }}
            onEditOpportunity={() => { }}
          />
        )}

        {/* Kanban View - Only for opportunities */}
        {!loading && viewMode === 'kanban' && isOpportunities && (
          <div className="flex-1 min-h-0">
            <KanbanView
              opportunities={data?.results || []}
              view={viewMode}
              onViewChange={setViewMode}
              filters={filters}
              onFilterChange={(f) => { setFilters(f); refetch(buildQuickParams(f)); }}
              users={[]}
              onRefresh={() => refetch(buildQuickParams())}
              totalCount={data?.totalCount || 0}
              currentPage={page}
              onNextPage={() => setPage(page + 1)}
              onPreviousPage={() => setPage(page - 1)}
              savedSearches={{
                allOpportunities: [],
                myOpportunities: [],
              }}
              onAddOpportunity={() => { }}
            />
          </div>
        )}

        {/* Table View */}
        {!loading && viewMode === 'table' && (
          <div className="flex-1 min-h-0">
            <div className="search-results-scroll-container">
              <EnhancedDataTable
                data={enhanceRowsWithOptions(data?.results || [])}
                columns={columns}
                loading={loading}
                enableSelection={true}
                enablePagination={false}
                initialPageSize={1000}
                rowDensity="compact"
                className="table-content"
                id="search-results-table"
                bulkActionContext={searchType === 'opportunities' ? 'products' : 'schedules'}
                onRowClick={(row) => {
                  
                }}
                onRowDoubleClick={(row) => {
                  window.location.href = `/${searchType}/${row.ID || row.id}`;
                }}
                onRowSelect={(selectedRows) => {
                  
                }}
                onBulkAction={(action, rows) => {
                  
                }}
                onSort={(sortConfig) => {
                  
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Views Sidebar */}
      <div className={`${loading ? 'mask' : 'none'}`}>

        <ViewsSidebar
          isOpen={isViewsSidebarOpen}
          onClose={() => setIsViewsSidebarOpen(false)}
          columnOrder={getDefaultColumnOrder()}
          onColumnOrderChange={() => { }}
          onViewSelected={() => { }}
          pageType="opportunities"
          handleRefetch={()=> handleRefetch()}
          // setLoading={setIsLoading}
          />
      </div>
    </>
  );
};

export default SearchResults;