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
  // Use wrapper approach (footer doesn't need sticky, but needs same pattern as header):
  // 1. Wrapper provides positioning context for controls and hover outline
  // 2. Footer gets inline styles to disable clicks

  return (
    <>
      {/* Wrapper - provides positioning context and hover outline */}
      <div
        style={{
          position: 'relative',
          outline: isHovered ? '2px dashed rgba(59, 130, 246, 0.5)' : 'none',
          outlineOffset: '4px',
          transition: 'outline 0.2s ease'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Footer - disable all clicks */}
        {React.cloneElement(children as React.ReactElement, {
          style: {
            ...((children as React.ReactElement).props.style || {}),
            pointerEvents: 'none', // Disable all navigation
          }
        })}

        {/* Controls overlay - clickable despite parent having pointer-events: none */}
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
