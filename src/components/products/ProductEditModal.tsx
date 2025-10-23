'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/src/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/src/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/src/hooks/use-mobile';
import { ProductForm } from '@/src/components/products/form';
import { useCategoriesList } from '@/src/hooks/useCategories';
import { useProductImages } from '@/src/hooks/useProductImages';
import { supabase } from '@/src/lib/supabase/client';
import { useSiteId } from '@/src/contexts/SiteContext';
import type { Tables, TablesUpdate, TablesInsert } from '@/src/lib/database/types';
import type { ProductFormData } from '@/src/lib/products/validation/schemas';
import type { ProductImage } from '@/src/components/products/ImageUploadS3';

type ProductImageInsert = TablesInsert<'product_images'>;

interface ProductEditModalProps {
  product: (Tables<'products'> & { site_name?: string; site_subdomain?: string }) | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedProduct: Tables<'products'>) => void;
  customSaveHandler?: (
    productId: string,
    updates: Partial<TablesUpdate<'products'> & { category_ids?: string[] }>
  ) => Promise<Tables<'products'>>;
  onDelete?: (productId: string) => Promise<void>;
  onReturnFocus?: () => void;
}

export function ProductEditModal({
  product,
  isOpen,
  onClose,
  onSave,
  customSaveHandler,
  onDelete,
  onReturnFocus,
}: ProductEditModalProps) {
  const isMobile = useIsMobile();
  const siteId = useSiteId();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesList();
  const { data: images = [], loading: imagesLoading } = useProductImages(product?.id || '');

  // Load images when product changes
  useEffect(() => {
    if (images && images.length > 0) {
      setProductImages(
        images.map((img) => ({
          ...img,
          position: img.position ?? 0,
          is_primary: img.is_primary ?? false,
        })) as ProductImage[]
      );
    } else {
      setProductImages([]);
    }
  }, [images]);

  // Reset delete confirmation when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setShowDeleteDialog(false);
    }
  }, [isOpen]);

  // Handle close
  const handleClose = () => {
    setShowDeleteDialog(false);
    onClose();
    onReturnFocus?.();
  };

  // Prepare initial data - memoized to prevent infinite re-renders
  // MUST be before any conditional returns to follow Rules of Hooks
  const initialData: Partial<ProductFormData> = useMemo(() => {
    if (!product) return {};

    return {
      name: product.name || '',
      description: product.description || '',
      sku: product.sku || '',
      slug: product.slug || '',
      primary_category_id: product.primary_category_id || '',
      category_ids: [],
      price: product.price || 0,
      compare_at_price: product.compare_at_price || null,
      inventory_count: product.inventory_count || 0,
      low_stock_threshold: product.low_stock_threshold || 10,
      care_instructions: product.care_instructions || '',
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
      meta_description: product.meta_description || '',
    };
  }, [product?.id]); // Only recreate when product ID changes

  // Associate images with the product (delete existing and insert new ones)
  const associateImages = async (productId: string, images: ProductImage[]) => {
    if (!siteId) {
      throw new Error('Site ID is required to save images');
    }

    try {
      // Step 1: Delete all existing images for this product
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      if (deleteError) {
        console.error('Failed to delete existing images:', deleteError);
        throw new Error('Failed to remove old images');
      }

      // Step 2: Insert new images if any
      if (images.length > 0) {
        const imageRecords: ProductImageInsert[] = images.map((img, index) => ({
          product_id: productId,
          site_id: siteId,
          url: img.url,
          alt_text: img.alt_text || `Product image ${index + 1}`,
          caption: img.caption || null,
          position: img.position ?? index,
          is_primary: img.is_primary ?? (index === 0),
          width: img.width || null,
          height: img.height || null,
          size_bytes: img.size || null,
          storage_type: img.storage_type || 's3',
          cdn_url: img.cdn_url || img.url,
        }));

        const { error: insertError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (insertError) {
          console.error('Failed to insert images:', insertError);
          throw new Error('Failed to save new images');
        }
      }
    } catch (error) {
      console.error('Error associating images:', error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (data: ProductFormData) => {
    if (!product?.id) {
      toast.error('Product ID is missing');
      return;
    }

    setIsLoading(true);

    try {
      let updatedProduct: Tables<'products'>;

      if (customSaveHandler) {
        // Use custom save handler if provided
        updatedProduct = await customSaveHandler(product.id, data);
      } else {
        // This shouldn't happen as customSaveHandler should always be provided
        throw new Error('No save handler provided');
      }

      // Save images after product update succeeds
      await associateImages(product.id, productImages);

      // Note: Success toast is shown by useProductEdit hook
      onSave?.(updatedProduct);
      handleClose();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle product deletion
  const handleDelete = async () => {
    if (!product?.id || !onDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await onDelete(product.id);
      // Note: Success toast is shown by useDeleteProduct hook
      handleClose();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
      // Keep modal open on error so user can try again or cancel
    } finally {
      setIsDeleting(false);
    }
  };

  if (!product) {
    return null;
  }

  const content = (
    <>
      {isMobile ? (
        <SheetHeader>
          <SheetTitle>Edit Product</SheetTitle>
          <SheetDescription>
            Update product details, pricing, inventory, and images
          </SheetDescription>
        </SheetHeader>
      ) : (
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product details, pricing, inventory, and images
          </DialogDescription>
        </DialogHeader>
      )}

      <div className="mt-4">
        <ProductForm
          mode="edit"
          variant="tabs"
          initialData={initialData}
          categories={categories}
          categoriesLoading={categoriesLoading}
          productImages={productImages}
          onImagesChange={setProductImages}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isSubmitting={isLoading || isDeleting}
          compact={true}
          productId={product.id}
        />
      </div>

      {/* Delete Section */}
      {onDelete && (
        <div className="mt-6 pt-6 border-t">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Product
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Main Edit Modal */}
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={handleClose}>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
            {content}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {content}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-left">
                  Delete {product?.name}?
                </AlertDialogTitle>
              </div>
            </div>
          </AlertDialogHeader>

          <AlertDialogDescription className="text-left">
            This action cannot be undone. This will permanently delete the product
            from your site.
          </AlertDialogDescription>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Product
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
