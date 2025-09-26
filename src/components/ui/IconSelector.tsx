'use client';

import * as React from 'react';
import * as LucideIcons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, ChevronDown, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconOption {
  name: string;
  component: LucideIcons.LucideIcon;
  keywords?: string[];
}

interface IconSelectorProps {
  value?: string;
  onChange?: (iconName: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  iconSize?: number;
  maxResults?: number;
}

// Common icon categories for content sections
const ICON_CATEGORIES = {
  common: [
    'Home', 'User', 'Users', 'Settings', 'Search', 'Bell', 'Heart', 'Star',
    'Mail', 'Phone', 'Calendar', 'Clock', 'MapPin', 'Camera', 'Image'
  ],
  navigation: [
    'Menu', 'X', 'ChevronLeft', 'ChevronRight', 'ChevronUp', 'ChevronDown',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ExternalLink'
  ],
  actions: [
    'Plus', 'Minus', 'Edit', 'Trash2', 'Save', 'Download', 'Upload',
    'Copy', 'Cut', 'Paste', 'RefreshCw', 'RotateCcw', 'Check', 'CheckCheck'
  ],
  business: [
    'Briefcase', 'DollarSign', 'CreditCard', 'ShoppingBag', 'ShoppingCart',
    'Package', 'Truck', 'Building', 'Store', 'TrendingUp', 'BarChart'
  ],
  communication: [
    'MessageCircle', 'MessageSquare', 'Send', 'Reply', 'Share',
    'ThumbsUp', 'ThumbsDown', 'Flag', 'BookOpen', 'FileText'
  ],
  values: [
    'Award', 'BookOpen', 'Globe', 'Leaf', 'Shield', 'Target',
    'Zap', 'Compass', 'Lightbulb', 'Rocket', 'Trophy', 'Sparkles'
  ]
};

// Get all available icons and create searchable list
const getAllIcons = (): IconOption[] => {
  console.log('🔍 getAllIcons - Starting icon collection...');
  console.log('🔍 getAllIcons - LucideIcons keys:', Object.keys(LucideIcons).slice(0, 10));

  const iconList: IconOption[] = [];

  // Get all category icons first
  Object.entries(ICON_CATEGORIES).forEach(([category, iconNames]) => {
    console.log(`🔍 getAllIcons - Processing category ${category}:`, iconNames);
    iconNames.forEach(iconName => {
      const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[iconName];
      console.log(`🔍 getAllIcons - Checking ${iconName}:`, IconComponent ? 'Found' : 'NOT FOUND', typeof IconComponent);
      console.log(`🔍 getAllIcons - ${iconName} details:`, {
        exists: !!IconComponent,
        type: typeof IconComponent,
        isFunction: typeof IconComponent === 'function',
        isObject: typeof IconComponent === 'object',
        constructor: IconComponent?.constructor?.name
      });
      if (IconComponent && (typeof IconComponent === 'function' || typeof IconComponent === 'object')) {
        iconList.push({
          name: iconName,
          component: IconComponent,
          keywords: [category, iconName.toLowerCase()]
        });
      }
    });
  });

  // Add additional commonly used icons
  const additionalIcons = [
    'Eye', 'EyeOff', 'Wind', 'Brain', 'Flame', 'Snowflake', 'Sun', 'Moon',
    'Mountain', 'Flower', 'TreePine', 'Waves', 'Smile', 'Frown', 'Meh'
  ];

  additionalIcons.forEach(iconName => {
    // Skip if already in our list
    if (iconList.some(icon => icon.name === iconName)) return;

    const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[iconName];
    if (IconComponent && (typeof IconComponent === 'function' || typeof IconComponent === 'object')) {
      iconList.push({
        name: iconName,
        component: IconComponent,
        keywords: [iconName.toLowerCase()]
      });
    }
  });

  return iconList.sort((a, b) => a.name.localeCompare(b.name));
};

export function IconSelector({
  value = '',
  onChange,
  label,
  placeholder = "Search icons...",
  className,
  disabled = false,
  iconSize = 20,
  maxResults = 50
}: IconSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [allIcons] = React.useState<IconOption[]>(() => {
    const icons = getAllIcons();
    console.log('🔍 IconSelector - getAllIcons() returned:', icons.length, 'icons');
    console.log('🔍 IconSelector - first few icons:', icons.slice(0, 5).map(i => i.name));
    return icons;
  });

  // DEBUG: Log what value we receive
  console.log('🔍 IconSelector - received value:', value, typeof value);

  const filteredIcons = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return allIcons.slice(0, maxResults);
    }

    const query = searchQuery.toLowerCase();
    const filtered = allIcons.filter(icon => {
      return (
        icon.name.toLowerCase().includes(query) ||
        icon.keywords?.some(keyword => keyword.includes(query))
      );
    });

    return filtered.slice(0, maxResults);
  }, [searchQuery, allIcons, maxResults]);

  const handleIconSelect = React.useCallback((iconName: string) => {
    onChange?.(iconName);
    setIsOpen(false);
    setSearchQuery('');
  }, [onChange]);

  const renderIconButton = () => {
    console.log('🔍 renderIconButton - Looking for icon with value:', value);
    console.log('🔍 renderIconButton - Available icon names:', allIcons.map(i => i.name).slice(0, 10));
    const icon = allIcons.find(i => i.name === value);
    console.log('🔍 renderIconButton - Found icon:', icon ? icon.name : 'NOT FOUND');
    if (!icon) {
      return (
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-start"
          >
            <Package className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-gray-500">No icon</span>
            <ChevronDown className="h-4 w-4 opacity-50 ml-auto" />
          </Button>
        </PopoverTrigger>
      );
    }

    const IconComponent = icon.component;

    return (
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-start"
        >
          <IconComponent size={iconSize} className="mr-2" />
          <span className="flex-1 text-left">{value}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
    );
  };

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <Label className="text-xs text-gray-500">
          {label}
        </Label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        {renderIconButton()}

        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="text-xs text-gray-500 px-1">
              {filteredIcons.length} {filteredIcons.length === 1 ? 'icon' : 'icons'}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>

            <ScrollArea className="h-64">
              <div className="grid grid-cols-4 gap-1 p-1">
                {filteredIcons.map((icon) => {
                  const IconComponent = icon.component;
                  const isSelected = value === icon.name;

                  return (
                    <Button
                      key={icon.name}
                      type="button"
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-12 w-full flex-col gap-1 p-1",
                        isSelected && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => handleIconSelect(icon.name)}
                      title={icon.name}
                    >
                      <IconComponent size={iconSize} />
                      <span className="text-xs truncate w-full">
                        {icon.name}
                      </span>
                    </Button>
                  );
                })}
              </div>

              {filteredIcons.length === 0 && (
                <div className="flex items-center justify-center h-32 text-sm text-gray-500">
                  No icons found
                </div>
              )}
            </ScrollArea>

            {value && (
              <div className="border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleIconSelect('')}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}