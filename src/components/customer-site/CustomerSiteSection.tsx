/**
 * Customer site section renderer
 * Renders sections for live customer sites (no editing capabilities)
 * Maintains exact styling and behavior of hardcoded sections
 */

import React from 'react'
import Link from 'next/link'
import { ContentSection } from '@/src/lib/content/schema'
import { ViewportLazyLoad } from '@/src/components/ui/lazy-loading'
import {
  HeroSectionErrorBoundary,
  FeaturedPlantsErrorBoundary,
  CategoriesSectionErrorBoundary
} from '@/src/components/ui/plant-shop-error-boundaries'
import { MissionStatementSkeleton } from '@/src/components/ui/plant-shop-loading-states'
import { textToHtml } from '@/src/lib/utils/html-text'
import { getSectionBackgroundStyle } from '@/src/components/content-sections/shared/background-utils'
import { getFeatureGridClasses } from '@/src/components/content-sections/shared/grid-utils'
import { getIcon } from '@/src/components/content-sections/shared/icon-utils'

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
    case 'hero':
      return (
        <HeroSectionErrorBoundary>
          <section className={`relative py-20 lg:py-32 ${className}`} style={{background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))'}}>
            <div className="brand-container">
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
                  <Link 
                    href={String(sectionData.ctaLink || '/plants')}
                    className="px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
                    style={{backgroundColor: 'var(--theme-primary)', color: '#fff', fontFamily: 'var(--theme-font-body)'}}
                  >
                    {String(sectionData.ctaText || 'Shop Plants')}
                  </Link>
                  {sectionData.secondaryCtaText && (
                    <Link 
                      href={String(sectionData.secondaryCtaLink || '/about')}
                      className="px-8 py-4 border-2 rounded-lg font-semibold transition-all duration-200 hover:bg-gray-50"
                      style={{borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)', fontFamily: 'var(--theme-font-body)'}}
                    >
                      {String(sectionData.secondaryCtaText)}
                    </Link>
                  )}
                </div>

                {/* Features Grid */}
                {sectionData.features && Array.isArray(sectionData.features) && sectionData.features.length > 0 && (
                  <div
                    className={`grid gap-6 text-center ${getFeatureGridClasses(sectionData.features.length, false)}`}
                  >
                    {sectionData.features.slice(0, 4).map((feature: string, index: number) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                          style={{ backgroundColor: 'var(--theme-primary)' }}
                        >
                          <svg 
                            className="w-6 h-6 text-white" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span
                          className="text-sm font-medium"
                          style={{
                            color: 'var(--theme-text)',
                            fontFamily: 'var(--theme-font-body)'
                          }}
                        >
                          {String(feature)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </HeroSectionErrorBoundary>
      )

    case 'featured':
      return (
        <ViewportLazyLoad fallback={<div className="h-96" />} delay={100}>
          <FeaturedPlantsErrorBoundary>
            <section className="py-16" style={backgroundStyle}>
              <div className="brand-container">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                    {String(sectionData.headline || 'Featured Plants')}
                  </h2>
                  <div 
                    className="text-lg max-w-2xl mx-auto [&_p:not(:first-child)]:mt-2"
                    style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}
                    dangerouslySetInnerHTML={{
                      __html: textToHtml(String(sectionData.description || 'Discover our carefully curated selection of premium plants'))
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {((sectionData.featuredPlants || []) as any[]).slice(0, 4).map((plant) => (
                    <div key={plant.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="relative">
                        <img
                          src={plant.image}
                          alt={plant.name}
                          className="w-full h-48 object-cover"
                          loading="eager"
                        />
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {plant.category || 'Houseplants'}
                          </span>
                        </div>
                        {plant.originalPrice && plant.price < plant.originalPrice && (
                          <div className="absolute top-3 left-3">
                            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              SALE
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                          {plant.name}
                        </h3>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-right">
                            <span className="text-lg font-bold" style={{color: 'var(--theme-primary)'}}>${plant.price}</span>
                            {plant.originalPrice && plant.price < plant.originalPrice && (
                              <span className="text-sm text-gray-500 line-through ml-2">${plant.originalPrice}</span>
                            )}
                          </div>
                        </div>
                        <div className="mb-3">
                          <span className={`text-sm font-medium ${
                            plant.inStock ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {plant.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                          </span>
                        </div>
                        <button
                          className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                            plant.inStock
                              ? 'text-white hover:opacity-90 cursor-pointer'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                          style={plant.inStock ? {backgroundColor: 'var(--theme-primary)'} : {}}
                          disabled={!plant.inStock}
                        >
                          {plant.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <Link
                    href={String(sectionData.viewAllLink || '/plants')}
                    className="border px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-80"
                    style={{
                      borderColor: 'var(--theme-primary)',
                      color: 'var(--theme-primary)',
                      fontFamily: 'var(--theme-font-body)'
                    }}
                  >
                    {String(sectionData.viewAllText || 'View All Plants')}
                  </Link>
                </div>
              </div>
            </section>
          </FeaturedPlantsErrorBoundary>
        </ViewportLazyLoad>
      )

    case 'categories':
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {((sectionData.categories as any[]) || []).map((category: any) => (
                    <Link key={category.id} href={category.link} className="group cursor-pointer h-full block">
                      <div className="relative overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                        {/* Category Image Area */}
                        <div className="aspect-w-4 aspect-h-3 h-48 relative overflow-hidden">
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/20"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center p-4">
                              <p className="text-sm font-medium text-white bg-black/50 px-3 py-1 rounded-full">
                                {category.name}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Category Info */}
                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="text-xl font-semibold mb-2"
                              style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                            {category.name}
                          </h3>

                          <p className="text-sm mb-3 flex-1"
                             style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                            {category.description}
                          </p>

                          {/* Bottom Row with Plant Count and View All */}
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-sm font-medium" style={{color: 'var(--theme-primary)'}}>
                              {category.plantCount} plants
                            </span>
                            <span className="text-sm font-medium group-hover:translate-x-1 transition-transform"
                                  style={{color: 'var(--theme-primary)'}}>
                              View all →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </CategoriesSectionErrorBoundary>
        </ViewportLazyLoad>
      )

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
              {((sectionData.features as string[]) || []).map((feature, index) => (
                <div key={`feature-${index}`} className="p-6 rounded-lg border text-center" style={{backgroundColor: 'rgba(var(--theme-primary-rgb), 0.05)', borderColor: 'rgba(var(--theme-primary-rgb), 0.1)'}}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto" style={{backgroundColor: 'var(--theme-primary)'}}>
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>{String(feature)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )

    case 'cta':
      return (
        <ViewportLazyLoad fallback={<MissionStatementSkeleton />} delay={400}>
          <section className="py-16" style={backgroundStyle}>
            <div className="brand-container">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className={`text-4xl md:text-5xl font-bold mb-6 leading-tight ${
                  backgroundSetting === 'primary' ? 'text-white' : ''
                }`} style={{
                  fontFamily: 'var(--theme-font-heading)', 
                  color: backgroundSetting === 'primary' ? 'white' : 'var(--theme-text)'
                }}>
                  {String(sectionData.headline || 'Growing Together, Sustainably')}
                </h2>
                <div 
                  className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed ${
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
                    <Link 
                      href={String(sectionData.ctaLink || '/plants')}
                      className={`px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 hover:opacity-90 ${
                        backgroundSetting === 'primary' 
                          ? 'bg-white hover:bg-gray-100' 
                          : 'hover:bg-theme-primary/90'
                      }`}
                      style={{
                        backgroundColor: backgroundSetting === 'primary' ? 'white' : 'var(--theme-primary)',
                        color: backgroundSetting === 'primary' ? 'var(--theme-primary)' : 'white',
                        fontFamily: 'var(--theme-font-body)'
                      }}
                    >
                      {String(sectionData.ctaText || 'Shop Plants')}
                    </Link>
                  )}
                  
                  {/* Secondary CTA */}
                  {(sectionData.secondaryCtaText || sectionData.secondaryCtaLink) && (
                    <Link 
                      href={String(sectionData.secondaryCtaLink || '/products')}
                      className={`px-8 py-3 text-lg font-semibold rounded-lg border-2 transition-all duration-200 hover:opacity-80 ${
                        backgroundSetting === 'primary' 
                          ? 'border-white text-white hover:bg-white hover:text-theme-primary' 
                          : 'hover:bg-theme-primary hover:text-white'
                      }`}
                      style={{
                        borderColor: backgroundSetting === 'primary' ? 'white' : 'var(--theme-primary)',
                        color: backgroundSetting === 'primary' ? 'white' : 'var(--theme-primary)',
                        backgroundColor: 'transparent',
                        fontFamily: 'var(--theme-font-body)'
                      }}
                    >
                      {String(sectionData.secondaryCtaText || 'Browse Plants')}
                    </Link>
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
              {sectionData.headline && (
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                  {String(sectionData.headline)}
                </h2>
              )}
              <div
                className="prose prose-lg max-w-none [&_p:not(:first-child)]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-4"
                style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}
                dangerouslySetInnerHTML={{
                  __html: textToHtml(String(sectionData.content || ''))
                }}
              />
            </div>
          </div>
        </section>
      )

    default:
      return null
  }
}