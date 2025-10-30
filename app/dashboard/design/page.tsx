'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Button } from '@/src/components/ui/button'
import { Palette, Type, Layout, Eye, X } from 'lucide-react'
import { Skeleton } from '@/src/components/ui/skeleton'
import { useDesignSettings, useUpdateDesignSettings } from '@/src/hooks/useDesignSettings'
import { useDebounceCallback } from '@/src/hooks/useDebounce'
import { ThemeSettings } from '@/src/lib/queries/domains/theme'

// Dynamic imports for design components with loading states and lazy loading
const ColorCustomization = dynamic(
  () => import('@/src/components/design/ColorCustomization').then(mod => mod.ColorCustomization),
  { 
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false // Disable SSR for better client-side performance
  }
)
const TypographyCustomization = dynamic(
  () => import('@/src/components/design/TypographyCustomization'),
  { 
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false
  }
)
const HeaderCustomization = dynamic(
  () => import('@/src/components/design/HeaderCustomization').then(mod => mod.HeaderCustomization),
  { 
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false
  }
)
const FooterCustomization = dynamic(
  () => import('@/src/components/design/FooterCustomization').then(mod => mod.FooterCustomization),
  {
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false
  }
)
const DesignPreview = dynamic(
  () => import('@/src/components/design/DesignPreview').then(mod => mod.DesignPreview),
  {
    loading: () => <Skeleton className="h-[600px] w-full" />,
    ssr: false
  }
)

function DesignPageSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default function DesignPage() {
  const { data: designSettings, loading: isLoading } = useDesignSettings()
  const { mutate: updateSettings } = useUpdateDesignSettings()
  
  // Local state for immediate UI updates
  const [localSettings, setLocalSettings] = useState<ThemeSettings | null>(null)
  const [activeTab, setActiveTab] = useState<string>('colors')
  const [previewMode, setPreviewMode] = useState<boolean>(false)
  
  // Debounced save to database (1 second delay)
  const debouncedSave = useDebounceCallback((settings: ThemeSettings) => {
    updateSettings(settings)
  }, 1000)
  
  // Initialize and update local settings from database when site changes
  useEffect(() => {
    if (designSettings) {
      setLocalSettings(designSettings)
    }
  }, [designSettings])
  
  // Update handler that saves to both local state and database
  const handleSettingChange = (category: keyof ThemeSettings, value: Partial<ThemeSettings[keyof ThemeSettings]>) => {
    if (!localSettings) return
    
    const newSettings = {
      ...localSettings,
      [category]: {
        ...localSettings[category],
        ...value
      }
    }
    
    setLocalSettings(newSettings)
    debouncedSave(newSettings)
  }
  
  
  // Loading state
  if (isLoading) {
    return <DesignPageSkeleton />
  }
  
  // Error state
  if (!localSettings) {
    return (
      <div className="container mx-auto p-3 sm:p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">
              Unable to load design settings. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 fade-in-up" style={{ animationDelay: '0s' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Design System</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Customize your site&apos;s appearance and branding
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 text-white w-full sm:w-auto"
            style={{
              background: 'linear-gradient(135deg, hsl(152 45% 40%) 0%, hsl(145 35% 60%) 100%)'
            }}
          >
            <Eye className="h-4 w-4" />
            <span className="sm:inline">
              {previewMode ? 'Close' : 'View Site'}
            </span>
          </Button>
        </div>
      </div>



      {/* Design Customization Tabs */}
      <Card className="fade-in-up" style={{ animationDelay: '0.2s' }}>
        <CardContent className="p-3 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="colors" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
                <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Colors</span>
              </TabsTrigger>
              <TabsTrigger value="fonts" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
                <Type className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Fonts</span>
              </TabsTrigger>
              <TabsTrigger value="header" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
                <Layout className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Header</span>
              </TabsTrigger>
              <TabsTrigger value="footer" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
                <Layout className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Footer</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="colors" className="space-y-6">
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
                  <ColorCustomization
                    colors={localSettings.colors}
                    typography={localSettings.typography}
                    onColorsChange={(colors) => handleSettingChange('colors', colors)}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="fonts" className="space-y-6">
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
                  <TypographyCustomization
                    typography={localSettings.typography}
                    colors={localSettings.colors}
                    onTypographyChange={(typography) => handleSettingChange('typography', typography as Partial<ThemeSettings['typography']>)}
                  />
                </Suspense>
              </TabsContent>


              <TabsContent value="header" className="space-y-6">
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
                  <HeaderCustomization
                    value={localSettings}
                    colors={localSettings.colors}
                    typography={localSettings.typography}
                    onChange={(newSettings) => {
                      setLocalSettings(newSettings)
                      debouncedSave(newSettings)
                    }}
                  />
                </Suspense>
              </TabsContent>


              <TabsContent value="footer" className="space-y-6">
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
                  <FooterCustomization
                    value={localSettings}
                    colors={localSettings.colors}
                    typography={localSettings.typography}
                    onChange={(newSettings) => {
                      setLocalSettings(newSettings)
                      debouncedSave(newSettings)
                    }}
                  />
                </Suspense>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Live Preview Modal/Panel */}
      {previewMode && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col my-2 sm:my-4">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
                <h2 className="text-base sm:text-lg font-semibold">Design Preview</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewMode(false)}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden relative bg-white flex items-center justify-center">
                <Suspense fallback={
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Eye className="h-8 w-8 animate-pulse text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Loading preview...</p>
                    </div>
                  </div>
                }>
                  <DesignPreview settings={localSettings} className="h-full w-full border-0 shadow-none" />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}