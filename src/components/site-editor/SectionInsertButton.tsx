'use client'

/**
 * Section Insert Button
 * Contextual button that appears between sections in edit mode
 * Allows users to add new sections at specific positions
 */

import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'

interface SectionInsertButtonProps {
  /** Position of the insert button relative to the section */
  position: 'above' | 'below'
  /** Section key to insert relative to */
  relativeTo?: string
  /** Callback when insert button is clicked */
  onInsert: () => void
  /** Whether the button should be visible (controlled by parent hover state) */
  visible?: boolean
  /** Additional class names */
  className?: string
}

export function SectionInsertButton({
  position,
  relativeTo,
  onInsert,
  visible = true,
  className
}: SectionInsertButtonProps) {
  const tooltipText = position === 'above' ? 'Add section above' : 'Add section below'

  return (
    <div
      className={cn(
        'relative flex items-center justify-center w-full py-3',
        'transition-all duration-200',
        // Always show with reduced opacity, full opacity on hover
        visible ? 'opacity-100' : 'opacity-40',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Horizontal divider line - always visible */}
      <div className="absolute inset-x-0 flex items-center">
        <div className={cn(
          'w-full border-t-2 border-dashed transition-colors',
          visible ? 'border-blue-400' : 'border-blue-200'
        )} />
      </div>

      {/* Plus button in center - always visible */}
      <Button
        size="sm"
        variant="outline"
        className={cn(
          'relative z-10 h-8 w-8 p-0 rounded-full',
          'bg-white border-2',
          visible
            ? 'border-blue-400 hover:border-blue-500'
            : 'border-blue-300 hover:border-blue-400',
          'hover:bg-blue-50',
          'transition-all duration-200',
          visible ? 'shadow-md' : 'shadow-sm',
          'hover:shadow-lg hover:scale-110'
        )}
        onClick={onInsert}
        title={tooltipText}
        aria-label={tooltipText}
      >
        <Plus className={cn(
          'w-4 h-4 transition-colors',
          visible ? 'text-blue-600' : 'text-blue-400'
        )} />
      </Button>
    </div>
  )
}
