'use client'

/**
 * Customer site section renderer
 * Renders sections for live customer sites (no editing capabilities)
 * Maintains exact styling and behavior of hardcoded sections
 */

import React from 'react'
import { ContentSection, ButtonStyleVariant } from '@/src/lib/content/schema'
import { ViewportLazyLoad } from '@/src/components/ui/lazy-loading'
import {
  HeroSectionErrorBoundary,
  FeaturedPlantsErrorBoundary,
  CategoriesSectionErrorBoundary
} from '@/src/components/ui/plant-shop-error-boundaries'
import { MissionStatementSkeleton } from '@/src/components/ui/plant-shop-loading-states'
import { textToHtml } from '@/src/lib/utils/html-text'
import { ContentRenderer } from '@/src/components/preview/ContentRenderer'
import { getSectionBackgroundStyle, getBackgroundImageOpacity } from '@/src/components/content-sections/shared/background-utils'
import { getFeatureGridClasses, getCategoriesGridClasses } from '@/src/components/content-sections/shared/grid-utils'
import { getIcon } from '@/src/components/content-sections/shared/icon-utils'
import { ImageIcon } from 'lucide-react'
import { SmartLink } from '@/src/components/ui/smart-link'
import { FeaturedPreview } from '@/src/components/content-sections/preview/FeaturedPreview'
import { DEFAULT_CATEGORIES } from '@/src/lib/content/default-categories'
import { getButtonStyles, getButtonClassName } from '@/src/lib/utils/button-styles'

interface CustomerSiteSectionProps {
  section: ContentSection
  sectionKey: string
  sectionData: any // The fetched section data
  backgroundSetting?: string
  className?: string
}

export function CustomerSiteSection({ 
  section, 
  sectionKey, 
  sectionData, 
  backgroundSetting = 'default',
  className = '' 
}: CustomerSiteSectionProps) {
  // Don't render if section is not visible or has no data
  if (!section.visible || !sectionData) {
    return null
  }

  const { type } = section
  const backgroundStyle = getSectionBackgroundStyle({ backgroundColor: backgroundSetting })

  switch (type) {
    case 'hero': {
      // Get background style from section settings or use gradient as fallback
      const heroBackgroundStyle = section.settings?.backgroundImage?.url
        ? getSectionBackgroundStyle(section.settings)
        : {background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))'}

      // Get opacity overlay value if image background with opacity < 100
      const imageOpacity = getBackgroundImageOpacity(section.settings)

      return (
        <HeroSectionErrorBoundary>
          <section className={`relative py-20 lg:py-32 ${className}`} style={heroBackgroundStyle}>
            {/* Opacity overlay for image backgrounds */}
            {imageOpacity !== undefined && (
              <div
                className="absolute inset-0 bg-white pointer-events-none"
                style={{ opacity: imageOpacity, zIndex: 1 }}
              />
            )}

            <div className="brand-container relative" style={{ zIndex: 2 }}>
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                  {String(sectionData.headline || 'Welcome to our site')}
                </h1>
                <div
                  className="text-xl md:text-2xl mb-8 leading-relaxed [&_p:not(:first-child)]:mt-2"
                  style={{color: 'var(--theme-text)', opacity: '0.8', fontFamily: 'var(--theme-font-body)'}}
                  dangerouslySetInnerHTML={{
                    __html: textToHtml(String(sectionData.subheadline || 'Your trusted source for premium plants and expert care guidance'))
                  }}
                />
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <SmartLink
                    href={String(sectionData.ctaLink || '/plants')}
                    className={getButtonClassName((sectionData.ctaStyle as ButtonStyleVariant) || 'primary', false)}
                    style={getButtonStyles((sectionData.ctaStyle as ButtonStyleVariant) || 'primary', false)}
                  >
                    {String(sectionData.ctaText || 'Shop Plants')}
                  </SmartLink>
                  {sectionData.secondaryCtaText && (
                    <SmartLink
                      href={String(sectionData.secondaryCtaLink || '/about')}
                      className={getButtonClassName((sectionData.secondaryCtaStyle as ButtonStyleVariant) || 'secondary', false)}
                      style={getButtonStyles((sectionData.secondaryCtaStyle as ButtonStyleVariant) || 'secondary', false)}
                    >
                      {String(sectionData.secondaryCtaText)}
                    </SmartLink>
                  )}
                </div>

                {/* Features Grid */}
                {sectionData.features && Array.isArray(sectionData.features) && sectionData.features.length > 0 && (
                  <div
                    className={`grid gap-6 text-center ${getFeatureGridClasses(sectionData.features.length, false)}`}
                  >
                    {sectionData.features.slice(0, 4).map((feature: any, index: number) => {
                      // Support both string features (legacy) and object features with icons
                      const isObject = typeof feature === 'object' && feature !== null
                      const featureText = isObject
                        ? (feature.text || feature.title || '')
                        : String(feature)
                      const iconName = isObject && feature.icon ? feature.icon : 'Check'
                      const IconComponent = getIcon(iconName)

                      return (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                            style={{ backgroundColor: 'var(--theme-primary)' }}
                          >
                            {IconComponent && <IconComponent className="w-6 h-6 text-white" />}
                          </div>
                          <span
                            className="text-sm font-medium"
                            style={{
                              color: 'var(--theme-text)',
                              fontFamily: 'var(--theme-font-body)'
                            }}
                          >
                            {featureText}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </HeroSectionErrorBoundary>
      )
    }

    case 'header':
      return (
        <section
          className={`py-16 ${className}`}
          style={backgroundSetting === 'gradient'
            ? {background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))'}
            : backgroundStyle
          }
        >
          <div className="brand-container">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                {String(sectionData.headline || '')}
              </h1>
              <div
                className="text-xl leading-relaxed"
                style={{color: 'var(--theme-text)', opacity: '0.8', fontFamily: 'var(--theme-font-body)'}}
                dangerouslySetInnerHTML={{
                  __html: textToHtml(String(sectionData.subheadline || ''))
                }}
              />
            </div>
          </div>
        </section>
      )

    case 'featured': {
      // Merge sectionData into section object (matches pattern in EditableCustomerSiteSection)
      const mergedSection = {
        ...section,
        data: sectionData,
        settings: section.settings
      }

      return (
        <ViewportLazyLoad fallback={<div className="h-96" />} delay={100}>
          <FeaturedPlantsErrorBoundary>
            <FeaturedPreview
              section={mergedSection}
              sectionKey={sectionKey}
              // No onContentUpdate or other edit callbacks = read-only customer view
              // FeaturedPreview handles useProductDatabase logic internally
            />
          </FeaturedPlantsErrorBoundary>
        </ViewportLazyLoad>
      )
    }

    case 'categories': {
      // Use categories from data or fall back to default categories (matches CategoriesPreview behavior)
      const categories = (sectionData.categories as any[]) || DEFAULT_CATEGORIES

      return (
        <ViewportLazyLoad fallback={<div className="h-96" />} delay={200}>
          <CategoriesSectionErrorBoundary>
            <section className="py-16" style={backgroundStyle}>
              <div className="brand-container">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                    {String(sectionData.headline || 'Shop by Category')}
                  </h2>
                  <div
                    className="text-lg max-w-2xl mx-auto [&_p:not(:first-child)]:mt-2"
                    style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}
                    dangerouslySetInnerHTML={{
                      __html: textToHtml(String(sectionData.description || 'Find the perfect plants for your space and lifestyle'))
                    }}
                  />
                </div>
                <div className={`grid ${getCategoriesGridClasses(categories.length, false)} gap-8`}>
                  {categories.map((category: any) => {
                    const hasImage = category.image && category.image.trim() !== ''

                    return (
                      <SmartLink key={category.id} href={category.link || '#'} className="group cursor-pointer h-full block">
                        <div className="relative overflow-hidden rounded-lg hover:shadow-xl transition-all duration-300 h-64">
                          {hasImage ? (
                            <>
                              {/* Full image */}
                              <img
                                src={category.image}
                                alt={category.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />

                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                            </>
                          ) : (
                            <>
                              {/* Placeholder when no image */}
                              <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                                <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Upload Image</p>
                              </div>
                            </>
                          )}

                          {/* Badge at bottom center */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                            <div className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                              <span
                                className="text-sm font-semibold whitespace-nowrap"
                                style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}
                              >
                                {category.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </SmartLink>
                    )
                  })}
                </div>
              </div>
            </section>
          </CategoriesSectionErrorBoundary>
        </ViewportLazyLoad>
      )
    }

    case 'features':
      return (
        <section className="py-16" style={backgroundStyle}>
          <div className="brand-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                {String(sectionData.headline || 'Essential Plant Care Features')}
              </h2>
              <div
                className="text-lg max-w-2xl mx-auto [&_p:not(:first-child)]:mt-2"
                style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}
                dangerouslySetInnerHTML={{
                  __html: textToHtml(String(sectionData.description || 'Master these key practices for healthy, thriving plants year-round'))
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {((sectionData.features as Array<string | { icon?: string; title?: string; text?: string }>) || []).map((feature, index) => {
                // Support both string features (legacy) and object features with icons
                const isObject = typeof feature === 'object' && feature !== null
                const featureText = isObject
                  ? (feature.title || feature.text || '')
                  : String(feature)
                const iconName = isObject && feature.icon ? feature.icon : 'Check'
                const IconComponent = getIcon(iconName)

                return (
                  <div key={`feature-${index}`} className="p-6 rounded-lg border text-center" style={{backgroundColor: 'rgba(var(--theme-primary-rgb), 0.05)', borderColor: 'rgba(var(--theme-primary-rgb), 0.1)'}}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto" style={{backgroundColor: 'var(--theme-primary)'}}>
                      {IconComponent && <IconComponent className="w-6 h-6 text-white" />}
                    </div>
                    <p className="text-sm font-medium" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>{featureText}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )

    case 'cta':
      return (
        <ViewportLazyLoad fallback={<MissionStatementSkeleton />} delay={400}>
          <section
            className="py-16"
            style={backgroundStyle}
            data-bg-mode={backgroundSetting === 'primary' ? 'primary' : 'default'}
          >
            <div className="brand-container">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className={`text-4xl md:text-6xl font-bold mb-6 leading-tight ${
                  backgroundSetting === 'primary' ? 'text-white' : ''
                }`} style={{
                  fontFamily: 'var(--theme-font-heading)',
                  color: backgroundSetting === 'primary' ? 'white' : 'var(--theme-text)'
                }}>
                  {String(sectionData.headline || 'Growing Together, Sustainably')}
                </h2>
                <div
                  className={`prose text-xl md:text-2xl mb-8 max-w-2xl mx-auto leading-relaxed ${
                    backgroundSetting === 'primary' ? 'text-white/90' : ''
                  } [&_p:not(:first-child)]:mt-2`}
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: backgroundSetting === 'primary' ? 'rgba(255,255,255,0.9)' : 'var(--theme-text)',
                    opacity: backgroundSetting === 'primary' ? 1 : '0.7'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: textToHtml(String(sectionData.description || 'Our mission is to help you create thriving plant sanctuaries while protecting our planet for future generations.'))
                  }}
                />
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {/* Primary CTA */}
                  {(sectionData.ctaText || sectionData.ctaLink) && (
                    <SmartLink
                      href={String(sectionData.ctaLink || '/plants')}
                      className={getButtonClassName((sectionData.ctaStyle as ButtonStyleVariant) || 'primary', backgroundSetting === 'primary')}
                      style={getButtonStyles((sectionData.ctaStyle as ButtonStyleVariant) || 'primary', backgroundSetting === 'primary')}
                    >
                      {String(sectionData.ctaText || 'Shop Plants')}
                    </SmartLink>
                  )}

                  {/* Secondary CTA */}
                  {(sectionData.secondaryCtaText || sectionData.secondaryCtaLink) && (
                    <SmartLink
                      href={String(sectionData.secondaryCtaLink || '/products')}
                      className={getButtonClassName((sectionData.secondaryCtaStyle as ButtonStyleVariant) || 'secondary', backgroundSetting === 'primary')}
                      style={getButtonStyles((sectionData.secondaryCtaStyle as ButtonStyleVariant) || 'secondary', backgroundSetting === 'primary')}
                    >
                      {String(sectionData.secondaryCtaText || 'Browse Plants')}
                    </SmartLink>
                  )}
                </div>
              </div>
            </div>
          </section>
        </ViewportLazyLoad>
      )

    case 'mission':
      return (
        <section className="py-16" style={backgroundStyle}>
          <div className="brand-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                {String(sectionData.headline || 'Our Mission')}
              </h2>
              <div
                className="text-lg md:text-xl leading-relaxed [&_p:not(:first-child)]:mt-4"
                style={{color: 'var(--theme-text)', opacity: '0.8', fontFamily: 'var(--theme-font-body)'}}
                dangerouslySetInnerHTML={{
                  __html: textToHtml(String(sectionData.content || ''))
                }}
              />
            </div>
          </div>
        </section>
      )

    case 'values':
      return (
        <section className="py-16" style={backgroundStyle}>
          <div className="brand-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                {String(sectionData.headline || 'Our Core Values')}
              </h2>
              {sectionData.description && (
                <div
                  className="text-lg max-w-2xl mx-auto [&_p:not(:first-child)]:mt-2"
                  style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}
                  dangerouslySetInnerHTML={{
                    __html: textToHtml(String(sectionData.description))
                  }}
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {((sectionData.items as any[]) || []).map((value: any) => {
                const IconComponent = getIcon(value.icon)
                return (
                  <div key={value.id} className="bg-white rounded-lg p-8 border hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: 'var(--theme-primary)'}}>
                        {IconComponent ? (
                          <IconComponent className="w-6 h-6 text-white" />
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-3" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                          {value.title}
                        </h3>
                        <p className="text-sm leading-relaxed" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )

    case 'team':
      return (
        <ViewportLazyLoad fallback={<div className="h-96" />} delay={200}>
          <section className="py-16" style={backgroundStyle}>
            <div className="brand-container">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                  {String(sectionData.headline || 'Meet Our Team')}
                </h2>
                {sectionData.description && (
                  <div
                    className="text-lg max-w-2xl mx-auto [&_p:not(:first-child)]:mt-2"
                    style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}
                    dangerouslySetInnerHTML={{
                      __html: textToHtml(String(sectionData.description))
                    }}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {((sectionData.items as any[]) || []).map((member: any) => (
                  <div key={member.id} className="bg-white rounded-xl p-6 md:p-8 border hover:shadow-lg transition-shadow">
                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-4 md:gap-6">
                      <div className="w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: 'rgba(var(--theme-primary-rgb), 0.1)'}}>
                        {member.image ? (
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold" style={{color: 'var(--theme-primary)'}}>
                            {member.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>{member.name}</h3>
                        <p className="font-semibold mb-2" style={{color: 'var(--theme-primary)', fontFamily: 'var(--theme-font-body)'}}>{member.title}</p>
                        {member.specialization && (
                          <p className="text-sm mb-3" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>{member.specialization}</p>
                        )}

                        {member.credentials && Array.isArray(member.credentials) && member.credentials.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium mb-1" style={{color: 'var(--theme-text)', opacity: '0.6', fontFamily: 'var(--theme-font-body)'}}>Professional Credentials:</p>
                            <div className="flex flex-wrap gap-1">
                              {member.credentials.map((credential: string, index: number) => (
                                <span key={index} className="text-xs px-2 py-1 rounded-full" style={{backgroundColor: 'rgba(var(--theme-primary-rgb), 0.1)', color: 'var(--theme-primary)', fontFamily: 'var(--theme-font-body)'}}>
                                  {credential}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {member.bio && (
                          <p className="text-sm leading-relaxed mb-2" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                            {member.bio}
                          </p>
                        )}

                        {member.experience && (
                          <p className="text-xs italic" style={{color: 'var(--theme-text)', opacity: '0.6', fontFamily: 'var(--theme-font-body)'}}>
                            {member.experience}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </ViewportLazyLoad>
      )

    case 'richText':
      return (
        <section className="py-16" style={backgroundStyle}>
          <div className="brand-container">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-gray max-w-none overflow-hidden customer-richtext-content">
                <ContentRenderer
                  content={String(sectionData.content || '')}
                  className="prose prose-gray max-w-none"
                />
              </div>
            </div>
          </div>
        </section>
      )

    case 'businessInfo': {
      const address = sectionData.address || {}
      const socials = sectionData.socials || {}
      const hours = Array.isArray(sectionData.hours) ? sectionData.hours : []
      const hasAddress = address.street || address.city || address.state || address.zip
      const hasSocials = socials.facebook || socials.instagram || socials.twitter || socials.linkedin

      return (
        <section className="py-16" style={backgroundStyle}>
          <div className="brand-container">
            {sectionData.headline && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                  {String(sectionData.headline)}
                </h2>
              </div>
            )}

            {/* Show message if no contact info is available */}
            {sectionData.message ? (
              <div className="text-center py-8 max-w-2xl mx-auto">
                <p className="text-lg" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                  {String(sectionData.message)}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Phone */}
              {sectionData.phone && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-1 flex-shrink-0" style={{color: 'var(--theme-primary)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold mb-1" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>Phone</h3>
                    <a href={`tel:${sectionData.phone}`} className="text-sm hover:underline" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                      {String(sectionData.phone)}
                    </a>
                  </div>
                </div>
              )}

              {/* Email */}
              {sectionData.email && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-1 flex-shrink-0" style={{color: 'var(--theme-primary)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold mb-1" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>Email</h3>
                    <a href={`mailto:${sectionData.email}`} className="text-sm hover:underline" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                      {String(sectionData.email)}
                    </a>
                  </div>
                </div>
              )}

              {/* Address */}
              {hasAddress && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-1 flex-shrink-0" style={{color: 'var(--theme-primary)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold mb-1" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>Address</h3>
                    <div className="text-sm space-y-1" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                      {address.street && <div>{address.street}</div>}
                      {(address.city || address.state || address.zip) && (
                        <div>
                          {address.city && `${address.city}, `}
                          {address.state} {address.zip}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Hours */}
              {hours.length > 0 && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-1 flex-shrink-0" style={{color: 'var(--theme-primary)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold mb-1" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>Hours</h3>
                    <div className="text-sm space-y-1" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                      {hours.map((hour: any, index: number) => (
                        <div key={index}>
                          <span className="font-medium">{hour.days}:</span> {hour.time}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Social Media */}
            {hasSocials && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-sm font-semibold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>Connect With Us</h3>
                <div className="flex gap-4">
                  {socials.facebook && (
                    <a
                      href={socials.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                      style={{backgroundColor: 'var(--theme-primary)'}}
                      aria-label="Facebook"
                    >
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                  )}
                  {socials.instagram && (
                    <a
                      href={socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                      style={{backgroundColor: 'var(--theme-primary)'}}
                      aria-label="Instagram"
                    >
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                  )}
                  {socials.twitter && (
                    <a
                      href={socials.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                      style={{backgroundColor: 'var(--theme-primary)'}}
                      aria-label="Twitter"
                    >
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </a>
                  )}
                  {socials.linkedin && (
                    <a
                      href={socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                      style={{backgroundColor: 'var(--theme-primary)'}}
                      aria-label="LinkedIn"
                    >
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )
    }

    case 'faq':
      return (
        <section className="py-16" style={backgroundStyle}>
          <div className="brand-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                {String(sectionData.headline || 'Frequently Asked Questions')}
              </h2>
              {sectionData.description && (
                <div
                  className="text-lg max-w-2xl mx-auto"
                  style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}
                  dangerouslySetInnerHTML={{__html: textToHtml(String(sectionData.description))}}
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Array.isArray(sectionData.faqs) && sectionData.faqs.map((faq: any, index: number) => (
                <div key={faq.id || index} className="bg-white rounded-lg p-6 border">
                  <h3
                    className="text-lg font-semibold mb-3"
                    style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}
                    dangerouslySetInnerHTML={{__html: textToHtml(String(faq.question || ''))}}
                  />
                  <div
                    className="text-sm prose prose-gray max-w-none"
                    style={{color: 'var(--theme-text)', opacity: '0.8', fontFamily: 'var(--theme-font-body)'}}
                    dangerouslySetInnerHTML={{__html: textToHtml(String(faq.answer || ''))}}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )

    default:
      return null
  }
}