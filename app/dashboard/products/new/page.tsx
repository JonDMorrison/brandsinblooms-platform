'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  useCreateProduct, 
  useSkuValidation, 
  useSlugGeneration,
  useProductCategories 
} from '@/src/hooks/useProducts'
import { useUploadMultipleProductImages } from '@/src/hooks/useProductImages'
import { ImageUpload } from '@/src/components/products/ImageUpload'
import type { ProductImage } from '@/src/components/products/ImageUpload'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { Switch } from '@/src/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form'
import { Badge } from '@/src/components/ui/badge'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Package,
  DollarSign,
  Info,
  Image,
  Tag,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useSiteId } from '@/contexts/SiteContext'
import { handleError } from '@/lib/types/error-handling'
import { TablesInsert } from '@/lib/database/types'

type ProductImageInsert = TablesInsert<'product_images'>

// Enhanced tracked image interface
interface TrackedImage extends ProductImage {
  file?: File
  width?: number
  height?: number
  size?: number
  tempPath?: string
  altText?: string
}

// Product form schema
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required').max(100),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  sale_price: z.coerce.number().min(0).optional().nullable(),
  compare_at_price: z.coerce.number().min(0).optional().nullable(),
  inventory_count: z.coerce.number().int().min(0, 'Inventory must be non-negative'),
  low_stock_threshold: z.coerce.number().int().min(0).default(10),
  unit_of_measure: z.string().optional(),
  care_instructions: z.string().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  slug: z.string().optional(),
  meta_description: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

// Fallback categories if none exist in database
const fallbackCategories = [
  'Annuals',
  'Perennials',
  'Trees',
  'Shrubs',
  'Houseplants',
  'Garden Supplies',
  'Tools',
  'Fertilizers',
  'Seeds',
  'Pottery',
  'Decor',
  'Other'
]

// Helper function to get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.src = URL.createObjectURL(file)
  })
}

export default function NewProductPage() {
  const router = useRouter()
  const siteId = useSiteId()
  const createProduct = useCreateProduct()
  const uploadImages = useUploadMultipleProductImages()
  const validateSku = useSkuValidation()
  const generateSlug = useSlugGeneration()
  const { data: dbCategories = [], isLoading: categoriesLoading } = useProductCategories()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productImages, setProductImages] = useState<TrackedImage[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File>>(new Map())

  // Use database categories if available, otherwise use fallback
  const categories = dbCategories.length > 0 
    ? [...dbCategories.map(c => c.category), 'Other']
    : fallbackCategories

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      category: '',
      price: 0,
      inventory_count: 0,
      low_stock_threshold: 10,
      is_active: true,
      is_featured: false,
    },
  })

  const steps = [
    { title: 'Basic Info', icon: <Info className="h-4 w-4" /> },
    { title: 'Pricing', icon: <DollarSign className="h-4 w-4" /> },
    { title: 'Inventory', icon: <Package className="h-4 w-4" /> },
    { title: 'Images', icon: <Image className="h-4 w-4" /> },
    { title: 'Review', icon: <Check className="h-4 w-4" /> },
  ]

  // SKU validation on blur
  const handleSkuBlur = useCallback(async (e: React.FocusEvent<HTMLInputElement>) => {
    const sku = e.target.value
    if (sku) {
      const result = await validateSku.mutateAsync({ sku })
      if (!result) {
        form.setError('sku', {
          type: 'manual',
          message: 'This SKU is already in use',
        })
      } else {
        form.clearErrors('sku')
      }
    }
  }, [form, validateSku])

  // Auto-generate slug when name changes
  const handleNameChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    form.setValue('name', name)
    
    // Only auto-generate slug if it's empty
    if (name && !form.getValues('slug')) {
      try {
        const slug = await generateSlug.mutateAsync(name)
        form.setValue('slug', slug)
      } catch (error) {
        console.error('Failed to generate slug:', error)
      }
    }
  }, [form, generateSlug])

  // Enhanced image upload handler with metadata tracking
  const handleImageUpload = useCallback(async (files: File[]) => {
    try {
      // Store files for later association
      const newUploadedFiles = new Map(uploadedFiles)
      
      // Get dimensions for each file
      const filesWithDimensions = await Promise.all(
        files.map(async (file) => {
          const dimensions = await getImageDimensions(file)
          return { file, dimensions }
        })
      )

      // Upload to temporary location
      const results = await uploadImages.mutateAsync({
        files,
        onProgress: (completed, total) => {
          console.log(`Upload progress: ${completed}/${total}`)
        }
      })

      // Process results and track metadata
      const processedResults = results.results.map((result, index) => {
        if (result.success && result.data) {
          const fileData = filesWithDimensions[index]
          const fileId = `temp-${Date.now()}-${index}`
          
          // Store the original file for later
          newUploadedFiles.set(fileId, fileData.file)
          
          return {
            success: true,
            data: {
              ...result.data,
              id: fileId,
              width: fileData.dimensions.width,
              height: fileData.dimensions.height,
              size: fileData.file.size,
              tempPath: result.data.path || result.data.url,
              file: fileData.file
            }
          }
        }
        return result
      })

      setUploadedFiles(newUploadedFiles)
      return processedResults
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload images')
      throw error
    }
  }, [uploadImages, uploadedFiles])

  // Associate images with the created product
  const associateImages = async (productId: string, images: TrackedImage[]) => {
    if (!siteId || images.length === 0) return

    try {
      const imageRecords: ProductImageInsert[] = images.map((img, index) => ({
        product_id: productId,
        site_id: siteId,
        url: img.url,
        alt_text: img.altText || img.alt_text || `${form.getValues('name')} - Image ${index + 1}`,
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

      // Clean up temp files after successful association
      const tempPaths = images
        .filter(img => img.tempPath)
        .map(img => img.tempPath!)

      if (tempPaths.length > 0) {
        // Move from temp to permanent location
        for (let i = 0; i < images.length; i++) {
          if (images[i].tempPath && images[i].file) {
            const permanentPath = `${siteId}/${productId}/${i}-${Date.now()}.jpg`
            
            // Re-upload to permanent location
            const { error: uploadError } = await supabase.storage
              .from('product-images')
              .upload(permanentPath, images[i].file!, {
                cacheControl: '3600',
                contentType: images[i].file!.type,
              })

            if (!uploadError) {
              // Update the image record with new URL
              const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(permanentPath)

              await supabase
                .from('product_images')
                .update({ url: publicUrl })
                .eq('product_id', productId)
                .eq('position', i)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error associating images:', error)
      throw error
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    
    try {
      // Generate unique slug if not provided
      if (!data.slug) {
        data.slug = await generateSlug.mutateAsync(data.name)
      }

      // Validate SKU one more time before submission
      const skuAvailable = await validateSku.mutateAsync({ sku: data.sku })
      if (!skuAvailable) {
        form.setError('sku', {
          type: 'manual',
          message: 'This SKU is already in use',
        })
        setIsSubmitting(false)
        return
      }

      // Create the product
      const newProduct = await createProduct.mutateAsync(data)
      
      if (!newProduct?.id) {
        throw new Error('Failed to create product - no ID returned')
      }

      // Associate images with the created product
      if (productImages.length > 0) {
        await associateImages(newProduct.id, productImages)
      }

      toast.success('Product created successfully!')
      router.push('/dashboard/products')
      
    } catch (error: unknown) {
      console.error('Error creating product:', error)
      const errorMessage = handleError(error)
      
      // Cleanup uploaded images on failure
      if (productImages.length > 0) {
        const tempPaths = productImages
          .filter(img => img.tempPath)
          .map(img => img.tempPath!)
        
        if (tempPaths.length > 0) {
          await supabase.storage
            .from('product-images')
            .remove(tempPaths)
            .catch(err => console.error('Failed to cleanup temp images:', err))
        }
      }
      
      toast.error(errorMessage.message || 'Failed to create product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Product</h1>
          <p className="text-muted-foreground">Add a new product to your catalog</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between max-w-2xl">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${
                index <= currentStep
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted bg-background text-muted-foreground'
              }`}
            >
              {index < currentStep ? <Check className="h-4 w-4" /> : step.icon}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-16 mx-2 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <CardDescription>
                {currentStep === 0 && 'Enter basic product information'}
                {currentStep === 1 && 'Set pricing for your product'}
                {currentStep === 2 && 'Manage inventory and stock settings'}
                {currentStep === 3 && 'Upload product images'}
                {currentStep === 4 && 'Review and create your product'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Basic Info */}
              {currentStep === 0 && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Red Geranium" 
                            {...field}
                            onChange={handleNameChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., FLW-GER-RED-001" 
                            {...field}
                            onBlur={(e) => {
                              field.onBlur()
                              handleSkuBlur(e)
                            }}
                          />
                        </FormControl>
                        <FormDescription>Unique identifier for inventory tracking</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="auto-generated-from-name" 
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>URL-friendly version of the product name (auto-generated)</FormDescription>
                        <FormMessage />
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={categoriesLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  categoriesLoading ? "Loading categories..." : "Select a category"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Product category for organization
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subcategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcategory</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Annual Flowers" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                </>
              )}

              {/* Step 2: Pricing */}
              {currentStep === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Regular Price *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-7"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sale_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Price</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-7"
                                {...field}
                                value={field.value || ''}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Leave empty if not on sale</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="compare_at_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compare at Price</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-7"
                              {...field}
                              value={field.value || ''}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Original price to show savings</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit_of_measure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit of Measure</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., per plant, per pack, per lb" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 3: Inventory */}
              {currentStep === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="inventory_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stock *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Current quantity in stock</FormDescription>
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
                              placeholder="10"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Alert when stock falls below</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Product</FormLabel>
                            <FormDescription>
                              Make this product visible on your site
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
                            <FormLabel className="text-base">Featured Product</FormLabel>
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
                </>
              )}

              {/* Step 4: Images */}
              {currentStep === 3 && (
                <ImageUpload
                  images={productImages}
                  onImagesChange={setProductImages}
                  onUpload={handleImageUpload}
                  maxImages={10}
                  disabled={isSubmitting}
                />
              )}

              {/* Step 5: Review */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-3">
                    <h3 className="font-semibold">Product Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p className="font-medium">{form.watch('name') || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SKU:</span>
                        <p className="font-medium">{form.watch('sku') || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Slug:</span>
                        <p className="font-medium">{form.watch('slug') || 'Auto-generated'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <p className="font-medium">{form.watch('category') || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <p className="font-medium">${form.watch('price') || '0.00'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stock:</span>
                        <p className="font-medium">{form.watch('inventory_count')} units</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Images:</span>
                        <p className="font-medium">{productImages.length} image(s)</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="flex gap-2 mt-1">
                          {form.watch('is_active') && (
                            <Badge variant="default">Active</Badge>
                          )}
                          {form.watch('is_featured') && (
                            <Badge variant="secondary">Featured</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">
                      Review your product details above. You can go back to make changes or click
                      &quot;Create Product&quot; to save.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Product
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}