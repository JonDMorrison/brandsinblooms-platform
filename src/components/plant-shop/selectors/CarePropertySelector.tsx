'use client'

import React from 'react'
import { Label } from '@/src/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'

interface CarePropertySelectorProps {
  type: 'careLevel' | 'lightRequirement' | 'wateringFrequency'
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

const careOptions = {
  careLevel: [
    { value: 'easy', label: '🌱 Easy', description: 'Perfect for beginners' },
    { value: 'medium', label: '🌿 Medium', description: 'Some experience needed' },
    { value: 'challenging', label: '🌳 Challenging', description: 'For experienced gardeners' }
  ],
  lightRequirement: [
    { value: 'low', label: '🌙 Low Light', description: 'Thrives in shade' },
    { value: 'medium', label: '☁️ Medium Light', description: 'Bright indirect light' },
    { value: 'bright', label: '☀️ Bright Light', description: 'Bright, indirect sunlight' },
    { value: 'direct', label: '🌞 Direct Sun', description: 'Full sun exposure' }
  ],
  wateringFrequency: [
    { value: 'weekly', label: '💧 Weekly', description: 'Water once per week' },
    { value: 'bi-weekly', label: '💦 Bi-weekly', description: 'Water every 2 weeks' },
    { value: 'monthly', label: '🌊 Monthly', description: 'Water once per month' },
    { value: 'seasonal', label: '🍂 Seasonal', description: 'Water seasonally' }
  ]
}

const defaultLabels = {
  careLevel: 'Care Level',
  lightRequirement: 'Light Requirement',
  wateringFrequency: 'Watering Frequency'
}

export function CarePropertySelector({ 
  type, 
  value, 
  onChange, 
  label,
  className = '' 
}: CarePropertySelectorProps) {
  const options = careOptions[type]
  const displayLabel = label || defaultLabels[type]

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-xs font-medium">{displayLabel}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder={`Select ${displayLabel.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-gray-500">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}