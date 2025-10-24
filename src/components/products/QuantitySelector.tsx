'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/src/lib/utils'

interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  className?: string
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className
}: QuantitySelectorProps) {
  const [inputValue, setInputValue] = useState(value.toString())

  const handleDecrement = () => {
    const newValue = Math.max(min, value - 1)
    onChange(newValue)
    setInputValue(newValue.toString())
  }

  const handleIncrement = () => {
    const newValue = Math.min(max, value + 1)
    onChange(newValue)
    setInputValue(newValue.toString())
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Only update parent if it's a valid number
    const numValue = parseInt(newValue, 10)
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue)
    }
  }

  const handleInputBlur = () => {
    // Reset to valid value if input is invalid
    const numValue = parseInt(inputValue, 10)
    if (isNaN(numValue) || numValue < min || numValue > max) {
      setInputValue(value.toString())
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>

      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        disabled={disabled}
        className="h-8 w-16 text-center"
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
}
