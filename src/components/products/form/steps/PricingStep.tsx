'use client';

import { PriceFields } from '../fields';
import type { Control, FieldValues } from 'react-hook-form';

interface PricingStepProps<T extends FieldValues> {
  control: Control<T>;
  disabled?: boolean;
  showSalePrice?: boolean;
  showCompareAtPrice?: boolean;
  showUnitOfMeasure?: boolean;
}

export function PricingStep<T extends FieldValues>({
  control,
  disabled = false,
  showSalePrice = true,
  showCompareAtPrice = true,
  showUnitOfMeasure = true,
}: PricingStepProps<T>) {
  return (
    <div className="space-y-6">
      <PriceFields
        control={control}
        disabled={disabled}
        showSalePrice={showSalePrice}
        showCompareAtPrice={showCompareAtPrice}
        showUnitOfMeasure={showUnitOfMeasure}
      />
    </div>
  );
}
