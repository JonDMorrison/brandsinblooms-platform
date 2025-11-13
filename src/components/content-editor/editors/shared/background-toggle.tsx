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
  availableOptions?: Array<'default' | 'alternate' | 'primary' | 'gradient'>
}

type BackgroundOption = {
  value: 'default' | 'alternate' | 'primary' | 'gradient'
  label: string
  description: string
  previewStyle: React.CSSProperties
}

const backgroundOptions: BackgroundOption[] = [
  {
    value: 'default',
    label: 'Default',
    description: 'Standard background',
    previewStyle: { backgroundColor: 'var(--theme-background)' }
  },
  {
    value: 'alternate',
    label: 'Alternate',
    description: 'Subtle contrast',
    previewStyle: { backgroundColor: 'rgba(var(--theme-primary-rgb), 0.08)' }
  },
  {
    value: 'primary',
    label: 'Bold',
    description: 'Primary color',
    previewStyle: { backgroundColor: 'var(--theme-primary)' }
  },
  {
    value: 'gradient',
    label: 'Gradient',
    description: 'Subtle gradient',
    previewStyle: {
      background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))'
    }
  }
]

export function BackgroundToggle({
  sectionKey,
  section,
  onUpdate,
  className = '',
  availableOptions = ['default', 'alternate', 'primary']
}: BackgroundToggleProps) {
  const currentBackground = section.settings?.backgroundColor || 'default'

  const handleBackgroundChange = (backgroundColor: 'default' | 'alternate' | 'primary' | 'gradient') => {
    const newSettings = { ...section.settings, backgroundColor }
    onUpdate(sectionKey, { ...section, settings: newSettings })
  }

  const filteredOptions = backgroundOptions.filter(option =>
    availableOptions.includes(option.value)
  )

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">Background Color</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filteredOptions.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-center gap-3 p-2 rounded-md border-2 cursor-pointer transition-all
              ${currentBackground === option.value
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <input
              type="radio"
              name={`${sectionKey}-background`}
              value={option.value}
              checked={currentBackground === option.value}
              onChange={() => handleBackgroundChange(option.value)}
              className="sr-only"
            />
            <div
              className="w-8 h-8 rounded border border-gray-300 flex-shrink-0"
              style={option.previewStyle}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{option.label}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
