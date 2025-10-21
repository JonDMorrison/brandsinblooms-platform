'use client';

import { useState, useCallback } from 'react';
import type { UseFormTrigger, FieldValues, Path } from 'react-hook-form';

interface UseProductFormStateOptions<T extends FieldValues> {
  totalSteps: number;
  onSubmit?: () => void;
  trigger?: UseFormTrigger<T>;
  validateSlug?: () => Promise<boolean>;
}

export function useProductFormState<T extends FieldValues>({
  totalSteps,
  onSubmit,
  trigger,
  validateSlug,
}: UseProductFormStateOptions<T>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStep = useCallback(async () => {
    if (!trigger) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      }
      return;
    }

    // Validate current step before moving forward
    let isValid = true;

    if (currentStep === 0) {
      // Validate basic info
      isValid = await trigger([
        'name' as Path<T>,
        'sku' as Path<T>,
        'slug' as Path<T>,
        'primary_category_id' as Path<T>,
      ]);

      // Also validate slug if validator provided
      if (isValid && validateSlug) {
        const slugIsValid = await validateSlug();
        if (!slugIsValid) {
          isValid = false;
        }
      }
    } else if (currentStep === 1) {
      // Validate pricing
      isValid = await trigger(['price' as Path<T>]);
    } else if (currentStep === 2) {
      // Validate inventory
      isValid = await trigger(['inventory_count' as Path<T>]);
    }

    if (isValid && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, totalSteps, trigger, validateSlug]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onSubmit?.();
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit]);

  const resetForm = useCallback(() => {
    setCurrentStep(0);
    setIsSubmitting(false);
  }, []);

  return {
    currentStep,
    isSubmitting,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    nextStep,
    prevStep,
    goToStep,
    handleSubmit,
    setIsSubmitting,
    resetForm,
  };
}
