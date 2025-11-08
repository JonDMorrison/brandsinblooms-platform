'use client'

/**
 * Link Edit Modal
 * Modal for editing button/link URLs and styles throughout the Full Site Editor
 * Uses ButtonLinkField for consistent Page/URL selection UX
 */

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Link as LinkIcon, Palette } from 'lucide-react'
import { ButtonLinkField } from '@/src/components/content-editor/editors/shared/ButtonLinkField'
import { isExternalUrl, normalizeUrl } from '@/src/lib/utils/links'
import { ButtonStyleVariant } from '@/src/lib/content/schema'
import { getButtonStyleDescription, getButtonStyles, getButtonClassName } from '@/src/lib/utils/button-styles'
import { useSiteTheme } from '@/src/hooks/useSiteTheme'

interface LinkEditModalProps {
  isOpen: boolean
  onClose: () => void
  currentUrl: string
  currentStyle?: ButtonStyleVariant
  onSave: (url: string, style?: ButtonStyleVariant) => void
  fieldLabel?: string
  sectionType?: string
  showStyleSelector?: boolean
}

export function LinkEditModal({
  isOpen,
  onClose,
  currentUrl,
  currentStyle = 'primary',
  onSave,
  fieldLabel = 'Link',
  sectionType,
  showStyleSelector = true
}: LinkEditModalProps) {
  const [url, setUrl] = useState(currentUrl)
  const [style, setStyle] = useState<ButtonStyleVariant>(currentStyle)
  const { theme } = useSiteTheme()

  // Reset URL and style when modal opens
  useEffect(() => {
    if (isOpen) {
      setUrl(currentUrl || '/')
      setStyle(currentStyle || 'primary')
    }
  }, [isOpen, currentUrl, currentStyle])

  // Get theme colors with fallbacks
  const primaryColor = theme?.colors?.primary || '#4F46E5'
  const secondaryColor = theme?.colors?.secondary || '#10B981'
  const accentColor = theme?.colors?.accent || '#F59E0B'

  const handleSave = () => {
    // Normalize URL for external links
    let finalUrl = url.trim()

    if (!finalUrl) {
      finalUrl = '#'
    } else if (isExternalUrl(finalUrl)) {
      finalUrl = normalizeUrl(finalUrl)
    }

    onSave(finalUrl, style)
    onClose()
  }

  const handleCancel = () => {
    setUrl(currentUrl) // Reset to original
    setStyle(currentStyle || 'primary')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCancel()
    }}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <div className="p-4 sm:p-6 border-b">
          <DialogTitle className="text-base sm:text-lg font-semibold">
            Edit Link: {fieldLabel}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-600 mt-1">
            {sectionType && `Section: ${sectionType}`}
          </DialogDescription>
        </div>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-gray-50">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Link</span>
            </TabsTrigger>
            {showStyleSelector && (
              <TabsTrigger value="style" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Style</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Link Tab */}
          <TabsContent value="link" className="p-4 sm:p-6 space-y-4 sm:space-y-5 m-0">
            {/* Link Field with Page Selector */}
            <ButtonLinkField
              value={url}
              onChange={setUrl}
              label="Link Destination"
              placeholder="Select page or enter URL"
            />

            {/* Info Box */}
            <div className="p-2.5 sm:p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Tip:</strong> Internal pages use fast client-side navigation. External URLs open in a new tab automatically.
              </p>
            </div>

            {/* Save Reminder */}
            <div className="p-2.5 sm:p-3 bg-amber-50 rounded-md border border-amber-200">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Changes are applied to the preview but not saved. Click "Save Page" in the top bar to persist your changes.
              </p>
            </div>
          </TabsContent>

          {/* Style Tab */}
          {showStyleSelector && (
            <TabsContent value="style" className="p-4 sm:p-6 space-y-4 sm:space-y-5 m-0">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Palette className="w-4 h-4" />
                  Button Style
                </Label>
                <RadioGroup value={style} onValueChange={(value) => setStyle(value as ButtonStyleVariant)}>
                  <div className="space-y-2">
                    {/* Primary Button Option */}
                    <div
                      className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setStyle('primary')}
                    >
                      <RadioGroupItem value="primary" id="style-primary" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="style-primary" className="font-semibold cursor-pointer">
                          Primary Button
                        </Label>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {getButtonStyleDescription('primary')}
                        </p>
                        <div
                          className="mt-2 inline-block px-4 py-2 rounded-md text-sm font-semibold"
                          style={{
                            backgroundColor: primaryColor,
                            color: 'white',
                            border: 'none'
                          }}
                        >
                          Preview
                        </div>
                      </div>
                    </div>

                    {/* Secondary Button Option */}
                    <div
                      className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setStyle('secondary')}
                    >
                      <RadioGroupItem value="secondary" id="style-secondary" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="style-secondary" className="font-semibold cursor-pointer">
                          Secondary Button
                        </Label>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {getButtonStyleDescription('secondary')}
                        </p>
                        <div
                          className="mt-2 inline-block px-4 py-2 rounded-md text-sm font-semibold"
                          style={{
                            backgroundColor: 'transparent',
                            color: secondaryColor,
                            border: `2px solid ${secondaryColor}`
                          }}
                        >
                          Preview
                        </div>
                      </div>
                    </div>

                    {/* Accent Button Option */}
                    <div
                      className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setStyle('accent')}
                    >
                      <RadioGroupItem value="accent" id="style-accent" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="style-accent" className="font-semibold cursor-pointer">
                          Accent Button
                        </Label>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {getButtonStyleDescription('accent')}
                        </p>
                        <div
                          className="mt-2 inline-block px-4 py-2 rounded-md text-sm font-semibold"
                          style={{
                            backgroundColor: accentColor,
                            color: 'white',
                            border: 'none'
                          }}
                        >
                          Preview
                        </div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Save Reminder in Style Tab */}
              <div className="p-2.5 sm:p-3 bg-amber-50 rounded-md border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> Changes are applied to the preview but not saved. Click "Save Page" in the top bar to persist your changes.
                </p>
              </div>
            </TabsContent>
          )}
        </Tabs>

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
