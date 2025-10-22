'use client';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import type { Control, FieldValues, Path } from 'react-hook-form';

interface ProductNameFieldProps<T extends FieldValues> {
  control: Control<T>;
  name?: Path<T>;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export function ProductNameField<T extends FieldValues>({
  control,
  name = 'name' as Path<T>,
  disabled = false,
  onChange,
}: ProductNameFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Product Name *</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., Red Geranium"
              {...field}
              value={field.value || ''}
              disabled={disabled}
              onChange={(e) => {
                field.onChange(e);
                onChange?.(e.target.value);
              }}
              onBlur={field.onBlur}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
