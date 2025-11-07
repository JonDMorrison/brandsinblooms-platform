'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Globe, Calendar, Settings, ExternalLink, Loader2, Sparkles, CheckCircle2, AlertCircle, Upload, ArrowRight, ArrowLeft, Check, Image as ImageIcon, Edit3, Copy } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { useAuth } from '@/src/contexts/AuthContext'
import { useSiteContext, useSiteSwitcher, useUserSites } from '@/src/hooks/useSite'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/src/components/ui/dialog'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
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
  const searchParams = useSearchParams()
  const { switchSite } = useSiteSwitcher()
  const { refreshUserSites } = useSiteContext()
  const { sites: userSites, loading: sitesLoading, error: sitesError, refresh: refreshSites } = useUserSites()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [step, setStep] = useState(0)

  // Step 0: Website source selection
  const [sourceMode, setSourceMode] = useState<'scrape' | 'manual' | 'duplicate'>('scrape')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  // Duplicate mode state
  const [selectedSiteForDuplicate, setSelectedSiteForDuplicate] = useState<string | null>(null)
  const [duplicateOptions, setDuplicateOptions] = useState({
    copyContent: true,
    copyProducts: true,
    copyTheme: true,
    copyNavigation: true
  })

  const [newSite, setNewSite] = useState({
    name: '',
    description: '',
    industry: '',
    location: '',
    email: '',
    phone: '',
    address: '',
    brandColors: '',
    logoUrl: null as string | null,
    basedOnWebsite: undefined as string | undefined
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  // Logo upload states
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-open create modal if 'create' URL parameter is present
  useEffect(() => {
    const shouldCreate = searchParams.get('create')
    if (shouldCreate === 'true' && !isCreateModalOpen) {
      setIsCreateModalOpen(true)
      // Clean up URL parameter
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams, isCreateModalOpen])

  // URL validation function
  const validateWebsiteUrl = (url: string): string | null => {
    // Empty is ok (user can skip)
    if (!url) return null

    // Basic URL format
    try {
      const parsed = new URL(url)

      // Must be HTTP/HTTPS
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return 'URL must use HTTP or HTTPS protocol'
      }

      // Block localhost
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '0.0.0.0') {
        return 'Cannot scrape localhost URLs'
      }

      // Block private IPs (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
      if (/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(parsed.hostname)) {
        return 'Cannot scrape private network addresses'
      }

      return null // Valid!
    } catch {
      return 'Please enter a valid URL (e.g., https://example.com)'
    }
  }

  // Debounced URL validation
  useEffect(() => {
    if (!websiteUrl) {
      setUrlError(null)
      return
    }

    const timer = setTimeout(() => {
      const error = validateWebsiteUrl(websiteUrl)
      setUrlError(error)
    }, 500)

    return () => clearTimeout(timer)
  }, [websiteUrl])

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

      // Get current user from Supabase session (fresh, not from hook)
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

      if (userError || !currentUser) {
        console.warn('User not authenticated, skipping additional pages:', userError)
        toast.warning('Site created successfully! You can add Privacy/Terms pages manually.')
        setIsCreateModalOpen(false)
        resetForm()
        await refreshSites()
        setIsGenerating(false)
        return
      }

      // Update site with logo and theme settings if logo was uploaded
      if (newSite.logoUrl) {
        setStatusMessage('Updating logo and theme settings...')

        // First, get current theme settings
        const { data: siteData, error: fetchError } = await supabase
          .from('sites')
          .select('theme_settings')
          .eq('id', siteId)
          .single()

        if (fetchError) {
          console.error('Error fetching theme settings:', fetchError)
        } else {
          const currentThemeSettings = (siteData?.theme_settings as Record<string, unknown>) || {}
          const logoConfig = {
            url: newSite.logoUrl,
            text: newSite.name,
            size: 'medium',
            position: 'left',
            pixelSize: 80,
            displayType: newSite.logoUrl ? 'logo' : 'text'
          }

          // Merge logo config into theme settings
          const updatedThemeSettings = {
            ...currentThemeSettings,
            logo: logoConfig
          }

          const { error: updateError } = await supabase
            .from('sites')
            .update({
              logo_url: newSite.logoUrl,
              theme_settings: updatedThemeSettings
            })
            .eq('id', siteId)

          if (updateError) {
            console.error('Error updating logo:', updateError)
            toast.warning('Site created, but logo update failed')
          }
        }
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

      const companyContent = getCompanyTemplate(newSite.name)
      const wateringGuideContent = getWateringGuideTemplate(newSite.name)
      const lightingGuideContent = getLightingGuideTemplate(newSite.name)
      const soilGuideContent = getSoilGuideTemplate(newSite.name)
      const pestsGuideContent = getPestsGuideTemplate(newSite.name)

      // Create pages
      const pagesToCreate = [
        {
          site_id: siteId,
          title: 'Privacy Policy',
          slug: 'privacy',
          content_type: 'other',
          content: privacyContent,
          is_published: true,
          sort_order: 90,
          author_id: currentUser.id
        },
        {
          site_id: siteId,
          title: 'Terms of Service',
          slug: 'terms',
          content_type: 'other',
          content: termsContent,
          is_published: true,
          sort_order: 100,
          author_id: currentUser.id
        },
        {
          site_id: siteId,
          title: 'Seasonal Plant Care Guide',
          slug: 'seasonal-guide',
          content_type: 'other',
          content: seasonalGuideContent,
          is_published: true,
          sort_order: 110,
          author_id: currentUser.id
        },
        {
          site_id: siteId,
          title: 'About Our Company',
          slug: 'company',
          content_type: 'other',
          content: companyContent,
          is_published: true,
          sort_order: 120,
          author_id: currentUser.id
        },
        {
          site_id: siteId,
          title: 'Watering 101',
          slug: 'watering',
          content_type: 'other',
          content: wateringGuideContent,
          is_published: true,
          sort_order: 130,
          author_id: currentUser.id
        },
        {
          site_id: siteId,
          title: 'Light Requirements Explained',
          slug: 'lighting',
          content_type: 'other',
          content: lightingGuideContent,
          is_published: true,
          sort_order: 140,
          author_id: currentUser.id
        },
        {
          site_id: siteId,
          title: 'Soil & Repotting Guide',
          slug: 'soil',
          content_type: 'other',
          content: soilGuideContent,
          is_published: true,
          sort_order: 150,
          author_id: currentUser.id
        },
        {
          site_id: siteId,
          title: 'Common Pests & Problems',
          slug: 'pests',
          content_type: 'other',
          content: pestsGuideContent,
          is_published: true,
          sort_order: 160,
          author_id: currentUser.id
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

      // Success! Now redirect to the homepage editor
      console.log('[SITE CREATION] Site and pages created successfully. Querying for homepage...')

      // Query for the home page of the new site
      try {
        const { data: homePage, error: homePageError } = await supabase
          .from('content')
          .select('id, title, slug')
          .eq('site_id', siteId)
          .eq('slug', 'home')
          .eq('content_type', 'landing')
          .single()

        if (homePageError) {
          console.error('[SITE CREATION] Error querying home page:', homePageError)
          // Fallback: Just close modal and refresh
          toast.success('Site created successfully with all pages!')
          setIsCreateModalOpen(false)
          resetForm()
          await refreshSites()
        } else if (!homePage) {
          console.warn('[SITE CREATION] Home page not found for site:', siteId)
          // Fallback: Just close modal and refresh
          toast.success('Site created successfully!')
          setIsCreateModalOpen(false)
          resetForm()
          await refreshSites()
        } else {
          // Home page found - prepare for navigation
          console.log('[SITE CREATION] Home page found:', homePage.id)

          // Show navigation message
          toast.success('Site created! Opening homepage editor...')

          // Close modal and reset form first
          setIsCreateModalOpen(false)
          resetForm()

          // Refresh sites list to ensure consistency
          console.log('[SITE CREATION] Refreshing sites before navigation...')
          await refreshSites()

          // Switch to the newly created site
          console.log('[SITE CREATION] Switching to new site:', siteId)
          await switchSite(siteId)

          // Navigate to the editor with the home page ID
          const editorUrl = `/dashboard/content/editor?id=${homePage.id}`
          console.log('[SITE CREATION] Navigating to:', editorUrl)

          // Use router.push for navigation
          router.push(editorUrl)
        }
      } catch (queryError: unknown) {
        // Handle any unexpected errors during home page query
        console.error('[SITE CREATION] Unexpected error querying home page:', queryError)

        // Fallback: Close modal, show success, and refresh
        toast.success('Site created successfully!')
        setIsCreateModalOpen(false)
        resetForm()

        try {
          await refreshSites()
        } catch (refreshError: unknown) {
          console.error('[SITE CREATION] Error refreshing sites:', refreshError)
        }
      }

    } catch (error: unknown) {
      console.error('Error creating additional pages:', error)
      toast.error('Site created, but some pages failed to generate')

      // Even on error, try to close modal and refresh
      setIsCreateModalOpen(false)
      resetForm()

      try {
        await refreshSites()
      } catch (refreshError: unknown) {
        console.error('[SITE CREATION] Error refreshing sites after page creation error:', refreshError)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate site using AI or duplicate existing site
  const generateSiteWithAI = async () => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }

    // Handle duplicate mode separately
    if (sourceMode === 'duplicate') {
      if (!selectedSiteForDuplicate || !newSite.name) {
        toast.error('Please select a site and provide a name')
        return
      }

      setIsGenerating(true)

      try {
        const response = await fetch('/api/sites/duplicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceSiteId: selectedSiteForDuplicate,
            newName: newSite.name,
            newSubdomain: newSite.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
            copyContent: duplicateOptions.copyContent,
            copyProducts: duplicateOptions.copyProducts,
            copyTheme: duplicateOptions.copyTheme,
            copyNavigation: duplicateOptions.copyNavigation
          })
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          toast.error(result.error?.message || 'Failed to duplicate site')
          return
        }

        const { siteId, siteName, copiedItems } = result.data

        toast.success(
          `Site "${siteName}" duplicated successfully! ` +
          `${copiedItems.contentPages} pages and ${copiedItems.products} products copied.`
        )

        // Close modal and refresh both caches in parallel
        setIsCreateModalOpen(false)
        resetForm()

        // Refresh both the dashboard page cache AND the SiteContext cache
        // This ensures the new site appears in both the sites list and the site switcher dropdown
        await Promise.all([
          refreshSites(),
          refreshUserSites()
        ])

        // Navigate to dashboard
        router.push(`/dashboard`)

      } catch (error) {
        console.error('Duplicate error:', error)
        toast.error('Failed to duplicate site')
      } finally {
        setIsGenerating(false)
      }

      return
    }

    // Validate required fields (skip validation for scraping mode)
    if (sourceMode === 'manual') {
      if (!newSite.name || !newSite.description) {
        toast.error('Please provide at least a site name and description')
        return
      }
    }

    setIsGenerating(true)
    setGenerationStatus(null)

    try {
      // Build enhanced AI prompt
      let enhancedPrompt: string

      if (sourceMode === 'scrape' && newSite.basedOnWebsite) {
        // For scraping mode, create a minimal prompt - the scraper will provide details
        enhancedPrompt = `Create a professional website based on ${newSite.basedOnWebsite}`
      } else {
        // For manual mode, build detailed prompt
        enhancedPrompt = `Create a website for ${newSite.name}. ${newSite.description}`
        if (newSite.brandColors) {
          enhancedPrompt += `. Brand colors/theme: ${newSite.brandColors}`
        }
      }

      // Build API request
      const requestBody = {
        prompt: enhancedPrompt,
        name: newSite.name || 'Generated Site', // Fallback name for scraping mode
        industry: newSite.industry || undefined,
        location: newSite.location || undefined,
        email: newSite.email || undefined,
        phone: newSite.phone || undefined,
        description: newSite.description || 'AI-generated website', // Fallback description
        brandColors: newSite.brandColors || undefined,
        logoUrl: newSite.logoUrl || undefined,
        basedOnWebsite: newSite.basedOnWebsite || undefined,
        additionalDetails: newSite.address ? { address: newSite.address } : undefined
      }

      // LOG: Show request data in console
      console.log('\n' + '='.repeat(80))
      console.log('🚀 SITE GENERATION REQUEST')
      console.log('='.repeat(80))
      console.log('📝 Request Body:', JSON.stringify(requestBody, null, 2))
      if (newSite.basedOnWebsite) {
        console.log('\n🌐 Website Scraping Enabled!')
        console.log(`   URL to scrape: ${newSite.basedOnWebsite}`)
        console.log('   → Backend will scrape this URL and extract:')
        console.log('      - Contact info (email, phone, address)')
        console.log('      - Brand colors')
        console.log('      - Logo')
        console.log('      - Social media links')
        console.log('      - Page structure')
      } else {
        console.log('\n📝 Manual Mode - No scraping')
      }
      console.log('='.repeat(80) + '\n')

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
        console.error('❌ Generation request failed:', error)
        throw new Error(error.error || 'Failed to start site generation')
      }

      const result = await response.json()
      const { jobId, statusUrl } = result.data

      console.log('✅ Generation job created successfully!')
      console.log(`   Job ID: ${jobId}`)
      console.log(`   Status URL: ${statusUrl}`)
      console.log('\n💡 Check your server logs for detailed scraping results!\n')

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
      address: '',
      brandColors: '',
      logoUrl: null,
      basedOnWebsite: undefined
    })
    setStep(0)
    setSourceMode('scrape')
    setWebsiteUrl('')
    setUrlError(null)
    setGenerationStatus(null)
    setStatusMessage('')
    setIsUploading(false)
    setUploadProgress(0)
    setSelectedSiteForDuplicate(null)
    setDuplicateOptions({
      copyContent: true,
      copyProducts: true,
      copyTheme: true,
      copyNavigation: true
    })
  }

  const handleModalClose = (open: boolean) => {
    if (!isGenerating) {
      setIsCreateModalOpen(open)
      if (!open) {
        resetForm()
      }
    }
  }

  // Step navigation
  const nextStep = () => {
    if (step === 0) {
      // Step 0: Validate based on source mode
      if (sourceMode === 'scrape') {
        if (!websiteUrl) {
          toast.error('Please enter a website URL or choose "Design Your Own"')
          return
        }
        const error = validateWebsiteUrl(websiteUrl)
        if (error) {
          setUrlError(error)
          toast.error(error)
          return
        }
        // Store the URL and jump directly to review (Step 3)
        setNewSite(prev => ({
          ...prev,
          basedOnWebsite: websiteUrl,
          name: websiteUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].split('.')[0] // Extract domain name as placeholder
        }))
        setStep(3) // Skip Steps 1 & 2 - scraping will provide the data
      } else if (sourceMode === 'duplicate') {
        // Validate site selection for duplicate mode
        if (!selectedSiteForDuplicate) {
          toast.error('Please select a site to duplicate')
          return
        }
        setStep(1) // Go to customization step
      } else {
        // Clear URL if manual mode and go to Step 1
        setNewSite(prev => ({ ...prev, basedOnWebsite: undefined }))
        setStep(1)
      }
    } else if (step === 1) {
      // Validate required fields based on mode
      if (sourceMode === 'duplicate') {
        if (!newSite.name) {
          toast.error('Please enter a name for the new site')
          return
        }
        // For duplicate mode, skip to step 3 (review)
        setStep(3)
      } else {
        // Manual mode validation
        if (!newSite.name || !newSite.description) {
          toast.error('Please fill in all required fields')
          return
        }
        setStep(2)
      }
    } else if (step === 2) {
      setStep(3)
    }
  }

  const prevStep = () => {
    if (step > 0) {
      // Handle different mode flows
      if ((sourceMode === 'scrape' || sourceMode === 'duplicate') && step === 3) {
        // Both scrape and duplicate skip step 2, go back to step 1 or 0
        setStep(sourceMode === 'scrape' ? 0 : 1)
      } else {
        setStep(step - 1)
      }
    }
  }

  // Logo upload handler
  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    try {
      // For now, use a placeholder site ID. In production, we'd create the site first
      const tempSiteId = crypto.randomUUID()

      const response = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          siteId: tempSiteId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get upload URL')
      }

      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error('Invalid presigned URL response')
      }

      const { uploadUrl, publicUrl } = result.data

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file: ${uploadResponse.status}`)
      }

      setUploadProgress(100)
      setNewSite(prev => ({ ...prev, logoUrl: publicUrl }))
      toast.success('Logo uploaded successfully')
    } catch (error) {
      console.error('Logo upload error:', error)
      toast.error('Failed to upload logo')
    } finally {
      setIsUploading(false)
      clearInterval(progressInterval)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleLogoUpload(files[0])
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
              {sourceMode === 'duplicate' ? (
                <>
                  <Copy className="h-5 w-5 text-purple-600" />
                  Copy one of your sites
                </>
              ) : sourceMode === 'scrape' ? (
                <>
                  <Globe className="h-5 w-5 text-blue-600" />
                  Duplicate Existing Site
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 text-primary" />
                  Create AI-Powered Website
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isGenerating
                ? sourceMode === 'duplicate'
                  ? 'Duplicating your site with all selected content and settings...'
                  : 'Our AI is creating your professional website with all the pages you need'
                : sourceMode === 'scrape'
                  ? `Step ${step === 0 ? 1 : 2} of 2: ${step === 0 ? 'Choose Website' : 'Review & Generate'}`
                  : sourceMode === 'duplicate'
                    ? `Step ${step === 0 ? 1 : 2} of 2: ${step === 0 ? 'Select Site' : 'Review & Duplicate'}`
                    : `Step ${step + 1} of 4: ${step === 0 ? 'Choose Source' : step === 1 ? 'Company Information' : step === 2 ? 'Design Settings' : 'Review & Create'}`}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          {!isGenerating && (
            <div className="flex items-center justify-center space-x-4 py-4">
              {sourceMode === 'scrape' ? (
                /* Scraping Mode: 2 steps (0 and 3) */
                <>
                  <div className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${step >= 0
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {step > 0 ? <Check className="h-4 w-4" /> : 1}
                    </div>
                  </div>
                  <div className={`
                    w-12 h-1 mx-2 rounded-full transition-all
                    ${step > 0 ? 'bg-green-600' : 'bg-gray-200'}
                  `} />
                  <div className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${step >= 3
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      2
                    </div>
                  </div>
                </>
              ) : sourceMode === 'duplicate' ? (
                /* Duplicate Mode: 2 steps (0 and 1, then jumps to 3) */
                <>
                  <div className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${step >= 0
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {step > 0 ? <Check className="h-4 w-4" /> : 1}
                    </div>
                  </div>
                  <div className={`
                    w-12 h-1 mx-2 rounded-full transition-all
                    ${step > 0 ? 'bg-purple-600' : 'bg-gray-200'}
                  `} />
                  <div className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${step >= 3
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      2
                    </div>
                  </div>
                </>
              ) : (
                /* Manual Mode: 4 steps (0, 1, 2, 3) */
                [0, 1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${step >= stepNumber
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {step > stepNumber ? <Check className="h-4 w-4" /> : stepNumber + 1}
                    </div>
                    {stepNumber < 3 && (
                      <div className={`
                        w-12 h-1 mx-2 rounded-full transition-all
                        ${step > stepNumber ? 'bg-green-600' : 'bg-gray-200'}
                      `} />
                    )}
                  </div>
                ))
              )}
            </div>
          )}

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
                <Progress value={generationStatus?.progress || 0} className="h-2" />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900">What we&apos;re creating:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    AI-generated pages with tailored content
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Custom design & branding
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Step 0: Website Source Selection */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">
                      How would you like to create your site?
                    </h3>
                    <p className="text-sm text-gray-500">
                      Import from an existing website or start fresh
                    </p>
                  </div>

                  {/* Option Cards */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Duplicate Existing Site Card */}
                    <Card
                      className={`cursor-pointer transition-all ${
                        sourceMode === 'scrape'
                          ? 'ring-2 ring-primary border-primary bg-primary/5'
                          : 'hover:border-gray-400'
                      }`}
                      onClick={() => setSourceMode('scrape')}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className={`p-3 rounded-lg ${
                            sourceMode === 'scrape' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Globe className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1">
                              Duplicate Existing Site
                            </h4>
                            <p className="text-xs text-gray-600 leading-snug">
                              Let AI analyze an existing website and extract branding, content, and contact info.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Design Your Own Card */}
                    <Card
                      className={`cursor-pointer transition-all ${
                        sourceMode === 'manual'
                          ? 'ring-2 ring-primary border-primary bg-primary/5'
                          : 'hover:border-gray-400'
                      }`}
                      onClick={() => setSourceMode('manual')}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className={`p-3 rounded-lg ${
                            sourceMode === 'manual' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Sparkles className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1">
                              Start from Scratch
                            </h4>
                            <p className="text-xs text-gray-600 leading-snug">
                              Provide business details manually and let AI generate a custom website.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Copy one of your sites Card - HIDDEN
                        Note: This feature was built when a duplicate existing site feature was requested,
                        but it turned out to be just a renaming of the AI scraper site generator.
                        Not needed at the moment. */}
                    {/* <Card
                      className={`cursor-pointer transition-all ${
                        sourceMode === 'duplicate'
                          ? 'ring-2 ring-primary border-primary bg-primary/5'
                          : 'hover:border-gray-400'
                      }`}
                      onClick={() => setSourceMode('duplicate')}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className={`p-3 rounded-lg ${
                            sourceMode === 'duplicate' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Copy className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1">
                              Copy one of your sites
                            </h4>
                            <p className="text-xs text-gray-600 leading-snug">
                              Create a copy of one of your existing sites with all content and settings.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card> */}
                  </div>

                  {/* Website URL Input (conditional) */}
                  {sourceMode === 'scrape' && (
                    <div className="space-y-3 mt-6 p-4 border rounded-lg bg-blue-50">
                      <Label htmlFor="websiteUrl" className="text-base font-semibold">
                        Your Website URL
                      </Label>
                      <Input
                        id="websiteUrl"
                        type="url"
                        placeholder="https://your-website.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className={urlError ? 'border-red-500' : ''}
                      />
                      {urlError && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {urlError}
                        </div>
                      )}
                      {!urlError && websiteUrl && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          URL looks good!
                        </div>
                      )}

                      <div className="bg-white border border-blue-200 rounded p-3 mt-3">
                        <h5 className="text-sm font-semibold text-blue-900 mb-2">
                          What we&apos;ll extract:
                        </h5>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" />
                            Business contact information (email, phone, address)
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" />
                            Brand colors and logo
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" />
                            Page structure and content themes
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" />
                            Social media links
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Site Selection for Duplicate Mode */}
                  {sourceMode === 'duplicate' && (
                    <div className="space-y-3 mt-6 p-4 border rounded-lg bg-purple-50">
                      <Label htmlFor="siteSelect" className="text-base font-semibold">
                        Select Site to Duplicate
                      </Label>
                      <select
                        id="siteSelect"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={selectedSiteForDuplicate || ''}
                        onChange={(e) => setSelectedSiteForDuplicate(e.target.value || null)}
                      >
                        <option value="">Choose a site...</option>
                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.name} ({site.subdomain})
                          </option>
                        ))}
                      </select>

                      {selectedSiteForDuplicate && (
                        <div className="bg-white border border-purple-200 rounded p-3 mt-3">
                          <h5 className="text-sm font-semibold text-purple-900 mb-2">
                            What will be copied:
                          </h5>
                          <ul className="text-xs text-purple-700 space-y-1">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3" />
                              All content pages and their structure
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3" />
                              Products and categories
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3" />
                              Theme and design settings
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3" />
                              Navigation and menu structure
                            </li>
                          </ul>
                          <p className="text-xs text-purple-600 mt-3 italic">
                            Note: Analytics, user data, and site-specific settings will not be copied.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 1: Company Information (manual mode) or Duplicate Customization (duplicate mode) */}
              {step === 1 && sourceMode === 'manual' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      placeholder="Soul Bloom Sanctuary"
                      value={newSite.name}
                      onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Brief Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your company and what makes it unique..."
                      value={newSite.description}
                      onChange={(e) => setNewSite({ ...newSite, description: e.target.value })}
                      rows={4}
                    />
                    <p className="text-xs text-gray-500">
                      This helps our AI create better content for your site
                    </p>
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
                      <Label htmlFor="phone">Contact Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={newSite.phone}
                        onChange={(e) => setNewSite({ ...newSite, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address (Optional)</Label>
                    <Input
                      id="address"
                      placeholder="123 Main Street, City, State 12345"
                      value={newSite.address}
                      onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      Only provide if you want it displayed on your contact page
                    </p>
                  </div>
                </div>
              )}

              {/* Step 1: Duplicate Mode - Customization */}
              {step === 1 && sourceMode === 'duplicate' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="duplicateName">New Site Name *</Label>
                    <Input
                      id="duplicateName"
                      placeholder="My New Site"
                      value={newSite.name}
                      onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      Give your duplicated site a unique name
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duplicateSubdomain">New Subdomain *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="duplicateSubdomain"
                        placeholder="my-new-site"
                        value={newSite.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                          setNewSite({ ...newSite, name: value })
                        }}
                      />
                      <span className="text-sm text-gray-500">
                        .{typeof window !== 'undefined' ? window.location.host : 'localhost:3001'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      This will be your new site&apos;s URL
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">What to Copy</Label>
                    <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="copyContent"
                          checked={duplicateOptions.copyContent}
                          onChange={(e) => setDuplicateOptions({ ...duplicateOptions, copyContent: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="copyContent" className="text-sm font-normal cursor-pointer">
                          Copy all content pages
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="copyProducts"
                          checked={duplicateOptions.copyProducts}
                          onChange={(e) => setDuplicateOptions({ ...duplicateOptions, copyProducts: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="copyProducts" className="text-sm font-normal cursor-pointer">
                          Copy products and categories
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="copyTheme"
                          checked={duplicateOptions.copyTheme}
                          onChange={(e) => setDuplicateOptions({ ...duplicateOptions, copyTheme: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="copyTheme" className="text-sm font-normal cursor-pointer">
                          Copy theme and design settings
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="copyNavigation"
                          checked={duplicateOptions.copyNavigation}
                          onChange={(e) => setDuplicateOptions({ ...duplicateOptions, copyNavigation: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="copyNavigation" className="text-sm font-normal cursor-pointer">
                          Copy navigation structure
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Design Settings */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Logo Upload Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Logo Upload</Label>
                      <Badge variant="secondary" className="text-xs">Optional, but encouraged</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Upload your company logo to enhance your brand identity
                    </p>

                    {newSite.logoUrl ? (
                      <Card className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 border rounded-lg overflow-hidden bg-gray-50">
                              <img
                                src={newSite.logoUrl}
                                alt="Logo preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Logo uploaded successfully</p>
                              <p className="text-xs text-gray-500">Your logo will appear on all pages</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNewSite({ ...newSite, logoUrl: null })}
                          >
                            Remove
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium mb-2">Upload your logo</p>
                        <p className="text-xs text-gray-500 mb-4">PNG, JPG, or SVG (max 5MB)</p>
                        {isUploading ? (
                          <div className="space-y-2">
                            <Loader2 className="h-6 w-6 text-primary mx-auto animate-spin" />
                            <p className="text-sm">Uploading... {uploadProgress}%</p>
                            <Progress value={uploadProgress} className="h-1" />
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                          </Button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>

                  {/* Brand Colors Section */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Brand Colors & Theme</Label>
                    <p className="text-xs text-gray-500">
                      Enter hex codes or describe your color theme. Our AI will use this to style your site.
                    </p>
                    <Textarea
                      placeholder="e.g., #2E7D32, #FFD700 or 'earthy greens and warm golds'"
                      value={newSite.brandColors}
                      onChange={(e) => setNewSite({ ...newSite, brandColors: e.target.value })}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      Examples: &quot;#FF5733, #3498DB&quot; or &quot;modern purple and teal&quot; or &quot;vintage earth tones&quot;
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="space-y-4">
                  {sourceMode === 'duplicate' ? (
                    /* Duplicate Mode Review */
                    <>
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold">Ready to Duplicate!</h3>
                        <p className="text-sm text-gray-500">
                          Review the details before creating your duplicate site
                        </p>
                      </div>

                      <Card className="p-6 space-y-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                        <div className="flex items-center justify-between gap-4">
                          {/* Source Site */}
                          <div className="flex-1">
                            <div className="p-4 bg-white rounded-lg border border-purple-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Globe className="h-4 w-4 text-purple-600" />
                                <span className="text-xs font-medium text-purple-700">SOURCE SITE</span>
                              </div>
                              <h4 className="font-semibold text-gray-900">
                                {sites.find(s => s.id === selectedSiteForDuplicate)?.name || 'Unknown Site'}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {sites.find(s => s.id === selectedSiteForDuplicate)?.subdomain}
                              </p>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="flex-shrink-0">
                            <ArrowRight className="h-8 w-8 text-purple-400" />
                          </div>

                          {/* New Site */}
                          <div className="flex-1">
                            <div className="p-4 bg-white rounded-lg border border-purple-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Copy className="h-4 w-4 text-purple-600" />
                                <span className="text-xs font-medium text-purple-700">NEW SITE</span>
                              </div>
                              <h4 className="font-semibold text-gray-900">{newSite.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {newSite.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-purple-200">
                          <h5 className="text-sm font-semibold text-purple-900 mb-3">What will be copied:</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {duplicateOptions.copyContent && (
                              <div className="flex items-center gap-2 text-sm text-purple-800">
                                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                                <span>Content pages</span>
                              </div>
                            )}
                            {duplicateOptions.copyProducts && (
                              <div className="flex items-center gap-2 text-sm text-purple-800">
                                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                                <span>Products</span>
                              </div>
                            )}
                            {duplicateOptions.copyTheme && (
                              <div className="flex items-center gap-2 text-sm text-purple-800">
                                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                                <span>Theme & design</span>
                              </div>
                            )}
                            {duplicateOptions.copyNavigation && (
                              <div className="flex items-center gap-2 text-sm text-purple-800">
                                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                                <span>Navigation</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-purple-900 font-medium mb-1">
                              Quick & Efficient Duplication
                            </p>
                            <p className="text-xs text-purple-700">
                              This creates an exact copy with a new subdomain. Analytics, user data, and site-specific settings will not be copied.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : sourceMode === 'scrape' ? (
                    /* Scraping Mode Review */
                    <>
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold">Ready to Generate!</h3>
                        <p className="text-sm text-gray-500">
                          We&apos;ll analyze your website and create a new site based on it
                        </p>
                      </div>

                      <Card className="p-6 space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-blue-500 rounded-full">
                            <Globe className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-900 mb-2">Website Analysis Mode</h4>
                            <p className="text-sm text-blue-700 mb-3">
                              Our AI will scrape and analyze your existing website to automatically extract:
                            </p>
                            <div className="space-y-2 text-sm text-blue-800">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                <span>Business name and description</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                <span>Contact information (email, phone, address)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                <span>Brand colors and logo</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                <span>Page structure and content themes</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                <span>Social media links</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-blue-200">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-blue-700 font-medium">Source Website:</span>
                            <a
                              href={newSite.basedOnWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                            >
                              {newSite.basedOnWebsite}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </Card>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-amber-900 font-medium mb-1">
                              Note: Manual edits available after generation
                            </p>
                            <p className="text-xs text-amber-700">
                              The AI will use scraped data as a foundation. You can edit all content,
                              pages, and settings after your site is created.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Manual Mode Review */
                    <>
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold">Review Your Information</h3>
                        <p className="text-sm text-gray-500">
                          Double-check everything before we create your site
                        </p>
                      </div>

                      <Card className="p-4 space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-3">Company Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Name:</span>
                              <span className="font-medium">{newSite.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Description:</span>
                              <span className="font-medium text-right max-w-xs truncate">{newSite.description}</span>
                            </div>
                            {newSite.email && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium">{newSite.email}</span>
                              </div>
                            )}
                            {newSite.phone && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Phone:</span>
                                <span className="font-medium">{newSite.phone}</span>
                              </div>
                            )}
                            {newSite.address && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Address:</span>
                                <span className="font-medium">{newSite.address}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-sm text-gray-700 mb-3">Design Settings</h4>
                          <div className="space-y-3">
                            {newSite.logoUrl ? (
                              <div className="flex items-center gap-3">
                                <div className="relative w-16 h-16 border rounded-lg overflow-hidden bg-gray-50">
                                  <img
                                    src={newSite.logoUrl}
                                    alt="Logo"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Logo uploaded ✓</p>
                                  <p className="text-xs text-gray-500">Will display with company name</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No logo uploaded</p>
                            )}
                            {newSite.brandColors && (
                              <div>
                                <p className="text-sm font-medium">Brand Colors:</p>
                                <p className="text-sm text-gray-600">{newSite.brandColors}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">Ready to create your site!</p>
                            <p className="text-xs text-blue-700 mt-1">
                              Our AI will generate a complete website with home, about, contact pages, and more.
                              This usually takes 30-60 seconds.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            {!isGenerating && (
              <>
                <div className="flex gap-2">
                  {step > 0 && (
                    <Button
                      variant="outline"
                      onClick={prevStep}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  )}
                  {step === 0 && (
                    <Button
                      variant="outline"
                      onClick={() => handleModalClose(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                <div>
                  {step < 3 ? (
                    <Button
                      className="btn-gradient-primary"
                      onClick={nextStep}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      className={sourceMode === 'duplicate' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'btn-gradient-primary'}
                      onClick={generateSiteWithAI}
                    >
                      {sourceMode === 'duplicate' ? (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate Site
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Website with AI
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper function to create seasonal guide template
export function getSeasonalGuideTemplate(businessName: string, location: string) {
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
      features: {
        type: 'features',
        order: 2,
        visible: true,
        data: {
          headline: 'Year-Round Plant Care Success',
          description: 'Master seasonal care essentials to keep your garden thriving through every season',
          features: [
            { icon: 'Flower', title: 'Spring preparation and planting guidance' },
            { icon: 'Sun', title: 'Summer watering and maintenance tips' },
            { icon: 'Snowflake', title: 'Fall harvest and winter protection strategies' }
          ]
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      richText: {
        type: 'richText',
        order: 3,
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
      },
      cta: {
        type: 'cta',
        order: 4,
        visible: true,
        data: {
          headline: 'Grow Your Garden Knowledge',
          description: 'Explore our comprehensive plant care guides for expert tips on every aspect of plant care.',
          ctaText: 'Watering Guide',
          ctaLink: '/watering',
          secondaryCtaText: 'Browse Plants',
          secondaryCtaLink: '/home'
        },
        settings: {
          backgroundColor: 'primary'
        }
      }
    }
  }
}

export function getCompanyTemplate(businessName: string) {
  return {
    version: '1.0',
    layout: 'other',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: 'About Our Company',
          subheadline: `Learn more about ${businessName} and our mission`
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      features: {
        type: 'features',
        order: 2,
        visible: true,
        data: {
          headline: 'What Sets Us Apart',
          description: 'Our commitment to your plant success through expertise, quality, and sustainability',
          features: [
            { icon: 'Sprout', title: 'Expert guidance from certified horticulturists' },
            { icon: 'Award', title: 'Premium quality plants with health guarantees' },
            { icon: 'Leaf', title: 'Sustainable and eco-friendly growing practices' }
          ]
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      richText: {
        type: 'richText',
        order: 3,
        visible: true,
        data: {
          headline: '',
          content: `<h2>Our Mission</h2>
<p>At ${businessName}, we believe that everyone deserves access to healthy, thriving plants and the knowledge to care for them. Our mission is to inspire and empower plant enthusiasts of all levels—from beginners to experts—to create beautiful, sustainable green spaces.</p>

<h2>Our Values</h2>
<h3>Quality First</h3>
<p>We source only the healthiest plants from trusted growers and maintain the highest standards in plant care. Every plant that leaves our care is inspected for health, vigor, and readiness for its new home.</p>

<h3>Education & Support</h3>
<p>We're not just selling plants—we're building a community of successful plant parents. Our team provides comprehensive care guides, personalized advice, and ongoing support to ensure your plants thrive.</p>

<h3>Sustainability</h3>
<p>We're committed to environmentally responsible practices, from our sourcing and packaging to our growing methods. We believe in protecting the planet while bringing nature into your home.</p>

<h3>Customer Success</h3>
<p>Your success is our success. We measure our impact not by plants sold, but by the thriving gardens and happy plant parents we help create. Our expert team is always here to help you succeed.</p>

<h2>Our Story</h2>
<p>${businessName} was founded with a simple vision: to make plant care accessible, enjoyable, and successful for everyone. What started as a passion for helping people connect with nature has grown into a trusted resource for plant enthusiasts everywhere.</p>

<p>Today, we combine traditional horticultural expertise with modern plant science to provide you with the best plants, products, and knowledge. Our team of plant experts brings decades of combined experience in horticulture, botany, and sustainable growing practices.</p>

<h2>Why Choose Us</h2>
<ul>
<li><strong>Expert guidance:</strong> Our knowledgeable team provides personalized care advice for every plant</li>
<li><strong>Quality guarantee:</strong> We stand behind every plant we sell with comprehensive care support</li>
<li><strong>Educational resources:</strong> Access our extensive library of care guides and seasonal tips</li>
<li><strong>Sustainable practices:</strong> We prioritize eco-friendly methods in everything we do</li>
<li><strong>Community focused:</strong> Join our growing community of passionate plant enthusiasts</li>
</ul>

<h2>Visit Us</h2>
<p>We'd love to meet you! Visit ${businessName} to explore our selection, meet our team, and get personalized advice for your specific growing conditions and plant goals.</p>`
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      cta: {
        type: 'cta',
        order: 4,
        visible: true,
        data: {
          headline: 'Ready to Start Your Plant Journey?',
          description: 'Connect with our team and discover how we can help you create your perfect green space.',
          ctaText: 'Contact Us',
          ctaLink: '/contact',
          secondaryCtaText: 'Learn More About Us',
          secondaryCtaLink: '/about'
        },
        settings: {
          backgroundColor: 'primary'
        }
      }
    }
  }
}

export function getWateringGuideTemplate(businessName: string) {
  return {
    version: '1.0',
    layout: 'other',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: 'Watering 101',
          subheadline: 'Master the most critical aspect of plant care'
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      features: {
        type: 'features',
        order: 2,
        visible: true,
        data: {
          headline: 'Master Watering Essentials',
          description: 'Learn the techniques and knowledge to keep your plants perfectly hydrated',
          features: [
            { icon: 'Droplets', title: 'Identify signs of overwatering and underwatering' },
            { icon: 'Calendar', title: 'Adjust watering frequency by season and environment' },
            { icon: 'Beaker', title: 'Improve water quality for optimal plant health' }
          ]
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      richText: {
        type: 'richText',
        order: 3,
        visible: true,
        data: {
          headline: '',
          content: `<h2>Understanding Your Plants' Water Needs</h2>
<p>Proper watering is the single most important factor in plant health, yet it's also the most common source of problems. Learning to water correctly can mean the difference between a thriving plant and a struggling one.</p>

<h2>How to Tell When Plants Need Water</h2>
<h3>The Finger Test</h3>
<p>Insert your finger 1-2 inches into the soil. If it feels dry at this depth, it's time to water. For most houseplants, the top inch should dry out between waterings.</p>

<h3>Weight Method</h3>
<p>Lift your pot when the soil is dry and again after watering. Over time, you'll learn to judge moisture levels by weight. A light pot usually needs water.</p>

<h3>Visual Cues</h3>
<p>Look for these signs that indicate your plant needs water:</p>
<ul>
<li>Leaves beginning to droop slightly (not severely wilted)</li>
<li>Soil pulling away from the sides of the pot</li>
<li>Pot feels very light when lifted</li>
<li>Soil surface is dry and dusty</li>
</ul>

<h2>Signs of Overwatering</h2>
<p>Overwatering is actually more dangerous than underwatering. Watch for these warning signs:</p>
<ul>
<li><strong>Yellow leaves:</strong> Especially lower leaves turning yellow and dropping</li>
<li><strong>Soft, mushy stems:</strong> Indicates root rot has begun</li>
<li><strong>Wilting despite wet soil:</strong> Roots are damaged and can't absorb water</li>
<li><strong>Fungus gnats:</strong> Small flies around the soil surface thrive in constantly wet conditions</li>
<li><strong>Mold or algae growth:</strong> Green or white growth on soil surface</li>
<li><strong>Foul odor:</strong> Soil smells sour or rotten due to anaerobic conditions</li>
</ul>

<h2>Signs of Underwatering</h2>
<p>While generally less harmful than overwatering, chronic underwatering can damage plants:</p>
<ul>
<li><strong>Crispy, brown leaf edges:</strong> Tissue dies from dehydration</li>
<li><strong>Leaves dropping off:</strong> Plant sheds leaves to conserve water</li>
<li><strong>Slow growth:</strong> Plant can't grow without adequate moisture</li>
<li><strong>Severely wilted appearance:</strong> Leaves and stems droop dramatically</li>
<li><strong>Soil is hard and compacted:</strong> May resist water absorption</li>
</ul>

<h2>Proper Watering Technique</h2>
<h3>Water Thoroughly</h3>
<p>When you water, water until excess drains from the bottom of the pot. This ensures the entire root ball gets moisture and flushes out accumulated salts.</p>

<h3>Empty Drainage Trays</h3>
<p>Always empty drainage trays within 30 minutes of watering. Standing water leads to root rot and provides breeding grounds for pests.</p>

<h3>Water in the Morning</h3>
<p>Morning watering allows excess moisture to evaporate during the day, reducing fungal disease risks. Avoid watering at night when conditions stay damp.</p>

<h3>Use Room Temperature Water</h3>
<p>Cold water can shock roots. Let tap water sit for 24 hours to reach room temperature and allow chlorine to dissipate.</p>

<h2>Watering Schedule Guidelines</h2>
<p>Every plant is different, but here are general guidelines:</p>

<h3>Tropical Houseplants</h3>
<p>Water when top 1-2 inches of soil is dry. Usually every 5-7 days in summer, 10-14 days in winter.</p>

<h3>Succulents & Cacti</h3>
<p>Allow soil to dry completely between waterings. Usually every 14-21 days, less frequently in winter.</p>

<h3>Ferns & Moisture-Lovers</h3>
<p>Keep soil consistently moist but not waterlogged. Check every 3-4 days and water as needed.</p>

<h2>Factors Affecting Water Needs</h2>
<ul>
<li><strong>Season:</strong> Plants use more water during active growth in spring and summer</li>
<li><strong>Light levels:</strong> More light = more growth = more water needed</li>
<li><strong>Temperature:</strong> Warmer temperatures increase evaporation and plant water use</li>
<li><strong>Humidity:</strong> Dry air increases water needs; humid air reduces them</li>
<li><strong>Pot size:</strong> Smaller pots dry out faster than larger ones</li>
<li><strong>Soil type:</strong> Peat-based soils hold more water than sandy mixes</li>
</ul>

<h2>Need Personalized Advice?</h2>
<p>Every plant and growing environment is unique. Visit ${businessName} for personalized watering advice based on your specific plants, home conditions, and experience level. Our experts can help you develop the perfect watering routine.</p>`
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      cta: {
        type: 'cta',
        order: 4,
        visible: true,
        data: {
          headline: 'Explore More Plant Care Tips',
          description: 'Continue building your plant care knowledge with our comprehensive care guide library.',
          ctaText: 'Seasonal Care Guide',
          ctaLink: '/seasonal-guide',
          secondaryCtaText: 'Browse Our Plants',
          secondaryCtaLink: '/home'
        },
        settings: {
          backgroundColor: 'primary'
        }
      }
    }
  }
}

export function getLightingGuideTemplate(businessName: string) {
  return {
    version: '1.0',
    layout: 'other',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: 'Light Requirements Explained',
          subheadline: 'Understanding what "bright indirect light" actually means'
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      features: {
        type: 'features',
        order: 2,
        visible: true,
        data: {
          headline: 'Illuminate Your Plant Knowledge',
          description: 'Everything you need to understand and optimize light conditions for healthy plant growth',
          features: [
            { icon: 'Sun', title: 'Assess your home\'s natural light conditions accurately' },
            { icon: 'MapPin', title: 'Match plants to optimal lighting locations' },
            { icon: 'Lightbulb', title: 'Solve common light-related plant problems' }
          ]
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      richText: {
        type: 'richText',
        order: 3,
        visible: true,
        data: {
          headline: '',
          content: `<h2>Why Light Matters</h2>
<p>Light is essential for photosynthesis—the process by which plants convert light into energy for growth. Insufficient or excessive light is one of the most common causes of plant problems. Understanding your home's light conditions is crucial for choosing plants that will thrive.</p>

<h2>Types of Indoor Light</h2>

<h3>Bright Direct Light</h3>
<p><strong>What it means:</strong> Direct sun rays hit the plant for several hours daily, typically 4+ hours.</p>
<p><strong>Where to find it:</strong> South-facing windows (Northern hemisphere) are the brightest, providing strong, direct light for most of the day. West-facing windows get strong afternoon sun.</p>
<p><strong>Best for:</strong> Cacti, most succulents, jade plants, aloe vera, snake plants, and many flowering plants.</p>
<p><strong>Watch out for:</strong> Leaves touching the glass can burn. Most tropical houseplants will scorch in this light.</p>

<h3>Bright Indirect Light</h3>
<p><strong>What it means:</strong> Strong, consistent light without direct sun rays hitting the plant. The area is very well-lit but the sun's rays are filtered or don't directly reach the plant.</p>
<p><strong>Where to find it:</strong></p>
<ul>
<li>A few feet back from a south or west-facing window</li>
<li>Directly at an east-facing window (gentle morning sun only)</li>
<li>Behind a sheer curtain on a bright window</li>
<li>On a bright north-facing window sill (if unobstructed)</li>
</ul>
<p><strong>Best for:</strong> Most tropical houseplants including pothos, monstera, philodendron, ficus, prayer plants, and African violets.</p>
<p><strong>The sweet spot:</strong> This is ideal for the majority of popular houseplants. If you can comfortably read a book without artificial light during the day, it's likely bright indirect light.</p>

<h3>Medium or Filtered Light</h3>
<p><strong>What it means:</strong> Moderate light without any direct sun. The room feels well-lit but not intensely bright.</p>
<p><strong>Where to find it:</strong></p>
<ul>
<li>Several feet away from bright windows</li>
<li>North-facing windows with obstructions outside</li>
<li>East-facing windows with trees or buildings blocking some light</li>
</ul>
<p><strong>Best for:</strong> Pothos, philodendrons, dracaena, peace lilies, Chinese evergreen, and ZZ plants.</p>
<p><strong>Note:</strong> Many plants can adapt to medium light but will grow more slowly than in brighter conditions.</p>

<h3>Low Light</h3>
<p><strong>What it means:</strong> Minimal natural light. You would need artificial light to read comfortably during the day.</p>
<p><strong>Where to find it:</strong></p>
<ul>
<li>Rooms with small windows or windows blocked by buildings</li>
<li>Corners far from windows</li>
<li>North-facing windows with significant outdoor obstructions</li>
<li>Bathrooms with small or frosted windows</li>
</ul>
<p><strong>Best for:</strong> Very few plants truly thrive in low light, but these tolerate it: pothos, snake plant, ZZ plant, cast iron plant, and peace lily.</p>
<p><strong>Important:</strong> "Low light tolerant" doesn't mean "no light." All plants need some natural light to survive long-term.</p>

<h2>How to Assess Your Home's Light</h2>

<h3>The Shadow Test</h3>
<p>Hold your hand 12 inches above where you plan to place your plant. Observe the shadow:</p>
<ul>
<li><strong>Sharp, well-defined shadow:</strong> Bright indirect to direct light</li>
<li><strong>Soft but clearly visible shadow:</strong> Medium light</li>
<li><strong>Barely visible or no shadow:</strong> Low light</li>
</ul>

<h3>Consider Window Direction</h3>
<p><strong>North-facing:</strong> Consistent but lower intensity light all day</p>
<p><strong>East-facing:</strong> Gentle morning sun, bright indirect light the rest of the day (ideal for most plants)</p>
<p><strong>South-facing:</strong> Brightest, strongest light all day (Northern hemisphere)</p>
<p><strong>West-facing:</strong> Strong afternoon and evening sun, which can be intense</p>

<h3>Account for Obstructions</h3>
<p>Trees, buildings, awnings, and even interior walls significantly reduce available light. A south window blocked by a large tree may provide less light than an unobstructed north window.</p>

<h2>Signs of Incorrect Light</h2>

<h3>Too Little Light</h3>
<ul>
<li>Leggy, stretched growth reaching toward light source</li>
<li>Long spaces between leaves on the stem</li>
<li>New leaves are smaller and paler than older ones</li>
<li>Plant leans dramatically toward light</li>
<li>Variegated plants lose their patterns and turn solid green</li>
<li>Little to no new growth</li>
</ul>

<h3>Too Much Light</h3>
<ul>
<li>Brown, crispy patches on leaves (sunburn)</li>
<li>Leaves fade, bleach, or turn yellow-white</li>
<li>Plant wilts even when soil is moist (root damage from overheating)</li>
<li>Leaves curl inward to protect themselves</li>
<li>Rapid soil drying requiring daily watering</li>
</ul>

<h2>Adjusting Light Conditions</h2>

<h3>Increasing Light</h3>
<ul>
<li>Move plants closer to windows</li>
<li>Use mirrors to reflect light into darker areas</li>
<li>Keep windows clean for maximum light transmission</li>
<li>Choose light-colored walls and furnishings to reflect more light</li>
<li>Add grow lights for supplemental lighting (especially useful in winter)</li>
</ul>

<h3>Reducing Light</h3>
<ul>
<li>Move plants farther from windows</li>
<li>Use sheer curtains to filter direct sun</li>
<li>Place plants behind taller furniture to create shade</li>
<li>Add outdoor shade structures like awnings (for very bright windows)</li>
</ul>

<h2>Seasonal Light Changes</h2>
<p>Remember that light conditions change dramatically with seasons. A spot with perfect light in summer might be too dim in winter when the sun is lower and days are shorter. Monitor your plants and be prepared to move them seasonally or supplement with grow lights during darker months.</p>

<h2>Get Expert Advice</h2>
<p>Visit ${businessName} to discuss your specific home's light conditions with our plant experts. We can help you choose plants perfectly suited to your available light and recommend the best placement strategies for success.</p>`
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      cta: {
        type: 'cta',
        order: 4,
        visible: true,
        data: {
          headline: 'Master More Plant Care Skills',
          description: 'Build your expertise with our complete collection of plant care guides.',
          ctaText: 'Watering Guide',
          ctaLink: '/watering',
          secondaryCtaText: 'Contact Our Experts',
          secondaryCtaLink: '/contact'
        },
        settings: {
          backgroundColor: 'primary'
        }
      }
    }
  }
}

export function getSoilGuideTemplate(businessName: string) {
  return {
    version: '1.0',
    layout: 'other',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: 'Soil & Repotting Guide',
          subheadline: 'When and how to repot, plus choosing the right soil mix'
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      features: {
        type: 'features',
        order: 2,
        visible: true,
        data: {
          headline: 'Root Success Fundamentals',
          description: 'Master the foundation of plant health with proper soil and repotting techniques',
          features: [
            { icon: 'Container', title: 'Choose the right soil mix for each plant type' },
            { icon: 'Clock', title: 'Recognize when your plants need repotting' },
            { icon: 'HeartPulse', title: 'Follow proper repotting techniques for healthy roots' }
          ]
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      richText: {
        type: 'richText',
        order: 3,
        visible: true,
        data: {
          headline: '',
          content: `<h2>Understanding Potting Soil</h2>
<p>Not all soil is created equal. Indoor plants need specially formulated potting mixes that provide proper drainage, aeration, and nutrients while supporting root health. Garden soil is too dense for containers and can harbor pests and diseases.</p>

<h2>Components of Quality Potting Mix</h2>

<h3>Peat Moss or Coco Coir</h3>
<p>The base of most potting mixes, these materials retain moisture while remaining lightweight. Coco coir is a more sustainable alternative to peat moss with excellent water retention properties.</p>

<h3>Perlite or Pumice</h3>
<p>White, lightweight volcanic materials that create air pockets in the soil, improving drainage and preventing compaction. Essential for preventing root rot.</p>

<h3>Bark or Wood Chips</h3>
<p>Provide structure and create air spaces. Particularly important for orchids and other epiphytic plants that need excellent air circulation around roots.</p>

<h3>Worm Castings or Compost</h3>
<p>Add nutrients and beneficial microorganisms that support plant health and disease resistance.</p>

<h2>Choosing the Right Soil Mix</h2>

<h3>Standard Houseplant Mix</h3>
<p><strong>Best for:</strong> Pothos, philodendron, monstera, spider plants, and most tropical foliage plants</p>
<p><strong>Characteristics:</strong> Well-draining but moisture-retentive. Usually a blend of peat/coir, perlite, and a small amount of compost.</p>

<h3>Cactus & Succulent Mix</h3>
<p><strong>Best for:</strong> All cacti, succulents, jade plants, and other desert plants</p>
<p><strong>Characteristics:</strong> Fast-draining with lots of grit. Contains more perlite, pumice, or coarse sand than standard mixes.</p>

<h3>Orchid Mix</h3>
<p><strong>Best for:</strong> Orchids and other epiphytic plants</p>
<p><strong>Characteristics:</strong> Very chunky with large bark pieces. Provides excellent air circulation and drainage.</p>

<h3>African Violet Mix</h3>
<p><strong>Best for:</strong> African violets, streptocarpus, and other gesneriads</p>
<p><strong>Characteristics:</strong> Lightweight and fluffy with excellent drainage but good moisture retention.</p>

<h2>When to Repot</h2>

<h3>Time-Based Guidelines</h3>
<ul>
<li><strong>Young, actively growing plants:</strong> Every 12-18 months</li>
<li><strong>Mature plants:</strong> Every 2-3 years</li>
<li><strong>Slow-growing plants:</strong> Every 3-5 years</li>
<li><strong>Cacti and succulents:</strong> Every 2-4 years</li>
</ul>

<h3>Signs Your Plant Needs Repotting</h3>
<ul>
<li><strong>Roots growing through drainage holes:</strong> Clear sign the plant has outgrown its pot</li>
<li><strong>Root-bound plant:</strong> Roots circling the pot's interior in a dense mass</li>
<li><strong>Water runs straight through:</strong> No soil left to absorb water</li>
<li><strong>Plant dries out very quickly:</strong> More roots than soil means less water retention</li>
<li><strong>Stunted growth despite proper care:</strong> No room for roots to expand</li>
<li><strong>Soil pulls away from pot sides:</strong> Old, compacted soil has deteriorated</li>
<li><strong>Top-heavy plant tips over easily:</strong> Outgrown its container</li>
<li><strong>Salt buildup on soil surface:</strong> White crusty deposits from mineral accumulation</li>
</ul>

<h3>Best Time to Repot</h3>
<p>Repot during the active growing season (typically spring or early summer) when plants can quickly establish in fresh soil. Avoid repotting during dormancy or when plants are stressed.</p>

<h2>How to Repot</h2>

<h3>Choose the Right Pot Size</h3>
<p>Go up only 1-2 inches in diameter. Too large a pot holds excess moisture and can lead to root rot. For example, a plant in a 4-inch pot should move to a 5 or 6-inch pot.</p>

<h3>Step-by-Step Repotting Process</h3>

<p><strong>1. Prepare Your Workspace</strong></p>
<p>Lay down newspaper or a plastic sheet. Gather fresh potting mix, new pot with drainage holes, and watering can.</p>

<p><strong>2. Water the Plant</strong></p>
<p>Water thoroughly a day before repotting. Moist soil makes root ball removal easier and reduces transplant shock.</p>

<p><strong>3. Remove the Plant</strong></p>
<p>Turn the pot on its side and gently ease the plant out. You may need to tap the pot's bottom or sides. Never pull on the stem.</p>

<p><strong>4. Inspect and Prune Roots</strong></p>
<p>Examine roots for health. Healthy roots are white or tan and firm. Remove any black, mushy, or foul-smelling roots (signs of rot). Gently tease apart circling roots.</p>

<p><strong>5. Add Fresh Soil</strong></p>
<p>Add a layer of fresh potting mix to the new pot. Place the plant so the soil line will be about 1 inch below the pot rim.</p>

<p><strong>6. Fill Around the Roots</strong></p>
<p>Add soil around the root ball, gently pressing to eliminate air pockets. Don't pack too firmly—roots need air space.</p>

<p><strong>7. Water Thoroughly</strong></p>
<p>Water until it drains from the bottom. This settles the soil and provides immediate moisture to stressed roots.</p>

<p><strong>8. Let it Recover</strong></p>
<p>Place in bright indirect light (even if the plant normally likes direct sun). Wait a week before fertilizing to allow roots to recover.</p>

<h2>After Repotting Care</h2>

<p><strong>First week:</strong> Keep soil lightly moist but not soggy. Avoid fertilizing. Provide bright indirect light.</p>

<p><strong>Second week:</strong> Return to normal watering schedule. Begin gradual reintroduction to normal light levels.</p>

<p><strong>Third week onward:</strong> Resume normal care including fertilizing. New root growth should be established.</p>

<h2>Common Repotting Mistakes</h2>

<ul>
<li><strong>Using pots without drainage holes:</strong> Recipe for root rot</li>
<li><strong>Going up too large in pot size:</strong> Excess soil stays wet too long</li>
<li><strong>Using garden soil:</strong> Too dense for containers</li>
<li><strong>Repotting during dormancy:</strong> Plant can't recover quickly</li>
<li><strong>Disturbing roots too much:</strong> Causes unnecessary stress</li>
<li><strong>Burying the stem deeper:</strong> Can cause stem rot</li>
<li><strong>Fertilizing immediately:</strong> Burns damaged roots</li>
</ul>

<h2>Refreshing Soil Without Repotting</h2>
<p>For large plants or those that prefer being root-bound, you can refresh the soil without full repotting:</p>
<ul>
<li>Remove top 2-3 inches of old soil</li>
<li>Add fresh potting mix to replace what was removed</li>
<li>Water thoroughly to help new soil settle</li>
<li>This adds nutrients and improves drainage without disturbing roots</li>
</ul>

<h2>Expert Assistance Available</h2>
<p>Repotting can be intimidating, especially for large or valuable plants. Visit ${businessName} for hands-on guidance, quality potting mixes, and the perfect containers for your plants. Our team can help you master this essential plant care skill.</p>`
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      cta: {
        type: 'cta',
        order: 4,
        visible: true,
        data: {
          headline: 'Complete Your Plant Care Knowledge',
          description: 'Learn how to handle pests and keep your plants healthy year-round.',
          ctaText: 'Pest Solutions',
          ctaLink: '/pests',
          secondaryCtaText: 'Browse Our Selection',
          secondaryCtaLink: '/home'
        },
        settings: {
          backgroundColor: 'primary'
        }
      }
    }
  }
}

export function getPestsGuideTemplate(businessName: string) {
  return {
    version: '1.0',
    layout: 'other',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: 'Common Pests & Problems',
          subheadline: 'Identifying and treating spider mites, fungus gnats, yellowing leaves, and more'
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      features: {
        type: 'features',
        order: 2,
        visible: true,
        data: {
          headline: 'Protect Your Plant Investment',
          description: 'Comprehensive pest and problem solutions to keep your plants thriving',
          features: [
            { icon: 'Eye', title: 'Identify common pests before they cause damage' },
            { icon: 'ShieldCheck', title: 'Apply safe, organic treatment solutions' },
            { icon: 'Bug', title: 'Prevent future infestations with proper care' }
          ]
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      richText: {
        type: 'richText',
        order: 3,
        visible: true,
        data: {
          headline: '',
          content: `<h2>Prevention is Key</h2>
<p>Healthy plants are naturally more resistant to pests and diseases. Most problems can be prevented with proper care: appropriate watering, adequate light, good air circulation, and regular inspection of your plants.</p>

<h2>Common Houseplant Pests</h2>

<h3>Spider Mites</h3>
<p><strong>Identification:</strong> Tiny (almost microscopic) spider-like creatures. Look for fine webbing between leaves and stems, and small yellow or white speckles on leaf surfaces where they feed.</p>

<p><strong>Signs of infestation:</strong></p>
<ul>
<li>Stippled, discolored leaves with tiny dots</li>
<li>Fine silky webbing, especially on new growth</li>
<li>Leaves become dull, bronze, or yellow</li>
<li>Severe cases: leaves drop off</li>
</ul>

<p><strong>Prevention:</strong> Spider mites thrive in dry conditions. Maintain adequate humidity and regularly mist plants or use a pebble tray.</p>

<p><strong>Treatment:</strong></p>
<ul>
<li>Isolate infected plant immediately</li>
<li>Spray plant thoroughly with water to dislodge mites</li>
<li>Apply insecticidal soap or neem oil, coating all leaf surfaces</li>
<li>Repeat treatment every 3-5 days for 2-3 weeks</li>
<li>Increase humidity around plant</li>
</ul>

<h3>Fungus Gnats</h3>
<p><strong>Identification:</strong> Small black flies (1/8 inch) that hover around soil surface. Adults are harmless, but larvae feed on roots and organic matter in soil.</p>

<p><strong>Signs of infestation:</strong></p>
<ul>
<li>Small flies around plants, especially when watering</li>
<li>Flies attracted to windows</li>
<li>In severe cases: yellowing leaves, stunted growth from root damage</li>
</ul>

<p><strong>Prevention:</strong> Fungus gnats breed in moist soil with organic matter. Allow soil to dry between waterings.</p>

<p><strong>Treatment:</strong></p>
<ul>
<li>Let soil dry out more than usual between waterings</li>
<li>Apply yellow sticky traps to catch adult flies</li>
<li>Add a 1-inch layer of sand or fine gravel to soil surface (prevents egg-laying)</li>
<li>Use Bacillus thuringiensis (Bt) drench to kill larvae</li>
<li>Repot with fresh soil if infestation is severe</li>
</ul>

<h3>Mealybugs</h3>
<p><strong>Identification:</strong> White, cottony masses that look like bits of cotton or lint. Usually found in leaf axils, stem joints, and on undersides of leaves.</p>

<p><strong>Signs of infestation:</strong></p>
<ul>
<li>White cottony clusters on plant</li>
<li>Sticky honeydew secretions on leaves</li>
<li>Yellowing leaves and stunted growth</li>
<li>Black sooty mold growing on honeydew</li>
</ul>

<p><strong>Treatment:</strong></p>
<ul>
<li>Isolate plant immediately</li>
<li>Remove visible bugs with cotton swab dipped in rubbing alcohol</li>
<li>Spray thoroughly with insecticidal soap or neem oil</li>
<li>Repeat weekly for 3-4 weeks</li>
<li>Check nearby plants for spread</li>
</ul>

<h3>Scale Insects</h3>
<p><strong>Identification:</strong> Small brown or tan bumps on stems and leaves that look like part of the plant. Actually insects with protective shell coverings.</p>

<p><strong>Signs of infestation:</strong></p>
<ul>
<li>Brown bumps on stems or leaves</li>
<li>Sticky honeydew on leaves below</li>
<li>Yellowing leaves</li>
<li>Black sooty mold</li>
</ul>

<p><strong>Treatment:</strong></p>
<ul>
<li>Scrape off scale with fingernail or old toothbrush</li>
<li>Wipe stems with rubbing alcohol on cotton swab</li>
<li>Apply horticultural oil or neem oil</li>
<li>Repeat treatment every 7-10 days for several weeks</li>
</ul>

<h3>Aphids</h3>
<p><strong>Identification:</strong> Small soft-bodied insects (green, black, brown, or pink) that cluster on new growth, buds, and undersides of leaves.</p>

<p><strong>Signs of infestation:</strong></p>
<ul>
<li>Clusters of small insects on new growth</li>
<li>Curled or distorted new leaves</li>
<li>Sticky honeydew on leaves</li>
<li>Black sooty mold</li>
</ul>

<p><strong>Treatment:</strong></p>
<ul>
<li>Spray off with strong stream of water</li>
<li>Apply insecticidal soap or neem oil</li>
<li>Introduce beneficial insects (ladybugs) for outdoor plants</li>
<li>Repeat treatments weekly until gone</li>
</ul>

<h2>Common Plant Problems</h2>

<h3>Yellowing Leaves</h3>
<p>Multiple causes require careful diagnosis:</p>

<p><strong>Lower leaves turning yellow:</strong></p>
<ul>
<li><strong>If soil is soggy:</strong> Overwatering (most common cause)</li>
<li><strong>If soil is dry:</strong> Normal aging as plant grows</li>
</ul>

<p><strong>Overall yellowing:</strong></p>
<ul>
<li><strong>Pale yellow-green:</strong> Insufficient light or nitrogen deficiency</li>
<li><strong>Yellow with green veins:</strong> Iron deficiency (chlorosis) or pH problem</li>
<li><strong>Yellow with brown tips:</strong> Inconsistent watering or salt buildup</li>
</ul>

<p><strong>Solutions:</strong></p>
<ul>
<li>Adjust watering schedule (check soil moisture first)</li>
<li>Move to brighter location if light is insufficient</li>
<li>Fertilize if not fed recently (during growing season only)</li>
<li>Flush soil with water to remove salt buildup</li>
<li>Check for root rot if overwatering is suspected</li>
</ul>

<h3>Brown Leaf Tips</h3>
<p><strong>Common causes:</strong></p>
<ul>
<li>Low humidity (most common for tropical plants)</li>
<li>Fluoride or chlorine in tap water</li>
<li>Salt buildup from over-fertilizing</li>
<li>Inconsistent watering</li>
<li>Cold drafts or hot, dry air from heating vents</li>
</ul>

<p><strong>Solutions:</strong></p>
<ul>
<li>Increase humidity with pebble trays, grouping plants, or humidifier</li>
<li>Use filtered or distilled water for sensitive plants</li>
<li>Flush soil monthly to remove salt buildup</li>
<li>Reduce fertilizer frequency or strength</li>
<li>Move away from drafts and heating/cooling vents</li>
<li>Trim brown tips with clean scissors (cut at an angle to mimic natural leaf shape)</li>
</ul>

<h3>Wilting Despite Wet Soil</h3>
<p><strong>Cause:</strong> Root rot from overwatering. Damaged roots can't absorb water.</p>

<p><strong>Action:</strong></p>
<ul>
<li>Remove plant from pot and inspect roots</li>
<li>Healthy roots are white/tan and firm</li>
<li>Diseased roots are black/brown, mushy, and smell bad</li>
<li>Trim all rotted roots with sterile scissors</li>
<li>Repot in fresh soil and smaller pot if needed</li>
<li>Water sparingly until plant recovers</li>
<li>Place in bright indirect light during recovery</li>
</ul>

<h3>Leggy, Stretched Growth</h3>
<p><strong>Cause:</strong> Insufficient light causes plants to stretch toward light source.</p>

<p><strong>Solutions:</strong></p>
<ul>
<li>Move to brighter location immediately</li>
<li>Rotate plant regularly for even growth</li>
<li>Prune back leggy stems to encourage bushier growth</li>
<li>Consider supplemental grow lights for dark winters</li>
</ul>

<h3>Dropping Leaves</h3>
<p><strong>Possible causes:</strong></p>
<ul>
<li><strong>Sudden changes:</strong> Temperature, light, location, or watering schedule</li>
<li><strong>Environmental stress:</strong> Drafts, heating/cooling vents, or extreme temperatures</li>
<li><strong>Watering issues:</strong> Overwatering or severe underwatering</li>
<li><strong>Pest problems:</strong> Check carefully for insects</li>
<li><strong>Natural dormancy:</strong> Some plants drop leaves seasonally</li>
</ul>

<p><strong>Solutions:</strong></p>
<ul>
<li>Maintain consistent care routine</li>
<li>Avoid moving plants unnecessarily</li>
<li>Check soil moisture and adjust watering</li>
<li>Inspect for pests</li>
<li>Keep away from drafts and temperature extremes</li>
</ul>

<h2>Integrated Pest Management</h2>

<h3>1. Prevention</h3>
<ul>
<li>Quarantine new plants for 2-3 weeks</li>
<li>Inspect plants regularly</li>
<li>Provide optimal growing conditions</li>
<li>Clean leaves regularly with damp cloth</li>
<li>Maintain proper spacing for air circulation</li>
</ul>

<h3>2. Early Detection</h3>
<ul>
<li>Check plants weekly, especially undersides of leaves</li>
<li>Use magnifying glass for tiny pests</li>
<li>Look for warning signs: discoloration, webbing, sticky residue</li>
</ul>

<h3>3. Mechanical Control</h3>
<ul>
<li>Remove visible pests by hand</li>
<li>Spray off with water</li>
<li>Prune heavily infested parts</li>
<li>Use yellow sticky traps</li>
</ul>

<h3>4. Organic Solutions</h3>
<ul>
<li>Neem oil: Broad-spectrum pest control</li>
<li>Insecticidal soap: Effective for soft-bodied insects</li>
<li>Horticultural oil: Smothers insects and eggs</li>
<li>Diatomaceous earth: Controls crawling insects</li>
</ul>

<h2>When to Use Chemical Controls</h2>
<p>Reserve chemical pesticides for severe infestations that haven't responded to organic methods. Always:</p>
<ul>
<li>Read and follow label directions exactly</li>
<li>Apply outdoors or in well-ventilated area</li>
<li>Keep away from pets and children</li>
<li>Start with least toxic option</li>
<li>Target specific pest with appropriate product</li>
</ul>

<h2>Get Expert Help</h2>
<p>Pest and disease problems can be tricky to diagnose and treat. Bring a sample or photo to ${businessName} for expert identification and personalized treatment recommendations. Our team can help you choose the most effective, plant-safe solutions for your specific problem.</p>`
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      cta: {
        type: 'cta',
        order: 4,
        visible: true,
        data: {
          headline: 'Build Your Plant Care Library',
          description: 'Master all aspects of plant care with our comprehensive guide collection.',
          ctaText: 'Soil & Repotting Guide',
          ctaLink: '/soil',
          secondaryCtaText: 'Get Expert Help',
          secondaryCtaLink: '/contact'
        },
        settings: {
          backgroundColor: 'primary'
        }
      }
    }
  }
}
