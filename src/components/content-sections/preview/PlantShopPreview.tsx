'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { ThemeSettings } from '@/lib/queries/domains/theme'
import { useThemeCSS } from '@/src/hooks/useThemeCSS'
import { PlantThemePresetSelector, type PlantThemePresetKey } from '@/src/components/theme/PlantShopTheme'
import { PLANT_THEME_PRESETS } from '@/src/lib/theme/plant-shop-variables'
import { Button } from '@/src/components/ui/button'
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Palette,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/src/lib/utils'

// Import plant view components
import { 
  PlantShowcaseView,
  PlantGridView,
  PlantCareGuideView,
  PlantCategoriesView
} from '../plant-shop'

interface PlantShopPreviewProps {
  section: ContentSection
  theme?: ThemeSettings | null
  onThemeChange?: (theme: ThemeSettings) => void
  className?: string
}

type ViewportMode = 'mobile' | 'tablet' | 'desktop'

/**
 * Comprehensive WYSIWYG Preview Component for Plant Shop Content
 * Features live theme updates, responsive modes, and iframe-safe rendering
 */
export function PlantShopPreview({ 
  section, 
  theme, 
  onThemeChange,
  className 
}: PlantShopPreviewProps) {
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop')
  const [selectedPreset, setSelectedPreset] = useState<PlantThemePresetKey>('greenhouse')
  const [showThemeControls, setShowThemeControls] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Generate theme CSS for preview
  const { fullCSS } = useThemeCSS(theme, 'iframe')

  // Handle preset changes
  const handlePresetChange = useCallback((preset: PlantThemePresetKey) => {
    setSelectedPreset(preset)
    if (onThemeChange) {
      const presetTheme = PLANT_THEME_PRESETS[preset]
      onThemeChange({
        colors: presetTheme.colors,
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter',
          fontSize: 'medium',
          headingWeight: '600',
          bodyWeight: '400'
        },
        layout: {
          headerStyle: 'modern',
          footerStyle: 'minimal',
          menuStyle: 'horizontal'
        }
      } as ThemeSettings)
    }
  }, [onThemeChange])

  // Get viewport dimensions based on mode
  const viewportStyles = useMemo(() => {
    const dimensions = {
      mobile: { width: '375px', height: '667px' },
      tablet: { width: '768px', height: '1024px' },
      desktop: { width: '100%', height: 'auto' }
    }
    
    return {
      width: dimensions[viewportMode].width,
      height: viewportMode !== 'desktop' ? dimensions[viewportMode].height : 'auto',
      maxHeight: viewportMode !== 'desktop' ? '600px' : 'none',
      overflow: viewportMode !== 'desktop' ? 'auto' : 'visible'
    }
  }, [viewportMode])

  // Render the appropriate view component based on section type
  const renderPlantContent = useCallback(() => {
    switch (section.type) {
      case 'plant_showcase':
        return <PlantShowcaseView section={section} />
      case 'plant_grid':
        return <PlantGridView section={section} />
      case 'plant_care_guide':
        return <PlantCareGuideView section={section} />
      case 'plant_categories':
        return <PlantCategoriesView section={section} />
      default:
        return (
          <div className="p-8 text-center text-gray-500">
            Preview not available for {section.type}
          </div>
        )
    }
  }, [section])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2">
          {/* Viewport Mode Selector */}
          <div className="flex items-center gap-1 border rounded-md p-1 bg-white">
            <Button
              variant={viewportMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewportMode('mobile')}
              className="h-8 px-2"
            >
              <Smartphone className="w-4 h-4" />
            </Button>
            <Button
              variant={viewportMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewportMode('tablet')}
              className="h-8 px-2"
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={viewportMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewportMode('desktop')}
              className="h-8 px-2"
            >
              <Monitor className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            {viewportMode.charAt(0).toUpperCase() + viewportMode.slice(1)} Preview
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Controls Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowThemeControls(!showThemeControls)}
            className="flex items-center gap-2"
          >
            <Palette className="w-4 h-4" />
            Theme
          </Button>

          {/* Preview Mode Toggle */}
          <Button
            variant={isPreviewMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center gap-2"
          >
            {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isPreviewMode ? 'Exit Preview' : 'Preview Mode'}
          </Button>
        </div>
      </div>

      {/* Theme Controls */}
      {showThemeControls && (
        <div className="p-4 bg-white border rounded-lg">
          <PlantThemePresetSelector
            selectedPreset={selectedPreset}
            onPresetChange={handlePresetChange}
          />
        </div>
      )}

      {/* Preview Container */}
      <div className="relative">
        {isPreviewMode ? (
          /* Full Preview Mode with Iframe Simulation */
          <div className="border rounded-lg overflow-hidden bg-white">
            <div 
              className="preview-container transition-all duration-300 ease-in-out"
              style={viewportStyles}
              data-preview-mode="iframe"
            >
              <style dangerouslySetInnerHTML={{ __html: fullCSS }} />
              <div className="min-h-full bg-white">
                {renderPlantContent()}
              </div>
            </div>
          </div>
        ) : (
          /* Inline Preview Mode */
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm font-medium text-gray-700 mb-3">
              Live Preview ({viewportMode})
            </div>
            <div 
              className="bg-white rounded border overflow-hidden"
              style={viewportStyles}
            >
              <div 
                className="p-4"
                data-preview-mode="iframe"
                style={{
                  fontFamily: theme?.typography?.bodyFont || 'Inter, sans-serif',
                  color: theme?.colors?.text || '#1f2937',
                  backgroundColor: theme?.colors?.background || '#ffffff'
                }}
              >
                <style dangerouslySetInnerHTML={{ __html: fullCSS }} />
                {renderPlantContent()}
              </div>
            </div>
          </div>
        )}

        {/* Responsive Indicator */}
        {viewportMode !== 'desktop' && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {viewportStyles.width}
          </div>
        )}
      </div>

      {/* Preview Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>
          ✓ Theme variables: Plant-specific colors, typography, and spacing applied
        </div>
        <div>
          ✓ Responsive: Grid columns and spacing adapt to viewport size
        </div>
        <div>
          ✓ Live updates: Changes reflect immediately in preview
        </div>
        {isPreviewMode && (
          <div>
            ✓ Iframe mode: Isolated CSS prevents conflicts with editor styles
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Responsive Plant Grid Preview Hook
 * Automatically adjusts grid columns based on viewport mode
 */
export function useResponsivePlantGrid(viewportMode: ViewportMode, baseColumns: number) {
  return useMemo(() => {
    const columnMap = {
      mobile: 1,
      tablet: Math.min(baseColumns, 2),
      desktop: baseColumns
    }
    return columnMap[viewportMode]
  }, [viewportMode, baseColumns])
}

/**
 * Theme-Aware CSS Injection Hook for Preview
 * Ensures proper CSS variable inheritance in preview components
 */
export function usePreviewThemeInjection(theme: ThemeSettings | null, containerId: string) {
  const { fullCSS } = useThemeCSS(theme, 'iframe')

  useMemo(() => {
    if (typeof window === 'undefined') return

    // Remove existing preview styles
    const existingStyle = document.getElementById(`preview-theme-${containerId}`)
    if (existingStyle) {
      existingStyle.remove()
    }

    // Inject new preview styles
    if (theme && fullCSS) {
      const styleElement = document.createElement('style')
      styleElement.id = `preview-theme-${containerId}`
      styleElement.textContent = fullCSS
      document.head.appendChild(styleElement)
    }

    return () => {
      const style = document.getElementById(`preview-theme-${containerId}`)
      if (style) {
        style.remove()
      }
    }
  }, [theme, fullCSS, containerId])

  return fullCSS
}