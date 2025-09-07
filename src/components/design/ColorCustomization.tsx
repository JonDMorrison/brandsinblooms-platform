'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Separator } from '@/src/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/src/components/ui/collapsible'
import { SketchPicker } from 'react-color'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { Palette, Copy, Check, Wand2, Monitor, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

interface ColorCustomizationProps {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text?: string
  }
  typography?: {
    headingFont: string
    bodyFont: string
    fontSize: string
  }
  onColorsChange: (colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text?: string
  }) => void
}

const colorPresets = [
  {
    name: 'Modern Blue',
    colors: { primary: '#2563eb', secondary: '#3b82f6', accent: '#60a5fa', background: '#ffffff', text: '#1f2937' }
  },
  {
    name: 'Forest Green',
    colors: { primary: '#059669', secondary: '#10b981', accent: '#34d399', background: '#ffffff', text: '#1f2937' }
  },
  {
    name: 'Royal Purple',
    colors: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', background: '#ffffff', text: '#1f2937' }
  },
  {
    name: 'Sunset Orange',
    colors: { primary: '#ea580c', secondary: '#f97316', accent: '#fb923c', background: '#ffffff', text: '#1f2937' }
  },
  {
    name: 'Emerald Mint',
    colors: { primary: '#065f46', secondary: '#059669', accent: '#6ee7b7', background: '#ffffff', text: '#1f2937' }
  },
  {
    name: 'Rose Gold',
    colors: { primary: '#be185d', secondary: '#e11d48', accent: '#fda4af', background: '#ffffff', text: '#1f2937' }
  },
  {
    name: 'Ocean Depth',
    colors: { primary: '#0c4a6e', secondary: '#0284c7', accent: '#7dd3fc', background: '#ffffff', text: '#1f2937' }
  },
  {
    name: 'Warm Earth',
    colors: { primary: '#92400e', secondary: '#d97706', accent: '#fcd34d', background: '#ffffff', text: '#1f2937' }
  }
]

export function ColorCustomization({ colors, typography, onColorsChange }: ColorCustomizationProps) {
  const [activeColor, setActiveColor] = useState<keyof typeof colors | null>(null)
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [presetsOpen, setPresetsOpen] = useState(true)
  const [customColorsOpen, setCustomColorsOpen] = useState(true)
  
  // Provide fallback for text color
  const textColor = colors.text || '#1f2937'

  const handleColorChange = (colorKey: keyof typeof colors, color: string) => {
    const newColors = {
      ...colors,
      [colorKey]: color
    }
    onColorsChange(newColors)
    
    // Auto-save with toast notification
    setIsAutoSaving(true)
    setTimeout(() => {
      toast.success('Colors saved automatically')
      setIsAutoSaving(false)
    }, 500)
  }

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color)
    setCopiedColor(color)
    setTimeout(() => setCopiedColor(null), 2000)
    toast.success(`Copied ${color} to clipboard`)
  }

  const applyPreset = (preset: typeof colorPresets[0]) => {
    onColorsChange(preset.colors)
    toast.success(`Applied ${preset.name} color preset`)
  }


  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Color Customization</CardTitle>
          {isAutoSaving && (
            <div className="text-xs text-muted-foreground animate-pulse">Saving...</div>
          )}
        </div>
        <CardDescription>
          Customize your brand colors to match your identity
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* Live Preview Collapsible Section */}
        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer">Colors Preview</Label>
              {previewOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="rounded-lg border p-6 space-y-6" style={{ backgroundColor: colors.background, color: textColor }}>
              {/* Header Preview */}
              <div className="space-y-2">
                <div className="text-xs flex items-center gap-1" style={{ color: textColor + '80' }}>
                  <Monitor className="h-3 w-3" />
                  Header Elements
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded border" style={{ borderColor: colors.primary + '20' }}>
                    <h1 className="text-xl font-bold" style={{ color: colors.primary, fontFamily: typography?.headingFont || 'Inter' }}>Your Brand</h1>
                    <div className="flex gap-2">
                      <span className="text-sm cursor-pointer transition-colors hover:opacity-80" style={{ color: colors.secondary, fontFamily: typography?.bodyFont || 'Inter' }}>Home</span>
                      <span className="text-sm cursor-pointer transition-colors hover:opacity-80" style={{ color: colors.secondary, fontFamily: typography?.bodyFont || 'Inter' }}>About</span>
                      <span className="text-sm cursor-pointer transition-colors hover:opacity-80" style={{ color: colors.secondary, fontFamily: typography?.bodyFont || 'Inter' }}>Contact</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons Preview */}
              <div className="space-y-2">
                <div className="text-xs" style={{ color: textColor + '80' }}>Button Elements</div>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    className="px-3 py-1.5 text-sm font-medium rounded-md transition-all hover:opacity-90 hover:shadow-sm"
                    style={{ 
                      backgroundColor: colors.primary, 
                      color: '#fff',
                      border: 'none'
                    }}
                  >
                    Primary Button
                  </button>
                  <button 
                    className="px-3 py-1.5 text-sm font-medium rounded-md border transition-all hover:opacity-80"
                    style={{ 
                      borderColor: colors.secondary, 
                      color: colors.secondary,
                      backgroundColor: 'transparent'
                    }}
                  >
                    Secondary Button
                  </button>
                  <button 
                    className="px-3 py-1.5 text-sm font-medium rounded-md transition-all hover:opacity-80"
                    style={{ 
                      color: colors.accent,
                      backgroundColor: 'transparent',
                      border: 'none'
                    }}
                  >
                    Accent Button
                  </button>
                </div>
              </div>

              {/* Text and Content Preview */}
              <div className="space-y-2">
                <div className="text-xs flex items-center gap-1" style={{ color: textColor + '80' }}>
                  <FileText className="h-3 w-3" />
                  Text Content
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold" style={{ color: colors.primary, fontFamily: typography?.headingFont || 'Inter' }}>Section Heading</h2>
                  <p className="text-sm" style={{ color: textColor, fontFamily: typography?.bodyFont || 'Inter' }}>This is how your regular text content will appear with the selected color scheme.</p>
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ backgroundColor: colors.accent, color: '#fff' }}
                    >
                      Accent Badge
                    </span>
                    <span 
                      className="px-2 py-1 text-xs rounded-full border"
                      style={{ borderColor: colors.primary, color: colors.primary, backgroundColor: 'transparent' }}
                    >
                      Primary Badge
                    </span>
                    <span 
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ backgroundColor: colors.secondary + '20', color: colors.secondary }}
                    >
                      Secondary Badge
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Color Presets Collapsible Section */}
        <Collapsible open={presetsOpen} onOpenChange={setPresetsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer">Color Presets</Label>
              {presetsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {colorPresets.map((preset) => (
                <Card 
                  key={preset.name}
                  className="cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95"
                  onClick={() => applyPreset(preset)}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-center">{preset.name}</h4>
                      <div className="flex justify-center gap-1">
                        {Object.entries(preset.colors).filter(([key]) => key !== 'background' && key !== 'text').map(([key, color]) => (
                          <div
                            key={key}
                            className="h-4 w-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                            title={`${key}: ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Custom Colors Collapsible Section */}
        <Collapsible open={customColorsOpen} onOpenChange={setCustomColorsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer">Custom Colors</Label>
              {customColorsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-3">
            <div className="grid gap-4">
              {Object.entries(colors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm capitalize font-medium">{key} Color</Label>
                  <div className="flex items-center gap-2">
                    <Popover open={activeColor === key} onOpenChange={(open) => setActiveColor(open ? key as keyof typeof colors : null)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[140px] justify-start gap-2 hover:shadow-sm"
                        >
                          <div
                            className="h-4 w-4 rounded border shadow-sm"
                            style={{ backgroundColor: value }}
                          />
                          <span className="flex-1 text-left font-mono text-xs">{value}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <SketchPicker
                          color={value}
                          onChange={(color) => handleColorChange(key as keyof typeof colors, color.hex)}
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => handleColorChange(key as keyof typeof colors, e.target.value)}
                      className="flex-1 font-mono text-sm"
                      placeholder="#000000"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(value)}
                      className="hover:bg-gray-100"
                    >
                      {copiedColor === value ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}