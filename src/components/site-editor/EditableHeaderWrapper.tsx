'use client'

/**
 * Editable Header Wrapper
 * Wraps SiteNavigation with edit mode capabilities
 * In edit mode: shows hover overlay with settings gear icon
 * In navigate mode: renders plain header without editing UI
 */

import React, { useState, ReactNode, useContext } from 'react'
import { FullSiteEditorContext, useIsEditModeActive } from '@/src/contexts/FullSiteEditorContext'
import { useDesignSettings } from '@/src/hooks/useDesignSettings'
import { HeaderFooterControls } from './HeaderFooterControls'
import { HeaderSettingsModal } from './modals/HeaderSettingsModal'

interface EditableHeaderWrapperProps {
  children: ReactNode
}

export function EditableHeaderWrapper({ children }: EditableHeaderWrapperProps) {
  const isEditMode = useIsEditModeActive()
  const context = useContext(FullSiteEditorContext)
  const { data: designSettings } = useDesignSettings()
  const [isHovered, setIsHovered] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // Get sticky header setting from theme
  const stickyHeader = designSettings?.layout?.stickyHeader !== false

  // If not in edit mode or no context available, just render children
  if (!isEditMode || !context) {
    return <>{children}</>
  }

  const { editorMode } = context

  // In Navigate mode: render children without edit UI
  if (editorMode === 'navigate') {
    return <>{children}</>
  }

  // In Edit mode: render with hover overlay and controls
  // Use double wrapper approach:
  // 1. Outer wrapper takes over sticky positioning from header (when enabled)
  // 2. Inner wrapper disables all clicks via pointer-events and provides positioning context
  // 3. Header gets inline style to override sticky class (prevent conflict with wrapper)

  // Type assert children for cloning
  const headerElement = children as React.ReactElement<{ style?: React.CSSProperties }>
  const existingStyle = headerElement.props?.style || {}

  return (
    <>
      {/* Outer wrapper - conditionally sticky based on stickyHeader setting */}
      <div
        style={{
          position: stickyHeader ? 'sticky' : 'relative',
          top: stickyHeader ? '3.5rem' : undefined, // top-14 (56px) - matches header's edit mode sticky position
          zIndex: 30, // z-30 - matches header's edit mode z-index
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Inner wrapper - disables clicks and provides positioning context */}
        <div
          style={{
            position: 'relative',
            pointerEvents: 'none', // Disable all clicks - cascades to header and all children
            outline: isHovered ? '2px dashed rgba(59, 130, 246, 0.5)' : 'none',
            outlineOffset: '4px',
            transition: 'outline 0.2s ease'
          }}
        >
          {/* Header - override sticky positioning to prevent conflict with wrapper */}
          {React.cloneElement(headerElement, {
            style: {
              ...existingStyle,
              position: 'relative', // Override sticky class (inline > class)
            }
          })}

          {/* Controls overlay - re-enable clicks for this element only */}
          {isHovered && (
            <div style={{ pointerEvents: 'auto' }}>
              <HeaderFooterControls
                type="header"
                onSettingsClick={() => setShowSettingsModal(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <HeaderSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  )
}
