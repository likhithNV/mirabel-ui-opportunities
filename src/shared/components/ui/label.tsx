import React from 'react'
import { cn } from '@/shared/lib/utils'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
  required?: boolean
  className?: string
}

export const Label: React.FC<LabelProps> = ({
  children,
  required = false,
  className="block text-sm font-medium text-ocean-600",
  ...props
}) => {
  return (
    <label
      className={cn(
        'form-label-base', // Uses consistent form label styling
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-error-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  )
}

export default Label