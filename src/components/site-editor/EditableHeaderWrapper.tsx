'use client'

/**
 * Editable Header Wrapper
 * Wraps SiteNavigation with edit mode capabilities
 * In edit mode: shows hover overlay with settings gear icon
 * In navigate mode: renders plain header without editing UI
 */

import React, { useState, ReactNode, useContext } from 'react'
import { FullSiteEditorContext, useIsEditModeActive } from '@/src/contexts/FullSiteEditorContext'
import { HeaderFooterControls } from './HeaderFooterControls'
import { HeaderSettingsModal } from './modals/HeaderSettingsModal'

interface EditableHeaderWrapperProps {
  children: ReactNode
}

export function EditableHeaderWrapper({ children }: EditableHeaderWrapperProps) {
  const isEditMode = useIsEditModeActive()
  const context = useContext(FullSiteEditorContext)
  const [isHovered, setIsHovered] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

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
  // 1. Outer wrapper takes over sticky positioning from header
  // 2. Inner wrapper provides positioning context for controls
  // 3. Header gets inline styles to override sticky and disable clicks

  return (
    <>
      {/* Outer sticky wrapper - takes over sticky positioning */}
      <div
        style={{
          position: 'sticky',
          top: '3.5rem', // top-14 (56px) - matches header's edit mode sticky position
          zIndex: 30, // z-30 - matches header's edit mode z-index
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Inner wrapper - provides positioning context and hover outline */}
        <div
          style={{
            position: 'relative',
            outline: isHovered ? '2px dashed rgba(59, 130, 246, 0.5)' : 'none',
            outlineOffset: '4px',
            transition: 'outline 0.2s ease'
          }}
        >
          {/* Header - override sticky with relative, disable all clicks */}
          {React.cloneElement(children as React.ReactElement, {
            style: {
              ...((children as React.ReactElement).props.style || {}),
              position: 'relative', // Override sticky class (inline > class)
              pointerEvents: 'none', // Disable all navigation
            }
          })}

          {/* Controls overlay - clickable despite parent having pointer-events: none */}
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
