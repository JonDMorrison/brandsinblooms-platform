import { useState } from 'react'
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
import { toast } from 'sonner'
import { Globe, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react'

const siteSchema = z.object({
  siteName: z.string().min(1, 'Site name is required').max(100, 'Site name must be less than 100 characters'),
  siteDescription: z.string().max(500, 'Description must be less than 500 characters').optional(),
  domain: z.string().min(1, 'Domain is required').regex(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format'),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters').regex(/^[a-zA-Z0-9-]+$/, 'Subdomain can only contain letters, numbers, and hyphens'),
  timezone: z.string().min(1, 'Timezone is required'),
  language: z.string().min(1, 'Language is required'),
  metaTitle: z.string().max(60, 'Meta title should be less than 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description should be less than 160 characters').optional(),
  metaKeywords: z.string().max(200, 'Meta keywords should be less than 200 characters').optional(),
  facebookUrl: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  twitterUrl: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  instagramUrl: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  youtubeUrl: z.string().url('Invalid YouTube URL').optional().or(z.literal('')),
})

type SiteFormData = z.infer<typeof siteSchema>

export function SiteSettings() {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      siteName: 'Brands and Blooms Platform',
      siteDescription: 'AI-powered platform for creating beautiful websites and managing content.',
      domain: 'brandsandblooms.com',
      subdomain: 'my-site',
      timezone: 'America/New_York',
      language: 'en',
      metaTitle: 'Brands and Blooms - AI Website Builder',
      metaDescription: 'Create stunning websites with AI-powered tools and manage your content efficiently.',
      metaKeywords: 'website builder, AI, content management, brands, blooms',
      facebookUrl: '',
      twitterUrl: '',
      instagramUrl: '',
      linkedinUrl: '',
      youtubeUrl: '',
    },
  })

  const onSubmit = async (data: SiteFormData) => {
    setIsLoading(true)
    try {
      // Here you would save the site settings
      console.log('Site settings:', data)
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

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
  ]

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Site Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Basic Site Information
              </CardTitle>
              <CardDescription>
                Configure your site's basic information and appearance.
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
                      <Input placeholder="Enter your site name" {...field} />
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
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of your site (max 500 characters).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones.map((timezone) => (
                            <SelectItem key={timezone} value={timezone}>
                              {timezone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languages.map((language) => (
                            <SelectItem key={language.code} value={language.code}>
                              {language.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Domain Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Domain Configuration</CardTitle>
              <CardDescription>
                Configure your custom domain and subdomain settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="yourdomain.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your custom domain (without www or https://).
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
                      <div className="flex items-center">
                        <Input placeholder="my-site" {...field} />
                        <span className="ml-2 text-sm text-muted-foreground">
                          .brandsandblooms.com
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your free subdomain on our platform.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Current URLs:</strong>
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Primary</Badge>
                    <span className="text-sm">https://{form.watch('domain')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Fallback</Badge>
                    <span className="text-sm">https://{form.watch('subdomain')}.brandsandblooms.com</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Optimize your site for search engines.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="metaTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Your site's meta title" {...field} />
                    </FormControl>
                    <FormDescription>
                      The title that appears in search results (max 60 characters).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metaDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your site for search engines..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The description that appears in search results (max 160 characters).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metaKeywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Keywords</FormLabel>
                    <FormControl>
                      <Input placeholder="keyword1, keyword2, keyword3" {...field} />
                    </FormControl>
                    <FormDescription>
                      Comma-separated keywords for your site (max 200 characters).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>
                Connect your social media profiles to your site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="facebookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://facebook.com/yourpage" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twitterUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        Twitter
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://twitter.com/yourusername" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instagramUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/yourusername" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/company/yourcompany" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        <Youtube className="h-4 w-4" />
                        YouTube
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtube.com/channel/yourchannel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}