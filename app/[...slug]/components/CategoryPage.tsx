'use client'

import { useCategory } from '@/src/hooks/useCategory'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { ProductCatalog } from '@/src/components/site/ProductCatalog'
import { Breadcrumbs, BreadcrumbItem } from '@/src/components/products/Breadcrumbs'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Skeleton } from '@/src/components/ui/skeleton'
import Image from 'next/image'
import Link from 'next/link'

interface CategoryPageProps {
  slug: string
}

export function CategoryPage({ slug }: CategoryPageProps) {
  const { currentSite: site } = useSiteContext()
  const { data: category, loading: isLoading, error } = useCategory(slug)

  if (!site) {
    return null
  }

  // Build breadcrumbs
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Products', href: '/products' },
  ]

  if (category) {
    // Add parent breadcrumb if exists
    if (category.parent) {
      breadcrumbItems.push({
        label: category.parent.name,
        href: `/category/${category.parent.slug}`,
      })
    }
    // Add current category
    breadcrumbItems.push({
      label: category.name,
      href: `/category/${category.slug}`,
    })
  }

  return (
    <SiteRenderer siteId={site.id} mode="live" showNavigation={true}>
      <div className="brand-container py-8">
        {/* Breadcrumbs */}
        {!isLoading && category && (
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Category Not Found</h2>
            <p className="text-gray-500 mb-6">
              The category you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/products">Browse All Products</Link>
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <CategorySkeleton />}

        {/* Category Content */}
        {!isLoading && category && (
          <div className="space-y-8">
            {/* Category Header */}
            <div>
              {/* Category Image and Info */}
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                {category.image_url && (
                  <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    {category.icon && (
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{
                          backgroundColor: category.color || '#f3f4f6',
                        }}
                      >
                        {category.icon}
                      </div>
                    )}
                    <h1
                      className="text-3xl lg:text-4xl font-bold"
                      style={{
                        color: 'var(--theme-text)',
                        fontFamily: 'var(--theme-font-heading)',
                      }}
                    >
                      {category.name}
                    </h1>
                  </div>

                  {category.description && (
                    <p
                      className="text-lg text-gray-700 leading-relaxed"
                      style={{ fontFamily: 'var(--theme-font-body)' }}
                    >
                      {category.description}
                    </p>
                  )}

                  {category.product_count !== undefined && (
                    <p className="text-sm text-gray-600">
                      {category.product_count}{' '}
                      {category.product_count === 1 ? 'product' : 'products'} in
                      this category
                    </p>
                  )}
                </div>
              </div>

              {/* Subcategories */}
              {category.children && category.children.length > 0 && (
                <div className="mb-8">
                  <h2
                    className="text-xl font-semibold mb-4"
                    style={{
                      color: 'var(--theme-text)',
                      fontFamily: 'var(--theme-font-heading)',
                    }}
                  >
                    Subcategories
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {category.children.map((child) => (
                      <SubcategoryCard key={child.id} category={child} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Products in Category */}
            <div>
              <h2
                className="text-2xl font-bold mb-6"
                style={{
                  color: 'var(--theme-text)',
                  fontFamily: 'var(--theme-font-heading)',
                }}
              >
                Products
              </h2>
              <ProductCatalog categoryId={category.id} />
            </div>
          </div>
        )}
      </div>
    </SiteRenderer>
  )
}

// Subcategory Card Component
interface SubcategoryCardProps {
  category: {
    id: string
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    color?: string | null
    image_url?: string | null
  }
}

function SubcategoryCard({ category }: SubcategoryCardProps) {
  return (
    <Link href={`/category/${category.slug}`}>
      <Card className="group cursor-pointer overflow-hidden hover:shadow-md transition-shadow h-full">
        {category.image_url && (
          <div className="relative aspect-video bg-muted">
            <Image
              src={category.image_url}
              alt={category.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            {category.icon && (
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-lg flex-shrink-0"
                style={{
                  backgroundColor: category.color || '#f3f4f6',
                }}
              >
                {category.icon}
              </div>
            )}
            <h3 className="font-medium line-clamp-1">{category.name}</h3>
          </div>
          {category.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {category.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

// Loading Skeleton
function CategorySkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex gap-6">
        <Skeleton className="w-48 h-48 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-6 w-1/4" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
