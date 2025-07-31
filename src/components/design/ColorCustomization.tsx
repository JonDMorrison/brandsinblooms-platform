'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Separator } from '@/src/components/ui/separator'
import { SketchPicker } from 'react-color'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { Palette, Wand2, Copy, Check } from 'lucide-react'

interface ColorCustomizationProps {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  onColorsChange: (colors: any) => void
}

const colorPresets = [
  {
    name: 'Modern Blue',
    colors: { primary: '#2563eb', secondary: '#3b82f6', accent: '#60a5fa', background: '#ffffff' }
  },
  {
    name: 'Forest Green',
    colors: { primary: '#059669', secondary: '#10b981', accent: '#34d399', background: '#ffffff' }
  },
  {
    name: 'Royal Purple',
    colors: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', background: '#ffffff' }
  },
  {
    name: 'Sunset Orange',
    colors: { primary: '#ea580c', secondary: '#f97316', accent: '#fb923c', background: '#ffffff' }
  },
]

export function ColorCustomization({ colors, onColorsChange }: ColorCustomizationProps) {
  const [activeColor, setActiveColor] = useState<keyof typeof colors | null>(null)
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const handleColorChange = (colorKey: keyof typeof colors, color: string) => {
    onColorsChange({
      ...colors,
      [colorKey]: color
    })
  }

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color)
    setCopiedColor(color)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const applyPreset = (preset: typeof colorPresets[0]) => {
    onColorsChange(preset.colors)
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Color Customization</CardTitle>
        </div>
        <CardDescription>
          Customize your brand colors to match your identity
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="colors">Custom Colors</TabsTrigger>
            <TabsTrigger value="presets">Color Presets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="colors" className="space-y-6">
            <div className="grid gap-4">
              {Object.entries(colors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm capitalize">{key} Color</Label>
                  <div className="flex items-center gap-2">
                    <Popover open={activeColor === key} onOpenChange={(open) => setActiveColor(open ? key as keyof typeof colors : null)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[140px] justify-start gap-2"
                        >
                          <div
                            className="h-4 w-4 rounded border"
                            style={{ backgroundColor: value }}
                          />
                          <span className="flex-1 text-left">{value}</span>
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
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(value)}
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

            <Separator />

            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <Button style={{ backgroundColor: colors.primary, color: '#fff' }}>
                    Primary Button
                  </Button>
                  <Button variant="outline" style={{ borderColor: colors.secondary, color: colors.secondary }}>
                    Secondary Button
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge style={{ backgroundColor: colors.accent, color: '#fff' }}>
                    Accent Badge
                  </Badge>
                  <Badge variant="outline" style={{ borderColor: colors.primary, color: colors.primary }}>
                    Outline Badge
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="presets" className="space-y-4">
            <div className="grid gap-3">
              {colorPresets.map((preset) => (
                <Card 
                  key={preset.name}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => applyPreset(preset)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{preset.name}</h4>
                        <div className="flex items-center gap-2">
                          {Object.entries(preset.colors).map(([key, color]) => (
                            <div
                              key={key}
                              className="h-6 w-6 rounded-full border"
                              style={{ backgroundColor: color }}
                              title={`${key}: ${color}`}
                            />
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Wand2 className="h-4 w-4" />
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}