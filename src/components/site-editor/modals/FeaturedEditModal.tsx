'use client'

/**
 * Featured Edit Modal
 * Modal for editing featured cards (image, title, tag, link) in the Full Site Editor
 * Integrates with FeaturedImageUpload for S3 image management
 */

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { FeaturedImageUpload } from '@/src/components/content-editor/editors/shared/FeaturedImageUpload'
import { Trash2, Star } from 'lucide-react'
import { stripParagraphTags } from '@/src/lib/utils/html-text'

interface FeaturedItemData {
  id: string
  title: string
  tag: string
  image: string
  link: string
  s3Key?: string
}

interface FeaturedEditModalProps {
  isOpen: boolean
  onClose: () => void
  item: FeaturedItemData
  onSave: (updatedItem: FeaturedItemData) => void
  onDelete?: () => void
  siteId: string
}

export function FeaturedEditModal({
  isOpen,
  onClose,
  item,
  onSave,
  onDelete,
  siteId
}: FeaturedEditModalProps) {
  const [editedItem, setEditedItem] = useState<FeaturedItemData>(item)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset state when modal opens with new item
  useEffect(() => {
    if (isOpen) {
      setEditedItem(item)
      setShowDeleteConfirm(false)
    }
  }, [isOpen, item])

  const handleSave = () => {
    // Validate required fields
    if (!editedItem.title.trim()) {
      alert('Title is required')
      return
    }

    onSave(editedItem)
    onClose()
  }

  const handleCancel = () => {
    setEditedItem(item) // Reset to original
    onClose()
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
      onClose()
    }
  }

  const handleImageChange = (url: string, s3Key?: string) => {
    setEditedItem({
      ...editedItem,
      image: url,
      s3Key: s3Key || editedItem.s3Key
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 sm:w-5 sm:h-5" />
            Edit Featured Item
          </DialogTitle>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Update featured item image, title, tag, and link
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Featured Image</Label>
            <FeaturedImageUpload
              imageUrl={editedItem.image || null}
              onImageChange={handleImageChange}
              siteId={siteId}
              itemId={editedItem.id}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="item-title" className="text-sm font-medium">
              Title *
            </Label>
            <Input
              id="item-title"
              value={stripParagraphTags(editedItem.title)}
              onChange={(e) => setEditedItem({ ...editedItem, title: e.target.value })}
              placeholder="e.g., Golden Pothos"
              className="w-full"
            />
          </div>

          {/* Tag */}
          <div className="space-y-2">
            <Label htmlFor="item-tag" className="text-sm font-medium">
              Tag
            </Label>
            <Input
              id="item-tag"
              value={stripParagraphTags(editedItem.tag)}
              onChange={(e) => setEditedItem({ ...editedItem, tag: e.target.value })}
              placeholder="e.g., houseplants, trending, easy care"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Short label displayed in top-right corner of card
            </p>
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="item-link" className="text-sm font-medium">
              Link
            </Label>
            <Input
              id="item-link"
              value={editedItem.link}
              onChange={(e) => setEditedItem({ ...editedItem, link: e.target.value })}
              placeholder="/plants/golden-pothos or https://example.com"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Internal links (e.g., /plants) or external URLs (e.g., https://example.com)
            </p>
          </div>

          {/* Save Reminder */}
          <div className="p-2.5 sm:p-3 bg-amber-50 rounded-md border border-amber-200">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Changes are applied to the preview but not saved. Click "Save Page" in the top bar to persist your changes.
            </p>
          </div>

          {/* Delete Section */}
          {onDelete && (
            <div className="pt-4 border-t">
              {!showDeleteConfirm ? (
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Featured Item
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-600 font-medium">
                    Are you sure you want to delete this featured item?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                    >
                      Yes, Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 sm:p-6 border-t bg-gray-50 flex-shrink-0 flex justify-end gap-2 sm:gap-3">
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
