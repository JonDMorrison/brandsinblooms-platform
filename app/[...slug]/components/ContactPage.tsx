import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { ContentSection } from '@/src/lib/content/schema'
import { generateStructuredData } from '@/src/data/seo-data'
import { getSiteHeaders } from '../utils/routing'
import { createClient } from '@/src/lib/supabase/server'
import { getContentBySlug } from '@/src/lib/queries/domains/content'
import { deserializePageContent } from '@/src/lib/content/serialization'
import { getLayoutSections } from '@/src/lib/preview/section-renderers'
import { CustomerSiteSection } from '@/src/components/customer-site/CustomerSiteSection'
import { EditableCustomerSiteSection } from '@/src/components/site-editor/EditableCustomerSiteSection'
import { DynamicSectionRenderer } from '@/src/components/site-editor/DynamicSectionRenderer'

export async function ContactPage() {
  const { siteId } = await getSiteHeaders()

  // Fetch database content for contact sections
  let databaseHeaderData = null
  let headerStatus = 'not_found' // 'not_found', 'unpublished', 'missing_header', 'available'
  let headerBackgroundSetting = 'gradient'
  let databaseBusinessInfoData = null
  let businessInfoStatus = 'not_found'
  let businessInfoBackgroundSetting = 'default'
  let databaseRichTextSections: Record<string, any> = {}
  let richTextStatuses: Record<string, string> = {}
  let richTextBackgroundSettings: Record<string, string> = {}
  let databaseFaqData = null
  let faqStatus = 'not_found'
  let faqBackgroundSetting = 'alternate'
  let contentResult = null

  try {
    const supabase = await createClient()
    contentResult = await getContentBySlug(supabase, siteId, 'contact')

    if (contentResult && contentResult.content) {
      if (!contentResult.is_published) {
        headerStatus = 'unpublished'
      } else {
        const pageContent = deserializePageContent(contentResult.content)

        // Check for header section
        if (pageContent?.sections?.header?.data) {
          databaseHeaderData = pageContent.sections.header.data
          headerStatus = 'available'
          headerBackgroundSetting = String(pageContent.sections.header.settings?.backgroundColor || 'gradient')
        } else {
          headerStatus = 'missing_header'
        }

        // Check for businessInfo section
        if (pageContent?.sections?.businessInfo?.data) {
          databaseBusinessInfoData = pageContent.sections.businessInfo.data
          businessInfoStatus = 'available'
          businessInfoBackgroundSetting = String(pageContent.sections.businessInfo.settings?.backgroundColor || 'default')
        }

        // Check for richText sections (richText, richText_1, richText_2, etc.)
        if (pageContent?.sections) {
          Object.entries(pageContent.sections).forEach(([sectionKey, section]) => {
            if (sectionKey.startsWith('richText') && section?.data) {
              databaseRichTextSections[sectionKey] = section.data
              richTextStatuses[sectionKey] = 'available'
              richTextBackgroundSettings[sectionKey] = String(section.settings?.backgroundColor || 'default')
            }
          })
        }

        // Check for faq section
        if (pageContent?.sections?.faq?.data) {
          databaseFaqData = pageContent.sections.faq.data
          faqStatus = 'available'
          faqBackgroundSetting = String(pageContent.sections.faq.settings?.backgroundColor || 'alternate')
        }
      }
    }
  } catch (error) {
    console.error('Error fetching database content:', error)
    // statuses remain 'not_found'
  }

  // Get ordered sections from database if available
  let orderedSections: Array<{ key: string; section: unknown }> = []
  if (contentResult && contentResult.content && contentResult.is_published) {
    const pageContent = deserializePageContent(contentResult.content)
    if (pageContent?.sections) {
      orderedSections = getLayoutSections(pageContent.sections, 'contact')
    }
  }

  // Create data mapping for dynamic sections
  const sectionDataMap = {
    header: {
      data: databaseHeaderData,
      status: headerStatus,
      backgroundSetting: headerBackgroundSetting
    },
    businessInfo: {
      data: databaseBusinessInfoData,
      status: businessInfoStatus,
      backgroundSetting: businessInfoBackgroundSetting
    },
    faq: {
      data: databaseFaqData,
      status: faqStatus,
      backgroundSetting: faqBackgroundSetting
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData('contact'))
        }}
      />

      {/* Dynamic sections based on database order */}
      <DynamicSectionRenderer
        initialSections={orderedSections}
        sectionDataMap={sectionDataMap}
        fallbackContent={
        // Fallback to hardcoded sections when no database content
        <>
          {/* Header Section */}
          <CustomerSiteSection
            section={{ type: 'header', data: {}, visible: true }}
            sectionKey="header"
            sectionData={{
              headline: 'Get Expert Plant Care Help',
              subheadline: 'Connect with our certified horticulturists for personalized plant care guidance'
            }}
            backgroundSetting="gradient"
          />

          {/* Business Info Section */}
          <CustomerSiteSection
            section={{ type: 'businessInfo', data: {}, visible: true }}
            sectionKey="businessInfo"
            sectionData={{
              headline: 'Contact Information',
              items: [
                {
                  id: 'availability',
                  type: 'list',
                  title: 'Expert Availability',
                  content: 'Response within 24 hours\nVideo consultations available\nEmergency plant care support',
                  order: 0
                },
                {
                  id: 'services',
                  type: 'list',
                  title: 'Our Plant Care Services',
                  content: 'Personal plant health assessments\nCustom plant selection for your space\nRepotting and soil optimization\nPlant care workshops and education\nSeasonal plant care planning\nPest and disease diagnosis & treatment',
                  order: 1
                }
              ]
            }}
            backgroundSetting="default"
          />

          {/* FAQ Section */}
          <CustomerSiteSection
            section={{ type: 'faq', data: {}, visible: true }}
            sectionKey="faq"
            sectionData={{
              headline: 'Frequently Asked Questions',
              description: '',
              faqs: [
                {
                  id: 'response-time',
                  question: 'How quickly can I expect a response to my consultation request?',
                  answer: 'We typically respond within 24 hours during business days. For urgent plant care emergencies, please call us directly for immediate assistance.',
                  order: 0
                },
                {
                  id: 'video-consultations',
                  question: 'Do you offer video consultations?',
                  answer: 'Yes! Video consultations are available and often preferred for plant health assessments, as they allow us to see your plants and growing conditions in real-time.',
                  order: 1
                },
                {
                  id: 'consultation-content',
                  question: 'What should I include in my consultation request?',
                  answer: 'Please describe your specific concerns, include photos if possible, tell us about your growing conditions (light, humidity, watering routine), and mention any recent changes to your plant care routine.',
                  order: 2
                },
                {
                  id: 'consultation-fees',
                  question: 'Is there a fee for plant care consultations?',
                  answer: 'Basic consultations for plant care questions are complimentary. Extended consultations or on-site visits may have associated fees, which we\'ll discuss upfront.',
                  order: 3
                },
                {
                  id: 'plant-selection',
                  question: 'Can you help me choose plants for my specific space?',
                  answer: 'Absolutely! We love helping customers select the perfect plants based on their light conditions, space constraints, experience level, and lifestyle preferences.',
                  order: 4
                },
                {
                  id: 'ongoing-support',
                  question: 'Do you provide ongoing plant care support?',
                  answer: 'Yes, we offer ongoing support through follow-up consultations, seasonal care reminders, and our plant care workshop series. We\'re here to support your plant parenthood journey long-term.',
                  order: 5
                }
              ]
            }}
            backgroundSetting="alternate"
          />
        </>
        }
      />
    </SiteRenderer>
  )
}