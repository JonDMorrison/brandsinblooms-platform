'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Controller, FieldValues, FieldPath } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { 
  Check, 
  ChevronDown, 
  Search, 
  X, 
  Package, 
  Folder,
  FolderOpen,
  Eye,
  EyeOff,
  Plus,
  Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Tables } from '@/src/lib/database/types';
import * as LucideIcons from 'lucide-react';
import { useCreateCategory } from '@/hooks/useCategories';
import { toast } from 'sonner';

type ProductCategory = Tables<'product_categories'>;

export interface CategoryWithChildren extends ProductCategory {
  children?: CategoryWithChildren[];
  product_count?: number;
}

interface CategorySelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  control?: any;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  categories: CategoryWithChildren[];
  value?: string | string[] | null;
  onValueChange?: (value: string | string[] | null) => void;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  showSearch?: boolean;
  showInactive?: boolean;
  showProductCounts?: boolean;
  showBreadcrumbs?: boolean;
  maxSelections?: number;
  excludeIds?: string[];
  className?: string;
}

interface FlattenedCategory extends ProductCategory {
  level: number;
  path: string;
  breadcrumb: string[];
  hasChildren: boolean;
  product_count?: number;
}

export function CategorySelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  placeholder = "Select category...",
  helperText,
  error,
  categories = [],
  value,
  onValueChange,
  multiple = false,
  required = false,
  disabled = false,
  showSearch = true,
  showInactive = false,
  showProductCounts = true,
  showBreadcrumbs = true,
  maxSelections,
  excludeIds = [],
  className,
}: CategorySelectProps<TFieldValues, TName>) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const createCategory = useCreateCategory();

  // Flatten categories for easier searching and display
  const flattenedCategories = useMemo(() => {
    const flatten = (
      cats: CategoryWithChildren[], 
      level = 0, 
      breadcrumb: string[] = []
    ): FlattenedCategory[] => {
      return cats.reduce<FlattenedCategory[]>((acc, category) => {
        if (!showInactive && !category.is_active) {
          return acc;
        }

        const currentBreadcrumb = [...breadcrumb, category.name];
        const hasChildren = category.children && category.children.length > 0;
        
        acc.push({
          ...category,
          level,
          path: category.path,
          breadcrumb: currentBreadcrumb,
          hasChildren,
        });

        if (hasChildren) {
          acc.push(...flatten(category.children, level + 1, currentBreadcrumb));
        }

        return acc;
      }, []);
    };

    return flatten(categories);
  }, [categories, showInactive]);

  // Filter categories based on search and exclusions
  const filteredCategories = useMemo(() => {
    let filtered = flattenedCategories;
    
    // Filter out excluded categories
    if (excludeIds.length > 0) {
      filtered = filtered.filter(category => !excludeIds.includes(category.id));
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(category => 
        category.name.toLowerCase().includes(query) ||
        category.description?.toLowerCase().includes(query) ||
        category.breadcrumb.some(crumb => crumb.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [flattenedCategories, searchQuery, excludeIds]);

  // Get selected categories
  const getSelectedCategories = useCallback((selectedValue: string | string[] | null) => {
    if (!selectedValue) return [];
    
    const ids = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
    return flattenedCategories.filter(cat => ids.includes(cat.id));
  }, [flattenedCategories]);

  // Get icon component
  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[iconName];
    return IconComponent && typeof IconComponent === 'function' ? IconComponent : null;
  };

  // Handle selection
  const handleSelect = useCallback((categoryId: string, currentValue: string | string[] | null, onChange?: (value: any) => void) => {
    let newValue: string | string[] | null;

    if (multiple) {
      const currentArray = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
      
      if (currentArray.includes(categoryId)) {
        // Remove if already selected
        newValue = currentArray.filter(id => id !== categoryId);
        if (newValue.length === 0) newValue = null;
      } else {
        // Add if not selected (respect max selections)
        if (maxSelections && currentArray.length >= maxSelections) {
          return; // Don't add if at max
        }
        newValue = [...currentArray, categoryId];
      }
    } else {
      newValue = currentValue === categoryId ? null : categoryId;
      setOpen(false);
    }

    // Update field value if onChange is provided (controlled component)
    if (onChange) {
      onChange(newValue);
    }
    
    // Also call onValueChange if provided
    if (onValueChange) {
      onValueChange(newValue);
    }
  }, [multiple, maxSelections, onValueChange]);

  // Remove selected category
  const handleRemove = useCallback((categoryId: string, currentValue: string | string[] | null, e: React.MouseEvent, onChange?: (value: any) => void) => {
    e.stopPropagation();
    
    let newValue: string | string[] | null;
    
    if (multiple) {
      const currentArray = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
      newValue = currentArray.filter(id => id !== categoryId);
      if (newValue.length === 0) newValue = null;
    } else {
      newValue = null;
    }
    
    // Update field value if onChange is provided (controlled component)
    if (onChange) {
      onChange(newValue);
    }
    
    // Also call onValueChange if provided
    if (onValueChange) {
      onValueChange(newValue);
    }
  }, [multiple, onValueChange]);

  // Render category item
  const renderCategoryItem = (category: FlattenedCategory, selectedIds: string[], onChange?: (value: any) => void, index?: number) => {
    const isSelected = selectedIds.includes(category.id);
    const IconComponent = getIconComponent(category.icon);
    const indentation = category.level * 12;

    return (
      <CommandItem
        key={`${category.id}-${index ?? 0}`}
        value={`${category.name} ${category.breadcrumb.join(' ')}`}
        onSelect={() => handleSelect(category.id, multiple ? selectedIds : (selectedIds[0] || null), onChange)}
        className="cursor-pointer"
        disabled={!category.is_active}
      >
        <div 
          className="flex items-center gap-2 w-full"
          style={{ paddingLeft: `${indentation}px` }}
        >
          {/* Selection indicator */}
          <div className={cn(
            'flex items-center justify-center w-4 h-4 rounded border',
            isSelected 
              ? 'bg-primary border-primary text-primary-foreground' 
              : 'border-muted-foreground/20'
          )}>
            {isSelected && <Check className="h-3 w-3" />}
          </div>

          {/* Category icon */}
          <div className="flex items-center justify-center w-4 h-4">
            {IconComponent ? (
              <IconComponent 
                className="h-3 w-3" 
                style={{ color: category.color || undefined }} 
              />
            ) : category.hasChildren ? (
              <Folder className="h-3 w-3 text-gray-500" />
            ) : (
              <Package className="h-3 w-3 text-gray-500" />
            )}
          </div>

          {/* Category name and info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-sm truncate',
                !category.is_active && 'text-gray-500 line-through'
              )}>
                {category.name}
              </span>
              
              {!category.is_active && (
                <EyeOff className="h-3 w-3 text-gray-500 flex-shrink-0" />
              )}
            </div>
            
            {/* Breadcrumb */}
            {showBreadcrumbs && category.level > 0 && (
              <div className="text-xs text-gray-500 truncate">
                {category.breadcrumb.slice(0, -1).join(' › ')}
              </div>
            )}
          </div>

          {/* Product count */}
          {showProductCounts && category.product_count !== undefined && category.product_count > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex-shrink-0">
              {category.product_count}
            </Badge>
          )}
        </div>
      </CommandItem>
    );
  };

  // Render trigger button content
  const renderTriggerContent = (currentValue: string | string[] | null, onChange?: (value: any) => void) => {
    const selectedCategories = getSelectedCategories(currentValue);

    if (selectedCategories.length === 0) {
      return (
        <div className="flex items-center justify-between w-full">
          <span className="text-gray-500">{placeholder}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      );
    }

    if (multiple) {
      return (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 flex-wrap min-w-0 flex-1">
            {selectedCategories.slice(0, 2).map(category => {
              const IconComponent = getIconComponent(category.icon);
              
              return (
                <Badge key={category.id} variant="secondary" className="text-xs flex items-center gap-1">
                  {IconComponent && (
                    <IconComponent className="h-3 w-3" style={{ color: category.color || undefined }} />
                  )}
                  <span className="truncate max-w-20">{category.name}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-1 hover:bg-gradient-primary-50-foreground/20 rounded-sm p-0.5 cursor-pointer inline-flex"
                    onClick={(e) => handleRemove(category.id, currentValue, e, onChange)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRemove(category.id, currentValue, e as any, onChange);
                      }
                    }}
                  >
                    <X className="h-2 w-2" />
                  </span>
                </Badge>
              );
            })}
            
            {selectedCategories.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{selectedCategories.length - 2} more
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </div>
      );
    }

    const category = selectedCategories[0];
    const IconComponent = getIconComponent(category.icon);
    
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {IconComponent && (
            <IconComponent className="h-4 w-4 flex-shrink-0" style={{ color: category.color || undefined }} />
          )}
          <span className="truncate">{category.name}</span>
          {showBreadcrumbs && category.level > 0 && (
            <span className="text-xs text-gray-500 truncate">
              ({category.breadcrumb.slice(0, -1).join(' › ')})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!category.is_active && <EyeOff className="h-3 w-3 text-gray-500" />}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </div>
    );
  };

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: required ? `${label} is required` : false }}
        render={({ field, fieldState }) => {
          const fieldError = fieldState.error?.message || error;

          return (
            <div className={cn('space-y-2', className)}>
              {label && (
                <Label className={cn(
                  required && "after:content-['*'] after:ml-0.5 after:text-destructive"
                )}>
                  {label}
                </Label>
              )}

              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                      "w-full justify-between h-auto min-h-9",
                      fieldError && "border-destructive",
                      !field.value && "text-gray-500"
                    )}
                    disabled={disabled}
                  >
                    {renderTriggerContent(field.value, field.onChange)}
                  </Button>
                </PopoverTrigger>
                
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border" align="start">
                  <Command className="bg-white">
                    {showSearch && (
                      <div className="flex items-center border-b px-3 bg-white">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CommandInput
                          placeholder="Search categories..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                          className="border-0 outline-none ring-0 focus:ring-0 bg-transparent"
                        />
                      </div>
                    )}
                    
                    <CommandList className="bg-white">
                      {filteredCategories.length === 0 ? (
                        <CommandEmpty>
                          <div className="flex flex-col items-center justify-center py-6 text-center bg-white">
                            <Package className="h-8 w-8 text-gray-500 mb-2" />
                            <p className="text-sm font-medium text-gray-900">No categories found</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {searchQuery ? 'Try adjusting your search terms' : 'Click below to create your first category'}
                            </p>
                            {!searchQuery && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() => setShowQuickAdd(true)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Quick Add Category
                              </Button>
                            )}
                          </div>
                        </CommandEmpty>
                      ) : (
                        <CommandGroup className="bg-white">
                          <ScrollArea className="h-64">
                            {filteredCategories.map((category, index) => 
                              renderCategoryItem(
                                category, 
                                Array.isArray(field.value) ? field.value : (field.value ? [field.value] : []),
                                field.onChange,
                                index
                              )
                            )}
                          </ScrollArea>
                        </CommandGroup>
                      )}
                    </CommandList>
                    
                    {/* Quick Add Form */}
                    {showQuickAdd && (
                      <div className="border-t p-3 bg-white">
                        <div className="space-y-2">
                          <Label className="text-xs">Quick Add Category</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Category name"
                              value={quickAddName}
                              onChange={(e) => setQuickAddName(e.target.value)}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter' && quickAddName.trim()) {
                                  e.preventDefault();
                                  try {
                                    const slug = quickAddName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                    const newCategory = await createCategory.mutateAsync({
                                      name: quickAddName.trim(),
                                      slug,
                                      parent_id: null,
                                      is_active: true
                                    });
                                    
                                    // Select the new category
                                    const newValue = multiple ? 
                                      [...(Array.isArray(field.value) ? field.value : []), newCategory.id] : 
                                      newCategory.id;
                                    
                                    field.onChange(newValue);
                                    if (onValueChange) {
                                      onValueChange(newValue);
                                    }
                                    
                                    setQuickAddName('');
                                    setShowQuickAdd(false);
                                    if (!multiple) setOpen(false);
                                    toast.success(`Category "${newCategory.name}" created and selected`);
                                  } catch (error) {
                                    toast.error('Failed to create category');
                                  }
                                }
                              }}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8"
                              disabled={!quickAddName.trim() || createCategory.isPending}
                              onClick={async () => {
                                if (quickAddName.trim()) {
                                  try {
                                    const slug = quickAddName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                    const newCategory = await createCategory.mutateAsync({
                                      name: quickAddName.trim(),
                                      slug,
                                      parent_id: null,
                                      is_active: true
                                    });
                                    
                                    // Select the new category
                                    const newValue = multiple ? 
                                      [...(Array.isArray(field.value) ? field.value : []), newCategory.id] : 
                                      newCategory.id;
                                    
                                    field.onChange(newValue);
                                    if (onValueChange) {
                                      onValueChange(newValue);
                                    }
                                    
                                    setQuickAddName('');
                                    setShowQuickAdd(false);
                                    if (!multiple) setOpen(false);
                                    toast.success(`Category "${newCategory.name}" created and selected`);
                                  } catch (error) {
                                    toast.error('Failed to create category');
                                  }
                                }
                              }}
                            >
                              {createCategory.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => {
                                setShowQuickAdd(false);
                                setQuickAddName('');
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Quick Add Button when categories exist */}
                    {!showQuickAdd && filteredCategories.length > 0 && (
                      <div className="border-t p-2 bg-white">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-8 text-xs"
                          onClick={() => setShowQuickAdd(true)}
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          Quick Add Category
                        </Button>
                      </div>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="min-h-[1.25rem]">
                {fieldError && (
                  <p className="text-sm text-destructive" role="alert">
                    {fieldError}
                  </p>
                )}
                {!fieldError && helperText && (
                  <p className="text-sm text-gray-500">
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

  // Uncontrolled version
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className={cn(
          required && "after:content-['*'] after:ml-0.5 after:text-destructive"
        )}>
          {label}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-auto min-h-9",
              error && "border-destructive",
              !value && "text-gray-500"
            )}
            disabled={disabled}
          >
            {renderTriggerContent(value)}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border" align="start">
          <Command className="bg-white">
            {showSearch && (
              <div className="flex items-center border-b px-3 bg-white">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <CommandInput
                  placeholder="Search categories..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="border-0 outline-none ring-0 focus:ring-0 bg-transparent"
                />
              </div>
            )}
            
            <CommandList className="bg-white">
              {filteredCategories.length === 0 ? (
                <CommandEmpty>
                  <div className="flex flex-col items-center justify-center py-6 text-center bg-white">
                    <Package className="h-8 w-8 text-gray-500 mb-2" />
                    <p className="text-sm font-medium text-gray-900">No categories found</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {searchQuery ? 'Try adjusting your search terms' : 'Click below to create your first category'}
                    </p>
                    {!searchQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setShowQuickAdd(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Quick Add Category
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup className="bg-white">
                  <ScrollArea className="h-64">
                    {filteredCategories.map((category, index) => 
                      renderCategoryItem(
                        category, 
                        Array.isArray(value) ? value : (value ? [value] : []),
                        undefined,
                        index
                      )
                    )}
                  </ScrollArea>
                </CommandGroup>
              )}
            </CommandList>
            
            {/* Quick Add Form */}
            {showQuickAdd && (
              <div className="border-t p-3 bg-white">
                <div className="space-y-2">
                  <Label className="text-xs">Quick Add Category</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Category name"
                      value={quickAddName}
                      onChange={(e) => setQuickAddName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && quickAddName.trim()) {
                          e.preventDefault();
                          try {
                            // Generate a unique slug by adding a timestamp if needed
                            let slug = quickAddName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                            
                            // Check if slug already exists in current categories
                            const slugExists = flattenedCategories.some(cat => cat.slug === slug);
                            if (slugExists) {
                              // Add a timestamp suffix to make it unique
                              slug = `${slug}-${Date.now()}`;
                            }
                            
                            const newCategory = await createCategory.mutateAsync({
                              name: quickAddName.trim(),
                              slug,
                              parent_id: null,
                              is_active: true
                            });
                            
                            // Select the new category
                            const newValue = multiple ? 
                              [...(Array.isArray(value) ? value : []), newCategory.id] : 
                              newCategory.id;
                            
                            if (onValueChange) {
                              onValueChange(newValue);
                            }
                            
                            setQuickAddName('');
                            setShowQuickAdd(false);
                            if (!multiple) setOpen(false);
                            toast.success(`Category "${newCategory.name}" created and selected`);
                          } catch (error: any) {
                            console.error('Failed to create category:', error);
                            
                            // Check for specific error types
                            if (error?.message?.includes('duplicate key') || error?.message?.includes('unique constraint')) {
                              toast.error('A category with this name already exists', {
                                description: 'Try using a different name'
                              });
                            } else if (error?.message) {
                              toast.error('Failed to create category', {
                                description: error.message
                              });
                            } else {
                              toast.error('Failed to create category', {
                                description: 'Please try again or refresh the page'
                              });
                            }
                          }
                        }
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8"
                      disabled={!quickAddName.trim() || createCategory.isPending}
                      onClick={async () => {
                        if (quickAddName.trim()) {
                          try {
                            // Generate a unique slug by adding a timestamp if needed
                            let slug = quickAddName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                            
                            // Check if slug already exists in current categories
                            const slugExists = flattenedCategories.some(cat => cat.slug === slug);
                            if (slugExists) {
                              // Add a timestamp suffix to make it unique
                              slug = `${slug}-${Date.now()}`;
                            }
                            
                            const newCategory = await createCategory.mutateAsync({
                              name: quickAddName.trim(),
                              slug,
                              parent_id: null,
                              is_active: true
                            });
                            
                            // Select the new category
                            const newValue = multiple ? 
                              [...(Array.isArray(value) ? value : []), newCategory.id] : 
                              newCategory.id;
                            
                            if (onValueChange) {
                              onValueChange(newValue);
                            }
                            
                            setQuickAddName('');
                            setShowQuickAdd(false);
                            if (!multiple) setOpen(false);
                            toast.success(`Category "${newCategory.name}" created and selected`);
                          } catch (error: any) {
                            console.error('Failed to create category:', error);
                            
                            // Check for specific error types
                            if (error?.message?.includes('duplicate key') || error?.message?.includes('unique constraint')) {
                              toast.error('A category with this name already exists', {
                                description: 'Try using a different name'
                              });
                            } else if (error?.message) {
                              toast.error('Failed to create category', {
                                description: error.message
                              });
                            } else {
                              toast.error('Failed to create category', {
                                description: 'Please try again or refresh the page'
                              });
                            }
                          }
                        }
                      }}
                    >
                      {createCategory.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => {
                        setShowQuickAdd(false);
                        setQuickAddName('');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick Add Button when categories exist */}
            {!showQuickAdd && filteredCategories.length > 0 && (
              <div className="border-t p-2 bg-white">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => setShowQuickAdd(true)}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Quick Add Category
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      <div className="min-h-[1.25rem]">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
}