import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Globe, ExternalLink, Eye } from 'lucide-react'
import { useCurrentSite, useSitePermissions } from '@/src/hooks/useSite'
import { DomainConfiguration } from '@/src/components/site/DomainConfiguration'
import { SitePreview } from '@/src/components/site/SitePreview'

const siteSchema = z.object({
  siteName: z.string().min(1, 'Site name is required').max(100, 'Site name must be less than 100 characters'),
  siteDescription: z.string().max(500, 'Description must be less than 500 characters').optional(),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters').regex(/^[a-zA-Z0-9-]+$/, 'Subdomain can only contain letters, numbers, and hyphens'),
  timezone: z.string().optional(),
  businessName: z.string().optional(),
  businessEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
})

type SiteFormData = z.infer<typeof siteSchema>

export function SiteSettings() {
  const { site, loading: siteLoading } = useCurrentSite()
  const { canManage, canEdit } = useSitePermissions()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      siteName: site?.name || 'My Site',
      siteDescription: site?.description || '',
      subdomain: site?.subdomain || '',
      timezone: site?.timezone || 'America/New_York',
      businessName: site?.business_name || '',
      businessEmail: site?.business_email || '',
      businessPhone: site?.business_phone || '',
      businessAddress: site?.business_address || '',
    },
  })

  // Update form when site data loads
  React.useEffect(() => {
    if (site) {
      form.reset({
        siteName: site.name || 'My Site',
        siteDescription: site.description || '',
        subdomain: site.subdomain || '',
        timezone: site.timezone || 'America/New_York',
        businessName: site.business_name || '',
        businessEmail: site.business_email || '',
        businessPhone: site.business_phone || '',
        businessAddress: site.business_address || '',
      })
    }
  }, [site, form])

  const onSubmit = async (data: SiteFormData) => {
    if (!canManage) {
      toast.error('You do not have permission to update site settings.')
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement site update API call
      console.log('Saving site settings:', data)
      
      toast.success('Site settings updated successfully!')
    } catch (error) {
      console.error('Site settings update error:', error)
      toast.error('Failed to update site settings. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
    <div className="space-y-6">
      {/* Site Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{site.name}</h3>
          <p className="text-sm text-muted-foreground">
            Configure your site settings and business information
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!canManage && (
            <Badge variant="secondary">
              {canEdit ? 'Editor' : 'Viewer'}
            </Badge>
          )}
          <SitePreview 
            showAsDialog 
            triggerButton={
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            }
          />
          {site.custom_domain && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://${site.custom_domain}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Site Settings Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Site Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Site Information
                  </CardTitle>
                  <CardDescription>
                    Configure your site's basic information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your site name" {...field} disabled={!canManage} />
                        </FormControl>
                        <FormDescription>
                          This will appear in your site's title and navigation.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                          A brief description of your site's purpose.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                            <div className="flex items-center px-3 border border-l-0 rounded-r-md bg-muted text-muted-foreground text-sm">
                              .blooms.cc
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
                    control={form.control}
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

              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>
                    Optional business details for your site.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your business name" {...field} disabled={!canManage} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Email</FormLabel>
                        <FormControl>
                          <Input placeholder="contact@yourbusiness.com" {...field} disabled={!canManage} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} disabled={!canManage} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="123 Main St, City, State, ZIP"
                            className="resize-none"
                            rows={2}
                            {...field}
                            disabled={!canManage}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {canManage && (
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </div>

        {/* Domain Configuration */}
        <div className="space-y-6">
          <DomainConfiguration />
        </div>
      </div>
    </div>
  )
}