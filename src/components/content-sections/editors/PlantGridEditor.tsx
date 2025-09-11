'use client'

import React, { useCallback } from 'react'
import { ContentSection, PlantItem } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { ColumnsSelector } from '../shared/ColumnsSelector'
import { ImageInput } from '@/src/components/content-editor'
import { CarePropertySelector, PlantTypeSelector } from '@/src/components/plant-shop/selectors'
import { Badge } from '@/src/components/ui/badge'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

export function PlantGridEditor({ section, onUpdate }: SectionEditorProps) {
  const items = (section.data.items as PlantItem[]) || []
  const columns = section.data.columns || 3

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
    const getCareIcon = (careLevel: string) => {
      switch (careLevel) {
        case 'easy': return '🌱'
        case 'medium': return '🌿'
        case 'challenging': return '🌳'
        default: return '🌱'
      }
    }

    return (
      <div className="space-y-4">
        {/* Plant Preview Card */}
        <div className="p-3 border rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">
              {plant.commonName || plant.title || 'Unnamed Plant'}
            </span>
            <Badge variant="outline" className="text-xs">
              {getCareIcon(plant.careLevel || 'easy')} {plant.careLevel || 'easy'}
            </Badge>
          </div>
          {plant.image && (
            <img 
              src={plant.image} 
              alt={plant.commonName || plant.title || 'Plant'} 
              className="w-full h-24 object-cover rounded"
            />
          )}
        </div>

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
                  title: e.target.value
                })
              }}
              placeholder="e.g., Snake Plant"
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
              placeholder="e.g., Sansevieria trifasciata"
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

        {/* Quick Care Info */}
        <div className="grid grid-cols-3 gap-2">
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

        {/* Plant Type and Price */}
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
          <div className="space-y-2">
            <Label className="text-xs">Price (Optional)</Label>
            <Input
              value={plant.metadata?.price || ''}
              onChange={(e) => {
                handleUpdatePlant(index, { 
                  ...plant, 
                  metadata: { ...plant.metadata, price: e.target.value }
                })
              }}
              placeholder="$19.99"
              className="h-8"
            />
          </div>
        </div>

        {/* Short Description */}
        <div className="space-y-2">
          <Label className="text-xs">Short Description</Label>
          <Input
            value={plant.content || ''}
            onChange={(e) => {
              handleUpdatePlant(index, { ...plant, content: e.target.value })
            }}
            placeholder="Brief description for grid display..."
            className="h-8"
          />
        </div>

        {/* Link */}
        <div className="space-y-2">
          <Label className="text-xs">Link (Optional)</Label>
          <Input
            value={plant.url || ''}
            onChange={(e) => {
              handleUpdatePlant(index, { ...plant, url: e.target.value })
            }}
            placeholder="Link to plant details or purchase page"
            className="h-8"
          />
        </div>
      </div>
    )
  }, [handleUpdatePlant])

  return (
    <div className="space-y-4">
      <ColumnsSelector
        value={columns}
        onChange={(newColumns) => onUpdate({ columns: newColumns })}
        min={2}
        max={6}
        label="Grid Columns"
      />
      
      <ItemListEditor
        items={items}
        onAdd={handleAddPlant}
        onUpdate={handleUpdatePlant}
        onRemove={handleRemovePlant}
        onReorder={handleReorder}
        renderItem={renderPlantItem}
        emptyMessage="No plants in catalog yet"
        addButtonLabel="Add Plant to Catalog"
      />
    </div>
  )
}