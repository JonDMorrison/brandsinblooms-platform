import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Label } from '@/src/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Switch } from '@/src/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Layout, Menu, Sidebar } from 'lucide-react'

interface LayoutCustomizationProps {
  layout: {
    headerStyle: string
    footerStyle: string
    menuStyle: string
  }
  onLayoutChange: (layout: any) => void
  section: 'header' | 'footer' | 'menu' | 'all'
}

const headerStyles = [
  {
    id: 'modern',
    name: 'Modern Header',
    description: 'Clean header with centered logo and horizontal navigation',
    preview: '/api/placeholder/300/80'
  },
  {
    id: 'classic',
    name: 'Classic Header',
    description: 'Traditional header with left logo and right navigation',
    preview: '/api/placeholder/300/80'
  },
  {
    id: 'minimal',
    name: 'Minimal Header',
    description: 'Ultra-clean header with minimal elements',
    preview: '/api/placeholder/300/80'
  },
  {
    id: 'full-width',
    name: 'Full Width Header',
    description: 'Header that spans the full width with background',
    preview: '/api/placeholder/300/80'
  }
]

const footerStyles = [
  {
    id: 'minimal',
    name: 'Minimal Footer',
    description: 'Simple footer with copyright and basic links',
    preview: '/api/placeholder/300/60'
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive Footer',
    description: 'Full footer with multiple columns and social links',
    preview: '/api/placeholder/300/100'
  },
  {
    id: 'centered',
    name: 'Centered Footer',
    description: 'Centered footer with logo and social icons',
    preview: '/api/placeholder/300/80'
  },
  {
    id: 'newsletter',
    name: 'Newsletter Footer',
    description: 'Footer with newsletter signup and links',
    preview: '/api/placeholder/300/90'
  }
]

const menuStyles = [
  {
    id: 'horizontal',
    name: 'Horizontal Menu',
    description: 'Traditional horizontal navigation bar',
    icon: Menu
  },
  {
    id: 'sidebar',
    name: 'Sidebar Menu',
    description: 'Collapsible sidebar navigation',
    icon: Sidebar
  },
  {
    id: 'hamburger',
    name: 'Hamburger Menu',
    description: 'Mobile-first hamburger menu',
    icon: Menu
  },
  {
    id: 'mega',
    name: 'Mega Menu',
    description: 'Dropdown mega menu with categories',
    icon: Layout
  }
]

const layoutPresets = [
  {
    name: 'Corporate Professional',
    headerStyle: 'classic',
    footerStyle: 'comprehensive',
    menuStyle: 'horizontal',
    description: 'Perfect for business and corporate websites'
  },
  {
    name: 'Modern Minimalist',
    headerStyle: 'minimal',
    footerStyle: 'minimal',
    menuStyle: 'horizontal',
    description: 'Clean and modern for portfolios and agencies'
  },
  {
    name: 'Creative Agency',
    headerStyle: 'modern',
    footerStyle: 'centered',
    menuStyle: 'sidebar',
    description: 'Bold and creative for design agencies'
  },
  {
    name: 'E-commerce Store',
    headerStyle: 'full-width',
    footerStyle: 'newsletter',
    menuStyle: 'mega',
    description: 'Optimized for online stores and marketplaces'
  }
]

export default function LayoutCustomization({ layout, onLayoutChange, section }: LayoutCustomizationProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleLayoutChange = (key: string, value: string) => {
    onLayoutChange({
      ...layout,
      [key]: value
    })
  }

  const handlePresetSelect = (preset: any) => {
    onLayoutChange({
      headerStyle: preset.headerStyle,
      footerStyle: preset.footerStyle,
      menuStyle: preset.menuStyle
    })
  }

  const LayoutPreview = ({ title, options, selectedValue, onChange, previewKey }: any) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>
          Choose the {title.toLowerCase()} style for your website
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedValue} onValueChange={(value) => onChange(previewKey, value)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {options.map((option: any) => (
              <div key={option.id} className="flex items-start space-x-3">
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  <div className="space-y-2">
                    <div className="font-medium">{option.name}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                    {option.preview && (
                      <div className="border rounded-lg overflow-hidden">
                        <div 
                          className="bg-gray-100 h-16 flex items-center justify-center text-sm text-gray-600"
                        >
                          {option.name} Preview
                        </div>
                      </div>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )

  if (section === 'header' || section === 'all') {
    return (
      <div className="space-y-6">
        {/* Layout Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Layout Preview
            </CardTitle>
            <CardDescription>
              See how your layout choices work together
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Preview Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    Desktop
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                  >
                    Tablet
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    Mobile
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showAdvanced}
                    onCheckedChange={setShowAdvanced}
                  />
                  <Label>Advanced Options</Label>
                </div>
              </div>

              {/* Layout Preview Frame */}
              <div className="border rounded-lg overflow-hidden bg-white">
                <div className="space-y-0">
                  {/* Header Preview */}
                  <div className="h-16 bg-gray-50 border-b flex items-center justify-center text-sm text-gray-600">
                    {layout.headerStyle} Header Style
                  </div>
                  
                  {/* Content Area */}
                  <div className="flex">
                    {layout.menuStyle === 'sidebar' && (
                      <div className="w-48 bg-gray-100 h-32 flex items-center justify-center text-sm text-gray-600">
                        Sidebar
                      </div>
                    )}
                    <div className="flex-1 h-32 flex items-center justify-center text-sm text-gray-600">
                      Main Content Area
                    </div>
                  </div>
                  
                  {/* Footer Preview */}
                  <div className="h-16 bg-gray-50 border-t flex items-center justify-center text-sm text-gray-600">
                    {layout.footerStyle} Footer Style
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Layout Presets</TabsTrigger>
            <TabsTrigger value="custom">Custom Layout</TabsTrigger>
          </TabsList>

          {/* Layout Presets Tab */}
          <TabsContent value="presets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Complete Layout Presets</CardTitle>
                <CardDescription>
                  Pre-designed layout combinations for different website types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {layoutPresets.map((preset, index) => (
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
                        
                        {/* Mini Layout Preview */}
                        <div className="border rounded overflow-hidden bg-white">
                          <div className="h-4 bg-gray-100 border-b"></div>
                          <div className="h-8 bg-white"></div>
                          <div className="h-4 bg-gray-100 border-t"></div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {preset.headerStyle} header
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {preset.footerStyle} footer
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {preset.menuStyle} menu
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Layout Tab */}
          <TabsContent value="custom" className="space-y-6">
            <div className="space-y-6">
              {/* Header Styles */}
              <LayoutPreview
                title="Header Styles"
                options={headerStyles}
                selectedValue={layout.headerStyle}
                onChange={handleLayoutChange}
                previewKey="headerStyle"
              />

              {/* Menu Styles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Navigation Menu</CardTitle>
                  <CardDescription>
                    Choose how users will navigate your website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={layout.menuStyle} 
                    onValueChange={(value) => handleLayoutChange('menuStyle', value)}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {menuStyles.map((menu) => (
                        <div key={menu.id} className="flex items-start space-x-3">
                          <RadioGroupItem value={menu.id} id={menu.id} className="mt-1" />
                          <Label htmlFor={menu.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <menu.icon className="h-5 w-5 text-gray-600" />
                              <div>
                                <div className="font-medium">{menu.name}</div>
                                <div className="text-sm text-gray-600">{menu.description}</div>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Footer Styles */}
              <LayoutPreview
                title="Footer Styles"
                options={footerStyles}
                selectedValue={layout.footerStyle}
                onChange={handleLayoutChange}
                previewKey="footerStyle"
              />

              {/* Advanced Options */}
              {showAdvanced && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Advanced Layout Options</CardTitle>
                    <CardDescription>
                      Fine-tune your layout with advanced settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Container Width</Label>
                        <Select defaultValue="max-width">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full-width">Full Width</SelectItem>
                            <SelectItem value="max-width">Max Width (1200px)</SelectItem>
                            <SelectItem value="narrow">Narrow (960px)</SelectItem>
                            <SelectItem value="wide">Wide (1400px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Content Spacing</Label>
                        <Select defaultValue="normal">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tight">Tight</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="loose">Loose</SelectItem>
                            <SelectItem value="extra-loose">Extra Loose</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Sticky Header</Label>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Fixed Sidebar</Label>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Breadcrumbs</Label>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Back to Top Button</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return <div>Layout customization for {section}</div>
}