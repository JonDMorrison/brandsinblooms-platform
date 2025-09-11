'use client'

import React, { useCallback } from 'react'
import { ContentSection, GrowingCondition } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { ColumnsSelector } from '../shared/ColumnsSelector'
import { IconPicker } from '@/src/components/content-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

const commonConditions = [
  { condition: 'Light', icon: 'Sun', suggestions: ['Bright indirect', 'Low light', 'Direct sunlight', 'Partial shade'] },
  { condition: 'Water', icon: 'Droplets', suggestions: ['Weekly', 'Bi-weekly', 'When soil is dry', 'Mist regularly'] },
  { condition: 'Temperature', icon: 'Thermometer', suggestions: ['65-75°F', '60-80°F', 'Cool temperatures', 'Warm climate'] },
  { condition: 'Humidity', icon: 'Cloud', suggestions: ['40-60%', 'High humidity', 'Low humidity', 'Moderate humidity'] },
  { condition: 'Soil', icon: 'Mountain', suggestions: ['Well-draining', 'Acidic soil', 'Sandy soil', 'Rich potting mix'] },
  { condition: 'Fertilizer', icon: 'Zap', suggestions: ['Monthly', 'Bi-weekly in growing season', 'Minimal feeding', 'Rich compost'] },
  { condition: 'Space', icon: 'Square', suggestions: ['Compact', '2-3 feet spread', 'Climbing support needed', 'Large container'] },
  { condition: 'Repotting', icon: 'RotateCcw', suggestions: ['Every 2 years', 'When rootbound', 'Spring repotting', 'Rarely needed'] }
]

export function GrowingConditionsEditor({ section, onUpdate }: SectionEditorProps) {
  const growingConditions = (section.data.growingConditions as GrowingCondition[]) || []
  const columns = section.data.columns || 2

  const handleAddCondition = useCallback(() => {
    const newCondition: GrowingCondition = {
      id: `condition-${Date.now()}`,
      condition: 'Light',
      value: '',
      description: '',
      icon: 'Sun'
    }
    onUpdate({ growingConditions: [...growingConditions, newCondition] })
  }, [growingConditions, onUpdate])

  const handleUpdateCondition = useCallback((index: number, updatedCondition: GrowingCondition) => {
    const newConditions = [...growingConditions]
    newConditions[index] = updatedCondition
    onUpdate({ growingConditions: newConditions })
  }, [growingConditions, onUpdate])

  const handleRemoveCondition = useCallback((index: number) => {
    const newConditions = growingConditions.filter((_, i) => i !== index)
    onUpdate({ growingConditions: newConditions })
  }, [growingConditions, onUpdate])

  const handleReorder = useCallback((reorderedConditions: GrowingCondition[]) => {
    onUpdate({ growingConditions: reorderedConditions })
  }, [onUpdate])

  const getConditionInfo = (condition: string) => {
    return commonConditions.find(c => c.condition === condition) || commonConditions[0]
  }

  const renderConditionItem = useCallback((condition: GrowingCondition, index: number) => {
    const conditionInfo = getConditionInfo(condition.condition)

    return (
      <div className="space-y-4">
        {/* Condition Preview */}
        <div className="p-3 border rounded-lg bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm">💧</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{condition.condition}</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-sm text-primary">{condition.value}</span>
              </div>
              {condition.description && (
                <p className="text-xs text-gray-600 mt-1">
                  {condition.description.slice(0, 60)}
                  {condition.description.length > 60 ? '...' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Condition Type and Icon */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Condition Type</Label>
            <Select 
              value={condition.condition} 
              onValueChange={(value) => {
                const selectedCondition = commonConditions.find(c => c.condition === value)
                handleUpdateCondition(index, { 
                  ...condition, 
                  condition: value,
                  icon: selectedCondition?.icon || condition.icon
                })
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commonConditions.map((cond) => (
                  <SelectItem key={cond.condition} value={cond.condition}>
                    <div className="flex items-center gap-2">
                      <span>{cond.condition}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Icon</Label>
            <IconPicker
              value={condition.icon || conditionInfo.icon}
              onChange={(icon) => {
                handleUpdateCondition(index, { ...condition, icon })
              }}
            />
          </div>
        </div>

        {/* Value with Suggestions */}
        <div className="space-y-2">
          <Label className="text-xs">
            Requirement Value
            {conditionInfo.suggestions.length > 0 && (
              <span className="text-gray-500 ml-1">(or select suggestion)</span>
            )}
          </Label>
          <Input
            value={condition.value}
            onChange={(e) => {
              handleUpdateCondition(index, { ...condition, value: e.target.value })
            }}
            placeholder={`e.g., ${conditionInfo.suggestions[0] || 'Enter requirement'}`}
            className="h-8"
          />
          
          {/* Quick suggestions */}
          {conditionInfo.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {conditionInfo.suggestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    handleUpdateCondition(index, { ...condition, value: suggestion })
                  }}
                  className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-xs">Additional Details (Optional)</Label>
          <Textarea
            value={condition.description || ''}
            onChange={(e) => {
              handleUpdateCondition(index, { ...condition, description: e.target.value })
            }}
            placeholder="Additional information about this growing condition..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>
    )
  }, [handleUpdateCondition])

  return (
    <div className="space-y-4">
      {/* Summary */}
      {growingConditions.length > 0 && (
        <div className="p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              {growingConditions.length} growing conditions specified
            </span>
            <div className="flex gap-2">
              {growingConditions.slice(0, 3).map((condition) => (
                <span key={condition.id} className="text-gray-600">
                  {condition.condition}
                </span>
              ))}
              {growingConditions.length > 3 && (
                <span className="text-gray-500">+{growingConditions.length - 3} more</span>
              )}
            </div>
          </div>
        </div>
      )}

      <ColumnsSelector
        value={columns}
        onChange={(newColumns) => onUpdate({ columns: newColumns })}
        min={1}
        max={4}
        label="Display Columns"
      />
      
      <ItemListEditor
        items={growingConditions}
        onAdd={handleAddCondition}
        onUpdate={handleUpdateCondition}
        onRemove={handleRemoveCondition}
        onReorder={handleReorder}
        renderItem={renderConditionItem}
        emptyMessage="No growing conditions added yet"
        addButtonLabel="Add Growing Condition"
      />
    </div>
  )
}