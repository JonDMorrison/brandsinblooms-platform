'use client'

import { Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/src/components/ui/collapsible'
import { HeaderCustomizationProps, BrandingType } from './types'
import { ModernPreview } from './previews/ModernPreview'
import { ClassicPreview } from './previews/ClassicPreview'
import { MinimalPreview } from './previews/MinimalPreview'

interface HeaderPreviewSectionProps extends Pick<HeaderCustomizationProps, 'value' | 'colors' | 'typography'> {
  selectedNavItems: string[]
  logoSize: number[]
  brandingType: BrandingType
}

export function HeaderPreviewSection({ 
  value, 
  colors, 
  typography, 
  selectedNavItems, 
  logoSize, 
  brandingType 
}: HeaderPreviewSectionProps) {
  const [previewOpen, setPreviewOpen] = useState(true)

  return (
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
          <div className="border rounded p-3 space-y-2 transition-all duration-200" style={{ borderColor: colors?.primary + '20' || '#2563eb20' }}>
            <div className="text-xs opacity-60 mb-2 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Live Preview
            </div>
            
            {value.layout?.headerStyle === 'modern' && (
              <ModernPreview 
                value={value}
                colors={colors}
                typography={typography}
                selectedNavItems={selectedNavItems}
                logoSize={logoSize}
                brandingType={brandingType}
              />
            )}
            
            {value.layout?.headerStyle === 'classic' && (
              <ClassicPreview 
                value={value}
                colors={colors}
                typography={typography}
                selectedNavItems={selectedNavItems}
                logoSize={logoSize}
                brandingType={brandingType}
              />
            )}
            
            {value.layout?.headerStyle === 'minimal' && (
              <MinimalPreview 
                value={value}
                colors={colors}
                typography={typography}
                selectedNavItems={selectedNavItems}
                logoSize={logoSize}
                brandingType={brandingType}
              />
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}