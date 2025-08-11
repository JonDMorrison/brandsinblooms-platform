'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group'
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink } from 'lucide-react'
import { ThemeSettings } from '@/src/lib/queries/domains/theme'
import { useSiteId } from '@/contexts/SiteContext'

interface DesignPreviewProps {
  settings: ThemeSettings
  className?: string
}

const deviceSizes = {
  desktop: { width: '100%', height: '100%', label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', label: 'Tablet' },
  mobile: { width: '375px', height: '667px', label: 'Mobile' }
} as const

type DeviceType = keyof typeof deviceSizes

export function DesignPreview({ settings, className = '' }: DesignPreviewProps) {
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const siteId = useSiteId()
  
  // Generate CSS variables from theme settings
  const generateCSSVariables = (theme: ThemeSettings): string => {
    const { colors, typography, layout } = theme
    
    // Font size scales
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }
    
    return `
      :root {
        /* Colors */
        --color-primary: ${colors.primary};
        --color-secondary: ${colors.secondary};
        --color-accent: ${colors.accent};
        --color-background: ${colors.background};
        --color-text: ${colors.text || '#1a1a1a'};
        
        /* Typography */
        --font-heading: '${typography.headingFont}', system-ui, sans-serif;
        --font-body: '${typography.bodyFont}', system-ui, sans-serif;
        --font-size-base: ${fontSizeMap[typography.fontSize] || '16px'};
        --font-weight-heading: ${typography.headingWeight || '700'};
        --font-weight-body: ${typography.bodyWeight || '400'};
        
        /* Layout */
        --header-style: ${layout.headerStyle};
        --footer-style: ${layout.footerStyle};
        --menu-style: ${layout.menuStyle};
        
        /* Derived colors */
        --color-primary-rgb: ${hexToRgb(colors.primary)};
        --color-secondary-rgb: ${hexToRgb(colors.secondary)};
        --color-accent-rgb: ${hexToRgb(colors.accent)};
      }
      
      body {
        background-color: var(--color-background);
        color: var(--color-text);
        font-family: var(--font-body);
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-body);
      }
      
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading);
        font-weight: var(--font-weight-heading);
        color: var(--color-primary);
      }
      
      a {
        color: var(--color-primary);
        text-decoration: none;
      }
      
      a:hover {
        color: var(--color-secondary);
      }
      
      .btn-primary {
        background-color: var(--color-primary);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
      }
      
      .btn-primary:hover {
        opacity: 0.9;
      }
      
      .btn-secondary {
        background-color: var(--color-secondary);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
      }
      
      .accent {
        color: var(--color-accent);
      }
      
      /* Layout styles based on settings */
      [data-header-style="${layout.headerStyle}"] header {
        ${getHeaderStyles(layout.headerStyle)}
      }
      
      [data-footer-style="${layout.footerStyle}"] footer {
        ${getFooterStyles(layout.footerStyle)}
      }
      
      [data-menu-style="${layout.menuStyle}"] nav {
        ${getMenuStyles(layout.menuStyle)}
      }
    `
  }
  
  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      const r = parseInt(result[1], 16)
      const g = parseInt(result[2], 16)
      const b = parseInt(result[3], 16)
      return `${r}, ${g}, ${b}`
    }
    return '0, 0, 0'
  }
  
  // Get header-specific styles
  const getHeaderStyles = (style: string): string => {
    switch (style) {
      case 'modern':
        return 'padding: 1.5rem 0; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px);'
      case 'classic':
        return 'padding: 1rem 0; background: white; border-bottom: 2px solid var(--color-primary);'
      case 'minimal':
        return 'padding: 1rem 0; background: transparent; border-bottom: 1px solid rgba(0,0,0,0.1);'
      default:
        return ''
    }
  }
  
  // Get footer-specific styles
  const getFooterStyles = (style: string): string => {
    switch (style) {
      case 'minimal':
        return 'padding: 2rem 0; background: transparent; border-top: 1px solid rgba(0,0,0,0.1);'
      case 'detailed':
        return 'padding: 3rem 0; background: var(--color-primary); color: white;'
      case 'hidden':
        return 'display: none;'
      default:
        return ''
    }
  }
  
  // Get menu-specific styles
  const getMenuStyles = (style: string): string => {
    switch (style) {
      case 'horizontal':
        return 'display: flex; gap: 2rem; align-items: center;'
      case 'vertical':
        return 'display: flex; flex-direction: column; gap: 1rem;'
      case 'sidebar':
        return 'position: fixed; left: 0; top: 0; height: 100%; width: 250px; background: white;'
      default:
        return ''
    }
  }
  
  // Inject styles into iframe
  useEffect(() => {
    if (!iframeRef.current) return
    
    const injectStyles = () => {
      const iframe = iframeRef.current
      if (!iframe?.contentDocument) return
      
      // Remove any existing injected styles
      const existingStyle = iframe.contentDocument.getElementById('design-preview-styles')
      if (existingStyle) {
        existingStyle.remove()
      }
      
      // Create and inject new style element
      const styleElement = iframe.contentDocument.createElement('style')
      styleElement.id = 'design-preview-styles'
      styleElement.textContent = generateCSSVariables(settings)
      iframe.contentDocument.head.appendChild(styleElement)
      
      // Add body attributes for layout styles
      iframe.contentDocument.body.setAttribute('data-header-style', settings.layout.headerStyle)
      iframe.contentDocument.body.setAttribute('data-footer-style', settings.layout.footerStyle)
      iframe.contentDocument.body.setAttribute('data-menu-style', settings.layout.menuStyle)
      
      // Add logo settings
      if (settings.logo) {
        iframe.contentDocument.body.setAttribute('data-logo-position', settings.logo.position)
        iframe.contentDocument.body.setAttribute('data-logo-size', settings.logo.size)
      }
    }
    
    // Handle iframe load
    const handleLoad = () => {
      setIsLoading(false)
      injectStyles()
    }
    
    iframeRef.current.addEventListener('load', handleLoad)
    
    // If already loaded, inject immediately
    if (iframeRef.current.contentDocument?.readyState === 'complete') {
      handleLoad()
    }
    
    return () => {
      iframeRef.current?.removeEventListener('load', handleLoad)
    }
  }, [settings])
  
  // Re-inject styles when settings change
  useEffect(() => {
    if (!iframeRef.current?.contentDocument) return
    
    const styleElement = iframeRef.current.contentDocument.getElementById('design-preview-styles')
    if (styleElement) {
      styleElement.textContent = generateCSSVariables(settings)
    }
  }, [settings])
  
  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true)
      iframeRef.current.src = iframeRef.current.src
    }
  }
  
  const handleOpenInNewTab = () => {
    window.open(`/preview?siteId=${siteId}`, '_blank')
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Preview</CardTitle>
          <div className="flex items-center gap-2">
            <ToggleGroup 
              value={device} 
              onValueChange={(value) => value && setDevice(value as DeviceType)}
              type="single"
            >
              <ToggleGroupItem value="desktop" aria-label="Desktop view">
                <Monitor className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="tablet" aria-label="Tablet view">
                <Tablet className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="mobile" aria-label="Mobile view">
                <Smartphone className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleOpenInNewTab}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative bg-gray-100 overflow-hidden" style={{ height: '600px' }}>
          <div 
            className={`
              mx-auto transition-all duration-300 bg-white shadow-xl
              ${device === 'desktop' ? 'w-full h-full' : ''}
              ${device === 'tablet' ? 'w-[768px] h-full max-w-full' : ''}
              ${device === 'mobile' ? 'w-[375px] h-full max-w-full' : ''}
            `}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading preview...</p>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={`/?preview=true&siteId=${siteId}`}
              className="w-full h-full border-0"
              title="Design Preview"
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}