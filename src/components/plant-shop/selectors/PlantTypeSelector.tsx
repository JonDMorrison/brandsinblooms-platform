'use client'

import React from 'react'
import { Label } from '@/src/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'

interface PlantTypeSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

const plantTypeOptions = [
  { value: 'houseplant', label: '🏠 Houseplant', description: 'Indoor plants' },
  { value: 'outdoor', label: '🌻 Outdoor Plant', description: 'Garden and outdoor plants' },
  { value: 'succulent', label: '🌵 Succulent', description: 'Water-storing plants' },
  { value: 'herb', label: '🌿 Herb', description: 'Culinary and medicinal herbs' },
  { value: 'tree', label: '🌳 Tree', description: 'Trees and large woody plants' },
  { value: 'shrub', label: '🌲 Shrub', description: 'Bushes and small woody plants' }
]

export function PlantTypeSelector({ 
  value, 
  onChange, 
  label = 'Plant Type',
  className = '' 
}: PlantTypeSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-xs font-medium">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Select plant type" />
        </SelectTrigger>
        <SelectContent>
          {plantTypeOptions.map((option) => (
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