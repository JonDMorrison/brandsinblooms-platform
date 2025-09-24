'use client'

import { PageContent, LegacyContent, isPageContent, LayoutType } from '@/src/lib/content/schema'
import { DynamicSection } from '@/src/components/preview/DynamicSection'
import { getLayoutSections, getSpacingClass } from '@/src/lib/preview/section-renderers'
import { SiteThemeProvider, ThemeWrapper, useSiteThemeContext } from '@/src/components/theme/ThemeProvider'

interface UnifiedPagePreviewProps {
  layout: LayoutType
  content?: PageContent | LegacyContent
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
  title?: string
  subtitle?: string
}

function UnifiedPagePreviewContent({
  layout,
  content,
  onContentUpdate,
  onFeatureUpdate,
  title,
  subtitle
}: UnifiedPagePreviewProps) {
  const { theme } = useSiteThemeContext()

  // Determine if we have enhanced content or need to use legacy format
  const isEnhanced = content && isPageContent(content)

  if (isEnhanced) {
    // Render with enhanced content structure
    const sections = getLayoutSections(content.sections, layout)
    const spacingClass = getSpacingClass(content.settings?.layout?.spacing)

    return (
      <div
        className={`w-full h-full ${spacingClass}`}
        style={{
          backgroundColor: 'var(--theme-background, #FFFFFF)'
        }}>
          {sections.map(({ key, section }) => (
            <DynamicSection
              key={key}
              section={section}
              sectionKey={key}
              className=""
              title={title}
              onContentUpdate={onContentUpdate}
              onFeatureUpdate={onFeatureUpdate}
            />
          ))}
      </div>
    )
  }

  // Generic empty state for any layout type
  const layoutDisplayName = layout.charAt(0).toUpperCase() + layout.slice(1)

  return (
    <div
      className="w-full min-h-full flex items-center justify-center"
      style={{
        backgroundColor: 'var(--theme-background, #FFFFFF)'
      }}>
        <div
          className="text-center"
          style={{
            color: 'var(--theme-text-muted, #9CA3AF)'
          }}>
          <h3
            className="text-xl font-semibold mb-2"
            style={{
              color: 'var(--theme-text, #1F2937)',
              fontFamily: 'var(--theme-font-heading, inherit)'
            }}>
            {layoutDisplayName} Page Preview
          </h3>
          <p
            style={{
              fontFamily: 'var(--theme-font-body, inherit)'
            }}>
            Add content to see your {layout} page design
          </p>
        </div>
    </div>
  )
}

export function UnifiedPagePreview(props: UnifiedPagePreviewProps) {
  return (
    <SiteThemeProvider>
      <ThemeWrapper className="w-full min-h-full">
        <UnifiedPagePreviewContent {...props} />
      </ThemeWrapper>
    </SiteThemeProvider>
  )
}