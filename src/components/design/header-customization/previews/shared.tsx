import { Search, ShoppingCart } from 'lucide-react'
import { HeaderCustomizationProps, BrandingType } from '../types'
import { NavigationItem } from '@/src/lib/queries/domains/theme'

interface SharedPreviewProps extends Pick<HeaderCustomizationProps, 'value' | 'colors' | 'typography'> {
  selectedNavItems: string[]
  logoSize: number[]
  brandingType: BrandingType
}

export function BrandingElement({ value, colors, typography, logoSize, brandingType }: SharedPreviewProps) {
  return (
    <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-default">
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

export function NavigationItems({ value, colors, typography }: Pick<SharedPreviewProps, 'value' | 'colors' | 'typography'>) {
  // Get navigation items from theme settings, sorted and filtered by visibility
  const navItems = ((value.navigation?.items || []) as NavigationItem[])
    .filter(item => item.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <>
      {navItems.map((item) => (
        <span
          key={item.id}
          className="hover:opacity-70 cursor-default transition-opacity"
          style={{ color: colors?.secondary || '#6b7280' }}
        >
          {item.label}
        </span>
      ))}
    </>
  )
}

export function ActionIcons({ colors }: Pick<SharedPreviewProps, 'colors'>) {
  return (
    <>
      <Search className="h-4 w-4 hover:opacity-70 transition-opacity cursor-default" style={{ color: colors?.text || '#1f2937' }} />
      <ShoppingCart className="h-4 w-4 hover:opacity-70 transition-opacity cursor-default" style={{ color: colors?.text || '#1f2937' }} />
    </>
  )
}

export function CtaButton({ value, colors }: Pick<SharedPreviewProps, 'value' | 'colors'>) {
  if (!value.layout?.ctaButton?.enabled || !value.layout?.ctaButton?.text) return null

  return (
    <button
      className="px-3 py-1 text-sm rounded hover:opacity-90 transition-opacity cursor-default"
      style={{ backgroundColor: colors?.primary || '#2563eb', color: '#fff' }}
    >
      {value.layout.ctaButton.text}
    </button>
  )
}

export function HamburgerMenu({ colors }: Pick<SharedPreviewProps, 'colors'>) {
  return (
    <div className="w-6 h-5 flex flex-col gap-1 items-center justify-center cursor-default hover:opacity-70 transition-opacity">
      <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
      <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
      <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: colors?.text || '#1f2937' }}></div>
    </div>
  )
}