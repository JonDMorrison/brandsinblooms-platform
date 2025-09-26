import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { ContentSection } from '@/src/lib/content/schema'
import { teamMembers } from '@/src/data/plant-content-data'
import {
  HeroSectionErrorBoundary
} from '@/src/components/ui/plant-shop-error-boundaries'
import { getSiteHeaders } from '../utils/routing'
import { createClient } from '@/src/lib/supabase/server'
import { getContentBySlug } from '@/src/lib/queries/domains/content'
import { deserializePageContent } from '@/src/lib/content/serialization'
import { getLayoutSections } from '@/src/lib/preview/section-renderers'
import { CustomerSiteSection } from '@/src/components/customer-site/CustomerSiteSection'

export async function AboutPage() {
  const { siteId } = await getSiteHeaders()

  // Fetch database content for about sections
  let databaseHeroData = null
  let heroStatus = 'not_found' // 'not_found', 'unpublished', 'missing_hero', 'available'
  let databaseMissionData = null
  let missionStatus = 'not_found'
  let missionBackgroundSetting = 'default'
  let databaseValuesData = null
  let valuesStatus = 'not_found'
  let valuesBackgroundSetting = 'default'
  let databaseTeamData = null
  let teamStatus = 'not_found'
  let teamBackgroundSetting = 'default'
  let databaseFeaturesData = null
  let featuresStatus = 'not_found'
  let featuresBackgroundSetting = 'default'
  let databaseRichTextSections: Record<string, any> = {}
  let richTextStatuses: Record<string, string> = {}
  let richTextBackgroundSettings: Record<string, string> = {}
  let databaseCtaData = null
  let ctaStatus = 'not_found'
  let ctaBackgroundSetting = 'default'
  let contentResult = null

  try {
    const supabase = await createClient()
    contentResult = await getContentBySlug(supabase, siteId, 'about')

    if (contentResult && contentResult.content) {
      if (!contentResult.is_published) {
        heroStatus = 'unpublished'
      } else {
        const pageContent = deserializePageContent(contentResult.content)

        // Check for hero section
        if (pageContent?.sections?.hero?.data && pageContent.sections.hero.visible) {
          databaseHeroData = pageContent.sections.hero.data
          heroStatus = 'available'
        } else {
          heroStatus = 'missing_hero'
        }

        // Check for mission section
        if (pageContent?.sections?.mission?.data && pageContent.sections.mission.visible) {
          databaseMissionData = pageContent.sections.mission.data
          missionStatus = 'available'
          missionBackgroundSetting = String(pageContent.sections.mission.settings?.backgroundColor || 'default')
        }

        // Check for values section
        if (pageContent?.sections?.values?.data && pageContent.sections.values.visible) {
          databaseValuesData = pageContent.sections.values.data
          valuesStatus = 'available'
          valuesBackgroundSetting = String(pageContent.sections.values.settings?.backgroundColor || 'default')
        }

        // Check for team section
        if (pageContent?.sections?.team?.data && pageContent.sections.team.visible) {
          databaseTeamData = pageContent.sections.team.data
          teamStatus = 'available'
          teamBackgroundSetting = String(pageContent.sections.team.settings?.backgroundColor || 'default')
        }

        // Check for features section
        if (pageContent?.sections?.features?.data && pageContent.sections.features.visible) {
          databaseFeaturesData = pageContent.sections.features.data
          featuresStatus = 'available'
          featuresBackgroundSetting = String(pageContent.sections.features.settings?.backgroundColor || 'default')
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

        // Check for cta section
        if (pageContent?.sections?.cta?.data && pageContent.sections.cta.visible) {
          databaseCtaData = pageContent.sections.cta.data
          ctaStatus = 'available'
          ctaBackgroundSetting = String(pageContent.sections.cta.settings?.backgroundColor || 'default')
        }
      }
    }
  } catch (error) {
    console.error('Error fetching database content:', error)
    // heroStatus remains 'not_found'
  }

  // Hardcoded content for about sections (like HomePage's hardcodedCategories)
  const hardcodedTeamMembers = teamMembers.map(member => ({
    id: member.id,
    name: member.name,
    title: member.title,
    specialization: member.specialization,
    credentials: member.credentials,
    bio: member.bio,
    experience: member.experience,
    image: member.image
  }))

  const hardcodedValues = [
    {
      id: 'sustainability',
      title: 'Environmental Sustainability',
      description: 'We prioritize eco-friendly practices in all aspects of our business, from sourcing to packaging.',
      icon: 'Leaf'
    },
    {
      id: 'expertise',
      title: 'Horticultural Expertise',
      description: 'Our team of certified professionals brings decades of plant care knowledge to every interaction.',
      icon: 'Award'
    },
    {
      id: 'quality',
      title: 'Premium Quality',
      description: 'We source only the healthiest plants and provide ongoing support for long-term success.',
      icon: 'Star'
    },
    {
      id: 'education',
      title: 'Plant Education',
      description: 'We empower customers with knowledge to become confident, successful plant parents.',
      icon: 'BookOpen'
    }
  ]

  const hardcodedCertifications = [
    'Certified Master Gardener',
    'ISA Certified Arborist',
    'Sustainable Agriculture Specialist',
    'Plant Pathology Expert',
    'Greenhouse Management Professional'
  ]

  // Get ordered sections from database if available
  let orderedSections: Array<{ key: string; section: unknown }> = []
  if (contentResult && contentResult.content && contentResult.is_published) {
    const pageContent = deserializePageContent(contentResult.content)
    if (pageContent?.sections) {
      orderedSections = getLayoutSections(pageContent.sections, 'about')
    }
  }

  // Create data mapping for dynamic sections
  const sectionDataMap = {
    hero: {
      data: databaseHeroData,
      status: heroStatus,
      backgroundSetting: 'default'
    },
    mission: {
      data: databaseMissionData,
      status: missionStatus,
      backgroundSetting: missionBackgroundSetting
    },
    values: {
      data: databaseValuesData ? {
        ...databaseValuesData,
        items: hardcodedValues
      } : null,
      status: valuesStatus,
      backgroundSetting: valuesBackgroundSetting
    },
    team: {
      data: databaseTeamData ? {
        ...databaseTeamData,
        items: hardcodedTeamMembers
      } : null,
      status: teamStatus,
      backgroundSetting: teamBackgroundSetting
    },
    features: {
      data: databaseFeaturesData,
      status: featuresStatus,
      backgroundSetting: featuresBackgroundSetting
    },
    // Dynamic Rich Text sections will be added below
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
        // Fallback to hardcoded sections when no database content
        <>
          {/* Hero Section */}
          <HeroSectionErrorBoundary>
            <CustomerSiteSection
              section={{ type: 'hero', data: {}, visible: true }}
              sectionKey="hero"
              sectionData={{
                headline: 'About Our Plant Experts',
                subheadline: 'Years of horticultural expertise helping plant lovers grow their green sanctuaries',
                ctaText: 'Contact Us',
                ctaLink: '/contact',
                secondaryCtaText: 'View Our Services',
                secondaryCtaLink: '/services',
                features: [
                  'Professional Horticulturists',
                  'Expert Plant Care Guidance',
                  'Sustainable Growing Practices',
                  'Local Plant Sourcing'
                ]
              }}
              backgroundSetting="default"
            />
          </HeroSectionErrorBoundary>

          {/* Mission Section */}
          <CustomerSiteSection
            section={{ type: 'mission', data: {}, visible: true }}
            sectionKey="mission"
            sectionData={{
              headline: 'Our Mission',
              content: 'We believe that plants have the power to transform spaces and lives. Our mission is to provide expert guidance, premium plants, and sustainable practices that help create thriving green sanctuaries in every home and office.'
            }}
            backgroundSetting="default"
          />

          {/* Values Section */}
          <CustomerSiteSection
            section={{ type: 'values', data: {}, visible: true }}
            sectionKey="values"
            sectionData={{
              headline: 'Our Core Values',
              description: 'The principles that guide everything we do',
              items: hardcodedValues
            }}
            backgroundSetting="alternate"
          />

          {/* Team Section */}
          <CustomerSiteSection
            section={{ type: 'team', data: {}, visible: true }}
            sectionKey="team"
            sectionData={{
              headline: 'Meet Our Plant Experts',
              description: 'Our team combines decades of horticultural expertise with genuine passion for plant care',
              items: hardcodedTeamMembers
            }}
            backgroundSetting="default"
          />

          {/* Features Section */}
          <CustomerSiteSection
            section={{ type: 'features', data: {}, visible: true }}
            sectionKey="features"
            sectionData={{
              headline: 'Professional Certifications',
              description: 'Our credentials and expertise you can trust',
              features: hardcodedCertifications
            }}
            backgroundSetting="alternate"
          />

          {/* RichText Section */}
          <CustomerSiteSection
            section={{ type: 'richText', data: {}, visible: true }}
            sectionKey="richText"
            sectionData={{
              content: 'Founded with a passion for plants and a commitment to sustainability, we have grown from a small local nursery into a trusted source for premium plants and expert care guidance. Our journey began with the simple belief that everyone deserves to experience the joy and benefits of thriving plants in their space.<br><br>Today, we continue to honor that founding vision by combining scientific expertise with genuine care for our customers and the environment. Every plant we sell and every piece of advice we give reflects our deep commitment to helping you succeed with your green companions.'
            }}
            backgroundSetting="default"
          />

          {/* CTA Section */}
          <CustomerSiteSection
            section={{ type: 'cta', data: {}, visible: true }}
            sectionKey="cta"
            sectionData={{
              headline: 'Ready to Start Your Plant Journey?',
              description: 'Let our experts help you create the perfect green sanctuary for your space.',
              ctaText: 'Schedule Consultation',
              ctaLink: '/consultation',
              secondaryCtaText: 'Browse Plants',
              secondaryCtaLink: '/plants'
            }}
            backgroundSetting="primary"
          />
        </>
      )}
    </SiteRenderer>
  )
}