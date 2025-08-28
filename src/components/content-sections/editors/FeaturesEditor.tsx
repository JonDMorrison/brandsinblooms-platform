'use client'

import React, { useCallback } from 'react'
import { ContentSection, ContentItem } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { IconPicker } from '@/src/components/content-editor'
import { Label } from '@/src/components/ui/label'
import { ColumnsSelector } from '../shared/ColumnsSelector'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

export function FeaturesEditor({ section, onUpdate }: SectionEditorProps) {
  const items = (section.data.items as ContentItem[]) || []
  const columns = section.data.columns || 3

  const handleAddFeature = useCallback(() => {
    const newFeature: ContentItem = {
      id: `feature-${Date.now()}`,
      title: 'New Feature',
      content: '',
      icon: 'star',
      order: items.length + 1
    }
    onUpdate({ items: [...items, newFeature] })
  }, [items, onUpdate])

  const handleUpdateFeature = useCallback((index: number, updatedFeature: ContentItem) => {
    const newItems = [...items]
    newItems[index] = updatedFeature
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleRemoveFeature = useCallback((index: number) => {
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

  const renderFeatureItem = useCallback((feature: ContentItem, index: number) => {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Icon</Label>
            <IconPicker
              value={feature.icon || 'star'}
              onChange={(icon) => {
                handleUpdateFeature(index, { ...feature, icon })
              }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Feature Title</Label>
            <Input
              value={feature.title || ''}
              onChange={(e) => {
                handleUpdateFeature(index, { ...feature, title: e.target.value })
              }}
              placeholder="Feature name"
              className="h-8"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={feature.content || ''}
            onChange={(e) => {
              handleUpdateFeature(index, { ...feature, content: e.target.value })
            }}
            placeholder="Describe this feature..."
            rows={3}
            className="resize-none"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Link (Optional)</Label>
          <Input
            value={feature.url || ''}
            onChange={(e) => {
              handleUpdateFeature(index, { ...feature, url: e.target.value })
            }}
            placeholder="https://example.com or /page"
            className="h-8"
          />
        </div>
      </div>
    )
  }, [handleUpdateFeature])

  return (
    <div className="space-y-4">
      <ColumnsSelector
        value={columns}
        onChange={(newColumns) => onUpdate({ columns: newColumns })}
        min={1}
        max={6}
        label="Display Columns"
      />
      
      <ItemListEditor
        items={items}
        onAdd={handleAddFeature}
        onUpdate={handleUpdateFeature}
        onRemove={handleRemoveFeature}
        onReorder={handleReorder}
        renderItem={renderFeatureItem}
        emptyMessage="No features added yet"
        addButtonLabel="Add Feature"
      />
    </div>
  )
}