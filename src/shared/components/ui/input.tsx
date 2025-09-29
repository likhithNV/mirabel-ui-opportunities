import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  modal?: boolean; // Use compact modal styling
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, modal = false, ...props }, ref) => {
    const baseClass = modal ? 'form-field-modal' : 'form-field-base';
    return (
      <input
        type={type}
        className={`${baseClass} w-full file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
