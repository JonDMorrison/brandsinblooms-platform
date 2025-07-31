'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge' 
import { Button } from '@/src/components/ui/button'
import { Skeleton } from '@/src/components/ui/skeleton'
import { CheckCircle, Eye, Palette, Users, Clock } from 'lucide-react'
import { getSiteTemplates, type SiteTemplate } from '@/src/lib/admin/sites'

interface TemplateSelectorProps {
  selectedTemplate?: string
  onTemplateSelect: (template: SiteTemplate) => void
  category?: string
  className?: string
}

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

const templateFeatures: Record<string, string[]> = {
  'garden-center-basic': [
    'Product showcase',
    'Service pages',
    'Contact forms',
    'Business hours',
    'Mobile responsive'
  ],
  'plant-nursery-professional': [
    'Wholesale catalog',
    'Growing guides',
    'Bulk ordering',
    'Professional layout',
    'Native plant focus'
  ]
}

export function TemplateSelector({ 
  selectedTemplate, 
  onTemplateSelect, 
  category,
  className 
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<SiteTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<SiteTemplate | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        const fetchedTemplates = await getSiteTemplates(category, true)
        setTemplates(fetchedTemplates)
        setError(null)
      } catch (err) {
        console.error('Error fetching templates:', err)
        setError('Failed to load templates. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [category])

  const handleTemplateSelect = (template: SiteTemplate) => {
    onTemplateSelect(template)
  }

  const handlePreview = (template: SiteTemplate) => {
    setPreviewTemplate(template)
    // In a real implementation, this would open a modal or navigate to a preview page
    console.log('Preview template:', template.slug)
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
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
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading templates</div>
          <p className="text-gray-600 text-sm">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="text-gray-500 mb-2">No templates available</div>
          <p className="text-gray-400 text-sm">
            {category 
              ? `No templates found in the ${templateCategoryLabels[category] || category} category.`
              : 'No templates are currently available.'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.slug
          const features = templateFeatures[template.slug] || []
          
          return (
            <Card 
              key={template.id} 
              className={`overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer ${
                isSelected 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              {/* Template Preview Image */}
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
                
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-6 h-6 text-white bg-blue-500 rounded-full" />
                  </div>
                )}
                
                {/* Preview Button */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePreview(template)
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-xs">
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
                {/* Template Features */}
                {features.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Features
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Template Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-3 border-t">
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
                  
                  {isSelected && (
                    <Badge variant="default" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </div>

                {/* Template Configuration Preview */}
                {template.template_config && (
                  <div className="mt-3 pt-3 border-t">
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
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Selected Template Info */}
      {selectedTemplate && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              {templates.find(t => t.slug === selectedTemplate)?.name} Selected
            </span>
          </div>
          <p className="text-blue-600 text-sm mt-1">
            This template will be used to create your new site with default content and styling.
          </p>
        </div>
      )}
    </div>
  )
}