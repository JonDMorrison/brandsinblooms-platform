'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Globe, Calendar, Settings, ExternalLink, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { useAuth } from '@/src/contexts/AuthContext'
import { useSiteSwitcher, useUserSites } from '@/src/hooks/useSite'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/src/components/ui/dialog'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Progress } from '@/src/components/ui/progress'
import { toast } from 'sonner'
import { supabase } from '@/src/lib/supabase/client'
import { getPrivacyPolicyTemplate, getTermsOfServiceTemplate } from '@/src/lib/content/templates'

interface Site {
  id: string
  name: string
  business_name: string | null
  subdomain: string
  custom_domain: string | null
  created_at: string
  is_active: boolean | null
  role: string
}

interface GenerationStatus {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  siteId?: string
  siteName?: string
  siteUrl?: string
  errorMessage?: string
  errorCode?: string
}

export default function DashboardSitesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { switchSite } = useSiteSwitcher()
  const { sites: userSites, loading: sitesLoading, error: sitesError, refresh: refreshSites } = useUserSites()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newSite, setNewSite] = useState({
    name: '',
    description: '',
    industry: '',
    location: '',
    email: '',
    phone: '',
    subdomain: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  // Transform sites data to match the interface
  const sites: Site[] = (userSites || []).map(access => ({
    id: access.site.id,
    name: access.site.name,
    business_name: access.site.business_name || null,
    subdomain: access.site.subdomain,
    custom_domain: access.site.custom_domain,
    created_at: access.site.created_at,
    is_active: access.site.is_active ?? true,
    role: access.role
  }))

  // Auto-generate subdomain from name
  useEffect(() => {
    if (newSite.name && !newSite.subdomain) {
      const generatedSubdomain = newSite.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50)
      setNewSite(prev => ({ ...prev, subdomain: generatedSubdomain }))
    }
  }, [newSite.name, newSite.subdomain])

  // Update status message based on progress
  useEffect(() => {
    if (!generationStatus) return

    const { status, progress } = generationStatus

    if (status === 'pending') {
      setStatusMessage('Initializing site generation...')
    } else if (status === 'processing') {
      if (progress < 20) {
        setStatusMessage('Analyzing your business information...')
      } else if (progress < 50) {
        setStatusMessage('Generating site content with AI...')
      } else if (progress < 75) {
        setStatusMessage('Creating your website...')
      } else if (progress < 90) {
        setStatusMessage('Setting up pages...')
      } else {
        setStatusMessage('Finalizing your site...')
      }
    } else if (status === 'completed') {
      setStatusMessage('Site created successfully!')
    } else if (status === 'failed') {
      setStatusMessage('Generation failed')
    }
  }, [generationStatus])

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    let attempts = 0
    const maxAttempts = 60 // 2 minutes max (2 seconds interval)

    const poll = async () => {
      try {
        const response = await fetch(`/api/sites/generate/${jobId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch job status')
        }

        const result = await response.json()
        const status: GenerationStatus = result.data

        setGenerationStatus(status)

        if (status.status === 'completed') {
          // Success! Now create privacy, terms, and seasonal guide pages
          await createAdditionalPages(status.siteId!)
          return true
        } else if (status.status === 'failed') {
          toast.error(status.errorMessage || 'Site generation failed')
          setIsGenerating(false)
          return true
        }

        // Continue polling
        attempts++
        if (attempts >= maxAttempts) {
          toast.error('Site generation timed out. Please check back later.')
          setIsGenerating(false)
          return true
        }

        // Poll again in 2 seconds
        setTimeout(poll, 2000)
        return false

      } catch (error) {
        console.error('Error polling job status:', error)
        attempts++
        if (attempts >= maxAttempts) {
          toast.error('Failed to check generation status')
          setIsGenerating(false)
          return true
        }
        setTimeout(poll, 2000)
        return false
      }
    }

    poll()
  }, [])

  // Create additional pages using templates
  const createAdditionalPages = async (siteId: string) => {
    try {
      setStatusMessage('Adding Privacy Policy, Terms, and Seasonal Guide pages...')

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get templates
      const privacyContent = getPrivacyPolicyTemplate(
        'Privacy Policy',
        `Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        { complexity: 'detailed' }
      )

      const termsContent = getTermsOfServiceTemplate(
        'Terms of Service',
        `Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        { complexity: 'detailed' }
      )

      const seasonalGuideContent = getSeasonalGuideTemplate(
        newSite.name,
        newSite.location || 'your area'
      )

      // Create pages
      const pagesToCreate = [
        {
          site_id: siteId,
          title: 'Privacy Policy',
          slug: 'privacy',
          content_type: 'privacy_page',
          content: privacyContent,
          is_published: true,
          sort_order: 90,
          author_id: user.id
        },
        {
          site_id: siteId,
          title: 'Terms of Service',
          slug: 'terms',
          content_type: 'terms_page',
          content: termsContent,
          is_published: true,
          sort_order: 100,
          author_id: user.id
        },
        {
          site_id: siteId,
          title: 'Seasonal Plant Care Guide',
          slug: 'seasonal-guide',
          content_type: 'seasonal_guide',
          content: seasonalGuideContent,
          is_published: true,
          sort_order: 110,
          author_id: user.id
        }
      ]

      const { error } = await supabase
        .from('content')
        .insert(pagesToCreate)

      if (error) {
        console.error('Error creating additional pages:', error)
        // Don't fail the whole process, just log it
        toast.warning('Site created, but some pages may need manual setup')
      }

      // Success!
      toast.success('Site created successfully with all pages!')
      setIsCreateModalOpen(false)
      resetForm()

      // Refresh sites list
      await refreshSites()

      // Switch to new site and redirect
      await switchSite(siteId)
      router.push('/dashboard')

    } catch (error) {
      console.error('Error creating additional pages:', error)
      toast.error('Site created, but some pages failed to generate')
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate site using AI
  const generateSiteWithAI = async () => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }

    // Validate required fields
    if (!newSite.name || !newSite.description) {
      toast.error('Please provide at least a site name and description')
      return
    }

    setIsGenerating(true)
    setGenerationStatus(null)

    try {
      // Build API request
      const requestBody = {
        prompt: `Create a website for ${newSite.name}. ${newSite.description}`,
        name: newSite.name,
        industry: newSite.industry || undefined,
        location: newSite.location || undefined,
        email: newSite.email || undefined,
        phone: newSite.phone || undefined,
        description: newSite.description
      }

      // Call AI generation API
      const response = await fetch('/api/sites/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start site generation')
      }

      const result = await response.json()
      const { jobId, statusUrl } = result.data

      toast.success('Site generation started!')

      // Start polling for status
      pollJobStatus(jobId)

    } catch (error) {
      console.error('Error generating site:', error)
      const err = error as Error
      toast.error(err.message || 'Failed to generate site')
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setNewSite({
      name: '',
      description: '',
      industry: '',
      location: '',
      email: '',
      phone: '',
      subdomain: ''
    })
    setGenerationStatus(null)
    setStatusMessage('')
  }

  const handleModalClose = (open: boolean) => {
    if (!isGenerating) {
      setIsCreateModalOpen(open)
      if (!open) {
        resetForm()
      }
    }
  }

  const handleSiteSwitch = async (siteId: string) => {
    try {
      await switchSite(siteId)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to switch site:', error)
      toast.error('Failed to switch to selected site')
    }
  }

  const getSiteUrl = (site: Site) => {
    if (site.custom_domain) {
      return `https://${site.custom_domain}`
    }
    const appDomain = typeof window !== 'undefined'
      ? window.location.host
      : 'localhost:3001'
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? 'https'
      : 'http'
    return `${protocol}://${site.subdomain}.${appDomain}`
  }

  // Show error state
  if (sitesError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load sites</p>
          <Button onClick={() => refreshSites()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Sites</h1>
          <p className="text-gray-500 mt-2">
            Manage all your websites from one place
          </p>
        </div>
        <Button
          className="btn-gradient-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Site
        </Button>
      </div>

      {/* Sites Grid */}
      {sitesLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sites.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sites yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first AI-powered website in minutes
            </p>
            <Button
              className="btn-gradient-primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Create Your First Site
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <Card key={site.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{site.name}</CardTitle>
                    {site.business_name && (
                      <CardDescription className="mt-1">
                        {site.business_name}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={site.is_active ? "default" : "secondary"}>
                    {site.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-500">
                    <Globe className="h-4 w-4 mr-2" />
                    <a
                      href={getSiteUrl(site)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary flex items-center"
                    >
                      {site.custom_domain || `${site.subdomain}.${typeof window !== 'undefined' ? window.location.host : 'localhost:3001'}`}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Created {new Date(site.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Settings className="h-4 w-4 mr-2" />
                    Role: {site.role}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSiteSwitch(site.id)}
                  >
                    Open Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(getSiteUrl(site), '_blank')}
                  >
                    View Site
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI-Powered Create Site Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Create AI-Powered Website
            </DialogTitle>
            <DialogDescription>
              {isGenerating
                ? 'Our AI is creating your professional website with all the pages you need'
                : 'Tell us about your business and we\'ll generate a complete website with content, design, and essential pages'}
            </DialogDescription>
          </DialogHeader>

          {isGenerating ? (
            // Generation Progress View
            <div className="space-y-6 py-6">
              <div className="text-center space-y-4">
                {generationStatus?.status === 'completed' ? (
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                ) : generationStatus?.status === 'failed' ? (
                  <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                ) : (
                  <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
                )}

                <div>
                  <h3 className="font-semibold text-lg mb-2">{statusMessage}</h3>
                  <p className="text-sm text-gray-500">
                    {generationStatus?.status === 'completed'
                      ? 'Your site is ready! Redirecting...'
                      : 'This usually takes 30-60 seconds'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{generationStatus?.progress || 0}%</span>
                </div>
                <Progress value={generationStatus?.progress || 0} className="h-2" />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900">What we're creating:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Home page with hero section
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    About page with your story
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Contact page with your info
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Privacy Policy page
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Terms of Service page
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Seasonal Plant Care Guide
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Custom design & branding
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            // Input Form View
            <div className="space-y-4 py-4">
              {/* Required Fields */}
              <div className="space-y-4 pb-4 border-b">
                <h4 className="font-semibold text-sm text-gray-700">Required Information</h4>

                <div className="space-y-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    placeholder="Green Thumb Gardens"
                    value={newSite.name}
                    onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Business Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us about your business, what you offer, and what makes you unique..."
                    value={newSite.description}
                    onChange={(e) => setNewSite({ ...newSite, description: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">
                    The more details you provide, the better your AI-generated content will be
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Website Address *</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="subdomain"
                      placeholder="greenthumb"
                      value={newSite.subdomain}
                      onChange={(e) => setNewSite({ ...newSite, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      .{typeof window !== 'undefined' ? window.location.host : 'localhost:3001'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    This will be your website URL (letters, numbers, and hyphens only)
                  </p>
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-gray-700">Additional Details (Optional)</h4>
                <p className="text-xs text-gray-500">
                  These details help create more personalized content
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={newSite.industry} onValueChange={(value) => setNewSite({ ...newSite, industry: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="garden-center">Garden Center</SelectItem>
                        <SelectItem value="plant-nursery">Plant Nursery</SelectItem>
                        <SelectItem value="florist">Florist</SelectItem>
                        <SelectItem value="landscaping">Landscaping</SelectItem>
                        <SelectItem value="farm">Farm / Market</SelectItem>
                        <SelectItem value="greenhouse">Greenhouse</SelectItem>
                        <SelectItem value="botanicals">Botanicals / Herbs</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Portland, OR"
                      value={newSite.location}
                      onChange={(e) => setNewSite({ ...newSite, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="hello@example.com"
                      value={newSite.email}
                      onChange={(e) => setNewSite({ ...newSite, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={newSite.phone}
                      onChange={(e) => setNewSite({ ...newSite, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {!isGenerating && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleModalClose(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="btn-gradient-primary"
                  onClick={generateSiteWithAI}
                  disabled={!newSite.name || !newSite.description || !newSite.subdomain}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Website with AI
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper function to create seasonal guide template
function getSeasonalGuideTemplate(businessName: string, location: string) {
  return {
    version: '1.0',
    layout: 'other',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: 'Seasonal Plant Care Guide',
          subheadline: `Expert seasonal care tips for ${location}`
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      richText: {
        type: 'richText',
        order: 2,
        visible: true,
        data: {
          headline: '',
          content: `<h2>Spring (March - May)</h2>
<p>Spring is the perfect time to prepare your garden for the growing season ahead. As temperatures warm and daylight increases, plants emerge from dormancy and begin active growth.</p>

<h3>Key Spring Tasks</h3>
<ul>
<li><strong>Start planting:</strong> Begin planting cool-season vegetables and annual flowers after the last frost date</li>
<li><strong>Prune:</strong> Remove dead or damaged branches from trees and shrubs</li>
<li><strong>Fertilize:</strong> Apply balanced fertilizer to perennials and established plants</li>
<li><strong>Mulch:</strong> Add fresh mulch to retain moisture and suppress weeds</li>
<li><strong>Divide perennials:</strong> Early spring is ideal for dividing and transplanting overcrowded perennials</li>
</ul>

<h2>Summer (June - August)</h2>
<p>Summer brings peak growing season with warm temperatures and long days. Focus on maintenance and consistent care to keep plants thriving through the heat.</p>

<h3>Key Summer Tasks</h3>
<ul>
<li><strong>Water deeply:</strong> Provide consistent moisture, especially during hot, dry periods</li>
<li><strong>Deadhead flowers:</strong> Remove spent blooms to encourage continued flowering</li>
<li><strong>Watch for pests:</strong> Monitor plants for common summer pests and diseases</li>
<li><strong>Harvest regularly:</strong> Pick vegetables and herbs frequently to encourage production</li>
<li><strong>Provide shade:</strong> Protect sensitive plants from intense afternoon sun</li>
</ul>

<h2>Fall (September - November)</h2>
<p>Fall is an excellent planting season and time to prepare your garden for winter. Cooler temperatures and adequate rainfall create ideal conditions for root establishment.</p>

<h3>Key Fall Tasks</h3>
<ul>
<li><strong>Plant bulbs:</strong> Spring-flowering bulbs should be planted 6-8 weeks before ground freezes</li>
<li><strong>Plant trees and shrubs:</strong> Fall is the best time for establishing woody plants</li>
<li><strong>Collect seeds:</strong> Save seeds from favorite annual flowers for next year</li>
<li><strong>Reduce watering:</strong> As growth slows, plants need less frequent watering</li>
<li><strong>Clean up garden beds:</strong> Remove diseased plant material and fallen leaves</li>
</ul>

<h2>Winter (December - February)</h2>
<p>Winter is a time for garden planning and protecting plants from harsh weather. While outdoor activities are limited, there's still important work to be done.</p>

<h3>Key Winter Tasks</h3>
<ul>
<li><strong>Protect tender plants:</strong> Apply winter mulch and wrap vulnerable plants</li>
<li><strong>Prune dormant trees:</strong> Late winter is ideal for structural pruning</li>
<li><strong>Plan next season:</strong> Review catalogs and plan your spring garden</li>
<li><strong>Maintain tools:</strong> Clean, sharpen, and repair garden tools</li>
<li><strong>Monitor houseplants:</strong> Indoor plants may need extra care during heating season</li>
</ul>

<h2>Regional Considerations</h2>
<p>Timing of these tasks may vary based on your specific climate zone. For personalized advice for ${location}, visit us at ${businessName} or contact our expert staff.</p>

<h2>Need Help?</h2>
<p>Our team at ${businessName} is here to help you succeed with your garden year-round. Stop by for personalized plant care advice, seasonal plant selections, and all your gardening supplies.</p>`
        },
        settings: {
          backgroundColor: 'default'
        }
      }
    }
  }
}
