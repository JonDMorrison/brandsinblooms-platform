'use client'

import React, { useCallback } from 'react'
import { ContentSection, SeasonalTip } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { SeasonSelector } from '@/src/components/plant-shop/selectors'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Badge } from '@/src/components/ui/badge'
import { Card } from '@/src/components/ui/card'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

export function CareCalendarEditor({ section, onUpdate }: SectionEditorProps) {
  const seasonalTips = (section.data.seasonalTips as SeasonalTip[]) || []

  const handleAddTip = useCallback(() => {
    const newTip: SeasonalTip = {
      id: `calendar-tip-${Date.now()}`,
      season: 'spring',
      title: 'New Care Task',
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

  const getSeasonTasks = (season: string) => {
    return seasonalTips.filter(tip => tip.season === season)
  }

  const seasons = ['spring', 'summer', 'fall', 'winter']

  const renderTipItem = useCallback((tip: SeasonalTip, index: number) => {
    return (
      <div className="space-y-4">
        {/* Calendar Entry Preview */}
        <Card className="p-3 bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getSeasonIcon(tip.season)}</span>
              <div>
                <span className="text-sm font-medium">{tip.title}</span>
                <p className="text-xs text-gray-600 capitalize">{tip.season}</p>
              </div>
            </div>
            <Badge variant={getPriorityColor(tip.priority)} className="text-xs">
              {tip.priority}
            </Badge>
          </div>
          {tip.description && (
            <p className="text-xs text-gray-700 mt-2">
              {tip.description.slice(0, 80)}
              {tip.description.length > 80 ? '...' : ''}
            </p>
          )}
        </Card>

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
            <Label className="text-xs">Task Priority</Label>
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
                    <span className="text-xs text-gray-500">Optional maintenance</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex flex-col">
                    <span className="font-medium">⭐ Medium Priority</span>
                    <span className="text-xs text-gray-500">Regular care tasks</span>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex flex-col">
                    <span className="font-medium">🚨 High Priority</span>
                    <span className="text-xs text-gray-500">Critical care tasks</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Task Title */}
        <div className="space-y-2">
          <Label className="text-xs">Care Task</Label>
          <Input
            value={tip.title}
            onChange={(e) => {
              handleUpdateTip(index, { ...tip, title: e.target.value })
            }}
            placeholder="e.g., Repot houseplants, Start seed propagation"
            className="h-8"
          />
        </div>

        {/* Task Description */}
        <div className="space-y-2">
          <Label className="text-xs">Task Details</Label>
          <Textarea
            value={tip.description}
            onChange={(e) => {
              handleUpdateTip(index, { ...tip, description: e.target.value })
            }}
            placeholder="Detailed instructions for this seasonal care task..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Additional Task Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Frequency</Label>
            <Input
              value={tip.metadata?.frequency || ''}
              onChange={(e) => {
                handleUpdateTip(index, { 
                  ...tip, 
                  metadata: { ...tip.metadata, frequency: e.target.value }
                })
              }}
              placeholder="e.g., Once per season, Monthly"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Duration</Label>
            <Input
              value={tip.metadata?.duration || ''}
              onChange={(e) => {
                handleUpdateTip(index, { 
                  ...tip, 
                  metadata: { ...tip.metadata, duration: e.target.value }
                })
              }}
              placeholder="e.g., 30 minutes, 1-2 hours"
              className="h-8"
            />
          </div>
        </div>
      </div>
    )
  }, [handleUpdateTip])

  return (
    <div className="space-y-4">
      {/* Calendar Overview */}
      {seasonalTips.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-3">Care Calendar Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {seasons.map((season) => {
              const tasks = getSeasonTasks(season)
              return (
                <div key={season} className="text-center p-2 border rounded-lg">
                  <div className="text-lg mb-1">{getSeasonIcon(season)}</div>
                  <div className="text-xs font-medium capitalize">{season}</div>
                  <div className="text-xs text-gray-600">{tasks.length} tasks</div>
                  {tasks.length > 0 && (
                    <div className="flex justify-center gap-1 mt-1">
                      {tasks.slice(0, 3).map((task) => (
                        <Badge 
                          key={task.id} 
                          variant={getPriorityColor(task.priority)} 
                          className="text-xs h-3 px-1"
                        >
                          {task.priority.charAt(0)}
                        </Badge>
                      ))}
                      {tasks.length > 3 && (
                        <span className="text-xs text-gray-500">+{tasks.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}
      
      <ItemListEditor
        items={seasonalTips}
        onAdd={handleAddTip}
        onUpdate={handleUpdateTip}
        onRemove={handleRemoveTip}
        onReorder={handleReorder}
        renderItem={renderTipItem}
        emptyMessage="No care calendar tasks added yet"
        addButtonLabel="Add Care Task"
      />
    </div>
  )
}