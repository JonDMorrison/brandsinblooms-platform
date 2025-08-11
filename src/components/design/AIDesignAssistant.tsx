'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Label } from '@/src/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Separator } from '@/src/components/ui/separator'
import { 
  Wand2, 
  Palette, 
  Type, 
  Layout, 
  Sparkles,
  ChevronRight,
  Loader2,
  Check,
  Copy
} from 'lucide-react'
import { toast } from 'sonner'
import { ThemeSettings } from '@/src/lib/queries/domains/theme'
import {
  generateColorPalette,
  suggestFontPairings,
  recommendLayout,
  generateComplementaryColors,
  generateAnalogousColors,
  generateTriadicColors,
  type ColorPalette,
  type FontPairing,
  type LayoutRecommendation
} from '@/src/lib/ai/design-assistant'

interface AIDesignAssistantProps {
  currentSettings: ThemeSettings
  onApplyColors?: (colors: ThemeSettings['colors']) => void
  onApplyTypography?: (typography: ThemeSettings['typography']) => void
  onApplyLayout?: (layout: ThemeSettings['layout']) => void
}

export function AIDesignAssistant({
  currentSettings,
  onApplyColors,
  onApplyTypography,
  onApplyLayout
}: AIDesignAssistantProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('colors')
  
  // Color generation state
  const [colorMood, setColorMood] = useState<'professional' | 'playful' | 'elegant' | 'bold' | 'minimal'>('professional')
  const [generatedPalette, setGeneratedPalette] = useState<ColorPalette | null>(null)
  
  // Font suggestion state
  const [fontStyle, setFontStyle] = useState<'modern' | 'classic' | 'playful' | 'elegant' | 'technical'>('modern')
  const [suggestedFonts, setSuggestedFonts] = useState<FontPairing[]>([])
  
  // Layout recommendation state
  const [contentType, setContentType] = useState<'blog' | 'ecommerce' | 'portfolio' | 'corporate' | 'landing'>('corporate')
  const [layoutRecommendation, setLayoutRecommendation] = useState<LayoutRecommendation | null>(null)
  
  // Generate color palette
  const handleGenerateColors = async () => {
    setIsGenerating(true)
    try {
      const palette = await generateColorPalette({
        mood: colorMood,
        baseColor: currentSettings.colors.primary
      })
      setGeneratedPalette(palette)
      toast.success('Color palette generated!')
    } catch (error) {
      toast.error('Failed to generate color palette')
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Generate color harmony
  const handleColorHarmony = async (type: 'complementary' | 'analogous' | 'triadic') => {
    setIsGenerating(true)
    try {
      let palette: ColorPalette
      switch (type) {
        case 'complementary':
          palette = generateComplementaryColors(currentSettings.colors.primary)
          break
        case 'analogous':
          palette = generateAnalogousColors(currentSettings.colors.primary)
          break
        case 'triadic':
          palette = generateTriadicColors(currentSettings.colors.primary)
          break
      }
      setGeneratedPalette(palette)
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} palette generated!`)
    } catch (error) {
      toast.error('Failed to generate color harmony')
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Suggest font pairings
  const handleSuggestFonts = async () => {
    setIsGenerating(true)
    try {
      const pairings = await suggestFontPairings({
        style: fontStyle
      })
      setSuggestedFonts(pairings)
      toast.success('Font pairings suggested!')
    } catch (error) {
      toast.error('Failed to suggest fonts')
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Recommend layout
  const handleRecommendLayout = async () => {
    setIsGenerating(true)
    try {
      const recommendation = await recommendLayout({
        contentType,
        hasLogo: !!currentSettings.logo?.url,
        menuItems: 5 // This could be dynamic based on actual menu
      })
      setLayoutRecommendation(recommendation)
      toast.success('Layout recommendation ready!')
    } catch (error) {
      toast.error('Failed to recommend layout')
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Apply generated colors
  const handleApplyColors = () => {
    if (!generatedPalette || !onApplyColors) return
    
    onApplyColors({
      primary: generatedPalette.primary,
      secondary: generatedPalette.secondary,
      accent: generatedPalette.accent,
      background: generatedPalette.background,
      text: generatedPalette.text
    })
    toast.success('Colors applied to your design!')
  }
  
  // Apply font pairing
  const handleApplyFonts = (pairing: FontPairing) => {
    if (!onApplyTypography) return
    
    onApplyTypography({
      ...currentSettings.typography,
      headingFont: pairing.headingFont,
      bodyFont: pairing.bodyFont
    })
    toast.success('Fonts applied to your design!')
  }
  
  // Apply layout
  const handleApplyLayout = () => {
    if (!layoutRecommendation || !onApplyLayout) return
    
    onApplyLayout({
      headerStyle: layoutRecommendation.headerStyle,
      footerStyle: layoutRecommendation.footerStyle,
      menuStyle: layoutRecommendation.menuStyle
    })
    toast.success('Layout applied to your design!')
  }
  
  // Copy color to clipboard
  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color)
    toast.success(`Copied ${color} to clipboard`)
  }
  
  return (
    <Card className="bg-gradient-subtle border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          AI Design Assistant
        </CardTitle>
        <CardDescription>
          Let AI help you create the perfect design for your brand
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="fonts" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Fonts
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Layout
            </TabsTrigger>
          </TabsList>
          
          {/* Color Generation Tab */}
          <TabsContent value="colors" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label>Color Mood</Label>
                <RadioGroup value={colorMood} onValueChange={(value: any) => setColorMood(value)}>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                    {['professional', 'playful', 'elegant', 'bold', 'minimal'].map((mood) => (
                      <div key={mood} className="flex items-center space-x-2">
                        <RadioGroupItem value={mood} id={mood} />
                        <Label htmlFor={mood} className="capitalize cursor-pointer">
                          {mood}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleGenerateColors}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate Palette
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleColorHarmony('complementary')}
                  disabled={isGenerating}
                >
                  Complementary
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleColorHarmony('analogous')}
                  disabled={isGenerating}
                >
                  Analogous
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleColorHarmony('triadic')}
                  disabled={isGenerating}
                >
                  Triadic
                </Button>
              </div>
              
              {generatedPalette && (
                <div className="space-y-3 p-4 bg-white rounded-lg border">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Generated Palette</h4>
                    <Button
                      size="sm"
                      onClick={handleApplyColors}
                      disabled={!onApplyColors}
                    >
                      Apply to Design
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(generatedPalette).filter(([key]) => key !== 'reasoning').map(([name, color]) => (
                      <div key={name} className="space-y-1">
                        <div
                          className="h-16 rounded cursor-pointer group relative"
                          style={{ backgroundColor: color as string }}
                          onClick={() => copyColor(color as string)}
                        >
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="h-4 w-4 text-white drop-shadow" />
                          </div>
                        </div>
                        <p className="text-xs text-center capitalize">{name}</p>
                        <p className="text-xs text-center text-gray-500">{color as string}</p>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-600 italic">
                    {generatedPalette.reasoning}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Font Suggestions Tab */}
          <TabsContent value="fonts" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label>Font Style</Label>
                <Select value={fontStyle} onValueChange={(value: any) => setFontStyle(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="playful">Playful</SelectItem>
                    <SelectItem value="elegant">Elegant</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleSuggestFonts}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Type className="h-4 w-4" />
                )}
                Suggest Font Pairings
              </Button>
              
              {suggestedFonts.length > 0 && (
                <div className="space-y-3">
                  {suggestedFonts.map((pairing, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg border space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div>
                            <p className="text-sm text-gray-600">Heading Font</p>
                            <p className="text-lg font-semibold" style={{ fontFamily: pairing.headingFont }}>
                              {pairing.headingFont}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Body Font</p>
                            <p style={{ fontFamily: pairing.bodyFont }}>
                              {pairing.bodyFont}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleApplyFonts(pairing)}
                          disabled={!onApplyTypography}
                        >
                          Apply
                        </Button>
                      </div>
                      <Separator />
                      <p className="text-sm text-gray-600">{pairing.reasoning}</p>
                      <p className="text-xs text-gray-500">Example: {pairing.example}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Layout Recommendations Tab */}
          <TabsContent value="layout" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label>Website Type</Label>
                <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="portfolio">Portfolio</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="landing">Landing Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleRecommendLayout}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Layout className="h-4 w-4" />
                )}
                Get Layout Recommendation
              </Button>
              
              {layoutRecommendation && (
                <div className="p-4 bg-white rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Recommended Layout</h4>
                    <Button
                      size="sm"
                      onClick={handleApplyLayout}
                      disabled={!onApplyLayout}
                    >
                      Apply Layout
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Header Style</p>
                      <p className="font-medium capitalize">{layoutRecommendation.headerStyle}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Footer Style</p>
                      <p className="font-medium capitalize">{layoutRecommendation.footerStyle}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Menu Style</p>
                      <p className="font-medium capitalize">{layoutRecommendation.menuStyle}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  <p className="text-sm text-gray-600">{layoutRecommendation.reasoning}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}