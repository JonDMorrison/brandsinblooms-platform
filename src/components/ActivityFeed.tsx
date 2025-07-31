import { formatDistanceToNow } from 'date-fns'
import { FileText, Package, Palette, ShoppingCart, User, Settings } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'

interface ActivityItem {
  id: string
  type: 'page_created' | 'product_updated' | 'order_received' | 'design_changed' | 'profile_updated' | 'settings_changed'
  title: string
  description: string
  timestamp: Date
  user: string
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'page_created',
    title: 'New page created',
    description: 'Landing page "Welcome to Brands & Blooms" has been published',
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    user: 'You'
  },
  {
    id: '2',
    type: 'product_updated',
    title: 'Product updated',
    description: 'Rose Bouquet pricing has been updated to $89.99',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    user: 'You'
  },
  {
    id: '3',
    type: 'order_received',
    title: 'New order received',
    description: 'Order #1247 from Sarah Johnson for $156.50',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    user: 'System'
  },
  {
    id: '4',
    type: 'design_changed',
    title: 'Design updated',
    description: 'Header color scheme changed to purple gradient',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    user: 'You'
  },
  {
    id: '5',
    type: 'profile_updated',
    title: 'Profile updated',
    description: 'Business hours and contact information updated',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    user: 'You'
  },
  {
    id: '6',
    type: 'settings_changed',
    title: 'Settings updated',
    description: 'Email notifications enabled for new orders',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    user: 'You'
  }
]

const getActivityIcon = (type: ActivityItem['type']) => {
  const iconProps = { className: 'h-4 w-4' }
  
  switch (type) {
    case 'page_created':
      return <FileText {...iconProps} />
    case 'product_updated':
      return <Package {...iconProps} />
    case 'order_received':
      return <ShoppingCart {...iconProps} />
    case 'design_changed':
      return <Palette {...iconProps} />
    case 'profile_updated':
      return <User {...iconProps} />
    case 'settings_changed':
      return <Settings {...iconProps} />
    default:
      return <FileText {...iconProps} />
  }
}

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'page_created':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'product_updated':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'order_received':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'design_changed':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
    case 'profile_updated':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    case 'settings_changed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <Badge variant="outline" className="text-xs">
                    {activity.user}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}