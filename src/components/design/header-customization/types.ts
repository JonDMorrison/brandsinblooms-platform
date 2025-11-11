import { ThemeSettings } from '@/src/lib/queries/domains/theme'

export interface HeaderCustomizationProps {
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
  hidePreview?: boolean
}

export type BrandingType = 'text' | 'logo' | 'both'

export interface LocalState {
  selectedNavItems: string[]
  localCtaButton: { text: string; href: string }
  localBrandText: string
  logoSize: number[]
  brandingType: BrandingType
  isUploadModalOpen: boolean
  isUploading: boolean
  uploadProgress: number
}