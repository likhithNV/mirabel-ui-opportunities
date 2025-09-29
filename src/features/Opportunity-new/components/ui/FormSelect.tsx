import React from 'react';
import { SimpleSelect } from '@/shared/components/ui/SimpleSelect';
import { Label } from '@/shared/components/ui/label';

interface SelectOption {
  value: string
  label: string
}


interface FormSelectProps {

  id?: string;
  label: string | React.ReactNode;
value: string | number;
  options: SelectOption[]
  onChange: (value: string | number) => void;
  onFocus?: (value: string | number) => void;

  type?: string;
  error?: string | null;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  clearable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  placeholder?: string;
  isLoading?: boolean;
  onDropdownVisibleChange?: (open: boolean) => void;

}

export const FormSelect: React.FC<FormSelectProps> = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  options,
  placeholder = "Choose an option",
  error,
  disabled = false,
  required = false,
  className = '',
  clearable = false,
  onFocus,
  isLoading = false,
  onDropdownVisibleChange
}) => {
  const selectId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`space-y-2 ${className}`}>

      <Label htmlFor={selectId} className="text-sm font-medium text-ocean-600">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div
        onFocus={() => {
          if (onFocus) {
            onFocus(value);
          }
        }}
        onClick={() => {
          if (onFocus) {
            onFocus(value);
          }
        }}
      >
        <SimpleSelect
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          options={options}
          clearable={clearable}
          disabled={disabled}
          key={selectId}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};
