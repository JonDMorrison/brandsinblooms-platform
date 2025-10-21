'use client';

import { useCallback } from 'react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import type { Control, FieldValues, Path, UseFormSetError, UseFormClearErrors } from 'react-hook-form';

interface SkuFieldProps<T extends FieldValues> {
  control: Control<T>;
  name?: Path<T>;
  disabled?: boolean;
  onValidate?: (sku: string) => Promise<boolean>;
  setError?: UseFormSetError<T>;
  clearErrors?: UseFormClearErrors<T>;
}

export function SkuField<T extends FieldValues>({
  control,
  name = 'sku' as Path<T>,
  disabled = false,
  onValidate,
  setError,
  clearErrors,
}: SkuFieldProps<T>) {
  const handleSkuBlur = useCallback(
    async (sku: string) => {
      if (!sku || !onValidate || !setError || !clearErrors) return;

      const isValid = await onValidate(sku);
      if (!isValid) {
        setError(name, {
          type: 'manual',
          message: 'This SKU is already in use',
        });
      } else {
        clearErrors(name);
      }
    },
    [onValidate, setError, clearErrors, name]
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>SKU *</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., FLW-GER-RED-001"
              {...field}
              disabled={disabled}
              onBlur={(e) => {
                field.onBlur();
                handleSkuBlur(e.target.value);
              }}
            />
          </FormControl>
          <FormDescription>Unique identifier for inventory tracking</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
