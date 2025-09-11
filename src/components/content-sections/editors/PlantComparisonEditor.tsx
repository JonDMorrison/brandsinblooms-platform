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
import { Card } from '@/src/components/ui/card'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

export function PlantComparisonEditor({ section, onUpdate }: SectionEditorProps) {
  const items = (section.data.items as PlantItem[]) || []
  const columns = section.data.columns || 3

  const handleAddPlant = useCallback(() => {
    const newPlant: PlantItem = {
      id: `plant-compare-${Date.now()}`,
      title: 'Plant to Compare',
      commonName: '',
      scientificName: '',
      content: '',
      image: '',
      careLevel: 'easy',
      lightRequirement: 'medium',
      wateringFrequency: 'weekly',
      plantType: 'houseplant',
      maxHeight: '',
      soilType: '',
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

  const getCareIcon = (careLevel: string) => {
    switch (careLevel) {
      case 'easy': return '🌱'
      case 'medium': return '🌿'
      case 'challenging': return '🌳'
      default: return '🌱'
    }
  }

  const getLightIcon = (light: string) => {
    switch (light) {
      case 'low': return '🌙'
      case 'medium': return '☁️'
      case 'bright': return '☀️'
      case 'direct': return '🌞'
      default: return '☁️'
    }
  }

  const getWaterIcon = (water: string) => {
    switch (water) {
      case 'weekly': return '💧'
      case 'bi-weekly': return '💦'
      case 'monthly': return '🌊'
      case 'seasonal': return '🍂'
      default: return '💧'
    }
  }

  const renderPlantItem = useCallback((plant: PlantItem, index: number) => {
    return (
      <div className="space-y-4">
        {/* Comparison Preview Card */}
        <Card className="p-3 bg-muted/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {plant.commonName || plant.title || 'Unnamed Plant'}
              </h4>
              <div className="flex gap-1">
                <span className="text-xs">{getCareIcon(plant.careLevel || 'easy')}</span>
                <span className="text-xs">{getLightIcon(plant.lightRequirement || 'medium')}</span>
                <span className="text-xs">{getWaterIcon(plant.wateringFrequency || 'weekly')}</span>
              </div>
            </div>
            
            {plant.image && (
              <img 
                src={plant.image} 
                alt={plant.commonName || plant.title || 'Plant'} 
                className="w-full h-20 object-cover rounded"
              />
            )}
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Care:</span>
                <Badge variant="outline" className="text-xs h-4 px-1">
                  {plant.careLevel || 'easy'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Light:</span>
                <span>{plant.lightRequirement || 'medium'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Water:</span>
                <span>{plant.wateringFrequency || 'weekly'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span>{plant.maxHeight || 'N/A'}</span>
              </div>
            </div>
          </div>
        </Card>

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
              placeholder="e.g., Fiddle Leaf Fig"
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
              placeholder="e.g., Ficus lyrata"
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

        {/* Comparison Attributes */}
        <div className="space-y-3">
          <h5 className="text-xs font-medium">Comparison Attributes</h5>
          
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
              <Label className="text-xs">Max Height</Label>
              <Input
                value={plant.maxHeight || ''}
                onChange={(e) => {
                  handleUpdatePlant(index, { ...plant, maxHeight: e.target.value })
                }}
                placeholder="e.g., 6-10 feet"
                className="h-8"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Soil Type</Label>
              <Input
                value={plant.soilType || ''}
                onChange={(e) => {
                  handleUpdatePlant(index, { ...plant, soilType: e.target.value })
                }}
                placeholder="e.g., Well-draining"
                className="h-8"
              />
            </div>
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
                placeholder="$29.99"
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Pros and Cons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Main Benefits</Label>
            <Input
              value={plant.metadata?.pros || ''}
              onChange={(e) => {
                handleUpdatePlant(index, { 
                  ...plant, 
                  metadata: { ...plant.metadata, pros: e.target.value }
                })
              }}
              placeholder="e.g., Air purifying, dramatic foliage"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Considerations</Label>
            <Input
              value={plant.metadata?.cons || ''}
              onChange={(e) => {
                handleUpdatePlant(index, { 
                  ...plant, 
                  metadata: { ...plant.metadata, cons: e.target.value }
                })
              }}
              placeholder="e.g., Requires high humidity"
              className="h-8"
            />
          </div>
        </div>

        {/* Link */}
        <div className="space-y-2">
          <Label className="text-xs">Link (Optional)</Label>
          <Input
            value={plant.url || ''}
            onChange={(e) => {
              handleUpdatePlant(index, { ...plant, url: e.target.value })
            }}
            placeholder="Link to detailed plant page"
            className="h-8"
          />
        </div>
      </div>
    )
  }, [handleUpdatePlant])

  return (
    <div className="space-y-4">
      {/* Comparison Summary */}
      {items.length > 1 && (
        <div className="p-3 border rounded-lg bg-muted/30">
          <div className="text-xs">
            <span className="font-medium">Comparing {items.length} plants</span>
            <div className="flex gap-4 mt-1 text-gray-600">
              <span>Care levels: {[...new Set(items.map(p => p.careLevel))].join(', ')}</span>
              <span>Types: {[...new Set(items.map(p => p.plantType))].join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      <ColumnsSelector
        value={columns}
        onChange={(newColumns) => onUpdate({ columns: newColumns })}
        min={2}
        max={4}
        label="Comparison Columns"
      />
      
      <ItemListEditor
        items={items}
        onAdd={handleAddPlant}
        onUpdate={handleUpdatePlant}
        onRemove={handleRemovePlant}
        onReorder={handleReorder}
        renderItem={renderPlantItem}
        emptyMessage="No plants to compare yet"
        addButtonLabel="Add Plant to Comparison"
        maxItems={6}
      />
    </div>
  )
}