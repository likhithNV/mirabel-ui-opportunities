import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import ReactDOM from "react-dom";
import { cn } from "@/lib/utils";

const MultiSelectDropdown = ({
  id,
  label,
  options = [],
  value = [],
  onChange,
  placeholder = "Select options",
  disabled = false,
  isLoading = false,
  className = "",
  valueKey = "value",
  labelKey = "label",
  hideAllOption = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [dropdownWidth, setDropdownWidth] = useState(undefined);
  // State for portal position
  const [portalStyle, setPortalStyle] = useState({});
  const dropdownId = useRef(`dropdown-${Math.random().toString(36).substr(2, 9)}`).current;

  // Normalize value to always be an array of IDs
  let selectedValues = [];
  
  
  if (Array.isArray(value)) {
    selectedValues = value;
  } else if (typeof value === 'string' && value.includes('~')) {
    // Split IE format string into array (e.g., 'IE=0~IE=178~IE=170~')
    selectedValues = value.split('~').filter(Boolean).map(v => v + '~');
  } else if (typeof value === 'string' && value.length > 0) {
    selectedValues = [value];
  }
  

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const optionLabel = option[labelKey] || option.label || option.Label || option.Display || option.Source || `${option.FirstName || ''} ${option.LastName || ''}`.trim() || 'Unnamed Option';
    return optionLabel.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on X buttons or within dropdown content
      if (event.target.closest('[data-dropdown-content]') || 
          event.target.closest('.cursor-pointer') ||
          event.target.tagName === 'svg' ||
          event.target.closest('svg')) {
        return;
      }
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Use ResizeObserver to set dropdown width responsively
  useEffect(() => {
    let observer;
    const updateWidth = () => {
      if (buttonRef.current) {
        setDropdownWidth(buttonRef.current.offsetWidth);
      }
    };
    if (isOpen && buttonRef.current) {
      updateWidth();
      observer = new window.ResizeObserver(updateWidth);
      observer.observe(buttonRef.current);
      window.addEventListener('resize', updateWidth);
    }
    return () => {
      if (observer && buttonRef.current) observer.unobserve(buttonRef.current);
      window.removeEventListener('resize', updateWidth);
    };
  }, [isOpen]);

  // Helper to update portal position next to the trigger
  const updatePortalPosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 280; // maxHeight from dropdown styles
    
    // Check if there's enough space below the trigger
    const spaceBelow = viewportHeight - rect.bottom;
    const shouldPositionAbove = spaceBelow < dropdownHeight + 20; // 20px buffer
    
    setPortalStyle({
      position: 'fixed',
      top: shouldPositionAbove ? rect.top - dropdownHeight - 2 : rect.bottom + 2,
      left: rect.left,
      width: rect.width,
      zIndex: 99
    });
  };

  // Update portal position when open or size changes
  useEffect(() => {
    if (isOpen) {
      updatePortalPosition();
    }
  }, [isOpen, dropdownWidth]);

  // Reposition on scroll (including scrolling containers) and resize
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => updatePortalPosition();
    const handleResize = () => updatePortalPosition();
    // capture=true catches scrolls on any ancestor scrollable element
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Global dropdown coordination - close other dropdowns when this one opens
  useEffect(() => {
    const handleGlobalDropdownOpen = (event) => {
      // Close this dropdown if another dropdown opened (and it's not this one)
      if (event.detail.dropdownId !== dropdownId && isOpen) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('globalDropdownOpen', handleGlobalDropdownOpen);
    return () => {
      document.removeEventListener('globalDropdownOpen', handleGlobalDropdownOpen);
    };
  }, [isOpen, dropdownId]);

  // Dispatch global event when this dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Notify other dropdowns to close
      const event = new CustomEvent('globalDropdownOpen', {
        detail: { dropdownId }
      });
      document.dispatchEvent(event);
    }
  }, [isOpen, dropdownId]);

  const handleToggle = () => {
    if (!disabled && !isLoading) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm("");
      }
    }
  };

  const handleOptionToggle = (optionValue) => {
  
    
    if (disabled) {
     
      return;
    }
    
    // Special logic for Opportunity Creator: if '*Unassigned*' is selected, deselect all others
    if (id === 'created-rep') {
      const option = findOptionForValue(optionValue);
      const label = option ? (option[labelKey] || option.label || option.Label || option.Display || option.Source || `${option.FirstName || ''} ${option.LastName || ''}`.trim() || 'Unnamed Option') : '';
      const isUnassigned = label === '*Unassigned*';
      if (isUnassigned) {
        // Only select Unassigned, deselect all others
        onChange([optionValue]);
        return;
      } else {
        // If Unassigned is already selected, remove it
        const unassignedOption = options.find(opt => {
          const l = (opt[labelKey] || opt.label || opt.Label || opt.Display || opt.Source || `${opt.FirstName || ''} ${opt.LastName || ''}`.trim() || '');
          return l === '*Unassigned*';
        });
        let newValues = selectedValues.filter(v => {
          const o = findOptionForValue(v);
          const l = o ? (o[labelKey] || o.label || o.Label || o.Display || o.Source || `${o.FirstName || ''} ${o.LastName || ''}`.trim() || '') : '';
          return l !== '*Unassigned*';
        });
        if (selectedValues.includes(optionValue)) {
          newValues = newValues.filter(v => v !== optionValue);
        } else {
          newValues = [...newValues, optionValue];
        }
        onChange(newValues);
        return;
      }
    }
    // Special logic for Probability: if 'All Probabilities' or 'All' is selected, deselect all others; if any other is selected, deselect 'All Probabilities' or 'All'
    if (id === 'probability') {
      const option = findOptionForValue(optionValue);
      const label = option ? (option[labelKey] || option.label || option.Label || option.Display || option.Source || `${option.FirstName || ''} ${option.LastName || ''}`.trim() || 'Unnamed Option') : '';
      const isAll = label === 'All Probabilities' || label === 'All';
      const isZero = label === '0%';
      
      // Check if "All" is currently selected (when selectedValues is empty, it means "All" is selected)
      const isAllCurrentlySelected = selectedValues.length === 0;
      
      if (isAll) {
        // Selecting 'All Probabilities' or 'All' clears all others
        onChange([]);
        return;
      } else if (isZero) {
        // If '0%' is selected, deselect all others and only select '0%'
        onChange([optionValue]);
        return;
      } else {
        // If any other value is selected, remove "All" and handle normal selection
        let updated = selectedValues;
        if (updated.includes(optionValue)) {
          updated = updated.filter((v) => v !== optionValue);
        } else {
          updated = [...updated, optionValue];
        }
        onChange(updated);
        return;
      }
    }
    // Default logic for all other dropdowns
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(v => v !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newValues);
  };

  const handleRemoveTag = (tagValue) => {
 
    const newValues = selectedValues.filter(v => v !== tagValue);
   
    onChange(newValues);
  };

  const handleXButtonClick = (e, tagValue) => {
  
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    // Ensure dropdown stays open
    setTimeout(() => {
      setIsOpen(true);
    }, 0);
    
    handleRemoveTag(tagValue);
  };

  // Helper to extract normalized ID from value (handles IE=123~, IE=value~, SW=value~, and plain numbers)
  function extractNormalizedId(val) {
    if (val === undefined || val === null) return null;
    if (typeof val === 'string') {
      // Handle IE= format for numeric IDs (e.g., "IE=123~")
      const ieNumericMatch = val.match(/IE=(\d+)~/);
      if (ieNumericMatch) return ieNumericMatch[1];
      
      // Handle IE= format for string values (e.g., "IE=Campaign Name~")
      const ieStringMatch = val.match(/IE=(.+)~/);
      if (ieStringMatch) return ieStringMatch[1];
      
      // Handle SW= format (e.g., "SW=Campaign Name~")
      const swMatch = val.match(/SW=(.+)~/);
      if (swMatch) return swMatch[1];
      
      if (/^\d+$/.test(val)) return val;
    }
    if (typeof val === 'number') return String(val);
    return val;
  }

  // For mapping selected values to options, normalize both sides
  const normalizedSelectedIds = selectedValues.map(extractNormalizedId).filter(id => id !== null && id !== undefined);

  // Helper to find the matching option for a given selected value
  function findOptionForValue(val) {
    if (val === undefined || val === null) return null;
    const normId = extractNormalizedId(val);
   
    
    // Try to match by value property or by direct string match
    const found = options.find(opt => {
      if (typeof opt === 'string') {
        return opt === normId || opt === val;
      }
      const optValue = opt[valueKey] || opt.value || opt.Value || opt.ID;
      const optNormId = extractNormalizedId(optValue);
      
      // For campaign sources and other string-based options, try multiple matching strategies
      return optNormId === normId || 
             optValue === val || 
             optValue === normId ||
             (typeof val === 'string' && typeof optValue === 'string' && optValue === val.replace(/^SW=/, '').replace(/~$/, '')) || // Handle SW=value~ format
             (typeof val === 'string' && typeof optValue === 'string' && optValue === val.replace(/^IE=/, '').replace(/~$/, ''));   // Handle IE=value~ format
    });
    
    return found;
  }

  // For Opportunity Advanced Search: display selected values as comma-separated list in the button, not as tags below
  const getDisplayText = () => {
    if (selectedValues.length === 0) return '';
    if (selectedValues.length <= 3) {
      const labels = selectedValues.map(val => {
        const option = options.find(opt => (opt[valueKey] || opt.value || opt.Value || opt.ID) === val);
        return option ? (option[labelKey] || option.label || option.Label || option.Display || option.Source || `${option.FirstName || ''} ${option.LastName || ''}`.trim() || 'Unnamed Option') : val;
      });
      return labels.join(', ');
    }
    return `${selectedValues.length} selected`;
  };

  const getOptionValue = (option) => {
    return option[valueKey] || option.value || option.Value || option.ID || '';
  };

  const getOptionLabel = (option) => {
    return option[labelKey] || option.label || option.Label || option.Display || option.Source || `${option.FirstName || ''} ${option.LastName || ''}`.trim() || 'Unnamed Option';
  };

  const isActive = isOpen || selectedValues.length > 0;
  // Floating label logic (copied from FloatingLabelSelect) - only when label is provided
  const hasValue = selectedValues.length > 0 || label === 'Probability';
  const labelClasses = cn(
    "absolute left-3 transition-all duration-200 pointer-events-none z-10 px-1",
    hasValue || isOpen
      ? "top-1.5 text-xs text-primary bg-background"
      : "top-3.5 text-base text-muted-foreground bg-transparent"
  );

  // Prevent dropdown from closing on option/checkbox click
  const handleOptionMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className={labelClasses}>
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={cn(
          // Base button styles - use different styles when no label (inline mode)
          label
            ? "h-12 pt-6 pb-2 px-3 w-full min-w-0 focus:ring-2 focus:ring-ocean-500 focus:ring-offset-2 border bg-white hover:bg-gray-50 transition-colors focus:outline-none rounded-lg text-base shadow-none flex items-center justify-between"
            : "h-9 px-3 w-full min-w-0 text-sm outline-none bg-white flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer",
          // State-dependent styles for labeled mode
          label && isOpen ? "border-ocean-500 ring-2 ring-ocean-500" : label ? "border-gray-300" : "",
          disabled || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          // Allow className prop to override default styles
          className
        )}
        style={{ margin: 0, alignItems: 'center' }}
      >
        <span 
          className={cn(
            "truncate text-left flex-1",
            label ? "text-base text-gray-700" : "text-sm text-gray-700"
          )}
          title={(() => {
            const displayText = isLoading ? "Loading..." : (() => {
              if (id === 'probability') {
                if (selectedValues.length === 0) return "All Probabilities";
                if (selectedValues.length === 1) {
                  const option = findOptionForValue(selectedValues[0]);
                  const optionLabel = option ? getOptionLabel(option) : selectedValues[0];
                  // Handle both "All Probabilities" and "All" labels
                  if (optionLabel === 'All') return "All Probabilities";
                  return optionLabel;
                }
                return selectedValues.map(val => {
                  const option = findOptionForValue(val);
                  const optionLabel = option ? getOptionLabel(option) : val;
                  // Handle both "All Probabilities" and "All" labels
                  if (optionLabel === 'All') return "All Probabilities";
                  return optionLabel;
                }).join(", ");
              }
              // For inline mode (no label), show placeholder when nothing selected, names when items selected
              if (!label) {
                if (selectedValues.length === 0) return placeholder || "Select options";
                // Always show all selected names joined with commas (like opportunity table filters)
                const names = selectedValues.map(val => {
                  const option = findOptionForValue(val);
                  return option ? getOptionLabel(option) : val;
                }).join(", ");
                return names;
              }
              return selectedValues.length > 0 ? `${selectedValues.length} selected` : "";
            })();
            return displayText;
          })()}
        >
          {isLoading ? "Loading..." : (() => {
            if (id === 'probability') {
              if (selectedValues.length === 0) return "All Probabilities";
              if (selectedValues.length === 1) {
                const option = findOptionForValue(selectedValues[0]);
                const optionLabel = option ? getOptionLabel(option) : selectedValues[0];
                // Handle both "All Probabilities" and "All" labels
                if (optionLabel === 'All') return "All Probabilities";
                return optionLabel;
              }
              return selectedValues.map(val => {
                const option = findOptionForValue(val);
                const optionLabel = option ? getOptionLabel(option) : val;
                // Handle both "All Probabilities" and "All" labels
                if (optionLabel === 'All') return "All Probabilities";
                return optionLabel;
              }).join(", ");
            }
            // For inline mode (no label), show placeholder when nothing selected, names when items selected
            if (!label) {
              if (selectedValues.length === 0) return placeholder || "Select options";
              // Always show all selected names joined with commas (like opportunity table filters)
              const names = selectedValues.map(val => {
                const option = findOptionForValue(val);
                return option ? getOptionLabel(option) : val;
              }).join(", ");
              return names;
            }
            return selectedValues.length > 0 ? `${selectedValues.length} selected` : "";
          })()}
        </span>
        <span className="flex items-center justify-center h-full">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {/* Selected chips/tags below the button */}
      {/* Remove the block that renders selected chips/tags below the button */}
      {/* {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedValues.map((val, idx) => {
            const option = findOptionForValue(val);
            const label = option
              ? (option[labelKey] || option.label || option.Label || option.Display || option.Source || `${option.FirstName || ''} ${option.LastName || ''}`.trim() || 'Unnamed Option')
              : 'Unknown';
            return (
              <span key={val} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200 mr-1">
                {label}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={e => handleXButtonClick(e, val)}
                />
              </span>
            );
          })}
        </div>
      )} */}

      {/* Dropdown menu */}
      {isOpen && ReactDOM.createPortal(
        <div
          className="bg-white border border-gray-300 shadow-xl z-50 rounded-md overflow-hidden"
          data-dropdown-content
          style={{
            ...portalStyle,
            maxHeight: 288, // 72 * 4 options visible at once (18px per option)
            minWidth: Math.max(dropdownWidth || 220, 220),
            background: "#fff"
          }}
        >
          {/* Selected tags/chips at the top - similar to Opportunities quick filter */}
          {selectedValues.filter(val => val !== undefined && val !== null).length > 0 && (
            <div
              className="flex flex-wrap gap-1 px-3 pt-3 pb-1 border-b border-gray-200 bg-gray-50 sticky top-0 z-10"
              style={{ minHeight: '36px', maxHeight: '72px', overflowY: 'auto' }}
            >
              {selectedValues.filter(val => val !== undefined && val !== null).slice(0, 3).map((val) => {
                const option = findOptionForValue(val);
                const displayLabel = option
                  ? (option[labelKey] || option.label || option.Label || option.Display || option.Source || `${option.FirstName || ''} ${option.LastName || ''}`.trim() || 'Unnamed Option')
                  : 'Unknown';
                return (
                  <span
                    key={val}
                    className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded mr-1 border border-blue-200"
                  >
                    {displayLabel}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer hover:bg-blue-200 rounded"
                      style={{ zIndex: 1000 }}
                      onClick={(e) => handleXButtonClick(e, val)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    />
                  </span>
                );
              })}
              {selectedValues.filter(val => val !== undefined && val !== null).length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded border border-gray-300">
                  +{selectedValues.filter(val => val !== undefined && val !== null).length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Search input */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full mb-0 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={(e) => e.stopPropagation()}
              onFocus={() => setIsFocused && setIsFocused(true)}
              onBlur={() => setIsFocused && setIsFocused(false)}
              style={{ margin: 0 }}
            />
          </div>
          {/* Options */}
          <div className="px-3 py-2" style={{ overflowY: 'auto', maxHeight: '200px' }}>
            {/* Show "All" option first (unless hideAllOption is true) */}
            {!hideAllOption && (
              <>
                <div
                  className={cn(
                    "flex items-center mb-1 cursor-pointer hover:bg-blue-50 min-h-[18px]",
                    selectedValues.length === 0 ? "bg-blue-50" : ""
                  )}
                  onMouseDown={handleOptionMouseDown}
                  onClick={() => onChange([])}
                  style={{ minHeight: '18px' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.length === 0}
                    readOnly
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    style={{ minWidth: 16, minHeight: 16, margin: 0, marginRight: '8px' }}
                  />
                  <label
                    className="text-sm text-gray-700 cursor-pointer flex-1 truncate font-medium"
                    style={{ margin: 0 }}
                    onMouseDown={handleOptionMouseDown}
                  >
                    {(() => {
                      if (id === 'salesRep') return 'All Sales Reps';
                      if (id === 'product') return 'All Products';
                      if (id === 'businessUnit') return 'All Business Units';
                      if (id === 'probability') return 'All Probabilities';
                      return 'All';
                    })()}
                  </label>
                </div>

                {/* Separator line */}
                {filteredOptions.length > 0 && (
                  <div className="border-t border-gray-200 my-2"></div>
                )}
              </>
            )}

            {/* Regular options */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const optionValue = getOptionValue(option);
                const optionLabel = getOptionLabel(option);
                const normalizedOptionId = extractNormalizedId(optionValue);
        
                // Skip if this is already an "All" option to avoid duplicates
                const isAllOption = optionLabel === 'All Probabilities' || optionLabel === 'All' || 
                                   optionLabel === 'All Sales Reps' || optionLabel === 'All Products' || 
                                   optionLabel === 'All Business Units';
                if (isAllOption) return null;
                
                const checked = normalizedSelectedIds.includes(normalizedOptionId);
                
                return (
                  <div
                    key={`${id}-${optionValue}-${index}`}
                    className={cn(
                      "flex items-center mb-1 cursor-pointer hover:bg-blue-50 min-h-[18px]",
                      checked ? "bg-blue-50" : ""
                    )}
                    onMouseDown={handleOptionMouseDown}
                    onClick={() => handleOptionToggle(selectedValues.find((v) => extractNormalizedId(v) === normalizedOptionId) || optionValue)}
                    style={{ minHeight: '18px' }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      readOnly
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      style={{ minWidth: 16, minHeight: 16, margin: 0, marginRight: '8px' }}
                    />
                    <label
                      htmlFor={`${id}-${optionValue}-${index}`}
                      className="text-sm text-gray-700 cursor-pointer flex-1 truncate"
                      style={{ margin: 0 }}
                      onMouseDown={handleOptionMouseDown}
                    >
                      {optionLabel}
                    </label>
                  </div>
                );
              }).filter(Boolean)
            ) : (
              <div className="text-sm text-gray-500 py-2" style={{ margin: 0 }}>
                {isLoading ? 'Loading...' : 'No options available'}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MultiSelectDropdown;
