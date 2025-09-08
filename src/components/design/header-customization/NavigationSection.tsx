'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/src/components/ui/collapsible'
import { toast } from 'sonner'
import { HeaderCustomizationProps } from './types'
import { NAVIGATION_OPTIONS } from './constants'

interface NavigationSectionProps extends Pick<HeaderCustomizationProps, 'value' | 'onChange'> {
  selectedNavItems: string[]
  setSelectedNavItems: (items: string[]) => void
}

export function NavigationSection({ value, onChange, selectedNavItems, setSelectedNavItems }: NavigationSectionProps) {
  const [navigationOpen, setNavigationOpen] = useState(true)

  const toggleNavItem = (item: string) => {
    const newItems = selectedNavItems.includes(item) 
      ? selectedNavItems.filter(i => i !== item)
      : [...selectedNavItems, item]
    
    setSelectedNavItems(newItems)
    
    onChange({
      ...value,
      navigation: {
        ...value.navigation,
        items: newItems.map(item => ({ 
          label: item.charAt(0).toUpperCase() + item.slice(1), 
          href: `/${item}` 
        })),
        style: value.navigation?.style || 'horizontal'
      }
    })
    
    const action = selectedNavItems.includes(item) ? 'removed' : 'added'
    const itemName = item.charAt(0).toUpperCase() + item.slice(1)
    toast.success(`${itemName} ${action} from header navigation`)
  }

  return (
    <Collapsible open={navigationOpen} onOpenChange={setNavigationOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto hover:bg-transparent"
        >
          <Label className="text-base font-semibold cursor-pointer">Navigation Menu</Label>
          {navigationOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-4">
        <div className="text-sm text-gray-600">
          Products, Search, and Cart are always visible. Select optional pages:
        </div>
        
        <div className="space-y-2">
          {NAVIGATION_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={option.value}
                checked={selectedNavItems.includes(option.value)}
                onChange={() => toggleNavItem(option.value)}
                className="rounded border-gray-300"
              />
              <Label htmlFor={option.value} className="text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}