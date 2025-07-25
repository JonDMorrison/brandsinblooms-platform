import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Type, Wand2 } from 'lucide-react'

interface TypographyCustomizationProps {
  typography: {
    headingFont: string
    bodyFont: string
    fontSize: string
  }
  onTypographyChange: (typography: any) => void
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

const fontSizes = [
  { value: 'small', label: 'Small', description: '14px base size' },
  { value: 'medium', label: 'Medium', description: '16px base size' },
  { value: 'large', label: 'Large', description: '18px base size' },
  { value: 'extra-large', label: 'Extra Large', description: '20px base size' }
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
    fontSize: 'large',
    description: 'Bold and creative for portfolios'
  },
  {
    name: 'Minimal Clean',
    headingFont: 'Lato',
    bodyFont: 'Source Sans Pro',
    fontSize: 'medium',
    description: 'Minimal and clean aesthetic'
  },
  {
    name: 'Friendly Approachable',
    headingFont: 'Poppins',
    bodyFont: 'Nunito',
    fontSize: 'medium',
    description: 'Warm and approachable feel'
  }
]

const aiSuggestions = [
  {
    name: 'Tech Startup',
    headingFont: 'Inter',
    bodyFont: 'Roboto',
    fontSize: 'medium',
    description: 'Perfect for technology companies'
  },
  {
    name: 'Creative Agency',
    headingFont: 'Montserrat',
    bodyFont: 'Open Sans',
    fontSize: 'large',
    description: 'Ideal for creative professionals'
  },
  {
    name: 'Professional Services',
    headingFont: 'Lato',
    bodyFont: 'Source Sans Pro',
    fontSize: 'medium',
    description: 'Great for consulting and services'
  }
]

export default function TypographyCustomization({ typography, onTypographyChange }: TypographyCustomizationProps) {

  const handleFontChange = (type: 'headingFont' | 'bodyFont', font: string) => {
    onTypographyChange({
      ...typography,
      [type]: font
    })
  }

  const handleFontSizeChange = (fontSize: string) => {
    onTypographyChange({
      ...typography,
      fontSize
    })
  }

  const handlePresetSelect = (preset: any) => {
    onTypographyChange({
      headingFont: preset.headingFont,
      bodyFont: preset.bodyFont,
      fontSize: preset.fontSize
    })
  }

  const generateAITypography = () => {
    // Mock AI typography generation
    const randomSuggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)]
    onTypographyChange({
      headingFont: randomSuggestion.headingFont,
      bodyFont: randomSuggestion.bodyFont,
      fontSize: randomSuggestion.fontSize
    })
  }

  const FontPreview = ({ fontName, isHeading = false }: { fontName: string, isHeading?: boolean }) => (
    <div 
      className={`p-4 border rounded-lg ${isHeading ? 'text-xl font-bold' : 'text-base'}`}
      style={{ fontFamily: fontName }}
    >
      {isHeading ? (
        <>
          <h3 className="mb-2">Heading Preview</h3>
          <p className="text-sm font-normal text-gray-600">The quick brown fox jumps over the lazy dog</p>
        </>
      ) : (
        <>
          <p className="mb-2">Body Text Preview</p>
          <p className="text-sm text-gray-600">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Typography Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typography Preview
          </CardTitle>
          <CardDescription>
            See how your font choices look together
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              className="text-3xl font-bold"
              style={{ fontFamily: typography.headingFont }}
            >
              Your Brand Heading
            </div>
            <div 
              className="text-lg leading-relaxed"
              style={{ fontFamily: typography.bodyFont }}
            >
              This is how your body text will appear on your website. 
              It should be easy to read and complement your heading font perfectly.
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Heading: <strong>{typography.headingFont}</strong></span>
              <span>Body: <strong>{typography.bodyFont}</strong></span>
              <span>Size: <strong>{typography.fontSize}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="custom" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="custom">Custom Fonts</TabsTrigger>
          <TabsTrigger value="presets">Font Pairs</TabsTrigger>
          <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
        </TabsList>

        {/* Custom Font Selection Tab */}
        <TabsContent value="custom" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Heading Font Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Heading Font</CardTitle>
                <CardDescription>
                  Choose a font for headings and titles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select 
                  value={typography.headingFont} 
                  onValueChange={(value) => handleFontChange('headingFont', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select heading font" />
                  </SelectTrigger>
                  <SelectContent>
                    {googleFonts.map((font) => (
                      <SelectItem key={font.name} value={font.name}>
                        <div className="flex items-center justify-between w-full">
                          <span style={{ fontFamily: font.name }}>{font.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {font.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FontPreview fontName={typography.headingFont} isHeading={true} />
              </CardContent>
            </Card>

            {/* Body Font Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Body Font</CardTitle>
                <CardDescription>
                  Choose a font for body text and paragraphs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select 
                  value={typography.bodyFont} 
                  onValueChange={(value) => handleFontChange('bodyFont', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select body font" />
                  </SelectTrigger>
                  <SelectContent>
                    {googleFonts.map((font) => (
                      <SelectItem key={font.name} value={font.name}>
                        <div className="flex items-center justify-between w-full">
                          <span style={{ fontFamily: font.name }}>{font.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {font.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FontPreview fontName={typography.bodyFont} />
              </CardContent>
            </Card>
          </div>

          {/* Font Size Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Font Size Scale</CardTitle>
              <CardDescription>
                Choose the base font size for your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={typography.fontSize} 
                onValueChange={handleFontSizeChange}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {fontSizes.map((size) => (
                  <div key={size.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={size.value} id={size.value} />
                    <Label htmlFor={size.value} className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">{size.label}</div>
                        <div className="text-sm text-gray-600">{size.description}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Font Pairs Tab */}
        <TabsContent value="presets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Curated Font Pairs</CardTitle>
              <CardDescription>
                Professional font combinations that work well together
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {typographyPresets.map((preset, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold">{preset.name}</h3>
                        <p className="text-sm text-gray-600">{preset.description}</p>
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
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>H: {preset.headingFont}</span>
                        <span>B: {preset.bodyFont}</span>
                        <span>Size: {preset.fontSize}</span>
                      </div>
                    </div>
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
                AI Typography Suggestions
              </CardTitle>
              <CardDescription>
                Get personalized font recommendations based on your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <Button 
                  onClick={generateAITypography}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Generate Typography
                </Button>
                <Badge variant="secondary">AI Powered</Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4">
                {aiSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                    onClick={() => handlePresetSelect(suggestion)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{suggestion.name}</h3>
                        <Badge variant="outline">AI Suggested</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{suggestion.description}</p>
                      <div 
                        className="text-lg font-bold"
                        style={{ fontFamily: suggestion.headingFont }}
                      >
                        Sample Heading
                      </div>
                      <div 
                        className="text-sm"
                        style={{ fontFamily: suggestion.bodyFont }}
                      >
                        Sample body text to demonstrate the font pairing.
                      </div>
                    </div>
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