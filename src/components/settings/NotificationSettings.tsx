import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Label } from '@/src/components/ui/label'
import { Switch } from '@/src/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Separator } from '@/src/components/ui/separator'
import { Skeleton } from '@/src/components/ui/skeleton'
import { toast } from 'sonner'
import { Bell, Mail, Smartphone, Clock, CheckCircle } from 'lucide-react'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/src/hooks/useNotificationPreferences'
import { handleError } from '@/src/lib/types/error-handling'

export function NotificationSettings() {
  const { data: preferences, isLoading, error } = useNotificationPreferences()
  const updatePreferences = useUpdateNotificationPreferences()

  // Handle loading and error states
  if (isLoading) {
    return <NotificationSettingsLoading />
  }

  if (error) {
    const errorDetails = handleError(error)
    toast.error(`Failed to load notification preferences: ${errorDetails.message}`)
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load notification preferences</p>
      </div>
    )
  }

  if (!preferences) {
    return <NotificationSettingsLoading />
  }

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean | string) => {
    const newPreferences = {
      ...preferences,
      [key]: value,
    }
    updatePreferences.mutate(newPreferences)
  }

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notification Settings
          </CardTitle>
          <CardDescription>
            Control your email notification preferences and how often you receive them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about new features, tips, and promotional offers
              </p>
            </div>
            <Switch
              checked={preferences.email_marketing}
              onCheckedChange={(checked) => handlePreferenceChange('email_marketing', checked)}
              disabled={updatePreferences.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                System Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Important updates about your account, orders, and system changes
              </p>
            </div>
            <Switch
              checked={preferences.email_updates}
              onCheckedChange={(checked) => handlePreferenceChange('email_updates', checked)}
              disabled={updatePreferences.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications in your browser (when supported)
              </p>
            </div>
            <Switch
              checked={preferences.push_enabled}
              onCheckedChange={(checked) => handlePreferenceChange('push_enabled', checked)}
              disabled={updatePreferences.isPending}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Email Digest Frequency
              </Label>
              <p className="text-sm text-muted-foreground">
                How often you want to receive email summaries
              </p>
            </div>
            <Select
              value={preferences.digest_frequency}
              onValueChange={(value) => handlePreferenceChange('digest_frequency', value)}
              disabled={updatePreferences.isPending}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Status Indicator */}
      {updatePreferences.isPending && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
              Saving preferences...
            </div>
          </CardContent>
        </Card>
      )}

      {updatePreferences.isSuccess && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Preferences saved successfully
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Loading component
function NotificationSettingsLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notification Settings
          </CardTitle>
          <CardDescription>
            Control your email notification preferences and how often you receive them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}