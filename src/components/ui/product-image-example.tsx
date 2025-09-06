/**
 * Example usage of ProductImage component
 * This file demonstrates the various features and can be imported
 * into any page for testing purposes
 */

'use client'

import React from 'react'
import { ProductImage, ProductImageSkeleton } from './product-image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

export const ProductImageExample: React.FC = () => {
  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Image loaded successfully:', event.currentTarget.src)
  }

  const handleError = (error: unknown, retryCount: number) => {
    console.error('Image failed to load:', error, 'Retry count:', retryCount)
  }

  const handleRetry = (attempt: number, error: unknown) => {
    console.log(`Retry attempt ${attempt}:`, error)
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">ProductImage Component Examples</h2>
        <p className="text-gray-500 mb-6">
          These examples demonstrate the ProductImage component with different configurations,
          error handling, and placeholder types.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Valid Image */}
        <Card>
          <CardHeader>
            <CardTitle>Valid Image</CardTitle>
            <CardDescription>Image loads successfully</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductImage
              src="/images/placeholders/product-default.svg"
              alt="Valid product image"
              width={300}
              height={200}
              onLoad={handleLoad}
              onError={handleError}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        {/* Invalid Image with Retry */}
        <Card>
          <CardHeader>
            <CardTitle>Invalid Image</CardTitle>
            <CardDescription>Demonstrates retry logic</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductImage
              src="https://invalid-url-that-does-not-exist.com/image.jpg"
              alt="Invalid product image"
              width={300}
              height={200}
              onLoad={handleLoad}
              onError={handleError}
              onRetry={handleRetry}
              retryConfig={{ maxRetries: 2, baseDelay: 1000, backoffMultiplier: 2 }}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        {/* Gradient Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Gradient Placeholder</CardTitle>
            <CardDescription>Dynamic gradient placeholder</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductImage
              src="https://another-invalid-url.com/image.jpg"
              alt="Gradient placeholder example"
              width={300}
              height={200}
              placeholder={{
                type: 'gradient',
                config: {
                  colors: ['#ff7eb6', '#ffa726'],
                  direction: 'diagonal'
                }
              }}
              onLoad={handleLoad}
              onError={handleError}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        {/* Pattern Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Pattern Placeholder</CardTitle>
            <CardDescription>Dynamic pattern placeholder</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductImage
              src="https://pattern-example-invalid.com/image.jpg"
              alt="Pattern placeholder example"
              width={300}
              height={200}
              placeholder={{
                type: 'pattern',
                config: {
                  pattern: 'dots',
                  primaryColor: '#f0f9ff',
                  secondaryColor: '#0ea5e9',
                  scale: 1.5
                }
              }}
              onLoad={handleLoad}
              onError={handleError}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        {/* Icon Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Icon Placeholder</CardTitle>
            <CardDescription>Dynamic icon placeholder</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductImage
              src="https://icon-example-invalid.com/image.jpg"
              alt="Icon placeholder example"
              width={300}
              height={200}
              placeholder={{
                type: 'icon',
                config: {
                  icon: 'product',
                  backgroundColor: '#fef3c7',
                  iconColor: '#f59e0b',
                  size: 60
                }
              }}
              onLoad={handleLoad}
              onError={handleError}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        {/* Static Fallback */}
        <Card>
          <CardHeader>
            <CardTitle>Static Fallback</CardTitle>
            <CardDescription>Uses static placeholder images</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductImage
              src="https://static-fallback-invalid.com/image.jpg"
              alt="Static fallback example"
              width={300}
              height={200}
              placeholder={{
                type: 'gradient',
                staticFallback: 'product'
              }}
              onLoad={handleLoad}
              onError={handleError}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        {/* High Priority Image */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Image</CardTitle>
            <CardDescription>Above-the-fold priority loading</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductImage
              src="/images/placeholders/gradient-blue.svg"
              alt="Priority image example"
              width={300}
              height={200}
              priority={true}
              loading="eager"
              onLoad={handleLoad}
              onError={handleError}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        {/* Custom Retry Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Retry Config</CardTitle>
            <CardDescription>Fast retry with short delays</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductImage
              src="https://custom-retry-invalid.com/image.jpg"
              alt="Custom retry configuration"
              width={300}
              height={200}
              retryConfig={{
                maxRetries: 3,
                baseDelay: 300,
                backoffMultiplier: 1.5
              }}
              onLoad={handleLoad}
              onError={handleError}
              onRetry={handleRetry}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        {/* Loading State Hidden */}
        <Card>
          <CardHeader>
            <CardTitle>No Loading State</CardTitle>
            <CardDescription>Hidden loading indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductImage
              src="https://no-loading-invalid.com/image.jpg"
              alt="No loading state example"
              width={300}
              height={200}
              showLoadingState={false}
              onLoad={handleLoad}
              onError={handleError}
              className="rounded-md"
            />
          </CardContent>
        </Card>
      </div>

      {/* Skeleton Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">ProductImageSkeleton Examples</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Small Skeleton</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImageSkeleton width={150} height={150} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Medium Skeleton</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImageSkeleton width={250} height={200} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Large Skeleton</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImageSkeleton width={350} height={250} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Accessibility Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Accessibility Features</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Custom ARIA Labels</CardTitle>
              <CardDescription>Enhanced accessibility support</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductImage
                src="/images/placeholders/product-default.svg"
                alt="Product with custom ARIA"
                aria-label="Premium organic coffee beans product image"
                aria-describedby="coffee-description"
                width={300}
                height={200}
                onLoad={handleLoad}
                onError={handleError}
                className="rounded-md"
              />
              <p id="coffee-description" className="sr-only">
                High-quality organic coffee beans sourced from sustainable farms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Screen Reader Support</CardTitle>
              <CardDescription>Proper loading state announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductImage
                src="https://slow-loading-example.com/image.jpg"
                alt="Screen reader optimized image"
                width={300}
                height={200}
                onLoad={handleLoad}
                onError={handleError}
                className="rounded-md"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProductImageExample