'use client'

import React from 'react'
import { Label } from '@/src/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'

interface SeasonSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

const seasonOptions = [
  { value: 'spring', label: '🌸 Spring', description: 'March - May' },
  { value: 'summer', label: '☀️ Summer', description: 'June - August' },
  { value: 'fall', label: '🍂 Fall', description: 'September - November' },
  { value: 'winter', label: '❄️ Winter', description: 'December - February' }
]

export function SeasonSelector({ 
  value, 
  onChange, 
  label = 'Season',
  className = '' 
}: SeasonSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-xs font-medium">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Select season" />
        </SelectTrigger>
        <SelectContent>
          {seasonOptions.map((option) => (
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