'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { CategorySelect } from '@/src/components/categories/CategorySelect';
import type { Control, FieldValues, Path } from 'react-hook-form';

interface Category {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  color?: string;
  [key: string]: unknown; // Allow additional properties
}

interface CategoryFieldProps<T extends FieldValues> {
  control: Control<T>;
  name?: Path<T>;
  categories: Category[] | any[];
  categoriesLoading?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  multiple?: boolean;
  excludeIds?: string[];
}

export function CategoryField<T extends FieldValues>({
  control,
  name = 'primary_category_id' as Path<T>,
  categories,
  categoriesLoading = false,
  disabled = false,
  label = 'Category *',
  description = 'Product category for organization',
  multiple = false,
  excludeIds = [],
}: CategoryFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <CategorySelect
              value={field.value}
              onValueChange={field.onChange}
              categories={categories}
              placeholder={multiple ? 'Select categories' : 'Select a category'}
              disabled={disabled || categoriesLoading}
              multiple={multiple}
              excludeIds={excludeIds}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
