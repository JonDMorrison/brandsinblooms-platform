'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/src/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/src/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/src/components/ui/form'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Button } from '@/src/components/ui/button'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { useIsMobile } from '@/src/hooks/use-mobile'
import { cn } from '@/src/lib/utils'
import { 
  updateProduct,
  type ProductWithSite,
  AdminProductError
} from '@/src/lib/admin/products'
import { CategorySelect } from '@/src/components/categories/CategorySelect'
import { useCategoriesList } from '@/src/hooks/useCategories'
import type { Tables, TablesUpdate } from '@/src/lib/database/types'

// Zod schema for form validation
const productEditSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name is too long'),
  sku: z.string().optional(),
  primary_category_id: z.string().optional().nullable(),
  category_ids: z.array(z.string()).optional(),
  price: z.string().optional().refine((val) => {
    if (!val || val === '') return true
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, 'Price must be a valid positive number'),
  sale_price: z.string().optional().refine((val) => {
    if (!val || val === '') return true
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, 'Sale price must be a valid positive number'),
  description: z.string().optional(),
  care_instructions: z.string().optional(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  in_stock: z.boolean(),
  stock_status: z.string().optional(),
  admin_notes: z.string().optional()
})

type ProductEditFormData = z.infer<typeof productEditSchema>

interface ProductEditModalProps {
  product: ProductWithSite | null
  isOpen: boolean
  onClose: () => void
  onSave?: (updatedProduct: Tables<'products'>) => void
  customSaveHandler?: (productId: string, updates: Partial<TablesUpdate<'products'> & { category_ids?: string[] }>) => Promise<Tables<'products'>>
  onReturnFocus?: () => void
}

export function ProductEditModal({ 
  product, 
  isOpen, 
  onClose, 
  onSave,
  customSaveHandler,
  onReturnFocus
}: ProductEditModalProps) {
  const isMobile = useIsMobile()
  const [isLoading, setIsLoading] = useState(false)
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesList()
  const firstInputRef = useRef<HTMLInputElement>(null)
  const lastFocusableRef = useRef<HTMLButtonElement>(null)

  const form = useForm<ProductEditFormData>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: '',
      sku: '',
      primary_category_id: null,
      category_ids: [],
      price: '',
      sale_price: '',
      description: '',
      care_instructions: '',
      is_active: false,
      is_featured: false,
      in_stock: false,
      stock_status: '',
      admin_notes: ''
    }
  })


  // Populate form when product changes
  useEffect(() => {
    if (product && isOpen) {
      // Get category IDs from product
      let primaryCategoryId = product.primary_category_id || null
      let additionalCategoryIds: string[] = []
      
      // If product has extended data with category assignments, extract the IDs
      // Note: The extended product data would need to be passed in, for now we just use primary_category_id
      if ((product as any).product_category_assignments && Array.isArray((product as any).product_category_assignments)) {
        const categoryIds = (product as any).product_category_assignments
          .map((assignment: any) => assignment.category_id)
          .filter((id: string) => id && id !== primaryCategoryId)
        additionalCategoryIds = categoryIds
      }
      
      form.reset({
        name: product.name || '',
        sku: product.sku || '',
        primary_category_id: primaryCategoryId,
        category_ids: additionalCategoryIds,
        price: product.price?.toString() || '',
        sale_price: product.sale_price?.toString() || '',
        description: product.description || '',
        care_instructions: product.care_instructions || '',
        is_active: product.is_active || false,
        is_featured: product.is_featured || false,
        in_stock: product.in_stock || false,
        stock_status: product.stock_status || '',
        admin_notes: ''
      })
    }
  }, [product, isOpen, form])


  const handleSave = async (data: ProductEditFormData) => {
    if (!product) return

    setIsLoading(true)
    
    try {
      const updates: Partial<TablesUpdate<'products'> & { category_ids?: string[] }> = {
        name: data.name,
        sku: data.sku || null,
        primary_category_id: data.primary_category_id || null,
        category_ids: data.category_ids || [],
        description: data.description || null,
        care_instructions: data.care_instructions || null,
        is_active: data.is_active,
        is_featured: data.is_featured,
        in_stock: data.in_stock,
        stock_status: data.stock_status || null
      }

      if (data.price) {
        updates.price = parseFloat(data.price)
      }

      if (data.sale_price) {
        updates.sale_price = parseFloat(data.sale_price)
      }

      const updatedProduct = customSaveHandler 
        ? await customSaveHandler(product.id, updates)
        : await updateProduct(
            product.id,
            updates,
            data.admin_notes || `Updated product: ${data.name}`
          )

      toast.success('Product updated successfully')
      onSave?.(updatedProduct)
      onClose()
    } catch (error) {
      const errorMessage = error instanceof AdminProductError 
        ? error.message 
        : 'Failed to update product'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = useCallback(() => {
    if (!isLoading) {
      form.reset()
      onClose()
      // Return focus to the element that opened the modal
      if (onReturnFocus) {
        setTimeout(onReturnFocus, 100)
      }
    }
  }, [isLoading, form, onClose, onReturnFocus])

  // Focus management
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      // Focus the first input when modal opens
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Enhanced keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      e.preventDefault()
      handleClose()
    }
    
    // Trap focus within modal
    if (e.key === 'Tab') {
      const focusableElements = e.currentTarget.querySelectorAll(
        'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }, [handleClose, isLoading])

  if (!product) return null

  const content = (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSave)} 
        className={cn(
          "space-y-6 transition-opacity",
          isLoading && "opacity-75"
        )}
        onKeyDown={handleKeyDown}
        role="form"
        aria-label={`Edit product: ${product?.name || 'Unknown product'}`}
        aria-busy={isLoading}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="flex items-center space-x-3 bg-background border rounded-lg p-4 shadow-lg">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Saving changes...</span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    ref={firstInputRef}
                    disabled={isLoading}
                    aria-describedby="name-description"
                  />
                </FormControl>
                <div id="name-description" className="sr-only">
                  Enter the product name. This field is required.
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    disabled={isLoading}
                    aria-describedby="sku-description"
                  />
                </FormControl>
                <div id="sku-description" className="sr-only">
                  Optional stock keeping unit identifier for inventory tracking.
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="primary_category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <CategorySelect
                    name="primary_category_id"
                    value={field.value}
                    onValueChange={field.onChange}
                    categories={categories}
                    placeholder="Select a category"
                    disabled={categoriesLoading || isLoading}
                    error={form.formState.errors.primary_category_id?.message}
                  />
                </FormControl>
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Categories</FormLabel>
                <FormControl>
                  <CategorySelect
                    name="category_ids"
                    value={field.value || []}
                    onValueChange={field.onChange}
                    categories={categories}
                    placeholder="Select additional categories"
                    multiple={true}
                    disabled={categoriesLoading || isLoading}
                    excludeIds={form.watch('primary_category_id') ? [form.watch('primary_category_id')].filter(Boolean) as string[] : []}
                  />
                </FormControl>
                <FormDescription>
                  Optionally assign to multiple categories
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={isLoading}
                  />
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
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  rows={4} 
                  disabled={isLoading}
                  aria-describedby="description-help"
                  placeholder="Enter product description..."
                />
              </FormControl>
              <div id="description-help" className="text-xs text-muted-foreground">
                Detailed description of the product for customers.
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="care_instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Care Instructions</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  rows={3} 
                  disabled={isLoading}
                  aria-describedby="care-help"
                  placeholder="Enter care instructions..."
                />
              </FormControl>
              <div id="care-help" className="text-xs text-muted-foreground">
                Instructions for caring for this product (especially important for plants and flowers).
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    aria-describedby="active-help"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active</FormLabel>
                  <div id="active-help" className="text-xs text-muted-foreground">
                    Controls if this product is visible on your site.
                  </div>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    aria-describedby="featured-help"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Featured</FormLabel>
                  <div id="featured-help" className="text-xs text-muted-foreground">
                    Featured products appear prominently on your site.
                  </div>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="in_stock"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    aria-describedby="stock-help"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>In Stock</FormLabel>
                  <div id="stock-help" className="text-xs text-muted-foreground">
                    Whether this product is currently available for purchase.
                  </div>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="admin_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Notes</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Optional notes about this change..."
                  rows={2}
                  disabled={isLoading}
                  aria-describedby="notes-help"
                />
              </FormControl>
              <div id="notes-help" className="text-xs text-muted-foreground">
                Internal notes about this product update (not visible to customers).
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Cancel editing and close modal"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            ref={lastFocusableRef}
            aria-label={isLoading ? 'Saving product changes' : 'Save product changes'}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  )

  // Use Sheet for mobile, Dialog for desktop
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent 
          side="bottom" 
          className="h-[90vh] overflow-y-auto relative focus:outline-none"
          aria-describedby="mobile-edit-description"
          onPointerDownOutside={(e) => {
            // Prevent closing when loading
            if (isLoading) {
              e.preventDefault()
            }
          }}
        >
          <SheetHeader className="sticky top-0 bg-background border-b pb-3 mb-3">
            <SheetTitle className="text-left text-lg font-semibold">
              Edit Product: {product?.name}
            </SheetTitle>
            <div id="mobile-edit-description" className="sr-only">
              Edit form for {product?.name}. Use the form fields to modify product details. 
              Navigate between fields using tab. Press escape to close.
            </div>
          </SheetHeader>
          <div className="relative px-1">{content}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto relative focus:outline-none fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]"
        aria-describedby="desktop-edit-description"
        onPointerDownOutside={(e) => {
          // Prevent closing when loading
          if (isLoading) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader className="sticky top-0 bg-background border-b pb-3 mb-3">
          <DialogTitle className="text-xl font-semibold">
            Edit Product: {product?.name}
          </DialogTitle>
          <div id="desktop-edit-description" className="sr-only">
            Edit form for {product?.name}. Use the form fields to modify product details. 
            Navigate between fields using tab. Press escape to close.
          </div>
        </DialogHeader>
        <div className="relative px-1">{content}</div>
      </DialogContent>
    </Dialog>
  )
}