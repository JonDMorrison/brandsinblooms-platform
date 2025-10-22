'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import { Switch } from '@/src/components/ui/switch';
import type { Control, FieldValues, Path } from 'react-hook-form';

interface StockFieldsProps<T extends FieldValues> {
  control: Control<T>;
  disabled?: boolean;
  showActiveToggle?: boolean;
  showFeaturedToggle?: boolean;
}

export function StockFields<T extends FieldValues>({
  control,
  disabled = false,
  showActiveToggle = true,
  showFeaturedToggle = true,
}: StockFieldsProps<T>) {
  return (
    <div className="space-y-4">
      {/* Inventory Count and Low Stock Threshold in a grid */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name={'inventory_count' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Stock *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>Current quantity in stock</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={'low_stock_threshold' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Low Stock Alert</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="10"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>Alert when stock falls below</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Toggles */}
      {(showActiveToggle || showFeaturedToggle) && (
        <div className="space-y-4">
          {showActiveToggle && (
            <FormField
              control={control}
              name={'is_active' as Path<T>}
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Product</FormLabel>
                    <FormDescription>
                      Make this product visible on your site
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          {showFeaturedToggle && (
            <FormField
              control={control}
              name={'is_featured' as Path<T>}
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Featured Product</FormLabel>
                    <FormDescription>
                      Highlight this product in featured sections
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}
