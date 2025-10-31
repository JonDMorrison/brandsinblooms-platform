'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Globe,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Palette,
  Image,
  Clock,
  DollarSign,
  Star,
  MessageSquare,
  HelpCircle,
  Package,
  Link,
  FileText,
  Hash,
  Timer,
  Database,
  Sparkles,
  ExternalLink,
  Users,
  Code
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/src/components/ui/collapsible'
import { Progress } from '@/src/components/ui/progress'
import { Separator } from '@/src/components/ui/separator'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { toast } from 'sonner'
import NextLink from 'next/link'
import { useAuth } from '@/src/contexts/AuthContext'
import type { ScraperPreviewResponse, DevApiErrorResponse, ScrapedPageResult } from '@/lib/types/dev-api-types'

export default function ScraperTestPage() {
  console.log('[ScraperTestPage] Component rendering')

  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScraperPreviewResponse | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [selectedPage, setSelectedPage] = useState<ScrapedPageResult | null>(null)

  // Note: Authentication is handled at the API level
  // The /api/dev/scraper-preview endpoint requires authentication and returns 401 if not authenticated
  // This page is accessible to all users in development, but the API will enforce auth

  console.log('[ScraperTestPage] Current state:', { url, loading, error: !!error, result: !!result })
  console.log('[ScraperTestPage] Router:', router)

  useEffect(() => {
    console.log('[ScraperTestPage useEffect] Mounted - checking if any effects run')
    return () => {
      console.log('[ScraperTestPage useEffect] Unmounting - navigation detected')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[handleSubmit] Form submitted, preventing default')
    e.preventDefault()

    console.log('[handleSubmit] URL:', url)
    if (!url) {
      console.log('[handleSubmit] No URL, showing error')
      toast.error('Please enter a URL')
      return
    }

    console.log('[handleSubmit] Setting loading state')
    setLoading(true)
    setError(null)
    setResult(null)
    setSelectedPage(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)

    try {
      console.log('[handleSubmit] Calling API...')
      const response = await fetch('/api/dev/scraper-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: url,
          verbose: true,
        }),
        signal: controller.signal,
      })

      console.log('[handleSubmit] API response status:', response.status)

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[handleSubmit] 401 Unauthorized')
          throw new Error('Authentication required. Please log in to use this tool.')
        }
        const errorData = await response.json() as DevApiErrorResponse
        console.log('[handleSubmit] Error data:', errorData)
        throw new Error(errorData.error || `Failed with status ${response.status}`)
      }

      console.log('[handleSubmit] Parsing response...')
      const data = await response.json() as { data: ScraperPreviewResponse }
      console.log('[handleSubmit] Setting result data')
      setResult(data.data)

      // Auto-select first page if available
      if (data.data.scraping.discovery.pages.length > 0) {
        console.log('[handleSubmit] Auto-selecting first page')
        const firstPage: ScrapedPageResult = {
          url: data.data.scraping.discovery.pages[0].url,
          pageType: data.data.scraping.discovery.pages[0].pageType,
          title: data.data.scraping.discovery.pages[0].metadata?.title,
          success: true,
          htmlSize: data.data.scraping.discovery.pages[0].html.length,
        }
        setSelectedPage(firstPage)
      }

      console.log('[handleSubmit] Success!')
      toast.success('Scraping completed successfully')
    } catch (err) {
      console.log('[handleSubmit] Error:', err)
      const message = (err as any)?.name === 'AbortError'
        ? 'Request timed out. Try again or use a simpler page.'
        : err instanceof Error ? err.message : 'Failed to scrape website'
      setError(message)
      toast.error(message)
    } finally {
      console.log('[handleSubmit] Resetting loading state')
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const renderBrandColors = (colors?: string[]) => {
    if (!colors || colors.length === 0) return null

    return (
      <div className="flex gap-2 flex-wrap">
        {colors.map((color, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className="w-8 h-8 rounded border"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-muted-foreground">{color}</span>
          </div>
        ))}
      </div>
    )
  }

  const renderExtractedSection = (title: string, icon: React.ReactNode, content: React.ReactNode) => {
    const isExpanded = expandedSections[title] !== false // Default to expanded

    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleSection(title)}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 hover:bg-accent rounded-lg transition-colors">
          <Button variant="ghost" size="sm" className="p-0 h-auto">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          {icon}
          <span className="font-medium">{title}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pl-9 pb-4">
            {content}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Auth Banner for dev tools */}
      {!authLoading && !user && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sign in required</AlertTitle>
          <AlertDescription className="flex items-center gap-3 flex-wrap">
            Dev tools require authentication. Submitting will return 401 until you sign in.
            <Button size="sm" variant="outline" asChild>
              <NextLink href={`/login?redirectTo=${encodeURIComponent('/dev/scraper-test')}`}>
                Sign In
              </NextLink>
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Website Scraper Test</h1>
        <p className="text-muted-foreground">
          Test the website scraper to see what data will be extracted for AI site generation
        </p>
      </div>

      {/* URL Input Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Enter Website URL</CardTitle>
          <CardDescription>
            Enter a website URL to perform a dry-run scrape and see all extracted data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            onSubmitCapture={(e) => {
              console.log('[form onSubmitCapture] Form submit captured')
            }}
          >
            <div>
              <Label htmlFor="url">Website URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  onClick={(e) => {
                    console.log('[Button onClick] Button clicked directly')
                    console.log('[Button onClick] Event:', e.type, e.currentTarget.type)
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      Test Scraper
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Scraping Duration</p>
                  <p className="text-2xl font-bold">{formatDuration(result.scraping.duration)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Analysis Duration</p>
                  <p className="text-2xl font-bold">{formatDuration(result.analysis.duration)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Duration</p>
                  <p className="text-2xl font-bold">{formatDuration(result.execution.totalDuration)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Size</p>
                  <p className="text-2xl font-bold">{formatBytes(result.scraping.metrics.totalDataSize)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Navigation Map
              </CardTitle>
              <CardDescription>
                Found {result.scraping.metrics.totalPagesFound} pages, scraped {result.scraping.metrics.totalPagesScraped}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.scraping.discovery.pages.map((page, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPage?.url === page.url ? 'bg-accent border-primary' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedPage({
                      url: page.url,
                      pageType: page.pageType,
                      title: page.metadata?.title,
                      success: true,
                      htmlSize: page.html.length
                    })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{page.pageType}</Badge>
                        <span className="font-medium">{page.metadata?.title || page.url}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatBytes(page.html.length)}</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                ))}

                {result.scraping.metrics.failedUrls && result.scraping.metrics.failedUrls.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-destructive mb-2">Failed Pages:</p>
                    {result.scraping.metrics.failedUrls.map((failed, index) => (
                      <div key={index} className="p-2 bg-destructive/10 rounded text-sm">
                        <p className="font-medium">{failed.url}</p>
                        <p className="text-muted-foreground">{failed.error}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Extracted Data Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Extracted Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="branding" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="structured">Structured</TabsTrigger>
                  <TabsTrigger value="context">LLM Context</TabsTrigger>
                </TabsList>

                {/* Branding Tab */}
                <TabsContent value="branding" className="space-y-4">
                  {renderExtractedSection(
                    'Logo',
                    <Image className="h-4 w-4" />,
                    result.analysis.extracted.hasLogo ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Logo URL:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted p-2 rounded flex-1 overflow-x-auto">
                            {result.analysis.extracted.logoUrl}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(result.analysis.extracted.logoUrl || '', 'logo')}
                          >
                            {copiedField === 'logo' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No logo found</p>
                    )
                  )}

                  {renderExtractedSection(
                    'Brand Colors',
                    <Palette className="h-4 w-4" />,
                    result.analysis.extracted.brandColorsCount > 0 ? (
                      renderBrandColors(result.analysis.extracted.brandColors)
                    ) : (
                      <p className="text-muted-foreground">No brand colors found</p>
                    )
                  )}

                  {result.analysis.result.businessInfo.favicon && renderExtractedSection(
                    'Favicon',
                    <Image className="h-4 w-4" />,
                    <code className="text-xs bg-muted p-2 rounded">
                      {result.analysis.result.businessInfo.favicon}
                    </code>
                  )}

                  {result.analysis.result.businessInfo.fonts && result.analysis.result.businessInfo.fonts.length > 0 && renderExtractedSection(
                    'Fonts',
                    <Code className="h-4 w-4" />,
                    <div className="flex flex-wrap gap-2">
                      {result.analysis.result.businessInfo.fonts.map((font, idx) => (
                        <Badge key={idx} variant="secondary">{font}</Badge>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Contact Tab */}
                <TabsContent value="contact" className="space-y-4">
                  {renderExtractedSection(
                    `Emails (${result.analysis.extracted.emailsCount})`,
                    <Mail className="h-4 w-4" />,
                    result.analysis.extracted.emails && result.analysis.extracted.emails.length > 0 ? (
                      <ul className="space-y-1">
                        {result.analysis.extracted.emails.map((email, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <code className="text-sm">{email}</code>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No emails found</p>
                    )
                  )}

                  {renderExtractedSection(
                    `Phone Numbers (${result.analysis.extracted.phonesCount})`,
                    <Phone className="h-4 w-4" />,
                    result.analysis.extracted.phones && result.analysis.extracted.phones.length > 0 ? (
                      <ul className="space-y-1">
                        {result.analysis.extracted.phones.map((phone, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <code className="text-sm">{phone}</code>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No phone numbers found</p>
                    )
                  )}

                  {renderExtractedSection(
                    `Addresses`,
                    <MapPin className="h-4 w-4" />,
                    result.analysis.result.businessInfo.addresses && result.analysis.result.businessInfo.addresses.length > 0 ? (
                      <ul className="space-y-2">
                        {result.analysis.result.businessInfo.addresses.map((address, index) => (
                          <li key={index} className="p-2 bg-muted rounded">
                            {address}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No addresses found</p>
                    )
                  )}

                  {renderExtractedSection(
                    `Social Links (${result.analysis.extracted.socialLinksCount})`,
                    <Link className="h-4 w-4" />,
                    result.analysis.result.businessInfo.socialLinks && result.analysis.result.businessInfo.socialLinks.length > 0 ? (
                      <ul className="space-y-2">
                        {result.analysis.result.businessInfo.socialLinks.map((link, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Badge variant="secondary">{link.platform}</Badge>
                            <code className="text-xs">{link.url}</code>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No social links found</p>
                    )
                  )}
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4">
                  {result.analysis.result.businessInfo.heroSection && renderExtractedSection(
                    'Hero Section',
                    <Sparkles className="h-4 w-4" />,
                    <div className="space-y-2">
                      {result.analysis.result.businessInfo.heroSection.headline && (
                        <div>
                          <p className="text-sm font-medium">Headline:</p>
                          <p className="text-lg">{result.analysis.result.businessInfo.heroSection.headline}</p>
                        </div>
                      )}
                      {result.analysis.result.businessInfo.heroSection.subheadline && (
                        <div>
                          <p className="text-sm font-medium">Subheadline:</p>
                          <p>{result.analysis.result.businessInfo.heroSection.subheadline}</p>
                        </div>
                      )}
                      {result.analysis.result.businessInfo.heroSection.ctaText && (
                        <div>
                          <p className="text-sm font-medium">CTA Text:</p>
                          <Badge>{result.analysis.result.businessInfo.heroSection.ctaText}</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {renderExtractedSection(
                    `Key Features (${result.analysis.result.businessInfo.keyFeatures?.length || 0})`,
                    <Star className="h-4 w-4" />,
                    result.analysis.result.businessInfo.keyFeatures && result.analysis.result.businessInfo.keyFeatures.length > 0 ? (
                      <ul className="space-y-2">
                        {result.analysis.result.businessInfo.keyFeatures.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No key features found</p>
                    )
                  )}

                  {result.analysis.result.businessInfo.businessDescription && renderExtractedSection(
                    'Business Description',
                    <FileText className="h-4 w-4" />,
                    <p className="text-sm">{result.analysis.result.businessInfo.businessDescription}</p>
                  )}

                  {result.analysis.result.businessInfo.tagline && renderExtractedSection(
                    'Tagline',
                    <MessageSquare className="h-4 w-4" />,
                    <p className="text-lg font-medium">{result.analysis.result.businessInfo.tagline}</p>
                  )}
                </TabsContent>

                {/* Images Tab */}
                <TabsContent value="images" className="space-y-4">
                  {result.analysis.result.businessInfo.heroImages && result.analysis.result.businessInfo.heroImages.length > 0 && renderExtractedSection(
                    `Hero Images (${result.analysis.result.businessInfo.heroImages.length})`,
                    <Image className="h-4 w-4" />,
                    <div className="space-y-3">
                      {result.analysis.result.businessInfo.heroImages.map((image, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              {/* Image Preview */}
                              <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden">
                                <img
                                  src={image.url}
                                  alt={image.alt || `Hero image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
                                  }}
                                />
                              </div>

                              {/* Image Details */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{image.context}</Badge>
                                  <Badge variant="outline">Confidence: {(image.confidence * 100).toFixed(0)}%</Badge>
                                </div>

                                {image.alt && (
                                  <div>
                                    <p className="text-sm font-medium">Alt Text:</p>
                                    <p className="text-sm text-muted-foreground">{image.alt}</p>
                                  </div>
                                )}

                                {image.dimensions && (
                                  <div>
                                    <p className="text-sm font-medium">Dimensions:</p>
                                    <p className="text-sm text-muted-foreground">
                                      {image.dimensions.width} × {image.dimensions.height}
                                    </p>
                                  </div>
                                )}

                                <div>
                                  <p className="text-sm font-medium">URL:</p>
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs bg-muted p-2 rounded flex-1 overflow-x-auto">
                                      {image.url}
                                    </code>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(image.url, `hero-image-${index}`)}
                                    >
                                      {copiedField === `hero-image-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {result.analysis.result.businessInfo.galleries && result.analysis.result.businessInfo.galleries.length > 0 && renderExtractedSection(
                    `Image Galleries (${result.analysis.result.businessInfo.galleries.length})`,
                    <Image className="h-4 w-4" />,
                    <div className="space-y-4">
                      {result.analysis.result.businessInfo.galleries.map((gallery, galleryIndex) => (
                        <Card key={galleryIndex}>
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              {/* Gallery Info */}
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{gallery.type}</Badge>
                                {gallery.title && <Badge variant="outline">{gallery.title}</Badge>}
                                {gallery.columns && <Badge>Columns: {gallery.columns}</Badge>}
                              </div>

                              {/* Gallery Images Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {gallery.images.slice(0, 12).map((image, imageIndex) => (
                                  <div key={imageIndex} className="relative aspect-square bg-muted rounded-md overflow-hidden group">
                                    <img
                                      src={image.url}
                                      alt={image.alt || `Gallery image ${imageIndex + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <div className="text-white text-xs text-center p-2">
                                        {image.alt || 'No alt text'}
                                        {image.aspectRatio && <div className="mt-1">Ratio: {image.aspectRatio}</div>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {gallery.images.length > 12 && (
                                <p className="text-sm text-muted-foreground text-center">
                                  +{gallery.images.length - 12} more images
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {(!result.analysis.result.businessInfo.heroImages || result.analysis.result.businessInfo.heroImages.length === 0) &&
                   (!result.analysis.result.businessInfo.galleries || result.analysis.result.businessInfo.galleries.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No images were extracted from this site</p>
                    </div>
                  )}
                </TabsContent>

                {/* Structured Data Tab */}
                <TabsContent value="structured" className="space-y-4">
                  {result.analysis.result.businessInfo.structuredContent?.businessHours && renderExtractedSection(
                    `Business Hours (${result.analysis.result.businessInfo.structuredContent.businessHours.length})`,
                    <Clock className="h-4 w-4" />,
                    <div className="space-y-1">
                      {result.analysis.result.businessInfo.structuredContent.businessHours.map((hours, index) => (
                        <div key={index} className="flex justify-between py-1">
                          <span className="font-medium">{hours.day}</span>
                          <span className={hours.closed ? 'text-muted-foreground' : ''}>
                            {hours.closed ? 'Closed' : hours.hours}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.analysis.result.businessInfo.structuredContent?.services && renderExtractedSection(
                    `Services (${result.analysis.result.businessInfo.structuredContent.services.length})`,
                    <Package className="h-4 w-4" />,
                    <div className="space-y-3">
                      {result.analysis.result.businessInfo.structuredContent.services.slice(0, 10).map((service, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="space-y-1">
                              <p className="font-medium">{service.name}</p>
                              {service.description && (
                                <p className="text-sm text-muted-foreground">{service.description}</p>
                              )}
                              <div className="flex gap-4 mt-2">
                                {service.price && (
                                  <Badge variant="secondary">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    {service.price}
                                  </Badge>
                                )}
                                {service.duration && (
                                  <Badge variant="outline">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {service.duration}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {result.analysis.result.businessInfo.structuredContent?.testimonials && renderExtractedSection(
                    `Testimonials (${result.analysis.result.businessInfo.structuredContent.testimonials.length})`,
                    <Users className="h-4 w-4" />,
                    <div className="space-y-3">
                      {result.analysis.result.businessInfo.structuredContent.testimonials.slice(0, 5).map((testimonial, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <blockquote className="text-sm italic">
                              "{testimonial.content}"
                            </blockquote>
                            <div className="mt-2 flex items-center justify-between">
                              <div>
                                {testimonial.name && <p className="text-sm font-medium">{testimonial.name}</p>}
                                {testimonial.role && <p className="text-xs text-muted-foreground">{testimonial.role}</p>}
                              </div>
                              {testimonial.rating && (
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < testimonial.rating! ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {result.analysis.result.businessInfo.structuredContent?.faq && renderExtractedSection(
                    `FAQ (${result.analysis.result.businessInfo.structuredContent.faq.length})`,
                    <HelpCircle className="h-4 w-4" />,
                    <div className="space-y-3">
                      {result.analysis.result.businessInfo.structuredContent.faq.slice(0, 5).map((item, index) => (
                        <div key={index} className="space-y-1">
                          <p className="font-medium text-sm">{item.question}</p>
                          <p className="text-sm text-muted-foreground">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* LLM Context Tab */}
                <TabsContent value="context" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Token Estimate</p>
                        <p className="text-2xl font-bold">{result.llmContext.estimatedTokens.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Context Size</p>
                        <p className="text-2xl font-bold">{formatBytes(result.llmContext.contextSize)}</p>
                      </div>
                    </div>

                    <Progress
                      value={(result.llmContext.estimatedTokens / 128000) * 100}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Using {((result.llmContext.estimatedTokens / 128000) * 100).toFixed(1)}% of GPT-4 context window
                    </p>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Recommended Pages to Generate</p>
                        <Badge>{result.analysis.result.recommendedPages.length}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.analysis.result.recommendedPages.map((page, index) => (
                          <Badge key={index} variant="secondary">
                            {page}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">LLM Context Preview</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(JSON.stringify(result.llmContext.context, null, 2), 'context')}
                        >
                          {copiedField === 'context' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          Copy Full Context
                        </Button>
                      </div>
                      <ScrollArea className="h-[400px] w-full rounded border p-4">
                        <pre className="text-xs">
                          <code>{JSON.stringify(result.llmContext.context, null, 2)}</code>
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warnings</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {result.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}
