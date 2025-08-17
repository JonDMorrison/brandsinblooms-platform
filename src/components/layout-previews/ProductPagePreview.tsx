import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Star, ShoppingCart, Heart, Share, Truck, Shield, RotateCcw } from 'lucide-react'
import { PageContent, LegacyContent, isPageContent } from '@/src/lib/content/schema'
import { DynamicSection } from '@/src/components/preview/DynamicSection'
import { getLayoutSections, convertLegacyContent, getSpacingClass } from '@/src/lib/preview/section-renderers'

interface ProductPagePreviewProps {
  title?: string
  subtitle?: string
  content?: PageContent | LegacyContent
}

export function ProductPagePreview({ title, subtitle, content }: ProductPagePreviewProps) {
  // Determine if we have enhanced content or need to use legacy format
  const isEnhanced = content && isPageContent(content)
  
  if (isEnhanced) {
    // Render with enhanced content structure
    const sections = getLayoutSections(content.sections, 'product')
    const spacingClass = getSpacingClass(content.settings?.layout?.spacing)
    
    return (
      <div className={`w-full h-full bg-white p-6 ${spacingClass}`}>
        {sections.map(({ key, section }) => {
          // Special handling for product header section
          if (key === 'header' || section.type === 'hero') {
            return (
              <div key={key} className="flex flex-col gap-8">
                {/* Product Images */}
                <div className="w-full space-y-4">
                  <div className="aspect-square bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-600">Product Image</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Details */}
                <div className="w-full space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>Product</Badge>
                      <Badge variant="outline">Available</Badge>
                    </div>
                    <DynamicSection
                      section={section}
                      sectionKey={key}
                      className=""
                    />
                  </div>

                  {/* Default product elements */}
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">(reviews)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-gray-900">$99.99</span>
                    <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Button className="flex-1">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button variant="outline" size="icon">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
          
          // Special handling for features section
          if (key === 'features') {
            return (
              <div key={key}>
                <Separator className="my-6" />
                <DynamicSection
                  section={section}
                  sectionKey={key}
                  className=""
                />
              </div>
            )
          }
          
          // Default section rendering
          return (
            <DynamicSection
              key={key}
              section={section}
              sectionKey={key}
              className=""
            />
          )
        })}
      </div>
    )
  }
  
  // Fallback to legacy format or convert legacy content
  const legacyTitle = title || (content && 'title' in content ? content.title : '') || ''
  const legacySubtitle = subtitle || (content && 'subtitle' in content ? content.subtitle : '') || ''
  
  if (legacyTitle || legacySubtitle) {
    return (
      <div className="w-full h-full bg-white p-6 space-y-6">
        {/* Product Header */}
        <div className="flex flex-col gap-8">
          {/* Product Images */}
          <div className="w-full space-y-4">
            <div className="aspect-square bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-600">Product Image</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="w-full space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>Product</Badge>
                <Badge variant="outline">Available</Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">{legacyTitle}</h1>
              {legacySubtitle && (
                <p className="text-gray-600">{legacySubtitle}</p>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-gray-600">(reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-900">$99.99</span>
              <Badge className="bg-green-100 text-green-800">In Stock</Badge>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button className="flex-1">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
              {[
                { icon: Truck, text: 'Free Shipping' },
                { icon: Shield, text: 'Quality Guarantee' },
                { icon: RotateCcw, text: 'Easy Returns' }
              ].map((feature, i) => {
                const Icon = feature.icon
                return (
                  <div key={i} className="text-center">
                    <Icon className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <span className="text-xs text-gray-600">{feature.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <Separator />

        {/* Product Description */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold mb-2 text-gray-900">Product Description</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {content && 'content' in content && content.content 
              ? content.content 
              : 'Add your product description here. Include details about features, benefits, specifications, and any other information that helps customers make purchasing decisions.'
            }
          </p>
        </Card>
      </div>
    )
  }
  
  // Empty state
  return (
    <div className="w-full h-full bg-white p-6 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <h3 className="text-xl font-semibold mb-2">Product Page Preview</h3>
        <p>Add content to see your product page design</p>
      </div>
    </div>
  )
}