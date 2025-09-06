import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  Package,
  Palette,
  ShoppingCart,
  User,
  Settings,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { useActivityLogs } from '@/src/hooks/useActivityLogs';
import { Skeleton } from '@/src/components/ui/skeleton';

const getActivityIcon = (type: string) => {
  const iconProps = { className: 'h-4 w-4' };

  switch (type) {
    case 'page_created':
      return <FileText {...iconProps} />;
    case 'product_updated':
      return <Package {...iconProps} />;
    case 'order_received':
      return <ShoppingCart {...iconProps} />;
    case 'design_changed':
      return <Palette {...iconProps} />;
    case 'profile_updated':
      return <User {...iconProps} />;
    case 'settings_changed':
      return <Settings {...iconProps} />;
    default:
      return <FileText {...iconProps} />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'page_created':
      return 'bg-blue-100 text-blue-800  ';
    case 'product_updated':
      return 'bg-green-100 text-green-800  ';
    case 'order_received':
      return 'bg-purple-100 text-purple-800  ';
    case 'design_changed':
      return 'bg-pink-100 text-pink-800  ';
    case 'profile_updated':
      return 'bg-orange-100 text-orange-800  ';
    case 'settings_changed':
      return 'bg-gray-100 text-gray-800  ';
    default:
      return 'bg-gray-100 text-gray-800  ';
  }
};

export function ActivityFeed() {
  const { data: activities, isLoading, error } = useActivityLogs(10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4 max-h-96 overflow-y-auto'>
          {error ? (
            <div className='text-center py-8 text-red-500'>
              <p className='text-sm'>Error loading activities: {error.message}</p>
            </div>
          ) : isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='flex items-start space-x-3 p-3'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-[250px]' />
                  <Skeleton className='h-3 w-[200px]' />
                  <Skeleton className='h-2 w-[100px]' />
                </div>
              </div>
            ))
          ) : activities && activities.length > 0 ? (
            activities.map((activity) => (
              <div
                key={activity.id}
                className='flex items-start space-x-3 p-3 rounded-lg hover:bg-gradient-primary-50/50 transition-colors'
              >
                <div
                  className={`p-2 rounded-full ${getActivityColor(
                    activity.activity_type
                  )}`}
                >
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className='flex-1 space-y-1'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-medium'>{activity.title}</p>
                    <Badge variant='outline' className='text-xs'>
                      {activity.user_id ? 'You' : 'System'}
                    </Badge>
                  </div>
                  <p className='text-sm text-gray-500'>
                    {activity.description}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className='text-center py-8 text-gray-500'>
              <p className='text-sm'>No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
