'use client'

import React from 'react'
import { Label } from '@/src/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'

interface ColumnsSelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
}

export function ColumnsSelector({
  value,
  onChange,
  min = 1,
  max = 6,
  label = 'Columns'
}: ColumnsSelectorProps) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      <RadioGroup
        value={value.toString()}
        onValueChange={(val) => onChange(parseInt(val, 10))}
        className="flex gap-2"
      >
        {options.map((col) => (
          <div key={col} className="flex items-center">
            <RadioGroupItem
              value={col.toString()}
              id={`columns-${col}`}
              className="sr-only"
            />
            <Label
              htmlFor={`columns-${col}`}
              className={`
                cursor-pointer px-3 py-1.5 text-xs rounded-md border transition-colors
                ${value === col 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background border-input hover:bg-accent'
                }
              `}
            >
              {col}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}