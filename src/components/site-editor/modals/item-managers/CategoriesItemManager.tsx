'use client'

/**
 * Categories Item Manager
 * Manages add/delete operations for Categories section items (up to 4)
 * Used within Section Settings Modal
 * For full editing (image, link, description), users click the card to open CategoryEditModal
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Plus, Trash2, ImageIcon } from 'lucide-react'
import { htmlToText } from '@/src/lib/utils/html-text'

interface CategoryItem {
  id: string
  name: string
  image?: string
  link?: string
  plantCount?: number
  description?: string
}

interface CategoriesItemManagerProps {
  section: ContentSection
  sectionKey: string
  onAdd: () => void
  onDelete: (itemIndex: number) => void
}

export function CategoriesItemManager({
  section,
  sectionKey,
  onAdd,
  onDelete
}: CategoriesItemManagerProps) {
  const { data } = section

  // Get categories array
  const categories = (data.categories as CategoryItem[]) || []

  // Categories section displays up to 4 items
  const maxItems = 4
  const canAddMore = categories.length < maxItems

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Categories</Label>
          <p className="text-xs text-gray-500 mt-1">
            Manage category cards with images (max {maxItems})
          </p>
        </div>
        <Button
          onClick={onAdd}
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs"
          disabled={!canAddMore}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Category
        </Button>
      </div>

      {/* Categories List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {categories.map((category, index) => {
          const hasImage = category.image && category.image.trim() !== ''

          return (
            <div
              key={category.id || index}
              className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {/* Image Thumbnail */}
              <div className="w-16 h-16 rounded border bg-white flex-shrink-0 overflow-hidden">
                {hasImage ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Category Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {htmlToText(category.name) || 'Untitled Category'}
                </p>
                {category.plantCount !== undefined && (
                  <p className="text-xs text-gray-600 mt-1">
                    {category.plantCount} {category.plantCount === 1 ? 'item' : 'items'}
                  </p>
                )}
                {category.link && (
                  <p className="text-xs text-gray-500 truncate">
                    Link: {category.link}
                  </p>
                )}
                {!hasImage && !category.description && (
                  <p className="text-xs text-gray-400 mt-1">
                    Click card to add details
                  </p>
                )}
              </div>

              {/* Delete Button */}
              <Button
                onClick={() => onDelete(index)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500">No categories added yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Click "Add Category" to get started
          </p>
        </div>
      )}

      {/* Max Limit Warning */}
      {!canAddMore && (
        <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
          <p className="text-xs text-yellow-800">
            Maximum {maxItems} categories reached. Delete a category to add more.
          </p>
        </div>
      )}

      {/* Info Note */}
      <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Click on a category card in Edit mode to open the full editor
          where you can upload images, set descriptions, and configure links.
        </p>
      </div>
    </div>
  )
}
