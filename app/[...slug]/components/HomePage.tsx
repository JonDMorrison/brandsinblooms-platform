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
  
  // Fetch database content for hero and featured sections
  let databaseHeroData = null
  let heroStatus = 'not_found' // 'not_found', 'unpublished', 'missing_hero', 'available'
  let databaseFeaturedData = null
  let featuredStatus = 'not_found' // 'not_found', 'available'
  
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
        }
      }
    }
  } catch (error) {
    console.error('Error fetching database content:', error)
    // heroStatus remains 'not_found'
  }
  
  // Get hardcoded content for other sections (keep existing functionality)
  const homePageData = plantShopContent.home
  const categoriesBlock = homePageData.blocks.find(block => block.type === 'categories')
  const seasonalBlock = homePageData.blocks.find(block => block.type === 'seasonal')
  const careGuidesBlock = homePageData.blocks.find(block => block.type === 'care_guides')
  
  // Get data for sections
  const featuredPlants = getFeaturedPlants()
  const beginnerPlants = getPlantsByCareLevel('beginner')
  const houseplants = getPlantsByCategory('houseplants')
  const outdoorPlants = getPlantsByCategory('outdoor')
  const succulents = getPlantsByCategory('succulents')
  
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
          <section className="py-16" style={{backgroundColor: 'var(--theme-background)'}}>
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

      {/* Plant Categories Section - Lazy loaded */}
      <ViewportLazyLoad
        fallback={<PlantCategoriesSkeleton />}
        delay={100}
      >
        {categoriesBlock?.isVisible && (
          <CategoriesSectionErrorBoundary>
            <section className="py-16" style={{backgroundColor: 'rgba(var(--theme-primary-rgb), 0.03)'}}>
              <div className="brand-container">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                    Shop by Category
                  </h2>
                  <p className="text-lg max-w-2xl mx-auto" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                    Find the perfect plants for your experience level and space
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { name: 'Beginner-Friendly', plants: beginnerPlants, description: 'Easy-care plants perfect for new plant parents' },
                    { name: 'Houseplants', plants: houseplants, description: 'Beautiful indoor plants for every room' },
                    { name: 'Outdoor Plants', plants: outdoorPlants, description: 'Hardy plants for gardens and patios' },
                    { name: 'Succulents', plants: succulents, description: 'Low-maintenance desert beauties' }
                  ].map((category, index) => (
                    <div key={`category-${category.name}-${index}`} className="group cursor-pointer h-full">
                      <div className="relative overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                        <div className="aspect-w-4 aspect-h-3 h-48 flex items-center justify-center" style={{backgroundColor: 'var(--theme-primary)', opacity: '0.1'}}>
                          <div className="text-center p-4">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center" style={{backgroundColor: 'var(--theme-primary)'}}>
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 0v12h12V4H4z" clipRule="evenodd" />
                                <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0zM7 13l2-2 2 2 4-4v2l-4 4-2-2-2 2v-2z" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium" style={{color: 'var(--theme-primary)'}}>{category.name}</p>
                          </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="text-xl font-semibold mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                            {category.name}
                          </h3>
                          <p className="text-sm mb-3 flex-1" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                            {category.description}
                          </p>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-sm font-medium" style={{color: 'var(--theme-primary)'}}>
                              {category.plants.length} plants
                            </span>
                            <span className="text-sm font-medium group-hover:translate-x-1 transition-transform" style={{color: 'var(--theme-primary)'}}>
                              View all →
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </CategoriesSectionErrorBoundary>
        )}
      </ViewportLazyLoad>

      {/* Seasonal Plant Care Section - Lazy loaded */}
      <ViewportLazyLoad
        fallback={<SeasonalSectionSkeleton />}
        delay={200}
      >
        {seasonalBlock?.isVisible && (
          <section className="py-16" style={{backgroundColor: 'var(--theme-background)'}}>
            <div className="brand-container">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                  {(seasonalBlock.content as any).headline}
                </h2>
                <p className="text-lg max-w-2xl mx-auto" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                  {(seasonalBlock.content as any).description}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {((seasonalBlock.content as any).tips as string[]).map((tip, index) => (
                  <div key={`seasonal-tip-${index}`} className="p-6 rounded-lg border" style={{backgroundColor: 'rgba(var(--theme-primary-rgb), 0.05)', borderColor: 'rgba(var(--theme-primary-rgb), 0.1)'}}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: 'var(--theme-primary)'}}>
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>{tip}</p>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <div className="bg-white p-6 rounded-lg shadow-md inline-block">
                  <h3 className="text-xl font-semibold mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                    Featured Seasonal Guide
                  </h3>
                  <p className="text-sm mb-4" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                    {(seasonalBlock.content as any).guideTitle}
                  </p>
                  <a 
                    href={(seasonalBlock.content as any).guideLink}
                    className="inline-flex items-center px-6 py-3 rounded-lg font-medium border transition-all duration-200 hover:opacity-80 cursor-pointer"
                    style={{borderColor: 'var(--theme-secondary)', color: 'var(--theme-secondary)', backgroundColor: 'transparent', fontFamily: 'var(--theme-font-body)'}}
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z" clipRule="evenodd" />
                    </svg>
                    Download PDF Guide
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}
      </ViewportLazyLoad>

      {/* Plant Care Guides Section - Lazy loaded */}
      <ViewportLazyLoad
        fallback={<CareGuidesSkeleton />}
        delay={300}
      >
        {careGuidesBlock?.isVisible && (
          <CareGuidesSectionErrorBoundary>
            <section className="py-16" style={{backgroundColor: 'rgba(var(--theme-secondary-rgb), 0.03)'}}>
              <div className="brand-container">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                    {(careGuidesBlock.content as any).headline}
                  </h2>
                  <p className="text-lg max-w-2xl mx-auto" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                    {(careGuidesBlock.content as any).description}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {((careGuidesBlock.content as any).guides as any[]).map((guide, index) => (
                    <div key={`guide-${index}`} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="p-6">
                        <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-4" style={{backgroundColor: 'rgba(var(--theme-primary-rgb), 0.1)'}}>
                          <svg className="w-8 h-8" style={{color: 'var(--theme-primary)'}} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                          {guide.title}
                        </h3>
                        <p className="text-sm mb-4" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                          {guide.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {guide.plantTypes.map((type: string, typeIndex: number) => (
                            <span key={`plant-type-${typeIndex}`} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {type}
                            </span>
                          ))}
                        </div>
                        <a 
                          href={guide.downloadLink}
                          className="inline-flex items-center px-4 py-2 rounded-lg font-medium border transition-all duration-200 hover:opacity-80 cursor-pointer"
                          style={{borderColor: 'var(--theme-secondary)', color: 'var(--theme-secondary)', backgroundColor: 'transparent', fontFamily: 'var(--theme-font-body)'}}
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z" clipRule="evenodd" />
                          </svg>
                          Download PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </CareGuidesSectionErrorBoundary>
        )}
      </ViewportLazyLoad>

      {/* Mission Statement & CTA - Lazy loaded */}
      <ViewportLazyLoad
        fallback={<MissionStatementSkeleton />}
        delay={400}
      >
        <section className="py-16" style={{backgroundColor: 'var(--theme-primary)'}}>
          <div className="brand-container">
            <div className="max-w-4xl mx-auto text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white" style={{fontFamily: 'var(--theme-font-heading)', color: 'white'}}>
                Growing Together, Sustainably
              </h2>
              <p className="text-lg mb-8 leading-relaxed opacity-90" style={{fontFamily: 'var(--theme-font-body)'}}>
                Our mission is to help you create thriving plant sanctuaries while protecting our planet. 
                Every plant comes with expert care guidance, sustainable growing practices, and our commitment 
                to your plant parenthood success.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/contact"
                  className="px-8 py-4 bg-white rounded-lg font-semibold transition-all duration-200 hover:bg-gray-100"
                  style={{color: 'var(--theme-primary)', fontFamily: 'var(--theme-font-body)'}}
                >
                  Schedule Consultation
                </a>
                <a 
                  href="/products"
                  className="border-2 border-white px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 hover:bg-white/20"
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: 'white',
                  }}
                >
                  Browse Plants
                </a>
              </div>
            </div>
          </div>
        </section>
      </ViewportLazyLoad>
    </SiteRenderer>
  )
}