'use client'

import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Slider } from '@/src/components/ui/slider'
import { useState, useEffect } from 'react'

interface LogoSizeSliderProps {
  value: number // Size in pixels
  onChange: (size: number) => void
}

const PRESET_SIZES = [
  { label: 'Small', value: 120 },
  { label: 'Medium', value: 160 },
  { label: 'Large', value: 200 },
  { label: 'XL', value: 240 },
]

export function LogoSizeSlider({ value, onChange }: LogoSizeSliderProps) {
  const [sliderValue, setSliderValue] = useState([value])

  useEffect(() => {
    setSliderValue([value])
  }, [value])

  const handleSliderChange = (newValue: number[]) => {
    setSliderValue(newValue)
    onChange(newValue[0])
  }

  const handlePresetClick = (presetValue: number) => {
    setSliderValue([presetValue])
    onChange(presetValue)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Logo Size</Label>
        <span className="text-sm text-gray-500">{sliderValue[0]}px</span>
      </div>
      
      {/* Slider */}
      <div className="px-2">
        <Slider
          value={sliderValue}
          onValueChange={handleSliderChange}
          max={320}
          min={80}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>80px</span>
          <span>320px</span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex gap-2">
        {PRESET_SIZES.map((preset) => (
          <Button
            key={preset.label}
            variant={sliderValue[0] === preset.value ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick(preset.value)}
            className="flex-1"
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  )
}