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
        'relative flex items-center justify-center w-full py-2',
        'transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Horizontal divider line */}
      <div className="absolute inset-x-0 flex items-center">
        <div className="w-full border-t-2 border-dashed border-blue-300" />
      </div>

      {/* Plus button in center */}
      <Button
        size="sm"
        variant="outline"
        className={cn(
          'relative z-10 h-8 w-8 p-0 rounded-full',
          'bg-white border-2 border-blue-400',
          'hover:bg-blue-50 hover:border-blue-500',
          'transition-all duration-200',
          'shadow-sm hover:shadow-md'
        )}
        onClick={onInsert}
        title={tooltipText}
        aria-label={tooltipText}
      >
        <Plus className="w-4 h-4 text-blue-600" />
      </Button>
    </div>
  )
}
