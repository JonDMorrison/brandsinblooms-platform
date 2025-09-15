import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { plantShopContent, getFeaturedPlants, getPlantsByCareLevel, getPlantsByCategory } from '@/src/data/plant-shop-content'
import { 
  HeroSectionErrorBoundary,
  FeaturedPlantsErrorBoundary,
  CategoriesSectionErrorBoundary,
  CareGuidesSectionErrorBoundary
} from '@/src/components/ui/plant-shop-error-boundaries'
import {
  PlantCategoriesSkeleton,
  CareGuidesSkeleton,
  SeasonalSectionSkeleton,
  MissionStatementSkeleton
} from '@/src/components/ui/plant-shop-loading-states'
import { ViewportLazyLoad } from '@/src/components/ui/lazy-loading'
import { getSiteHeaders } from '../utils/routing'
import { createClient } from '@/src/lib/supabase/server'
import { getContentBySlug } from '@/src/lib/queries/domains/content'
import { deserializePageContent } from '@/src/lib/content/serialization'
// Helper functions for multiline support and feature centering
const textToHtml = (text: string): string => {
  if (!text) return ''
  return text
    .split('\n\n')
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph)
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

const getFeatureGridClasses = (featureCount: number): string => {
  if (featureCount === 1) {
    return 'grid-cols-1'
  } else if (featureCount === 2) {
    return 'grid-cols-2'
  } else if (featureCount === 3) {
    return 'grid-cols-2 md:grid-cols-3'
  } else {
    return 'grid-cols-2 md:grid-cols-4'
  }
}

export async function HomePage() {
  const { siteId } = await getSiteHeaders()
  
  // Fetch database content for hero, featured, and categories sections
  let databaseHeroData = null
  let heroStatus = 'not_found' // 'not_found', 'unpublished', 'missing_hero', 'available'
  let databaseFeaturedData = null
  let featuredStatus = 'not_found' // 'not_found', 'available'
  let featuredBackgroundSetting = 'default' // Store the background setting
  let databaseCategoriesData = null
  let categoriesStatus = 'not_found' // 'not_found', 'available'
  let categoriesBackgroundSetting = 'default' // Store the background setting
  let databaseFeaturesData = null
  let featuresStatus = 'not_found' // 'not_found', 'available'
  let featuresBackgroundSetting = 'default' // Store the background setting
  let databaseCtaData = null
  let ctaStatus = 'not_found' // 'not_found', 'available'
  let ctaBackgroundSetting = 'default' // Store the background setting
  
  try {
    const supabase = await createClient()
    const contentResult = await getContentBySlug(supabase, siteId, 'home')
    
    if (contentResult && contentResult.content) {
      if (!contentResult.is_published) {
        heroStatus = 'unpublished'
      } else {
        const pageContent = deserializePageContent(contentResult.content)
        if (pageContent?.sections?.hero?.data && pageContent.sections.hero.visible) {
          databaseHeroData = pageContent.sections.hero.data
          heroStatus = 'available'
        } else {
          heroStatus = 'missing_hero'
        }
        
        // Check for featured section data
        if (pageContent?.sections?.featured?.data && pageContent.sections.featured.visible) {
          databaseFeaturedData = pageContent.sections.featured.data
          featuredStatus = 'available'
          // Store the background setting
          featuredBackgroundSetting = String(pageContent.sections.featured.settings?.backgroundColor || 'default')
        }
        
        // Check for categories section data
        if (pageContent?.sections?.categories?.data && pageContent.sections.categories.visible) {
          databaseCategoriesData = pageContent.sections.categories.data
          categoriesStatus = 'available'
          // Store the background setting
          categoriesBackgroundSetting = String(pageContent.sections.categories.settings?.backgroundColor || 'default')
        }
        
        // Check for features section data
        if (pageContent?.sections?.features?.data && pageContent.sections.features.visible) {
          databaseFeaturesData = pageContent.sections.features.data
          featuresStatus = 'available'
          // Store the background setting
          featuresBackgroundSetting = String(pageContent.sections.features.settings?.backgroundColor || 'default')
        }
        
        // Check for cta section data
        if (pageContent?.sections?.cta?.data && pageContent.sections.cta.visible) {
          databaseCtaData = pageContent.sections.cta.data
          ctaStatus = 'available'
          // Store the background setting
          ctaBackgroundSetting = String(pageContent.sections.cta.settings?.backgroundColor || 'default')
        }
      }
    }
  } catch (error) {
    console.error('Error fetching database content:', error)
    // heroStatus remains 'not_found'
  }
  
  // Get hardcoded content for other sections (keep existing functionality)
  const homePageData = plantShopContent.home
  
  // Get data for sections
  const featuredPlants = getFeaturedPlants()
  
  return (
    <SiteRenderer 
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      {/* Hero Section - Always loaded immediately for better UX */}
      <HeroSectionErrorBoundary>
        <section className="relative py-20 lg:py-32" style={{background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))'}}>
          <div className="brand-container">
            <div className="max-w-4xl mx-auto text-center">
              {heroStatus === 'available' && databaseHeroData ? (
                // Database content is available and published
                <>
                  <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                    {String(databaseHeroData.headline || 'Welcome to our site')}
                  </h1>
                  <div 
                    className="text-xl md:text-2xl mb-8 leading-relaxed [&_p:not(:first-child)]:mt-2"
                    style={{color: 'var(--theme-text)', opacity: '0.8', fontFamily: 'var(--theme-font-body)'}}
                    dangerouslySetInnerHTML={{
                      __html: textToHtml(String(databaseHeroData.subheadline || 'Your trusted source for premium plants and expert care guidance'))
                    }}
                  />
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <a 
                      href={String(databaseHeroData.ctaLink || '/plants')}
                      className="px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
                      style={{backgroundColor: 'var(--theme-primary)', color: '#fff', fontFamily: 'var(--theme-font-body)'}}
                    >
                      {String(databaseHeroData.ctaText || 'Shop Plants')}
                    </a>
                    {databaseHeroData.secondaryCtaText && (
                      <a 
                        href={String(databaseHeroData.secondaryCtaLink || '/care-guides')}
                        className="border px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-80"
                        style={{
                          borderColor: 'var(--theme-secondary)',
                          color: 'var(--theme-secondary)',
                          backgroundColor: 'transparent',
                          fontFamily: 'var(--theme-font-body)',
                        }}
                      >
                        {String(databaseHeroData.secondaryCtaText)}
                      </a>
                    )}
                  </div>
                  {databaseHeroData.features && Array.isArray(databaseHeroData.features) && databaseHeroData.features.length > 0 && (
                    <div className={`grid gap-6 text-center ${getFeatureGridClasses(databaseHeroData.features.length)}`}>
                      {databaseHeroData.features.slice(0, 4).map((feature, index) => (
                        <div key={`hero-feature-${index}`} className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{backgroundColor: 'var(--theme-primary)'}}>
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>{String(feature)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Fallback messages for different error states
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6 mx-auto">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                    {heroStatus === 'not_found' && 'Page Content Not Found'}
                    {heroStatus === 'unpublished' && 'Page Content Not Published'}
                    {heroStatus === 'missing_hero' && 'Hero Section Missing'}
                  </h1>
                  <p className="text-lg mb-8" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                    {heroStatus === 'not_found' && 'The homepage content has not been configured in the database yet.'}
                    {heroStatus === 'unpublished' && 'The homepage content exists but has not been published yet.'}
                    {heroStatus === 'missing_hero' && 'The homepage content exists but the hero section is not configured.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a 
                      href="/plants"
                      className="px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
                      style={{backgroundColor: 'var(--theme-primary)', color: '#fff', fontFamily: 'var(--theme-font-body)'}}
                    >
                      Browse Plants
                    </a>
                    <a 
                      href="/contact"
                      className="border px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-80"
                      style={{
                        borderColor: 'var(--theme-secondary)',
                        color: 'var(--theme-secondary)',
                        backgroundColor: 'transparent',
                        fontFamily: 'var(--theme-font-body)',
                      }}
                    >
                      Contact Us
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </HeroSectionErrorBoundary>

      {/* Featured Products Section - Database driven */}
      {featuredStatus === 'available' && databaseFeaturedData && (
        <FeaturedPlantsErrorBoundary>
          <section className="py-16" style={{
            backgroundColor: featuredBackgroundSetting === 'alternate' 
              ? 'rgba(var(--theme-primary-rgb), 0.03)' 
              : 'var(--theme-background)'
          }}>
            <div className="brand-container">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                  {String(databaseFeaturedData.headline || 'Featured Plants This Season!')}
                </h2>
                <div 
                  className="text-lg max-w-2xl mx-auto [&_p:not(:first-child)]:mt-2"
                  style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}
                  dangerouslySetInnerHTML={{
                    __html: textToHtml(String(databaseFeaturedData.subheadline || 'Handpicked selections from our master horticulturists, perfect for current growing conditions'))
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {featuredPlants.slice(0, 4).map((plant) => (
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
                <a 
                  href={String(databaseFeaturedData.viewAllLink || '/plants')}
                  className="border px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-80"
                  style={{
                    borderColor: 'var(--theme-primary)',
                    color: 'var(--theme-primary)',
                    fontFamily: 'var(--theme-font-body)'
                  }}
                >
                  {String(databaseFeaturedData.viewAllText || 'View All Plants')}
                </a>
              </div>
            </div>
          </section>
        </FeaturedPlantsErrorBoundary>
      )}

      {/* Categories Section - Database driven */}
      {categoriesStatus === 'available' && databaseCategoriesData && (
        <CategoriesSectionErrorBoundary>
          <section className="py-16" style={{
            backgroundColor: categoriesBackgroundSetting === 'alternate' 
              ? 'rgba(var(--theme-primary-rgb), 0.03)' 
              : 'var(--theme-background)'
          }}>
            <div className="brand-container">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                  {String(databaseCategoriesData.headline || 'Shop By Category')}
                </h2>
                <div 
                  className="text-lg max-w-2xl mx-auto [&_p:not(:first-child)]:mt-2"
                  style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}
                  dangerouslySetInnerHTML={{
                    __html: textToHtml(String(databaseCategoriesData.description || 'Find Your Perfect Plant Match'))
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    id: 'beginner-friendly',
                    name: 'Beginner-Friendly',
                    image: '/images/golden-pothos.jpg',
                    link: '/plants?care-level=beginner',
                    plantCount: 12,
                    description: 'Perfect for new plant parents - low maintenance, forgiving varieties'
                  },
                  {
                    id: 'houseplants',
                    name: 'Houseplants',
                    image: '/images/snake-plant.jpg',
                    link: '/plants?category=houseplants',
                    plantCount: 25,
                    description: 'Transform indoor spaces with air-purifying and decorative plants'
                  },
                  {
                    id: 'outdoor',
                    name: 'Outdoor Specimens',
                    image: '/images/japanese-maple.jpg',
                    link: '/plants?category=outdoor',
                    plantCount: 18,
                    description: 'Hardy outdoor plants for landscaping and garden design'
                  },
                  {
                    id: 'succulents',
                    name: 'Succulents & Cacti',
                    image: '/images/fiddle-leaf-fig.jpg',
                    link: '/plants?category=succulents',
                    plantCount: 15,
                    description: 'Drought-tolerant beauties perfect for sunny spots and xeriscaping'
                  }
                ].map((category: any) => (
                  <a key={category.id} href={category.link} className="group cursor-pointer h-full block">
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
                  </a>
                ))}
              </div>
            </div>
          </section>
        </CategoriesSectionErrorBoundary>
      )}

      {/* Features Section - Database driven */}
      {featuresStatus === 'available' && databaseFeaturesData && (
        <section className="py-16" style={{
          backgroundColor: featuresBackgroundSetting === 'alternate' 
            ? 'rgba(var(--theme-primary-rgb), 0.03)' 
            : 'var(--theme-background)'
        }}>
          <div className="brand-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                {String(databaseFeaturesData.headline || 'Essential Plant Care Features')}
              </h2>
              <div 
                className="text-lg max-w-2xl mx-auto [&_p:not(:first-child)]:mt-2"
                style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}
                dangerouslySetInnerHTML={{
                  __html: textToHtml(String(databaseFeaturesData.description || 'Master these key practices for healthy, thriving plants year-round'))
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {((databaseFeaturesData.features as string[]) || []).map((feature, index) => (
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
      )}


      {/* CTA Section - Database driven */}
      {ctaStatus === 'available' && databaseCtaData && (
        <ViewportLazyLoad
          fallback={<MissionStatementSkeleton />}
          delay={400}
        >
          <section className="py-16" style={{
            backgroundColor: ctaBackgroundSetting === 'alternate' 
              ? 'rgba(var(--theme-primary-rgb), 0.03)' 
              : ctaBackgroundSetting === 'primary'
                ? 'var(--theme-primary)'
                : 'var(--theme-background)'
          }}>
            <div className="brand-container">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className={`text-4xl md:text-5xl font-bold mb-6 leading-tight ${
                  ctaBackgroundSetting === 'primary' ? 'text-white' : ''
                }`} style={{
                  fontFamily: 'var(--theme-font-heading)', 
                  color: ctaBackgroundSetting === 'primary' ? 'white' : 'var(--theme-text)'
                }}>
                  {String(databaseCtaData.headline || 'Growing Together, Sustainably')}
                </h2>
                <div 
                  className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed ${
                    ctaBackgroundSetting === 'primary' ? 'text-white/90' : ''
                  } [&_p:not(:first-child)]:mt-2`}
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: ctaBackgroundSetting === 'primary' ? 'rgba(255,255,255,0.9)' : 'var(--theme-text)',
                    opacity: ctaBackgroundSetting === 'primary' ? 1 : '0.7'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: textToHtml(String(databaseCtaData.description || 'Our mission is to help you create thriving plant sanctuaries while protecting our planet for future generations.'))
                  }}
                />
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {/* Primary CTA */}
                  {(databaseCtaData.ctaText || databaseCtaData.ctaLink) && (
                    <a 
                      href={String(databaseCtaData.ctaLink || '/plants')}
                      className={`px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 hover:opacity-90 ${
                        ctaBackgroundSetting === 'primary' 
                          ? 'bg-white hover:bg-gray-100' 
                          : 'hover:bg-theme-primary/90'
                      }`}
                      style={{
                        backgroundColor: ctaBackgroundSetting === 'primary' ? 'white' : 'var(--theme-primary)',
                        color: ctaBackgroundSetting === 'primary' ? 'var(--theme-primary)' : 'white',
                        fontFamily: 'var(--theme-font-body)'
                      }}
                    >
                      {String(databaseCtaData.ctaText || 'Shop Plants')}
                    </a>
                  )}
                  
                  {/* Secondary CTA */}
                  {(databaseCtaData.secondaryCtaText || databaseCtaData.secondaryCtaLink) && (
                    <a 
                      href={String(databaseCtaData.secondaryCtaLink || '/products')}
                      className={`px-8 py-3 text-lg font-semibold rounded-lg border-2 transition-all duration-200 hover:opacity-80 ${
                        ctaBackgroundSetting === 'primary' 
                          ? 'border-white text-white hover:bg-white hover:text-theme-primary' 
                          : 'hover:bg-theme-primary hover:text-white'
                      }`}
                      style={{
                        borderColor: ctaBackgroundSetting === 'primary' ? 'white' : 'var(--theme-primary)',
                        color: ctaBackgroundSetting === 'primary' ? 'white' : 'var(--theme-primary)',
                        backgroundColor: 'transparent',
                        fontFamily: 'var(--theme-font-body)'
                      }}
                    >
                      {String(databaseCtaData.secondaryCtaText || 'Browse Plants')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        </ViewportLazyLoad>
      )}
    </SiteRenderer>
  )
}