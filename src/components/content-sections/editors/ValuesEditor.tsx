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

export function ValuesEditor({ section, onUpdate }: SectionEditorProps) {
  const items = (section.data.items as ContentItem[]) || []
  const columns = section.data.columns || 2

  const handleAddValue = useCallback(() => {
    const newValue: ContentItem = {
      id: `value-${Date.now()}`,
      title: 'New Value',
      content: '',
      icon: 'star',
      order: items.length + 1
    }
    onUpdate({ items: [...items, newValue] })
  }, [items, onUpdate])

  const handleUpdateValue = useCallback((index: number, updatedValue: ContentItem) => {
    const newItems = [...items]
    newItems[index] = updatedValue
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleRemoveValue = useCallback((index: number) => {
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

  const renderValueItem = useCallback((value: ContentItem, index: number) => {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Icon</Label>
            <IconPicker
              value={value.icon || 'star'}
              onChange={(icon) => {
                handleUpdateValue(index, { ...value, icon })
              }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Value Title</Label>
            <Input
              value={value.title || ''}
              onChange={(e) => {
                handleUpdateValue(index, { ...value, title: e.target.value })
              }}
              placeholder="Value name"
              className="h-8"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={value.content || ''}
            onChange={(e) => {
              handleUpdateValue(index, { ...value, content: e.target.value })
            }}
            placeholder="Describe this value..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>
    )
  }, [handleUpdateValue])

  return (
    <div className="space-y-4">
      <ColumnsSelector
        value={columns}
        onChange={(newColumns) => onUpdate({ columns: newColumns })}
        min={1}
        max={4}
        label="Display Columns"
      />
      
      <ItemListEditor
        items={items}
        onAdd={handleAddValue}
        onUpdate={handleUpdateValue}
        onRemove={handleRemoveValue}
        onReorder={handleReorder}
        renderItem={renderValueItem}
        emptyMessage="No values defined yet"
        addButtonLabel="Add Value"
      />
    </div>
  )
}