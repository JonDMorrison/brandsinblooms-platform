'use client';

import { StockFields } from '../fields';
import type { Control, FieldValues } from 'react-hook-form';

interface InventoryStepProps<T extends FieldValues> {
  control: Control<T>;
  disabled?: boolean;
  showActiveToggle?: boolean;
  showFeaturedToggle?: boolean;
}

export function InventoryStep<T extends FieldValues>({
  control,
  disabled = false,
  showActiveToggle = true,
  showFeaturedToggle = true,
}: InventoryStepProps<T>) {
  return (
    <div className="space-y-6">
      <StockFields
        control={control}
        disabled={disabled}
        showActiveToggle={showActiveToggle}
        showFeaturedToggle={showFeaturedToggle}
      />
    </div>
  );
}
