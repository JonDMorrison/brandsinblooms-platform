'use client'

import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter,
  Package,
  Sparkles
} from 'lucide-react'

interface OrderEmptyStateProps {
  hasFilters?: boolean
  onClearFilters?: () => void
  onCreateOrder?: () => void
}

export function OrderEmptyState({ 
  hasFilters = false, 
  onClearFilters,
  onCreateOrder 
}: OrderEmptyStateProps) {
  if (hasFilters) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No orders match your filters</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            We couldn't find any orders matching your current search criteria. 
            Try adjusting your filters or search terms.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {onClearFilters && (
              <Button variant="outline" onClick={onClearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
            <Button variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              Search All Orders
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-6">
          {/* Main icon with decorative elements */}
          <div className="rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-8 mb-4">
            <ShoppingCart className="h-16 w-16 text-primary/60" />
          </div>
          
          {/* Floating decorative icons */}
          <div className="absolute -top-2 -right-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-4 w-4 text-primary/60" />
            </div>
          </div>
          <div className="absolute -bottom-1 -left-3">
            <div className="rounded-full bg-secondary/60 p-2">
              <Package className="h-4 w-4 text-secondary-foreground/60" />
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-3">No orders yet</h3>
        <p className="text-muted-foreground mb-8 max-w-lg">
          You haven't received any orders yet. Once customers start placing orders, 
          they'll appear here where you can track, manage, and fulfill them.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {onCreateOrder && (
            <Button onClick={onCreateOrder}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Order
            </Button>
          )}
          
          <div className="text-sm text-muted-foreground">
            <span>or</span>
          </div>
          
          <Button variant="outline" asChild>
            <a href="https://docs.example.com/orders" target="_blank" rel="noopener noreferrer">
              Learn about order management
            </a>
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="mt-12 pt-8 border-t border-dashed w-full">
          <h4 className="text-sm font-medium text-muted-foreground mb-4">
            What you can do with orders:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-blue-100 dark:bg-blue-900 p-2 flex-shrink-0">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Track Status</p>
                <p className="text-muted-foreground">
                  Monitor orders from processing to delivery
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-green-100 dark:bg-green-900 p-2 flex-shrink-0">
                <Search className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Search & Filter</p>
                <p className="text-muted-foreground">
                  Find orders by customer, status, or date
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-purple-100 dark:bg-purple-900 p-2 flex-shrink-0">
                <ShoppingCart className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Bulk Actions</p>
                <p className="text-muted-foreground">
                  Update multiple orders at once
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}