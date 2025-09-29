import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import ReactDOM from "react-dom";

const EnhancedProposalIdField = ({ 
  label = "Proposal ID", 
  value = [], 
  onChange, 
  placeholder = "Type proposal ID..." 
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [popoverStyle, setPopoverStyle] = useState({});

  // Ensure value is always an array
  const currentValues = Array.isArray(value) ? value : (value ? 
    (typeof value === 'string' && value.includes(',') ? 
      value.split(',').map(v => v.trim()).filter(v => v) : 
      [value]
    ) : []
  );

  // Update popover position when open
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setPopoverStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: 300,
        padding: 0,
        margin: 0,
        background: '#fff',
        zIndex: 20000
      });
    }
  }, [isDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the dropdown container and the portal dropdown
      const isOutsideContainer = dropdownRef.current && !dropdownRef.current.contains(event.target);
      const isOutsidePortal = !event.target.closest('[data-proposal-id-dropdown]');
      
      if (isOutsideContainer && isOutsidePortal) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle adding a new custom value
  const handleAddCustomValue = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue) {
      // Format custom text as SW=value~ for backend compatibility
      const formattedValue = `SW=${trimmedValue}~`;
      
      // Check if this value already exists (either as formatted or unformatted)
      const valueExists = currentValues.some(val => {
        if (val === formattedValue) return true;
        if (val.startsWith('SW=') && val.endsWith('~')) {
          const existingValue = val.slice(3, -1); // Remove SW= and ~
          return existingValue === trimmedValue;
        }
        return val === trimmedValue;
      });
      
      if (!valueExists) {
        const newValues = [...currentValues, formattedValue];
        onChange(newValues);
        setInputValue("");
        setIsDropdownOpen(false);
      } else {
        // Value already exists, just clear the input
        setInputValue("");
      }
    }
  };

  // Handle removing a value
  const handleRemoveValue = (valueToRemove) => {
    const newValues = currentValues.filter(v => v !== valueToRemove);
    onChange(newValues);
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
    setInputValue(e.target.value);
  };

  // Focus input when clicking on the container
  const handleContainerClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    // Focus the input after a small delay to ensure dropdown state is updated
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Handle input click specifically
  const handleInputClick = (e) => {
    if (isDropdownOpen) {
      // If dropdown is open, close it and stop propagation
      setIsDropdownOpen(false);
      e.stopPropagation();
    }
    // If dropdown is closed, let the container click handler open it
  };

  return (
    <div className="space-y-2">
      {/* Main input container - styled like other dropdowns */}
      <div className="relative" ref={dropdownRef}>
        <div 
          className={`relative border rounded-md min-h-[42px] cursor-pointer transition-colors ${
            isFocused 
              ? 'border-ocean-500 ring-2 ring-ocean-500/20' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={handleContainerClick}
        >
          {/* Display area */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex-1 min-w-0">
              {currentValues.length === 0 ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={placeholder}
                  className="w-full border-0 p-0 shadow-none focus:ring-0 focus:outline-none bg-transparent"
                  onClick={handleInputClick}
                />
              ) : (
                <div className="flex flex-wrap gap-1">
                  {currentValues.map((val, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="flex items-center gap-1 px-2 py-1 text-sm"
                    >
                      <span className="max-w-[200px] truncate">
                        {/* For custom text, remove SW= and ~ to show user-friendly text */}
                        {val.startsWith('SW=') && val.endsWith('~') ? 
                          val.slice(3, -1) : val
                        }
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
                </div>
              )}
            </div>
            
            {/* Chevron icon removed */}
          </div>
        </div>

        {/* Dropdown menu - rendered via portal */}
        {isDropdownOpen && ReactDOM.createPortal(
          <div
            className="bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            style={popoverStyle}
            data-proposal-id-dropdown
          >
            {/* Custom text input in dropdown */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type proposal ID..."
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
                onClick={(e) => e.stopPropagation()}
              />
              {inputValue.trim() && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddCustomValue();
                  }}
                  className="mt-1 h-6 px-2 text-xs"
                >
                  Add "{inputValue.trim()}"
                </Button>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default EnhancedProposalIdField; 