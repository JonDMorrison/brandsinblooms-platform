'use client'

import { Label } from '@/src/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Switch } from '@/src/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Slider } from '@/src/components/ui/slider'
import { Card, CardContent } from '@/src/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/src/components/ui/collapsible'
import { ThemeSettings, NavigationItem } from '@/src/lib/queries/domains/theme'
import { 
  Layout, 
  Plus,
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  Eye,
  Search,
  ShoppingCart,
  User
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useDebounceCallback } from '@/src/hooks/useDebounce'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { useSupabase } from '@/hooks/useSupabase'
import { useSiteId } from '@/contexts/SiteContext'
import { handleError } from '@/lib/types/error-handling'
import { toast } from 'sonner'
import { cn } from '@/src/lib/utils'

interface HeaderCustomizationProps {
  value: ThemeSettings
  colors?: {
    primary: string
    secondary: string
    accent: string
    background: string
    text?: string
  }
  typography?: {
    headingFont: string
    bodyFont: string
    fontSize: string
  }
  onChange: (settings: ThemeSettings) => void
}

const HEADER_STYLES = [
  { 
    value: 'modern', 
    label: 'Modern', 
    description: 'Clean and minimal design',
    preview: 'modern'
  },
  { 
    value: 'classic', 
    label: 'Classic', 
    description: 'Traditional navigation layout',
    preview: 'classic'
  },
  { 
    value: 'minimal', 
    label: 'Minimal', 
    description: 'Ultra-simple header',
    preview: 'minimal'
  },
]

const NAVIGATION_OPTIONS = [
  { value: 'home', label: 'Home', required: false },
  { value: 'about', label: 'About', required: false },
  { value: 'contact', label: 'Contact', required: false },
  { value: 'blog', label: 'Blog', required: false },
]

export function HeaderCustomization({ value, colors, typography, onChange }: HeaderCustomizationProps) {
  const [previewOpen, setPreviewOpen] = useState(true)
  const [logoOpen, setLogoOpen] = useState(true)
  const [headerStyleOpen, setHeaderStyleOpen] = useState(true)
  const [navigationOpen, setNavigationOpen] = useState(true)
  const [ctaOpen, setCtaOpen] = useState(true)
  
  const [selectedNavItems, setSelectedNavItems] = useState<string[]>([])
  const [localCtaButton, setLocalCtaButton] = useState({ text: '', href: '' })
  const [logoSize, setLogoSize] = useState([100])
  const [brandingType, setBrandingType] = useState<'text' | 'logo' | 'both'>('text')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = useSupabase()
  const siteId = useSiteId()

  // Initialize local state from saved theme settings
  useEffect(() => {
    if (value) {
      // Initialize branding type from saved preference or infer from data
      if (value.logo?.displayType) {
        setBrandingType(value.logo.displayType)
      } else {
        // Infer from existing data for backward compatibility
        const hasLogo = !!value.logo?.url
        const hasText = !!value.logo?.text
        if (hasLogo && hasText) {
          setBrandingType('both')
        } else if (hasLogo) {
          setBrandingType('logo')
        } else {
          setBrandingType('text')
        }
      }
      
      // Initialize logo size from saved preference
      if (value.logo?.pixelSize) {
        setLogoSize([value.logo.pixelSize])
      }
      
      // Initialize navigation items from saved navigation
      if (value.navigation?.items) {
        const savedItems = value.navigation.items
          .filter(item => ['Home', 'About', 'Contact', 'Blog'].includes(item.label))
          .map(item => item.label.toLowerCase())
        setSelectedNavItems(savedItems.length > 0 ? savedItems : ['home', 'about', 'contact'])
      } else {
        setSelectedNavItems(['home', 'about', 'contact'])
      }
      
      // Initialize local CTA button state
      setLocalCtaButton({
        text: value.layout?.ctaButton?.text || '',
        href: value.layout?.ctaButton?.href || ''
      })
    }
  }, [value])


  const handleLayoutChange = (key: string, val: any) => {
    onChange({
      ...value,
      layout: {
        ...value.layout,
        [key]: val
      }
    })
    
    // Specific notifications based on what changed
    if (key === 'headerStyle') {
      const styleName = HEADER_STYLES.find(s => s.value === val)?.label || val
      toast.success(`Header style changed to ${styleName}`)
    } else if (key === 'ctaButton') {
      if (val?.text) {
        toast.success(`CTA button updated: "${val.text}"`)
      } else {
        toast.success('CTA button updated')
      }
    }
  }

  const handleLogoChange = (key: string, val: any) => {
    onChange({
      ...value,
      logo: {
        ...value.logo,
        [key]: val
      }
    })
    
    // Specific notifications based on what changed
    if (key === 'text') {
      toast.success(`Brand text updated to "${val}"`)
    } else if (key === 'displayType') {
      const typeNames = {
        'text': 'text only',
        'logo': 'logo only', 
        'both': 'logo and text'
      }
      toast.success(`Branding display changed to ${typeNames[val] || val}`)
    } else if (key === 'pixelSize') {
      toast.success(`Logo size updated to ${val}px`)
    }
  }

  const toggleNavItem = (item: string) => {
    const newItems = selectedNavItems.includes(item) 
      ? selectedNavItems.filter(i => i !== item)
      : [...selectedNavItems, item]
    
    setSelectedNavItems(newItems)
    
    // Save navigation changes immediately
    onChange({
      ...value,
      navigation: {
        ...value.navigation,
        items: newItems.map(item => ({ 
          label: item.charAt(0).toUpperCase() + item.slice(1), 
          href: `/${item}` 
        })),
        style: value.navigation?.style || 'horizontal'
      }
    })
    
    // Show specific notification
    const action = selectedNavItems.includes(item) ? 'removed' : 'added'
    const itemName = item.charAt(0).toUpperCase() + item.slice(1)
    toast.success(`${itemName} ${action} from header navigation`)
  }

  // Debounced handler for CTA button changes to prevent spam
  const debouncedCtaChange = useDebounceCallback((field: 'text' | 'href', val: string) => {
    const newCtaButton = {
      ...value.layout?.ctaButton,
      [field]: val
    }
    onChange({
      ...value,
      layout: {
        ...value.layout,
        ctaButton: newCtaButton
      }
    })
    
    if (field === 'text') {
      toast.success(`CTA button text updated: "${val}"`)
    } else {
      toast.success('CTA button URL updated')
    }
  }, 1000)

  // Debounced handler for logo size changes to prevent spam
  const debouncedLogoSizeChange = useDebounceCallback((size: number) => {
    handleLogoChange('pixelSize', size)
  }, 300)

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB for logos)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    try {
      if (!siteId) {
        throw new Error('No site ID available')
      }

      // Request presigned URL from API
      const response = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          siteId,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Failed to get upload URL:', error)
        throw new Error('Failed to get upload URL')
      }

      const result = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error('Invalid presigned URL response')
      }
      
      const { uploadUrl, publicUrl } = result.data

      // Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('Upload failed:', uploadResponse.status, errorText)
        throw new Error(`Failed to upload file: ${uploadResponse.status}`)
      }

      setUploadProgress(100)
      
      // Update logo URL in theme settings
      handleLogoChange('url', publicUrl)
      
      toast.success('Logo uploaded successfully')
      setIsUploadModalOpen(false)
    } catch (error) {
      handleError(error)
      toast.error('Failed to upload logo')
    } finally {
      setIsUploading(false)
      clearInterval(progressInterval)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="px-0 space-y-6">
        {/* Header Preview Section */}
        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Header Preview
              </Label>
              {previewOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div 
              className="rounded-lg border p-4 space-y-4" 
              style={{ 
                backgroundColor: colors?.background || '#ffffff', 
                color: colors?.text || '#1f2937',
                fontFamily: `${typography?.bodyFont || 'Inter'}, system-ui, sans-serif`,
                fontSize: typography?.fontSize === 'small' ? '0.875rem' : typography?.fontSize === 'large' ? '1.125rem' : '1rem'
              }}
            >
              {/* Header preview based on selected style */}
              <div className="border rounded p-3 space-y-2 transition-all duration-200" style={{ borderColor: colors?.primary + '20' || '#2563eb20' }}>
                <div className="text-xs opacity-60 mb-2 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  Live Preview
                </div>
                {value.layout?.headerStyle === 'modern' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                        {(brandingType === 'logo' || brandingType === 'both') && value.logo?.url && (
                          <img 
                            src={value.logo.url} 
                            alt="Logo" 
                            className="object-contain"
                            style={{ height: `${Math.round(logoSize[0] * 0.3)}px` }}
                          />
                        )}
                        {(brandingType === 'text' || brandingType === 'both') && (
                          <div 
                            className="font-bold"
                            style={{ 
                              color: colors?.primary || '#2563eb',
                              fontFamily: typography?.headingFont || 'Inter'
                            }}
                          >
                            {value.logo?.text || 'Your Brand'}
                          </div>
                        )}
                      </div>
                      {/* Desktop Navigation */}
                      <nav className="hidden md:flex gap-4 text-sm items-center" style={{ fontFamily: typography?.bodyFont || 'Inter' }}>
                        {selectedNavItems.includes('home') && <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.text || '#1f2937' }}>Home</span>}
                        <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.text || '#1f2937' }}>Products</span>
                        {selectedNavItems.includes('about') && <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.text || '#1f2937' }}>About</span>}
                        {selectedNavItems.includes('contact') && <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.text || '#1f2937' }}>Contact</span>}
                        {selectedNavItems.includes('blog') && <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.text || '#1f2937' }}>Blog</span>}
                      </nav>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Desktop Icons */}
                      <div className="hidden md:flex items-center gap-3">
                        <Search className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" style={{ color: colors?.text || '#1f2937' }} />
                        <ShoppingCart className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" style={{ color: colors?.text || '#1f2937' }} />
                        {value.layout?.ctaButton?.text && (
                          <button 
                            className="px-3 py-1 text-sm rounded hover:opacity-90 transition-opacity cursor-pointer"
                            style={{ backgroundColor: colors?.primary || '#2563eb', color: '#fff' }}
                          >
                            {value.layout.ctaButton.text}
                          </button>
                        )}
                      </div>
                      {/* Mobile Menu Drawer */}
                      <div className="md:hidden flex items-center gap-2">
                        <Search className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" style={{ color: colors?.text || '#1f2937' }} />
                        <ShoppingCart className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" style={{ color: colors?.text || '#1f2937' }} />
                        <div className="w-5 h-4 border rounded flex flex-col gap-0.5 items-center justify-center cursor-pointer hover:opacity-70 transition-opacity">
                          <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
                          <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
                          <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {value.layout?.headerStyle === 'classic' && (
                  <div className="space-y-3">
                    {/* Desktop Layout */}
                    <div className="hidden md:block text-center space-y-3">
                      <div className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                        {(brandingType === 'logo' || brandingType === 'both') && value.logo?.url && (
                          <img 
                            src={value.logo.url} 
                            alt="Logo" 
                            className="object-contain"
                            style={{ height: `${Math.round(logoSize[0] * 0.4)}px` }}
                          />
                        )}
                        {(brandingType === 'text' || brandingType === 'both') && (
                          <div 
                            className="font-bold text-lg"
                            style={{ 
                              color: colors?.primary || '#2563eb',
                              fontFamily: typography?.headingFont || 'Inter'
                            }}
                          >
                            {value.logo?.text || 'Your Brand'}
                          </div>
                        )}
                      </div>
                      <nav className="flex justify-center gap-4 text-sm items-center" style={{ fontFamily: typography?.bodyFont || 'Inter' }}>
                        {selectedNavItems.includes('home') && <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.text || '#1f2937' }}>Home</span>}
                        <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.text || '#1f2937' }}>Products</span>
                        {selectedNavItems.includes('about') && <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.text || '#1f2937' }}>About</span>}
                        {selectedNavItems.includes('contact') && <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.text || '#1f2937' }}>Contact</span>}
                        {selectedNavItems.includes('blog') && <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.text || '#1f2937' }}>Blog</span>}
                        <Search className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" style={{ color: colors?.text || '#1f2937' }} />
                        <ShoppingCart className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" style={{ color: colors?.text || '#1f2937' }} />
                      </nav>
                      {value.layout?.ctaButton?.text && (
                        <button 
                          className="px-3 py-1 text-sm rounded hover:opacity-90 transition-opacity cursor-pointer"
                          style={{ backgroundColor: colors?.primary || '#2563eb', color: '#fff' }}
                        >
                          {value.layout.ctaButton.text}
                        </button>
                      )}
                    </div>
                    
                    {/* Mobile Layout */}
                    <div className="md:hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                          {(brandingType === 'logo' || brandingType === 'both') && value.logo?.url && (
                            <img 
                              src={value.logo.url} 
                              alt="Logo" 
                              className="object-contain"
                              style={{ height: `${Math.round(logoSize[0] * 0.3)}px` }}
                            />
                          )}
                          {(brandingType === 'text' || brandingType === 'both') && (
                            <div 
                              className="font-bold"
                              style={{ 
                                color: colors?.primary || '#2563eb',
                                fontFamily: typography?.headingFont || 'Inter'
                              }}
                            >
                              {value.logo?.text || 'Your Brand'}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" style={{ color: colors?.text || '#1f2937' }} />
                          <ShoppingCart className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" style={{ color: colors?.text || '#1f2937' }} />
                          <div className="w-5 h-4 border rounded flex flex-col gap-0.5 items-center justify-center cursor-pointer hover:opacity-70 transition-opacity">
                            <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
                            <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
                            <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {value.layout?.headerStyle === 'minimal' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                      {(brandingType === 'logo' || brandingType === 'both') && value.logo?.url && (
                        <img 
                          src={value.logo.url} 
                          alt="Logo" 
                          className="object-contain"
                          style={{ height: `${Math.round(logoSize[0] * 0.3)}px` }}
                        />
                      )}
                      {(brandingType === 'text' || brandingType === 'both') && (
                        <div 
                          className="font-bold"
                          style={{ 
                            color: colors?.primary || '#2563eb',
                            fontFamily: `${typography?.headingFont || 'Inter'}, system-ui, sans-serif`
                          }}
                        >
                          {value.logo?.text || 'Your Brand'}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Search className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" style={{ color: colors?.text || '#1f2937' }} />
                      <ShoppingCart className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" style={{ color: colors?.text || '#1f2937' }} />
                      <div className="w-5 h-4 border rounded flex flex-col gap-0.5 items-center justify-center cursor-pointer hover:opacity-70 transition-opacity">
                        <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
                        <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
                        <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Logo Section */}
        <Collapsible open={logoOpen} onOpenChange={setLogoOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Logo & Branding
              </Label>
              {logoOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Branding Display</Label>
                <RadioGroup
                  value={brandingType}
                  onValueChange={(val: 'text' | 'logo' | 'both') => {
                    setBrandingType(val)
                    handleLogoChange('displayType', val)
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95",
                      brandingType === 'text' ? "ring-2 ring-primary ring-offset-2" : ""
                    )}
                    onClick={() => {
                      setBrandingType('text')
                      handleLogoChange('displayType', 'text')
                    }}
                  >
                    <CardContent className="p-3">
                      <RadioGroupItem value="text" className="sr-only" />
                      <div className="text-center">
                        <div className="font-medium text-sm">Text Only</div>
                        <div className="text-xs text-muted-foreground mt-1">Brand name only</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95",
                      brandingType === 'logo' ? "ring-2 ring-primary ring-offset-2" : ""
                    )}
                    onClick={() => {
                      setBrandingType('logo')
                      handleLogoChange('displayType', 'logo')
                    }}
                  >
                    <CardContent className="p-3">
                      <RadioGroupItem value="logo" className="sr-only" />
                      <div className="text-center">
                        <div className="font-medium text-sm">Logo Only</div>
                        <div className="text-xs text-muted-foreground mt-1">Image logo only</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95",
                      brandingType === 'both' ? "ring-2 ring-primary ring-offset-2" : ""
                    )}
                    onClick={() => {
                      setBrandingType('both')
                      handleLogoChange('displayType', 'both')
                    }}
                  >
                    <CardContent className="p-3">
                      <RadioGroupItem value="both" className="sr-only" />
                      <div className="text-center">
                        <div className="font-medium text-sm">Logo + Text</div>
                        <div className="text-xs text-muted-foreground mt-1">Both together</div>
                      </div>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </div>
              
              {/* Brand Text - Always visible, placed above logo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Brand Text</Label>
                <Input
                  placeholder="Enter your brand name"
                  value={value.logo?.text || ''}
                  onChange={(e) => handleLogoChange('text', e.target.value)}
                />
              </div>

              {/* Logo Section - Always visible */}
              <div className="space-y-3">
                {value.logo?.url ? (
                  <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-gray-50">
                    <div 
                      className="bg-white rounded p-3 border shadow-sm flex items-center justify-center"
                      style={{ width: `${logoSize[0]}px`, height: `${Math.round(logoSize[0] * 0.6)}px` }}
                    >
                      <img 
                        src={value.logo.url} 
                        alt="Logo" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs">
                          <Upload className="h-3 w-3 mr-1" />
                          Change Logo
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Upload Logo</DialogTitle>
                          <DialogDescription>
                            Choose a new logo for your header
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {isUploading ? (
                            <div className="space-y-3 p-8 text-center">
                              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                              <p className="text-sm font-medium">Uploading... {uploadProgress}%</p>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div
                              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm font-medium">Click to upload logo</p>
                              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                    <DialogTrigger asChild>
                      <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <Upload className="h-6 w-6 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Upload Logo</p>
                            <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Upload Logo</DialogTitle>
                        <DialogDescription>
                          Choose a logo for your header
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {isUploading ? (
                          <div className="space-y-3 p-8 text-center">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-sm font-medium">Uploading... {uploadProgress}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm font-medium">Click to upload logo</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {/* Logo Size Slider - Centered and not full width */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-center block">Logo Size</Label>
                <div className="flex justify-center">
                  <div className="w-64">
                    <Slider
                      value={logoSize}
                      onValueChange={(val) => {
                        setLogoSize(val)
                        debouncedLogoSizeChange(val[0])
                      }}
                      max={200}
                      min={50}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>50px</span>
                      <span>{logoSize[0]}px</span>
                      <span>200px</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Header Style Section */}
        <Collapsible open={headerStyleOpen} onOpenChange={setHeaderStyleOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Header Style
              </Label>
              {headerStyleOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <RadioGroup
              value={value.layout?.headerStyle || 'modern'}
              onValueChange={(val) => handleLayoutChange('headerStyle', val)}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {HEADER_STYLES.map((style) => (
                  <Card 
                    key={style.value}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95",
                      value.layout?.headerStyle === style.value ? "ring-2 ring-primary ring-offset-2" : ""
                    )}
                    onClick={() => handleLayoutChange('headerStyle', style.value)}
                  >
                    <CardContent className="p-4">
                      <RadioGroupItem value={style.value} className="sr-only" />
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">{style.label}</span>
                          <p className="text-sm text-muted-foreground">{style.description}</p>
                        </div>
                        
                        {/* Visual Preview */}
                        <div className="h-12 rounded border bg-gray-50 p-2 flex items-center justify-between">
                          {style.value === 'modern' && (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-2 bg-primary rounded-sm"></div>
                                <div className="flex gap-0.5">
                                  <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                                  <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                                  <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                                </div>
                              </div>
                              <div className="w-3 h-1.5 bg-primary rounded-sm"></div>
                            </>
                          )}
                          {style.value === 'classic' && (
                            <>
                              <div className="flex flex-col items-center gap-1 flex-1">
                                <div className="w-6 h-1.5 bg-primary rounded-sm"></div>
                                <div className="flex gap-0.5">
                                  <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                                  <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                                  <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                                  <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                                </div>
                              </div>
                            </>
                          )}
                          {style.value === 'minimal' && (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-2 bg-primary rounded-sm"></div>
                              </div>
                              <div className="w-3 h-3 border border-gray-300 rounded flex items-center justify-center">
                                <div className="w-1.5 h-0.5 bg-gray-400"></div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </CollapsibleContent>
        </Collapsible>

        {/* Navigation Menu Section */}
        <Collapsible open={navigationOpen} onOpenChange={setNavigationOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer">Navigation Menu</Label>
              {navigationOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            <div className="text-sm text-gray-600">
              Products, Search, and Cart are always visible. Select optional pages:
            </div>
            
            <div className="space-y-2">
              {NAVIGATION_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={option.value}
                    checked={selectedNavItems.includes(option.value)}
                    onChange={() => toggleNavItem(option.value)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={option.value} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* CTA Button Section */}
        <Collapsible open={ctaOpen} onOpenChange={setCtaOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer">CTA Button</Label>
              {ctaOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            <Input
              placeholder="Button text (e.g., Shop Now)"
              value={localCtaButton.text}
              onChange={(e) => {
                setLocalCtaButton({ ...localCtaButton, text: e.target.value })
                debouncedCtaChange('text', e.target.value)
              }}
            />
            <Input
              placeholder="Button URL (e.g., /products)"
              value={localCtaButton.href}
              onChange={(e) => {
                setLocalCtaButton({ ...localCtaButton, href: e.target.value })
                debouncedCtaChange('href', e.target.value)
              }}
            />
          </CollapsibleContent>
        </Collapsible>

      </CardContent>
    </Card>
  )
}