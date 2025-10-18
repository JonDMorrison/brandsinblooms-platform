'use client'

/**
 * Section Controls
 * Floating controls that appear on hover for section management
 */

import React, { useState, useMemo } from 'react'
import { useFullSiteEditor } from '@/src/contexts/FullSiteEditorContext'
import { ContentSection, LAYOUT_SECTIONS } from '@/src/lib/content/schema'
import {
  Eye,
  EyeOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  Settings
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'
import { DeleteSectionModal } from './modals/DeleteSectionModal'

interface SectionControlsProps {
  sectionKey: string
  section: ContentSection
  onSettingsClick: () => void
}

export function SectionControls({ sectionKey, section, onSettingsClick }: SectionControlsProps) {
  const {
    toggleSectionVisibility,
    deleteSection,
    reorderSection,
    pageContent,
    layout
  } = useFullSiteEditor()

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Determine if this section is required for the current layout
  const layoutConfig = LAYOUT_SECTIONS[layout]
  const isRequired = layoutConfig.required.includes(sectionKey)

  // Determine if this section is first or last for up/down button states
  // Consider ALL sections (visible and hidden) since reordering works on all sections
  const { isFirst, isLast } = useMemo(() => {
    if (!pageContent?.sections) return { isFirst: false, isLast: false }

    const sectionKeys = Object.keys(pageContent.sections)
    const currentIndex = sectionKeys.indexOf(sectionKey)

    return {
      isFirst: currentIndex === 0,
      isLast: currentIndex === sectionKeys.length - 1
    }
  }, [pageContent?.sections, sectionKey])

  const handleDelete = () => {
    deleteSection(sectionKey)
  }

  // Determine disabled states
  const cannotHide = isRequired && section.visible
  const cannotMoveUp = isFirst || isRequired
  const cannotMoveDown = isLast
  const cannotDelete = isRequired

  return (
    <>
      <div
        className={cn(
          'absolute top-2 right-2 z-10',
          'flex items-center gap-1 p-1',
          'bg-white rounded-lg shadow-lg border border-gray-200',
          'animate-in fade-in duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hide/Show */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => toggleSectionVisibility(sectionKey)}
          disabled={cannotHide}
          title={
            cannotHide
              ? 'Required sections cannot be hidden'
              : section.visible
              ? 'Hide section'
              : 'Show section'
          }
        >
          {section.visible ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </Button>

        {/* Move Up */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => reorderSection(sectionKey, 'up')}
          disabled={cannotMoveUp}
          title={
            isRequired
              ? 'Required sections must stay first'
              : isFirst
              ? 'Already at the top'
              : 'Move section up'
          }
        >
          <ChevronUp className="w-4 h-4" />
        </Button>

        {/* Move Down */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => reorderSection(sectionKey, 'down')}
          disabled={cannotMoveDown}
          title={cannotMoveDown ? 'Already at the bottom' : 'Move section down'}
        >
          <ChevronDown className="w-4 h-4" />
        </Button>

        {/* Settings */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={onSettingsClick}
          title="Section settings"
        >
          <Settings className="w-4 h-4" />
        </Button>

        {/* Delete */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => setShowDeleteModal(true)}
          disabled={cannotDelete}
          title={
            cannotDelete
              ? 'Required sections cannot be deleted'
              : 'Delete section'
          }
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteSectionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        sectionKey={sectionKey}
        sectionType={section.type}
        onConfirm={handleDelete}
      />
    </>
  )
}
