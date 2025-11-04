'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import type { Control, FieldValues, Path } from 'react-hook-form';

interface DimensionWeightFieldsProps<T extends FieldValues> {
  control: Control<T>;
  disabled?: boolean;
}

export function DimensionWeightFields<T extends FieldValues>({
  control,
  disabled = false,
}: DimensionWeightFieldsProps<T>) {
  return (
    <div className="space-y-6">
      {/* Dimensions Section */}
      <div>
        <h3 className="text-base font-semibold mb-4">Product Dimensions</h3>

        {/* Unit Selector for Dimensions */}
        <div className="mb-4">
          <FormField
            control={control}
            name={'dimension_unit' as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dimension Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="in">Inches (in)</SelectItem>
                    <SelectItem value="cm">Centimeters (cm)</SelectItem>
                    <SelectItem value="mm">Millimeters (mm)</SelectItem>
                    <SelectItem value="ft">Feet (ft)</SelectItem>
                    <SelectItem value="m">Meters (m)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Unit of measure for dimensions</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dimension Inputs - 3 column grid */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={control}
            name={'width' as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={'height' as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={'depth' as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Depth</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Weight Section */}
      <div className="pt-4 border-t">
        <h3 className="text-base font-semibold mb-4">Product Weight</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Weight Input */}
          <FormField
            control={control}
            name={'weight' as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Weight Unit Selector */}
          <FormField
            control={control}
            name={'weight_unit' as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="lb">Pounds (lb)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="oz">Ounces (oz)</SelectItem>
                    <SelectItem value="g">Grams (g)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          Optional: Add physical dimensions and weight for shipping calculations
        </p>
      </div>
    </div>
  );
}
