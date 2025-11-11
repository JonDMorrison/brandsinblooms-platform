'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/src/components/ui/collapsible'
import { toast } from 'sonner'
import { HeaderCustomizationProps } from './types'
import { NavigationLinksEditor } from './NavigationLinksEditor'
import { ButtonLinkField } from '@/src/components/content-editor/editors/shared/ButtonLinkField'
import { NavigationItem, getDefaultNavigationItems } from '@/src/lib/queries/domains/theme'

interface NavigationSectionProps extends Pick<HeaderCustomizationProps, 'value' | 'onChange'> {
  selectedNavItems: string[]
  setSelectedNavItems: (items: string[]) => void
}

export function NavigationSection({ value, onChange }: NavigationSectionProps) {
  const [navigationOpen, setNavigationOpen] = useState(true)
  const [ctaButtonOpen, setCtaButtonOpen] = useState(false)

  // Initialize navigation items with defaults if empty
  const navigationItems = value.navigation?.items || []
  const hasNavItems = navigationItems.length > 0

  // Initialize with defaults on first render if no items exist
  useEffect(() => {
    if (!hasNavItems) {
      const defaultItems = getDefaultNavigationItems()
      onChange({
        ...value,
        navigation: {
          ...value.navigation,
          items: defaultItems,
          style: value.navigation?.style || 'horizontal'
        }
      })
    }
  }, []) // Only run once on mount

  // Handle navigation items change
  const handleNavigationItemsChange = (items: NavigationItem[]) => {
    onChange({
      ...value,
      navigation: {
        ...value.navigation,
        items,
        style: value.navigation?.style || 'horizontal'
      }
    })
    toast.success('Navigation updated')
  }

  // Handle CTA button toggle
  const handleCtaToggle = (enabled: boolean) => {
    onChange({
      ...value,
      layout: {
        ...value.layout,
        ctaButton: {
          ...value.layout.ctaButton,
          enabled,
          text: value.layout.ctaButton?.text || 'Get Started',
          href: value.layout.ctaButton?.href || '/',
          type: value.layout.ctaButton?.type || 'internal',
          variant: value.layout.ctaButton?.variant || 'primary'
        }
      }
    })
  }

  // Handle CTA button field changes
  const handleCtaChange = (field: 'text' | 'href' | 'variant', newValue: string) => {
    const type = field === 'href' && (newValue.startsWith('http://') || newValue.startsWith('https://'))
      ? 'external'
      : (field === 'href' ? 'internal' : value.layout.ctaButton?.type || 'internal')

    onChange({
      ...value,
      layout: {
        ...value.layout,
        ctaButton: {
          enabled: value.layout.ctaButton?.enabled || false,
          text: field === 'text' ? newValue : (value.layout.ctaButton?.text || 'Get Started'),
          href: field === 'href' ? newValue : (value.layout.ctaButton?.href || '/'),
          type,
          variant: field === 'variant'
            ? (newValue as 'primary' | 'secondary' | 'accent')
            : (value.layout.ctaButton?.variant || 'primary')
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Navigation Links Section */}
      <Collapsible open={navigationOpen} onOpenChange={setNavigationOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-0 h-auto hover:bg-transparent"
          >
            <Label className="text-base font-semibold cursor-pointer">Navigation Links</Label>
            {navigationOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <NavigationLinksEditor
            items={navigationItems}
            onChange={handleNavigationItemsChange}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* CTA Button Section */}
      <Collapsible open={ctaButtonOpen} onOpenChange={setCtaButtonOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-0 h-auto hover:bg-transparent"
          >
            <Label className="text-base font-semibold cursor-pointer">CTA Button (Optional)</Label>
            {ctaButtonOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-4">
          {/* Enable/Disable toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cta-enabled"
              checked={value.layout.ctaButton?.enabled || false}
              onChange={(e) => handleCtaToggle(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="cta-enabled" className="text-sm">
              Show CTA button in header
            </Label>
          </div>

          {/* CTA configuration (only show when enabled) */}
          {value.layout.ctaButton?.enabled && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              {/* Button text */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Button Text
                </Label>
                <Input
                  type="text"
                  value={value.layout.ctaButton?.text || ''}
                  onChange={(e) => handleCtaChange('text', e.target.value)}
                  className="h-8"
                  placeholder="e.g., Get Started, Shop Now"
                />
              </div>

              {/* Button link */}
              <ButtonLinkField
                value={value.layout.ctaButton?.href || '/'}
                onChange={(newValue) => handleCtaChange('href', newValue)}
                label="Button Link"
                placeholder="Select page or enter URL"
              />

              {/* Button variant */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Button Style
                </Label>
                <select
                  value={value.layout.ctaButton?.variant || 'primary'}
                  onChange={(e) => handleCtaChange('variant', e.target.value)}
                  className="w-full h-8 px-3 text-sm border border-input bg-background rounded-md"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="accent">Accent</option>
                </select>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}