import { HeaderCustomizationProps, BrandingType } from '../types'
import { BrandingElement, ActionIcons, HamburgerMenu } from './shared'

interface MinimalPreviewProps extends Pick<HeaderCustomizationProps, 'value' | 'colors' | 'typography'> {
  selectedNavItems: string[]
  logoSize: number[]
  brandingType: BrandingType
}

export function MinimalPreview(props: MinimalPreviewProps) {
  const { colors } = props

  return (
    <div className="flex items-center justify-between">
      <BrandingElement {...props} />
      <div className="flex items-center gap-3">
        <ActionIcons colors={colors} />
        <HamburgerMenu colors={colors} />
      </div>
    </div>
  )
}