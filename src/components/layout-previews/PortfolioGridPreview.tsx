import { Card } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Filter, Search, Eye } from 'lucide-react'
import { PageContent, LegacyContent, isPageContent } from '@/src/lib/content/schema'
import { DynamicSection } from '@/src/components/preview/DynamicSection'
import { getLayoutSections, convertLegacyContent, getSpacingClass } from '@/src/lib/preview/section-renderers'

interface PortfolioGridPreviewProps {
  title?: string
  subtitle?: string
  content?: PageContent | LegacyContent
}

export function PortfolioGridPreview({ title, subtitle, content }: PortfolioGridPreviewProps) {
  // Determine if we have enhanced content or need to use legacy format
  const isEnhanced = content && isPageContent(content)
  
  if (isEnhanced) {
    // Render with enhanced content structure
    const sections = getLayoutSections(content.sections, 'portfolio')
    const spacingClass = getSpacingClass(content.settings?.layout?.spacing)
    
    return (
      <div className={`w-full h-full bg-gray-50 p-6 ${spacingClass}`}>
        {sections.map(({ key, section }) => {
          // Special handling for portfolio header section
          if (key === 'header' || section.type === 'hero') {
            return (
              <div key={key} className="text-center space-y-4">
                <DynamicSection
                  section={section}
                  sectionKey={key}
                  className=""
                />
              </div>
            )
          }
          
          // Special handling for gallery section
          if (key === 'gallery' && section.type === 'gallery') {
            return (
              <div key={key} className="space-y-6">
                {/* Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      All Categories
                    </Button>
                    <Badge variant="secondary">Portfolio</Badge>
                    <Badge variant="outline">Gallery</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <DynamicSection
                  section={section}
                  sectionKey={key}
                  className=""
                />
              </div>
            )
          }
          
          // Default section rendering
          return (
            <DynamicSection
              key={key}
              section={section}
              sectionKey={key}
              className=""
            />
          )
        })}
      </div>
    )
  }
  
  // Fallback to legacy format or convert legacy content
  const legacyTitle = title || (content && 'title' in content ? content.title : '') || ''
  const legacySubtitle = subtitle || (content && 'subtitle' in content ? content.subtitle : '') || ''
  
  if (legacyTitle || legacySubtitle) {
    return (
      <div className="w-full h-full bg-gray-50 p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{legacyTitle}</h1>
          {legacySubtitle && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{legacySubtitle}</p>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              All Categories
            </Button>
            <Badge variant="secondary">Portfolio</Badge>
            <Badge variant="outline">Gallery</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Default Portfolio Grid */}
        <div 
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))'
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden group cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">Portfolio Item {i + 1}</span>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-white/90 text-gray-900">Sample</Badge>
                </div>
              </div>
              <div className="p-4 bg-white">
                <h3 className="font-semibold mb-1 text-gray-900">Portfolio Project {i + 1}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Add your portfolio items using the content editor
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{new Date().toLocaleDateString()}</span>
                  <span>Sample Work</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Description section */}
        {content && 'content' in content && content.content && (
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-gray-600 leading-relaxed">{content.content}</p>
          </div>
        )}
      </div>
    )
  }
  
  // Empty state
  return (
    <div className="w-full h-full bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <h3 className="text-xl font-semibold mb-2">Portfolio Preview</h3>
        <p>Add content to see your portfolio gallery design</p>
      </div>
    </div>
  )
}