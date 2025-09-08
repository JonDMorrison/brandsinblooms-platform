'use client'

import { Card, CardContent } from '@/src/components/ui/card'
import { HeaderCustomizationProps } from './types'
import { useHeaderCustomizationState } from './hooks'
import { HeaderPreviewSection } from './HeaderPreviewSection'
import { BrandingSection } from './BrandingSection'
import { HeaderStyleSection } from './HeaderStyleSection'
import { NavigationSection } from './NavigationSection'
import { CtaSection } from './CtaSection'

export function HeaderCustomization({ value, colors, typography, onChange }: HeaderCustomizationProps) {
  const state = useHeaderCustomizationState(value, onChange)

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="px-0 space-y-6">
        <HeaderPreviewSection 
          value={value}
          colors={colors}
          typography={typography}
          selectedNavItems={state.selectedNavItems}
          logoSize={state.logoSize}
          brandingType={state.brandingType}
        />

        <BrandingSection
          value={value}
          onChange={onChange}
          localBrandText={state.localBrandText}
          setLocalBrandText={state.setLocalBrandText}
          logoSize={state.logoSize}
          setLogoSize={state.setLogoSize}
          brandingType={state.brandingType}
          setBrandingType={state.setBrandingType}
          isUploadModalOpen={state.isUploadModalOpen}
          setIsUploadModalOpen={state.setIsUploadModalOpen}
          isUploading={state.isUploading}
          setIsUploading={state.setIsUploading}
          uploadProgress={state.uploadProgress}
          setUploadProgress={state.setUploadProgress}
          debouncedBrandTextChange={state.debouncedBrandTextChange}
          debouncedLogoSizeChange={state.debouncedLogoSizeChange}
        />

        <HeaderStyleSection
          value={value}
          onChange={onChange}
        />

        <NavigationSection
          value={value}
          onChange={onChange}
          selectedNavItems={state.selectedNavItems}
          setSelectedNavItems={state.setSelectedNavItems}
        />

        <CtaSection
          value={value}
          onChange={onChange}
          localCtaButton={state.localCtaButton}
          setLocalCtaButton={state.setLocalCtaButton}
          debouncedCtaChange={state.debouncedCtaChange}
        />
      </CardContent>
    </Card>
  )
}