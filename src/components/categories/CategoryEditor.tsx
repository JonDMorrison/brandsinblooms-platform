'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
import {
  Save,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Tables } from '@/lib/database/types';
import { categorySchema, type CategoryData } from '@/lib/validations/categories';
import { sanitizeSlug } from '@/lib/utils/slug';
import { checkCategorySlugAvailability } from '@/lib/queries/domains/categories';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';

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
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  const [isValidatingSlug, setIsValidatingSlug] = useState(false);
  const [slugValidationStatus, setSlugValidationStatus] = useState<'idle' | 'validating' | 'available' | 'taken'>('idle');
  const [slugValidationMessage, setSlugValidationMessage] = useState('');

  const supabase = useSupabase();
  const siteId = useSiteId();

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
  const watchedSlug = watch('slug');

  // Validate slug availability
  const validateSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || !siteId) {
      setSlugValidationStatus('idle');
      setSlugValidationMessage('');
      return;
    }

    setIsValidatingSlug(true);
    setSlugValidationStatus('validating');

    try {
      const isAvailable = await checkCategorySlugAvailability(
        supabase,
        siteId,
        slug,
        category?.id // Exclude current category when editing
      );

      if (isAvailable) {
        setSlugValidationStatus('available');
        setSlugValidationMessage('Category slug is available');
      } else {
        setSlugValidationStatus('taken');
        setSlugValidationMessage('A category with this slug already exists');
      }
    } catch (error) {
      console.error('Error validating slug:', error);
      setSlugValidationStatus('idle');
      setSlugValidationMessage('');
    } finally {
      setIsValidatingSlug(false);
    }
  }, [supabase, siteId, category?.id]);

  // Auto-generate slug from name (only when auto-generate is enabled)
  useEffect(() => {
    if (watchedName && autoGenerateSlug) {
      const generatedSlug = sanitizeSlug(watchedName);
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [watchedName, autoGenerateSlug, setValue]);

  // Validate slug when it changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (watchedSlug) {
      // Debounce validation
      timeoutId = setTimeout(() => {
        validateSlugAvailability(watchedSlug);
      }, 500);
    } else {
      setSlugValidationStatus('idle');
      setSlugValidationMessage('');
    }

    return () => clearTimeout(timeoutId);
  }, [watchedSlug, validateSlugAvailability]);

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
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-0 pb-4">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <div className="space-y-4">
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

                {/* Auto-generate slug toggle */}
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-purple-100 p-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <Label htmlFor="auto-slug" className="text-base font-semibold text-purple-900">
                          Auto-Generate Slug
                        </Label>
                        <p className="text-sm text-purple-700 mt-1">
                          Automatically create URL slug from category name
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="auto-slug"
                      checked={autoGenerateSlug}
                      onCheckedChange={setAutoGenerateSlug}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            disabled={autoGenerateSlug}
                            className={cn(
                              autoGenerateSlug ? "bg-muted cursor-not-allowed pr-10" : "pr-10",
                              slugValidationStatus === 'taken' && "border-red-500 focus-visible:ring-red-500"
                            )}
                            placeholder="e.g., roses, indoor-plants"
                          />
                          {isValidatingSlug && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            </div>
                          )}
                          {!isValidatingSlug && slugValidationStatus === 'available' && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </div>
                          )}
                          {!isValidatingSlug && slugValidationStatus === 'taken' && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <XCircle className="h-4 w-4 text-red-500" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className={slugValidationStatus === 'taken' ? "text-red-500" : ""}>
                        {slugValidationMessage || (autoGenerateSlug
                          ? "Automatically generated from category name"
                          : "Customize the URL slug for this category"
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                disabled={isSaving || (isEditing && !isDirty) || slugValidationStatus === 'taken' || isValidatingSlug}
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