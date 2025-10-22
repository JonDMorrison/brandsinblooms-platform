'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/src/components/ui/sheet';
import { useIsMobile } from '@/src/hooks/use-mobile';
import { ProductForm } from '@/src/components/products/form';
import { useCategoriesList } from '@/src/hooks/useCategories';
import { useProductImages } from '@/src/hooks/useProductImages';
import type { Tables, TablesUpdate } from '@/src/lib/database/types';
import type { ProductFormData } from '@/src/lib/products/validation/schemas';
import type { ProductImage } from '@/src/components/products/ImageUploadS3';

interface ProductEditModalProps {
  product: (Tables<'products'> & { site_name?: string; site_subdomain?: string }) | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedProduct: Tables<'products'>) => void;
  customSaveHandler?: (
    productId: string,
    updates: Partial<TablesUpdate<'products'> & { category_ids?: string[] }>
  ) => Promise<Tables<'products'>>;
  onReturnFocus?: () => void;
}

export function ProductEditModal({
  product,
  isOpen,
  onClose,
  onSave,
  customSaveHandler,
  onReturnFocus,
}: ProductEditModalProps) {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesList();
  const { data: images = [], loading: imagesLoading } = useProductImages(product?.id || '');

  // Load images when product changes
  useEffect(() => {
    if (images.length > 0) {
      setProductImages(
        images.map((img) => ({
          ...img,
          position: img.position ?? 0,
          is_primary: img.is_primary ?? false,
        }))
      );
    } else {
      setProductImages([]);
    }
  }, [images]);

  // Handle close
  const handleClose = () => {
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
      sale_price: product.sale_price || null,
      compare_at_price: product.compare_at_price || null,
      inventory_count: product.inventory_count || 0,
      low_stock_threshold: product.low_stock_threshold || 10,
      unit_of_measure: product.unit_of_measure || '',
      care_instructions: product.care_instructions || '',
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
      meta_description: product.meta_description || '',
    };
  }, [product?.id]); // Only recreate when product ID changes

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

      toast.success('Product updated successfully');
      onSave?.(updatedProduct);
      handleClose();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsLoading(false);
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
        </SheetHeader>
      ) : (
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
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
          isSubmitting={isLoading}
          compact={true}
          productId={product.id}
        />
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {content}
      </DialogContent>
    </Dialog>
  );
}
