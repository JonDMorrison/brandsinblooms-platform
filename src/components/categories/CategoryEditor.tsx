'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  X,
  Loader2
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
  
  const isEditing = !!category;
  const title = isEditing ? 'Edit Category' : 'Create Category';

  const form = useForm<CategoryData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      is_active: category?.is_active ?? true,
    },
  });

  const { watch, setValue, handleSubmit, formState: { errors, isDirty } } = form;
  const watchedName = watch('name');

  // Auto-generate slug from name (always)
  useEffect(() => {
    if (watchedName) {
      const generatedSlug = sanitizeSlug(watchedName);
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [watchedName, setValue]);

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

  return (
    <div className={cn("", className)}>
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {title}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditing
                ? 'Update category information'
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
              <span className="font-medium">{watchedName}</span>
              <Badge variant="secondary" className="text-xs">
                /{watch('slug')}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6 pt-0 pb-4">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <div className="space-y-4">
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
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled
                            className="bg-muted cursor-not-allowed"
                          />
                        </FormControl>
                        <FormDescription>
                          Automatically generated from category name
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
            </div>

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