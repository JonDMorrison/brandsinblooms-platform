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

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

const benefitCategories = [
  { value: 'health', label: '🌱 Health Benefits', icon: 'Heart' },
  { value: 'air', label: '🌬️ Air Purification', icon: 'Wind' },
  { value: 'mental', label: '🧠 Mental Wellness', icon: 'Brain' },
  { value: 'aesthetic', label: '✨ Aesthetic Appeal', icon: 'Eye' },
  { value: 'practical', label: '🏠 Practical Uses', icon: 'Home' },
  { value: 'environmental', label: '🌍 Environmental Impact', icon: 'Globe' }
]

export function PlantBenefitsEditor({ section, onUpdate }: SectionEditorProps) {
  const items = (section.data.items as ContentItem[]) || []
  const columns = section.data.columns || 2

  const handleAddBenefit = useCallback(() => {
    const newBenefit: ContentItem = {
      id: `benefit-${Date.now()}`,
      title: 'New Plant Benefit',
      content: '',
      icon: 'Heart',
      metadata: {
        category: 'health',
        evidence: 'moderate'
      },
      order: items.length + 1
    }
    onUpdate({ items: [...items, newBenefit] })
  }, [items, onUpdate])

  const handleUpdateBenefit = useCallback((index: number, updatedBenefit: ContentItem) => {
    const newItems = [...items]
    newItems[index] = updatedBenefit
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleRemoveBenefit = useCallback((index: number) => {
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

  const getCategoryInfo = (category: string) => {
    return benefitCategories.find(c => c.value === category) || benefitCategories[0]
  }

  const getEvidenceColor = (evidence: string) => {
    switch (evidence) {
      case 'strong': return 'default'
      case 'moderate': return 'secondary'
      case 'limited': return 'outline'
      default: return 'secondary'
    }
  }

  const renderBenefitItem = useCallback((benefit: ContentItem, index: number) => {
    const categoryInfo = getCategoryInfo(benefit.metadata?.category || 'health')

    return (
      <div className="space-y-4">
        {/* Benefit Preview */}
        <div className="p-3 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">💚</span>
              <span className="text-sm font-medium">{benefit.title}</span>
            </div>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-xs">
                {categoryInfo.label.replace(/[^\w\s]/g, '')}
              </Badge>
              <Badge variant={getEvidenceColor(benefit.metadata?.evidence)} className="text-xs">
                {benefit.metadata?.evidence || 'moderate'}
              </Badge>
            </div>
          </div>
          {benefit.content && (
            <p className="text-xs text-gray-600">
              {benefit.content.slice(0, 80)}
              {benefit.content.length > 80 ? '...' : ''}
            </p>
          )}
        </div>

        {/* Benefit Category and Icon */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Benefit Category</Label>
            <Select 
              value={benefit.metadata?.category || 'health'} 
              onValueChange={(value) => {
                const selectedCategory = getCategoryInfo(value)
                handleUpdateBenefit(index, { 
                  ...benefit, 
                  metadata: { ...benefit.metadata, category: value },
                  icon: selectedCategory.icon
                })
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {benefitCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Icon</Label>
            <IconPicker
              value={benefit.icon || categoryInfo.icon}
              onChange={(icon) => {
                handleUpdateBenefit(index, { ...benefit, icon })
              }}
            />
          </div>
        </div>

        {/* Benefit Title */}
        <div className="space-y-2">
          <Label className="text-xs">Benefit Title</Label>
          <Input
            value={benefit.title || ''}
            onChange={(e) => {
              handleUpdateBenefit(index, { ...benefit, title: e.target.value })
            }}
            placeholder="e.g., Improves Indoor Air Quality"
            className="h-8"
          />
        </div>

        {/* Evidence Level */}
        <div className="space-y-2">
          <Label className="text-xs">Scientific Evidence</Label>
          <Select 
            value={benefit.metadata?.evidence || 'moderate'} 
            onValueChange={(value) => {
              handleUpdateBenefit(index, { 
                ...benefit, 
                metadata: { ...benefit.metadata, evidence: value }
              })
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strong">
                <div className="flex flex-col">
                  <span className="font-medium">🔬 Strong Evidence</span>
                  <span className="text-xs text-gray-500">Well-documented research</span>
                </div>
              </SelectItem>
              <SelectItem value="moderate">
                <div className="flex flex-col">
                  <span className="font-medium">📊 Moderate Evidence</span>
                  <span className="text-xs text-gray-500">Some scientific support</span>
                </div>
              </SelectItem>
              <SelectItem value="limited">
                <div className="flex flex-col">
                  <span className="font-medium">💡 Limited Evidence</span>
                  <span className="text-xs text-gray-500">Anecdotal or preliminary</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Benefit Description */}
        <div className="space-y-2">
          <Label className="text-xs">Benefit Description</Label>
          <Textarea
            value={benefit.content || ''}
            onChange={(e) => {
              handleUpdateBenefit(index, { ...benefit, content: e.target.value })
            }}
            placeholder="Explain how this plant provides this benefit..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Supporting Information */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Study/Source (Optional)</Label>
            <Input
              value={benefit.metadata?.source || ''}
              onChange={(e) => {
                handleUpdateBenefit(index, { 
                  ...benefit, 
                  metadata: { ...benefit.metadata, source: e.target.value }
                })
              }}
              placeholder="e.g., NASA Clean Air Study"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Related Link (Optional)</Label>
            <Input
              value={benefit.url || ''}
              onChange={(e) => {
                handleUpdateBenefit(index, { ...benefit, url: e.target.value })
              }}
              placeholder="Link to more information"
              className="h-8"
            />
          </div>
        </div>
      </div>
    )
  }, [handleUpdateBenefit])

  // Group benefits by category for display
  const benefitsByCategory = items.reduce((acc, benefit) => {
    const category = benefit.metadata?.category || 'health'
    if (!acc[category]) acc[category] = 0
    acc[category]++
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-4">
      {/* Benefits Summary */}
      {Object.keys(benefitsByCategory).length > 0 && (
        <div className="p-3 border rounded-lg bg-muted/30">
          <div className="text-xs">
            <span className="font-medium">Benefits by category:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(benefitsByCategory).map(([category, count]) => {
                const categoryInfo = getCategoryInfo(category)
                return (
                  <Badge key={category} variant="outline" className="text-xs">
                    {categoryInfo.label.replace(/[^\w\s]/g, '')}: {count}
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
        onAdd={handleAddBenefit}
        onUpdate={handleUpdateBenefit}
        onRemove={handleRemoveBenefit}
        onReorder={handleReorder}
        renderItem={renderBenefitItem}
        emptyMessage="No plant benefits added yet"
        addButtonLabel="Add Plant Benefit"
      />
    </div>
  )
}