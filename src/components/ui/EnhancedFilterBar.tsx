// import { logger } from '../../utils/logger'

import { FC, useState } from 'react'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { SearchInput } from './SearchInput'
import { PowerMultiselect } from '../../shared/components/ui/PowerMultiselect'
import SettingsPanel from './SettingsPanel'

import {
  RefreshCw,
  Table,
  LayoutGrid,
  Layers,
  Filter,
  Kanban,
  List,
  PanelRight,
  Plus,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,

} from 'lucide-react'
import { Badge } from './badge'
import { FilterResetButton } from './ResetButton'
import { SortPresetsDropdown } from './SortPresetsDropdown'
import { SortPreset } from '../../components/shared/types/sortPresets'
import { FilterStateManager } from '../../components/shared/hooks/useFilterStateManager'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

// Legacy filter types for backward compatibility
interface FilterOption {
  value: string;
  label: string;
}

interface LegacyFilter {
  id: string;
  placeholder: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

interface LegacyMultiSelectFilter {
  id: string;
  placeholder: string;
  value: string[];
  options: FilterOption[];
  onChange: (values: string[]) => void;
  type: 'multi-select';
}

interface EnhancedFilterBarProps {
  // Core props
  total?: number;
  page?: number;
  setPage?: (page: number) => void;
  perPage?: number;
  activeView?: 'table' | 'cards' | 'kanban' | 'split';
  onViewChange?: (view: 'table' | 'cards' | 'kanban' | 'split') => void;
  onRefresh?: () => void;
  onViewsClick?: () => void;
  onFilterClick?: () => void;
  onSettingsClick?: () => void;
  onSortPresetChange?: (preset: SortPreset | null) => void;
  activeSortPreset?: string | null;
  searchPlaceholder?: string;
  hideViewIcons?: ('table' | 'cards' | 'kanban' | 'split')[];

  // Unified filter system (new approach)
  filterManager?: FilterStateManager;

  // Legacy filter system (backward compatibility)
  filters?: (LegacyFilter | LegacyMultiSelectFilter)[];
  onSearch?: (query: string) => void;
  searchQuery?: string;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  // Compact UI options
  compactResetButton?: boolean;
  onNextPage?: (params: {CurPage: number}) => void;
}

export const EnhancedFilterBar: FC<EnhancedFilterBarProps> = ({
  total = 0,
  page = 1,
  setPage,
  perPage = 25,
  activeView = 'table',
  onViewChange,
  onRefresh,
  onViewsClick,
  onFilterClick,
  onSettingsClick,
  onSortPresetChange,
  activeSortPreset = null,
  searchPlaceholder = "Search...",
  hideViewIcons = [],

  // Unified system
  filterManager,

  // Legacy system
  filters = [],
  onSearch,
  searchQuery = '',
  onResetFilters,
  hasActiveFilters = false,
  compactResetButton = false,
  onNextPage
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  // Determine which system to use
  const useUnifiedSystem = !!filterManager

  // Get filter data based on system
  const getFilterData = () => {
    if (useUnifiedSystem && filterManager) {
      return {
        searchFilter: filterManager.filters.find(f => f.type === 'search'),
        nonSearchFilters: filterManager.filters.filter(f => f.type !== 'search'),
        hasActiveFilters: filterManager.hasActiveFilters,
        onResetFilters: filterManager.clearAllFilters
      }
    } else {
      return {
        searchFilter: onSearch ? { value: searchQuery, onChange: onSearch } : null,
        nonSearchFilters: filters,
        hasActiveFilters,
        onResetFilters
      }
    }
  }

  const { searchFilter, nonSearchFilters, hasActiveFilters: hasActive, onResetFilters: handleReset } = getFilterData()

  return (
    <div className="w-full bg-white px-4 py-4 min-h-[68px] flex flex-wrap items-center justify-between gap-2">
      {/* Left Section */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search Input */}
        {searchFilter && (
          <SearchInput
            value={searchFilter.value || ''}
            onChange={useUnifiedSystem && filterManager 
              ? (value) => filterManager.setFilterValue('search', value)
              : searchFilter.onChange || (() => { })
            }
            placeholder={searchPlaceholder}
            className="w-40 h-9"
          />
        )}

        {/* Connected Filter Dropdowns */}
        {nonSearchFilters.length > 0 && (
          <div className="flex items-stretch flex-shrink-0">
            <div className="flex items-stretch rounded-lg border border-gray-300 overflow-hidden">
              {nonSearchFilters.map((filter, index) => {
                const isLast = index === nonSearchFilters.length - 1
                // Handle unified system filters
                if (useUnifiedSystem && 'type' in filter) {
                  const unifiedFilter = filter as any
                  const isMultiSelect = unifiedFilter.type === 'multi-select'
                  const hasSelection = unifiedFilter.isActive

                  if (isMultiSelect) {
                    const multiDiv = (
                      <div key={unifiedFilter.id} className={`w-[170px] ${!isLast ? 'border-r border-gray-300' : ''}`}>
                        <PowerMultiselect
                          placeholder={unifiedFilter.placeholder}
                          value={Array.isArray(unifiedFilter.value) ? unifiedFilter.value : []}
                          options={(unifiedFilter.options || []) as any}
                          onChange={(values) => filterManager!.setFilterValue(unifiedFilter.id, values)}
                          showChips={false}
                          compact
                          variant="borderless"
                        />
                      </div>
                    )
                    return multiDiv
                  } else {
                    return (
                      <div key={unifiedFilter.id} className={`w-[170px] ${!isLast ? 'border-r border-gray-300' : ''}`}>
                        <Select
                          value={unifiedFilter.value || ''}
                          onValueChange={(value) => { window.dispatchEvent(new CustomEvent('pm:forceClose')); filterManager!.setFilterValue(unifiedFilter.id, value) }}
                        >
                          <SelectTrigger
                            filter
                            className={`
                            h-9 w-[170px] px-3 text-sm font-normal shadow-none rounded-none border-0
                            ${hasSelection ? 'text-gray-900 bg-blue-50 hover:bg-blue-100' : 'text-gray-600 bg-transparent hover:bg-gray-50'}
                          `}>
                            <div className="flex items-center justify-between w-full">
                              <SelectValue placeholder={unifiedFilter.placeholder} />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                            {unifiedFilter.options
                              ?.filter((option: FilterOption) => option.value !== '')
                              ?.map((option: FilterOption) => {
                                const isHeader = typeof option.value === 'string' && option.value.startsWith('__group_');
                                if (isHeader) {
                                  return (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                      disabled
                                      className="font-semibold text-gray-900 pl-2 cursor-default pointer-events-none select-none"
                                    >
                                      {option.label}
                                    </SelectItem>
                                  )
                                }
                                return (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                )
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  }
                } else {
                  // Legacy filters
                  const isMultiSelect = 'type' in filter && filter.type === 'multi-select'
                  if (isMultiSelect) {
                    const multiFilter = filter as LegacyMultiSelectFilter
                    return (
                      <div key={multiFilter.id} className={`w-[170px] ${!isLast ? 'border-r border-gray-300' : ''}`}>
                        <PowerMultiselect
                          placeholder={multiFilter.placeholder}
                          value={multiFilter.value}
                          options={multiFilter.options as any}
                          onChange={(values) => multiFilter.onChange(values)}
                          showChips={false}
                          compact
                          variant="borderless"
                        />
                      </div>
                    )
                  } else {
                    const singleFilter = filter as LegacyFilter
                    const hasSelection = singleFilter.value && singleFilter.value !== '' && singleFilter.value !== 'all'
                    return (
                      <div key={singleFilter.id} className={`w-[170px] ${!isLast ? 'border-r border-gray-300' : ''}`}>
                        <Select value={singleFilter.value} onValueChange={(v) => { window.dispatchEvent(new CustomEvent('pm:forceClose')); singleFilter.onChange(v) }}>
                          <SelectTrigger
                            filter
                            className={`
                            h-9 w-[170px] px-3 text-sm font-normal shadow-none rounded-none border-0
                            ${hasSelection ? 'text-gray-900 bg-blue-50 hover:bg-blue-100' : 'text-gray-600 bg-transparent hover:bg-gray-50'}
                          `}>
                            <div className="flex items-center justify-between w-full">
                              <SelectValue placeholder={singleFilter.placeholder} />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                            {singleFilter.options
                              .filter(option => option.value !== '')
                              .map((option) => {
                                const isHeader = typeof option.value === 'string' && option.value.startsWith('__group_');
                                if (isHeader) {
                                  return (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                      disabled
                                      className="font-semibold text-gray-900 pl-2 cursor-default pointer-events-none select-none"
                                    >
                                      {option.label}
                                    </SelectItem>
                                  )
                                }
                                return (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                )
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  }
                }
              })}
            </div>
          </div>
        )}

        {/* Reset Filters Button */}
        {handleReset && (
          <FilterResetButton
            onReset={handleReset}
            hasActiveItems={hasActive}
            variant={compactResetButton ? 'minimal' : 'primary'}
            size="sm"
            iconOnly={compactResetButton}
          />
        )}
      </div>

      {/* Middle Section - Pagination centered */}
      <div 
        className="flex items-center justify-end gap-2 text-sm text-gray-600 whitespace-nowrap"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {onNextPage && onNextPage({CurPage: page - 1}); setPage && setPage(page - 1)}}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={5}>
            Previous page
          </TooltipContent>
        </Tooltip>
        <span>
          {((page - 1) * perPage) + 1}-{Math.min(page * perPage, total)} of {total}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {onNextPage && onNextPage({CurPage: page + 1}); setPage && setPage(page + 1)}}
              disabled={page * perPage >= total}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={5}>
            Next page
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => { }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={5}>
            Create Opportunity
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={5}>
            Refresh data
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => (onSettingsClick ? onSettingsClick() : setIsSettingsOpen(true))}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={5}>
            Settings
          </TooltipContent>
        </Tooltip>

        {onSortPresetChange && (
          <SortPresetsDropdown
            onSortPresetChange={onSortPresetChange}
            activePreset={activeSortPreset}
          />
        )}

        {/* View Toggle Buttons - Only show when onViewChange is provided */}
        {onViewChange && (() => {
          const visibleViews = [
            { key: 'table', icon: List, title: 'Table View' },
            { key: 'cards', icon: LayoutGrid, title: 'Card View' },
            { key: 'kanban', icon: Kanban, title: 'Kanban View' },
            { key: 'split', icon: PanelRight, title: 'Split View' }
          ].filter(view => !hideViewIcons.includes(view.key as any))

          if (visibleViews.length === 0) return null

          return (
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              {visibleViews.map((view, index) => {
                const IconComponent = view.icon
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        key={view.key}
                        variant={activeView === view.key ? 'default' : 'ghost'}
                        size="sm"
                        className={`h-9 w-9 p-0 rounded-none ${index > 0 ? 'border-l border-gray-300' : ''}`}
                        onClick={() => onViewChange(view.key as any)}
                      >
                        <IconComponent className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={5}>
                      {view.title}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          )
        })()}

        {onViewsClick && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4"
                onClick={onViewsClick}
              >
                Views
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={5}>
              Manage custom views
            </TooltipContent>
          </Tooltip>
        )}

        {onFilterClick && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="bg-ocean-500 text-white hover:bg-ocean-600 h-9 px-4"
                onClick={onFilterClick}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={5}>
              Advanced search
            </TooltipContent>
          </Tooltip>
        )}


      </div>
      {/* Embedded Settings Panel for default behavior */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}

export default EnhancedFilterBar