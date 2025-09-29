import React, { useState, useEffect, useRef } from 'react'
import { Button } from './button'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface SheetContentProps {
  side?: 'left' | 'right' | 'top' | 'bottom'
  className?: string
  children: React.ReactNode
}

interface SheetHeaderProps {
  children: React.ReactNode
  className?: string
}

interface SheetTitleProps {
  children: React.ReactNode
  className?: string
}

interface SheetTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

// Context for sheet state
const SheetContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>({
  open: false,
  onOpenChange: () => {}
})

export const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

export const SheetTrigger: React.FC<SheetTriggerProps> = ({ asChild = false, children }) => {
  const { onOpenChange } = React.useContext(SheetContext)
  
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: () => onOpenChange(true)
    } as any)
  }

  return (
    <Button onClick={() => onOpenChange(true)}>
      {children}
    </Button>
  )
}

export const SheetContent: React.FC<SheetContentProps> = ({ 
  side = 'right', 
  className = '', 
  children 
}) => {
  const { open, onOpenChange } = React.useContext(SheetContext)
  const contentRef = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (open) {
      setShouldRender(true)
      // Small delay to ensure component renders in closed position first
      const timer = setTimeout(() => setIsAnimating(true), 10)
      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
      // Delay hiding to allow slide-out animation
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Don't close if clicking on a dropdown or modal
      if (target.closest('[data-dropdown]') || target.closest('[data-modal]')) {
        return
      }
      
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    if (shouldRender) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [shouldRender, onOpenChange])

  if (!shouldRender) return null

  const sideClasses = {
    left: 'left-0 top-0 h-full w-80 sm:w-96',
    right: 'right-0 top-0 h-full w-80 sm:w-96 lg:w-[540px]',
    top: 'top-0 left-0 w-full h-80',
    bottom: 'bottom-0 left-0 w-full h-80'
  }

  const transformClasses = {
    left: isAnimating ? 'translate-x-0' : '-translate-x-full',
    right: isAnimating ? 'translate-x-0' : 'translate-x-full',
    top: isAnimating ? 'translate-y-0' : '-translate-y-full',
    bottom: isAnimating ? 'translate-y-0' : 'translate-y-full'
  }

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 z-50 bg-black/80 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
      
      {/* Sheet Content */}
      <div
        ref={contentRef}
        className={`
          fixed z-50 bg-white p-6 shadow-lg transition-transform duration-300 ease-in-out
          ${sideClasses[side]}
          ${transformClasses[side]}
          ${className}
        `}
      >
        {children}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </>
  )
}

export const SheetHeader: React.FC<SheetHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`}>
      {children}
    </div>
  )
}

export const SheetTitle: React.FC<SheetTitleProps> = ({ children, className = '' }) => {
  return (
    <h2 className={`text-lg font-semibold text-foreground ${className}`}>
      {children}
    </h2>
  )
}

export const SheetClose: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { onOpenChange } = React.useContext(SheetContext)
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onOpenChange(false)}
      className={`h-10 w-10 p-2 rounded-full hover:bg-gray-100 hover:scale-110 transition-all duration-200 ${className}`}
    >
      <X className="close-button-md" />
    </Button>
  )
}