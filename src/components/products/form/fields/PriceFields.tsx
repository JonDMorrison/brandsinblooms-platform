'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import type { Control, FieldValues, Path } from 'react-hook-form';

interface PriceFieldsProps<T extends FieldValues> {
  control: Control<T>;
  disabled?: boolean;
}

export function PriceFields<T extends FieldValues>({
  control,
  disabled = false,
}: PriceFieldsProps<T>) {
  return (
    <div className="space-y-4">
      {/* Regular Price */}
      <FormField
        control={control}
        name={'price' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Regular Price *</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  {...field}
                  disabled={disabled}
                />
              </div>
            </FormControl>
            <FormDescription>Current selling price</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Compare At Price */}
      <FormField
        control={control}
        name={'compare_at_price' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Compare at Price</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  {...field}
                  value={field.value || ''}
                  disabled={disabled}
                />
              </div>
            </FormControl>
            <FormDescription>Original price to show savings (optional)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
