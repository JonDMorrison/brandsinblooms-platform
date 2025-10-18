'use client'

/**
 * Delete Section Modal
 * Confirmation dialog for deleting sections in the Full Site Editor
 */

import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface DeleteSectionModalProps {
  isOpen: boolean
  onClose: () => void
  sectionKey: string
  sectionType: string
  onConfirm: () => void
}

export function DeleteSectionModal({
  isOpen,
  onClose,
  sectionKey,
  sectionType,
  onConfirm
}: DeleteSectionModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  // Format section type for display
  const formattedType = sectionType.charAt(0).toUpperCase() + sectionType.slice(1)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-lg font-semibold text-gray-900 mb-2">
              Delete Section
            </DialogTitle>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete the <strong>{formattedType}</strong> section? This action cannot be undone.
            </p>
            <div className="p-3 bg-amber-50 rounded-md border border-amber-200">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Changes are applied to the preview but not saved. Click "Save Page" in the top bar to persist your changes.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-6 border-t bg-gray-50 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            Delete Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
