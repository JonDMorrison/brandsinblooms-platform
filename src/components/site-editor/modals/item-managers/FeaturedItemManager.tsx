'use client'

/**
 * Featured Item Manager
 * Manages add/delete operations for Featured section items (up to 4)
 * Used within Section Settings Modal
 * For full editing (image, tag, link), users click the card to open FeaturedEditModal
 * Supports database product mode where items are pulled from featured products
 */

import React from 'react'
import { ContentSection, DEFAULT_FEATURED_ITEMS } from '@/src/lib/content/schema'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Plus, Trash2, ImageIcon, ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'

interface FeaturedItem {
  id: string
  title: string
  image?: string
  tag?: string
  link?: string
}

interface FeaturedItemManagerProps {
  section: ContentSection
  sectionKey: string
  onAdd: () => void
  onDelete: (itemIndex: number) => void
}

export function FeaturedItemManager({
  section,
  sectionKey,
  onAdd,
  onDelete
}: FeaturedItemManagerProps) {
  const { data } = section

  // Check if database mode is enabled
  const useProductDatabase = data.useProductDatabase ?? false
  const productLimit = data.productLimit ?? 4

  // If database mode is enabled, show special message
  if (useProductDatabase) {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Featured Items</Label>
          <p className="text-xs text-gray-500 mt-1">
            Featured products from your inventory
          </p>
        </div>

        {/* Database mode info */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
              Using Featured Products from Database
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This section is displaying up to {productLimit} product{productLimit !== 1 ? 's' : ''} marked as featured in your inventory.
              Manual featured items are hidden while this mode is active.
            </p>
            <Link
              href="/dashboard/products"
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium mt-2"
            >
              Manage Featured Products <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            To manage featured items manually, disable the "Use Featured Products from Database" toggle
            in the Appearance tab.
          </p>
        </div>
      </div>
    )
  }

  // Manual mode - original functionality
  // Get featured items, fallback to defaults if missing
  let featuredItems = data.featuredItems
  if (!Array.isArray(featuredItems) || featuredItems.length === 0) {
    featuredItems = DEFAULT_FEATURED_ITEMS
  }

  const items = featuredItems as FeaturedItem[]

  // Featured section displays up to 4 items
  const maxItems = 4
  const canAddMore = items.length < maxItems

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Featured Items</Label>
          <p className="text-xs text-gray-500 mt-1">
            Manage featured cards with images (max {maxItems})
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
          Add Item
        </Button>
      </div>

      {/* Items List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {items.map((item, index) => {
          const hasImage = item.image && item.image.trim() !== ''

          return (
            <div
              key={item.id || index}
              className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {/* Image Thumbnail */}
              <div className="w-16 h-16 rounded border bg-white flex-shrink-0 overflow-hidden">
                {hasImage ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.title || 'Untitled Item'}
                </p>
                {item.tag && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                    {item.tag}
                  </span>
                )}
                {item.link && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    Link: {item.link}
                  </p>
                )}
                {!hasImage && !item.tag && !item.link && (
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
      {items.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500">No featured items added yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Click "Add Item" to get started
          </p>
        </div>
      )}

      {/* Max Limit Warning */}
      {!canAddMore && (
        <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
          <p className="text-xs text-yellow-800">
            Maximum {maxItems} items reached. Delete an item to add more.
          </p>
        </div>
      )}

      {/* Info Note */}
      <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Click on a featured card in Edit mode to open the full editor
          where you can upload images, set tags, and configure links.
        </p>
      </div>
    </div>
  )
}
