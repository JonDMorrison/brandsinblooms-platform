"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { SketchPicker } from 'react-color'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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

const predefinedPalettes = [
  {
    name: 'Purple Dreams',
    colors: { primary: '#8B5CF6', secondary: '#06B6D4', accent: '#F59E0B', background: '#FFFFFF' }
  },
  {
    name: 'Ocean Breeze',
    colors: { primary: '#0EA5E9', secondary: '#10B981', accent: '#F97316', background: '#F8FAFC' }
  },
  {
    name: 'Sunset Glow',
    colors: { primary: '#F59E0B', secondary: '#EF4444', accent: '#8B5CF6', background: '#FEF7ED' }
  },
  {
    name: 'Forest Green',
    colors: { primary: '#059669', secondary: '#0D9488', accent: '#F59E0B', background: '#F0FDF4' }
  },
  {
    name: 'Rose Gold',
    colors: { primary: '#EC4899', secondary: '#F97316', accent: '#8B5CF6', background: '#FDF2F8' }
  },
  {
    name: 'Midnight Blue',
    colors: { primary: '#1E40AF', secondary: '#7C3AED', accent: '#06B6D4', background: '#F1F5F9' }
  }
]

const aiSuggestedPalettes = [
  {
    name: 'Modern Tech',
    colors: { primary: '#6366F1', secondary: '#14B8A6', accent: '#F59E0B', background: '#FAFAFA' },
    description: 'Perfect for technology and innovation brands'
  },
  {
    name: 'Organic Natural',
    colors: { primary: '#84CC16', secondary: '#22C55E', accent: '#F97316', background: '#FFFBEB' },
    description: 'Great for eco-friendly and organic brands'
  },
  {
    name: 'Luxury Premium',
    colors: { primary: '#7C2D12', secondary: '#B91C1C', accent: '#F59E0B', background: '#FEF2F2' },
    description: 'Ideal for luxury and premium brands'
  }
]

export default function ColorCustomization({ colors, onColorsChange }: ColorCustomizationProps) {
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null)
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const handleColorChange = (colorType: string, color: string | { hex: string }) => {
    const hexColor = typeof color === 'string' ? color : color.hex
    onColorsChange({
      ...colors,
      [colorType]: hexColor
    })
  }

  const handlePaletteSelect = (palette: any) => {
    onColorsChange(palette.colors)
  }

  const copyColorToClipboard = (color: string) => {
    navigator.clipboard.writeText(color)
    setCopiedColor(color)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const generateAIPalette = () => {
    // Mock AI palette generation - in real app this would call an AI service
    const randomPalette = aiSuggestedPalettes[Math.floor(Math.random() * aiSuggestedPalettes.length)]
    onColorsChange(randomPalette.colors)
  }

  const ColorPicker = ({ label, color, colorType }: { label: string, color: string, colorType: string }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <Popover 
          open={activeColorPicker === colorType} 
          onOpenChange={(open) => setActiveColorPicker(open ? colorType : null)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-12 h-12 p-0 border-2"
              style={{ backgroundColor: color }}
            >
              <span className="sr-only">Pick {label} color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" side="right">
            <SketchPicker
              color={color}
              onChange={(color) => handleColorChange(colorType, color)}
              disableAlpha={true}
            />
          </PopoverContent>
        </Popover>
        <div className="flex-1">
          <Input
            value={color}
            onChange={(e) => handleColorChange(colorType, e.target.value)}
            className="font-mono text-sm"
            placeholder="#000000"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyColorToClipboard(color)}
          className="p-2"
        >
          {copiedColor === color ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Current Color Palette Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Current Color Palette
          </CardTitle>
          <CardDescription>
            Your active color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(colors).map(([key, color]) => (
              <div key={key} className="text-center space-y-2">
                <div
                  className="w-full h-16 rounded-lg border-2 border-gray-200"
                  style={{ backgroundColor: color }}
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium capitalize">{key}</p>
                  <p className="text-xs font-mono text-gray-500">{color}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="custom" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="custom">Custom Colors</TabsTrigger>
          <TabsTrigger value="presets">Preset Palettes</TabsTrigger>
          <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
        </TabsList>

        {/* Custom Color Picker Tab */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Color Selection</CardTitle>
              <CardDescription>
                Fine-tune each color in your palette
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ColorPicker label="Primary Color" color={colors.primary} colorType="primary" />
              <ColorPicker label="Secondary Color" color={colors.secondary} colorType="secondary" />
              <ColorPicker label="Accent Color" color={colors.accent} colorType="accent" />
              <ColorPicker label="Background Color" color={colors.background} colorType="background" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preset Palettes Tab */}
        <TabsContent value="presets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preset Color Palettes</CardTitle>
              <CardDescription>
                Choose from our curated color combinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predefinedPalettes.map((palette, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                    onClick={() => handlePaletteSelect(palette)}
                  >
                    <div className="flex gap-2 mb-3">
                      {Object.values(palette.colors).map((color, colorIndex) => (
                        <div
                          key={colorIndex}
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <h3 className="font-medium text-sm">{palette.name}</h3>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Suggestions Tab */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-600" />
                AI Color Suggestions
              </CardTitle>
              <CardDescription>
                Let AI suggest perfect color combinations for your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <Button 
                  onClick={generateAIPalette}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Generate New Palette
                </Button>
                <Badge variant="secondary">Beta Feature</Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4">
                {aiSuggestedPalettes.map((palette, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                    onClick={() => handlePaletteSelect(palette)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{palette.name}</h3>
                      <div className="flex gap-1">
                        {Object.values(palette.colors).map((color, colorIndex) => (
                          <div
                            key={colorIndex}
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{palette.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}