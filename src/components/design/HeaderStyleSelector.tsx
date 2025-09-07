'use client'

import { Label } from '@/src/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Layout } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { ThemeSettings } from '@/src/lib/queries/domains/theme'

interface HeaderStyleSelectorProps {
  value: string
  onChange: (style: string, config: HeaderStyleConfig) => void
}

interface HeaderStyleConfig {
  logoPosition: 'left' | 'center' | 'right'
  menuStyle: 'horizontal' | 'sidebar' | 'hamburger' | 'mega'
  headerHeight: 'compact' | 'normal' | 'tall'
  ctaButton: { position: string; variant: string } | null
}

const HEADER_STYLES = [
  { 
    value: 'modern', 
    label: 'Modern', 
    description: 'Clean and minimal design',
    config: {
      logoPosition: 'left' as const,
      menuStyle: 'horizontal' as const,
      headerHeight: 'normal' as const,
      ctaButton: { position: 'right', variant: 'default' }
    }
  },
  { 
    value: 'classic', 
    label: 'Classic', 
    description: 'Traditional navigation layout',
    config: {
      logoPosition: 'center' as const,
      menuStyle: 'horizontal' as const,
      headerHeight: 'tall' as const,
      ctaButton: { position: 'header', variant: 'outline' }
    }
  },
  { 
    value: 'minimal', 
    label: 'Minimal', 
    description: 'Ultra-simple header',
    config: {
      logoPosition: 'left' as const,
      menuStyle: 'hamburger' as const,
      headerHeight: 'compact' as const,
      ctaButton: null
    }
  },
]

export function HeaderStyleSelector({ value, onChange }: HeaderStyleSelectorProps) {
  const handleStyleChange = (styleValue: string) => {
    const selectedStyle = HEADER_STYLES.find(style => style.value === styleValue)
    if (selectedStyle) {
      onChange(styleValue, selectedStyle.config)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layout className="h-4 w-4 text-gray-500" />
        <Label className="text-base font-semibold">Header Style</Label>
      </div>
      <RadioGroup
        value={value}
        onValueChange={handleStyleChange}
      >
        <div className="grid grid-cols-3 gap-4">
          {HEADER_STYLES.map((style) => (
            <label
              key={style.value}
              className={cn(
                "relative flex flex-col gap-2 rounded-lg border-2 p-4 cursor-pointer hover:bg-gradient-primary-50/50 transition-colors",
                value === style.value ? "border-primary bg-gray-100/20" : "border-border"
              )}
            >
              <RadioGroupItem value={style.value} className="sr-only" />
              <span className="font-medium">{style.label}</span>
              <span className="text-xs text-gray-500">{style.description}</span>
              
              {/* Visual preview of the header style */}
              <div className="mt-2 p-2 bg-gray-50 rounded border text-xs">
                <div className={cn(
                  "flex items-center justify-between mb-1",
                  style.config.logoPosition === 'center' && "flex-col gap-1",
                  style.config.headerHeight === 'compact' ? "h-4" : style.config.headerHeight === 'tall' ? "h-6" : "h-5"
                )}>
                  <div className={cn(
                    "bg-gray-300 rounded",
                    style.config.logoPosition === 'center' ? "w-8 h-2" : "w-6 h-2"
                  )} />
                  {style.config.menuStyle === 'horizontal' && (
                    <div className="flex gap-1">
                      <div className="w-3 h-1 bg-gray-300 rounded" />
                      <div className="w-3 h-1 bg-gray-300 rounded" />
                      <div className="w-3 h-1 bg-gray-300 rounded" />
                    </div>
                  )}
                  {style.config.menuStyle === 'hamburger' && (
                    <div className="w-3 h-2 border border-gray-300 rounded" />
                  )}
                  {style.config.ctaButton && (
                    <div className="w-4 h-1.5 bg-primary/40 rounded" />
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      </RadioGroup>
    </div>
  )
}