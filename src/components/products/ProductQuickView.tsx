'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/src/components/ui/sheet';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Tables } from '@/src/lib/database/types';
import { Heart, ShoppingCart } from 'lucide-react';
import { useProductFavorites } from '@/src/hooks/useProductFavorites';
import { useIsMobile } from '@/src/hooks/use-mobile';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { shouldShowCompareAtPrice } from '@/src/lib/products/utils/pricing';

// Support both database product type and simplified display type
type ProductType = Tables<'products'> | {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  category?: string | null;
  stock?: string | null;
  image?: string | null;
  images?: unknown;
  sku?: string | null;
  stock_status?: string | null;
  stock_quantity?: number | null;
  compare_at_price?: number | null;
  subcategory?: string | null;
  tags?: unknown;
  care_instructions?: string | null;
  main_image?: string | null;
};

interface ProductQuickViewProps {
  product: ProductType | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToSite?: (productId: string) => void;
}

export function ProductQuickView({ product, isOpen, onClose, onAddToSite }: ProductQuickViewProps) {
  const isMobile = useIsMobile();
  const { isFavorite, toggleFavorite, isToggling } = useProductFavorites();
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) return null;

  // Handle images - could be JSON array, single main_image, or simplified image field
  const images = Array.isArray(product.images) 
    ? product.images 
    : (product as any).image
      ? [(product as any).image]
      : (product as any).main_image 
        ? [(product as any).main_image] 
        : [];
  
  const isProductFavorite = isFavorite(product.id);

  const stockColors = {
    'in-stock': 'bg-green-100 text-green-800',
    'low-stock': 'bg-yellow-100 text-yellow-800',
    'out-of-stock': 'bg-red-100 text-red-800'
  };

  const content = (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          {images[selectedImage] ? (
            <Image
              src={images[selectedImage] as string}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No image available
            </div>
          )}
        </div>
        
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((image, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={cn(
                  "relative h-20 w-20 overflow-hidden rounded-md border-2",
                  selectedImage === idx ? "border-primary" : "border-gray-200"
                )}
              >
                <Image
                  src={image as string}
                  alt={`${product.name} ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{product.name}</h2>
          {product.sku && (
            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold">${product.price}</span>
          {shouldShowCompareAtPrice(product.price, (product as any).originalPrice || (product as any).compare_at_price) && (
            <span className="text-lg text-gray-500 line-through">
              ${(product as any).originalPrice || (product as any).compare_at_price}
            </span>
          )}
          <Badge className={cn(stockColors[(product as any).stock_status || (product as any).stock || 'in-stock'])}>
            {((product as any).stock_status || (product as any).stock)?.replace('-', ' ') || 'In Stock'}
          </Badge>
        </div>

        {product.description && (
          <div className="prose prose-sm max-w-none">
            <p>{product.description}</p>
          </div>
        )}

        {/* Additional Details */}
        <div className="space-y-2 border-t pt-4">
          {product.category && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Category</span>
              <span className="text-sm font-medium">{product.category}</span>
            </div>
          )}
          {product.subcategory && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Subcategory</span>
              <span className="text-sm font-medium">{product.subcategory}</span>
            </div>
          )}
          {product.stock_quantity !== null && product.stock_quantity !== undefined && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Stock</span>
              <span className="text-sm font-medium">{product.stock_quantity} units</span>
            </div>
          )}
          {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-500">Tags</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {(product.tags as string[]).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Care Instructions if available */}
        {product.care_instructions && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">Care Instructions</h3>
            <p className="text-sm text-gray-500">{product.care_instructions}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {onAddToSite && (
            <Button 
              className="flex-1" 
              size="lg"
              onClick={() => onAddToSite(product.id)}
              disabled={product.stock_status === 'out-of-stock'}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Site
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={() => toggleFavorite({ 
              productId: product.id, 
              isFavorite: isProductFavorite 
            })}
            disabled={isToggling}
          >
            <Heart className={cn(
              "h-4 w-4",
              isProductFavorite && "fill-red-500 text-red-500"
            )} />
          </Button>
        </div>
      </div>
    </div>
  );

  // Use Sheet for mobile, Dialog for desktop
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Product Details</SheetTitle>
          </SheetHeader>
          <div className="mt-6">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}