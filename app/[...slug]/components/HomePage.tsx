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

export async function HomePage() {
  const { siteId } = await getSiteHeaders()
  
  // Get the homepage content data
  const homePageData = plantShopContent.home
  const heroBlock = homePageData.blocks.find(block => block.type === 'hero')
  const featuredPlantsBlock = homePageData.blocks.find(block => block.type === 'featured_plants')
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
      {heroBlock?.isVisible && (
        <HeroSectionErrorBoundary>
          <section className="relative py-20 lg:py-32" style={{background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))'}}>
            <div className="brand-container">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                  {(heroBlock.content as any).headline}
                </h1>
                <p className="text-xl md:text-2xl mb-8 leading-relaxed" style={{color: 'var(--theme-text)', opacity: '0.8', fontFamily: 'var(--theme-font-body)'}}>
                  {(heroBlock.content as any).subheadline}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <a 
                    href={(heroBlock.content as any).ctaLink}
                    className="px-8 py-4 rounded-lg font-semibold transition-all duration-200 text-white hover:opacity-90"
                    style={{backgroundColor: 'var(--theme-primary)', fontFamily: 'var(--theme-font-body)'}}
                  >
                    {(heroBlock.content as any).ctaText}
                  </a>
                  <a 
                    href={(heroBlock.content as any).secondaryCtaLink}
                    className="border-2 px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:text-white"
                    style={{
                      borderColor: 'var(--theme-primary)',
                      color: 'var(--theme-primary)',
                      fontFamily: 'var(--theme-font-body)',
                    }}
                  >
                    {(heroBlock.content as any).secondaryCtaText}
                  </a>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  {((heroBlock.content as any).features as string[]).map((feature, index) => (
                    <div key={`hero-feature-${index}`} className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{backgroundColor: 'var(--theme-primary)'}}>
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </HeroSectionErrorBoundary>
      )}

      {/* Featured Plants Section - Immediate loading for key content */}
      {featuredPlantsBlock?.isVisible && (
        <FeaturedPlantsErrorBoundary>
          <section className="py-16" style={{backgroundColor: 'var(--theme-background)'}}>
            <div className="brand-container">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                  {(featuredPlantsBlock.content as any).headline}
                </h2>
                <p className="text-lg max-w-2xl mx-auto" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                  {(featuredPlantsBlock.content as any).description}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {featuredPlants.map((plant) => (
                  <div key={plant.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="relative">
                      <img 
                        src={plant.image} 
                        alt={plant.name}
                        className="w-full h-64 object-cover"
                        loading="eager"
                      />
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          plant.careLevel === 'beginner' ? 'bg-green-100 text-green-800' :
                          plant.careLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {plant.careLevel}
                        </span>
                      </div>
                      {plant.onSale && (
                        <div className="absolute top-4 left-4">
                          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            SALE
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>{plant.name}</h3>
                        <div className="text-right">
                          <span className="text-lg font-bold" style={{color: 'var(--theme-primary)'}}>${plant.price}</span>
                          {plant.originalPrice && (
                            <span className="text-sm text-gray-500 line-through ml-2">${plant.originalPrice}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 italic">{plant.scientificName}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {plant.features.map((feature, index) => (
                          <span key={`feature-${index}`} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <span>💡 {plant.lightRequirement}</span>
                        <span className={`font-medium ${plant.inStock ? 'text-green-600' : 'text-red-600'}`}>
                          {plant.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      <button 
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          plant.inStock 
                            ? 'text-white hover:opacity-90' 
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
                    { name: 'Beginner-Friendly', plants: beginnerPlants, image: '/api/placeholder/300/200', description: 'Easy-care plants perfect for new plant parents' },
                    { name: 'Houseplants', plants: houseplants, image: '/api/placeholder/300/200', description: 'Beautiful indoor plants for every room' },
                    { name: 'Outdoor Plants', plants: outdoorPlants, image: '/api/placeholder/300/200', description: 'Hardy plants for gardens and patios' },
                    { name: 'Succulents', plants: succulents, image: '/api/placeholder/300/200', description: 'Low-maintenance desert beauties' }
                  ].map((category, index) => (
                    <div key={`category-${category.name}-${index}`} className="group cursor-pointer">
                      <div className="relative overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="aspect-w-4 aspect-h-3 bg-gray-200">
                          <img 
                            src={category.image} 
                            alt={category.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-opacity"></div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-semibold mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                            {category.name}
                          </h3>
                          <p className="text-sm mb-3" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                            {category.description}
                          </p>
                          <div className="flex items-center justify-between">
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
                  <div key={`seasonal-tip-${index}`} className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-100">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-orange-900">{tip}</p>
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
                    className="inline-flex items-center px-6 py-3 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
                    style={{backgroundColor: 'var(--theme-primary)', fontFamily: 'var(--theme-font-body)'}}
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
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-4 ${
                          guide.category === 'general' ? 'bg-green-100' :
                          guide.category === 'seasonal' ? 'bg-orange-100' :
                          guide.category === 'propagation' ? 'bg-blue-100' : 
                          'bg-red-100'
                        }`}>
                          <svg className={`w-8 h-8 ${
                            guide.category === 'general' ? 'text-green-600' :
                            guide.category === 'seasonal' ? 'text-orange-600' :
                            guide.category === 'propagation' ? 'text-blue-600' : 
                            'text-red-600'
                          }`} fill="currentColor" viewBox="0 0 20 20">
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
                          className="inline-flex items-center px-4 py-2 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
                          style={{backgroundColor: 'var(--theme-primary)', fontFamily: 'var(--theme-font-body)'}}
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{fontFamily: 'var(--theme-font-heading)'}}>
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
                  className="border-2 border-white px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 hover:bg-white"
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--theme-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'white'
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