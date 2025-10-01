import Link from 'next/link'
import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { ContentSection } from '@/src/lib/content/schema'
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
import { getLayoutSections } from '@/src/lib/preview/section-renderers'
import { CustomerSiteSection } from '@/src/components/customer-site/CustomerSiteSection'

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
  let databaseRichTextSections: Record<string, any> = {}
  let richTextStatuses: Record<string, string> = {}
  let richTextBackgroundSettings: Record<string, string> = {}
  let contentResult = null
  
  try {
    const supabase = await createClient()
    contentResult = await getContentBySlug(supabase, siteId, 'home')
    
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

        // Check for richText sections (richText, richText_1, richText_2, etc.)
        if (pageContent?.sections) {
          Object.entries(pageContent.sections).forEach(([sectionKey, section]) => {
            if (sectionKey.startsWith('richText') && section?.data && section.visible) {
              databaseRichTextSections[sectionKey] = section.data
              richTextStatuses[sectionKey] = 'available'
              richTextBackgroundSettings[sectionKey] = String(section.settings?.backgroundColor || 'default')
            }
          })
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

  // Hardcoded categories data
  const hardcodedCategories = [
    {
      id: 'beginner-friendly',
      name: 'Beginner-Friendly',
      image: '/images/golden-pothos.jpg',
      link: '/products',
      plantCount: 12,
      description: 'Perfect for new plant parents - low maintenance, forgiving varieties'
    },
    {
      id: 'houseplants',
      name: 'Houseplants',
      image: '/images/snake-plant.jpg',
      link: '/products',
      plantCount: 25,
      description: 'Transform indoor spaces with air-purifying and decorative plants'
    },
    {
      id: 'outdoor',
      name: 'Outdoor Specimens',
      image: '/images/japanese-maple.jpg',
      link: '/products',
      plantCount: 18,
      description: 'Hardy outdoor plants for landscaping and garden design'
    },
    {
      id: 'succulents',
      name: 'Succulents & Cacti',
      image: '/images/fiddle-leaf-fig.jpg',
      link: '/products',
      plantCount: 15,
      description: 'Drought-tolerant beauties perfect for sunny spots and xeriscaping'
    }
  ]

  // Get ordered sections from database if available
  let orderedSections: Array<{ key: string; section: unknown }> = []
  if (contentResult && contentResult.content && contentResult.is_published) {
    const pageContent = deserializePageContent(contentResult.content)
    if (pageContent?.sections) {
      orderedSections = getLayoutSections(pageContent.sections, 'landing')
    }
  }
  
  // Create data mapping for dynamic sections
  const sectionDataMap = {
    hero: {
      data: databaseHeroData,
      status: heroStatus,
      backgroundSetting: 'default'
    },
    featured: {
      data: databaseFeaturedData ? {
        ...databaseFeaturedData,
        featuredPlants: featuredPlants
      } : null,
      status: featuredStatus,
      backgroundSetting: featuredBackgroundSetting
    },
    categories: {
      data: databaseCategoriesData ? {
        ...databaseCategoriesData,
        categories: hardcodedCategories
      } : null,
      status: categoriesStatus,
      backgroundSetting: categoriesBackgroundSetting
    },
    features: {
      data: databaseFeaturesData,
      status: featuresStatus,
      backgroundSetting: featuresBackgroundSetting
    },
    cta: {
      data: databaseCtaData,
      status: ctaStatus,
      backgroundSetting: ctaBackgroundSetting
    }
  }

  // Add all found Rich Text sections to the sectionDataMap
  Object.entries(databaseRichTextSections).forEach(([sectionKey, sectionData]) => {
    sectionDataMap[sectionKey as keyof typeof sectionDataMap] = {
      data: sectionData,
      status: richTextStatuses[sectionKey],
      backgroundSetting: richTextBackgroundSettings[sectionKey]
    }
  })
  
  return (
    <SiteRenderer 
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      {/* Dynamic sections based on database order */}
      {orderedSections.length > 0 ? (
        // Render sections in database order
        orderedSections.map(({ key, section }) => {
          const sectionInfo = sectionDataMap[key as keyof typeof sectionDataMap]
          
          // Only render if section has data and is available
          if (!sectionInfo || sectionInfo.status !== 'available' || !sectionInfo.data) {
            return null
          }
          
          return (
            <CustomerSiteSection
              key={key}
              section={section as ContentSection}
              sectionKey={key}
              sectionData={sectionInfo.data}
              backgroundSetting={sectionInfo.backgroundSetting}
            />
          )
        })
      ) : (
        // Fallback to hardcoded hero section if no database content
        <HeroSectionErrorBoundary>
          <section className="relative py-20 lg:py-32" style={{background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))'}}>
            <div className="brand-container">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                  Welcome to Your Plant Paradise
                </h1>
                <p className="text-xl md:text-2xl mb-8 leading-relaxed" style={{color: 'var(--theme-text)', opacity: '0.8', fontFamily: 'var(--theme-font-body)'}}>
                  Discover premium plants, expert care guidance, and create your thriving green sanctuary
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <Link 
                    href="/plants"
                    className="px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
                    style={{backgroundColor: 'var(--theme-primary)', color: '#fff', fontFamily: 'var(--theme-font-body)'}}
                  >
                    Shop Plants
                  </Link>
                  <Link 
                    href="/about"
                    className="px-8 py-4 border-2 rounded-lg font-semibold transition-all duration-200 hover:bg-gray-50"
                    style={{borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)', fontFamily: 'var(--theme-font-body)'}}
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </HeroSectionErrorBoundary>
      )}
    </SiteRenderer>
  )
}