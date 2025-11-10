import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form'
import { toast } from 'sonner'
import { Briefcase } from 'lucide-react'
import { useCurrentSite, useSitePermissions } from '@/src/hooks/useSite'
import { useUpdateSiteSettings } from '@/src/hooks/useSiteSettings'

// Business Information Schema
const businessInfoSchema = z.object({
  businessName: z.string().optional(),
  businessEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
})

type BusinessInfoFormData = z.infer<typeof businessInfoSchema>

export function BusinessSettings() {
  const { site, loading: siteLoading } = useCurrentSite()
  const { canManage } = useSitePermissions()
  const updateSiteSettings = useUpdateSiteSettings()

  // Business Information Form
  const businessInfoForm = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessName: site?.business_name || '',
      businessEmail: site?.business_email || '',
      businessPhone: site?.business_phone || '',
      businessAddress: site?.business_address || '',
    },
  })

  // Update form when site data loads
  React.useEffect(() => {
    if (site) {
      businessInfoForm.reset({
        businessName: site.business_name || '',
        businessEmail: site.business_email || '',
        businessPhone: site.business_phone || '',
        businessAddress: site.business_address || '',
      })
    }
  }, [site, businessInfoForm])

  // Submit handler for Business Information
  const onSubmitBusinessInfo = async (data: BusinessInfoFormData) => {
    if (!canManage) {
      toast.error('You do not have permission to update site settings.')
      return
    }

    updateSiteSettings.mutate({
      // Preserve current site information (convert null to undefined)
      name: site?.name || 'My Site',
      description: site?.description ?? undefined,
      subdomain: site?.subdomain || '',
      timezone: site?.timezone ?? undefined,
      // Update business information
      business_name: data.businessName,
      business_email: data.businessEmail,
      business_phone: data.businessPhone,
      business_address: data.businessAddress,
    })
  }

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
              Unable to load business settings. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <Form {...businessInfoForm}>
      <form onSubmit={businessInfoForm.handleSubmit(onSubmitBusinessInfo)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Optional business details for your site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={businessInfoForm.control}
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
              control={businessInfoForm.control}
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
              control={businessInfoForm.control}
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
              control={businessInfoForm.control}
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
            <Button type="submit" disabled={updateSiteSettings.loading} className="btn-gradient-primary">
              {updateSiteSettings.loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
