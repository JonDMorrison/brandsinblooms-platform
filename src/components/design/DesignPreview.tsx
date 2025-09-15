'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group'
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink } from 'lucide-react'
import { ThemeSettings } from '@/src/lib/queries/domains/theme'
import { useSiteId, useCurrentSite } from '@/contexts/SiteContext'
import { useThemeCSS } from '@/hooks/useThemeCSS'

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

/**
 * Constructs the preview URL for the current site based on environment
 */
function getPreviewUrl(site: any): string {
  // Get environment configuration
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

  if (!site) {
    // Fallback to app URL if no site context
    return appUrl
  }

  try {
    const url = new URL(appUrl)

    // If site has a custom domain, use it
    if (site.custom_domain) {
      return `${url.protocol}//${site.custom_domain}`
    }

    // Otherwise, construct subdomain URL based on environment
    if (site.subdomain) {
      // Extract base domain from app URL
      const hostname = url.hostname

      // Handle different environment patterns
      if (hostname === 'localhost' || hostname.includes('localhost')) {
        // Development: subdomain.localhost:port
        return `${url.protocol}//${site.subdomain}.localhost${url.port ? ':' + url.port : ''}`
      } else if (hostname.includes('blooms-staging.cc')) {
        // Staging: subdomain.blooms-staging.cc
        return `${url.protocol}//${site.subdomain}.blooms-staging.cc`
      } else {
        // Production: subdomain.domain.com
        return `${url.protocol}//${site.subdomain}.${hostname}`
      }
    }

    // Fallback to app URL
    return appUrl
  } catch (error) {
    console.error('Error constructing preview URL:', error)
    return appUrl
  }
}

export function DesignPreview({ settings, className = '' }: DesignPreviewProps) {
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const siteId = useSiteId()
  const { site } = useCurrentSite()

  // Use centralized theme CSS generation with iframe mode
  const { fullCSS } = useThemeCSS(settings, 'iframe')

  // Get dynamic preview URL based on current site and environment
  const previewUrl = getPreviewUrl(site)
  
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
      styleElement.textContent = fullCSS
      iframe.contentDocument.head.appendChild(styleElement)
      
      // Add body attributes for iframe mode and layout styles
      iframe.contentDocument.body.setAttribute('data-preview-mode', 'iframe')
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
  }, [settings, fullCSS])
  
  // Re-inject styles when settings change (debounced for performance)
  useEffect(() => {
    if (!iframeRef.current?.contentDocument) return
    
    const debounceTimer = setTimeout(() => {
      const iframe = iframeRef.current
      if (!iframe?.contentDocument) return
      
      const styleElement = iframe.contentDocument.getElementById('design-preview-styles')
      if (styleElement) {
        styleElement.textContent = fullCSS
        
        // Update body attributes for new settings
        iframe.contentDocument.body.setAttribute('data-preview-mode', 'iframe')
        iframe.contentDocument.body.setAttribute('data-header-style', settings.layout.headerStyle)
        iframe.contentDocument.body.setAttribute('data-footer-style', settings.layout.footerStyle)
        iframe.contentDocument.body.setAttribute('data-menu-style', settings.layout.menuStyle)
        
        if (settings.logo) {
          iframe.contentDocument.body.setAttribute('data-logo-position', settings.logo.position)
          iframe.contentDocument.body.setAttribute('data-logo-size', settings.logo.size)
        }
      }
    }, 150) // 150ms debounce for better performance
    
    return () => clearTimeout(debounceTimer)
  }, [settings, fullCSS])
  
  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true)
      iframeRef.current.src = iframeRef.current.src
    }
  }
  
  const handleOpenInNewTab = () => {
    window.open(previewUrl, '_blank')
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
              src={previewUrl}
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