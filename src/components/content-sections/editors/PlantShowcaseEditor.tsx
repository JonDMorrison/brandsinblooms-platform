'use client'

import React, { useCallback, useState } from 'react'
import { ContentSection, PlantItem } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { ColumnsSelector } from '../shared/ColumnsSelector'
import { ImageInput } from '@/src/components/content-editor'
import { CarePropertySelector, PlantTypeSelector } from '@/src/components/plant-shop/selectors'
import { PlantShowcaseView } from '../plant-shop/PlantShowcaseView'
import { PlantShopTheme } from '@/src/components/theme/PlantShopTheme'
import { Eye, EyeOff } from 'lucide-react'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
  theme?: any // Theme settings for preview
}

export function PlantShowcaseEditor({ section, onUpdate, theme }: SectionEditorProps) {
  const items = (section.data.items as PlantItem[]) || []
  const columns = section.data.columns || 3
  const [showPreview, setShowPreview] = useState(false)

  const handleAddPlant = useCallback(() => {
    const newPlant: PlantItem = {
      id: `plant-${Date.now()}`,
      title: 'New Plant',
      commonName: '',
      scientificName: '',
      content: '',
      image: '',
      careLevel: 'easy',
      lightRequirement: 'medium',
      wateringFrequency: 'weekly',
      plantType: 'houseplant',
      toxicity: 'non-toxic',
      order: items.length + 1
    }
    onUpdate({ items: [...items, newPlant] })
  }, [items, onUpdate])

  const handleUpdatePlant = useCallback((index: number, updatedPlant: PlantItem) => {
    const newItems = [...items]
    newItems[index] = updatedPlant
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleRemovePlant = useCallback((index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleReorder = useCallback((reorderedItems: PlantItem[]) => {
    const itemsWithOrder = reorderedItems.map((item, index) => ({
      ...item,
      order: index + 1
    }))
    onUpdate({ items: itemsWithOrder })
  }, [onUpdate])

  const renderPlantItem = useCallback((plant: PlantItem, index: number) => {
    return (
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Common Name</Label>
            <Input
              value={plant.commonName || plant.title || ''}
              onChange={(e) => {
                handleUpdatePlant(index, { 
                  ...plant, 
                  commonName: e.target.value,
                  title: e.target.value // Sync with title for compatibility
                })
              }}
              placeholder="e.g., Monstera Deliciosa"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Scientific Name</Label>
            <Input
              value={plant.scientificName || ''}
              onChange={(e) => {
                handleUpdatePlant(index, { ...plant, scientificName: e.target.value })
              }}
              placeholder="e.g., Monstera deliciosa"
              className="h-8"
            />
          </div>
        </div>

        {/* Plant Image */}
        <div className="space-y-2">
          <Label className="text-xs">Plant Image</Label>
          <ImageInput
            value={{
              url: plant.image || '',
              alt: `Image of ${plant.commonName || plant.title || 'plant'}`,
              caption: ''
            }}
            onChange={(imageData) => {
              handleUpdatePlant(index, { 
                ...plant, 
                image: imageData.url
              })
            }}
          />
        </div>

        {/* Plant Type and Care Level */}
        <div className="grid grid-cols-2 gap-3">
          <PlantTypeSelector
            value={plant.plantType || 'houseplant'}
            onChange={(value) => {
              handleUpdatePlant(index, { 
                ...plant, 
                plantType: value as PlantItem['plantType']
              })
            }}
          />
          <CarePropertySelector
            type="careLevel"
            value={plant.careLevel || 'easy'}
            onChange={(value) => {
              handleUpdatePlant(index, { 
                ...plant, 
                careLevel: value as PlantItem['careLevel']
              })
            }}
          />
        </div>

        {/* Light and Water Requirements */}
        <div className="grid grid-cols-2 gap-3">
          <CarePropertySelector
            type="lightRequirement"
            value={plant.lightRequirement || 'medium'}
            onChange={(value) => {
              handleUpdatePlant(index, { 
                ...plant, 
                lightRequirement: value as PlantItem['lightRequirement']
              })
            }}
          />
          <CarePropertySelector
            type="wateringFrequency"
            value={plant.wateringFrequency || 'weekly'}
            onChange={(value) => {
              handleUpdatePlant(index, { 
                ...plant, 
                wateringFrequency: value as PlantItem['wateringFrequency']
              })
            }}
          />
        </div>

        {/* Plant Description */}
        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={plant.content || ''}
            onChange={(e) => {
              handleUpdatePlant(index, { ...plant, content: e.target.value })
            }}
            placeholder="Describe this plant's features, benefits, and care tips..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Max Height</Label>
            <Input
              value={plant.maxHeight || ''}
              onChange={(e) => {
                handleUpdatePlant(index, { ...plant, maxHeight: e.target.value })
              }}
              placeholder="e.g., 3-6 feet"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Bloom Time</Label>
            <Input
              value={plant.bloomTime || ''}
              onChange={(e) => {
                handleUpdatePlant(index, { ...plant, bloomTime: e.target.value })
              }}
              placeholder="e.g., Spring to Summer"
              className="h-8"
            />
          </div>
        </div>

        {/* Link (Optional) */}
        <div className="space-y-2">
          <Label className="text-xs">Link (Optional)</Label>
          <Input
            value={plant.url || ''}
            onChange={(e) => {
              handleUpdatePlant(index, { ...plant, url: e.target.value })
            }}
            placeholder="Link to plant details page or product"
            className="h-8"
          />
        </div>
      </div>
    )
  }, [handleUpdatePlant])

  return (
    <div className="space-y-4">
      {/* Editor Controls */}
      <div className="flex items-center justify-between">
        <ColumnsSelector
          value={columns}
          onChange={(newColumns) => onUpdate({ columns: newColumns })}
          min={1}
          max={4}
          label="Display Columns"
        />
        
        {/* Preview Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2"
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>
      </div>

      {/* Theme-Aware Preview */}
      {showPreview && items.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Live Preview (with theme applied)
          </div>
          <PlantShopTheme customTheme={theme}>
            <PlantShowcaseView 
              section={section} 
              className="bg-white rounded border p-4"
            />
          </PlantShopTheme>
        </div>
      )}
      
      {/* Plant Items Editor */}
      <ItemListEditor
        items={items}
        onAdd={handleAddPlant}
        onUpdate={handleUpdatePlant}
        onRemove={handleRemovePlant}
        onReorder={handleReorder}
        renderItem={renderPlantItem}
        emptyMessage="No plants added yet"
        addButtonLabel="Add Plant"
      />
    </div>
  )
}