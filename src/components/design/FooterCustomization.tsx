'use client'

import { Label } from '@/src/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Switch } from '@/src/components/ui/switch'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { Textarea } from '@/src/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Card, CardContent } from '@/src/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/src/components/ui/collapsible'
import { ThemeSettings, FooterColumn, SocialLink } from '@/src/lib/queries/domains/theme'
import {
  Layout,
  Plus,
  Trash2,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Globe,
  Mail,
  Eye,
  ChevronDown,
  ChevronUp,
  Share2,
  MessageSquare,
  Copyright,
  Navigation,
  ExternalLink
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useDebounceCallback } from '@/src/hooks/useDebounce'
import { cn } from '@/src/lib/utils'
import { toast } from 'sonner'
import { ButtonLinkField } from '@/src/components/content-editor/editors/shared/ButtonLinkField'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { getCustomerSiteFullUrl } from '@/src/lib/site/url-utils'

interface FooterCustomizationProps {
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

const FOOTER_STYLES = [
  { 
    value: 'minimal', 
    label: 'Minimal', 
    description: 'Simple footer with basic info'
  },
  { 
    value: 'comprehensive', 
    label: 'Comprehensive', 
    description: 'Full footer with multiple columns'
  },
  { 
    value: 'centered', 
    label: 'Centered', 
    description: 'Centered layout with focus on brand'
  },
]

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'Twitter', icon: Twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'website', label: 'Website', icon: Globe },
]

const FOOTER_NAVIGATION_OPTIONS = [
  { value: 'products', label: 'Products', required: false },
  { value: 'home', label: 'Home', required: false },
  { value: 'about', label: 'About', required: false },
  { value: 'contact', label: 'Contact', required: false },
  { value: 'blog', label: 'Blog', required: false },
]


const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Quick Links',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Blog', href: '/blog' },
      { label: 'Events', href: '/events' },
    ]
  },
  {
    title: 'Customer Service',
    links: [
      { label: 'Track Order', href: '/track-order' },
      { label: 'Returns', href: '/returns' },
      { label: 'Shipping', href: '/shipping' },
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ]
  }
]

// Footer link item component with clickable preview
function FooterLinkItem({
  link,
  onRemove
}: {
  link: { label: string; href: string }
  onRemove: () => void
}) {
  const { currentSite } = useSiteContext()

  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!currentSite) {
      toast.error('Site information not available')
      return
    }

    // Check if internal or external
    const isExternal = link.href.startsWith('http://') || link.href.startsWith('https://')

    if (isExternal) {
      // External link - just open it
      window.open(link.href, '_blank')
    } else {
      // Internal link - build customer site URL
      const baseUrl = getCustomerSiteFullUrl(currentSite)
      const pageUrl = !link.href || link.href === '/' ? baseUrl : `${baseUrl}${link.href}`
      window.open(pageUrl, '_blank')
    }
  }

  return (
    <div className="flex items-center justify-between text-sm bg-muted/50 rounded p-2">
      <span className="font-medium">{link.label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleLinkClick}
          className="group flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          title="Open link in new tab"
        >
          <span>{link.href}</span>
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function FooterCustomization({ value, colors, typography, onChange }: FooterCustomizationProps) {
  const [previewOpen, setPreviewOpen] = useState(true)
  const [styleOpen, setStyleOpen] = useState(true)
  const [columnsOpen, setColumnsOpen] = useState(true)
  const [navigationOpen, setNavigationOpen] = useState(true)
  const [socialOpen, setSocialOpen] = useState(true)
  const [copyrightOpen, setCopyrightOpen] = useState(true)
  
  const [editingColumn, setEditingColumn] = useState<number | null>(null)
  const [newLink, setNewLink] = useState({ label: '', href: '' })
  const [newSocialLink, setNewSocialLink] = useState({ platform: 'facebook', url: '' })
  const [selectedFooterNavItems, setSelectedFooterNavItems] = useState<string[]>(['home', 'about', 'contact'])
  const [localCopyright, setLocalCopyright] = useState('')

  const footerColumns = value.footer?.columns || DEFAULT_FOOTER_COLUMNS
  const socialLinks = value.footer?.socialLinks || []
  
  // Initialize footer navigation items from saved settings
  useEffect(() => {
    if (value.footer?.navigationItems) {
      const savedItems = value.footer.navigationItems
        .map(item => item.label.toLowerCase())
        .filter(label => ['products', 'home', 'about', 'contact', 'blog'].includes(label))
      setSelectedFooterNavItems(savedItems.length > 0 ? savedItems : ['home', 'about', 'contact'])
    } else {
      setSelectedFooterNavItems(['home', 'about', 'contact'])
    }
  }, [value.footer?.navigationItems])

  // Initialize local copyright state from saved settings
  useEffect(() => {
    setLocalCopyright(value.footer?.copyright || `© ${new Date().getFullYear()} Your Company. All rights reserved.`)
  }, [value.footer?.copyright])

  // Debounced handler for copyright changes to prevent spam
  const debouncedCopyrightChange = useDebounceCallback((copyrightText: string) => {
    const newSettings = {
      ...value,
      footer: {
        ...value.footer,
        style: value.footer?.style || 'comprehensive',
        columns: footerColumns,
        socialLinks: socialLinks,
        navigationItems: value.footer?.navigationItems || selectedFooterNavItems.map(item => ({ label: item, href: `/${item === 'products' ? 'products' : item}` })),
        copyright: copyrightText
      }
    }
    onChange(newSettings)
    toast.success('Footer copyright updated')
  }, 1000)

  const handleFooterChange = (key: string, val: any) => {
    const newSettings = {
      ...value,
      footer: {
        ...value.footer,
        style: value.footer?.style || 'comprehensive',
        columns: footerColumns,
        socialLinks: socialLinks,
        navigationItems: value.footer?.navigationItems || selectedFooterNavItems.map(item => ({ label: item, href: `/${item === 'products' ? 'products' : item}` })),
        copyright: value.footer?.copyright || '',
        [key]: val
      }
    }
    onChange(newSettings)
    
    // Specific notification based on what changed
    if (key === 'style') {
      const styleName = FOOTER_STYLES.find(s => s.value === val)?.label || val
      toast.success(`Footer style changed to ${styleName}`)
    } else {
      toast.success('Footer settings updated')
    }
  }
  
  const toggleFooterNavItem = (item: string) => {
    const newItems = selectedFooterNavItems.includes(item) 
      ? selectedFooterNavItems.filter(i => i !== item)
      : [...selectedFooterNavItems, item]
    
    setSelectedFooterNavItems(newItems)
    
    // Save navigation changes immediately
    const navigationItems = newItems.map(navItem => ({ 
      label: navItem, 
      href: `/${navItem === 'products' ? 'products' : navItem}` 
    }))
    
    // Update navigation items with specific notification
    const newSettings = {
      ...value,
      footer: {
        ...value.footer,
        style: value.footer?.style || 'comprehensive',
        columns: footerColumns,
        socialLinks: socialLinks,
        navigationItems: navigationItems,
        copyright: value.footer?.copyright || ''
      }
    }
    onChange(newSettings)
    
    const action = selectedFooterNavItems.includes(item) ? 'removed' : 'added'
    const itemName = item.charAt(0).toUpperCase() + item.slice(1)
    toast.success(`${itemName} ${action} from footer navigation`)
  }

  const updateColumn = (index: number, column: FooterColumn) => {
    const newColumns = [...footerColumns]
    newColumns[index] = column
    const newSettings = {
      ...value,
      footer: {
        ...value.footer,
        style: value.footer?.style || 'comprehensive',
        columns: newColumns,
        socialLinks: socialLinks,
        navigationItems: value.footer?.navigationItems || selectedFooterNavItems.map(item => ({ label: item, href: `/${item === 'products' ? 'products' : item}` })),
        copyright: value.footer?.copyright || ''
      }
    }
    onChange(newSettings)
    toast.success(`Footer column "${column.title}" updated`)
  }

  const addColumn = () => {
    const newColumns = [...footerColumns, { title: 'New Column', links: [] }]
    const newSettings = {
      ...value,
      footer: {
        ...value.footer,
        style: value.footer?.style || 'comprehensive',
        columns: newColumns,
        socialLinks: socialLinks,
        navigationItems: value.footer?.navigationItems || selectedFooterNavItems.map(item => ({ label: item, href: `/${item === 'products' ? 'products' : item}` })),
        copyright: value.footer?.copyright || ''
      }
    }
    onChange(newSettings)
    toast.success('New footer column added')
    setEditingColumn(newColumns.length - 1)
  }

  const removeColumn = (index: number) => {
    const columnTitle = footerColumns[index]?.title || 'Column'
    const newColumns = footerColumns.filter((_, i) => i !== index)
    const newSettings = {
      ...value,
      footer: {
        ...value.footer,
        style: value.footer?.style || 'comprehensive',
        columns: newColumns,
        socialLinks: socialLinks,
        navigationItems: value.footer?.navigationItems || selectedFooterNavItems.map(item => ({ label: item, href: `/${item === 'products' ? 'products' : item}` })),
        copyright: value.footer?.copyright || ''
      }
    }
    onChange(newSettings)
    toast.success(`Footer column "${columnTitle}" removed`)
  }

  const addLinkToColumn = (columnIndex: number) => {
    if (!newLink.label || !newLink.href) return
    
    const column = footerColumns[columnIndex]
    const updatedColumn = {
      ...column,
      links: [...column.links, newLink]
    }
    updateColumn(columnIndex, updatedColumn)
    setNewLink({ label: '', href: '' })
  }

  const removeLinkFromColumn = (columnIndex: number, linkIndex: number) => {
    const column = footerColumns[columnIndex]
    const updatedColumn = {
      ...column,
      links: column.links.filter((_, i) => i !== linkIndex)
    }
    updateColumn(columnIndex, updatedColumn)
  }

  const addSocialLink = () => {
    if (!newSocialLink.url) return
    
    const newLinks = [...socialLinks, newSocialLink]
    const newSettings = {
      ...value,
      footer: {
        ...value.footer,
        style: value.footer?.style || 'comprehensive',
        columns: footerColumns,
        socialLinks: newLinks,
        navigationItems: value.footer?.navigationItems || selectedFooterNavItems.map(item => ({ label: item, href: `/${item === 'products' ? 'products' : item}` })),
        copyright: value.footer?.copyright || ''
      }
    }
    onChange(newSettings)
    
    const platformName = SOCIAL_PLATFORMS.find(p => p.value === newSocialLink.platform)?.label || newSocialLink.platform
    toast.success(`${platformName} social link added`)
    setNewSocialLink({ platform: 'facebook', url: '' })
  }

  const removeSocialLink = (index: number) => {
    const socialLink = socialLinks[index]
    const platformName = SOCIAL_PLATFORMS.find(p => p.value === socialLink?.platform)?.label || 'Social'
    const newLinks = socialLinks.filter((_, i) => i !== index)
    const newSettings = {
      ...value,
      footer: {
        ...value.footer,
        style: value.footer?.style || 'comprehensive',
        columns: footerColumns,
        socialLinks: newLinks,
        navigationItems: value.footer?.navigationItems || selectedFooterNavItems.map(item => ({ label: item, href: `/${item === 'products' ? 'products' : item}` })),
        copyright: value.footer?.copyright || ''
      }
    }
    onChange(newSettings)
    toast.success(`${platformName} social link removed`)
  }


  return (
    <Card className="border-0 shadow-none">
      <CardContent className="px-0 space-y-6">
        {/* Footer Preview Section */}
        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Footer Preview
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
              <div className="text-xs opacity-60 mb-2 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Live Preview
              </div>
              
              {/* Footer preview based on selected style */}
              <div className="border-t pt-4 space-y-4" style={{ borderColor: colors?.primary + '20' || '#2563eb20' }}>
                {value.footer?.style === 'comprehensive' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {footerColumns.slice(0, 3).map((column, index) => (
                        <div key={index} className="space-y-2">
                          <h4 className="font-semibold text-sm" style={{ color: colors?.primary || '#2563eb' }}>
                            {column.title}
                          </h4>
                          <ul className="space-y-1">
                            {column.links.slice(0, 3).map((link, linkIndex) => (
                              <li key={linkIndex}>
                                <span className="text-xs hover:opacity-70 cursor-default transition-opacity"
                                      style={{ color: colors?.secondary || '#6b7280' }}>
                                  {link.label}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    {/* Bottom section with copyright and social icons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: colors?.primary + '20' || '#2563eb20' }}>
                      <p className="text-xs" style={{ color: '#6b7280' }}>
                        {value.footer?.copyright || `© ${new Date().getFullYear()} Your Company. All rights reserved.`}
                      </p>
                      <div className="flex items-center gap-4">
                        {socialLinks.slice(0, 4).map((social, index) => {
                          const platform = SOCIAL_PLATFORMS.find(p => p.value === social.platform)
                          const IconComponent = platform?.icon || Globe
                          return (
                            <IconComponent key={index} className="w-5 h-5 hover:opacity-70 cursor-default transition-opacity"
                                         style={{ color: colors?.secondary || '#d97706' }} />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {value.footer?.style === 'minimal' && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm" style={{ color: '#6b7280' }}>
                      {value.footer?.copyright || `© ${new Date().getFullYear()} Your Company. All rights reserved.`}
                    </p>
                    <div className="flex items-center gap-4">
                      {socialLinks.slice(0, 4).map((social, index) => {
                        const platform = SOCIAL_PLATFORMS.find(p => p.value === social.platform)
                        const IconComponent = platform?.icon || Globe
                        return (
                          <IconComponent key={index} className="w-5 h-5 hover:opacity-70 cursor-default transition-opacity"
                                       style={{ color: colors?.secondary || '#d97706' }} />
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {value.footer?.style === 'centered' && (
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-center gap-6 text-sm">
                        {selectedFooterNavItems.includes('home') && (
                          <span className="hover:opacity-70 cursor-default transition-opacity"
                                style={{ color: colors?.secondary || '#6b7280' }}>Home</span>
                        )}
                        {selectedFooterNavItems.includes('products') && (
                          <span className="hover:opacity-70 cursor-default transition-opacity"
                                style={{ color: colors?.secondary || '#6b7280' }}>Products</span>
                        )}
                        {selectedFooterNavItems.includes('about') && (
                          <span className="hover:opacity-70 cursor-default transition-opacity"
                                style={{ color: colors?.secondary || '#6b7280' }}>About</span>
                        )}
                        {selectedFooterNavItems.includes('contact') && (
                          <span className="hover:opacity-70 cursor-default transition-opacity"
                                style={{ color: colors?.secondary || '#6b7280' }}>Contact</span>
                        )}
                        {selectedFooterNavItems.includes('blog') && (
                          <span className="hover:opacity-70 cursor-default transition-opacity"
                                style={{ color: colors?.secondary || '#6b7280' }}>Blog</span>
                        )}
                      </div>
                      <div className="flex justify-center gap-4">
                        {socialLinks.slice(0, 4).map((social, index) => {
                          const platform = SOCIAL_PLATFORMS.find(p => p.value === social.platform)
                          const IconComponent = platform?.icon || Globe
                          return (
                            <IconComponent key={index} className="h-4 w-4 hover:opacity-70 cursor-default transition-opacity"
                                         style={{ color: colors?.primary || '#2563eb' }} />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Copyright - only show for centered style */}
                {value.footer?.style === 'centered' && (
                  <div className="border-t pt-3 text-center text-xs" style={{ borderColor: colors?.primary + '20' || '#2563eb20', color: colors?.text + '80' || '#1f293780' }}>
                    {value.footer?.copyright || `© ${new Date().getFullYear()} Your Company. All rights reserved.`}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Footer Style Section */}
        <Collapsible open={styleOpen} onOpenChange={setStyleOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Footer Style
              </Label>
              {styleOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <RadioGroup
              value={value.footer?.style || 'comprehensive'}
              onValueChange={(val) => handleFooterChange('style', val)}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {FOOTER_STYLES.map((style) => (
                  <Card 
                    key={style.value}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95",
                      value.footer?.style === style.value ? "ring-2 ring-primary ring-offset-2" : ""
                    )}
                    onClick={() => handleFooterChange('style', style.value)}
                  >
                    <CardContent className="p-4">
                      <RadioGroupItem value={style.value} className="sr-only" />
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">{style.label}</span>
                          <p className="text-sm text-muted-foreground">{style.description}</p>
                        </div>

                        {/* Visual Preview */}
                        <div className="h-16 rounded border bg-gray-50 p-2 flex flex-col justify-between">
                          {style.value === 'minimal' && (
                            <div className="flex items-center justify-between h-full">
                              <div className="flex gap-0.5">
                                <div className="w-8 h-0.5 bg-gray-300 rounded"></div>
                                <div className="w-6 h-0.5 bg-gray-300 rounded"></div>
                              </div>
                              <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                              </div>
                            </div>
                          )}
                          {style.value === 'comprehensive' && (
                            <>
                              {/* Three columns at top */}
                              <div className="flex gap-2 flex-1">
                                <div className="flex-1 space-y-0.5">
                                  <div className="w-full h-0.5 bg-primary rounded"></div>
                                  <div className="w-3/4 h-0.5 bg-gray-300 rounded"></div>
                                  <div className="w-3/4 h-0.5 bg-gray-300 rounded"></div>
                                </div>
                                <div className="flex-1 space-y-0.5">
                                  <div className="w-full h-0.5 bg-primary rounded"></div>
                                  <div className="w-3/4 h-0.5 bg-gray-300 rounded"></div>
                                  <div className="w-3/4 h-0.5 bg-gray-300 rounded"></div>
                                </div>
                                <div className="flex-1 space-y-0.5">
                                  <div className="w-full h-0.5 bg-primary rounded"></div>
                                  <div className="w-3/4 h-0.5 bg-gray-300 rounded"></div>
                                  <div className="w-3/4 h-0.5 bg-gray-300 rounded"></div>
                                </div>
                              </div>
                              {/* Bottom bar */}
                              <div className="border-t pt-1 flex items-center justify-between">
                                <div className="w-8 h-0.5 bg-gray-300 rounded"></div>
                                <div className="flex gap-1">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                </div>
                              </div>
                            </>
                          )}
                          {style.value === 'centered' && (
                            <div className="flex flex-col items-center justify-center gap-1 h-full">
                              {/* Centered nav links */}
                              <div className="flex gap-1">
                                <div className="w-3 h-0.5 bg-gray-300 rounded"></div>
                                <div className="w-3 h-0.5 bg-gray-300 rounded"></div>
                                <div className="w-3 h-0.5 bg-gray-300 rounded"></div>
                              </div>
                              {/* Centered social icons */}
                              <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                              </div>
                              {/* Centered copyright */}
                              <div className="border-t pt-1 mt-1 w-full flex justify-center">
                                <div className="w-8 h-0.5 bg-gray-300 rounded"></div>
                              </div>
                            </div>
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

        {/* Footer Navigation Section (for centered style) */}
        {value.footer?.style === 'centered' && (
          <Collapsible open={navigationOpen} onOpenChange={setNavigationOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto hover:bg-transparent"
              >
                <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Footer Navigation
                </Label>
                {navigationOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-4">
              <div className="text-sm text-muted-foreground">
                Select the pages to display in your footer:
              </div>
              
              <div className="space-y-2">
                {FOOTER_NAVIGATION_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`footer-${option.value}`}
                      checked={selectedFooterNavItems.includes(option.value)}
                      onChange={() => toggleFooterNavItem(option.value)}
                      disabled={option.required}
                      className="rounded border-gray-300"
                    />
                    <Label 
                      htmlFor={`footer-${option.value}`} 
                      className="text-sm"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Footer Columns Section */}
        {value.footer?.style === 'comprehensive' && (
          <Collapsible open={columnsOpen} onOpenChange={setColumnsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto hover:bg-transparent"
              >
                <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Footer Columns
                </Label>
                {columnsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Organize links into columns</Label>
                <Button size="sm" onClick={addColumn}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Column
                </Button>
              </div>
              
              <div className="space-y-4">
                {footerColumns.map((column, columnIndex) => (
                  <Card key={columnIndex} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      {editingColumn === columnIndex ? (
                        <Input
                          value={column.title}
                          onChange={(e) => updateColumn(columnIndex, { ...column, title: e.target.value })}
                          className="flex-1 mr-2"
                        />
                      ) : (
                        <h4 className="font-medium">{column.title}</h4>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingColumn(editingColumn === columnIndex ? null : columnIndex)}
                        >
                          {editingColumn === columnIndex ? 'Done' : 'Edit'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeColumn(columnIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Column Links */}
                    <div className="space-y-2">
                      {column.links.map((link, linkIndex) => (
                        <FooterLinkItem
                          key={linkIndex}
                          link={link}
                          onRemove={() => removeLinkFromColumn(columnIndex, linkIndex)}
                        />
                      ))}
                      
                      {/* Add new link */}
                      {editingColumn === columnIndex && (
                        <div className="flex flex-col gap-2 pt-2 border-t">
                          <Input
                            placeholder="Link label"
                            value={newLink.label}
                            onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                          />
                          <div className="flex gap-2">
                            <ButtonLinkField
                              value={newLink.href}
                              onChange={(href) => setNewLink({ ...newLink, href })}
                              placeholder="Select page or enter URL"
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => addLinkToColumn(columnIndex)}
                              disabled={!newLink.label || !newLink.href}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Social Media Links Section */}
        <Collapsible open={socialOpen} onOpenChange={setSocialOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Social Media Links
              </Label>
              {socialOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            <Label className="text-sm text-muted-foreground">Add social media links to your footer</Label>
            
            <div className="space-y-3">
              {socialLinks.map((link, index) => {
                const platform = SOCIAL_PLATFORMS.find(p => p.value === link.platform)
                const IconComponent = platform?.icon || Globe
                return (
                  <Card key={index} className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-32">
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm font-medium">{platform?.label}</span>
                      </div>
                      <Input value={link.url} disabled className="flex-1" />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSocialLink(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )
              })}
              
              {/* Add new social link */}
              <Card className="p-3 border-dashed">
                <div className="flex gap-2">
                  <Select
                    value={newSocialLink.platform}
                    onValueChange={(val) => setNewSocialLink({ ...newSocialLink, platform: val })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          <div className="flex items-center gap-2">
                            <platform.icon className="h-4 w-4" />
                            {platform.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="URL (e.g., https://facebook.com/yourpage)"
                    value={newSocialLink.url}
                    onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={addSocialLink}
                    disabled={!newSocialLink.url}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Copyright Section */}
        <Collapsible open={copyrightOpen} onOpenChange={setCopyrightOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                <Copyright className="h-4 w-4" />
                Copyright Text
              </Label>
              {copyrightOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-2">
            <Label className="text-sm text-muted-foreground">Add your copyright notice</Label>
            <Textarea
              placeholder={`© ${new Date().getFullYear()} Your Company. All rights reserved.`}
              value={localCopyright}
              onChange={(e) => {
                setLocalCopyright(e.target.value)
                debouncedCopyrightChange(e.target.value)
              }}
              rows={2}
              className="resize-none"
            />
          </CollapsibleContent>
        </Collapsible>

      </CardContent>
    </Card>
  )
}