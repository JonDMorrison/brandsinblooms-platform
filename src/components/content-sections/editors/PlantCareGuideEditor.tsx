'use client'

import React, { useCallback } from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { Label } from '@/src/components/ui/label'
import { RichTextEditor } from '@/src/components/content-editor'
import { CarePropertySelector } from '@/src/components/plant-shop/selectors'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Card } from '@/src/components/ui/card'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

export function PlantCareGuideEditor({ section, onUpdate }: SectionEditorProps) {
  const handleDataChange = useCallback((field: string, value: unknown) => {
    onUpdate({ [field]: value })
  }, [onUpdate])

  return (
    <div className="space-y-6">
      {/* Care Overview */}
      <Card className="p-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Care Overview</h4>
          
          <div className="grid grid-cols-3 gap-4">
            <CarePropertySelector
              type="careLevel"
              value={section.data.careLevel || 'easy'}
              onChange={(value) => handleDataChange('careLevel', value)}
            />
            <CarePropertySelector
              type="lightRequirement"
              value={section.data.lightRequirement || 'medium'}
              onChange={(value) => handleDataChange('lightRequirement', value)}
            />
            <CarePropertySelector
              type="wateringFrequency"
              value={section.data.wateringFrequency || 'weekly'}
              onChange={(value) => handleDataChange('wateringFrequency', value)}
            />
          </div>
        </div>
      </Card>

      {/* Quick Care Tips */}
      <Card className="p-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Quick Care Tips</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Soil Type</Label>
              <Input
                value={section.data.soilType || ''}
                onChange={(e) => handleDataChange('soilType', e.target.value)}
                placeholder="e.g., Well-draining potting mix"
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Temperature Range</Label>
              <Input
                value={section.data.temperatureRange || ''}
                onChange={(e) => handleDataChange('temperatureRange', e.target.value)}
                placeholder="e.g., 65-75°F (18-24°C)"
                className="h-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Humidity Level</Label>
              <Input
                value={section.data.humidity || ''}
                onChange={(e) => handleDataChange('humidity', e.target.value)}
                placeholder="e.g., 40-60% humidity"
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Fertilizer Schedule</Label>
              <Input
                value={section.data.fertilizer || ''}
                onChange={(e) => handleDataChange('fertilizer', e.target.value)}
                placeholder="e.g., Monthly during growing season"
                className="h-8"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Care Instructions */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Detailed Care Instructions</Label>
        <RichTextEditor
          initialContent={section.data.content || ''}
          onChange={(content) => handleDataChange('content', content)}
          placeholder="Enter detailed care instructions, including watering tips, light requirements, repotting guidance, common issues, and troubleshooting advice..."
        />
      </div>

      {/* Common Problems */}
      <Card className="p-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Common Problems & Solutions</h4>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Problem 1</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={section.data.problem1 || ''}
                  onChange={(e) => handleDataChange('problem1', e.target.value)}
                  placeholder="e.g., Yellow leaves"
                  className="h-8"
                />
                <Input
                  value={section.data.solution1 || ''}
                  onChange={(e) => handleDataChange('solution1', e.target.value)}
                  placeholder="e.g., Reduce watering frequency"
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Problem 2</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={section.data.problem2 || ''}
                  onChange={(e) => handleDataChange('problem2', e.target.value)}
                  placeholder="e.g., Brown leaf tips"
                  className="h-8"
                />
                <Input
                  value={section.data.solution2 || ''}
                  onChange={(e) => handleDataChange('solution2', e.target.value)}
                  placeholder="e.g., Increase humidity"
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Problem 3</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={section.data.problem3 || ''}
                  onChange={(e) => handleDataChange('problem3', e.target.value)}
                  placeholder="e.g., Leggy growth"
                  className="h-8"
                />
                <Input
                  value={section.data.solution3 || ''}
                  onChange={(e) => handleDataChange('solution3', e.target.value)}
                  placeholder="e.g., Provide more light"
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label className="text-xs">Additional Care Notes</Label>
        <Textarea
          value={section.data.additionalNotes || ''}
          onChange={(e) => handleDataChange('additionalNotes', e.target.value)}
          placeholder="Any additional care tips, seasonal advice, or special considerations..."
          rows={3}
          className="resize-none"
        />
      </div>
    </div>
  )
}