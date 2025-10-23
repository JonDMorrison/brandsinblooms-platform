'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';
import { Form } from '@/src/components/ui/form';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/src/components/ui/tabs';
import { ArrowLeft, ArrowRight, Check, Loader2, Info, DollarSign, Package, Image } from 'lucide-react';
import { productFormSchema, type ProductFormData } from '@/src/lib/products/validation/schemas';
import { BasicInfoStep, PricingStep, InventoryStep, ImagesStep, ReviewStep } from './steps';
import { useProductFormState } from '@/src/hooks/products/useProductFormState';
import { useSlugGeneration } from '@/src/hooks/useProducts';
import { useSiteId } from '@/src/contexts/SiteContext';
import { slugify } from '@/src/lib/products/utils/slugify';
import { type ProductImage } from '@/src/components/products/ImageUploadS3';

interface Category {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  color?: string;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  variant?: 'stepper' | 'tabs'; // Navigation style
  initialData?: Partial<ProductFormData>;
  categories: Category[];
  categoriesLoading?: boolean;
  productImages?: ProductImage[];
  onImagesChange?: (images: ProductImage[]) => void;
  onSubmit: (data: ProductFormData) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  compact?: boolean; // For modal mode
  productId?: string;
  onSkuValidate?: (sku: string) => Promise<boolean>;
}

const STEPS = [
  { title: 'Basic Info', icon: Info, description: 'Enter basic product information' },
  { title: 'Pricing', icon: DollarSign, description: 'Set pricing for your product' },
  { title: 'Inventory', icon: Package, description: 'Manage inventory and stock settings' },
  { title: 'Images', icon: Image, description: 'Upload product images' },
  { title: 'Review', icon: Check, description: 'Review and save your product' },
];

const TABS = [
  { value: 'details', label: 'Details', icon: Info, step: 0 },
  { value: 'pricing', label: 'Pricing', icon: DollarSign, step: 1 },
  { value: 'inventory', label: 'Inventory', icon: Package, step: 2 },
  { value: 'images', label: 'Images', icon: Image, step: 3 },
];

export function ProductForm({
  mode,
  variant,
  initialData,
  categories,
  categoriesLoading = false,
  productImages = [],
  onImagesChange,
  onSubmit,
  onCancel,
  isSubmitting: externalIsSubmitting = false,
  compact = false,
  productId,
  onSkuValidate,
}: ProductFormProps) {
  const siteId = useSiteId();
  const [images, setImages] = useState<ProductImage[]>(productImages);
  const [currentProductId, setCurrentProductId] = useState<string | undefined>(productId);

  // Default to tabs for edit mode, stepper for create mode
  const displayVariant = variant || (mode === 'edit' ? 'tabs' : 'stepper');
  const useTabs = displayVariant === 'tabs';

  // Tab state (only used in tabs mode)
  const [activeTab, setActiveTab] = useState('details');

  // Form setup
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      slug: '',
      primary_category_id: '',
      category_ids: [],
      price: 0,
      compare_at_price: null,
      inventory_count: 0,
      low_stock_threshold: 10,
      is_active: true,
      is_featured: false,
      ...initialData,
    },
  });

  // Slug generation
  const generateSlug = useSlugGeneration();
  const [currentSlug, setCurrentSlug] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  // In edit mode with existing slug, prevent auto-regeneration
  const [manuallyEdited, setManuallyEdited] = useState(mode === 'edit' && !!initialData?.slug);
  const [slugValidationError, setSlugValidationError] = useState<string | undefined>();

  const handleSlugNameChange = useCallback(async (name: string) => {
    if (!manuallyEdited && name) {
      setIsGenerating(true);
      try {
        const slug = await generateSlug.mutateAsync(name);
        setCurrentSlug(slug);
        form.setValue('slug', slug);
      } catch (error) {
        setCurrentSlug(slugify(name));
        form.setValue('slug', slugify(name));
      } finally {
        setIsGenerating(false);
      }
    }
  }, [manuallyEdited, generateSlug, form]);

  // Force slug generation (used by reset button)
  const forceGenerateSlug = useCallback(async (name: string) => {
    if (!name) return;

    setIsGenerating(true);
    try {
      const slug = await generateSlug.mutateAsync(name);
      setCurrentSlug(slug);
      form.setValue('slug', slug);
    } catch (error) {
      setCurrentSlug(slugify(name));
      form.setValue('slug', slugify(name));
    } finally {
      setIsGenerating(false);
    }
  }, [generateSlug, form]);

  const handleSlugChange = useCallback((slug: string) => {
    setManuallyEdited(true);
    setCurrentSlug(slug);
  }, []);

  const validateCurrentSlug = useCallback(async () => {
    // Validation logic can be added here if needed
    return true;
  }, []);

  const resetToAutoGenerated = useCallback(async (name: string) => {
    setManuallyEdited(false);
    await forceGenerateSlug(name);
  }, [forceGenerateSlug]);

  // Form state management (only for stepper mode)
  const stepperState = useProductFormState<ProductFormData>({
    totalSteps: STEPS.length,
    onSubmit: form.handleSubmit(onSubmit),
    trigger: form.trigger,
    validateSlug: validateCurrentSlug,
  });

  // Use stepper state only in stepper mode, otherwise provide defaults
  const currentStep = useTabs ? 0 : stepperState.currentStep;
  const isSubmitting = externalIsSubmitting || (!useTabs && stepperState.isSubmitting);
  const isFirstStep = useTabs ? true : stepperState.isFirstStep;
  const isLastStep = useTabs ? true : stepperState.isLastStep;
  const nextStep = stepperState.nextStep;
  const prevStep = stepperState.prevStep;

  // Update form when product changes (for edit mode)
  // Only reset when productId actually changes to prevent infinite loops
  useEffect(() => {
    if (productId !== currentProductId) {
      setCurrentProductId(productId);
      if (initialData) {
        form.reset(initialData);

        // If product has existing slug, mark as manually edited to prevent auto-regeneration
        if (initialData.slug) {
          setManuallyEdited(true);
          setCurrentSlug(initialData.slug);
        } else {
          // No existing slug - allow auto-generation
          setManuallyEdited(false);
          if (initialData.name) {
            handleSlugNameChange(initialData.name);
          }
        }
      }
    }
  }, [productId, currentProductId, initialData, form, handleSlugNameChange]);

  // Update slug field when auto-generated slug changes
  useEffect(() => {
    if (currentSlug && !manuallyEdited) {
      form.setValue('slug', currentSlug, { shouldValidate: false });
    }
  }, [currentSlug, form, manuallyEdited]);

  // Sync external images
  useEffect(() => {
    setImages(productImages);
  }, [productImages]);

  const handleImagesChange = (newImages: ProductImage[]) => {
    setImages(newImages);
    onImagesChange?.(newImages);
  };

  const handleNameChange = (name: string) => {
    if (siteId) {
      handleSlugNameChange(name);
    }
  };

  const handleSlugBlur = async () => {
    const isValid = await validateCurrentSlug();
    if (!isValid && slugValidationError) {
      form.setError('slug', {
        type: 'manual',
        message: slugValidationError,
      });
    } else {
      form.clearErrors('slug');
    }
  };

  const handleResetSlug = () => {
    const name = form.getValues('name');
    if (name) {
      resetToAutoGenerated(name);
      form.clearErrors('slug');
    }
  };

  const currentStepConfig = STEPS[currentStep];

  // Render tabs variant
  if (useTabs) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {TABS.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              <BasicInfoStep
                control={form.control}
                categories={categories}
                categoriesLoading={categoriesLoading}
                disabled={isSubmitting}
                isGenerating={isGenerating}
                manuallyEdited={manuallyEdited}
                currentSlug={currentSlug}
                slugValidationError={slugValidationError}
                onSlugChange={handleSlugChange}
                onSlugBlur={handleSlugBlur}
                onResetToAuto={handleResetSlug}
                onNameChange={handleNameChange}
                onSkuValidate={onSkuValidate}
                setError={form.setError}
                clearErrors={form.clearErrors}
                primaryCategoryId={form.watch('primary_category_id')}
              />
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6 mt-6">
              <PricingStep control={form.control} disabled={isSubmitting} />
            </TabsContent>

            <TabsContent value="inventory" className="space-y-6 mt-6">
              <InventoryStep control={form.control} disabled={isSubmitting} />
            </TabsContent>

            <TabsContent value="images" className="space-y-6 mt-6">
              <ImagesStep
                images={images}
                onImagesChange={handleImagesChange}
                productId={productId || crypto.randomUUID()}
                siteId={siteId || ''}
                disabled={isSubmitting}
              />
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Create Product' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  // Render stepper variant (original behavior)
  const IconComponent = currentStepConfig.icon;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        onKeyDown={(e) => {
          // Prevent form submission on Enter key except on the last step
          if (e.key === 'Enter' && !isLastStep) {
            e.preventDefault();
          }
        }}
      >
        {!compact && (
          <div className="flex items-center justify-between max-w-2xl">
            {STEPS.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${
                    index <= currentStep
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-white text-gray-500'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-16 mx-2 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              <CardTitle>{currentStepConfig.title}</CardTitle>
            </div>
            <CardDescription>{currentStepConfig.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 0: Basic Info */}
            {currentStep === 0 && (
              <BasicInfoStep
                control={form.control}
                categories={categories}
                categoriesLoading={categoriesLoading}
                disabled={isSubmitting}
                isGenerating={isGenerating}
                manuallyEdited={manuallyEdited}
                currentSlug={currentSlug}
                slugValidationError={slugValidationError}
                onSlugChange={handleSlugChange}
                onSlugBlur={handleSlugBlur}
                onResetToAuto={handleResetSlug}
                onNameChange={handleNameChange}
                onSkuValidate={onSkuValidate}
                setError={form.setError}
                clearErrors={form.clearErrors}
                primaryCategoryId={form.watch('primary_category_id')}
              />
            )}

            {/* Step 1: Pricing */}
            {currentStep === 1 && (
              <PricingStep control={form.control} disabled={isSubmitting} />
            )}

            {/* Step 2: Inventory */}
            {currentStep === 2 && (
              <InventoryStep control={form.control} disabled={isSubmitting} />
            )}

            {/* Step 3: Images */}
            {currentStep === 3 && (
              <ImagesStep
                images={images}
                onImagesChange={handleImagesChange}
                productId={productId || crypto.randomUUID()}
                siteId={siteId || ''}
                disabled={isSubmitting}
              />
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <ReviewStep
                formValues={form.getValues()}
                images={images}
                categories={categories}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={isFirstStep ? onCancel : prevStep}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isFirstStep ? 'Cancel' : 'Previous'}
          </Button>

          {!isLastStep ? (
            <Button type="button" onClick={nextStep} disabled={isSubmitting}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Create Product' : 'Update Product'}
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
