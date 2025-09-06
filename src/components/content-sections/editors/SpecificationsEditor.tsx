'use client'

import React, { useCallback, useState } from 'react'
import { ContentSection, ContentItem } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { RichTextEditor } from '@/src/components/content-editor'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

export function SpecificationsEditor({ section, onUpdate }: SectionEditorProps) {
  const items = (section.data.items as ContentItem[]) || []
  const content = section.data.content || ''
  
  // Determine display mode based on existing data
  const displayMode = items.length > 0 ? 'items' : (content ? 'content' : 'items')
  const [activeTab, setActiveTab] = useState(displayMode)

  const handleAddSpec = useCallback(() => {
    const newSpec: ContentItem = {
      id: `spec-${Date.now()}`,
      title: 'Specification',
      content: 'Value',
      order: items.length + 1
    }
    onUpdate({ items: [...items, newSpec] })
  }, [items, onUpdate])

  const handleUpdateSpec = useCallback((index: number, updatedSpec: ContentItem) => {
    const newItems = [...items]
    newItems[index] = updatedSpec
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleRemoveSpec = useCallback((index: number) => {
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

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
    // Clear the other format when switching
    if (value === 'content') {
      onUpdate({ items: [], content })
    } else {
      onUpdate({ content: '', items })
    }
  }, [content, items, onUpdate])

  const renderSpecItem = useCallback((spec: ContentItem, index: number) => {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Label</Label>
          <Input
            value={spec.title || ''}
            onChange={(e) => {
              handleUpdateSpec(index, { ...spec, title: e.target.value })
            }}
            placeholder="e.g., Dimensions"
            className="h-8"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Value</Label>
          <Input
            value={spec.content || ''}
            onChange={(e) => {
              handleUpdateSpec(index, { ...spec, content: e.target.value })
            }}
            placeholder="e.g., 10 x 20 x 30 cm"
            className="h-8"
          />
        </div>
      </div>
    )
  }, [handleUpdateSpec])

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">Structured List</TabsTrigger>
          <TabsTrigger value="content">Free Text</TabsTrigger>
        </TabsList>
        
        <TabsContent value="items" className="space-y-4">
          <p className="text-xs text-gray-500">
            Add specifications as label-value pairs
          </p>
          <ItemListEditor
            items={items}
            onAdd={handleAddSpec}
            onUpdate={handleUpdateSpec}
            onRemove={handleRemoveSpec}
            onReorder={handleReorder}
            renderItem={renderSpecItem}
            emptyMessage="No specifications added yet"
            addButtonLabel="Add Specification"
          />
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <p className="text-xs text-gray-500">
            Enter specifications as formatted text
          </p>
          <RichTextEditor
            initialContent={content}
            onChange={(newContent) => onUpdate({ content: newContent })}
            placeholder="Enter specifications..."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}