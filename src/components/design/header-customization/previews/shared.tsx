import { Search, ShoppingCart } from 'lucide-react'
import { HeaderCustomizationProps, BrandingType } from '../types'

interface SharedPreviewProps extends Pick<HeaderCustomizationProps, 'value' | 'colors' | 'typography'> {
  selectedNavItems: string[]
  logoSize: number[]
  brandingType: BrandingType
}

export function BrandingElement({ value, colors, typography, logoSize, brandingType }: SharedPreviewProps) {
  return (
    <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
      {(brandingType === 'logo' || brandingType === 'both') && value.logo?.url && (
        <img 
          src={value.logo.url} 
          alt="Logo" 
          className="object-contain"
          style={{ height: `${logoSize[0]}px` }}
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
  )
}

export function NavigationItems({ selectedNavItems, colors, typography }: Pick<SharedPreviewProps, 'selectedNavItems' | 'colors' | 'typography'>) {
  const ecommerceEnabled = process.env.NEXT_PUBLIC_ENABLE_ECOMMERCE === 'true'

  return (
    <>
      {selectedNavItems.includes('home') && <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.secondary || '#6b7280' }}>Home</span>}
      {ecommerceEnabled && <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.secondary || '#6b7280' }}>Products</span>}
      {selectedNavItems.includes('about') && <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.secondary || '#6b7280' }}>About</span>}
      {selectedNavItems.includes('contact') && <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.secondary || '#6b7280' }}>Contact</span>}
      {selectedNavItems.includes('blog') && <span className="hover:opacity-70 cursor-pointer transition-opacity" style={{ color: colors?.secondary || '#6b7280' }}>Blog</span>}
    </>
  )
}

export function ActionIcons({ colors }: Pick<SharedPreviewProps, 'colors'>) {
  const ecommerceEnabled = process.env.NEXT_PUBLIC_ENABLE_ECOMMERCE === 'true'

  if (!ecommerceEnabled) return null

  return (
    <>
      <Search className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" style={{ color: colors?.text || '#1f2937' }} />
      <ShoppingCart className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" style={{ color: colors?.text || '#1f2937' }} />
    </>
  )
}

export function CtaButton({ value, colors }: Pick<SharedPreviewProps, 'value' | 'colors'>) {
  if (!value.layout?.ctaButton?.text) return null
  
  return (
    <button 
      className="px-3 py-1 text-sm rounded hover:opacity-90 transition-opacity cursor-pointer"
      style={{ backgroundColor: colors?.primary || '#2563eb', color: '#fff' }}
    >
      {value.layout.ctaButton.text}
    </button>
  )
}

export function HamburgerMenu({ colors }: Pick<SharedPreviewProps, 'colors'>) {
  return (
    <div className="w-6 h-5 flex flex-col gap-1 items-center justify-center cursor-pointer hover:opacity-70 transition-opacity">
      <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
      <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
      <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
    </div>
  )
}