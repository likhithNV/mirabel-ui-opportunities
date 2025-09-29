import React, { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import ReactDOM from "react-dom";

const ProposalEnhancedOpportunityNameField = ({ 
  value = [], 
  onChange, 
  placeholder = "Type opportunity name or select option..." 
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownId = useRef(`dropdown-${Math.random().toString(36).substr(2, 9)}`).current;

  // Predefined options
  const predefinedOptions = [
    { value: "IN=Is Empty~", label: "Is Empty" },
    { value: "INN=Is Not Empty~", label: "Is Not Empty" }
  ];

  // Parse and ensure value is always an array
  const parseValues = (val) => {
    if (!val) return [];
    
    // Handle array of values
    if (Array.isArray(val)) {
      return val.flatMap(v => parseValues(v));
    }
    
    // Handle single value
    const strVal = String(val);
    
    // Handle predefined options
    if (strVal.startsWith('IN=') || strVal.startsWith('INN=')) {
      return [strVal];
    }
    
    // Handle comma-separated values
    if (strVal.includes(',')) {
      return strVal.split(',').map(v => v.trim()).filter(Boolean);
    }
    
    // Handle single plain text value
    return [strVal];
  };

  const currentValues = parseValues(value);

  // Calculate dropdown position
  const calculateDropdownPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  // Update dropdown position when it opens
  useEffect(() => {
    if (isDropdownOpen) {
      calculateDropdownPosition();
      // Recalculate on window resize and scroll
      const handleResize = () => calculateDropdownPosition();
      const handleScroll = () => calculateDropdownPosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true); // Use capture to catch all scroll events
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if click is outside both the container and the dropdown
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(event.target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target);
      
      if (isOutsideContainer && isOutsideDropdown) {
        setIsDropdownOpen(false);
      }
    };

    // Use a higher priority event listener
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, []);

  // Global dropdown coordination - close other dropdowns when this one opens
  useEffect(() => {
    const handleGlobalDropdownOpen = (event) => {
      // Close this dropdown if another dropdown opened (and it's not this one)
      if (event.detail.dropdownId !== dropdownId && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('globalDropdownOpen', handleGlobalDropdownOpen);
    return () => {
      document.removeEventListener('globalDropdownOpen', handleGlobalDropdownOpen);
    };
  }, [isDropdownOpen, dropdownId]);

  // Dispatch global event when this dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      // Notify other dropdowns to close
      const event = new CustomEvent('globalDropdownOpen', {
        detail: { dropdownId }
      });
      document.dispatchEvent(event);
    }
  }, [isDropdownOpen, dropdownId]);

  // Handle adding a new custom value
  const handleAddCustomValue = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue) {
      // Use plain text (no SW= format)
      const formattedValue = trimmedValue;
      
      // Check if this value already exists
      const alreadyExists = currentValues.some(val => {
        if (val === formattedValue) return true;
        return val === trimmedValue;
      });
      
      if (!alreadyExists) {
        // Remove predefined options when adding custom values
        // Keep only existing custom values and add the new one
        const customValues = currentValues.filter(val => 
          !val.startsWith('IN=') && !val.startsWith('INN=')
        );
        const newValues = [...customValues, formattedValue];
        onChange(newValues);
        setInputValue("");
        setIsDropdownOpen(false);
      }
    }
  };

  // Handle removing a value
  const handleRemoveValue = (valueToRemove) => {
    const newValues = currentValues.filter(v => v !== valueToRemove);
    onChange(newValues);
  };

  // Handle selecting a predefined option
  const handleSelectPredefined = (option) => {
    // Check if this predefined option is already selected
    const isAlreadySelected = currentValues.includes(option.value);
    
    if (isAlreadySelected) {
      // Remove the predefined option if it's already selected
      const newValues = currentValues.filter(v => v !== option.value);
      onChange(newValues);
    } else {
      // When selecting a predefined option, clear all other values and only keep this one
      // This ensures that "Is Empty" and "Is Not Empty" are mutually exclusive with custom values
      onChange([option.value]);
    }
    
    // Close dropdown after selection
    setIsDropdownOpen(false);
  };

  // Handle input key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomValue();
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Keep dropdown open when typing, but don't remove predefined options
    if (value.trim().length > 0) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  };

  // Focus input when clicking on the container
  const handleContainerClick = () => {
    inputRef.current?.focus();
    // Only toggle dropdown if there's no input value, otherwise keep it open
    if (inputValue.trim().length === 0) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      setIsDropdownOpen(true);
    }
  };



  return (
    <div className="space-y-2">
      {/* Main input container - styled like other dropdowns */}
      <div className="relative" ref={containerRef}>
        <div 
          className={`relative border rounded-lg min-h-[48px] cursor-pointer transition-colors bg-white hover:bg-gray-50 ${
            isFocused 
              ? 'border-ocean-500 ring-2 ring-ocean-500/20' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={handleContainerClick}
        >
          {/* Display area */}
          <div className="flex items-start justify-between px-3 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1 items-start max-h-32 overflow-y-auto">
                {/* Display existing values as badges */}
                {currentValues.map((val, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="flex items-center gap-1 px-2 py-1 text-sm flex-shrink-0"
                  >
                    <span className="max-w-[200px] truncate">
                      {(() => {
                        const predefined = predefinedOptions.find(option => option.value === val);
                        if (predefined) return predefined.label;
                        // For custom text, show as is (no SW= format)
                        return val;
                      })()}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveValue(val);
                      }}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                
                {/* Always show input field for adding more values */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => {
                    setIsFocused(true);
                    setIsDropdownOpen(true);
                  }}
                  onBlur={() => setIsFocused(false)}
                  placeholder={currentValues.length === 0 ? placeholder : "Add more..."}
                  className="flex-1 min-w-[120px] border-0 p-0 shadow-none focus:ring-0 focus:outline-none bg-transparent text-base text-gray-700"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            {/* Chevron icon */}
            {/* <ChevronDown 
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`} 
            /> */}
          </div>
        </div>

        {/* Dropdown menu - rendered via portal */}
        {isDropdownOpen && ReactDOM.createPortal(
          <div 
            ref={dropdownRef}
            className="fixed z-[99] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`
            }}
          >
            {/* Custom value option - shown above predefined options */}
            {inputValue.trim() && (
              <div className="py-1">
                <div
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-gray-700"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddCustomValue();
                  }}
                >
                  {inputValue.trim()}
                </div>
              </div>
            )}

            {/* Predefined options */}
            <div className="py-1">
              {predefinedOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                    currentValues.includes(option.value) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectPredefined(option);
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Help text */}
      {/* <p className="text-xs text-gray-500">
        Type custom opportunity names or select predefined options. Selecting "Is Empty" or "Is Not Empty" will clear custom text.
      </p> */}
    </div>
  );
};

export default ProposalEnhancedOpportunityNameField; 