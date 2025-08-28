'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Button } from '@/src/components/ui/button'
import { Palette, Type, Layout, Upload, Eye, Wand2, Loader2, X, History, Sparkles } from 'lucide-react'
import { Skeleton } from '@/src/components/ui/skeleton'
import { toast } from 'sonner'
import { useDesignSettings, useUpdateDesignSettings, useResetDesignSettings } from '@/src/hooks/useDesignSettings'
import { useDebounceCallback } from '@/src/hooks/useDebounce'
import { useDesignHistory, useDesignHistoryKeyboardShortcuts } from '@/src/hooks/useDesignHistory'
import { ThemeSettings } from '@/src/lib/queries/domains/theme'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'

// Dynamic imports for design components with loading states
const ColorCustomization = dynamic(
  () => import('@/src/components/design/ColorCustomization').then(mod => mod.ColorCustomization),
  { loading: () => <Skeleton className="h-[400px] w-full" /> }
)
const TypographyCustomization = dynamic(
  () => import('@/src/components/design/TypographyCustomization'),
  { loading: () => <Skeleton className="h-[400px] w-full" /> }
)
const LayoutCustomization = dynamic(
  () => import('@/src/components/design/LayoutCustomization'),
  { loading: () => <Skeleton className="h-[400px] w-full" /> }
)
const LogoCustomization = dynamic(
  () => import('@/src/components/design/LogoCustomization'),
  { loading: () => <Skeleton className="h-[400px] w-full" /> }
)
const DesignPreview = dynamic(
  () => import('@/src/components/design/DesignPreview').then(mod => mod.DesignPreview),
  { loading: () => <Skeleton className="h-[600px] w-full" /> }
)
const AIDesignAssistant = dynamic(
  () => import('@/src/components/design/AIDesignAssistant').then(mod => mod.AIDesignAssistant),
  { loading: () => <Skeleton className="h-[400px] w-full" /> }
)
const DesignHistory = dynamic(
  () => import('@/src/components/design/DesignHistory').then(mod => mod.DesignHistory),
  { loading: () => <Skeleton className="h-[400px] w-full" /> }
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
  const { data: designSettings, isLoading } = useDesignSettings()
  const { mutate: updateSettings, isPending: isSaving } = useUpdateDesignSettings()
  const resetSettings = useResetDesignSettings()
  
  // Local state for immediate UI updates
  const [localSettings, setLocalSettings] = useState<ThemeSettings | null>(null)
  const [activeTab, setActiveTab] = useState<string>('colors')
  const [previewMode, setPreviewMode] = useState<boolean>(false)
  const [showHistory, setShowHistory] = useState<boolean>(false)
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false)
  
  // Design history management
  const {
    currentSettings: historySettings,
    addToHistory,
    undo,
    redo,
    jumpToHistory,
    clearHistory,
    canUndo,
    canRedo,
    history,
    currentIndex
  } = useDesignHistory(localSettings || designSettings || {} as ThemeSettings)
  
  // Keyboard shortcuts for undo/redo
  useDesignHistoryKeyboardShortcuts(
    useCallback(() => {
      const settings = undo()
      if (settings) {
        setLocalSettings(settings)
        updateSettings(settings)
        toast.success('Undone')
      }
    }, [undo, updateSettings]),
    useCallback(() => {
      const settings = redo()
      if (settings) {
        setLocalSettings(settings)
        updateSettings(settings)
        toast.success('Redone')
      }
    }, [redo, updateSettings]),
    true
  )
  
  // Debounced save to database (1 second delay)
  const debouncedSave = useDebounceCallback((settings: ThemeSettings) => {
    updateSettings(settings)
    addToHistory(settings)
  }, 1000)
  
  // Initialize local settings from database
  useEffect(() => {
    if (designSettings && !localSettings) {
      setLocalSettings(designSettings)
    }
  }, [designSettings, localSettings])
  
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
  
  const handleSaveChanges = () => {
    if (!localSettings) return
    updateSettings(localSettings)
  }
  
  const handleResetToDefaults = () => {
    resetSettings()
    toast.success('Design settings reset to defaults')
  }
  
  // Loading state
  if (isLoading) {
    return <DesignPageSkeleton />
  }
  
  // Error state
  if (!localSettings) {
    return (
      <div className="container mx-auto p-6">
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between fade-in-up" style={{ animationDelay: '0s' }}>
        <div>
          <h1 className="text-3xl font-bold">Design System</h1>
          <p className="text-gray-600 mt-1">
            Customize your site&apos;s appearance and branding
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            {showHistory ? 'Hide' : 'Show'} History
          </Button>
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
            disabled={isSaving}
            className="bg-gradient-primary text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>

      {/* AI Design Assistant Button Card */}
      <Card className="fade-in-up border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50" style={{ animationDelay: '0.1s' }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI Design Assistant</h3>
                <p className="text-sm text-gray-600">Let AI help you create the perfect design for your brand</p>
              </div>
            </div>
            <Dialog open={showAIAssistant} onOpenChange={setShowAIAssistant}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Wand2 className="h-4 w-4 mr-2" />
                  Open AI Assistant
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>AI Design Assistant</DialogTitle>
                  <DialogDescription>
                    Let AI help you create the perfect design for your brand
                  </DialogDescription>
                </DialogHeader>
                <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                  <AIDesignAssistant
                    currentSettings={localSettings}
                    onApplyColors={(colors) => {
                      handleSettingChange('colors', colors)
                      setShowAIAssistant(false)
                    }}
                    onApplyTypography={(typography) => {
                      handleSettingChange('typography', typography)
                      setShowAIAssistant(false)
                    }}
                    onApplyLayout={(layout) => {
                      handleSettingChange('layout', layout)
                      setShowAIAssistant(false)
                    }}
                  />
                </Suspense>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Design History - Show when toggled */}
      {showHistory && (
        <Card className="fade-in-up" style={{ animationDelay: '0.15s' }}>
          <CardContent className="p-6">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <DesignHistory
                history={history}
                currentIndex={currentIndex}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={() => {
                  const settings = undo()
                  if (settings) {
                    setLocalSettings(settings)
                    updateSettings(settings)
                  }
                }}
                onRedo={() => {
                  const settings = redo()
                  if (settings) {
                    setLocalSettings(settings)
                    updateSettings(settings)
                  }
                }}
                onJumpTo={(index) => {
                  const settings = jumpToHistory(index)
                  if (settings) {
                    setLocalSettings(settings)
                    updateSettings(settings)
                  }
                }}
                onClear={clearHistory}
                onApply={(settings) => {
                  setLocalSettings(settings)
                  updateSettings(settings)
                }}
              />
            </Suspense>
          </CardContent>
        </Card>
      )}

      {/* Design Customization Tabs */}
      <Card className="fade-in-up" style={{ animationDelay: '0.2s' }}>
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
                    colors={localSettings.colors}
                    onColorsChange={(colors) => handleSettingChange('colors', colors)}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="fonts" className="space-y-6">
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
                  <TypographyCustomization
                    typography={localSettings.typography}
                    onTypographyChange={(typography) => handleSettingChange('typography', typography as Partial<ThemeSettings['typography']>)}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="logo" className="space-y-6">
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
                  <LogoCustomization
                    logo={localSettings.logo}
                    onLogoChange={(logo) => handleSettingChange('logo', logo as Partial<ThemeSettings['logo']>)}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="header" className="space-y-6">
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
                  <LayoutCustomization
                    layout={localSettings.layout}
                    onLayoutChange={(layout) => handleSettingChange('layout', layout as Partial<ThemeSettings['layout']>)}
                    section="header"
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="layout" className="space-y-6">
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
                  <LayoutCustomization
                    layout={localSettings.layout}
                    onLayoutChange={(layout) => handleSettingChange('layout', layout as Partial<ThemeSettings['layout']>)}
                    section="all"
                  />
                </Suspense>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Live Preview Modal/Panel */}
      {previewMode && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Design Preview</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewMode(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={<Skeleton className="h-full w-full" />}>
                <DesignPreview settings={localSettings} className="h-full border-0 shadow-none" />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}