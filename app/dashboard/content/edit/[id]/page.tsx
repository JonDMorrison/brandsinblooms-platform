'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Settings, 
  Layout,
  Smartphone,
  Tablet,
  Monitor,
  FileText,
  Grid3X3,
  User,
  Package,
  Phone
} from 'lucide-react'
import { toast } from 'sonner'

// Import layout preview components
import { LandingPagePreview } from '@/src/components/layout-previews/LandingPagePreview'
import { BlogArticlePreview } from '@/src/components/layout-previews/BlogArticlePreview'
import { PortfolioGridPreview } from '@/src/components/layout-previews/PortfolioGridPreview'
import { AboutCompanyPreview } from '@/src/components/layout-previews/AboutCompanyPreview'
import { ProductPagePreview } from '@/src/components/layout-previews/ProductPagePreview'
import { ContactServicesPreview } from '@/src/components/layout-previews/ContactServicesPreview'

type LayoutType = 'landing' | 'blog' | 'portfolio' | 'about' | 'product' | 'contact'
type ViewportSize = 'mobile' | 'tablet' | 'desktop'

interface PageData {
  id: string
  title: string
  subtitle?: string
  layout: LayoutType
  status: 'draft' | 'published' | 'archived'
  lastModified: Date
}

const layoutInfo = {
  landing: { name: 'Landing Page', icon: Layout, component: LandingPagePreview },
  blog: { name: 'Blog Article', icon: FileText, component: BlogArticlePreview },
  portfolio: { name: 'Portfolio Grid', icon: Grid3X3, component: PortfolioGridPreview },
  about: { name: 'About/Company', icon: User, component: AboutCompanyPreview },
  product: { name: 'Product Page', icon: Package, component: ProductPagePreview },
  contact: { name: 'Contact/Services', icon: Phone, component: ContactServicesPreview }
}

const viewportSizes = {
  mobile: { width: '375px', icon: Smartphone, label: 'Mobile' },
  tablet: { width: '768px', icon: Tablet, label: 'Tablet' },
  desktop: { width: '100%', icon: Monitor, label: 'Desktop' }
}

// Mock data - in real app, this would be fetched from API
const mockPages: PageData[] = [
  {
    id: '1',
    title: 'Welcome to Brands & Blooms',
    subtitle: 'Your premier destination for beautiful floral arrangements',
    layout: 'landing',
    status: 'published',
    lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    title: 'Our Beautiful Flower Collection',
    subtitle: 'Explore our curated selection of fresh flowers',
    layout: 'portfolio',
    status: 'published',
    lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    title: 'Spring Wedding Trends 2024',
    subtitle: 'Discover the latest trends in wedding florals',
    layout: 'blog',
    status: 'published',
    lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '4',
    title: 'About Our Florist Team',
    subtitle: 'Meet the passionate people behind our beautiful arrangements',
    layout: 'about',
    status: 'draft',
    lastModified: new Date(Date.now() - 3 * 60 * 60 * 1000)
  }
]

export default function EditContentPage() {
  const router = useRouter()
  const params = useParams()
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [activeViewport, setActiveViewport] = useState<ViewportSize>('desktop')
  const [isPreviewMode, setIsPreviewMode] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching page data by ID
    const pageId = params.id as string
    const page = mockPages.find(p => p.id === pageId)
    
    if (page) {
      setPageData(page)
    } else {
      toast.error('Page not found')
      router.push('/dashboard/content')
    }
    
    setLoading(false)
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Loading page...</p>
        </div>
      </div>
    )
  }

  if (!pageData) {
    return null
  }

  const CurrentLayoutComponent = layoutInfo[pageData.layout].component
  const LayoutIcon = layoutInfo[pageData.layout].icon

  const handleSave = () => {
    // Simulate save operation
    setHasUnsavedChanges(false)
    toast.success('Page saved successfully!')
  }

  const handlePreview = () => {
    // Open preview in new tab (simulated)
    toast.info('Preview would open in a new tab')
  }

  const handleLayoutChange = (newLayout: LayoutType) => {
    setPageData({ ...pageData, layout: newLayout })
    setHasUnsavedChanges(true)
  }

  const handlePublish = () => {
    setPageData({ ...pageData, status: 'published' })
    setHasUnsavedChanges(true)
    toast.success('Page published successfully!')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard/content')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Content
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <div className="flex items-center gap-2">
                <LayoutIcon className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-bold">{pageData.title}</h1>
                <Badge 
                  variant={pageData.status === 'published' ? 'default' : 'secondary'}
                  className={
                    pageData.status === 'published' 
                      ? 'bg-green-600' 
                      : pageData.status === 'draft' 
                      ? 'bg-yellow-600' 
                      : ''
                  }
                >
                  {pageData.status}
                </Badge>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Unsaved
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {layoutInfo[pageData.layout].name} • Last modified {pageData.lastModified.toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Viewport Toggle */}
            <div className="flex items-center border rounded-md">
              {Object.entries(viewportSizes).map(([size, config]) => {
                const Icon = config.icon
                return (
                  <Button
                    key={size}
                    variant={activeViewport === size ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none first:rounded-l-md last:rounded-r-md"
                    onClick={() => setActiveViewport(size as ViewportSize)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                )
              })}
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Mode Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={isPreviewMode ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setIsPreviewMode(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant={!isPreviewMode ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setIsPreviewMode(false)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Actions */}
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            {pageData.status === 'draft' && (
              <Button variant="outline" onClick={handlePublish}>
                Publish
              </Button>
            )}
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Edit Mode) */}
        {!isPreviewMode && (
          <div className="w-80 border-r bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            <div className="p-6">
              <Tabs defaultValue="layout" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="layout">Layout</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                </TabsList>
                
                <TabsContent value="layout" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Page Layout</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(layoutInfo).map(([layoutKey, info]) => {
                        const Icon = info.icon
                        const isActive = pageData.layout === layoutKey
                        return (
                          <div
                            key={layoutKey}
                            className={`
                              p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm
                              ${isActive 
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950' 
                                : 'border-gray-200 dark:border-gray-700'
                              }
                            `}
                            onClick={() => handleLayoutChange(layoutKey as LayoutType)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`
                                p-2 rounded-md 
                                ${isActive 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                }
                              `}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{info.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Switch to {info.name.toLowerCase()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Page Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Page Title</label>
                        <p className="text-sm text-muted-foreground mt-1">{pageData.title}</p>
                      </div>
                      {pageData.subtitle && (
                        <div>
                          <label className="text-sm font-medium">Subtitle</label>
                          <p className="text-sm text-muted-foreground mt-1">{pageData.subtitle}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">{pageData.status}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Last Modified</label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {pageData.lastModified.toLocaleString()}
                        </p>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Content editing features will be available in the full editor implementation.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* Preview Area */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-6 overflow-auto">
          <div className="flex justify-center">
            <div 
              className="bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden transition-all duration-300"
              style={{ 
                width: viewportSizes[activeViewport].width,
                minHeight: '600px',
                maxWidth: '100%'
              }}
            >
              <CurrentLayoutComponent 
                title={pageData.title}
                subtitle={pageData.subtitle}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t bg-gray-50 dark:bg-gray-900 px-6 py-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Layout: {layoutInfo[pageData.layout].name}</span>
            <span>•</span>
            <span>Viewport: {viewportSizes[activeViewport].label}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Last saved: {pageData.lastModified.toLocaleTimeString()}</span>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}