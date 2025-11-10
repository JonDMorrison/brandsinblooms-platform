'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group'
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink } from 'lucide-react'
import { ThemeSettings } from '@/src/lib/queries/domains/theme'
import { useSiteId, useCurrentSite } from '@/contexts/SiteContext'
import { useThemeCSS } from '@/hooks/useThemeCSS'
import { getAppDomain } from '@/src/lib/env/app-domain'

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
  // 🔍 COMPREHENSIVE ENVIRONMENT VARIABLE DEBUGGING
  console.log('[IFRAME_DEBUG] Environment Variables Analysis:', {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_DOMAIN: getAppDomain(),
    NODE_ENV: process.env.NODE_ENV,
    allNextPublicVars: Object.keys(process.env || {}).filter(key => key.startsWith('NEXT_PUBLIC_')),
    allEnvVarsCount: Object.keys(process.env || {}).length,
    processEnvExists: typeof process !== 'undefined' && !!process.env
  });

  // 🔍 WINDOW LOCATION ANALYSIS
  const windowLocationData = typeof window !== 'undefined' ? {
    href: window.location.href,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    port: window.location.port,
    pathname: window.location.pathname,
    isLocalhost: window.location.hostname === 'localhost',
    isStaging: window.location.hostname.includes('blooms-staging.cc'),
    isVercel: window.location.hostname.includes('.vercel.app'),
    isRailway: window.location.hostname.includes('.railway.app'),
    proposedFallbackUrl: `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`
  } : 'SSR_MODE';

  console.log('[IFRAME_DEBUG] Window Location Analysis:', windowLocationData);

  // Get environment configuration with dynamic fallback
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`
      : 'http://localhost:3001')

  // 🔍 URL CONSTRUCTION DECISION LOGGING
  console.log('[IFRAME_DEBUG] URL Construction Decision:', {
    useEnvVar: !!process.env.NEXT_PUBLIC_APP_URL,
    useDynamicFallback: !process.env.NEXT_PUBLIC_APP_URL && typeof window !== 'undefined',
    useStaticFallback: !process.env.NEXT_PUBLIC_APP_URL && typeof window === 'undefined',
    selectedAppUrl: appUrl,
    envVarValue: process.env.NEXT_PUBLIC_APP_URL,
    dynamicFallbackSource: typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}` : 'SSR_MODE',
    staticFallbackValue: 'http://localhost:3001'
  });

  console.log('[IFRAME_DEBUG] getPreviewUrl - Starting URL construction:', {
    site,
    appUrl,
    envAppUrl: process.env.NEXT_PUBLIC_APP_URL,
    hasCustomDomain: !!site?.custom_domain,
    hasSubdomain: !!site?.subdomain,
    subdomain: site?.subdomain
  });

  if (!site) {
    console.log('[IFRAME_DEBUG] getPreviewUrl - No site provided, using app URL:', appUrl);
    // Fallback to app URL if no site context
    return appUrl
  }

  try {
    const url = new URL(appUrl)
    console.log('[IFRAME_DEBUG] getPreviewUrl - Parsed app URL:', {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port
    });

    // If site has a custom domain, use it
    if (site.custom_domain) {
      const customUrl = `${url.protocol}//${site.custom_domain}`;
      console.log('[IFRAME_DEBUG] getPreviewUrl - Using custom domain:', customUrl);
      return customUrl;
    }

    // Otherwise, construct subdomain URL based on environment
    if (site.subdomain) {
      // Extract base domain from app URL
      const hostname = url.hostname

      console.log('[IFRAME_DEBUG] getPreviewUrl - Constructing subdomain URL for:', {
        subdomain: site.subdomain,
        hostname,
        isLocalhost: hostname === 'localhost' || hostname.includes('localhost'),
        isStaging: hostname.includes('blooms-staging.cc')
      });

      // Handle different environment patterns
      if (hostname === 'localhost' || hostname.includes('localhost')) {
        // Development: subdomain.localhost:port
        const devUrl = `${url.protocol}//${site.subdomain}.localhost${url.port ? ':' + url.port : ''}`;
        console.log('[IFRAME_DEBUG] getPreviewUrl - Development URL constructed:', devUrl);

        // 🔍 DEVELOPMENT URL RESULT ANALYSIS
        console.log('[IFRAME_DEBUG] Final URL Construction Result:', {
          finalUrl: devUrl,
          urlSource: 'development_subdomain',
          isCorrectForEnvironment: true,
          environmentDetected: 'localhost'
        });

        // Add preview mode query parameter for iframe embedding security
        const devUrlWithPreview = `${devUrl}?_preview_mode=iframe&_dashboard_origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : 'unknown')}`;
        return devUrlWithPreview;
      } else if (hostname.includes('blooms-staging.cc')) {
        // Staging: subdomain.blooms-staging.cc
        const stagingUrl = `${url.protocol}//${site.subdomain}.blooms-staging.cc`;
        console.log('[IFRAME_DEBUG] getPreviewUrl - Staging URL constructed:', stagingUrl);

        // 🔍 STAGING URL RESULT ANALYSIS
        console.log('[IFRAME_DEBUG] Final URL Construction Result:', {
          finalUrl: stagingUrl,
          urlSource: 'staging_subdomain',
          isCorrectForEnvironment: true,
          environmentDetected: 'blooms-staging.cc',
          shouldFixCSP: stagingUrl !== appUrl,
          expectedInCSP: stagingUrl
        });

        // Add preview mode query parameter for iframe embedding security
        const stagingUrlWithPreview = `${stagingUrl}?_preview_mode=iframe&_dashboard_origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : 'unknown')}`;
        return stagingUrlWithPreview;
      } else {
        // Production: subdomain.domain.com
        const prodUrl = `${url.protocol}//${site.subdomain}.${hostname}`;
        console.log('[IFRAME_DEBUG] getPreviewUrl - Production URL constructed:', prodUrl);

        // 🔍 PRODUCTION URL RESULT ANALYSIS
        console.log('[IFRAME_DEBUG] Final URL Construction Result:', {
          finalUrl: prodUrl,
          urlSource: 'production_subdomain',
          isCorrectForEnvironment: true,
          environmentDetected: hostname
        });

        // Add preview mode query parameter for iframe embedding security
        const prodUrlWithPreview = `${prodUrl}?_preview_mode=iframe&_dashboard_origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : 'unknown')}`;
        return prodUrlWithPreview;
      }
    }

    // Fallback to app URL
    console.log('[IFRAME_DEBUG] getPreviewUrl - No subdomain, falling back to app URL:', appUrl);

    // 🔍 FINAL URL RESULT ANALYSIS
    console.log('[IFRAME_DEBUG] Final URL Construction Result:', {
      finalUrl: appUrl,
      urlSource: 'fallback_no_subdomain',
      expectedForStaging: typeof window !== 'undefined' && window.location.hostname.includes('blooms-staging.cc')
        ? `https://dev.blooms-staging.cc`
        : 'N/A',
      urlIsCorrectForEnvironment: typeof window !== 'undefined'
        ? appUrl.includes(window.location.hostname.includes('blooms-staging.cc') ? 'blooms-staging.cc' : 'localhost')
        : 'SSR_MODE'
    });

    return appUrl
  } catch (error) {
    console.error('[IFRAME_DEBUG] getPreviewUrl - Error constructing preview URL:', error)

    // 🔍 ERROR FALLBACK ANALYSIS
    console.log('[IFRAME_DEBUG] Error Fallback Result:', {
      finalUrl: appUrl,
      urlSource: 'error_fallback',
      error: error instanceof Error ? error.message : String(error)
    });

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

  // Detect if component should fill full height (used in modal)
  const isFullHeight = className.includes('h-full')
  
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
    <Card className={`${className} ${isFullHeight ? 'flex flex-col' : ''}`}>
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
      <CardContent className={`p-0 ${isFullHeight ? 'flex-1 overflow-hidden' : ''}`}>
        <div
          className={`relative bg-gray-100 overflow-hidden ${isFullHeight ? 'h-full' : ''}`}
          style={isFullHeight ? undefined : { height: '600px' }}
        >
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