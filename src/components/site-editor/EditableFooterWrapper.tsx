'use client'

/**
 * Editable Footer Wrapper
 * Wraps SiteFooter with edit mode capabilities
 * In edit mode: shows hover overlay with settings gear icon
 * In navigate mode: renders plain footer without editing UI
 */

import React, { useState, ReactNode, useContext } from 'react'
import { FullSiteEditorContext, useIsEditModeActive } from '@/src/contexts/FullSiteEditorContext'
import { HeaderFooterControls } from './HeaderFooterControls'
import { FooterSettingsModal } from './modals/FooterSettingsModal'

interface EditableFooterWrapperProps {
  children: ReactNode
}

export function EditableFooterWrapper({ children }: EditableFooterWrapperProps) {
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
  // Use wrapper approach (same pattern as header):
  // 1. Wrapper disables all clicks via pointer-events and provides positioning context
  // 2. Controls re-enable clicks with pointer-events: auto

  return (
    <>
      {/* Wrapper - disables clicks and provides positioning context */}
      <div
        style={{
          position: 'relative',
          pointerEvents: 'none', // Disable all clicks - cascades to footer and all children
          outline: isHovered ? '2px dashed rgba(59, 130, 246, 0.5)' : 'none',
          outlineOffset: '4px',
          transition: 'outline 0.2s ease'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Footer - render as-is, clicks disabled by wrapper */}
        {children}

        {/* Controls overlay - re-enable clicks for this element only */}
        {isHovered && (
          <div style={{ pointerEvents: 'auto' }}>
            <HeaderFooterControls
              type="footer"
              onSettingsClick={() => setShowSettingsModal(true)}
            />
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <FooterSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  )
}
