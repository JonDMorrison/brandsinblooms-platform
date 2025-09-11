'use client'

import React, { useCallback } from 'react'
import { ContentSection, SeasonalTip } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { ColumnsSelector } from '../shared/ColumnsSelector'
import { SeasonSelector } from '@/src/components/plant-shop/selectors'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Badge } from '@/src/components/ui/badge'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

export function SeasonalTipsEditor({ section, onUpdate }: SectionEditorProps) {
  const seasonalTips = (section.data.seasonalTips as SeasonalTip[]) || []
  const columns = section.data.columns || 2

  const handleAddTip = useCallback(() => {
    const newTip: SeasonalTip = {
      id: `tip-${Date.now()}`,
      season: 'spring',
      title: 'New Seasonal Tip',
      description: '',
      priority: 'medium'
    }
    onUpdate({ seasonalTips: [...seasonalTips, newTip] })
  }, [seasonalTips, onUpdate])

  const handleUpdateTip = useCallback((index: number, updatedTip: SeasonalTip) => {
    const newTips = [...seasonalTips]
    newTips[index] = updatedTip
    onUpdate({ seasonalTips: newTips })
  }, [seasonalTips, onUpdate])

  const handleRemoveTip = useCallback((index: number) => {
    const newTips = seasonalTips.filter((_, i) => i !== index)
    onUpdate({ seasonalTips: newTips })
  }, [seasonalTips, onUpdate])

  const handleReorder = useCallback((reorderedTips: SeasonalTip[]) => {
    onUpdate({ seasonalTips: reorderedTips })
  }, [onUpdate])

  const getSeasonIcon = (season: string) => {
    switch (season) {
      case 'spring': return '🌸'
      case 'summer': return '☀️'
      case 'fall': return '🍂'
      case 'winter': return '❄️'
      default: return '🌿'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const renderTipItem = useCallback((tip: SeasonalTip, index: number) => {
    return (
      <div className="space-y-4">
        {/* Tip Preview */}
        <div className="p-3 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getSeasonIcon(tip.season)}</span>
              <span className="text-sm font-medium">{tip.title}</span>
            </div>
            <Badge variant={getPriorityColor(tip.priority)} className="text-xs">
              {tip.priority}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 capitalize">
            {tip.season} tip
          </p>
        </div>

        {/* Season and Priority */}
        <div className="grid grid-cols-2 gap-3">
          <SeasonSelector
            value={tip.season}
            onChange={(value) => {
              handleUpdateTip(index, { 
                ...tip, 
                season: value as SeasonalTip['season']
              })
            }}
          />
          
          <div className="space-y-2">
            <Label className="text-xs">Priority Level</Label>
            <Select 
              value={tip.priority} 
              onValueChange={(value) => {
                handleUpdateTip(index, { 
                  ...tip, 
                  priority: value as SeasonalTip['priority']
                })
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex flex-col">
                    <span className="font-medium">💡 Low Priority</span>
                    <span className="text-xs text-gray-500">Nice to know tips</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex flex-col">
                    <span className="font-medium">⭐ Medium Priority</span>
                    <span className="text-xs text-gray-500">Important care tips</span>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex flex-col">
                    <span className="font-medium">🚨 High Priority</span>
                    <span className="text-xs text-gray-500">Critical plant care</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label className="text-xs">Tip Title</Label>
          <Input
            value={tip.title}
            onChange={(e) => {
              handleUpdateTip(index, { ...tip, title: e.target.value })
            }}
            placeholder="e.g., Prepare Plants for Winter"
            className="h-8"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={tip.description}
            onChange={(e) => {
              handleUpdateTip(index, { ...tip, description: e.target.value })
            }}
            placeholder="Provide detailed seasonal care instructions..."
            rows={4}
            className="resize-none"
          />
        </div>
      </div>
    )
  }, [handleUpdateTip])

  // Group tips by season for display
  const tipsBySeason = seasonalTips.reduce((acc, tip) => {
    if (!acc[tip.season]) acc[tip.season] = 0
    acc[tip.season]++
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-4">
      {/* Season Summary */}
      {Object.keys(tipsBySeason).length > 0 && (
        <div className="p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium">Tips by Season:</span>
            {Object.entries(tipsBySeason).map(([season, count]) => (
              <div key={season} className="flex items-center gap-1">
                <span>{getSeasonIcon(season)}</span>
                <span className="capitalize">{season}: {count}</span>
              </div>
            ))}
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
        items={seasonalTips}
        onAdd={handleAddTip}
        onUpdate={handleUpdateTip}
        onRemove={handleRemoveTip}
        onReorder={handleReorder}
        renderItem={renderTipItem}
        emptyMessage="No seasonal tips added yet"
        addButtonLabel="Add Seasonal Tip"
      />
    </div>
  )
}