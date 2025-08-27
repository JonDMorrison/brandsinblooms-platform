'use client';

import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Star, ArrowRight } from 'lucide-react'
import { PageContent, LegacyContent, isPageContent, ContentSection } from '@/src/lib/content/schema'
import { DynamicSection } from '@/src/components/preview/DynamicSection'
import { getLayoutSections, convertLegacyContent, getSpacingClass } from '@/src/lib/preview/section-renderers'
import { InlineTextEditor } from '@/components/content-editor/InlineTextEditor'
import { useIsInlineEditEnabled } from '@/contexts/EditModeContext'
import React, { memo, useCallback } from 'react'
import { SiteThemeProvider, ThemeWrapper } from '@/components/theme/ThemeProvider'
import { useSiteTheme } from '@/hooks/useSiteTheme'

interface EditableLandingPagePreviewProps {
  title?: string
  subtitle?: string
  content?: PageContent | LegacyContent
  onContentChange?: (content: PageContent | LegacyContent) => void
  onTitleChange?: (title: string) => void
  onSubtitleChange?: (subtitle: string) => void
}

const EditableLandingPagePreviewContent = memo(function EditableLandingPagePreviewContent({ 
  title, 
  subtitle, 
  content,
  onContentChange,
  onTitleChange,
  onSubtitleChange
}: EditableLandingPagePreviewProps) {
  const isInlineEditEnabled = useIsInlineEditEnabled();
  const { theme } = useSiteTheme();
  
  // Handle section updates for enhanced content
  const handleSectionUpdate = useCallback((sectionKey: string, field: string, value: string) => {
    if (!content || !onContentChange || !isPageContent(content)) return;
    
    const updatedContent: PageContent = {
      ...content,
      sections: {
        ...content.sections,
        [sectionKey]: {
          ...content.sections[sectionKey],
          data: {
            ...content.sections[sectionKey].data,
            [field]: value
          }
        }
      }
    };
    
    onContentChange(updatedContent);
  }, [content, onContentChange]);
  
  // Render enhanced section with inline editing
  const renderEditableSection = useCallback((key: string, section: ContentSection) => {
    // For hero/header sections, we need special handling for title/subtitle
    if ((key === 'hero' || key === 'header') && section.data) {
      const sectionData = section.data as Record<string, unknown>;
      
      return (
        <div className="text-center space-y-4 py-12">
          {(title || sectionData.title) ? (
            <InlineTextEditor
              content={title || String(sectionData.title || '')}
              onUpdate={onTitleChange || ((value) => handleSectionUpdate(key, 'title', value))}
              isEnabled={isInlineEditEnabled && (!!onTitleChange || !!onContentChange)}
              fieldPath={`sections.${key}.data.title`}
              format="plain"
              className="text-4xl font-bold"
              style={{ 
                color: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)',
                fontFamily: theme?.typography?.headingFont || 'var(--theme-font-heading, Inter)'
              }}
              placeholder="Enter page title..."
            />
          ) : null}
          
          <InlineTextEditor
            content={subtitle || String(sectionData.subtitle || '')}
            onUpdate={onSubtitleChange || ((value) => handleSectionUpdate(key, 'subtitle', value))}
            isEnabled={isInlineEditEnabled && (!!onSubtitleChange || !!onContentChange)}
            fieldPath={`sections.${key}.data.subtitle`}
            format="plain"
            className="text-xl"
            style={{ 
              color: theme?.colors?.text || 'var(--theme-text, #666666)',
              fontFamily: theme?.typography?.bodyFont || 'var(--theme-font-body, Inter)'
            }}
            placeholder="Enter subtitle..."
          />
          
          {sectionData.ctaText ? (
            <Button 
              className="mt-4"
              style={{
                backgroundColor: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)',
                color: 'white'
              }}
            >
              {String(sectionData.ctaText)}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : null}
        </div>
      );
    }
    
    // For other sections, use the standard DynamicSection
    return (
      <DynamicSection
        key={key}
        section={section}
        sectionKey={key}
        className=""
      />
    );
  }, [title, subtitle, isInlineEditEnabled, onTitleChange, onSubtitleChange, onContentChange, handleSectionUpdate]);
  
  // Determine if we have enhanced content or need to use legacy format
  const isEnhanced = content && isPageContent(content)
  
  if (isEnhanced) {
    // Render with enhanced content structure
    const sections = getLayoutSections(content.sections, 'landing')
    const spacingClass = getSpacingClass(content.settings?.layout?.spacing)
    
    return (
      <div 
        className={`w-full h-full p-6 ${spacingClass}`}
        style={{
          backgroundColor: theme?.colors?.background || 'var(--theme-background, #FFFFFF)',
          background: theme?.colors?.background ? undefined : 'linear-gradient(to bottom right, rgba(239, 246, 255, 0.5), rgba(243, 232, 255, 0.5))'
        }}
      >
        {sections.map(({ key, section }) => (
          <React.Fragment key={key}>
            {renderEditableSection(key, section)}
          </React.Fragment>
        ))}
      </div>
    )
  }
  
  // Fallback to legacy format with inline editing support
  const legacyTitle = title || (content && 'title' in content ? content.title : '') || ''
  const legacySubtitle = subtitle || (content && 'subtitle' in content ? content.subtitle : '') || ''
  
  if (legacyTitle || legacySubtitle) {
    return (
      <div 
        className="w-full h-full p-6 space-y-8"
        style={{
          backgroundColor: theme?.colors?.background || 'var(--theme-background, #FFFFFF)',
          background: theme?.colors?.background ? undefined : 'linear-gradient(to bottom right, rgba(239, 246, 255, 0.5), rgba(243, 232, 255, 0.5))'
        }}
      >
        {/* Editable Hero Section */}
        <div className="text-center space-y-4 py-12">
          <InlineTextEditor
            content={legacyTitle}
            onUpdate={onTitleChange || (() => {})}
            isEnabled={isInlineEditEnabled && !!onTitleChange}
            fieldPath="title"
            format="plain"
            className="text-4xl font-bold"
            style={{ 
              color: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)',
              fontFamily: theme?.typography?.headingFont || 'var(--theme-font-heading, Inter)'
            }}
            placeholder="Enter page title..."
          />
          
          <InlineTextEditor
            content={legacySubtitle}
            onUpdate={onSubtitleChange || (() => {})}
            isEnabled={isInlineEditEnabled && !!onSubtitleChange}
            fieldPath="subtitle"
            format="plain"
            className="text-xl"
            style={{ 
              color: theme?.colors?.text || 'var(--theme-text, #666666)',
              fontFamily: theme?.typography?.bodyFont || 'var(--theme-font-body, Inter)'
            }}
            placeholder="Enter subtitle..."
          />
        </div>
        
        {/* Default features for legacy content */}
        <div 
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))'
          }}
        >
          {[
            { title: 'Feature One', desc: 'Amazing capability' },
            { title: 'Feature Two', desc: 'Powerful tools' },
            { title: 'Feature Three', desc: 'Easy to use' }
          ].map((feature, i) => (
            <Card key={i} className="p-4 text-center bg-white border-gray-200">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{
                  backgroundColor: theme?.colors?.accent ? `${theme.colors.accent}20` : 'var(--theme-accent, #F59E0B)20'
                }}
              >
                <Star 
                  className="h-6 w-6" 
                  style={{ color: theme?.colors?.accent || 'var(--theme-accent, #F59E0B)' }}
                />
              </div>
              <h3 
                className="font-semibold mb-2"
                style={{ 
                  color: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)',
                  fontFamily: theme?.typography?.headingFont || 'var(--theme-font-heading, Inter)'
                }}
              >
                {feature.title}
              </h3>
              <p 
                className="text-sm"
                style={{ 
                  color: theme?.colors?.text || 'var(--theme-text, #666666)',
                  fontFamily: theme?.typography?.bodyFont || 'var(--theme-font-body, Inter)'
                }}
              >
                {feature.desc}
              </p>
            </Card>
          ))}
        </div>

        {/* Default call to action for legacy content */}
        <div className="text-center bg-white border border-gray-200 rounded-lg p-6">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ 
              color: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)',
              fontFamily: theme?.typography?.headingFont || 'var(--theme-font-heading, Inter)'
            }}
          >
            Ready to Get Started?
          </h2>
          <p 
            className="mb-4"
            style={{ 
              color: theme?.colors?.text || 'var(--theme-text, #666666)',
              fontFamily: theme?.typography?.bodyFont || 'var(--theme-font-body, Inter)'
            }}
          >
            Join thousands of satisfied customers
          </p>
          <Button
            style={{
              backgroundColor: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)',
              color: 'white'
            }}
          >
            Start Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }
  
  // Empty state
  return (
    <div 
      className="w-full h-full p-6 flex items-center justify-center"
      style={{
        backgroundColor: theme?.colors?.background || 'var(--theme-background, #FFFFFF)',
        background: theme?.colors?.background ? undefined : 'linear-gradient(to bottom right, rgba(239, 246, 255, 0.5), rgba(243, 232, 255, 0.5))'
      }}
    >
      <div className="text-center">
        <h3 
          className="text-xl font-semibold mb-2"
          style={{ 
            color: theme?.colors?.text || 'var(--theme-text, #666666)',
            fontFamily: theme?.typography?.headingFont || 'var(--theme-font-heading, Inter)'
          }}
        >
          Landing Page Preview
        </h3>
        <p
          style={{ 
            color: theme?.colors?.text || 'var(--theme-text, #666666)',
            fontFamily: theme?.typography?.bodyFont || 'var(--theme-font-body, Inter)'
          }}
        >
          Add content to see your landing page design
        </p>
      </div>
    </div>
  )
})

// Export wrapped component with theme provider
export const EditableLandingPagePreview = memo(function EditableLandingPagePreview(props: EditableLandingPagePreviewProps) {
  return (
    <SiteThemeProvider>
      <ThemeWrapper className="w-full h-full">
        <EditableLandingPagePreviewContent {...props} />
      </ThemeWrapper>
    </SiteThemeProvider>
  )
})