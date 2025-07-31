'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { 
  ArrowLeft, 
  Eye, 
  Edit, 
  Palette, 
  AlertCircle,
  Plus,
  Loader2,
  Users,
  Clock
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getSiteTemplates, type SiteTemplate } from '@/src/lib/admin/sites'

const templateCategoryLabels: Record<string, string> = {
  'garden_center': 'Garden Center',
  'nursery': 'Plant Nursery',
  'landscaping': 'Landscaping',
  'retail': 'Retail Store',
  'service': 'Service Business',
  'blog': 'Blog & Content',
  'portfolio': 'Portfolio',
  'business': 'General Business'
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<SiteTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        const fetchedTemplates = await getSiteTemplates(undefined, false) // Include inactive templates
        setTemplates(fetchedTemplates)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching templates:', err)
        setError(err.message || 'Failed to load templates')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const handlePreview = (template: SiteTemplate) => {
    // In a real implementation, this would open a preview modal or page
    console.log('Preview template:', template.slug)
  }

  const handleUseTemplate = (template: SiteTemplate) => {
    router.push(`/admin/sites/new?template=${template.slug}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-6">
            <Skeleton className="h-10 w-40 mb-4" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <div className="aspect-video">
                  <Skeleton className="w-full h-full" />
                </div>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Templates</h1>
              <p className="text-gray-600">
                Manage and preview available site templates
              </p>
            </div>
            
            <Button onClick={() => router.push('/admin/sites/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Site
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Templates Grid */}
        {templates.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">No templates available</div>
            <p className="text-gray-400 text-sm">
              Templates will appear here once they are created.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card 
                key={template.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                {/* Template Preview */}
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                  {template.preview_image_url ? (
                    <img
                      src={template.preview_image_url}
                      alt={`${template.name} preview`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Palette className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <div className="text-sm text-gray-500">Preview Coming Soon</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {template.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  
                  {/* Preview Button Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {templateCategoryLabels[template.category] || template.category}
                      </Badge>
                    </div>
                  </div>
                  
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Template Info */}
                  <div className="space-y-3">
                    {/* Configuration Preview */}
                    {template.template_config && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ 
                            backgroundColor: template.template_config.primary_color || '#22c55e' 
                          }}
                        />
                        <span className="text-xs text-gray-600">
                          {template.template_config.font_family || 'Inter'} • {template.template_config.layout_style || 'Modern'}
                        </span>
                      </div>
                    )}

                    {/* Content Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Popular</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>5 min setup</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      
                      {template.is_active && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUseTemplate(template)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Use Template
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Template Stats */}
        {templates.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {templates.length}
                </div>
                <div className="text-sm text-gray-600">Total Templates</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {templates.filter(t => t.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Active Templates</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(templates.map(t => t.category)).size}
                </div>
                <div className="text-sm text-gray-600">Categories</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}