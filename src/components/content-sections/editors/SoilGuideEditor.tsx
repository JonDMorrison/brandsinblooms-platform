'use client'

import React, { useCallback } from 'react'
import { ContentSection, ContentItem } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { ColumnsSelector } from '../shared/ColumnsSelector'
import { IconPicker } from '@/src/components/content-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Badge } from '@/src/components/ui/badge'
import { Card } from '@/src/components/ui/card'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

const soilTypes = [
  { value: 'potting', label: '🪴 Potting Mix', icon: 'Package', description: 'General indoor plants' },
  { value: 'succulent', label: '🌵 Succulent Mix', icon: 'Mountain', description: 'Cacti and succulents' },
  { value: 'orchid', label: '🌺 Orchid Bark', icon: 'Flower', description: 'Epiphytic orchids' },
  { value: 'acidic', label: '🍃 Acidic Soil', icon: 'Droplets', description: 'Acid-loving plants' },
  { value: 'sandy', label: '🏖️ Sandy Mix', icon: 'Circle', description: 'Desert and Mediterranean' },
  { value: 'clay', label: '🟫 Clay-based', icon: 'Square', description: 'Heavy, moisture-retaining' },
  { value: 'organic', label: '🌱 Organic Rich', icon: 'Leaf', description: 'Compost-rich mixes' },
  { value: 'hydroponic', label: '💧 Hydroponic', icon: 'Beaker', description: 'Soilless growing' }
]

const drainageOptions = [
  { value: 'excellent', label: '⚡ Excellent Drainage', color: 'default' },
  { value: 'good', label: '✅ Good Drainage', color: 'secondary' },
  { value: 'moderate', label: '🔄 Moderate Drainage', color: 'outline' },
  { value: 'poor', label: '🐌 Poor Drainage', color: 'destructive' }
]

export function SoilGuideEditor({ section, onUpdate }: SectionEditorProps) {
  const items = (section.data.items as ContentItem[]) || []
  const columns = section.data.columns || 2

  const handleAddSoilType = useCallback(() => {
    const newSoilType: ContentItem = {
      id: `soil-${Date.now()}`,
      title: 'New Soil Type',
      content: '',
      icon: 'Package',
      metadata: {
        soilType: 'potting',
        drainage: 'good',
        ph: '6.0-7.0',
        components: ''
      },
      order: items.length + 1
    }
    onUpdate({ items: [...items, newSoilType] })
  }, [items, onUpdate])

  const handleUpdateSoilType = useCallback((index: number, updatedSoilType: ContentItem) => {
    const newItems = [...items]
    newItems[index] = updatedSoilType
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleRemoveSoilType = useCallback((index: number) => {
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

  const getSoilTypeInfo = (soilType: string) => {
    return soilTypes.find(s => s.value === soilType) || soilTypes[0]
  }

  const getDrainageOption = (drainage: string) => {
    return drainageOptions.find(d => d.value === drainage) || drainageOptions[1]
  }

  const renderSoilTypeItem = useCallback((soilType: ContentItem, index: number) => {
    const typeInfo = getSoilTypeInfo(soilType.metadata?.soilType || 'potting')
    const drainageInfo = getDrainageOption(soilType.metadata?.drainage || 'good')

    return (
      <div className="space-y-4">
        {/* Soil Type Preview */}
        <Card className="p-3 bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌱</span>
              <div>
                <span className="text-sm font-medium">{soilType.title}</span>
                <p className="text-xs text-gray-600">{typeInfo.label}</p>
              </div>
            </div>
            <Badge variant={drainageInfo.color as any} className="text-xs">
              {drainageInfo.label.replace(/[^\w\s]/g, '')}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            <div className="flex justify-between">
              <span className="text-gray-600">pH Range:</span>
              <span>{soilType.metadata?.ph || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Drainage:</span>
              <span>{soilType.metadata?.drainage || 'good'}</span>
            </div>
          </div>
        </Card>

        {/* Soil Type and Icon */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Soil Type</Label>
            <Select 
              value={soilType.metadata?.soilType || 'potting'} 
              onValueChange={(value) => {
                const selectedType = getSoilTypeInfo(value)
                handleUpdateSoilType(index, { 
                  ...soilType, 
                  metadata: { ...soilType.metadata, soilType: value },
                  icon: selectedType.icon
                })
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {soilTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-gray-500">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Icon</Label>
            <IconPicker
              value={soilType.icon || typeInfo.icon}
              onChange={(icon) => {
                handleUpdateSoilType(index, { ...soilType, icon })
              }}
            />
          </div>
        </div>

        {/* Custom Name */}
        <div className="space-y-2">
          <Label className="text-xs">Custom Name (Optional)</Label>
          <Input
            value={soilType.title || ''}
            onChange={(e) => {
              handleUpdateSoilType(index, { ...soilType, title: e.target.value })
            }}
            placeholder="e.g., Premium Houseplant Mix"
            className="h-8"
          />
        </div>

        {/* Soil Properties */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">pH Range</Label>
            <Input
              value={soilType.metadata?.ph || ''}
              onChange={(e) => {
                handleUpdateSoilType(index, { 
                  ...soilType, 
                  metadata: { ...soilType.metadata, ph: e.target.value }
                })
              }}
              placeholder="e.g., 6.0-7.0"
              className="h-8"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Drainage Level</Label>
            <Select 
              value={soilType.metadata?.drainage || 'good'} 
              onValueChange={(value) => {
                handleUpdateSoilType(index, { 
                  ...soilType, 
                  metadata: { ...soilType.metadata, drainage: value }
                })
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {drainageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Soil Components */}
        <div className="space-y-2">
          <Label className="text-xs">Main Components</Label>
          <Input
            value={soilType.metadata?.components || ''}
            onChange={(e) => {
              handleUpdateSoilType(index, { 
                ...soilType, 
                metadata: { ...soilType.metadata, components: e.target.value }
              })
            }}
            placeholder="e.g., Peat moss, perlite, vermiculite, bark"
            className="h-8"
          />
        </div>

        {/* Description and Best For */}
        <div className="space-y-2">
          <Label className="text-xs">Description & Best For</Label>
          <Textarea
            value={soilType.content || ''}
            onChange={(e) => {
              handleUpdateSoilType(index, { ...soilType, content: e.target.value })
            }}
            placeholder="Describe this soil mix and what plants it's best suited for..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* DIY Recipe and Purchase Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">DIY Recipe (Optional)</Label>
            <Textarea
              value={soilType.metadata?.recipe || ''}
              onChange={(e) => {
                handleUpdateSoilType(index, { 
                  ...soilType, 
                  metadata: { ...soilType.metadata, recipe: e.target.value }
                })
              }}
              placeholder="e.g., 2 parts peat, 1 part perlite..."
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Where to Buy</Label>
            <Textarea
              value={soilType.metadata?.whereToBuy || ''}
              onChange={(e) => {
                handleUpdateSoilType(index, { 
                  ...soilType, 
                  metadata: { ...soilType.metadata, whereToBuy: e.target.value }
                })
              }}
              placeholder="Garden centers, online retailers..."
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
      </div>
    )
  }, [handleUpdateSoilType])

  return (
    <div className="space-y-4">
      {/* Soil Types Summary */}
      {items.length > 0 && (
        <div className="p-3 border rounded-lg bg-muted/30">
          <div className="text-xs">
            <span className="font-medium">{items.length} soil types configured</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {items.map((item) => {
                const typeInfo = getSoilTypeInfo(item.metadata?.soilType || 'potting')
                return (
                  <Badge key={item.id} variant="outline" className="text-xs">
                    {typeInfo.label.replace(/[^\w\s]/g, '')}
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <ColumnsSelector
        value={columns}
        onChange={(newColumns) => onUpdate({ columns: newColumns })}
        min={1}
        max={3}
        label="Display Columns"
      />
      
      <ItemListEditor
        items={items}
        onAdd={handleAddSoilType}
        onUpdate={handleUpdateSoilType}
        onRemove={handleRemoveSoilType}
        onReorder={handleReorder}
        renderItem={renderSoilTypeItem}
        emptyMessage="No soil types added yet"
        addButtonLabel="Add Soil Type"
      />
    </div>
  )
}