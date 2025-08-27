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

interface EditableLandingPagePreviewProps {
  title?: string
  subtitle?: string
  content?: PageContent | LegacyContent
  onContentChange?: (content: PageContent | LegacyContent) => void
  onTitleChange?: (title: string) => void
  onSubtitleChange?: (subtitle: string) => void
}

export const EditableLandingPagePreview = memo(function EditableLandingPagePreview({ 
  title, 
  subtitle, 
  content,
  onContentChange,
  onTitleChange,
  onSubtitleChange
}: EditableLandingPagePreviewProps) {
  const isInlineEditEnabled = useIsInlineEditEnabled();
  
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
              className="text-4xl font-bold text-gray-900"
              placeholder="Enter page title..."
            />
          ) : null}
          
          {(subtitle || sectionData.subtitle) ? (
            <InlineTextEditor
              content={subtitle || String(sectionData.subtitle || '')}
              onUpdate={onSubtitleChange || ((value) => handleSectionUpdate(key, 'subtitle', value))}
              isEnabled={isInlineEditEnabled && (!!onSubtitleChange || !!onContentChange)}
              fieldPath={`sections.${key}.data.subtitle`}
              format="plain"
              className="text-xl text-gray-600"
              placeholder="Enter subtitle..."
            />
          ) : null}
          
          {sectionData.ctaText ? (
            <Button className="mt-4">
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
      <div className={`w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 p-6 ${spacingClass}`}>
        {sections.map(({ key, section }) => renderEditableSection(key, section))}
      </div>
    )
  }
  
  // Fallback to legacy format with inline editing support
  const legacyTitle = title || (content && 'title' in content ? content.title : '') || ''
  const legacySubtitle = subtitle || (content && 'subtitle' in content ? content.subtitle : '') || ''
  
  if (legacyTitle || legacySubtitle) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 p-6 space-y-8">
        {/* Editable Hero Section */}
        <div className="text-center space-y-4 py-12">
          <InlineTextEditor
            content={legacyTitle}
            onUpdate={onTitleChange || (() => {})}
            isEnabled={isInlineEditEnabled && !!onTitleChange}
            fieldPath="title"
            format="plain"
            className="text-4xl font-bold text-gray-900"
            placeholder="Enter page title..."
          />
          
          <InlineTextEditor
            content={legacySubtitle}
            onUpdate={onSubtitleChange || (() => {})}
            isEnabled={isInlineEditEnabled && !!onSubtitleChange}
            fieldPath="subtitle"
            format="plain"
            className="text-xl text-gray-600"
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
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </Card>
          ))}
        </div>

        {/* Default call to action for legacy content */}
        <div className="text-center bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-4">Join thousands of satisfied customers</p>
          <Button>
            Start Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }
  
  // Empty state
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <h3 className="text-xl font-semibold mb-2">Landing Page Preview</h3>
        <p>Add content to see your landing page design</p>
      </div>
    </div>
  )
})