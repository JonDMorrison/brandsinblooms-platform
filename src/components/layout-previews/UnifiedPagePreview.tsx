'use client'

import { PageContent, LegacyContent, isPageContent, isLegacyContent, LayoutType } from '@/src/lib/content/schema'
import { DynamicSection } from '@/src/components/preview/DynamicSection'
import { getLayoutSections, getSpacingClass, convertLegacyContent } from '@/src/lib/preview/section-renderers'
import { SiteThemeProvider, ThemeWrapper, useSiteThemeContext } from '@/src/components/theme/ThemeProvider'
import { Plus } from 'lucide-react'
import React from 'react'

interface AddSectionButtonProps {
  onClick: () => void
  label?: string
}

function AddSectionButton({ onClick, label = "Add Block" }: AddSectionButtonProps) {
  return (
    <div className="group relative h-4 w-full flex items-center justify-center hover:z-50">
      {/* Line */}
      <div className="absolute inset-x-0 h-px bg-primary/0 group-hover:bg-primary/50 transition-colors" />

      {/* Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        className="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all shadow-sm hover:shadow-md"
      >
        <Plus className="w-3 h-3" />
        {label}
      </button>
    </div>
  )
}

interface UnifiedPagePreviewProps {
  layout: LayoutType
  content?: PageContent | LegacyContent
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
  onValueUpdate?: (sectionKey: string, valueIndex: number, fieldPath: string, newContent: string) => void
  onCategoryUpdate?: (sectionKey: string, categoryIndex: number, updatedCategory: Record<string, unknown>) => void
  onCategoryDelete?: (sectionKey: string, categoryIndex: number) => void
  onFeaturedUpdate?: (sectionKey: string, itemIndex: number, updatedItem: Record<string, unknown>) => void
  onFeaturedDelete?: (sectionKey: string, itemIndex: number) => void
  onFAQUpdate?: (sectionKey: string, faqIndex: number, updatedFAQ: Record<string, unknown>) => void
  onFAQDelete?: (sectionKey: string, faqIndex: number) => void
  title?: string
  subtitle?: string
  onAddSection?: (index: number) => void
}

function UnifiedPagePreviewContent({
  layout,
  content,
  onContentUpdate,
  onFeatureUpdate,
  onValueUpdate,
  onCategoryUpdate,
  onCategoryDelete,
  onFeaturedUpdate,
  onFeaturedDelete,
  onFAQUpdate,
  onFAQDelete,
  title,
  subtitle,
  onAddSection
}: UnifiedPagePreviewProps) {
  const { theme } = useSiteThemeContext()

  // Determine if we have enhanced content or need to use legacy format
  const isEnhanced = content && isPageContent(content)
  const isLegacy = content && isLegacyContent(content)

  if (isEnhanced || isLegacy) {
    // Render with enhanced content structure (converting legacy if needed)
    let sectionsList = isEnhanced ? content.sections : convertLegacyContent(layout, content?.title, content?.subtitle)

    const sections = getLayoutSections(sectionsList, layout)
    const spacingClass = getSpacingClass(isEnhanced ? content.settings?.layout?.spacing : 'normal')

    return (
      <div
        className={`w-full h-full ${spacingClass} relative`}
        style={{
          backgroundColor: 'var(--theme-background, #FFFFFF)'
        }}>

        {/* Add button at the very top */}
        {onAddSection && (
          <AddSectionButton onClick={() => onAddSection(0)} label="Add Section to Top" />
        )}

        {sections.map(({ key, section }, index) => (
          <React.Fragment key={key}>
            <DynamicSection
              section={section}
              sectionKey={key}
              className=""
              title={title}
              onContentUpdate={onContentUpdate}
              onFeatureUpdate={onFeatureUpdate}
              onValueUpdate={onValueUpdate}
              onCategoryUpdate={onCategoryUpdate}
              onCategoryDelete={onCategoryDelete}
              onFeaturedUpdate={onFeaturedUpdate}
              onFeaturedDelete={onFeaturedDelete}
              onFAQUpdate={onFAQUpdate}
              onFAQDelete={onFAQDelete}
            />

            {/* Add button after each section */}
            {onAddSection && (
              <AddSectionButton onClick={() => onAddSection(index + 1)} />
            )}
          </React.Fragment>
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