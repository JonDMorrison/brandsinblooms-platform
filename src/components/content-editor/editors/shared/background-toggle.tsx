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
}

export function BackgroundToggle({ 
  sectionKey, 
  section, 
  onUpdate, 
  className = '' 
}: BackgroundToggleProps) {
  const currentBackground = section.settings?.backgroundColor || 'default'

  const handleBackgroundChange = (backgroundColor: 'default' | 'alternate') => {
    const newSettings = { ...section.settings, backgroundColor }
    onUpdate(sectionKey, { ...section, settings: newSettings })
  }

  return (
    <div className={`p-3 border rounded-lg bg-muted/30 space-y-2 ${className}`}>
      <Label className="text-xs text-gray-500">Background Color</Label>
      <div className="flex gap-2">
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
      </div>
    </div>
  )
}