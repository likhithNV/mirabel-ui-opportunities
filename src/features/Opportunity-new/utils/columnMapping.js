
// Column mapping utilities for transforming API data to table columns

// Default column order for the opportunities table
export const getDefaultColumnOrder = () => [
  { id: 'opportunityName', label: 'Opportunity Name' },
  { id: 'companyName', label: 'Company' },
  { id: 'contactName', label: 'Contact' },
  { id: 'assignedRep', label: 'Assigned Rep' },
  { id: 'stage', label: 'Stage' },
  { id: 'status', label: 'Status' },
  { id: 'amount', label: 'Amount' },
  { id: 'probability', label: 'Probability' },
  { id: 'projCloseDate', label: 'Proj. Close Date' },
  { id: 'actualCloseDate', label: 'Actual Close Date' },
  { id: 'createdDate', label: 'Created Date' },
  { id: 'description', label: 'Description' },
  { id: 'source', label: 'Source' },
  { id: 'opportunityType', label: 'Opportunity Type' },
  { id: 'createdBy', label: 'Created By' },
  { id: 'lastActivity', label: 'Last Activity' },
  { id: 'lastActivityDate', label: 'Last Activity Date' },
  { id: 'nextStep', label: 'Next Step' },
  { id: 'product', label: 'Product' },
  { id: 'leadStatus', label: 'Lead Status' },
  { id: 'leadSource', label: 'Lead Source' },
  { id: 'leadType', label: 'Lead Type' },
  { id: 'prospectingStage', label: 'Prospecting Stage' },
  { id: 'proposalId', label: 'Proposal ID' },
  { id: 'lossReason', label: 'Loss Reason' },
  { id: 'salesPresenter', label: 'Sales Presenter' },
  { id: 'businessUnit', label: 'Business Unit' },
  { id: 'forecastRevenue', label: 'Forecast Revenue' },
  { id: 'opportunityId', label: 'Opportunity ID' },
  { id: 'contactId', label: 'Contact ID' }
];

// Map API column names to our table column structure
export const mapApiColumnsToTableColumns = (apiColumnsString) => {
  console.log('mapApiColumnsToTableColumns: Input string:', apiColumnsString);
  
  if (!apiColumnsString || apiColumnsString.trim() === '') {
    console.log('mapApiColumnsToTableColumns: No visible columns specified, returning default columns');
    return getDefaultColumnOrder();
  }

  // Split by comma and filter out empty strings, also clean up brackets and whitespace
  const apiColumnNames = apiColumnsString.split(',')
    .map(col => col.trim().replace(/^\[|\]$/g, ''))
    .filter(col => col.trim() !== '');
  
  console.log('mapApiColumnsToTableColumns: Processing API columns:', apiColumnNames);
  
  const allColumns = getDefaultColumnOrder();
  
  // Create comprehensive mapping from API names to our column IDs
  const apiToColumnMap = {
    // Direct mappings
    'AssignedTo': 'assignedRep',
    'OwnerName': 'createdBy',
    'TypeName': 'opportunityType',
    'CustomerName': 'companyName',
    'CloseDate': 'projCloseDate',
    'Description': 'description',
    'Amount': 'amount',
    'Source': 'source',
    'Status': 'status',
    'name': 'opportunityName',
    'Name': 'opportunityName',
    'CreatedDateFrom': 'createdDate',
    'CreatedDate': 'createdDate',
    'SubContactName': 'contactName',
    'ProposalID': 'proposalId',
    'ForecastRevenue': 'forecastRevenue',
    'NextStep': 'nextStep',
    'Notes': 'description',
    'SalesPresenter': 'salesPresenter',
    'BusinessUnit': 'businessUnit',
    'LeadStatus': 'leadStatus',
    'LeadSource': 'leadSource',
    'LeadType': 'leadType',
    'ProspectingStage': 'prospectingStage',
    'Product': 'product',
    'LossReason': 'lossReason',
    'LastActivity': 'lastActivity',
    'ActivityField': 'lastActivityDate',
    'OpportunityField': 'lastActivity',
    'ID': 'opportunityId',
    'ContactID': 'contactId',
    'gsCustomersID': 'contactId',
    
    // Additional mappings based on console logs
    'Stage': 'stage',
    'Probability': 'probability',
    'ActualCloseDate': 'actualCloseDate'
  };

  // Map API columns to our column structure - ONLY include columns that are in the visible columns list
  const mappedColumns = [];
  
  apiColumnNames.forEach(apiCol => {
    const trimmedCol = apiCol.trim();
    
    // Skip empty columns
    if (!trimmedCol) return;
    
    // Handle stage columns specially - improved logic for various stage formats
    if (trimmedCol.toLowerCase().startsWith('stage_') || 
        trimmedCol.toLowerCase().startsWith('stage ') ||
        trimmedCol.toLowerCase().includes('stage_') ||
        trimmedCol.toLowerCase().includes('stage ')) {
      
      // Extract stage name from different formats
      let stageName = trimmedCol;
      
      // Remove "stage_" prefix if present
      if (stageName.toLowerCase().startsWith('stage_')) {
        stageName = stageName.substring(6);
      } else if (stageName.toLowerCase().startsWith('stage ')) {
        stageName = stageName.substring(6);
      }
      
      // Remove " Done" suffix if present
      stageName = stageName.replace(/ Done$/i, '').trim();
      
      // Create a clean ID for the stage
      const stageId = `stage${stageName.replace(/[^a-zA-Z0-9]/g, '')}`;
      
      mappedColumns.push({
        id: stageId,
        label: stageName
      });
      console.log('mapApiColumnsToTableColumns: Added stage column:', { id: stageId, label: stageName });
      return;
    }
    
    // Check if we have a direct mapping
    const columnId = apiToColumnMap[trimmedCol];
    if (columnId) {
      const existingColumn = allColumns.find(col => col.id === columnId);
      if (existingColumn) {
        mappedColumns.push(existingColumn);
        console.log('mapApiColumnsToTableColumns: Mapped column:', trimmedCol, 'to', existingColumn.id);
        return;
      }
    }
    
    // Try to find by lowercase comparison
    const foundColumn = allColumns.find(col => 
      col.id.toLowerCase() === trimmedCol.toLowerCase() ||
      col.label.toLowerCase() === trimmedCol.toLowerCase()
    );
    
    if (foundColumn) {
      mappedColumns.push(foundColumn);
      console.log('mapApiColumnsToTableColumns: Found column by lowercase match:', trimmedCol, 'to', foundColumn.id);
    } else {
      // Create a new column for unmapped API columns
      const newColumn = {
        id: trimmedCol,
        label: trimmedCol.replace(/([A-Z])/g, ' $1').trim()
      };
      mappedColumns.push(newColumn);
      console.log('mapApiColumnsToTableColumns: Created new column:', newColumn);
    }
  });

  console.log('mapApiColumnsToTableColumns: Final mapped columns:', mappedColumns.map(col => col.id));
  console.log('mapApiColumnsToTableColumns: Total columns returned:', mappedColumns.length);
  
  // CRITICAL: If we have visible columns specified, return ONLY those columns
  // Do NOT fall back to default columns
  if (mappedColumns.length === 0 && apiColumnsString.trim() !== '') {
    console.warn('mapApiColumnsToTableColumns: No columns were mapped but visible columns were specified. This might indicate a mapping issue.');
    console.warn('mapApiColumnsToTableColumns: Original visible columns string:', apiColumnsString);
    console.warn('mapApiColumnsToTableColumns: Parsed column names:', apiColumnNames);
  }
  
  return mappedColumns;
};
