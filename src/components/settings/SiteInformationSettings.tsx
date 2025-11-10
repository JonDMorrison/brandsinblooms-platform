import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { toast } from 'sonner'
import { Globe } from 'lucide-react'
import { useCurrentSite, useSitePermissions } from '@/src/hooks/useSite'
import { useUpdateSiteSettings } from '@/src/hooks/useSiteSettings'

// Site Information Schema
const siteInfoSchema = z.object({
  siteName: z.string().min(1, 'Site name is required').max(100, 'Site name must be less than 100 characters'),
  siteDescription: z.string().max(500, 'Description must be less than 500 characters').optional(),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters').regex(/^[a-zA-Z0-9-]+$/, 'Subdomain can only contain letters, numbers, and hyphens'),
  timezone: z.string().optional(),
})

type SiteInfoFormData = z.infer<typeof siteInfoSchema>

export function SiteInformationSettings() {
  const { site, loading: siteLoading } = useCurrentSite()
  const { canManage } = useSitePermissions()
  const updateSiteSettings = useUpdateSiteSettings()

  // Get the app domain for display
  const appDomain = typeof window !== 'undefined'
    ? window.location.host
    : process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3001'

  // Site Information Form
  const siteInfoForm = useForm<SiteInfoFormData>({
    resolver: zodResolver(siteInfoSchema),
    defaultValues: {
      siteName: site?.name || 'My Site',
      siteDescription: site?.description || '',
      subdomain: site?.subdomain || '',
      timezone: site?.timezone || 'America/New_York',
    },
  })

  // Update form when site data loads
  React.useEffect(() => {
    if (site) {
      siteInfoForm.reset({
        siteName: site.name || 'My Site',
        siteDescription: site.description || '',
        subdomain: site.subdomain || '',
        timezone: site.timezone || 'America/New_York',
      })
    }
  }, [site, siteInfoForm])

  // Submit handler for Site Information
  const onSubmitSiteInfo = async (data: SiteInfoFormData) => {
    if (!canManage) {
      toast.error('You do not have permission to update site settings.')
      return
    }

    updateSiteSettings.mutate({
      name: data.siteName,
      description: data.siteDescription,
      subdomain: data.subdomain,
      timezone: data.timezone,
      // Preserve current business information (convert null to undefined)
      business_name: site?.business_name ?? undefined,
      business_email: site?.business_email ?? undefined,
      business_phone: site?.business_phone ?? undefined,
      business_address: site?.business_address ?? undefined,
    })
  }

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ]

  if (siteLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (!site) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Site Not Found</CardTitle>
            <CardDescription>
              Unable to load site settings. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <Form {...siteInfoForm}>
      <form onSubmit={siteInfoForm.handleSubmit(onSubmitSiteInfo)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Site Information
            </CardTitle>
            <CardDescription>
              Configure your site&apos;s basic information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={siteInfoForm.control}
              name="siteName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your site name" {...field} disabled={!canManage} />
                  </FormControl>
                  <FormDescription>
                    This will appear in your site&apos;s title and navigation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={siteInfoForm.control}
              name="siteDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what your site is about..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={!canManage}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of your site&apos;s purpose.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={siteInfoForm.control}
              name="subdomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subdomain</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input
                        placeholder="mysite"
                        {...field}
                        disabled={!canManage}
                        className="rounded-r-none"
                      />
                      <div className="flex items-center px-3 border border-l-0 rounded-r-md bg-muted text-gray-500 text-sm">
                        .{appDomain}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose a unique subdomain for your site.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={siteInfoForm.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canManage}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Used for displaying dates and times.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {canManage && (
          <div className="flex justify-end">
            <Button type="submit" disabled={updateSiteSettings.loading} className="btn-gradient-primary">
              {updateSiteSettings.loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
