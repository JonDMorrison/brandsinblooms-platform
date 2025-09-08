import { useState, useEffect } from 'react'
import { useDebounceCallback } from '@/src/hooks/useDebounce'
import { toast } from 'sonner'
import { ThemeSettings } from '@/src/lib/queries/domains/theme'
import { BrandingType } from './types'

export function useHeaderCustomizationState(value: ThemeSettings, onChange: (settings: ThemeSettings) => void) {
  const [selectedNavItems, setSelectedNavItems] = useState<string[]>([])
  const [localCtaButton, setLocalCtaButton] = useState({ text: '', href: '' })
  const [localBrandText, setLocalBrandText] = useState('')
  const [logoSize, setLogoSize] = useState([100])
  const [brandingType, setBrandingType] = useState<BrandingType>('text')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Initialize local state from saved theme settings
  useEffect(() => {
    if (value) {
      // Initialize branding type
      if (value.logo?.displayType) {
        setBrandingType(value.logo.displayType)
      } else {
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
      
      // Initialize logo size
      if (value.logo?.pixelSize) {
        setLogoSize([value.logo.pixelSize])
      }
      
      // Initialize navigation items
      if (value.navigation?.items) {
        const savedItems = value.navigation.items
          .filter(item => ['Home', 'About', 'Contact', 'Blog'].includes(item.label))
          .map(item => item.label.toLowerCase())
        setSelectedNavItems(savedItems.length > 0 ? savedItems : ['home', 'about', 'contact'])
      } else {
        setSelectedNavItems(['home', 'about', 'contact'])
      }
      
      // Initialize CTA button
      setLocalCtaButton({
        text: value.layout?.ctaButton?.text || '',
        href: value.layout?.ctaButton?.href || ''
      })
      
      // Initialize brand text
      setLocalBrandText(value.logo?.text || '')
    }
  }, [value])

  // Debounced handlers
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

  const debouncedLogoSizeChange = useDebounceCallback((size: number) => {
    onChange({
      ...value,
      logo: {
        ...value.logo,
        pixelSize: size
      }
    })
    toast.success(`Logo size updated to ${size}px`)
  }, 300)

  const debouncedBrandTextChange = useDebounceCallback((text: string) => {
    onChange({
      ...value,
      logo: {
        ...value.logo,
        text: text
      }
    })
    toast.success(`Brand text updated to "${text}"`)
  }, 500)

  return {
    selectedNavItems,
    setSelectedNavItems,
    localCtaButton,
    setLocalCtaButton,
    localBrandText,
    setLocalBrandText,
    logoSize,
    setLogoSize,
    brandingType,
    setBrandingType,
    isUploadModalOpen,
    setIsUploadModalOpen,
    isUploading,
    setIsUploading,
    uploadProgress,
    setUploadProgress,
    debouncedCtaChange,
    debouncedLogoSizeChange,
    debouncedBrandTextChange
  }
}