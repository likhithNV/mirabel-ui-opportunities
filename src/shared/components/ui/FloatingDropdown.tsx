import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'
import { throttle, getStableZIndex, createStableAnimationClass } from '@/shared/utils/flickerFix'

interface FloatingDropdownProps {
  isOpen: boolean
  onClose: () => void
  trigger: React.ReactNode
  children: React.ReactNode
  width?: string
  maxHeight?: string
  position?: 'left' | 'right'
  className?: string
}

export const FloatingDropdown: React.FC<FloatingDropdownProps> = ({
  isOpen,
  onClose,
  trigger,
  children,
  width = 'w-80',
  maxHeight = 'max-h-96',
  position = 'left',
  className = ''
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)
  const [isPositioned, setIsPositioned] = useState(false)

  // Throttled position update to prevent flickering
  const updatePosition = useCallback(throttle(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      
      // Only update if position changed significantly
      if (!triggerRect || 
          Math.abs(triggerRect.left - rect.left) > 1 || 
          Math.abs(triggerRect.top - rect.top) > 1 ||
          Math.abs(triggerRect.width - rect.width) > 1 ||
          Math.abs(triggerRect.height - rect.height) > 1) {
        setTriggerRect(rect)
      }
      
      if (!isPositioned) {
        setIsPositioned(true)
      }
    }
  }, 16), [isOpen, triggerRect, isPositioned]) // 60fps throttle

  // Update trigger position when opened or on scroll/resize
  useEffect(() => {
    if (isOpen) {
      // Initial position update with multiple attempts to ensure accuracy
      const updateWithRetry = () => {
        updatePosition()
        // Retry after a short delay to ensure DOM is fully rendered
        setTimeout(updatePosition, 10)
        setTimeout(updatePosition, 50)
      }
      
      requestAnimationFrame(updateWithRetry)
      
      const handleScroll = throttle(updatePosition, 16)
      const handleResize = throttle(updatePosition, 100)
      
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    } else {
      setIsPositioned(false)
      setTriggerRect(null)
    }
  }, [isOpen, updatePosition])

  // Stable click outside handler
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      onClose()
    }
  }, [onClose])

  // Stable keyboard handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        onClose()
        // Focus trigger element
        const focusableElement = triggerRef.current?.querySelector('button, [tabindex]:not([tabindex="-1"])') as HTMLElement
        focusableElement?.focus()
        break
    }
  }, [isOpen, onClose])

  // Event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, handleClickOutside, handleKeyDown])

  // Memoize animation styles
  const animationStyles = useMemo(() => 
    createStableAnimationClass(isOpen && isPositioned, 200), 
    [isOpen, isPositioned]
  )

  // Memoize dropdown styles
  const dropdownStyles = useMemo(() => {
    if (!triggerRect) return {}
    
    // Better positioning calculation
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top
    const dropdownHeight = 200 // Approximate max height
    
    // Position above if not enough space below
    const shouldPositionAbove = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight
    
    return {
      top: shouldPositionAbove 
        ? triggerRect.top + window.scrollY - dropdownHeight - 4
        : triggerRect.bottom + window.scrollY + 4,
      left: position === 'right' 
        ? triggerRect.right + window.scrollX - triggerRect.width
        : triggerRect.left + window.scrollX,
      width: width === 'w-full' ? triggerRect.width : undefined,
      minWidth: width === 'w-full' ? triggerRect.width : 320,
      maxWidth: width === 'w-full' ? triggerRect.width : 400,
      transformOrigin: shouldPositionAbove 
        ? (position === 'right' ? 'bottom right' : 'bottom left')
        : (position === 'right' ? 'top right' : 'top left'),
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 9999, // Higher z-index to ensure it appears above everything
      // Apply stable animation styles
      ...animationStyles,
      // Prevent sub-pixel rendering issues
      transform: `${animationStyles.transform} translateZ(0)`,
      backfaceVisibility: 'hidden',
      willChange: 'opacity, transform'
    }
  }, [triggerRect, position, width, animationStyles])

  return (
    <div className={cn("relative", className)}>
      {/* Trigger */}
      <div ref={triggerRef}>
        {trigger}
      </div>

      {/* Floating Dropdown - Use portal to escape overflow constraints */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className={cn(
            "fixed bg-white border border-gray-200 rounded-md shadow-lg overflow-y-auto",
            width,
            maxHeight,
            // Prevent flickering with stable positioning
            (!isPositioned || !triggerRect) && "opacity-0 pointer-events-none"
          )}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          role="menu"
          tabIndex={-1}
          style={triggerRect ? dropdownStyles : { opacity: 0, pointerEvents: 'none' }}
        >
          {triggerRect && children}
        </div>,
        document.body
      )}
    </div>
  )
}