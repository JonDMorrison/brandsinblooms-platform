'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/src/components/ui/collapsible'
import { toast } from 'sonner'
import { HeaderCustomizationProps } from './types'
import { NavigationLinksEditor } from './NavigationLinksEditor'
import { NavigationItem, getDefaultNavigationItems } from '@/src/lib/queries/domains/theme'

interface NavigationSectionProps extends Pick<HeaderCustomizationProps, 'value' | 'onChange'> {
  selectedNavItems: string[]
  setSelectedNavItems: (items: string[]) => void
}

export function NavigationSection({ value, onChange }: NavigationSectionProps) {
  const [navigationOpen, setNavigationOpen] = useState(true)

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

  return (
    <div>
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
    </div>
  )
}