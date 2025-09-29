import { logger } from '../../shared/logger'

import React, { useState, useRef } from 'react'
import './EnhancedDataTable.css'
import { AdvancedDataTableProps, SortConfig } from './types/table.types'
import { useSelection } from './hooks/useSelection'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import { useColumnDragDrop } from './hooks/useColumnDragDrop'
import { useTableData } from './hooks/useTableData'
import { useTableEvents } from './hooks/useTableEvents'
import { useTableConfiguration } from './hooks/useTableConfiguration'
import TableHeader from './components/TableHeader'
import TableBody from './components/TableBody'
import BulkActionsToolbar from './components/BulkActionsToolbar'
import Pagination from './components/Pagination'
import TableContainer from './components/TableContainer'
import TableControls from './components/TableControls'
import { JSX } from 'react/jsx-runtime'

/**
 * Enhanced Data Table Component - Refactored for better maintainability
 * 
 * Features:
 * - Drag-and-drop column reordering
 * - Column resizing with constraints
 * - Persistent column preferences
 * - All existing table functionality
 * 
 * Now organized with extracted hooks and components for better separation of concerns
 */
const EnhancedDataTable = React.memo(<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error = null as string | null,
  onRowClick,
  onRowDoubleClick,
  onRowSelect,
  onBulkAction,
  onSort,
  enableSelection = true,
  enablePagination = true,
  initialPageSize = 25,
  rowDensity = 'compact',
  className = '',
  id,
  bulkActionContext = 'products'
}: AdvancedDataTableProps<T>) => {
  const tableRef = useRef<HTMLTableElement>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([])

  // Initialize drag-and-drop functionality
  const dragDrop = useColumnDragDrop({
    columns,
    storageKey: id ? `${id}-columns` : 'table-columns',
    onColumnReorder: (newOrder) => {
      logger.log('Column order changed:', newOrder)
    }
  })

  // Table configuration and setup
  const { tableId, columnStates } = useTableConfiguration({
    id,
    columns,
    dragDrop
  })

  // Data processing and pagination
  const { displayData, pagination } = useTableData({
    data,
    columns,
    sortConfig,
    enablePagination,
    initialPageSize
  })

  // Initialize selection functionality
  const selection = useSelection({
    data: displayData,
    selectedRows: selectedRows,
    onSelectionChange: setSelectedRows,
    enableMultiSelect: enableSelection,
    enableSelectAll: enableSelection,
    persistAcrossPages: enablePagination
  })

  // Initialize keyboard navigation
  const keyboard = useKeyboardNavigation({
    data: displayData,
    selectedRows: selectedRows,
    onSelectionChange: setSelectedRows,
    onRowClick: onRowClick,
    enableMultiSelect: enableSelection,
    tableRef: tableRef as React.RefObject<HTMLTableElement>
  })

  // Event handlers
  const { handleRowClick, handleRowDoubleClick, handleSelectAll, handleBulkAction, handleSort } = useTableEvents({
    enableSelection,
    onRowClick,
    onRowDoubleClick,
    onRowSelect,
    onBulkAction,
    onSort,
    selection,
    setSortConfig
  })

  return (
    <TableContainer
      className={className}
      tableId={tableId}
      rowDensity={rowDensity}
      onKeyDown={keyboard.handleKeyDown}
    >
      {/* Bulk actions toolbar */}
      {enableSelection && (
        <BulkActionsToolbar
          selectedCount={selection.selectionCount}
          totalCount={displayData.length}
          selectedData={selection.selectedRowData}
          onAction={(actionId, data, inputValue) => handleBulkAction(actionId, data)}
          onClearSelection={selection.deselectAll}
          context={bulkActionContext}
        />
      )}

      {/* Table container */}
      <div className="overflow-x-auto">
        <table ref={tableRef} className="data-table">
          <TableHeader
            columns={dragDrop.orderedColumns}
            columnStates={columnStates}
            sortConfig={sortConfig}
            onSort={handleSort}
            onResize={dragDrop.handleColumnResize}
            enableSelection={enableSelection}
            isAllSelected={selection.isAllSelected}
            isPartiallySelected={selection.isPartiallySelected}
            onSelectAll={handleSelectAll}
            dragState={dragDrop.dragState}
            onDragStart={dragDrop.handleDragStart}
            onDragOver={dragDrop.handleDragOver}
            onDragLeave={dragDrop.handleDragLeave}
            onDrop={dragDrop.handleDrop}
            onDragEnd={dragDrop.handleDragEnd}
            getColumnWidth={dragDrop.getColumnWidth}
          />

          <TableBody
            data={displayData}
            columns={dragDrop.orderedColumns}
            columnStates={columnStates}
            selectedRows={selection.selectedRows}
            rowDensity={rowDensity}
            loading={loading}
            error={error}
            onRowClick={handleRowClick}
            onRowDoubleClick={handleRowDoubleClick}
            onRowSelect={enableSelection ? (row) => {
              selection.toggleRowSelection(row)
              if (onRowSelect) {
                onRowSelect(selection.selectedRowData)
              }
            } : undefined}
            enableSelection={enableSelection}
            focusedRowIndex={keyboard.focusedRowIndex}
          />
        </table>
      </div>

      {/* Column management controls */}
      <TableControls
        sortConfig={sortConfig}
        dragState={dragDrop.dragState}
        onClearSort={() => setSortConfig([])}
        onResetColumns={dragDrop.resetColumnOrder}
      />

      {/* Pagination */}
      {enablePagination && (
        <div className="mt-4">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            pageSizeOptions={[25, 50, 100, 200]}
            showPageSizeSelector={true}
            showJumpToPage={true}
          />
        </div>
      )}

      {/* Table footer with stats */}
      {!enablePagination && (
        <div className="table-footer mt-4 flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing {data.length} items
          </div>

          <div className="flex items-center gap-4">
            {enableSelection && selection.selectionCount > 0 && (
              <span>{selection.selectionCount} selected</span>
            )}
          </div>
        </div>
      )}
    </TableContainer>
  )
}) as unknown as <T extends Record<string, any>>(props: AdvancedDataTableProps<T>) => JSX.Element

export default EnhancedDataTable