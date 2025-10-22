'use client';

import { Textarea } from '@/src/components/ui/textarea';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { ProductNameField, SkuField, SlugField, CategoryField } from '../fields';
import type { Control, FieldValues, UseFormSetError, UseFormClearErrors } from 'react-hook-form';

interface Category {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  color?: string;
}

interface BasicInfoStepProps<T extends FieldValues> {
  control: Control<T>;
  categories: Category[];
  categoriesLoading?: boolean;
  disabled?: boolean;
  // Slug field props
  isGenerating?: boolean;
  manuallyEdited?: boolean;
  currentSlug?: string;
  slugValidationError?: string;
  onSlugChange?: (slug: string) => void;
  onSlugBlur?: () => void;
  onResetToAuto?: () => void;
  onNameChange?: (name: string) => void;
  // SKU validation props
  onSkuValidate?: (sku: string) => Promise<boolean>;
  setError?: UseFormSetError<T>;
  clearErrors?: UseFormClearErrors<T>;
  // Additional category props
  additionalCategoryIds?: string[];
  primaryCategoryId?: string;
}

export function BasicInfoStep<T extends FieldValues>({
  control,
  categories,
  categoriesLoading = false,
  disabled = false,
  isGenerating,
  manuallyEdited,
  currentSlug,
  slugValidationError,
  onSlugChange,
  onSlugBlur,
  onResetToAuto,
  onNameChange,
  onSkuValidate,
  setError,
  clearErrors,
  additionalCategoryIds,
  primaryCategoryId,
}: BasicInfoStepProps<T>) {
  return (
    <div className="space-y-6">
      {/* Product Name */}
      <ProductNameField
        control={control}
        disabled={disabled}
        onChange={onNameChange}
      />

      {/* SKU */}
      <SkuField
        control={control}
        disabled={disabled}
        onValidate={onSkuValidate}
        setError={setError}
        clearErrors={clearErrors}
      />

      {/* Slug */}
      <SlugField
        control={control}
        disabled={disabled}
        isGenerating={isGenerating}
        manuallyEdited={manuallyEdited}
        currentSlug={currentSlug}
        validationError={slugValidationError}
        onSlugChange={onSlugChange}
        onSlugBlur={onSlugBlur}
        onResetToAuto={onResetToAuto}
      />

      {/* Description */}
      <FormField
        control={control}
        name={'description' as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe your product..."
                className="min-h-[100px]"
                {...field}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Primary Category */}
      <CategoryField
        control={control}
        name={'primary_category_id' as any}
        categories={categories}
        categoriesLoading={categoriesLoading}
        disabled={disabled}
        label="Category *"
        description="Product category for organization"
      />

      {/* Additional Categories */}
      <CategoryField
        control={control}
        name={'category_ids' as any}
        categories={categories}
        categoriesLoading={categoriesLoading}
        disabled={disabled}
        label="Additional Categories"
        description="Optionally assign to multiple categories"
        multiple={true}
        excludeIds={primaryCategoryId ? [primaryCategoryId] : []}
      />

      {/* Care Instructions */}
      <FormField
        control={control}
        name={'care_instructions' as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Care Instructions</FormLabel>
            <FormControl>
              <Textarea
                placeholder="How to care for this product..."
                className="min-h-[80px]"
                {...field}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
