'use client'

import { Label } from '@/src/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Switch } from '@/src/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { ThemeSettings, NavigationItem } from '@/src/lib/queries/domains/theme'
import { 
  Layout, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Menu,
  ChevronDown,
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/src/lib/utils'

interface HeaderCustomizationProps {
  value: ThemeSettings
  onChange: (settings: ThemeSettings) => void
}

const HEADER_STYLES = [
  { value: 'modern', label: 'Modern', description: 'Clean and minimal design' },
  { value: 'classic', label: 'Classic', description: 'Traditional navigation layout' },
  { value: 'minimal', label: 'Minimal', description: 'Ultra-simple header' },
]

const MENU_STYLES = [
  { value: 'horizontal', label: 'Horizontal', icon: AlignJustify },
  { value: 'sidebar', label: 'Sidebar', icon: Menu },
  { value: 'hamburger', label: 'Hamburger', icon: Menu },
  { value: 'mega', label: 'Mega Menu', icon: ChevronDown },
]

const LOGO_POSITIONS = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight },
]

const HEADER_HEIGHTS = [
  { value: 'compact', label: 'Compact (56px)' },
  { value: 'normal', label: 'Normal (64px)' },
  { value: 'tall', label: 'Tall (80px)' },
]

export function HeaderCustomization({ value, onChange }: HeaderCustomizationProps) {
  const [editingNavItem, setEditingNavItem] = useState<number | null>(null)
  const [newNavItem, setNewNavItem] = useState({ label: '', href: '' })

  const navigationItems = value.navigation?.items || []

  const handleLayoutChange = (key: string, val: any) => {
    onChange({
      ...value,
      layout: {
        ...value.layout,
        [key]: val
      }
    })
  }

  const handleNavigationChange = (items: NavigationItem[]) => {
    onChange({
      ...value,
      navigation: {
        ...value.navigation,
        items,
        style: value.navigation?.style || 'horizontal'
      }
    })
  }

  const addNavigationItem = () => {
    if (!newNavItem.label || !newNavItem.href) return
    
    const newItems = [...navigationItems, newNavItem]
    handleNavigationChange(newItems)
    setNewNavItem({ label: '', href: '' })
  }

  const removeNavigationItem = (index: number) => {
    const newItems = navigationItems.filter((_, i) => i !== index)
    handleNavigationChange(newItems)
  }

  const updateNavigationItem = (index: number, item: NavigationItem) => {
    const newItems = [...navigationItems]
    newItems[index] = item
    handleNavigationChange(newItems)
  }

  const moveNavigationItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...navigationItems]
    const [removed] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, removed)
    handleNavigationChange(newItems)
  }

  return (
    <div className="space-y-8">
      {/* Header Style */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-muted-foreground" />
          <Label className="text-base font-semibold">Header Style</Label>
        </div>
        <RadioGroup
          value={value.layout?.headerStyle || 'modern'}
          onValueChange={(val) => handleLayoutChange('headerStyle', val)}
        >
          <div className="grid grid-cols-3 gap-4">
            {HEADER_STYLES.map((style) => (
              <label
                key={style.value}
                className={cn(
                  "relative flex flex-col gap-2 rounded-lg border-2 p-4 cursor-pointer hover:bg-accent/50 transition-colors",
                  value.layout?.headerStyle === style.value ? "border-primary bg-accent/20" : "border-border"
                )}
              >
                <RadioGroupItem value={style.value} className="sr-only" />
                <span className="font-medium">{style.label}</span>
                <span className="text-xs text-muted-foreground">{style.description}</span>
              </label>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Logo Position */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Logo Position</Label>
        <RadioGroup
          value={value.logo?.position || 'left'}
          onValueChange={(val) => onChange({
            ...value,
            logo: { ...value.logo, position: val as 'left' | 'center' | 'right' }
          })}
        >
          <div className="flex gap-2">
            {LOGO_POSITIONS.map((position) => (
              <label
                key={position.value}
                className={cn(
                  "flex items-center justify-center p-3 rounded-md border-2 cursor-pointer hover:bg-accent transition-colors",
                  value.logo?.position === position.value ? "border-primary bg-accent" : "border-border"
                )}
              >
                <RadioGroupItem value={position.value} className="sr-only" />
                <position.icon className="h-4 w-4" />
              </label>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Menu Style */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Menu Style</Label>
        <RadioGroup
          value={value.layout?.menuStyle || 'horizontal'}
          onValueChange={(val) => handleLayoutChange('menuStyle', val)}
        >
          <div className="grid grid-cols-2 gap-3">
            {MENU_STYLES.map((style) => (
              <label
                key={style.value}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-md border-2 cursor-pointer hover:bg-accent transition-colors",
                  value.layout?.menuStyle === style.value ? "border-primary bg-accent" : "border-border"
                )}
              >
                <RadioGroupItem value={style.value} className="sr-only" />
                <style.icon className="h-4 w-4" />
                <span className="text-sm">{style.label}</span>
              </label>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Header Height */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Header Height</Label>
        <Select
          value={value.layout?.headerHeight || 'normal'}
          onValueChange={(val) => handleLayoutChange('headerHeight', val)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HEADER_HEIGHTS.map((height) => (
              <SelectItem key={height.value} value={height.value}>
                {height.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Header Options */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Header Options</Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="sticky-header" className="text-sm font-normal">
              Sticky Header
            </Label>
            <Switch
              id="sticky-header"
              checked={value.layout?.stickyHeader !== false}
              onCheckedChange={(checked) => handleLayoutChange('stickyHeader', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="transparent-header" className="text-sm font-normal">
              Transparent Header
            </Label>
            <Switch
              id="transparent-header"
              checked={value.layout?.transparentHeader === true}
              onCheckedChange={(checked) => handleLayoutChange('transparentHeader', checked)}
            />
          </div>
        </div>
      </div>

      {/* Navigation Menu Items */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Navigation Menu Items</Label>
        <div className="space-y-2">
          {navigationItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-md border bg-background"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
              {editingNavItem === index ? (
                <>
                  <Input
                    value={item.label}
                    onChange={(e) => updateNavigationItem(index, { ...item, label: e.target.value })}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Input
                    value={item.href}
                    onChange={(e) => updateNavigationItem(index, { ...item, href: e.target.value })}
                    placeholder="URL"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingNavItem(null)}
                  >
                    Done
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{item.label}</span>
                  <span className="text-sm text-muted-foreground">{item.href}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingNavItem(index)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeNavigationItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
          
          {/* Add new item form */}
          <div className="flex gap-2 p-2 rounded-md border border-dashed">
            <Input
              value={newNavItem.label}
              onChange={(e) => setNewNavItem({ ...newNavItem, label: e.target.value })}
              placeholder="Menu label"
              className="flex-1"
            />
            <Input
              value={newNavItem.href}
              onChange={(e) => setNewNavItem({ ...newNavItem, href: e.target.value })}
              placeholder="URL (e.g., /products)"
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={addNavigationItem}
              disabled={!newNavItem.label || !newNavItem.href}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* CTA Button Configuration */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Call-to-Action Button</Label>
        <div className="space-y-3">
          <Input
            placeholder="Button text (e.g., Shop Now)"
            value={value.layout?.ctaButton?.text || ''}
            onChange={(e) => handleLayoutChange('ctaButton', { 
              ...value.layout?.ctaButton, 
              text: e.target.value 
            })}
          />
          <Input
            placeholder="Button URL (e.g., /products)"
            value={value.layout?.ctaButton?.href || ''}
            onChange={(e) => handleLayoutChange('ctaButton', { 
              ...value.layout?.ctaButton, 
              href: e.target.value 
            })}
          />
          <Select
            value={value.layout?.ctaButton?.variant || 'default'}
            onValueChange={(val) => handleLayoutChange('ctaButton', { 
              ...value.layout?.ctaButton, 
              variant: val 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Button style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="ghost">Ghost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}