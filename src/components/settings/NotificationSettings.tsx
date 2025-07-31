import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Label } from '@/src/components/ui/label'
import { Switch } from '@/src/components/ui/switch'
import { Separator } from '@/src/components/ui/separator'
import { toast } from 'sonner'
import { Bell, Mail, MessageSquare, ShoppingCart, Users, TrendingUp, Shield, Smartphone } from 'lucide-react'

interface NotificationSetting {
  id: string
  title: string
  description: string
  email: boolean
  push: boolean
  icon: React.ComponentType<{ className?: string }>
}

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false)
  
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: 'orders',
      title: 'Order Updates',
      description: 'Get notified when you receive new orders or when order status changes',
      email: true,
      push: true,
      icon: ShoppingCart,
    },
    {
      id: 'comments',
      title: 'Comments & Reviews',
      description: 'Notifications for new comments on your content and product reviews',
      email: true,
      push: false,
      icon: MessageSquare,
    },
    {
      id: 'followers',
      title: 'New Followers',
      description: 'Get notified when someone follows your profile or subscribes to updates',
      email: false,
      push: true,
      icon: Users,
    },
    {
      id: 'analytics',
      title: 'Analytics Reports',
      description: 'Weekly and monthly reports about your site performance and metrics',
      email: true,
      push: false,
      icon: TrendingUp,
    },
    {
      id: 'security',
      title: 'Security Alerts',
      description: 'Important security notifications and login alerts',
      email: true,
      push: true,
      icon: Shield,
    },
    {
      id: 'marketing',
      title: 'Marketing & Promotions',
      description: 'Updates about new features, tips, and promotional offers',
      email: false,
      push: false,
      icon: Bell,
    },
  ])

  const [globalSettings, setGlobalSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    pauseAll: false,
    quietHours: true,
    quietStart: '22:00',
    quietEnd: '08:00',
  })

  const updateNotification = (id: string, type: 'email' | 'push', value: boolean) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, [type]: value }
          : notification
      )
    )
  }

  const updateGlobalSetting = (key: string, value: boolean) => {
    setGlobalSettings(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const saveSettings = async () => {
    setIsLoading(true)
    try {
      // Here you would save the notification settings
      console.log('Notification settings:', { notifications, globalSettings })
      toast.success('Notification preferences updated successfully!')
    } catch (error) {
      console.error('Failed to save notification settings:', error)
      toast.error('Failed to update notification preferences. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Global Notification Settings
          </CardTitle>
          <CardDescription>
            Control your overall notification preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={globalSettings.emailNotifications}
              onCheckedChange={(checked) => updateGlobalSetting('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications in your browser
              </p>
            </div>
            <Switch
              checked={globalSettings.pushNotifications}
              onCheckedChange={(checked) => updateGlobalSetting('pushNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Pause All Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Temporarily disable all notifications for 24 hours
              </p>
            </div>
            <Switch
              checked={globalSettings.pauseAll}
              onCheckedChange={(checked) => updateGlobalSetting('pauseAll', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Disable notifications during quiet hours (10 PM - 8 AM)
              </p>
            </div>
            <Switch
              checked={globalSettings.quietHours}
              onCheckedChange={(checked) => updateGlobalSetting('quietHours', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Categories</CardTitle>
          <CardDescription>
            Choose how you want to be notified for different types of activities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notifications.map((notification, index) => {
            const Icon = notification.icon
            return (
              <div key={notification.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-base font-medium">
                        {notification.title}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {notification.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Switch
                        checked={notification.email && globalSettings.emailNotifications}
                        onCheckedChange={(checked) => updateNotification(notification.id, 'email', checked)}
                        disabled={!globalSettings.emailNotifications}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <Switch
                        checked={notification.push && globalSettings.pushNotifications}
                        onCheckedChange={(checked) => updateNotification(notification.id, 'push', checked)}
                        disabled={!globalSettings.pushNotifications}
                      />
                    </div>
                  </div>
                </div>
                {index < notifications.length - 1 && <Separator className="mt-6" />}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Email Frequency */}
      <Card>
        <CardHeader>
          <CardTitle>Email Frequency</CardTitle>
          <CardDescription>
            Control how often you receive email notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Instant</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Receive emails immediately when events occur
              </p>
              <input type="radio" name="frequency" value="instant" defaultChecked className="sr-only" />
              <Label className="text-sm font-medium cursor-pointer">
                <input type="radio" name="frequency" value="instant" defaultChecked className="mr-2" />
                Real-time notifications
              </Label>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Daily Digest</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Receive a daily summary of all notifications
              </p>
              <Label className="text-sm font-medium cursor-pointer">
                <input type="radio" name="frequency" value="daily" className="mr-2" />
                Once per day at 9 AM
              </Label>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Weekly Summary</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Receive a weekly summary every Monday
              </p>
              <Label className="text-sm font-medium cursor-pointer">
                <input type="radio" name="frequency" value="weekly" className="mr-2" />
                Weekly on Mondays
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
}