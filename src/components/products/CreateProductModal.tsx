'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useSiteId } from '@/src/contexts/SiteContext'
import { useCreateProduct, useSlugGeneration, useSkuValidation } from '@/src/hooks/useProducts'
import { useCategoriesList } from '@/src/hooks/useCategories'
import { supabase } from '@/src/lib/supabase/client'
import { validateSlug } from '@/src/lib/utils/slug'
import { handleError } from '@/src/lib/types/error-handling'
import { slugify } from '@/src/lib/products/utils/slugify'
import { productFormSchema, type ProductFormData } from '@/src/lib/products/validation/schemas'
import type { ProductImage } from '@/src/components/products/ImageUploadS3'
import type { TablesInsert } from '@/src/lib/database/types'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Switch } from '@/src/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/src/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Badge } from '@/src/components/ui/badge'
import { X } from 'lucide-react'
import {
  ArrowRight,
  Check,
  ArrowLeft,
  Loader2,
  DollarSign,
  Sparkles,
  Plus,
} from 'lucide-react'
import { ImageUploadS3 } from '@/src/components/products/ImageUploadS3'
import { QuickAddCategoryDialog } from '@/src/components/products/QuickAddCategoryDialog'

type ProductImageInsert = TablesInsert<'product_images'>

interface CreateProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductCreated?: () => void
}

export function CreateProductModal({
  open,
  onOpenChange,
  onProductCreated
}: CreateProductModalProps) {
  const router = useRouter()
  const siteId = useSiteId()
  const createProduct = useCreateProduct()
  const generateSlug = useSlugGeneration()
  const validateSku = useSkuValidation()
  const { data: categories = [] } = useCategoriesList()

  const [step, setStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [autoGenerateSku, setAutoGenerateSku] = useState(true)
  const [quickAddCategoryOpen, setQuickAddCategoryOpen] = useState(false)

  // Slug validation state
  const [isValidatingSlug, setIsValidatingSlug] = useState(false)
  const [slugValidationMessage, setSlugValidationMessage] = useState<string>('')
  const [slugValidationStatus, setSlugValidationStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle')
  const [generatedSlug, setGeneratedSlug] = useState<string>('')
  const [manuallyEditedSlug, setManuallyEditedSlug] = useState(false)

  // SKU validation state
  const [isValidatingSku, setIsValidatingSku] = useState(false)
  const [skuValidationMessage, setSkuValidationMessage] = useState<string>('')
  const [skuValidationStatus, setSkuValidationStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle')

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      slug: '',
      price: 0,
      compare_at_price: null,
      inventory_count: 0,
      low_stock_threshold: 10,
      primary_category_id: '',
      category_ids: [],
      care_instructions: '',
      is_active: true,
      is_featured: false,
      meta_description: '',
    }
  })

  // Auto-generate SKU from name
  const generateSkuFromName = useCallback((name: string) => {
    if (!name || !autoGenerateSku) return ''

    // Simple SKU generation: uppercase letters and numbers only
    const sku = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20)

    return sku || 'PROD'
  }, [autoGenerateSku])

  // Auto-generate slug from name
  const validateSlugAvailability = useCallback(async (name: string) => {
    if (!name || !siteId || manuallyEditedSlug) {
      setSlugValidationStatus('idle')
      setSlugValidationMessage('')
      return
    }

    setIsValidatingSlug(true)
    setSlugValidationStatus('checking')
    setSlugValidationMessage('Generating slug...')

    try {
      const slug = await generateSlug.mutateAsync(name)
      setGeneratedSlug(slug)
      form.setValue('slug', slug, { shouldValidate: false })

      setSlugValidationStatus('available')
      setSlugValidationMessage(`✓ Will be saved as: ${slug}`)
    } catch (error) {
      console.error('Error generating slug:', error)
      const fallbackSlug = slugify(name)
      setGeneratedSlug(fallbackSlug)
      form.setValue('slug', fallbackSlug, { shouldValidate: false })
      setSlugValidationStatus('available')
      setSlugValidationMessage(`✓ Will be saved as: ${fallbackSlug}`)
    } finally {
      setIsValidatingSlug(false)
    }
  }, [siteId, generateSlug, form, manuallyEditedSlug])

  // Validate SKU availability
  const validateSkuAvailability = useCallback(async (sku: string) => {
    if (!sku) {
      setSkuValidationStatus('idle')
      setSkuValidationMessage('')
      return
    }

    setIsValidatingSku(true)
    setSkuValidationStatus('checking')
    setSkuValidationMessage('Checking availability...')

    try {
      const isAvailable = await validateSku.mutateAsync({ sku })

      if (isAvailable) {
        setSkuValidationStatus('available')
        setSkuValidationMessage('✓ SKU is available')
      } else {
        setSkuValidationStatus('taken')
        setSkuValidationMessage('⚠ SKU is already in use')
      }
    } catch (error) {
      console.error('Error validating SKU:', error)
      setSkuValidationStatus('error')
      setSkuValidationMessage('Unable to validate SKU')
    } finally {
      setIsValidatingSku(false)
    }
  }, [validateSku])

  // Debounced name change handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const subscription = form.watch((value, { name: fieldName }) => {
      if (fieldName === 'name') {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          validateSlugAvailability(value.name || '')

          // Auto-generate SKU if enabled
          if (autoGenerateSku && value.name) {
            const sku = generateSkuFromName(value.name)
            form.setValue('sku', sku, { shouldValidate: false })
            // Validate the generated SKU after a short delay
            setTimeout(() => {
              validateSkuAvailability(sku)
            }, 300)
          }
        }, 500)
      }
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [form, validateSlugAvailability, autoGenerateSku, generateSkuFromName, validateSkuAvailability])

  // Validate SKU on manual change (when auto-generate is off)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const subscription = form.watch((value, { name: fieldName }) => {
      if (fieldName === 'sku' && !autoGenerateSku) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          if (value.sku) {
            validateSkuAvailability(value.sku)
          }
        }, 500)
      }
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [form, autoGenerateSku, validateSkuAvailability])

  const nextStep = () => {
    if (step === 1) {
      form.trigger(['name', 'sku', 'slug', 'primary_category_id']).then((isValid) => {
        if (isValid && skuValidationStatus !== 'taken') {
          setStep(2)
        } else if (skuValidationStatus === 'taken') {
          toast.error('Please use a unique SKU')
        }
      })
    } else if (step === 2) {
      form.trigger(['price', 'inventory_count', 'low_stock_threshold']).then((isValid) => {
        if (isValid) {
          setStep(3)
        }
      })
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const resetModal = () => {
    setStep(1)
    setProductImages([])
    setAutoGenerateSku(true)
    setSlugValidationStatus('idle')
    setSlugValidationMessage('')
    setSkuValidationStatus('idle')
    setSkuValidationMessage('')
    setIsValidatingSlug(false)
    setIsValidatingSku(false)
    setGeneratedSlug('')
    setManuallyEditedSlug(false)
    form.reset()
  }

  const handleModalClose = (open: boolean) => {
    if (!open) {
      resetModal()
    }
    onOpenChange(open)
  }

  // Associate images with the created product
  const associateImages = async (productId: string, images: ProductImage[]) => {
    if (!siteId || images.length === 0) return

    try {
      const imageRecords: ProductImageInsert[] = images.map((img, index) => ({
        product_id: productId,
        site_id: siteId,
        url: img.url,
        alt_text: img.alt_text || `Product image ${index + 1}`,
        caption: img.caption || null,
        position: index,
        is_primary: index === 0,
        width: img.width || null,
        height: img.height || null,
        size_bytes: img.size || null,
      }))

      const { error } = await supabase
        .from('product_images')
        .insert(imageRecords)

      if (error) {
        console.error('Failed to associate images:', error)
        throw new Error('Product created but images failed to save')
      }
    } catch (error) {
      console.error('Error associating images:', error)
      throw error
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    if (!siteId) {
      toast.error('No site selected. Please select a site first.')
      return
    }

    if (skuValidationStatus === 'taken') {
      toast.error('SKU is already in use. Please choose a different SKU.')
      return
    }

    setIsCreating(true)
    const toastId = toast.loading('Creating product...')

    try {
      // Validate slug one more time
      const slugValidation = await validateSlug(supabase, data.slug, siteId)
      if (!slugValidation.isValid) {
        toast.error('Invalid URL Slug', {
          description: slugValidation.error,
          id: toastId
        })
        setIsCreating(false)
        return
      }

      // Create the product
      const newProduct = await createProduct.mutateAsync(data)

      if (!newProduct?.id) {
        throw new Error('Failed to create product - no ID returned')
      }

      // Associate images
      if (productImages.length > 0) {
        await associateImages(newProduct.id, productImages)
      }

      toast.success('Product created successfully!', { id: toastId })

      // Close modal and refresh
      handleModalClose(false)
      onProductCreated?.()

    } catch (error: unknown) {
      console.error('Error creating product:', error)
      const errorMessage = handleError(error)

      toast.error('Failed to Create Product', {
        description: errorMessage.message || 'An unexpected error occurred. Please try again.',
        id: toastId
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Get available categories for additional categories (excluding primary)
  const primaryCategoryId = form.watch('primary_category_id')
  const availableAdditionalCategories = categories.filter(cat => cat.id !== primaryCategoryId)

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left pb-6 border-b">
          <DialogTitle className="text-2xl font-bold">Create New Product</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {
              step === 1 ? 'Product Information' :
              step === 2 ? 'Pricing & Inventory' :
              'Images & Visibility'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4 py-4">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                ${step >= stepNumber
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step > stepNumber ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`
                  w-12 h-1 mx-2 rounded-full transition-all
                  ${step > stepNumber ? 'bg-green-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Product Information */}
            {step === 1 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Product Name *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter product name"
                            className="h-12 text-lg pr-10"
                            {...field}
                          />
                          {isValidatingSlug && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                      {slugValidationMessage && field.value && (
                        <p className={`text-sm mt-1 ${
                          slugValidationStatus === 'available' ? 'text-green-600' :
                          slugValidationStatus === 'checking' ? 'text-gray-500' :
                          'text-yellow-600'
                        }`}>
                          {slugValidationMessage}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your product..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="p-4 border rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <Label htmlFor="auto-sku" className="text-base font-semibold text-purple-900">
                          Auto-Generate SKU
                        </Label>
                        <p className="text-sm text-purple-700 mt-1">
                          Automatically create SKU from product name
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="auto-sku"
                      checked={autoGenerateSku}
                      onCheckedChange={setAutoGenerateSku}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">SKU (Stock Keeping Unit) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="e.g., ROSE-RED-001"
                            className="h-12 pr-10"
                            disabled={autoGenerateSku}
                            {...field}
                          />
                          {isValidatingSku && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                            </div>
                          )}
                          {!isValidatingSku && skuValidationStatus === 'available' && field.value && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Check className="h-5 w-5 text-green-600" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                      {skuValidationMessage && field.value && (
                        <p className={`text-sm mt-1 ${
                          skuValidationStatus === 'available' ? 'text-green-600' :
                          skuValidationStatus === 'taken' ? 'text-red-600' :
                          skuValidationStatus === 'checking' ? 'text-gray-500' :
                          'text-yellow-600'
                        }`}>
                          {skuValidationMessage}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primary_category_id"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base font-semibold">Primary Category *</FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuickAddCategoryOpen(true)}
                          className="h-auto py-1 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          New Category
                        </Button>
                      </div>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Main category for this product
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_ids"
                  render={({ field }) => {
                    const selectedCategories = field.value || []
                    const selectedCategoryNames = categories
                      .filter(cat => selectedCategories.includes(cat.id))
                      .map(cat => ({ id: cat.id, name: cat.name }))

                    return (
                      <FormItem>
                        <FormLabel>Additional Categories</FormLabel>

                        {/* Show selected categories as badges */}
                        {selectedCategoryNames.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50 min-h-[60px]">
                            {selectedCategoryNames.map((cat) => (
                              <Badge
                                key={cat.id}
                                variant="secondary"
                                className="pl-3 pr-2 py-1.5 text-sm gap-1.5"
                              >
                                {cat.name}
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange(selectedCategories.filter(id => id !== cat.id))
                                  }}
                                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Checkbox list for selecting categories */}
                        <div className="border rounded-lg p-4 space-y-3 max-h-[200px] overflow-y-auto">
                          {availableAdditionalCategories.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-2">
                              All categories are in use (select a different primary category)
                            </p>
                          ) : (
                            availableAdditionalCategories.map((category) => (
                              <div key={category.id} className="flex items-center space-x-3">
                                <Checkbox
                                  id={`category-${category.id}`}
                                  checked={selectedCategories.includes(category.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...selectedCategories, category.id])
                                    } else {
                                      field.onChange(selectedCategories.filter(id => id !== category.id))
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`category-${category.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {category.name}
                                </label>
                              </div>
                            ))
                          )}
                        </div>

                        <FormDescription>
                          Select multiple categories for this product (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />

                <FormField
                  control={form.control}
                  name="care_instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Care Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="How to care for this product..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    onClick={nextStep}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Pricing & Inventory */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Pricing</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Regular Price *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="h-12 pl-10"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Current selling price
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="compare_at_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compare At Price</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="h-12 pl-10"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Original price to show savings (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Inventory</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="inventory_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Current Stock *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              className="h-12"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Current quantity in stock
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="low_stock_threshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Alert</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="10"
                              className="h-12"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Alert when stock falls below
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    size="lg"
                    className="px-8"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Images & Visibility */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Product Images</Label>
                  <ImageUploadS3
                    images={productImages}
                    onImagesChange={setProductImages}
                    maxImages={10}
                    siteId={siteId || ''}
                    productId={crypto.randomUUID()}
                  />
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-semibold">Active on Site</FormLabel>
                          <FormDescription>
                            Make this product visible to customers
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-semibold">Featured Product</FormLabel>
                          <FormDescription>
                            Highlight this product in featured sections
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    size="lg"
                    className="px-8"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Product
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>

      {/* Quick Add Category Dialog */}
      <QuickAddCategoryDialog
        open={quickAddCategoryOpen}
        onOpenChange={setQuickAddCategoryOpen}
        onCategoryCreated={(categoryId) => {
          // Auto-select the newly created category
          form.setValue('primary_category_id', categoryId);
          toast.success('Category created and selected');
        }}
      />
    </Dialog>
  )
}
