'use client';

import * as React from 'react';
import { Controller, FieldValues, FieldPath } from 'react-hook-form';
import * as LucideIcons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, ChevronDown, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconPickerProps, IconOption } from '@/types/content-editor';

// Common icon categories with keywords for better search
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
  media: [
    'Play', 'Pause', 'Square', 'SkipBack', 'SkipForward', 'Volume2',
    'VolumeX', 'Mic', 'MicOff', 'Video', 'VideoOff', 'Music'
  ]
};

// Get all available icons and create searchable list
const getAllIcons = (): IconOption[] => {
  const iconList: IconOption[] = [];
  
  // Get all category icons first
  Object.entries(ICON_CATEGORIES).forEach(([category, iconNames]) => {
    iconNames.forEach(iconName => {
      const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[iconName];
      if (IconComponent && typeof IconComponent === 'function') {
        iconList.push({
          name: iconName,
          component: IconComponent,
          keywords: [category, iconName.toLowerCase()]
        });
      }
    });
  });
  
  // Add any additional icons that aren't in categories
  Object.keys(LucideIcons).forEach(iconName => {
    // Skip non-icon exports
    if (iconName === 'createLucideIcon' || iconName === 'Icon') return;
    
    // Skip if already in our list
    if (iconList.some(icon => icon.name === iconName)) return;
    
    const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[iconName];
    if (IconComponent && typeof IconComponent === 'function') {
      iconList.push({
        name: iconName,
        component: IconComponent,
        keywords: [iconName.toLowerCase()]
      });
    }
  });
  
  return iconList.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Icon picker component for selecting Lucide icons
 * Uses dynamic imports and search functionality to reduce bundle size
 */
function IconPickerComponent<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  placeholder = "Search icons...",
  helperText,
  className,
  error,
  disabled = false,
  required = false,
  searchPlaceholder = "Search icons...",
  showSearch = true,
  iconSize = 20,
  maxResults = 50,
  ...props
}: IconPickerProps<TFieldValues, TName>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [allIcons] = React.useState<IconOption[]>(() => getAllIcons());
  
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

  const validateIcon = React.useCallback((value: string | null): string | true => {
    if (required && (!value || value.trim().length === 0)) {
      return `${label} is required`;
    }
    
    if (value && !allIcons.find(icon => icon.name === value)) {
      return 'Please select a valid icon';
    }
    
    return true;
  }, [label, required, allIcons]);

  const handleIconSelect = React.useCallback((
    iconName: string,
    onChange: (value: string) => void
  ) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const renderIconButton = (iconName: string, selectedIcon?: string) => {
    const icon = allIcons.find(i => i.name === iconName);
    if (!icon) {
      return (
        <div className="flex items-center justify-center h-10 w-full px-3 py-2 bg-muted/50 rounded-md">
          <Package className="h-4 w-4 text-gray-500" />
          <span className="ml-2 text-sm text-gray-500">No icon</span>
        </div>
      );
    }

    const IconComponent = icon.component;
    
    return (
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start",
            error && "border-destructive",
            selectedIcon && "border-primary"
          )}
          aria-describedby={
            error ? `${name}-error` : 
            helperText ? `${name}-description` : undefined
          }
        >
          <IconComponent size={iconSize} className="mr-2" />
          <span className="flex-1 text-left">{iconName}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
    );
  };

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          validate: validateIcon,
          required: required ? `${label} is required` : false,
        }}
        render={({ field, fieldState }) => {
          const fieldError = fieldState.error?.message || error;
          const selectedIcon = field.value as string;

          return (
            <div className={cn('space-y-2', className)}>
              <Label className={cn(
                required && "after:content-['*'] after:ml-0.5 after:text-destructive"
              )}>
                {label}
              </Label>
              
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                {renderIconButton(selectedIcon, selectedIcon)}
                
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-3 space-y-3">
                    {showSearch && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <Input
                          placeholder={searchPlaceholder}
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
                    )}
                    
                    <div className="text-xs text-gray-500 px-1">
                      {filteredIcons.length} {filteredIcons.length === 1 ? 'icon' : 'icons'}
                      {searchQuery && ` matching "${searchQuery}"`}
                    </div>
                    
                    <ScrollArea className="h-64">
                      <div className="grid grid-cols-4 gap-1 p-1">
                        {filteredIcons.map((icon) => {
                          const IconComponent = icon.component;
                          const isSelected = selectedIcon === icon.name;
                          
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
                              onClick={() => handleIconSelect(icon.name, field.onChange)}
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
                    
                    {selectedIcon && (
                      <div className="border-t pt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleIconSelect('', field.onChange)}
                        >
                          Clear Selection
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              
              <div className="min-h-[1.25rem]">
                {fieldError && (
                  <p 
                    id={`${name}-error`}
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {fieldError}
                  </p>
                )}
                {!fieldError && helperText && (
                  <p 
                    id={`${name}-description`}
                    className="text-sm text-gray-500"
                  >
                    {helperText}
                  </p>
                )}
              </div>
            </div>
          );
        }}
      />
    );
  }

  // Uncontrolled version for direct usage without React Hook Form
  const [selectedIcon, setSelectedIcon] = React.useState<string>('');

  return (
    <div className={cn('space-y-2', className)}>
      <Label className={cn(
        required && "after:content-['*'] after:ml-0.5 after:text-destructive"
      )}>
        {label}
      </Label>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        {renderIconButton(selectedIcon)}
        
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 space-y-3">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder={searchPlaceholder}
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
            )}
            
            <div className="text-xs text-gray-500 px-1">
              {filteredIcons.length} {filteredIcons.length === 1 ? 'icon' : 'icons'}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
            
            <ScrollArea className="h-64">
              <div className="grid grid-cols-4 gap-1 p-1">
                {filteredIcons.map((icon) => {
                  const IconComponent = icon.component;
                  const isSelected = selectedIcon === icon.name;
                  
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
                      onClick={() => {
                        setSelectedIcon(icon.name);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
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
            
            {selectedIcon && (
              <div className="border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSelectedIcon('');
                    setIsOpen(false);
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      <div className="min-h-[1.25rem]">
        {error && (
          <p 
            id={`${name}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p 
            id={`${name}-description`}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
}

// Memoize the IconPicker to prevent unnecessary re-renders when dealing with large icon lists
export const IconPicker = React.memo(IconPickerComponent, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.label === nextProps.label &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.required === nextProps.required &&
    prevProps.searchPlaceholder === nextProps.searchPlaceholder &&
    prevProps.showSearch === nextProps.showSearch &&
    prevProps.iconSize === nextProps.iconSize &&
    prevProps.maxResults === nextProps.maxResults &&
    prevProps.error === nextProps.error &&
    prevProps.helperText === nextProps.helperText &&
    prevProps.className === nextProps.className
  )
})

IconPicker.displayName = 'IconPicker'