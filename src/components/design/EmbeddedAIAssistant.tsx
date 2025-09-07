'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Sparkles, Wand2, Loader2, Palette, Type, Layout } from 'lucide-react'
import { toast } from 'sonner'
import {
  generateColorPalette,
  suggestFontPairings,
  recommendLayout,
  type ColorPalette,
  type FontPairing,
  type LayoutRecommendation
} from '@/src/lib/ai/design-assistant'
import { handleError } from '@/src/lib/types/error-handling'

/**
 * Props for the EmbeddedAIAssistant component
 */
export interface EmbeddedAIAssistantProps {
  /** Context determines which AI suggestions to show */
  context: 'colors' | 'fonts' | 'header'
  /** Current settings to provide context for AI suggestions */
  currentSettings?: {
    colors?: {
      primary: string
      secondary?: string
      accent?: string
      background?: string
      text?: string
    }
    typography?: {
      headingFont?: string
      bodyFont?: string
    }
    layout?: {
      headerStyle?: string
      menuStyle?: string
      footerStyle?: string
    }
  }
  /** Callback when AI suggests changes */
  onChange?: (suggestions: ColorPalette | FontPairing[] | LayoutRecommendation) => void
  /** Disable the assistant */
  disabled?: boolean
}

/**
 * Context-aware AI assistant for design suggestions
 * Provides contextual help for colors, fonts, and header design
 */
export function EmbeddedAIAssistant({
  context,
  currentSettings,
  onChange,
  disabled = false
}: EmbeddedAIAssistantProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  /**
   * Get contextual content based on the current context
   */
  const getContextualContent = () => {
    switch (context) {
      case 'colors':
        return {
          title: 'AI Color Assistant',
          description: 'Get AI-powered color palette suggestions that match your brand',
          icon: Palette,
          buttonText: 'Generate Color Palette'
        }
      case 'fonts':
        return {
          title: 'AI Typography Assistant', 
          description: 'Discover typography combinations that enhance readability and style',
          icon: Type,
          buttonText: 'Suggest Font Pairings'
        }
      case 'header':
        return {
          title: 'AI Header Assistant',
          description: 'Optimize your header design with AI-generated layout recommendations',
          icon: Layout,
          buttonText: 'Generate Header Layout'
        }
      default:
        return {
          title: 'AI Design Assistant',
          description: 'Get AI-powered design suggestions',
          icon: Sparkles,
          buttonText: 'Generate Suggestions'
        }
    }
  }

  /**
   * Generate AI suggestions based on context
   */
  const handleGenerateSuggestions = async () => {
    if (disabled) return

    setIsGenerating(true)
    
    try {
      let suggestions: ColorPalette | FontPairing[] | LayoutRecommendation

      switch (context) {
        case 'colors':
          suggestions = await generateColorPalette({
            mood: 'professional',
            baseColor: currentSettings?.colors?.primary || '#1E40AF'
          })
          toast.success('Color palette generated successfully!')
          break

        case 'fonts':
          suggestions = await suggestFontPairings({
            style: 'modern'
          })
          toast.success('Font pairings suggested successfully!')
          break

        case 'header':
          suggestions = await recommendLayout({
            contentType: 'corporate',
            hasLogo: true,
            menuItems: 5
          })
          toast.success('Header layout recommendations ready!')
          break

        default:
          throw new Error('Invalid context provided')
      }

      // Call the onChange callback with suggestions
      if (onChange) {
        onChange(suggestions)
      }

    } catch (error: unknown) {
      const { message } = handleError(error)
      toast.error(`Failed to generate suggestions: ${message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const contextContent = getContextualContent()
  const IconComponent = contextContent.icon

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <CardTitle className="text-sm">{contextContent.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">
          {contextContent.description}
        </p>
        <Button
          size="sm"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
          onClick={handleGenerateSuggestions}
          disabled={disabled || isGenerating}
          aria-label={`Generate ${context} suggestions using AI`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              {contextContent.buttonText}
            </>
          )}
        </Button>
        
        {/* Accessibility enhancement */}
        {isGenerating && (
          <div 
            className="sr-only" 
            role="status" 
            aria-live="polite"
            aria-label="AI is generating suggestions"
          >
            Generating AI suggestions, please wait...
          </div>
        )}
      </CardContent>
    </Card>
  )
}