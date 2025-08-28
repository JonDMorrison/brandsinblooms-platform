'use client'

import React, { useCallback } from 'react'
import { ContentSection, ContentItem } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { ColumnsSelector } from '../shared/ColumnsSelector'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Plus, X } from 'lucide-react'
import { Checkbox } from '@/src/components/ui/checkbox'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

interface PricingTier extends ContentItem {
  metadata?: {
    price?: string
    period?: string
    currency?: string
    features?: Array<string | { text: string; enabled: boolean }>
    buttonText?: string
    buttonUrl?: string
    highlighted?: boolean
  }
}

export function PricingEditor({ section, onUpdate }: SectionEditorProps) {
  const items = (section.data.items as PricingTier[]) || []
  const columns = section.data.columns || 3

  const handleAddTier = useCallback(() => {
    const newTier: PricingTier = {
      id: `tier-${Date.now()}`,
      title: 'Plan Name',
      subtitle: 'Perfect for...',
      content: '',
      order: items.length + 1,
      metadata: {
        price: '0',
        period: 'month',
        currency: '$',
        features: [],
        buttonText: 'Get Started',
        buttonUrl: '/signup',
        highlighted: items.length === 1 // Auto-highlight second tier
      }
    }
    onUpdate({ items: [...items, newTier] })
  }, [items, onUpdate])

  const handleUpdateTier = useCallback((index: number, updatedTier: PricingTier) => {
    const newItems = [...items]
    newItems[index] = updatedTier
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleRemoveTier = useCallback((index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleReorder = useCallback((reorderedItems: PricingTier[]) => {
    const itemsWithOrder = reorderedItems.map((item, index) => ({
      ...item,
      order: index + 1
    }))
    onUpdate({ items: itemsWithOrder })
  }, [onUpdate])

  const renderPricingTier = useCallback((tier: PricingTier, index: number) => {
    const features = (tier.metadata?.features || []) as Array<string | { text: string; enabled: boolean }>
    
    const addFeature = () => {
      const newFeatures = [...features, '']
      handleUpdateTier(index, {
        ...tier,
        metadata: { ...tier.metadata, features: newFeatures }
      })
    }
    
    const updateFeature = (featureIndex: number, value: string | { text: string; enabled: boolean }) => {
      const newFeatures = [...features]
      newFeatures[featureIndex] = value
      handleUpdateTier(index, {
        ...tier,
        metadata: { ...tier.metadata, features: newFeatures }
      })
    }
    
    const removeFeature = (featureIndex: number) => {
      const newFeatures = features.filter((_, i) => i !== featureIndex)
      handleUpdateTier(index, {
        ...tier,
        metadata: { ...tier.metadata, features: newFeatures }
      })
    }

    return (
      <div className="space-y-3">
        {index === 1 && (
          <Badge className="mb-2">Most Popular (Auto-applied to 2nd tier)</Badge>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Plan Name</Label>
            <Input
              value={tier.title || ''}
              onChange={(e) => {
                handleUpdateTier(index, { ...tier, title: e.target.value })
              }}
              placeholder="Basic"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Tagline</Label>
            <Input
              value={tier.subtitle || ''}
              onChange={(e) => {
                handleUpdateTier(index, { ...tier, subtitle: e.target.value })
              }}
              placeholder="Perfect for individuals"
              className="h-8"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Currency</Label>
            <Input
              value={(tier.metadata?.currency as string) || '$'}
              onChange={(e) => {
                handleUpdateTier(index, {
                  ...tier,
                  metadata: { ...tier.metadata, currency: e.target.value }
                })
              }}
              placeholder="$"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Price</Label>
            <Input
              value={(tier.metadata?.price as string) || '0'}
              onChange={(e) => {
                handleUpdateTier(index, {
                  ...tier,
                  metadata: { ...tier.metadata, price: e.target.value }
                })
              }}
              placeholder="29"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Period</Label>
            <Input
              value={(tier.metadata?.period as string) || 'month'}
              onChange={(e) => {
                handleUpdateTier(index, {
                  ...tier,
                  metadata: { ...tier.metadata, period: e.target.value }
                })
              }}
              placeholder="month"
              className="h-8"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Description (Optional)</Label>
          <Textarea
            value={tier.content || ''}
            onChange={(e) => {
              handleUpdateTier(index, { ...tier, content: e.target.value })
            }}
            placeholder="Additional description..."
            rows={2}
            className="resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Features</Label>
          <div className="space-y-2">
            {features.map((feature, featureIndex) => {
              const isObject = typeof feature === 'object' && feature !== null
              const text = isObject ? feature.text : feature
              const enabled = isObject ? feature.enabled : true
              
              return (
                <div key={featureIndex} className="flex items-center gap-2">
                  <Checkbox
                    checked={enabled}
                    onCheckedChange={(checked) => {
                      updateFeature(featureIndex, { text, enabled: checked as boolean })
                    }}
                  />
                  <Input
                    value={text}
                    onChange={(e) => {
                      updateFeature(featureIndex, isObject ? { text: e.target.value, enabled } : e.target.value)
                    }}
                    placeholder="Feature description"
                    className="h-8 flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => removeFeature(featureIndex)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={addFeature}
              className="w-full h-8"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Feature
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Button Text</Label>
            <Input
              value={(tier.metadata?.buttonText as string) || 'Get Started'}
              onChange={(e) => {
                handleUpdateTier(index, {
                  ...tier,
                  metadata: { ...tier.metadata, buttonText: e.target.value }
                })
              }}
              placeholder="Get Started"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Button URL</Label>
            <Input
              value={(tier.metadata?.buttonUrl as string) || ''}
              onChange={(e) => {
                handleUpdateTier(index, {
                  ...tier,
                  metadata: { ...tier.metadata, buttonUrl: e.target.value }
                })
              }}
              placeholder="/signup"
              className="h-8"
            />
          </div>
        </div>
      </div>
    )
  }, [handleUpdateTier])

  return (
    <div className="space-y-4">
      <ColumnsSelector
        value={columns}
        onChange={(newColumns) => onUpdate({ columns: newColumns })}
        min={1}
        max={4}
        label="Pricing Columns"
      />
      
      <ItemListEditor
        items={items}
        onAdd={handleAddTier}
        onUpdate={handleUpdateTier}
        onRemove={handleRemoveTier}
        onReorder={handleReorder}
        renderItem={renderPricingTier}
        emptyMessage="No pricing tiers defined yet"
        addButtonLabel="Add Pricing Tier"
        maxItems={6}
      />
    </div>
  )
}