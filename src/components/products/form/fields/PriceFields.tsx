'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import type { Control, FieldValues, Path } from 'react-hook-form';

interface PriceFieldsProps<T extends FieldValues> {
  control: Control<T>;
  disabled?: boolean;
  showSalePrice?: boolean;
  showCompareAtPrice?: boolean;
  showUnitOfMeasure?: boolean;
}

export function PriceFields<T extends FieldValues>({
  control,
  disabled = false,
  showSalePrice = true,
  showCompareAtPrice = true,
  showUnitOfMeasure = true,
}: PriceFieldsProps<T>) {
  return (
    <div className="space-y-4">
      {/* Regular Price and Sale Price in a grid */}
      <div className="grid grid-cols-2 gap-4">
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
              <FormDescription>Standard selling price</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {showSalePrice && (
          <FormField
            control={control}
            name={'sale_price' as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sale Price</FormLabel>
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
                <FormDescription>Leave empty if not on sale</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Compare At Price */}
      {showCompareAtPrice && (
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
              <FormDescription>Original price to show savings</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Unit of Measure */}
      {showUnitOfMeasure && (
        <FormField
          control={control}
          name={'unit_of_measure' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit of Measure</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., per plant, per pack, per lb"
                  {...field}
                  value={field.value || ''}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
