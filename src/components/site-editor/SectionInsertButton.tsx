'use client'

/**
 * Section Insert Button
 * Contextual button that appears between sections in edit mode
 * Allows users to add new sections at specific positions
 */

import React from 'react'
import { Plus } from 'lucide-react'

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
  visible = false,
  className
}: SectionInsertButtonProps) {
  const baseOpacity = visible ? 'opacity-100' : 'opacity-40'
  const tooltipText = position === 'above' ? 'Add section above' : 'Add section below'

  return (
    <div
      className={`
        relative w-full py-3
        flex items-center justify-center
        ${className || ''}
      `}
    >
      {/* Blue dashed line */}
      <div
        className={`
          absolute inset-x-0 top-1/2 -translate-y-1/2
          border-t-2 border-dashed border-blue-400
        `}
      />

      {/* Add block button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onInsert()
        }}
        className={`
          relative z-20
          flex items-center justify-center
          w-8 h-8 rounded-full
          border-2 border-blue-500 bg-white
          shadow-md
          text-blue-600
          cursor-pointer
          ${baseOpacity}
          hover:opacity-100
          focus:outline-none focus:ring-2 focus:ring-blue-400
        `}
        title={tooltipText}
        aria-label={tooltipText}
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">{tooltipText}</span>
      </button>
    </div>
  )
}
