'use client';

import { StockFields } from '../fields';
import { DimensionWeightFields } from '../fields/DimensionWeightFields';
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
    <div className="space-y-8">
      <StockFields
        control={control}
        disabled={disabled}
        showActiveToggle={showActiveToggle}
        showFeaturedToggle={showFeaturedToggle}
      />

      {/* Separator */}
      <div className="border-t pt-6">
        <DimensionWeightFields
          control={control}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
