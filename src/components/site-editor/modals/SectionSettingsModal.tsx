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
  const backgroundOptions: Array<{
    value: BackgroundColor
    label: string
    description: string
    preview: string
  }> = [
    {
      value: 'default',
      label: 'Default',
      description: 'Standard white/transparent background',
      preview: 'bg-white'
    },
    {
      value: 'alternate',
      label: 'Alternate',
      description: 'Light gray background for contrast',
      preview: 'bg-gray-50'
    },
    {
      value: 'primary',
      label: 'Primary',
      description: 'Brand primary color background',
      preview: 'bg-blue-600'
    },
    {
      value: 'gradient',
      label: 'Gradient',
      description: 'Subtle gradient background',
      preview: 'bg-gradient-to-br from-blue-50 to-purple-50'
    }
  ]

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
            <div className="space-y-2">
              {backgroundOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 border rounded-lg cursor-pointer transition-all ${
                    backgroundColor === option.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="backgroundColor"
                    value={option.value}
                    checked={backgroundColor === option.value}
                    onChange={() => setBackgroundColor(option.value)}
                    className="mt-1 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded border ${option.preview}`} />
                      <span className="font-medium text-xs sm:text-sm">{option.label}</span>
                    </div>
                    <p className="text-xs text-gray-600">{option.description}</p>
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
