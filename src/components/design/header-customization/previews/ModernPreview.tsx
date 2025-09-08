import { HeaderCustomizationProps, BrandingType } from '../types'
import { BrandingElement, NavigationItems, ActionIcons, CtaButton, HamburgerMenu } from './shared'

interface ModernPreviewProps extends Pick<HeaderCustomizationProps, 'value' | 'colors' | 'typography'> {
  selectedNavItems: string[]
  logoSize: number[]
  brandingType: BrandingType
}

export function ModernPreview(props: ModernPreviewProps) {
  const { value, colors, typography, selectedNavItems } = props

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <BrandingElement {...props} />
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-4 text-sm items-center" style={{ fontFamily: typography?.bodyFont || 'Inter' }}>
          <NavigationItems selectedNavItems={selectedNavItems} colors={colors} typography={typography} />
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {/* Desktop Icons */}
        <div className="hidden md:flex items-center gap-3">
          <ActionIcons colors={colors} />
          <CtaButton value={value} colors={colors} />
        </div>
        {/* Mobile Menu Drawer */}
        <div className="md:hidden flex items-center gap-2">
          <ActionIcons colors={colors} />
          <HamburgerMenu colors={colors} />
        </div>
      </div>
    </div>
  )
}