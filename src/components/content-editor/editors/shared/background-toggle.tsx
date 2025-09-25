/**
 * Reusable background color toggle component
 * Used by sections that support alternate background colors
 */

import React from 'react'
import { Label } from '@/src/components/ui/label'
import { ContentSection } from '@/src/lib/content/schema'

interface BackgroundToggleProps {
  sectionKey: string
  section: ContentSection
  onUpdate: (sectionKey: string, section: ContentSection) => void
  className?: string
  availableOptions?: Array<'default' | 'alternate' | 'primary'>
}

export function BackgroundToggle({
  sectionKey,
  section,
  onUpdate,
  className = '',
  availableOptions = ['default', 'alternate', 'primary']
}: BackgroundToggleProps) {
  const currentBackground = section.settings?.backgroundColor || 'default'

  const handleBackgroundChange = (backgroundColor: 'default' | 'alternate' | 'primary') => {
    const newSettings = { ...section.settings, backgroundColor }
    onUpdate(sectionKey, { ...section, settings: newSettings })
  }

  return (
    <div className={`p-3 border rounded-lg bg-muted/30 space-y-2 ${className}`}>
      <Label className="text-xs text-gray-500">Background Color</Label>
      <div className="flex gap-2 flex-wrap">
        {availableOptions.includes('default') && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`${sectionKey}-background`}
              value="default"
              checked={currentBackground === 'default'}
              onChange={() => handleBackgroundChange('default')}
              className="w-3 h-3"
            />
            <span className="text-xs">Default</span>
          </label>
        )}
        {availableOptions.includes('alternate') && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`${sectionKey}-background`}
              value="alternate"
              checked={currentBackground === 'alternate'}
              onChange={() => handleBackgroundChange('alternate')}
              className="w-3 h-3"
            />
            <span className="text-xs">Alternate</span>
          </label>
        )}
        {availableOptions.includes('primary') && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`${sectionKey}-background`}
              value="primary"
              checked={currentBackground === 'primary'}
              onChange={() => handleBackgroundChange('primary')}
              className="w-3 h-3"
            />
            <span className="text-xs">Primary</span>
          </label>
        )}
      </div>
    </div>
  )
}