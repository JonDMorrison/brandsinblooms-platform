'use client'

/**
 * Category Edit Modal
 * Modal for editing category cards (image, name, link) in the Full Site Editor
 * Integrates with CategoryImageUpload for S3 image management
 */

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { CategoryImageUpload } from '@/src/components/content-editor/editors/shared/CategoryImageUpload'
import { Trash2, Image as ImageIcon } from 'lucide-react'

interface CategoryData {
  id: string
  name: string
  image: string
  link: string
  s3Key?: string
  plantCount?: number
  description?: string
}

interface CategoryEditModalProps {
  isOpen: boolean
  onClose: () => void
  category: CategoryData
  onSave: (updatedCategory: CategoryData) => void
  onDelete?: () => void
  siteId: string
}

export function CategoryEditModal({
  isOpen,
  onClose,
  category,
  onSave,
  onDelete,
  siteId
}: CategoryEditModalProps) {
  const [editedCategory, setEditedCategory] = useState<CategoryData>(category)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset state when modal opens with new category
  useEffect(() => {
    if (isOpen) {
      setEditedCategory(category)
      setShowDeleteConfirm(false)
    }
  }, [isOpen, category])

  const handleSave = () => {
    // Validate required fields
    if (!editedCategory.name.trim()) {
      alert('Category name is required')
      return
    }

    onSave(editedCategory)
    onClose()
  }

  const handleCancel = () => {
    setEditedCategory(category) // Reset to original
    onClose()
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
      onClose()
    }
  }

  const handleImageChange = (url: string, s3Key?: string) => {
    setEditedCategory({
      ...editedCategory,
      image: url,
      s3Key: s3Key || editedCategory.s3Key
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            Edit Category
          </DialogTitle>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Update category image, name, and link
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category Image</Label>
            <CategoryImageUpload
              imageUrl={editedCategory.image || null}
              onImageChange={handleImageChange}
              siteId={siteId}
              categoryId={editedCategory.id}
            />
          </div>

          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="category-name" className="text-sm font-medium">
              Category Name *
            </Label>
            <Input
              id="category-name"
              value={editedCategory.name}
              onChange={(e) => setEditedCategory({ ...editedCategory, name: e.target.value })}
              placeholder="e.g., Beginner-Friendly"
              className="w-full"
            />
          </div>

          {/* Category Link */}
          <div className="space-y-2">
            <Label htmlFor="category-link" className="text-sm font-medium">
              Category Link
            </Label>
            <Input
              id="category-link"
              value={editedCategory.link}
              onChange={(e) => setEditedCategory({ ...editedCategory, link: e.target.value })}
              placeholder="/plants?category=beginner or https://example.com"
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
                  Delete Category
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-600 font-medium">
                    Are you sure you want to delete this category?
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
