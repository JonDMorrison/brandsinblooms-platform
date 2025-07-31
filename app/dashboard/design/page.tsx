'use client'

import { useState, lazy, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Palette, Type, Layout, Upload, Eye, Wand2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load design components to improve initial load time
const ColorCustomization = lazy(() => import('@/components/design/ColorCustomization'))
const TypographyCustomization = lazy(() => import('@/components/design/TypographyCustomization'))
const LayoutCustomization = lazy(() => import('@/components/design/LayoutCustomization'))
const LogoCustomization = lazy(() => import('@/components/design/LogoCustomization'))

interface DesignState {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  typography: {
    headingFont: string
    bodyFont: string
    fontSize: string
  }
  layout: {
    headerStyle: string
    footerStyle: string
    menuStyle: string
  }
  logo: {
    url: string | null
    position: string
    size: string
  }
  branding: {
    logoUrl?: string
  }
}

export default function DesignPage() {
  const [designState, setDesignState] = useState<DesignState>({
    colors: {
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      accent: '#F59E0B',
      background: '#FFFFFF'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      fontSize: 'medium'
    },
    layout: {
      headerStyle: 'modern',
      footerStyle: 'minimal',
      menuStyle: 'horizontal'
    },
    logo: {
      url: null,
      position: 'left',
      size: 'medium'
    },
    branding: {
      logoUrl: undefined
    }
  })

  const [activeTab, setActiveTab] = useState<string>('colors')
  const [previewMode, setPreviewMode] = useState<boolean>(false)

  const updateDesignState = (category: keyof DesignState, updates: Partial<DesignState[keyof DesignState]>) => {
    setDesignState(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...updates
      }
    }))
  }

  const handleSaveChanges = () => {
    // In a real app, this would save to the backend
    console.log('Saving design changes:', designState)
    // Show success toast here
  }

  const handleResetToDefaults = () => {
    setDesignState({
      colors: {
        primary: '#8B5CF6',
        secondary: '#06B6D4',
        accent: '#F59E0B',
        background: '#FFFFFF'
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        fontSize: 'medium'
      },
      layout: {
        headerStyle: 'modern',
        footerStyle: 'minimal',
        menuStyle: 'horizontal'
      },
      logo: {
        url: null,
        position: 'left',
        size: 'medium'
      },
      branding: {
        logoUrl: undefined
      }
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Design System</h1>
          <p className="text-gray-600 mt-1">
            Customize your site's appearance and branding
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Exit Preview' : 'Live Preview'}
          </Button>
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSaveChanges}
            className="bg-gradient-primary text-white"
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* AI Design Assistant Card */}
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
          <div className="flex items-center gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Generate Color Palette
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Suggest Typography
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Recommend Layout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Design Customization Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="fonts" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Fonts
              </TabsTrigger>
              <TabsTrigger value="logo" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Logo
              </TabsTrigger>
              <TabsTrigger value="header" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Header
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Layout
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="colors" className="space-y-6">
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
                  <ColorCustomization
                    colors={designState.colors}
                    onColorsChange={(colors) => updateDesignState('colors', colors)}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="fonts" className="space-y-6">
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
                  <TypographyCustomization
                    typography={designState.typography}
                    onTypographyChange={(typography) => updateDesignState('typography', typography)}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="logo" className="space-y-6">
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
                  <LogoCustomization
                    logo={{
                      url: designState.branding.logoUrl || null,
                      position: 'left',
                      size: 'medium'
                    }}
                    onLogoChange={(logo) => updateDesignState('branding', { 
                      logoUrl: logo.url || undefined 
                    })}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="header" className="space-y-6">
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
                  <LayoutCustomization
                    layout={designState.layout}
                    onLayoutChange={(layout) => updateDesignState('layout', layout)}
                    section="header"
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="layout" className="space-y-6">
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
                  <LayoutCustomization
                    layout={designState.layout}
                    onLayoutChange={(layout) => updateDesignState('layout', layout)}
                    section="all"
                  />
                </Suspense>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              See how your changes will look on your site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="p-6 rounded-lg border-2 border-dashed border-gray-300 min-h-[300px] flex items-center justify-center"
              style={{
                backgroundColor: designState.colors.background,
                color: designState.colors.primary,
                fontFamily: designState.typography.bodyFont
              }}
            >
              <div className="text-center space-y-4">
                <h2 
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: designState.typography.headingFont,
                    color: designState.colors.primary
                  }}
                >
                  Your Site Preview
                </h2>
                <p className="text-gray-600">
                  This is how your site will look with the current design settings
                </p>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: designState.colors.primary }}
                  />
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: designState.colors.secondary }}
                  />
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: designState.colors.accent }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}