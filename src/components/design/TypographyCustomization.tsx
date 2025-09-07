'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Label } from '@/src/components/ui/label'
import { Separator } from '@/src/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/src/components/ui/collapsible'
import { Type, ChevronDown, ChevronUp, Monitor, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface TypographyCustomizationProps {
  typography: {
    headingFont: string
    bodyFont: string
    fontSize: string
  }
  colors?: {
    primary: string
    secondary: string
    accent: string
    background: string
    text?: string
  }
  onTypographyChange: (typography: {
    headingFont: string
    bodyFont: string
    fontSize: string
  }) => void
}

const googleFonts = [
  { name: 'Inter', category: 'Sans Serif', description: 'Modern and clean' },
  { name: 'Roboto', category: 'Sans Serif', description: 'Google\'s signature font' },
  { name: 'Open Sans', category: 'Sans Serif', description: 'Friendly and approachable' },
  { name: 'Lato', category: 'Sans Serif', description: 'Elegant and readable' },
  { name: 'Montserrat', category: 'Sans Serif', description: 'Geometric and modern' },
  { name: 'Poppins', category: 'Sans Serif', description: 'Rounded and friendly' },
  { name: 'Source Sans Pro', category: 'Sans Serif', description: 'Professional and versatile' },
  { name: 'Nunito', category: 'Sans Serif', description: 'Rounded and warm' },
  { name: 'Playfair Display', category: 'Serif', description: 'Elegant and sophisticated' },
  { name: 'Merriweather', category: 'Serif', description: 'Highly readable serif' },
  { name: 'Lora', category: 'Serif', description: 'Contemporary serif' },
  { name: 'Crimson Text', category: 'Serif', description: 'Classic book font' },
  { name: 'Fira Code', category: 'Monospace', description: 'Developer-friendly' },
  { name: 'JetBrains Mono', category: 'Monospace', description: 'Modern monospace' }
]


const typographyPresets = [
  {
    name: 'Modern Professional',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    fontSize: 'medium',
    description: 'Clean and modern for business sites'
  },
  {
    name: 'Classic Editorial',
    headingFont: 'Playfair Display',
    bodyFont: 'Lora',
    fontSize: 'medium',
    description: 'Traditional and readable for content'
  },
  {
    name: 'Creative Bold',
    headingFont: 'Montserrat',
    bodyFont: 'Open Sans',
    fontSize: 'medium',
    description: 'Bold and creative for portfolios'
  },
  {
    name: 'Minimal Clean',
    headingFont: 'Lato',
    bodyFont: 'Source Sans Pro',
    fontSize: 'medium',
    description: 'Minimal and clean aesthetic'
  }
]


export default function TypographyCustomization({ typography, colors, onTypographyChange }: TypographyCustomizationProps) {
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [presetsOpen, setPresetsOpen] = useState(true)
  const [customFontsOpen, setCustomFontsOpen] = useState(true)
  
  // Fallback colors if not provided
  const themeColors = colors || {
    primary: '#2563eb',
    secondary: '#3b82f6', 
    accent: '#60a5fa',
    background: '#ffffff',
    text: '#1f2937'
  }
  const textColor = themeColors.text || '#1f2937'

  const handleFontChange = (type: 'headingFont' | 'bodyFont', font: string) => {
    const newTypography = {
      ...typography,
      [type]: font
    }
    onTypographyChange(newTypography)
    
    // Auto-save with toast notification
    setIsAutoSaving(true)
    setTimeout(() => {
      toast.success('Typography saved automatically')
      setIsAutoSaving(false)
    }, 500)
  }


  const handlePresetSelect = (preset: typeof typographyPresets[0]) => {
    onTypographyChange({
      headingFont: preset.headingFont,
      bodyFont: preset.bodyFont,
      fontSize: preset.fontSize
    })
    toast.success(`Applied ${preset.name} font pairing`)
  }



  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-2">
          <Type className="h-5 w-5 text-primary" />
          <CardTitle>Typography Customization</CardTitle>
          {isAutoSaving && (
            <div className="text-xs text-muted-foreground animate-pulse">Saving...</div>
          )}
        </div>
        <CardDescription>
          Customize your fonts to match your brand identity
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* Typography Preview Collapsible Section */}
        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer">Typography Preview</Label>
              {previewOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="rounded-lg border p-6 space-y-6" style={{ backgroundColor: themeColors.background, color: textColor }}>
              {/* Header Preview */}
              <div className="space-y-2">
                <div className="text-xs flex items-center gap-1" style={{ color: textColor + '80' }}>
                  <Monitor className="h-3 w-3" />
                  Header Elements
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded border" style={{ borderColor: themeColors.primary + '20' }}>
                    <h1 className="text-xl font-bold" style={{ color: themeColors.primary, fontFamily: typography.headingFont }}>Your Brand</h1>
                    <div className="flex gap-2">
                      <span className="text-sm cursor-pointer transition-colors hover:opacity-80" style={{ color: themeColors.secondary, fontFamily: typography.bodyFont }}>Home</span>
                      <span className="text-sm cursor-pointer transition-colors hover:opacity-80" style={{ color: themeColors.secondary, fontFamily: typography.bodyFont }}>About</span>
                      <span className="text-sm cursor-pointer transition-colors hover:opacity-80" style={{ color: themeColors.secondary, fontFamily: typography.bodyFont }}>Contact</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography Showcase */}
              <div className="space-y-2">
                <div className="text-xs flex items-center gap-1" style={{ color: textColor + '80' }}>
                  <FileText className="h-3 w-3" />
                  Typography Elements
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold" style={{ color: themeColors.primary, fontFamily: typography.headingFont }}>Your Brand Heading</h2>
                  <p className="text-base leading-relaxed" style={{ color: textColor, fontFamily: typography.bodyFont }}>
                    This is how your body text will appear on your website. It should be easy to read and complement your heading font perfectly.
                  </p>
                  <div className="flex items-center gap-4 text-sm" style={{ color: textColor + '80' }}>
                    <span>Heading: <strong style={{ fontFamily: typography.headingFont }}>{typography.headingFont}</strong></span>
                    <span>Body: <strong style={{ fontFamily: typography.bodyFont }}>{typography.bodyFont}</strong></span>
                    <span>Size: <strong>medium</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Font Pairings Collapsible Section */}
        <Collapsible open={presetsOpen} onOpenChange={setPresetsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer">Font Pairings</Label>
              {presetsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {typographyPresets.map((preset, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95"
                  onClick={() => handlePresetSelect(preset)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm">{preset.name}</h4>
                        <p className="text-xs text-muted-foreground">{preset.description}</p>
                      </div>
                      <div 
                        className="text-lg font-bold"
                        style={{ fontFamily: preset.headingFont }}
                      >
                        Heading Example
                      </div>
                      <div 
                        className="text-sm"
                        style={{ fontFamily: preset.bodyFont }}
                      >
                        This is how the body text will look with this font combination.
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>H: {preset.headingFont}</span>
                        <span>B: {preset.bodyFont}</span>
                        <span>Size: medium</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Custom Fonts Collapsible Section */}
        <Collapsible open={customFontsOpen} onOpenChange={setCustomFontsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer">Custom Fonts</Label>
              {customFontsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Heading Font Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Heading Font</Label>
                <Select 
                  value={typography.headingFont} 
                  onValueChange={(value) => handleFontChange('headingFont', value)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select heading font" />
                  </SelectTrigger>
                  <SelectContent>
                    {googleFonts.map((font) => (
                      <SelectItem key={font.name} value={font.name} className="cursor-pointer hover:bg-muted">
                        <div className="flex items-center justify-between w-full">
                          <span style={{ fontFamily: font.name }} className="text-black hover:text-black">{font.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {font.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="p-3 border rounded-lg" style={{ fontFamily: typography.headingFont }}>
                  <h3 className="text-lg font-bold mb-1">Heading Preview</h3>
                  <p className="text-sm text-muted-foreground">The quick brown fox jumps over the lazy dog</p>
                </div>
              </div>

              {/* Body Font Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Body Font</Label>
                <Select 
                  value={typography.bodyFont} 
                  onValueChange={(value) => handleFontChange('bodyFont', value)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select body font" />
                  </SelectTrigger>
                  <SelectContent>
                    {googleFonts.map((font) => (
                      <SelectItem key={font.name} value={font.name} className="cursor-pointer hover:bg-muted">
                        <div className="flex items-center justify-between w-full">
                          <span style={{ fontFamily: font.name }} className="text-black hover:text-black">{font.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {font.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="p-3 border rounded-lg" style={{ fontFamily: typography.bodyFont }}>
                  <p className="text-base mb-1">Body Text Preview</p>
                  <p className="text-sm text-muted-foreground">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}