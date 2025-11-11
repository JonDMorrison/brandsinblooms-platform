import { HeaderCustomizationProps, BrandingType } from '../types'
import { BrandingElement, NavigationItems, ActionIcons, CtaButton, HamburgerMenu } from './shared'

interface ClassicPreviewProps extends Pick<HeaderCustomizationProps, 'value' | 'colors' | 'typography'> {
  selectedNavItems: string[]
  logoSize: number[]
  brandingType: BrandingType
}

export function ClassicPreview(props: ClassicPreviewProps) {
  const { value, colors, typography, logoSize, brandingType } = props

  return (
    <div className="space-y-3">
      {/* Desktop Layout */}
      <div className="hidden md:block text-center space-y-3">
        <div className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
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
          <NavigationItems value={value} colors={colors} typography={typography} />
          <ActionIcons colors={colors} />
        </nav>
        <CtaButton value={value} colors={colors} />
      </div>
      
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <BrandingElement {...props} />
          <div className="flex items-center gap-2">
            <ActionIcons colors={colors} />
            <HamburgerMenu colors={colors} />
          </div>
        </div>
      </div>
    </div>
  )
}