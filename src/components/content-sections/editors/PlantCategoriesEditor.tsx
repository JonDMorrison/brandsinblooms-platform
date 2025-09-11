'use client'

import React, { useCallback } from 'react'
import { ContentSection, PlantCategory } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { ColumnsSelector } from '../shared/ColumnsSelector'
import { IconPicker } from '@/src/components/content-editor'
import { Badge } from '@/src/components/ui/badge'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

export function PlantCategoriesEditor({ section, onUpdate }: SectionEditorProps) {
  const plantCategories = (section.data.plantCategories as PlantCategory[]) || []
  const columns = section.data.columns || 4

  const handleAddCategory = useCallback(() => {
    const newCategory: PlantCategory = {
      id: `category-${Date.now()}`,
      name: 'New Category',
      description: '',
      icon: 'Leaf',
      plantCount: 0
    }
    onUpdate({ plantCategories: [...plantCategories, newCategory] })
  }, [plantCategories, onUpdate])

  const handleUpdateCategory = useCallback((index: number, updatedCategory: PlantCategory) => {
    const newCategories = [...plantCategories]
    newCategories[index] = updatedCategory
    onUpdate({ plantCategories: newCategories })
  }, [plantCategories, onUpdate])

  const handleRemoveCategory = useCallback((index: number) => {
    const newCategories = plantCategories.filter((_, i) => i !== index)
    onUpdate({ plantCategories: newCategories })
  }, [plantCategories, onUpdate])

  const handleReorder = useCallback((reorderedCategories: PlantCategory[]) => {
    onUpdate({ plantCategories: reorderedCategories })
  }, [onUpdate])

  const renderCategoryItem = useCallback((category: PlantCategory, index: number) => {
    return (
      <div className="space-y-4">
        {/* Category Preview */}
        <div className="p-3 border rounded-lg bg-muted/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm">🌿</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{category.name}</span>
                {category.plantCount !== undefined && category.plantCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {category.plantCount} plants
                  </Badge>
                )}
              </div>
              {category.description && (
                <p className="text-xs text-gray-600 mt-1">
                  {category.description.slice(0, 50)}
                  {category.description.length > 50 ? '...' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Category Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Category Name</Label>
            <Input
              value={category.name}
              onChange={(e) => {
                handleUpdateCategory(index, { ...category, name: e.target.value })
              }}
              placeholder="e.g., Houseplants"
              className="h-8"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Plant Count (Optional)</Label>
            <Input
              type="number"
              value={category.plantCount || ''}
              onChange={(e) => {
                const count = e.target.value ? parseInt(e.target.value, 10) : undefined
                handleUpdateCategory(index, { ...category, plantCount: count })
              }}
              placeholder="e.g., 15"
              className="h-8"
              min="0"
            />
          </div>
        </div>

        {/* Icon */}
        <div className="space-y-2">
          <Label className="text-xs">Category Icon</Label>
          <IconPicker
            value={category.icon || 'Leaf'}
            onChange={(icon) => {
              handleUpdateCategory(index, { ...category, icon })
            }}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={category.description || ''}
            onChange={(e) => {
              handleUpdateCategory(index, { ...category, description: e.target.value })
            }}
            placeholder="Describe this plant category..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Link (Optional) */}
        <div className="space-y-2">
          <Label className="text-xs">Link (Optional)</Label>
          <Input
            value={category.id.startsWith('category-') ? '' : category.id}
            onChange={(e) => {
              // Use the id field to store the link for consistency
              handleUpdateCategory(index, { 
                ...category, 
                id: e.target.value || `category-${Date.now()}`
              })
            }}
            placeholder="Link to category page (e.g., /plants/houseplants)"
            className="h-8"
          />
        </div>
      </div>
    )
  }, [handleUpdateCategory])

  return (
    <div className="space-y-4">
      {/* Summary */}
      {plantCategories.length > 0 && (
        <div className="p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              {plantCategories.length} categories configured
            </span>
            <span className="text-gray-500">
              Total plants: {plantCategories.reduce((sum, cat) => sum + (cat.plantCount || 0), 0)}
            </span>
          </div>
        </div>
      )}

      <ColumnsSelector
        value={columns}
        onChange={(newColumns) => onUpdate({ columns: newColumns })}
        min={2}
        max={6}
        label="Display Columns"
      />
      
      <ItemListEditor
        items={plantCategories}
        onAdd={handleAddCategory}
        onUpdate={handleUpdateCategory}
        onRemove={handleRemoveCategory}
        onReorder={handleReorder}
        renderItem={renderCategoryItem}
        emptyMessage="No plant categories added yet"
        addButtonLabel="Add Plant Category"
      />
    </div>
  )
}