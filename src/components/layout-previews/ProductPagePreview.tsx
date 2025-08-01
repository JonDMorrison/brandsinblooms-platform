import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Star, ShoppingCart, Heart, Share, Truck, Shield, RotateCcw } from 'lucide-react'

interface ProductPagePreviewProps {
  title: string
  subtitle?: string
}

export function ProductPagePreview({ title, subtitle }: ProductPagePreviewProps) {
  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 p-6 space-y-6">
      {/* Product Header */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900 dark:to-rose-900 rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">Main Product Image</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-xs text-muted-foreground">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge>Best Seller</Badge>
              <Badge variant="outline">Fresh Daily</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">(127 reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">$89.99</span>
            <span className="text-lg text-muted-foreground line-through">$99.99</span>
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">10% OFF</Badge>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Size</label>
              <div className="flex gap-2 mt-1">
                {['Small', 'Medium', 'Large'].map((size) => (
                  <Button key={size} variant="outline" size="sm" className="h-8">
                    {size}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Add-ons</label>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline" className="cursor-pointer">Vase (+$15)</Badge>
                <Badge variant="outline" className="cursor-pointer">Card (+$5)</Badge>
                <Badge variant="outline" className="cursor-pointer">Ribbon (+$3)</Badge>
              </div>
            </div>
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
            <Button variant="outline" className="w-full">
              Buy Now
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            {[
              { icon: Truck, text: 'Free Delivery' },
              { icon: Shield, text: 'Fresh Guarantee' },
              { icon: RotateCcw, text: '7-Day Returns' }
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="text-center">
                  <Icon className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <span className="text-xs text-muted-foreground">{feature.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Separator />

      {/* Product Information Tabs */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button variant="ghost" className="font-semibold">Description</Button>
          <Button variant="ghost" className="text-muted-foreground">Care Instructions</Button>
          <Button variant="ghost" className="text-muted-foreground">Reviews (127)</Button>
        </div>
        
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Product Description</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            This stunning arrangement features premium roses, eucalyptus, and seasonal blooms 
            carefully crafted by our expert florists. Perfect for special occasions or as a 
            thoughtful gift.
          </p>
          <div className="space-y-2">
            <h4 className="font-medium">Specifications:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Height: 12-15 inches</li>
              <li>• Width: 8-10 inches</li>
              <li>• Flowers: Roses, eucalyptus, baby&apos;s breath</li>
              <li>• Vase: Glass cylinder (optional)</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}