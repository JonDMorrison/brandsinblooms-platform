'use client';

import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Star, ArrowRight, Flower, Leaf, TreePine } from 'lucide-react'
import { PageContent, LegacyContent, isPageContent, ContentSection } from '@/src/lib/content/schema'
import { DynamicSection } from '@/src/components/preview/DynamicSection'
import { getLayoutSections, convertLegacyContent, getSpacingClass } from '@/src/lib/preview/section-renderers'
import { InlineTextEditor } from '@/components/content-editor/InlineTextEditor'
import { useIsInlineEditEnabled } from '@/contexts/EditModeContext'
import React, { memo, useCallback } from 'react'
import { SiteThemeProvider, ThemeWrapper } from '@/components/theme/ThemeProvider'
import { useSiteTheme } from '@/hooks/useSiteTheme'
import { PlantProductImage, CareGuideImage } from '@/src/components/ui/plant-shop-image'

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
                fontFamily: `${theme?.typography?.headingFont || 'Inter'}, system-ui, sans-serif`
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
              fontFamily: `${theme?.typography?.bodyFont || 'Inter'}, system-ui, sans-serif`
            }}
            placeholder="Enter subtitle..."
          />
          
          {/* Render additional content if present (but avoid duplicating title/subtitle) */}
          {sectionData.content && 
           typeof sectionData.content === 'string' &&
           sectionData.content !== '' &&
           sectionData.content !== title &&
           sectionData.content !== 'Welcome to Dev Site' ? (
            <InlineTextEditor
              content={sectionData.content}
              onUpdate={(value) => handleSectionUpdate(key, 'content', value)}
              isEnabled={isInlineEditEnabled && !!onContentChange}
              fieldPath={`sections.${key}.data.content`}
              format="rich"
              className="text-lg text-gray-700"
              placeholder="Enter additional content..."
            />
          ) : null}
          
          {/* Render buttons from items array */}
          {sectionData.items && Array.isArray(sectionData.items) && sectionData.items.length > 0 && (
            <div className="flex justify-center gap-4 flex-wrap mt-6">
              {sectionData.items.slice(0, 2).map((item: any, index: number) => {
                if (!item || !item.title) return null;
                const isFirst = index === 0;
                return (
                  <Button 
                    key={item.id || index} 
                    variant={isFirst ? 'default' : 'outline'}
                    style={isFirst ? {
                      backgroundColor: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)',
                      color: 'white'
                    } : {}}
                  >
                    {item.title}
                  </Button>
                );
              })}
            </div>
          )}
          
          {/* Legacy CTA button support */}
          {sectionData.ctaText && !sectionData.items ? (
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
          backgroundColor: theme?.colors?.background || '#FFFFFF',
          backgroundImage: theme?.colors?.primary && theme?.colors?.secondary 
            ? `linear-gradient(to bottom right, ${theme.colors.primary}33, ${theme.colors.secondary}33)`
            : undefined
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
        className="w-full min-h-full p-6 space-y-8"
        style={{
          backgroundColor: theme?.colors?.background || '#FFFFFF',
          backgroundImage: theme?.colors?.primary && theme?.colors?.secondary 
            ? `linear-gradient(to bottom right, ${theme.colors.primary}33, ${theme.colors.secondary}33)`
            : undefined
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
              fontFamily: `${theme?.typography?.headingFont || 'Inter'}, system-ui, sans-serif`
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
              fontFamily: `${theme?.typography?.bodyFont || 'Inter'}, system-ui, sans-serif`
            }}
            placeholder="Enter subtitle..."
          />
        </div>
        
        {/* Featured plants section for plant shop */}
        <div className="space-y-6">
          <h2 
            className="text-2xl font-bold text-center"
            style={{ 
              color: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)',
              fontFamily: `${theme?.typography?.headingFont || 'Inter'}, system-ui, sans-serif`
            }}
          >
            Featured Plants
          </h2>
          
          <div 
            className="grid gap-6"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))'
            }}
          >
            {[
              { 
                title: 'Peace Lily', 
                desc: 'Beautiful flowering plant perfect for beginners',
                type: 'flower' as const,
                plantInfo: {
                  commonName: 'Peace Lily',
                  scientificName: 'Spathiphyllum wallisii',
                  careDifficulty: 'beginner' as const,
                  lightRequirement: 'medium' as const,
                  waterFrequency: 'medium' as const,
                  petSafe: false,
                  size: 'medium' as const
                },
                imageSrc: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80'
              },
              { 
                title: 'Rubber Tree', 
                desc: 'Glossy leaves and easy care make this a favorite',
                type: 'tree' as const,
                plantInfo: {
                  commonName: 'Rubber Tree',
                  scientificName: 'Ficus elastica',
                  careDifficulty: 'beginner' as const,
                  lightRequirement: 'bright' as const,
                  waterFrequency: 'low' as const,
                  petSafe: false,
                  size: 'large' as const
                },
                imageSrc: 'https://images.unsplash.com/photo-1545484331-0b8cfee2f5b8?auto=format&fit=crop&w=400&q=80'
              },
              { 
                title: 'Snake Plant', 
                desc: 'Low maintenance succulent for any space',
                type: 'succulent' as const,
                plantInfo: {
                  commonName: 'Snake Plant',
                  scientificName: 'Sansevieria trifasciata',
                  careDifficulty: 'beginner' as const,
                  lightRequirement: 'low' as const,
                  waterFrequency: 'low' as const,
                  petSafe: false,
                  size: 'medium' as const
                },
                imageSrc: 'https://images.unsplash.com/photo-1593482892540-3b8a94b2e019?auto=format&fit=crop&w=400&q=80'
              }
            ].map((plant, i) => (
              <Card key={i} className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-shadow">
                <div className="aspect-[4/3] relative">
                  <PlantProductImage
                    src={plant.imageSrc}
                    alt={`${plant.title} - ${plant.desc}`}
                    plantType={plant.type}
                    plantInfo={plant.plantInfo}
                    width={400}
                    height={300}
                    className="w-full min-h-full"
                    priority={i === 0} // First image has priority
                    isFeatured={true}
                    showCareIndicators={true}
                  />
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {plant.type === 'flower' && <Flower className="h-4 w-4 text-pink-500" />}
                    {plant.type === 'tree' && <TreePine className="h-4 w-4 text-green-600" />}
                    {plant.type === 'succulent' && <Leaf className="h-4 w-4 text-green-500" />}
                    <h3 
                      className="font-semibold"
                      style={{ 
                        color: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)',
                        fontFamily: `${theme?.typography?.headingFont || 'Inter'}, system-ui, sans-serif`
                      }}
                    >
                      {plant.title}
                    </h3>
                  </div>
                  
                  <p 
                    className="text-sm"
                    style={{ 
                      color: theme?.colors?.text || 'var(--theme-text, #666666)',
                      fontFamily: `${theme?.typography?.bodyFont || 'Inter'}, system-ui, sans-serif`
                    }}
                  >
                    {plant.desc}
                  </p>
                  
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {plant.plantInfo.careDifficulty} friendly
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {plant.plantInfo.lightRequirement} light
                    </span>
                  </div>
                  
                  <Button
                    className="w-full mt-3"
                    variant="outline"
                    style={{
                      borderColor: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)',
                      color: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)'
                    }}
                  >
                    Learn More
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Plant care guide section */}
        <div className="space-y-6">
          <h2 
            className="text-2xl font-bold text-center"
            style={{ 
              color: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)',
              fontFamily: `${theme?.typography?.headingFont || 'Inter'}, system-ui, sans-serif`
            }}
          >
            Plant Care Made Easy
          </h2>
          
          <div 
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))'
            }}
          >
            {[
              { 
                title: 'Watering Guide', 
                desc: 'Learn when and how to water your plants',
                icon: '💧',
                careType: 'watering'
              },
              { 
                title: 'Light Requirements', 
                desc: 'Find the perfect spot for your green friends',
                icon: '☀️',
                careType: 'lighting'
              },
              { 
                title: 'Plant Food', 
                desc: 'Nutrition tips for healthy growth',
                icon: '🌱',
                careType: 'feeding'
              }
            ].map((guide, i) => (
              <Card key={i} className="p-4 text-center bg-white border-gray-200 hover:shadow-md transition-shadow">
                <div className="aspect-square relative mb-3 overflow-hidden rounded-lg">
                  <CareGuideImage
                    src={`https://images.unsplash.com/photo-${['1416879595882-3373a0480b5b', '1545484331-0b8cfee2f5b8', '1593482892540-3b8a94b2e019'][i]}?auto=format&fit=crop&w=200&q=80`}
                    alt={`${guide.title} care guide`}
                    careGuideType={guide.careType}
                    width={200}
                    height={200}
                    className="w-full min-h-full"
                    loading="lazy"
                  />
                </div>
                
                <div className="text-2xl mb-2" aria-hidden="true">
                  {guide.icon}
                </div>
                
                <h3 
                  className="font-semibold mb-2"
                  style={{ 
                    color: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)',
                    fontFamily: `${theme?.typography?.headingFont || 'Inter'}, system-ui, sans-serif`
                  }}
                >
                  {guide.title}
                </h3>
                <p 
                  className="text-sm"
                  style={{ 
                    color: theme?.colors?.text || 'var(--theme-text, #666666)',
                    fontFamily: `${theme?.typography?.bodyFont || 'Inter'}, system-ui, sans-serif`
                  }}
                >
                  {guide.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Default call to action for legacy content */}
        <div className="text-center bg-white border border-gray-200 rounded-lg p-6">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ 
              color: theme?.colors?.primary || 'var(--theme-primary, #8B5CF6)',
              fontFamily: `${theme?.typography?.headingFont || 'Inter'}, system-ui, sans-serif`
            }}
          >
            Ready to Get Started?
          </h2>
          <p 
            className="mb-4"
            style={{ 
              color: theme?.colors?.text || 'var(--theme-text, #666666)',
              fontFamily: `${theme?.typography?.bodyFont || 'Inter'}, system-ui, sans-serif`
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
      className="w-full min-h-full p-6 flex items-center justify-center"
      style={{
        backgroundColor: theme?.colors?.background || 'var(--theme-background, #FFFFFF)',
        background: theme?.colors?.primary && theme?.colors?.secondary 
          ? `linear-gradient(to bottom right, ${theme.colors.primary}33, ${theme.colors.secondary}33)`
          : undefined
      }}
    >
      <div className="text-center">
        <h3 
          className="text-xl font-semibold mb-2"
          style={{ 
            color: theme?.colors?.text || 'var(--theme-text, #666666)',
            fontFamily: `${theme?.typography?.headingFont || 'Inter'}, system-ui, sans-serif`
          }}
        >
          Landing Page Preview
        </h3>
        <p
          style={{ 
            color: theme?.colors?.text || 'var(--theme-text, #666666)',
            fontFamily: `${theme?.typography?.bodyFont || 'Inter'}, system-ui, sans-serif`
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
      <ThemeWrapper className="w-full min-h-full">
        <EditableLandingPagePreviewContent {...props} />
      </ThemeWrapper>
    </SiteThemeProvider>
  )
})