'use client';

import { Button } from '@/src/components/ui/button';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import { Loader2, RefreshCw, Link } from 'lucide-react';
import type { Control, FieldValues, Path } from 'react-hook-form';

interface SlugFieldProps<T extends FieldValues> {
  control: Control<T>;
  name?: Path<T>;
  disabled?: boolean;
  isGenerating?: boolean;
  manuallyEdited?: boolean;
  currentSlug?: string;
  validationError?: string;
  onSlugChange?: (slug: string) => void;
  onSlugBlur?: () => void;
  onResetToAuto?: () => void;
}

export function SlugField<T extends FieldValues>({
  control,
  name = 'slug' as Path<T>,
  disabled = false,
  isGenerating = false,
  manuallyEdited = false,
  currentSlug,
  validationError,
  onSlugChange,
  onSlugBlur,
  onResetToAuto,
}: SlugFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>URL Slug *</FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                placeholder="auto-generated-from-name"
                {...field}
                value={field.value || currentSlug || ''}
                disabled={disabled}
                onChange={(e) => {
                  const newSlug = e.target.value;
                  field.onChange(newSlug);
                  onSlugChange?.(newSlug);
                }}
                onBlur={() => {
                  field.onBlur();
                  onSlugBlur?.();
                }}
                className={manuallyEdited ? 'pr-10' : ''}
              />
            </FormControl>
            {isGenerating && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            )}
            {manuallyEdited && !isGenerating && onResetToAuto && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-2"
                onClick={onResetToAuto}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
          <FormDescription className="flex items-center gap-1">
            <Link className="h-3 w-3" />
            Preview: /products/{field.value || currentSlug || 'product-name'}
          </FormDescription>
          {validationError && (
            <p className="text-sm text-destructive mt-1">{validationError}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
