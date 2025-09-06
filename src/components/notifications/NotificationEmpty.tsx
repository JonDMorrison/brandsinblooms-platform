'use client'

import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { 
  Bell, 
  Filter, 
  Search, 
  Settings,
  CheckCircle,
  Sparkles,
  BellRing
} from 'lucide-react'

interface NotificationEmptyProps {
  hasFilters?: boolean
  onClearFilters?: () => void
  onViewSettings?: () => void
}

export function NotificationEmpty({ 
  hasFilters = false, 
  onClearFilters,
  onViewSettings
}: NotificationEmptyProps) {
  if (hasFilters) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Search className="h-10 w-10 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No notifications match your filters</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            We couldn't find any notifications matching your current search criteria. 
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
              Search All Notifications
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
            <Bell className="h-16 w-16 text-primary/60" />
          </div>
          
          {/* Floating decorative icons */}
          <div className="absolute -top-2 -right-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-4 w-4 text-primary/60" />
            </div>
          </div>
          <div className="absolute -bottom-1 -left-3">
            <div className="rounded-full bg-green-100  p-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-3">All caught up!</h3>
        <p className="text-gray-500 mb-8 max-w-lg">
          You're all up to date! When new notifications arrive, 
          they'll appear here to keep you informed about important updates, 
          orders, and system events.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {onViewSettings && (
            <Button onClick={onViewSettings} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Notification Settings
            </Button>
          )}
          
          <div className="text-sm text-gray-500">
            <span>or</span>
          </div>
          
          <Button variant="outline" asChild>
            <a href="https://docs.example.com/notifications" target="_blank" rel="noopener noreferrer">
              Learn about notifications
            </a>
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="mt-12 pt-8 border-t border-dashed w-full">
          <h4 className="text-sm font-medium text-gray-500 mb-4">
            What you'll get notified about:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-blue-100  p-2 flex-shrink-0">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Order Updates</p>
                <p className="text-gray-500">
                  New orders, status changes, and payment updates
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-green-100  p-2 flex-shrink-0">
                <BellRing className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">System Alerts</p>
                <p className="text-gray-500">
                  Important system updates and security notices
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-purple-100  p-2 flex-shrink-0">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Feature Updates</p>
                <p className="text-gray-500">
                  New features and platform improvements
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}