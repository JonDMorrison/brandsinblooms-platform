'use client'

import React from 'react'
import { PLANT_THEME_PRESETS, type PlantThemePresetKey } from '@/src/lib/theme/plant-shop-variables'
import { ThemeSettings } from '@/src/lib/queries/domains/theme'

interface PlantShopThemeProps {
  preset?: PlantThemePresetKey
  customTheme?: ThemeSettings
  children: React.ReactNode
  className?: string
}

/**
 * Plant Shop Theme Provider Component
 * Applies plant-specific theme styling to its children
 */
export function PlantShopTheme({ 
  preset = 'greenhouse', 
  customTheme, 
  children, 
  className = '' 
}: PlantShopThemeProps) {
  // Use custom theme if provided, otherwise use preset
  const themeColors = customTheme?.colors || PLANT_THEME_PRESETS[preset].colors
  
  // Generate CSS custom properties
  const plantThemeStyle = {
    '--plant-primary': themeColors.primary,
    '--plant-secondary': themeColors.secondary,
    '--plant-accent': themeColors.accent,
    '--theme-background': themeColors.background,
    '--theme-text': themeColors.text,
    '--theme-primary': themeColors.primary,
    '--theme-secondary': themeColors.secondary,
    '--theme-accent': themeColors.accent,
    '--plant-name-color': themeColors.text,
    '--plant-scientific-color': themeColors.text,
    '--plant-description-color': themeColors.text,
    '--plant-category-color': themeColors.primary,
  } as React.CSSProperties

  return (
    <div 
      className={`plant-shop-theme ${className}`}
      style={plantThemeStyle}
      data-plant-theme={preset}
    >
      {children}
    </div>
  )
}

/**
 * Plant Theme Preset Selector
 * UI component for selecting plant theme presets
 */
interface PlantThemePresetSelectorProps {
  selectedPreset: PlantThemePresetKey
  onPresetChange: (preset: PlantThemePresetKey) => void
}

export function PlantThemePresetSelector({ 
  selectedPreset, 
  onPresetChange 
}: PlantThemePresetSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Plant Shop Themes</h3>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(PLANT_THEME_PRESETS).map(([key, preset]) => {
          const presetKey = key as PlantThemePresetKey
          const isSelected = selectedPreset === presetKey
          
          return (
            <button
              key={key}
              onClick={() => onPresetChange(presetKey)}
              className={`p-3 text-left border rounded-lg transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: preset.colors.primary }}
                />
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: preset.colors.secondary }}
                />
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: preset.colors.accent }}
                />
              </div>
              <div className="text-sm font-medium">{preset.name}</div>
              <div className="text-xs text-gray-600">{preset.description}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Plant Theme Preview Component
 * Shows a preview of how plant content looks with the current theme
 */
interface PlantThemePreviewProps {
  theme: ThemeSettings | null
  preset?: PlantThemePresetKey
}

export function PlantThemePreview({ theme, preset = 'greenhouse' }: PlantThemePreviewProps) {
  return (
    <PlantShopTheme preset={preset} customTheme={theme || undefined}>
      <div className="plant-section p-4 border rounded-lg bg-white">
        <h3 className="plant-category-header">Featured Plants</h3>
        
        <div className="plant-grid" style={{ '--plant-grid-columns-desktop': 2 } as React.CSSProperties}>
          {/* Example Plant Card 1 */}
          <div className="plant-card">
            <div 
              className="plant-image bg-green-100 flex items-center justify-center text-2xl mb-3"
              style={{ height: '150px' }}
            >
              🌿
            </div>
            <h4 className="plant-name">Monstera Deliciosa</h4>
            <p className="plant-scientific-name">Monstera deliciosa</p>
            <p className="plant-description mt-2">
              Beautiful split-leaf tropical plant perfect for bright indoor spaces.
            </p>
            <div className="flex gap-2 mt-3">
              <span className="care-badge care-badge-easy">Easy</span>
              <span className="light-indicator light-indicator-medium">☀️ Medium Light</span>
            </div>
          </div>
          
          {/* Example Plant Card 2 */}
          <div className="plant-card">
            <div 
              className="plant-image bg-green-100 flex items-center justify-center text-2xl mb-3"
              style={{ height: '150px' }}
            >
              🌵
            </div>
            <h4 className="plant-name">Snake Plant</h4>
            <p className="plant-scientific-name">Sansevieria trifasciata</p>
            <p className="plant-description mt-2">
              Low-maintenance succulent that thrives in low light conditions.
            </p>
            <div className="flex gap-2 mt-3">
              <span className="care-badge care-badge-easy">Easy</span>
              <span className="light-indicator light-indicator-low">🌙 Low Light</span>
            </div>
          </div>
        </div>
        
        {/* Care Tips Section */}
        <div className="plant-content mt-6">
          <h4 className="plant-category-header text-lg">Seasonal Care Tips</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="season-spring">🌱</span>
              <span className="text-sm">Spring: Increase watering as growth resumes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="season-summer">☀️</span>
              <span className="text-sm">Summer: Provide bright, indirect light</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="season-autumn">🍂</span>
              <span className="text-sm">Autumn: Reduce fertilizing frequency</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="season-winter">❄️</span>
              <span className="text-sm">Winter: Allow soil to dry between waterings</span>
            </div>
          </div>
        </div>
      </div>
    </PlantShopTheme>
  )
}