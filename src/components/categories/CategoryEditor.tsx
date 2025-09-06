'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { IconPicker } from '@/components/content-editor/inputs/IconPicker';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  X, 
  AlertCircle, 
  Loader2, 
  Package,
  Palette,
  Search,
  Tag,
  FileText,
  Globe,
  Image as ImageIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tables } from '@/lib/database/types';
import { categorySchema, type CategoryData } from '@/lib/validations/categories';
import { sanitizeSlug } from '@/lib/utils/slug';

type ProductCategory = Tables<'product_categories'>;

export interface CategoryWithChildren extends ProductCategory {
  children?: CategoryWithChildren[];
  product_count?: number;
}

interface CategoryEditorProps {
  category?: ProductCategory | null;
  parentCategory?: ProductCategory | null;
  availableParents?: CategoryWithChildren[];
  loading?: boolean;
  onSave: (data: CategoryData) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

const DEFAULT_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#64748b', // slate-500
  '#374151', // gray-700
];

export function CategoryEditor({
  category = null,
  parentCategory = null,
  availableParents = [],
  loading = false,
  onSave,
  onCancel,
  className,
}: CategoryEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(category?.color || DEFAULT_COLORS[0]);
  const [customColor, setCustomColor] = useState<string>('');
  
  const isEditing = !!category;
  const title = isEditing ? 'Edit Category' : 'Create Category';

  const form = useForm<CategoryData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      parent_id: category?.parent_id || parentCategory?.id || null,
      is_active: category?.is_active ?? true,
      sort_order: category?.sort_order || 0,
      color: category?.color || null,
      icon: category?.icon || null,
      image_url: category?.image_url || '',
      meta_title: category?.meta_title || '',
      meta_description: category?.meta_description || '',
    },
  });

  const { watch, setValue, handleSubmit, formState: { errors, isDirty } } = form;
  const watchedName = watch('name');
  const watchedColor = watch('color');

  // Auto-generate slug from name if not manually edited
  useEffect(() => {
    if (watchedName && !slugManuallyEdited) {
      const generatedSlug = sanitizeSlug(watchedName);
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [watchedName, slugManuallyEdited, setValue]);

  // Update selected color when form color changes
  useEffect(() => {
    if (watchedColor && watchedColor !== selectedColor) {
      setSelectedColor(watchedColor);
      if (!DEFAULT_COLORS.includes(watchedColor)) {
        setCustomColor(watchedColor);
      }
    }
  }, [watchedColor, selectedColor]);

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setValue('slug', sanitizeSlug(value), { shouldValidate: true });
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue('color', color, { shouldValidate: true });
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    if (color.match(/^#[0-9A-F]{6}$/i)) {
      handleColorSelect(color);
    }
  };

  const onSubmit = async (data: CategoryData) => {
    setIsSaving(true);
    try {
      await onSave(data);
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Build parent options with hierarchy
  const buildParentOptions = (categories: CategoryWithChildren[], level = 0): React.ReactNode[] => {
    const options: React.ReactNode[] = [];
    
    for (const cat of categories) {
      // Don't show the current category as a parent option (prevents circular reference)
      if (cat.id === category?.id) continue;
      
      const indent = '  '.repeat(level);
      const displayName = `${indent}${cat.name}`;
      
      options.push(
        <SelectItem key={cat.id} value={cat.id} disabled={!cat.is_active}>
          <div className="flex items-center gap-2">
            <span className={cn(!cat.is_active && 'text-gray-500')}>
              {displayName}
            </span>
            {!cat.is_active && (
              <EyeOff className="h-3 w-3 text-gray-500" />
            )}
          </div>
        </SelectItem>
      );
      
      if (cat.children && cat.children.length > 0) {
        options.push(...buildParentOptions(cat.children, level + 1));
      }
    }
    
    return options;
  };

  return (
    <div className={cn("", className)}>
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              {title}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditing 
                ? 'Update category information and settings'
                : 'Create a new product category'
              }
            </p>
          </div>
          
          {/* Buttons moved to form */}
        </div>
        
        {/* Preview */}
        {watchedName && (
          <div className="border rounded-lg p-2 bg-muted/20 mt-2">
            <div className="flex items-center gap-2">
              {selectedColor && (
                <div
                  className="w-3 h-3 rounded-sm border border-border"
                  style={{ backgroundColor: selectedColor }}
                />
              )}
              <span className="font-medium">{watchedName}</span>
              <Badge variant="secondary" className="text-xs">
                /{watch('slug')}
              </Badge>
              {!watch('is_active') && (
                <Badge variant="outline" className="text-xs">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6 pt-0 pb-4">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
                <TabsTrigger value="basic">
                  <Tag className="h-4 w-4 mr-2" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="appearance">
                  <Palette className="h-4 w-4 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="seo">
                  <Globe className="h-4 w-4 mr-2" />
                  SEO
                </TabsTrigger>
              </TabsList>

              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-3 sm:space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Roses, Indoor Plants, Garden Tools"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="auto-generated-from-name"
                            {...field}
                            onChange={(e) => handleSlugChange(e.target.value)}
                          />
                        </FormControl>
                        <FormDescription>
                          URL-friendly version of the name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of this category..."
                          rows={3}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="parent_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Category</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                          value={field.value || 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select parent category (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-gray-500">No parent (root level)</span>
                            </SelectItem>
                            {buildParentOptions(availableParents)}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose a parent to create a subcategory
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="9999"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Lower numbers appear first
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Category</FormLabel>
                        <FormDescription>
                          Active categories are visible to customers and can be used for products
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Appearance */}
              <TabsContent value="appearance" className="space-y-3 sm:space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Icon</FormLabel>
                      <IconPicker
                        name="icon"
                        control={form.control}
                        label=""
                        placeholder="Search for an icon..."
                        helperText="Choose an icon to represent this category"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Color</FormLabel>
                      <div className="space-y-3">
                        {/* Color Presets */}
                        <div className="flex flex-wrap gap-2">
                          {DEFAULT_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={cn(
                                'w-8 h-8 rounded-lg border-2 transition-all cursor-pointer',
                                selectedColor === color 
                                  ? 'border-primary ring-2 ring-primary/20 scale-110' 
                                  : 'border-border hover:border-muted-foreground hover:scale-105'
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => handleColorSelect(color)}
                              title={color}
                            />
                          ))}
                        </div>
                        
                        {/* Custom Color */}
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Custom:</Label>
                          <Input
                            type="text"
                            placeholder="#000000"
                            value={customColor}
                            onChange={(e) => handleCustomColorChange(e.target.value)}
                            className="w-24 font-mono text-sm"
                          />
                          <div
                            className="w-8 h-8 rounded border border-border"
                            style={{ backgroundColor: customColor || selectedColor }}
                          />
                        </div>
                        
                        {selectedColor && (
                          <div className="text-sm text-gray-500">
                            Selected: {selectedColor}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Image URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://example.com/category-image.jpg"
                            {...field}
                            value={field.value || ''}
                          />
                          <Button type="button" variant="outline" size="icon">
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Optional image to display for this category
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* SEO */}
              <TabsContent value="seo" className="space-y-3 sm:space-y-4 mt-4">
                <Alert>
                  <Search className="h-4 w-4" />
                  <AlertDescription>
                    SEO settings help your category pages rank better in search engines.
                    If left empty, defaults will be generated from the category name and description.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="meta_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Beautiful Roses for Your Garden - Shop Now"
                          maxLength={60}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Recommended: 50-60 characters. Shows in search results and browser tabs.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Discover our stunning collection of roses perfect for any garden. From classic red roses to unique varieties, find the perfect blooms for your space."
                          maxLength={160}
                          rows={3}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Recommended: 150-160 characters. Appears in search engine results.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCancel} 
                disabled={isSaving}
                type="button"
                className="hover:bg-gradient-primary-50 cursor-pointer"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                disabled={isSaving || (isEditing && !isDirty)}
                type="submit"
                size="sm"
                className="hover:bg-primary/90 cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isEditing ? 'Update' : 'Create'} Category
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}