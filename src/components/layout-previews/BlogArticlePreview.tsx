import { Card } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Calendar, Clock, User } from 'lucide-react'
import { PageContent, LegacyContent, isPageContent } from '@/src/lib/content/schema'
import { DynamicSection } from '@/src/components/preview/DynamicSection'
import { getLayoutSections, convertLegacyContent, getSpacingClass } from '@/src/lib/preview/section-renderers'

interface BlogArticlePreviewProps {
  title?: string
  subtitle?: string
  content?: PageContent | LegacyContent
}

export function BlogArticlePreview({ title, subtitle, content }: BlogArticlePreviewProps) {
  // Determine if we have enhanced content or need to use legacy format
  const isEnhanced = content && isPageContent(content)
  
  if (isEnhanced) {
    // Render with enhanced content structure
    const sections = getLayoutSections(content.sections, 'blog')
    const spacingClass = getSpacingClass(content.settings?.layout?.spacing)
    
    return (
      <div className={`w-full h-full bg-white p-6 ${spacingClass}`}>
        {sections.map(({ key, section }) => {
          // Special handling for blog header section
          if (key === 'header' || section.type === 'hero') {
            return (
              <div key={key} className="text-center space-y-4 border-b pb-6">
                <div className="flex justify-center gap-2">
                  <Badge>Article</Badge>
                  <Badge variant="outline">Blog</Badge>
                </div>
                <DynamicSection
                  section={section}
                  sectionKey={key}
                  className=""
                />
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date().toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    5 min read
                  </div>
                </div>
              </div>
            )
          }
          
          // Main content area
          if (key === 'content') {
            return (
              <div key={key} className="flex flex-col gap-6">
                <div className="space-y-4">
                  <DynamicSection
                    section={section}
                    sectionKey={key}
                    className=""
                  />
                </div>
              </div>
            )
          }
          
          // Sidebar sections (author, related)
          return (
            <div key={key} className="w-full space-y-4">
              <DynamicSection
                section={section}
                sectionKey={key}
                className=""
              />
            </div>
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
      <div className="w-full h-full bg-white p-6 space-y-6">
        {/* Article Header */}
        <div className="text-center space-y-4 border-b pb-6">
          <div className="flex justify-center gap-2">
            <Badge>Article</Badge>
            <Badge variant="outline">Blog</Badge>
          </div>
          <h1 className="text-3xl font-bold leading-tight text-gray-900">{legacyTitle}</h1>
          {legacySubtitle && (
            <p className="text-lg text-gray-600">{legacySubtitle}</p>
          )}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              5 min read
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-col gap-6">
          {/* Main Content */}
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Featured Image</span>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                {content && 'content' in content && content.content 
                  ? content.content 
                  : 'Your blog article content will appear here. Use the editor to add rich text, images, and formatting to create engaging articles for your readers.'
                }
              </p>
            </div>
          </div>

          {/* Default sidebar for legacy content */}
          <div className="w-full space-y-4">
            {/* Author Bio */}
            <Card className="p-4 bg-white border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <Avatar>
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">Author Name</p>
                  <p className="text-sm text-gray-600">Expert Writer</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Add author information in the content editor to personalize your articles.
              </p>
            </Card>

            {/* Related Posts */}
            <Card className="p-4 bg-white border-gray-200">
              <h3 className="font-semibold mb-3 text-gray-900">Related Articles</h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-500">
                  Related articles will appear here when you create more blog content.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }
  
  // Empty state
  return (
    <div className="w-full h-full bg-white p-6 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <h3 className="text-xl font-semibold mb-2">Blog Article Preview</h3>
        <p>Add content to see your blog article design</p>
      </div>
    </div>
  )
}