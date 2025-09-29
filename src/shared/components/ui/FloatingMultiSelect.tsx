import React from 'react'
import { TriggerButton } from './TriggerButton'
import { Badge } from './badge'
import { Check, X, Search } from 'lucide-react'
import { cn } from '../../utils/cn'

interface MultiSelectOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  category?: string
}

interface FloatingMultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  options: MultiSelectOption[]
  placeholder?: string
  label?: string
  icon?: React.ReactNode
  error?: string
  disabled?: boolean
  className?: string
  width?: string
  maxSelections?: number
  searchable?: boolean
  showSelectedCount?: boolean
  onDropdownVisibleChange?: (open: boolean) => void
}

export const FloatingMultiSelect: React.FC<FloatingMultiSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select options",
  label,
  icon,
  error,
  disabled = false,
  className = '',
  width = 'w-80',
  maxSelections,
  searchable = true,
  showSelectedCount = true,
  onDropdownVisibleChange
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLDivElement>(null)

  const toggle = () => {
    console.log('Toggle called, isOpen:', isOpen)
    setIsOpen(!isOpen)
  }
  const close = () => {
    console.log('Close called')
    setIsOpen(false)
  }

  // Debug logging
  React.useEffect(() => {
    console.log('FloatingMultiSelect props:', { value, options: options.length, isOpen })
  }, [value, options, isOpen])

  // Use ref to store the callback to prevent infinite loops
  const onDropdownVisibleChangeRef = React.useRef(onDropdownVisibleChange)
  onDropdownVisibleChangeRef.current = onDropdownVisibleChange

  // Call onDropdownVisibleChange when dropdown state changes
  React.useEffect(() => {
    if (onDropdownVisibleChangeRef.current) {
      onDropdownVisibleChangeRef.current(isOpen)
    }
  }, [isOpen])

  const selectedOptions = options.filter(option => value.includes(option.value))
  const hasSelections = selectedOptions.length > 0

  const filteredOptions = searchable
    ? options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : options

  // Group options by category if categories exist
  const categorizedOptions = React.useMemo(() => {
    const categories: Record<string, MultiSelectOption[]> = {}
    const uncategorized: MultiSelectOption[] = []

    filteredOptions.forEach(option => {
      if (option.category) {
        if (!categories[option.category]) {
          categories[option.category] = []
        }
        categories[option.category].push(option)
      } else {
        uncategorized.push(option)
      }
    })

    return { categories, uncategorized }
  }, [filteredOptions])

  const handleToggleOption = (optionValue: string) => {
    console.log('handleToggleOption called with:', optionValue)
    console.log('Current value:', value)
    console.log('Options:', options)

    const isSelected = value.includes(optionValue)
    console.log('isSelected:', isSelected)

    if (isSelected) {
      const newValue = value.filter(v => v !== optionValue)
      console.log('Removing, new value:', newValue)
      onChange(newValue)
    } else {
      if (maxSelections && value.length >= maxSelections) {
        console.log('Max selections reached')
        return // Don't add if max selections reached
      }
      const newValue = [...value, optionValue]
      console.log('Adding, new value:', newValue)
      onChange(newValue)
    }
  }

  const handleRemoveOption = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue))
  }

  const handleClearAll = () => {
    onChange([])
  }

  const getDisplayText = () => {
    if (!hasSelections) return placeholder
    if (selectedOptions.length === 1) return selectedOptions[0].label
    return `${selectedOptions.length} selected`
  }

  const renderOption = (option: MultiSelectOption) => {
    const isSelected = value.includes(option.value)
    const isDisabled = !isSelected && !!maxSelections && value.length >= maxSelections

    return (
      <div
        key={option.value}
        className={cn(
          "w-full flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors",
          isSelected && "bg-blue-50 text-blue-700 hover:bg-blue-100",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={(e) => {
        
          e.stopPropagation()
          if (!isDisabled) {
            handleToggleOption(option.value)
          }
        }}
      >
        <div className={cn(
          "w-4 h-4 border rounded flex items-center justify-center flex-shrink-0",
          isSelected
            ? "bg-blue-600 border-blue-600"
            : "border-gray-300"
        )}>
          {isSelected && (
            <Check className="h-3 w-3 text-white" />
          )}
        </div>

        {option.icon && (
          <span className="flex-shrink-0 text-gray-500">
            {option.icon}
          </span>
        )}

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {option.label}
          </div>
          {option.description && (
            <p className="text-xs text-gray-500 mt-1">
              {option.description}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        close()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={cn("relative", className)}>
      {label && (
        <label className="block text-sm font-medium text-ocean-600 mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div ref={triggerRef}>
        <TriggerButton
          isOpen={isOpen}
          hasActiveState={hasSelections}
          activeCount={showSelectedCount ? selectedOptions.length : 0}
          icon={icon}
          label={getDisplayText()}
          placeholder={placeholder}
          onClick={toggle}
          disabled={disabled}
          error={!!error}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-y-auto z-50",
            "max-h-80"
          )}
        >
          {/* Selected Items Section */}
          {hasSelections && (
            <>
              <div className="p-3 border-b border-gray-100">
                <div className="text-xs font-medium text-gray-700 mb-2">Selected</div>
                <div className="flex flex-wrap gap-2">
                  {selectedOptions.map(option => (
                    <Badge
                      key={option.value}
                      variant="secondary"
                      className="flex items-center gap-1 text-xs"
                    >
                      {option.label}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveOption(option.value)
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-gray-500">
                    {selectedOptions.length} selected
                    {maxSelections && ` of ${maxSelections} max`}
                  </span>
                  <button
                    className="text-xs px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleClearAll()
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    Clear all
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Search */}
          {searchable && (
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search options..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSearchTerm('')
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options */}
          <div className="py-1 max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              <>
                {/* Categorized Options */}
                {Object.entries(categorizedOptions.categories).map(([category, categoryOptions]) => (
                  <div key={category}>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                      {category}
                    </div>
                    {categoryOptions.map(renderOption)}
                  </div>
                ))}

                {/* Uncategorized Options */}
                {categorizedOptions.uncategorized.map(renderOption)}
              </>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                {searchable && searchTerm ? 'No options match your search' : 'No options available'}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}