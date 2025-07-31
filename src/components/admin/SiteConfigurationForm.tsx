'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Switch } from '@/src/components/ui/switch'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Globe,
  Building,
  Palette,
  Settings,
  Clock,
  MapPin,
  Phone,
  Mail,
  User
} from 'lucide-react'
import { 
  getSiteConfiguration,
  updateSiteConfiguration,
  type SiteConfigurationUpdate 
} from '@/src/lib/admin/sites'
import type { Database } from '@/src/lib/database/types'

type Site = Database['public']['Tables']['sites']['Row']

// Schema for site configuration form
const siteConfigSchema = z.object({
  // Basic Information
  name: z.string().min(3, 'Site name must be at least 3 characters'),
  description: z.string().optional(),
  
  // Business Information
  business_name: z.string().optional(),
  business_email: z.string().email().optional().or(z.literal('')),
  business_phone: z.string().optional(),
  business_address: z.string().optional(),
  
  // Branding
  primary_color: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  
  // Location
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().optional(),
  
  // Settings
  custom_domain: z.string().optional(),
  is_active: z.boolean(),
  is_published: z.boolean(),
  
  // Admin Notes
  admin_notes: z.string().optional(),
  
  // Business Hours
  business_hours: z.object({
    monday: z.object({ 
      open: z.string(), 
      close: z.string(), 
      closed: z.boolean() 
    }).optional(),
    tuesday: z.object({ 
      open: z.string(), 
      close: z.string(), 
      closed: z.boolean() 
    }).optional(),
    wednesday: z.object({ 
      open: z.string(), 
      close: z.string(), 
      closed: z.boolean() 
    }).optional(),
    thursday: z.object({ 
      open: z.string(), 
      close: z.string(), 
      closed: z.boolean() 
    }).optional(),
    friday: z.object({ 
      open: z.string(), 
      close: z.string(), 
      closed: z.boolean() 
    }).optional(),
    saturday: z.object({ 
      open: z.string(), 
      close: z.string(), 
      closed: z.boolean() 
    }).optional(),
    sunday: z.object({ 
      open: z.string(), 
      close: z.string(), 
      closed: z.boolean() 
    }).optional(),
  }).optional()
})

type SiteConfigForm = z.infer<typeof siteConfigSchema>

interface SiteConfigurationFormProps {
  siteId: string
  onSave?: (updatedSite: Site) => void
  onCancel?: () => void
}

const defaultBusinessHours = {
  monday: { open: '09:00', close: '17:00', closed: false },
  tuesday: { open: '09:00', close: '17:00', closed: false },
  wednesday: { open: '09:00', close: '17:00', closed: false },
  thursday: { open: '09:00', close: '17:00', closed: false },
  friday: { open: '09:00', close: '17:00', closed: false },
  saturday: { open: '09:00', close: '17:00', closed: false },
  sunday: { open: '10:00', close: '16:00', closed: false },
}

const dayNames = {
  monday: 'Monday',
  tuesday: 'Tuesday', 
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
}

export function SiteConfigurationForm({ siteId, onSave, onCancel }: SiteConfigurationFormProps) {
  const [site, setSite] = useState<Site | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<SiteConfigForm>({
    resolver: zodResolver(siteConfigSchema),
    defaultValues: {
      name: '',
      description: '',
      business_name: '',
      business_email: '',
      business_phone: '',
      business_address: '',
      primary_color: '#22c55e',
      logo_url: '',
      custom_domain: '',
      is_active: true,
      is_published: false,
      admin_notes: '',
      timezone: 'America/Los_Angeles',
      business_hours: defaultBusinessHours
    }
  })

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = form

  // Load site configuration
  useEffect(() => {
    const loadSite = async () => {
      try {
        setLoading(true)
        const siteData = await getSiteConfiguration(siteId)
        
        if (!siteData) {
          setError('Site not found')
          return
        }

        setSite(siteData)
        
        // Populate form with site data
        setValue('name', siteData.name)
        setValue('description', siteData.description || '')
        setValue('business_name', siteData.business_name || '')
        setValue('business_email', siteData.business_email || '')
        setValue('business_phone', siteData.business_phone || '')
        setValue('business_address', siteData.business_address || '')
        setValue('primary_color', siteData.primary_color || '#22c55e')
        setValue('logo_url', siteData.logo_url || '')
        setValue('custom_domain', siteData.custom_domain || '')
        setValue('is_active', siteData.is_active || false)
        setValue('is_published', siteData.is_published || false)
        setValue('admin_notes', siteData.admin_notes || '')
        setValue('timezone', siteData.timezone || 'America/Los_Angeles')
        setValue('latitude', siteData.latitude || undefined)
        setValue('longitude', siteData.longitude || undefined)
        
        // Handle business hours
        const hours = siteData.business_hours as any || defaultBusinessHours
        setValue('business_hours', hours)
        
        setError(null)
      } catch (err: any) {
        console.error('Error loading site:', err)
        setError(err.message || 'Failed to load site configuration')
      } finally {
        setLoading(false)
      }
    }

    if (siteId) {
      loadSite()
    }
  }, [siteId, setValue])

  const onSubmit = async (data: SiteConfigForm) => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const updates: SiteConfigurationUpdate = {
        name: data.name,
        description: data.description,
        business_name: data.business_name,
        business_email: data.business_email,
        business_phone: data.business_phone,
        business_address: data.business_address,
        primary_color: data.primary_color,
        logo_url: data.logo_url,
        custom_domain: data.custom_domain,
        is_active: data.is_active,
        is_published: data.is_published,
        admin_notes: data.admin_notes,
        timezone: data.timezone,
        latitude: data.latitude,
        longitude: data.longitude,
        business_hours: data.business_hours
      }

      const success = await updateSiteConfiguration(siteId, updates)
      
      if (success) {
        setSuccess(true)
        
        // Refresh site data
        const updatedSite = await getSiteConfiguration(siteId)
        if (updatedSite) {
          setSite(updatedSite)
          onSave?.(updatedSite)
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err: any) {
      console.error('Error updating site:', err)
      setError(err.message || 'Failed to update site configuration')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!site) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Site not found'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Site Configuration</h2>
          <p className="text-gray-600">
            Configure settings for <Badge variant="secondary">{site.subdomain}.brandsinblooms.com</Badge>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {site.is_active ? (
            <Badge variant="default">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
          {site.is_published ? (
            <Badge variant="default">Published</Badge>
          ) : (
            <Badge variant="outline">Draft</Badge>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Site configuration updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Hours
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Site Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Site Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Brief description of this site..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Site URL</Label>
                <div className="flex items-center">
                  <Input
                    value={site.subdomain}
                    disabled
                    className="rounded-r-none bg-gray-50"
                  />
                  <div className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-md text-sm text-gray-600">
                    .brandsinblooms.com
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Subdomain cannot be changed after site creation
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Information */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  {...register('business_name')}
                  placeholder="Green Thumb Garden Center"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_email">Business Email</Label>
                  <Input
                    id="business_email"
                    type="email"
                    {...register('business_email')}
                    placeholder="info@example.com"
                    className={errors.business_email ? 'border-red-500' : ''}
                  />
                  {errors.business_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.business_email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="business_phone">Business Phone</Label>
                  <Input
                    id="business_phone"
                    {...register('business_phone')}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="business_address">Business Address</Label>
                <Textarea
                  id="business_address"
                  {...register('business_address')}
                  placeholder="123 Garden Way, Green City, GC 12345"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    {...register('latitude', { valueAsNumber: true })}
                    placeholder="37.7749"
                  />
                </div>

                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    {...register('longitude', { valueAsNumber: true })}
                    placeholder="-122.4194"
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    {...register('timezone')}
                    placeholder="America/Los_Angeles"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="primary_color">Primary Brand Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    {...register('primary_color')}
                    className="w-20 h-10"
                  />
                  <Input
                    {...register('primary_color')}
                    placeholder="#22c55e"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  type="url"
                  {...register('logo_url')}
                  placeholder="https://example.com/logo.png"
                  className={errors.logo_url ? 'border-red-500' : ''}
                />
                {errors.logo_url && (
                  <p className="text-red-500 text-sm mt-1">{errors.logo_url.message}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  Recommended size: 200x60 pixels (PNG or JPG)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours */}
        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(dayNames).map(([day, label]) => {
                const dayData = watch(`business_hours.${day as keyof typeof dayNames}`)
                
                return (
                  <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="w-20 font-medium">{label}</div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!dayData?.closed}
                        onCheckedChange={(checked) => {
                          setValue(`business_hours.${day as keyof typeof dayNames}.closed`, !checked)
                        }}
                      />
                      <span className="text-sm text-gray-600">Open</span>
                    </div>

                    {!dayData?.closed && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          {...register(`business_hours.${day as keyof typeof dayNames}.open`)}
                          className="w-32"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          {...register(`business_hours.${day as keyof typeof dayNames}.close`)}
                          className="w-32"
                        />
                      </div>
                    )}

                    {dayData?.closed && (
                      <div className="flex-1 text-gray-500 text-sm">Closed</div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="custom_domain">Custom Domain</Label>
                <Input
                  id="custom_domain"
                  {...register('custom_domain')}
                  placeholder="www.example.com"
                />
                <p className="text-gray-500 text-sm mt-1">
                  Optional custom domain (requires DNS configuration)
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_active">Site Active</Label>
                    <p className="text-sm text-gray-600">
                      Controls whether the site is accessible to visitors
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    {...register('is_active')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_published">Site Published</Label>
                    <p className="text-sm text-gray-600">
                      Controls whether the site appears in search results
                    </p>
                  </div>
                  <Switch
                    id="is_published"
                    {...register('is_published')}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea
                  id="admin_notes"
                  {...register('admin_notes')}
                  placeholder="Private notes for admin use..."
                  rows={3}
                />
                <p className="text-gray-500 text-sm mt-1">
                  These notes are only visible to administrators
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-gray-500">
          {isDirty ? 'You have unsaved changes' : 'All changes saved'}
        </div>
        
        <div className="flex gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          
          <Button 
            type="submit" 
            disabled={saving || !isDirty}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}