'use client'

import React, { useCallback } from 'react'
import { ContentSection, ContentItem } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { ColumnsSelector } from '../shared/ColumnsSelector'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

export function GalleryEditor({ section, onUpdate }: SectionEditorProps) {
  const items = (section.data.items as ContentItem[]) || []
  const columns = section.data.columns || 3

  const handleAddImage = useCallback(() => {
    const newImage: ContentItem = {
      id: `image-${Date.now()}`,
      title: 'Image Title',
      content: '',
      image: '',
      order: items.length + 1
    }
    onUpdate({ items: [...items, newImage] })
  }, [items, onUpdate])

  const handleUpdateImage = useCallback((index: number, updatedImage: ContentItem) => {
    const newItems = [...items]
    newItems[index] = updatedImage
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleRemoveImage = useCallback((index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleReorder = useCallback((reorderedItems: ContentItem[]) => {
    const itemsWithOrder = reorderedItems.map((item, index) => ({
      ...item,
      order: index + 1
    }))
    onUpdate({ items: itemsWithOrder })
  }, [onUpdate])

  const renderImageItem = useCallback((image: ContentItem, index: number) => {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs">Image URL</Label>
          <Input
            value={image.image || ''}
            onChange={(e) => {
              handleUpdateImage(index, { ...image, image: e.target.value })
            }}
            placeholder="https://example.com/image.jpg"
            className="h-8"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Alt Text</Label>
          <Input
            value={image.title || ''}
            onChange={(e) => {
              handleUpdateImage(index, { ...image, title: e.target.value })
            }}
            placeholder="Descriptive alt text for accessibility"
            className="h-8"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Caption (Optional)</Label>
          <Textarea
            value={image.content || ''}
            onChange={(e) => {
              handleUpdateImage(index, { ...image, content: e.target.value })
            }}
            placeholder="Optional caption for this image..."
            rows={2}
            className="resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Link URL (Optional)</Label>
          <Input
            value={image.url || ''}
            onChange={(e) => {
              handleUpdateImage(index, { ...image, url: e.target.value })
            }}
            placeholder="https://example.com or /page"
            className="h-8"
          />
        </div>
        
        {/* Image Preview */}
        {image.image && (
          <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
            <img
              src={image.image}
              alt={image.title || 'Gallery image'}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        )}
      </div>
    )
  }, [handleUpdateImage])

  return (
    <div className="space-y-4">
      <ColumnsSelector
        value={columns}
        onChange={(newColumns) => onUpdate({ columns: newColumns })}
        min={1}
        max={6}
        label="Gallery Columns"
      />
      
      <ItemListEditor
        items={items}
        onAdd={handleAddImage}
        onUpdate={handleUpdateImage}
        onRemove={handleRemoveImage}
        onReorder={handleReorder}
        renderItem={renderImageItem}
        emptyMessage="No images in gallery yet"
        addButtonLabel="Add Image"
      />
    </div>
  )
}