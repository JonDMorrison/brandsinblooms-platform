'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Package, Star, MessageSquare, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StarRating, CompactRating } from '@/components/products/StarRating';
import { RatingSummary } from '@/components/products/RatingSummary';
import { ReviewsList } from '@/components/products/ReviewsList';
import { ReviewForm, QuickReviewForm } from '@/components/products/ReviewForm';
import { useProduct } from '@/hooks/useProducts';
import { useProductRating } from '@/hooks/useProductReviews';
import { useSiteId } from '@/contexts/SiteContext';
import { formatCurrency } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = useSiteId();
  const productId = params.id as string;
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Mock current user profile ID - in real app this would come from auth
  const currentUserProfileId = 'user-123'; // This should come from auth context
  
  const { data: product, loading, error } = useProduct(productId);
  const { data: ratingData } = useProductRating(productId);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error ? 'Failed to load product details.' : 'Product not found.'}
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const formatPrice = (price: number | null) => {
    return price ? formatCurrency(price) : 'Price not set';
  };

  const getStockStatus = () => {
    if (!product.in_stock) return { label: 'Out of Stock', variant: 'destructive' as const };
    if ((product.inventory_count || 0) <= (product.low_stock_threshold || 0)) {
      return { label: 'Low Stock', variant: 'secondary' as const };
    }
    return { label: 'In Stock', variant: 'default' as const };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.sku && (
            <p className="text-gray-500">SKU: {product.sku}</p>
          )}
        </div>
        
        <Button 
          onClick={() => router.push(`/dashboard/products/${productId}/edit`)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Product
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    {!product.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {product.is_featured && (
                      <Badge variant="default">Featured</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(product.sale_price || product.price)}
                    </div>
                    {product.sale_price && product.compare_at_price && (
                      <div className="text-lg text-gray-500 line-through">
                        {formatPrice(product.compare_at_price)}
                      </div>
                    )}
                    <Badge variant={stockStatus.variant}>
                      {stockStatus.label}
                    </Badge>
                  </div>

                  {/* Rating */}
                  {ratingData && ratingData.totalReviews > 0 && (
                    <div className="flex items-center gap-2">
                      <CompactRating rating={ratingData.averageRating} />
                      <span className="text-sm text-gray-500">
                        ({ratingData.totalReviews} {ratingData.totalReviews === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            {product.description && (
              <CardContent>
                <CardDescription className="text-base whitespace-pre-wrap">
                  {product.description}
                </CardDescription>
              </CardContent>
            )}
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Reviews ({ratingData?.totalReviews || 0})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Product Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Category:</span> {product.category || 'Uncategorized'}
                    </div>
                    <div>
                      <span className="font-medium">Subcategory:</span> {product.subcategory || 'None'}
                    </div>
                    <div>
                      <span className="font-medium">Stock:</span> {product.inventory_count || 0} units
                    </div>
                    <div>
                      <span className="font-medium">Unit of Measure:</span> {product.unit_of_measure || 'Each'}
                    </div>
                  </div>
                  
                  {product.care_instructions && (
                    <div>
                      <h4 className="font-medium mb-2">Care Instructions</h4>
                      <p className="text-gray-500 text-sm whitespace-pre-wrap">
                        {product.care_instructions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              {/* Rating Summary */}
              <RatingSummary productId={productId} />

              {/* Review Form Toggle */}
              {!showReviewForm ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <QuickReviewForm 
                        productId={productId}
                        profileId={currentUserProfileId}
                        onSuccess={() => setShowReviewForm(false)}
                      />
                      <Separator />
                      <Button 
                        onClick={() => setShowReviewForm(true)}
                        variant="outline"
                        className="w-full"
                      >
                        Write a Detailed Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <ReviewForm 
                  productId={productId}
                  profileId={currentUserProfileId}
                  onSuccess={() => setShowReviewForm(false)}
                  onCancel={() => setShowReviewForm(false)}
                />
              )}

              {/* Reviews List */}
              <ReviewsList 
                productId={productId}
                currentUserProfileId={currentUserProfileId}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Analytics</CardTitle>
                  <CardDescription>
                    Performance metrics and insights for this product
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{ratingData?.totalReviews || 0}</div>
                      <div className="text-sm text-gray-500">Total Reviews</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {ratingData?.averageRating?.toFixed(1) || '0.0'}
                      </div>
                      <div className="text-sm text-gray-500">Avg Rating</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{product.inventory_count || 0}</div>
                      <div className="text-sm text-gray-500">Stock Level</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {product.is_active ? 'Active' : 'Inactive'}
                      </div>
                      <div className="text-sm text-gray-500">Status</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <Badge variant={product.is_active ? 'default' : 'secondary'}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Stock</span>
                <span className="font-medium">{product.inventory_count || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Price</span>
                <span className="font-medium">{formatPrice(product.price)}</span>
              </div>
              
              {ratingData && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rating</span>
                    <span className="font-medium">{ratingData.averageRating.toFixed(1)}/5</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reviews</span>
                    <span className="font-medium">{ratingData.totalReviews}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push(`/dashboard/products/${productId}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setActiveTab('reviews')}
              >
                <Star className="mr-2 h-4 w-4" />
                View Reviews
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-9 w-20" />
        <div className="flex-1">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Card>
              <CardContent className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}