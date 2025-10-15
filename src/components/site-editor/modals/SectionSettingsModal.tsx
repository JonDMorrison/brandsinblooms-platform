'use client'

/**
 * Section Settings Modal
 * Modal for editing section-level settings (background color, etc.) in Full Site Editor
 * Integrates with existing settings structure from ContentSection schema
 */

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogFooter } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { ContentSection } from '@/src/lib/content/schema'
import { Settings } from 'lucide-react'
import { getAvailableBackgrounds } from '@/src/lib/content/section-backgrounds'

interface SectionSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  section: ContentSection
  sectionKey: string
  onSave: (settings: Record<string, unknown>) => void
}

type BackgroundColor = 'default' | 'alternate' | 'primary' | 'gradient'

export function SectionSettingsModal({
  isOpen,
  onClose,
  section,
  sectionKey,
  onSave
}: SectionSettingsModalProps) {
  const [backgroundColor, setBackgroundColor] = useState<BackgroundColor>('default')

  // Initialize from section settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const currentBg = (section.settings?.backgroundColor as BackgroundColor) || 'default'
      setBackgroundColor(currentBg)
    }
  }, [isOpen, section.settings])

  const handleSave = () => {
    const newSettings = {
      ...section.settings,
      backgroundColor
    }
    onSave(newSettings)
    onClose()
  }

  const handleCancel = () => {
    // Reset to original
    const currentBg = (section.settings?.backgroundColor as BackgroundColor) || 'default'
    setBackgroundColor(currentBg)
    onClose()
  }

  // Get section name for display
  const getSectionName = () => {
    return sectionKey
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Background color options with descriptions
  const allBackgroundOptions: Array<{
    value: BackgroundColor
    label: string
    description: string
    previewStyle: React.CSSProperties
  }> = [
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
      previewStyle: { backgroundColor: 'rgba(var(--theme-primary-rgb), 0.03)' }
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

  // Filter options based on section type
  const availableBackgroundTypes = getAvailableBackgrounds(section.type)
  const backgroundOptions = allBackgroundOptions.filter(option =>
    availableBackgroundTypes.includes(option.value)
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogOverlay className="fixed inset-0 bg-black/50 z-50" />
      <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-2rem)] sm:w-[500px] max-w-[500px] bg-white rounded-lg shadow-xl p-0">
        <div className="p-4 sm:p-6 border-b">
          <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            Section Settings
          </DialogTitle>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {getSectionName()}
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Background Color Selection */}
          <div className="space-y-3">
            <Label className="text-xs sm:text-sm font-medium">Background Color</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {backgroundOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-2 border-2 rounded-md cursor-pointer transition-all ${
                    backgroundColor === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="backgroundColor"
                    value={option.value}
                    checked={backgroundColor === option.value}
                    onChange={() => setBackgroundColor(option.value)}
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

          {/* Preview Note */}
          <div className="p-2.5 sm:p-3 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Changes will be applied immediately when you save. Use Navigate mode to preview the section without editing controls.
            </p>
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-6 border-t bg-gray-50 flex justify-end gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="text-sm"
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
