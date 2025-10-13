'use client'

/**
 * Editable Customer Site Section
 * Wraps CustomerSiteSection with edit mode capabilities
 */

import React, { useState, ReactNode } from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { useFullSiteEditor, useIsEditModeActive } from '@/src/contexts/FullSiteEditorContext'
import { SectionControls } from './SectionControls'

interface EditableCustomerSiteSectionProps {
  children: ReactNode
  sectionKey: string
  section: ContentSection
  className?: string
}

export function EditableCustomerSiteSection({
  children,
  sectionKey,
  section,
  className = ''
}: EditableCustomerSiteSectionProps) {
  const isEditMode = useIsEditModeActive()
  const { editorMode, activeSection, setActiveSection } = useFullSiteEditor()
  const [isHovered, setIsHovered] = useState(false)

  // If not in edit mode, just render children
  if (!isEditMode || editorMode === 'navigate') {
    return <>{children}</>
  }

  // In edit mode
  const isActive = activeSection === sectionKey
  const showControls = (isHovered || isActive) && editorMode === 'edit'

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setActiveSection(sectionKey)}
      data-section-key={sectionKey}
      data-edit-mode="true"
      style={{
        outline: showControls ? '2px dashed rgba(59, 130, 246, 0.5)' : 'none',
        outlineOffset: '4px',
        transition: 'outline 0.2s ease'
      }}
    >
      {/* Section Controls Overlay */}
      {showControls && (
        <SectionControls
          sectionKey={sectionKey}
          section={section}
        />
      )}

      {/* Section Content */}
      {children}
    </div>
  )
}
