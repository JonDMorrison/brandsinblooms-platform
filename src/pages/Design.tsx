import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, Sparkles, Palette, Type, Image, Layout, Menu, Globe } from 'lucide-react';

const Design = () => {
  const [selectedColorPalette, setSelectedColorPalette] = useState('default');
  const [selectedFont, setSelectedFont] = useState('inter');
  const [selectedHeaderLayout, setSelectedHeaderLayout] = useState('centered');
  const [selectedTopbarLayout, setSelectedTopbarLayout] = useState('left');
  const [selectedMainMenuLayout, setSelectedMainMenuLayout] = useState('logo-left');
  const [selectedFooterLayout, setSelectedFooterLayout] = useState('simple');
  const [selectedMenuBgStyle, setSelectedMenuBgStyle] = useState('solid');
  const [menuBgColor, setMenuBgColor] = useState('#ffffff');

  const colorPalettes = [
    { id: 'default', name: 'Forest Green', primary: '#22C55E', secondary: '#16A34A', accent: '#15803D' },
    { id: 'ocean', name: 'Ocean Blue', primary: '#3B82F6', secondary: '#2563EB', accent: '#1D4ED8' },
    { id: 'sunset', name: 'Sunset Orange', primary: '#F59E0B', secondary: '#D97706', accent: '#B45309' },
    { id: 'purple', name: 'Royal Purple', primary: '#8B5CF6', secondary: '#7C3AED', accent: '#6D28D9' },
    { id: 'rose', name: 'Rose Pink', primary: '#EC4899', secondary: '#DB2777', accent: '#BE185D' },
  ];

  const fonts = [
    { id: 'inter', name: 'Inter', family: 'Inter, sans-serif', preview: 'Modern and clean' },
    { id: 'poppins', name: 'Poppins', family: 'Poppins, sans-serif', preview: 'Friendly and rounded' },
    { id: 'playfair', name: 'Playfair Display', family: 'Playfair Display, serif', preview: 'Elegant and sophisticated' },
    { id: 'roboto', name: 'Roboto', family: 'Roboto, sans-serif', preview: 'Professional and readable' },
    { id: 'lora', name: 'Lora', family: 'Lora, serif', preview: 'Readable and stylish' },
  ];

  const headerLayouts = [
    { id: 'centered', name: 'Centered', description: 'Title and content centered' },
    { id: 'left', name: 'Left Aligned', description: 'Content aligned to the left' },
    { id: 'two-column', name: 'Two Columns', description: 'Split content in two columns' },
    { id: 'four-corners', name: 'Four Corners', description: 'Content in all four corners' },
  ];

  const topbarLayouts = [
    { id: 'left', name: 'Left Aligned', description: 'Menu items aligned left' },
    { id: 'center', name: 'Center Aligned', description: 'Menu items centered' },
    { id: 'right', name: 'Right Aligned', description: 'Menu items aligned right' },
    { id: 'justified', name: 'Justified', description: 'Menu items spread out' },
  ];

  const mainMenuLayouts = [
    { id: 'logo-left', name: 'Logo Left', description: 'Logo on left, links on right' },
    { id: 'centered-logo', name: 'Centered Logo', description: 'Logo centered, links below' },
    { id: 'logo-center-split', name: 'Logo Center Split', description: 'Logo in center, links on both sides' },
  ];

  const footerLayouts = [
    { id: 'simple', name: 'Simple', description: 'Single row with links' },
    { id: 'columns', name: 'Multi-Column', description: 'Multiple columns with categories' },
    { id: 'newsletter', name: 'Newsletter', description: 'Newsletter signup with links' },
    { id: 'comprehensive', name: 'Comprehensive', description: 'Full footer with all sections' },
  ];

  const LayoutPreview = ({ type, isSelected, onClick, children }: any) => (
    <div
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
          <Palette className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Design Settings</h1>
          <p className="text-muted-foreground">Customize the look and feel of your site</p>
        </div>
      </div>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="fonts">Fonts</TabsTrigger>
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="topbar">Topbar</TabsTrigger>
          <TabsTrigger value="menu">Main Menu</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Palette
              </CardTitle>
              <CardDescription>
                Choose a color scheme for your site or create a custom one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Predefined Palettes */}
              <div>
                <Label className="text-base font-medium">Predefined Palettes</Label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                  {colorPalettes.map((palette) => (
                    <div
                      key={palette.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                        selectedColorPalette === palette.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                      }`}
                      onClick={() => setSelectedColorPalette(palette.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex gap-1">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.primary }} />
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.secondary }} />
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.accent }} />
                        </div>
                        <span className="font-medium">{palette.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* AI Generation */}
              <div>
                <Label className="text-base font-medium">AI Generated Palette</Label>
                <div className="flex gap-3 mt-3">
                  <Input placeholder="Describe your inspiration (e.g., 'tropical sunset')" className="flex-1" />
                  <Button variant="secondary" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Manual Colors */}
              <div>
                <Label className="text-base font-medium">Custom Colors</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" defaultValue="#22C55E" className="w-16 h-10" />
                      <Input defaultValue="#22C55E" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" defaultValue="#16A34A" className="w-16 h-10" />
                      <Input defaultValue="#16A34A" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" defaultValue="#15803D" className="w-16 h-10" />
                      <Input defaultValue="#15803D" className="flex-1" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fonts Tab */}
        <TabsContent value="fonts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Typography
              </CardTitle>
              <CardDescription>
                Choose fonts for your site's typography
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {fonts.map((font) => (
                  <div
                    key={font.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                      selectedFont === font.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                    }`}
                    onClick={() => setSelectedFont(font.id)}
                  >
                    <div className="space-y-2">
                      <h3 className="font-medium" style={{ fontFamily: font.family }}>{font.name}</h3>
                      <p className="text-sm text-muted-foreground">{font.preview}</p>
                      <p className="text-lg" style={{ fontFamily: font.family }}>
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logo Tab */}
        <TabsContent value="logo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo & Branding
              </CardTitle>
              <CardDescription>
                Upload or generate your site logo and favicon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Logo Upload</Label>
                <div className="mt-3 space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Drop your logo here or click to upload</p>
                    <Button variant="outline" className="mt-2">Choose File</Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">AI Logo Generation</Label>
                <div className="flex gap-3 mt-3">
                  <Input placeholder="Describe your logo (e.g., 'modern flower shop logo')" className="flex-1" />
                  <Button variant="secondary" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">Favicon</Label>
                <div className="mt-3">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Globe className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Upload favicon (32x32 PNG recommended)</p>
                    <Button variant="outline" size="sm" className="mt-2">Choose File</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Header Tab */}
        <TabsContent value="header" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Header Layouts
              </CardTitle>
              <CardDescription>
                Choose how your page headers are displayed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {headerLayouts.map((layout) => (
                  <LayoutPreview
                    key={layout.id}
                    type="header"
                    isSelected={selectedHeaderLayout === layout.id}
                    onClick={() => setSelectedHeaderLayout(layout.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{layout.name}</h3>
                        {selectedHeaderLayout === layout.id && (
                          <Badge variant="secondary">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{layout.description}</p>
                      
                      {/* Header Preview */}
                      <div className="bg-muted/30 rounded p-4 space-y-2">
                        {layout.id === 'centered' && (
                          <div className="text-center space-y-1">
                            <div className="h-2 bg-primary/60 rounded mx-auto w-24"></div>
                            <div className="h-1 bg-muted-foreground/40 rounded mx-auto w-16"></div>
                          </div>
                        )}
                        {layout.id === 'left' && (
                          <div className="space-y-1">
                            <div className="h-2 bg-primary/60 rounded w-24"></div>
                            <div className="h-1 bg-muted-foreground/40 rounded w-16"></div>
                          </div>
                        )}
                        {layout.id === 'two-column' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="h-2 bg-primary/60 rounded w-16"></div>
                              <div className="h-1 bg-muted-foreground/40 rounded w-12"></div>
                            </div>
                            <div className="space-y-1">
                              <div className="h-2 bg-primary/60 rounded w-16"></div>
                              <div className="h-1 bg-muted-foreground/40 rounded w-12"></div>
                            </div>
                          </div>
                        )}
                        {layout.id === 'four-corners' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="h-1 bg-primary/60 rounded w-8"></div>
                            <div className="h-1 bg-primary/60 rounded w-8 ml-auto"></div>
                            <div className="h-1 bg-primary/60 rounded w-8"></div>
                            <div className="h-1 bg-primary/60 rounded w-8 ml-auto"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </LayoutPreview>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topbar Tab */}
        <TabsContent value="topbar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Menu className="h-5 w-5" />
                Topbar Menu
              </CardTitle>
              <CardDescription>
                Configure the top navigation menu alignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {topbarLayouts.map((layout) => (
                  <LayoutPreview
                    key={layout.id}
                    type="topbar"
                    isSelected={selectedTopbarLayout === layout.id}
                    onClick={() => setSelectedTopbarLayout(layout.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{layout.name}</h3>
                        {selectedTopbarLayout === layout.id && (
                          <Badge variant="secondary">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{layout.description}</p>
                      
                      {/* Topbar Preview */}
                      <div className="bg-muted/30 rounded p-2">
                        <div className={`flex gap-2 ${
                          layout.id === 'left' ? 'justify-start' :
                          layout.id === 'center' ? 'justify-center' :
                          layout.id === 'right' ? 'justify-end' : 'justify-between'
                        }`}>
                          <div className="h-1 bg-primary/60 rounded w-8"></div>
                          <div className="h-1 bg-primary/60 rounded w-8"></div>
                          <div className="h-1 bg-primary/60 rounded w-8"></div>
                          {layout.id === 'justified' && <div className="h-1 bg-primary/60 rounded w-8"></div>}
                        </div>
                      </div>
                    </div>
                  </LayoutPreview>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Main Menu Tab */}
        <TabsContent value="menu" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Main Menu Layout
              </CardTitle>
              <CardDescription>
                Choose the layout for your main navigation menu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {mainMenuLayouts.map((layout) => (
                  <LayoutPreview
                    key={layout.id}
                    type="mainmenu"
                    isSelected={selectedMainMenuLayout === layout.id}
                    onClick={() => setSelectedMainMenuLayout(layout.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{layout.name}</h3>
                        {selectedMainMenuLayout === layout.id && (
                          <Badge variant="secondary">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{layout.description}</p>
                      
                      {/* Main Menu Preview */}
                      <div className="bg-muted/30 rounded p-3">
                        {layout.id === 'logo-left' && (
                          <div className="flex items-center justify-between">
                            <div className="h-3 w-12 bg-primary/80 rounded"></div>
                            <div className="flex gap-3">
                              <div className="h-1 w-8 bg-muted-foreground/60 rounded"></div>
                              <div className="h-1 w-8 bg-muted-foreground/60 rounded"></div>
                              <div className="h-1 w-8 bg-muted-foreground/60 rounded"></div>
                            </div>
                          </div>
                        )}
                        {layout.id === 'centered-logo' && (
                          <div className="text-center space-y-2">
                            <div className="h-3 w-12 bg-primary/80 rounded mx-auto"></div>
                            <div className="flex gap-3 justify-center">
                              <div className="h-1 w-8 bg-muted-foreground/60 rounded"></div>
                              <div className="h-1 w-8 bg-muted-foreground/60 rounded"></div>
                              <div className="h-1 w-8 bg-muted-foreground/60 rounded"></div>
                            </div>
                          </div>
                        )}
                        {layout.id === 'logo-center-split' && (
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <div className="h-1 w-6 bg-muted-foreground/60 rounded"></div>
                              <div className="h-1 w-6 bg-muted-foreground/60 rounded"></div>
                            </div>
                            <div className="h-3 w-12 bg-primary/80 rounded"></div>
                            <div className="flex gap-2">
                              <div className="h-1 w-6 bg-muted-foreground/60 rounded"></div>
                              <div className="h-1 w-6 bg-muted-foreground/60 rounded"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </LayoutPreview>
                ))}
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">Menu Background Style</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                      selectedMenuBgStyle === 'solid' ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedMenuBgStyle('solid')}
                  >
                    <div className="space-y-2">
                      <h4 className="font-medium">Solid Color</h4>
                      <div 
                        className="h-8 border rounded" 
                        style={{ backgroundColor: menuBgColor }}
                      ></div>
                    </div>
                  </div>
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                      selectedMenuBgStyle === 'transparent' ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedMenuBgStyle('transparent')}
                  >
                    <div className="space-y-2">
                      <h4 className="font-medium">Transparent Fade</h4>
                      <div 
                        className="h-8 border rounded"
                        style={{ 
                          background: `linear-gradient(to bottom, ${menuBgColor}80, transparent)` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Color Selector */}
                <div className="mt-4 space-y-3">
                  <Label className="text-sm font-medium">Background Color</Label>
                  <div className="flex gap-3">
                    <div className="flex gap-2">
                      <Input 
                        type="color" 
                        value={menuBgColor} 
                        onChange={(e) => setMenuBgColor(e.target.value)}
                        className="w-16 h-10" 
                      />
                      <Input 
                        value={menuBgColor} 
                        onChange={(e) => setMenuBgColor(e.target.value)}
                        className="w-24" 
                        placeholder="#ffffff"
                      />
                    </div>
                    <div className="flex gap-2">
                      {/* Quick color presets */}
                      {['#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#adb5bd', '#6c757d'].map((color) => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded border-2 border-border hover:border-primary/50 transition-colors"
                          style={{ backgroundColor: color }}
                          onClick={() => setMenuBgColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Live Preview */}
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <Label className="text-xs text-muted-foreground mb-2 block">Live Preview</Label>
                    <div 
                      className="h-12 rounded flex items-center px-4 border"
                      style={{ 
                        background: selectedMenuBgStyle === 'solid' 
                          ? menuBgColor 
                          : `linear-gradient(to bottom, ${menuBgColor}80, transparent)`
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="h-2 w-16 bg-primary/80 rounded"></div>
                        <div className="flex gap-4">
                          <div className="h-1 w-12 bg-foreground/60 rounded"></div>
                          <div className="h-1 w-12 bg-foreground/60 rounded"></div>
                          <div className="h-1 w-12 bg-foreground/60 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Footer Layouts
              </CardTitle>
              <CardDescription>
                Choose a layout for your site footer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {footerLayouts.map((layout) => (
                  <LayoutPreview
                    key={layout.id}
                    type="footer"
                    isSelected={selectedFooterLayout === layout.id}
                    onClick={() => setSelectedFooterLayout(layout.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{layout.name}</h3>
                        {selectedFooterLayout === layout.id && (
                          <Badge variant="secondary">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{layout.description}</p>
                      
                      {/* Footer Preview */}
                      <div className="bg-muted/30 rounded p-3 space-y-2">
                        {layout.id === 'simple' && (
                          <div className="text-center">
                            <div className="flex gap-2 justify-center mb-1">
                              <div className="h-1 w-6 bg-muted-foreground/60 rounded"></div>
                              <div className="h-1 w-6 bg-muted-foreground/60 rounded"></div>
                              <div className="h-1 w-6 bg-muted-foreground/60 rounded"></div>
                            </div>
                            <div className="h-1 w-16 bg-muted-foreground/40 rounded mx-auto"></div>
                          </div>
                        )}
                        {layout.id === 'columns' && (
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <div className="h-1 w-8 bg-primary/60 rounded"></div>
                              <div className="h-0.5 w-6 bg-muted-foreground/40 rounded"></div>
                              <div className="h-0.5 w-6 bg-muted-foreground/40 rounded"></div>
                            </div>
                            <div className="space-y-1">
                              <div className="h-1 w-8 bg-primary/60 rounded"></div>
                              <div className="h-0.5 w-6 bg-muted-foreground/40 rounded"></div>
                              <div className="h-0.5 w-6 bg-muted-foreground/40 rounded"></div>
                            </div>
                            <div className="space-y-1">
                              <div className="h-1 w-8 bg-primary/60 rounded"></div>
                              <div className="h-0.5 w-6 bg-muted-foreground/40 rounded"></div>
                              <div className="h-0.5 w-6 bg-muted-foreground/40 rounded"></div>
                            </div>
                          </div>
                        )}
                        {layout.id === 'newsletter' && (
                          <div className="space-y-2">
                            <div className="text-center">
                              <div className="h-1 w-16 bg-primary/60 rounded mx-auto mb-1"></div>
                              <div className="h-2 w-20 bg-muted/60 rounded mx-auto"></div>
                            </div>
                            <div className="flex gap-1 justify-center">
                              <div className="h-1 w-4 bg-muted-foreground/40 rounded"></div>
                              <div className="h-1 w-4 bg-muted-foreground/40 rounded"></div>
                              <div className="h-1 w-4 bg-muted-foreground/40 rounded"></div>
                            </div>
                          </div>
                        )}
                        {layout.id === 'comprehensive' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-4 gap-2">
                              <div className="space-y-0.5">
                                <div className="h-0.5 w-6 bg-primary/60 rounded"></div>
                                <div className="h-0.5 w-4 bg-muted-foreground/40 rounded"></div>
                              </div>
                              <div className="space-y-0.5">
                                <div className="h-0.5 w-6 bg-primary/60 rounded"></div>
                                <div className="h-0.5 w-4 bg-muted-foreground/40 rounded"></div>
                              </div>
                              <div className="space-y-0.5">
                                <div className="h-0.5 w-6 bg-primary/60 rounded"></div>
                                <div className="h-0.5 w-4 bg-muted-foreground/40 rounded"></div>
                              </div>
                              <div className="space-y-0.5">
                                <div className="h-0.5 w-6 bg-primary/60 rounded"></div>
                                <div className="h-0.5 w-4 bg-muted-foreground/40 rounded"></div>
                              </div>
                            </div>
                            <div className="border-t border-muted-foreground/20 pt-1">
                              <div className="flex justify-between">
                                <div className="h-0.5 w-8 bg-muted-foreground/40 rounded"></div>
                                <div className="flex gap-1">
                                  <div className="h-1 w-1 bg-muted-foreground/40 rounded-full"></div>
                                  <div className="h-1 w-1 bg-muted-foreground/40 rounded-full"></div>
                                  <div className="h-1 w-1 bg-muted-foreground/40 rounded-full"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </LayoutPreview>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button size="lg" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Save Design Settings
        </Button>
      </div>
    </div>
  );
};

export default Design;