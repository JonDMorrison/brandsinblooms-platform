'use client'

import { Label } from '@/src/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Switch } from '@/src/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Slider } from '@/src/components/ui/slider'
import { Card, CardContent } from '@/src/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/src/components/ui/collapsible'
import { ThemeSettings, NavigationItem } from '@/src/lib/queries/domains/theme'
import { 
  Layout, 
  Plus,
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/src/lib/utils'

interface HeaderCustomizationProps {
  value: ThemeSettings
  colors?: {
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
  onChange: (settings: ThemeSettings) => void
}

const HEADER_STYLES = [
  { 
    value: 'modern', 
    label: 'Modern', 
    description: 'Logo left, horizontal menu, CTA right',
    preview: 'modern'
  },
  { 
    value: 'classic', 
    label: 'Classic', 
    description: 'Centered logo, menu below',
    preview: 'classic'
  },
  { 
    value: 'minimal', 
    label: 'Minimal', 
    description: 'Simple logo left, hamburger right',
    preview: 'minimal'
  },
]

const NAVIGATION_OPTIONS = [
  { value: 'home', label: 'Home', required: false },
  { value: 'about', label: 'About', required: false },
  { value: 'contact', label: 'Contact', required: false },
  { value: 'blog', label: 'Blog', required: false },
]

export function HeaderCustomization({ value, colors, typography, onChange }: HeaderCustomizationProps) {
  const [previewOpen, setPreviewOpen] = useState(true)
  const [logoOpen, setLogoOpen] = useState(true)
  const [headerStyleOpen, setHeaderStyleOpen] = useState(true)
  const [navigationOpen, setNavigationOpen] = useState(true)
  const [ctaOpen, setCtaOpen] = useState(true)
  
  const [selectedNavItems, setSelectedNavItems] = useState<string[]>(['home', 'about', 'contact'])
  const [customLink, setCustomLink] = useState({ label: '', href: '' })
  const [logoSize, setLogoSize] = useState([100]) // Default logo size

  const handleLayoutChange = (key: string, val: any) => {
    onChange({
      ...value,
      layout: {
        ...value.layout,
        [key]: val
      }
    })
  }

  const handleLogoChange = (key: string, val: any) => {
    onChange({
      ...value,
      logo: {
        ...value.logo,
        [key]: val
      }
    })
  }

  const toggleNavItem = (item: string) => {
    setSelectedNavItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    )
  }

  const addCustomLink = () => {
    if (!customLink.label || !customLink.href) return
    // Handle custom link addition
    setCustomLink({ label: '', href: '' })
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="px-0 space-y-6">
        {/* Header Preview Section */}
        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Header Preview
              </Label>
              {previewOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div 
              className="rounded-lg border p-4 space-y-4" 
              style={{ 
                backgroundColor: colors?.background || '#ffffff', 
                color: colors?.text || '#1f2937',
                fontFamily: typography?.bodyFont || 'Inter'
              }}
            >
              {/* Header preview based on selected style */}
              <div className="border rounded p-3">
                {value.layout?.headerStyle === 'modern' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="font-bold"
                        style={{ 
                          color: colors?.primary || '#2563eb',
                          fontFamily: typography?.headingFont || 'Inter'
                        }}
                      >
                        Your Brand
                      </div>
                      <nav className="flex gap-4 text-sm">
                        <span>Products</span>
                        <span>Search</span>
                        {selectedNavItems.includes('home') && <span>Home</span>}
                        {selectedNavItems.includes('about') && <span>About</span>}
                        {selectedNavItems.includes('contact') && <span>Contact</span>}
                        {selectedNavItems.includes('blog') && <span>Blog</span>}
                      </nav>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Cart</span>
                      <button 
                        className="px-3 py-1 text-sm rounded"
                        style={{ backgroundColor: colors?.primary || '#2563eb', color: '#fff' }}
                      >
                        CTA Button
                      </button>
                    </div>
                  </div>
                )}
                
                {value.layout?.headerStyle === 'classic' && (
                  <div className="text-center space-y-2">
                    <div 
                      className="font-bold text-lg"
                      style={{ 
                        color: colors?.primary || '#2563eb',
                        fontFamily: typography?.headingFont || 'Inter'
                      }}
                    >
                      Your Brand
                    </div>
                    <nav className="flex justify-center gap-4 text-sm">
                      <span>Products</span>
                      <span>Search</span>
                      {selectedNavItems.includes('home') && <span>Home</span>}
                      {selectedNavItems.includes('about') && <span>About</span>}
                      {selectedNavItems.includes('contact') && <span>Contact</span>}
                      {selectedNavItems.includes('blog') && <span>Blog</span>}
                      <span>Cart</span>
                    </nav>
                  </div>
                )}
                
                {value.layout?.headerStyle === 'minimal' && (
                  <div className="flex items-center justify-between">
                    <div 
                      className="font-bold"
                      style={{ 
                        color: colors?.primary || '#2563eb',
                        fontFamily: typography?.headingFont || 'Inter'
                      }}
                    >
                      Your Brand
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Cart</span>
                      <div className="w-6 h-4 border rounded flex flex-col gap-0.5 items-center justify-center">
                        <div className="w-3 h-0.5 bg-gray-400"></div>
                        <div className="w-3 h-0.5 bg-gray-400"></div>
                        <div className="w-3 h-0.5 bg-gray-400"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Logo Section */}
        <Collapsible open={logoOpen} onOpenChange={setLogoOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Logo & Branding
              </Label>
              {logoOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            <div className="border rounded-lg p-6 bg-gray-50">
              <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-300 rounded-lg">
                {value.logo?.url ? (
                  <div className="flex items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Logo uploaded</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload logo</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Logo Size</Label>
              <div className="px-2">
                <Slider
                  value={logoSize}
                  onValueChange={setLogoSize}
                  max={200}
                  min={50}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>50px</span>
                  <span>{logoSize[0]}px</span>
                  <span>200px</span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Header Style Section */}
        <Collapsible open={headerStyleOpen} onOpenChange={setHeaderStyleOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Header Style
              </Label>
              {headerStyleOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <RadioGroup
              value={value.layout?.headerStyle || 'modern'}
              onValueChange={(val) => handleLayoutChange('headerStyle', val)}
            >
              <div className="grid grid-cols-1 gap-3">
                {HEADER_STYLES.map((style) => (
                  <Card 
                    key={style.value}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95",
                      value.layout?.headerStyle === style.value ? "ring-2 ring-primary ring-offset-2" : ""
                    )}
                    onClick={() => handleLayoutChange('headerStyle', style.value)}
                  >
                    <CardContent className="p-4">
                      <RadioGroupItem value={style.value} className="sr-only" />
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">{style.label}</span>
                          <p className="text-sm text-muted-foreground">{style.description}</p>
                        </div>
                        
                        {/* Visual Preview */}
                        <div className="h-16 rounded border bg-gray-50 p-2 flex items-center justify-between">
                          {style.value === 'modern' && (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-3 bg-primary rounded-sm"></div>
                                <div className="flex gap-1">
                                  <div className="w-2 h-1 bg-gray-300 rounded"></div>
                                  <div className="w-2 h-1 bg-gray-300 rounded"></div>
                                  <div className="w-2 h-1 bg-gray-300 rounded"></div>
                                </div>
                              </div>
                              <div className="w-4 h-2 bg-primary rounded-sm"></div>
                            </>
                          )}
                          {style.value === 'classic' && (
                            <>
                              <div className="flex flex-col items-center gap-1 flex-1">
                                <div className="w-8 h-2 bg-primary rounded-sm"></div>
                                <div className="flex gap-1">
                                  <div className="w-2 h-1 bg-gray-300 rounded"></div>
                                  <div className="w-2 h-1 bg-gray-300 rounded"></div>
                                  <div className="w-2 h-1 bg-gray-300 rounded"></div>
                                  <div className="w-2 h-1 bg-gray-300 rounded"></div>
                                </div>
                              </div>
                            </>
                          )}
                          {style.value === 'minimal' && (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-3 bg-primary rounded-sm"></div>
                              </div>
                              <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                                <div className="w-2 h-0.5 bg-gray-400"></div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </CollapsibleContent>
        </Collapsible>

        {/* Navigation Menu Section */}
        <Collapsible open={navigationOpen} onOpenChange={setNavigationOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer">Navigation Menu</Label>
              {navigationOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            <div className="text-sm text-gray-600">
              Products, Search, and Cart are always visible. Select optional pages:
            </div>
            
            <div className="space-y-2">
              {NAVIGATION_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={option.value}
                    checked={selectedNavItems.includes(option.value)}
                    onChange={() => toggleNavItem(option.value)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={option.value} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <Label className="text-sm font-medium">Custom Link (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Link label"
                  value={customLink.label}
                  onChange={(e) => setCustomLink({ ...customLink, label: e.target.value })}
                  className="flex-1"
                />
                <Input
                  placeholder="URL"
                  value={customLink.href}
                  onChange={(e) => setCustomLink({ ...customLink, href: e.target.value })}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={addCustomLink}
                  disabled={!customLink.label || !customLink.href}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* CTA Button Section */}
        <Collapsible open={ctaOpen} onOpenChange={setCtaOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer">CTA Button</Label>
              {ctaOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            <Input
              placeholder="Button text (e.g., Shop Now)"
              value={value.layout?.ctaButton?.text || ''}
              onChange={(e) => handleLayoutChange('ctaButton', { 
                ...value.layout?.ctaButton, 
                text: e.target.value 
              })}
            />
            <Input
              placeholder="Button URL (e.g., /products)"
              value={value.layout?.ctaButton?.href || ''}
              onChange={(e) => handleLayoutChange('ctaButton', { 
                ...value.layout?.ctaButton, 
                href: e.target.value 
              })}
            />
          </CollapsibleContent>
        </Collapsible>

      </CardContent>
    </Card>
  )
}