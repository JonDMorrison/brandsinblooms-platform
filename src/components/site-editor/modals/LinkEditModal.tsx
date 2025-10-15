'use client'

/**
 * Link Edit Modal
 * Modal for editing button/link URLs throughout the Full Site Editor
 * Uses ButtonLinkField for consistent Page/URL selection UX
 */

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Link as LinkIcon } from 'lucide-react'
import { ButtonLinkField } from '@/src/components/content-editor/editors/shared/ButtonLinkField'
import { isExternalUrl, normalizeUrl } from '@/src/lib/utils/links'

interface LinkEditModalProps {
  isOpen: boolean
  onClose: () => void
  currentUrl: string
  onSave: (url: string) => void
  fieldLabel?: string
  sectionType?: string
}

export function LinkEditModal({
  isOpen,
  onClose,
  currentUrl,
  onSave,
  fieldLabel = 'Link',
  sectionType
}: LinkEditModalProps) {
  console.log('[LinkEditModal] Render -', { isOpen, currentUrl, fieldLabel, sectionType })

  const [url, setUrl] = useState(currentUrl)

  // Reset URL when modal opens
  useEffect(() => {
    console.log('[LinkEditModal] isOpen effect triggered -', { isOpen, currentUrl })
    if (isOpen) {
      setUrl(currentUrl || '/')
      console.log('[LinkEditModal] Modal should now be visible')
    }
  }, [isOpen, currentUrl])

  const handleSave = () => {
    // Normalize URL for external links
    let finalUrl = url.trim()

    if (!finalUrl) {
      finalUrl = '#'
    } else if (isExternalUrl(finalUrl)) {
      finalUrl = normalizeUrl(finalUrl)
    }

    onSave(finalUrl)
    onClose()
  }

  const handleCancel = () => {
    setUrl(currentUrl) // Reset to original
    onClose()
  }

  console.log('[LinkEditModal] About to render Dialog with open=', isOpen)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('[LinkEditModal] onOpenChange triggered -', { open })
      if (!open) handleCancel()
    }}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <div className="p-4 sm:p-6 border-b">
          <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            Edit Link: {fieldLabel}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-600 mt-1">
            {sectionType && `Section: ${sectionType}`}
          </DialogDescription>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
