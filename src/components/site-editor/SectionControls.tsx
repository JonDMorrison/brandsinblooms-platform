'use client'

/**
 * Section Controls
 * Floating controls that appear on hover for section management
 */

import React from 'react'
import { useFullSiteEditor } from '@/src/contexts/FullSiteEditorContext'
import { ContentSection } from '@/src/lib/content/schema'
import {
  Eye,
  EyeOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Settings
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'

interface SectionControlsProps {
  sectionKey: string
  section: ContentSection
  onSettingsClick: () => void
}

export function SectionControls({ sectionKey, section, onSettingsClick }: SectionControlsProps) {
  const {
    hideSection,
    deleteSection,
    reorderSection,
    duplicateSection,
  } = useFullSiteEditor()

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      deleteSection(sectionKey)
    }
  }

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
          onClick={() => hideSection(sectionKey)}
          title={section.visible ? 'Hide section' : 'Show section'}
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
          title="Move section up"
        >
          <ChevronUp className="w-4 h-4" />
        </Button>

        {/* Move Down */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => reorderSection(sectionKey, 'down')}
          title="Move section down"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>

        {/* Duplicate */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => duplicateSection(sectionKey)}
          title="Duplicate section"
        >
          <Copy className="w-4 h-4" />
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
          onClick={handleDelete}
          title="Delete section"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </>
  )
}
