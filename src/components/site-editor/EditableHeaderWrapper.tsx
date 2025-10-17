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
  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          outline: isHovered ? '2px dashed rgba(59, 130, 246, 0.5)' : 'none',
          outlineOffset: '4px',
          transition: 'outline 0.2s ease'
        }}
      >
        {/* Header Controls Overlay */}
        {isHovered && (
          <HeaderFooterControls
            type="header"
            onSettingsClick={() => setShowSettingsModal(true)}
          />
        )}

        {/* Header Content */}
        {children}
      </div>

      {/* Settings Modal */}
      <HeaderSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  )
}
