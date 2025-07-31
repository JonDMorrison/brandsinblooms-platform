import { Card } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Filter, Search, Eye } from 'lucide-react'

interface PortfolioGridPreviewProps {
  title: string
  subtitle?: string
}

export function PortfolioGridPreview({ title, subtitle }: PortfolioGridPreviewProps) {
  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            All Categories
          </Button>
          <Badge variant="secondary">Weddings</Badge>
          <Badge variant="outline">Events</Badge>
          <Badge variant="outline">Seasonal</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden group cursor-pointer">
            <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Portfolio Item {i + 1}</span>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div className="absolute top-2 right-2">
                <Badge className="bg-white/90 text-gray-900">Wedding</Badge>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-1">Elegant Spring Bouquet</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Beautiful arrangement for spring weddings
              </p>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>March 2024</span>
                <span>Wedding Collection</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Categories */}
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Browse by Category</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {['Wedding Bouquets', 'Corporate Events', 'Seasonal Arrangements', 'Custom Designs'].map((category, i) => (
            <Badge key={i} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
              {category}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}