import React, { useState, useRef, useId } from 'react'
import { FloatingDropdown } from './FloatingDropdown'
import { ChevronDown, Check } from 'lucide-react'
import { Button } from './button'
import { useFloatingField } from '../../hooks/useFloatingField'
import { cn } from '../../utils/cn'

interface SelectOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface FloatingLabelSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  error?: string | null
  disabled?: boolean
  className?: string
  modal?: boolean  // true = 36px height, false = 40px height
  searchable?: boolean
  clearable?: boolean
  'data-testid'?: string
}

const FloatingLabelSelect: React.FC<FloatingLabelSelectProps> = ({
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  required = false,
  error,
  disabled = false,
  className = '',
  modal = false,  // false = 40px (regular), true = 36px (modal)
  searchable = false,
  clearable = false,
  'data-testid': testId
}) => {
  const { state, toggle, close } = useFloatingField()
  const [searchTerm, setSearchTerm] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const id = useId()
  const labelId = `${id}-label`
  const errorId = `${id}-error`
  
  const selectedOption = options.find(option => option.value === value)
  const hasValue = !!selectedOption
  const isFloating = state.isOpen || hasValue

  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    close()
    setSearchTerm('')
    onBlur?.()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    close()
    onBlur?.()
  }

  const handleToggle = () => {
    if (!disabled) {
      toggle()
    }
  }

  const displayText = selectedOption?.label || ''

  return (
    <div className={cn("relative mt-2", className)}>
      <FloatingDropdown
        isOpen={state.isOpen}
        onClose={close}
        width="w-full"
        trigger={
          <div className="relative">
            {/* Select Button */}
            <button
              ref={triggerRef}
              id={id}
              type="button"
              disabled={disabled}
              onClick={handleToggle}
              data-testid={testId}
              aria-labelledby={labelId}
              aria-describedby={error ? errorId : undefined}
              aria-invalid={!!error}
              aria-required={required}
              aria-expanded={state.isOpen}
              aria-haspopup="listbox"
              className={cn(
                // Base styles
                "w-full px-3 border rounded-md transition-all duration-200 ease-out text-left",
                "bg-white text-gray-900 focus:outline-none focus:ring-0",
                
                // Exact height specifications with proper text centering
                modal 
                  ? "h-9 text-sm" // 36px height for modals
                  : "h-10 text-base", // 40px height for regular pages
                
                // Padding adjustments based on floating state - better centering
                isFloating
                  ? (modal ? "pt-2 pb-2" : "pt-2.5 pb-2.5") // Reduced top padding to lift text up
                  : (modal ? "py-2" : "py-2.5"), // Match input field padding
                
                // Focus border colors - ocean blue
                "focus:border-ocean-600",
                
                // Error states
                error 
                  ? "border-red-300 focus:border-red-500" 
                  : "border-gray-300",
                
                // Open state
                state.isOpen && !error && "border-ocean-600",
                
                // Disabled state
                disabled && "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200",
                
                // Ensure proper z-index for floating label
                "relative z-0"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "truncate",
                  hasValue ? "text-gray-900" : "text-gray-400"
                )}>
                  {hasValue ? displayText : (placeholder || 'Select...')}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {clearable && hasValue && !disabled && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                      aria-label="Clear selection"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 transition-transform duration-200 text-gray-400",
                      state.isOpen && "rotate-180"
                    )} 
                  />
                </div>
              </div>
            </button>
            
            {/* Floating Label */}
            <label
              id={labelId}
              htmlFor={id}
              onClick={() => triggerRef.current?.focus()}
              className={cn(
                "absolute left-3 transition-all duration-200 ease-out cursor-text select-none",
                "pointer-events-none bg-white px-1",
                
                // Floating state positioning
                isFloating
                  ? cn(
                      // Floating position - above the input
                      modal ? "-top-2 text-xs" : "-top-2.5 text-xs",
                      "font-medium z-10",
                      // Ocean blue color for active floating labels
                      error ? "text-red-600" : "text-ocean-600"
                    )
                  : cn(
                      // Inside input position - better centered
                      modal ? "top-2 text-sm" : "top-2.5 text-base",
                      // Ocean blue color for ALL labels (design system requirement)
                      error ? "text-red-600" : "text-ocean-600",
                      "z-10"
                    ),
                
                // Disabled state
                disabled && "text-gray-400"
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        }
      >
        {searchable && (
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search options..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-600"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
        )}

        <div className="py-1 max-h-60 overflow-y-auto">
          {!hasValue && placeholder && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-auto p-3 text-left hover:bg-gray-50 text-gray-500"
              onClick={() => handleSelect('')}
            >
              {placeholder}
            </Button>
          )}
          
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start h-auto p-3 text-left hover:bg-gray-50",
                  option.value === value && "bg-ocean-50 text-ocean-700 hover:bg-ocean-100"
                )}
                onClick={() => handleSelect(option.value)}
              >
                <div className="flex items-center gap-3 w-full">
                  {option.icon && (
                    <span className="flex-shrink-0 text-gray-500">
                      {option.icon}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">
                        {option.label}
                      </span>
                      {option.value === value && (
                        <Check className="h-4 w-4 text-ocean-600 flex-shrink-0" />
                      )}
                    </div>
                    {option.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
              </Button>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              {searchable && searchTerm ? 'No options match your search' : 'No options available'}
            </div>
          )}
        </div>
      </FloatingDropdown>
      
      {/* Error Message */}
      {error && (
        <p id={errorId} className="text-red-600 text-sm mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export { FloatingLabelSelect }
export default FloatingLabelSelect