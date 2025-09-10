import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { generateStructuredData, BUSINESS_INFO } from '@/src/data/seo-data'
import { companyStory, teamMembers, sustainabilityPractices } from '@/src/data/plant-content-data'
import { 
  TeamSectionErrorBoundary,
  SustainabilityErrorBoundary
} from '@/src/components/ui/plant-shop-error-boundaries'
import {
  TeamSectionSkeleton,
  SustainabilitySkeleton
} from '@/src/components/ui/plant-shop-loading-states'
import { ViewportLazyLoad } from '@/src/components/ui/lazy-loading'
import { getSiteHeaders } from '../utils/routing'

export async function AboutPage() {
  const { siteId } = await getSiteHeaders()
  
  return (
    <SiteRenderer 
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData('about'))
        }}
      />
      
      {/* Hero Section */}
      <section className="py-16 lg:py-24" style={{background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))'}}>
        <div className="brand-container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
              About Our Plant Experts
            </h1>
            <p className="text-xl leading-relaxed mb-8" style={{color: 'var(--theme-text)', opacity: '0.8', fontFamily: 'var(--theme-font-body)'}}>
              {companyStory.founding.year} years of horticultural expertise helping plant lovers grow their green sanctuaries
            </p>
          </div>
        </div>
      </section>

      {/* Company Story Section */}
      <section className="py-16" style={{backgroundColor: 'var(--theme-background)'}}>
        <div className="brand-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                Our Story
              </h2>
              <div className="prose max-w-none" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                <p className="text-lg mb-4">{companyStory.story}</p>
                <p className="text-lg">{companyStory.mission}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                Our Expertise
              </h3>
              <div className="space-y-4">
                {companyStory.expertise.specializations.map((item, index) => (
                  <div key={`expertise-${index}`} className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{backgroundColor: 'var(--theme-primary)'}}>
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Certifications */}
      <section className="py-16" style={{backgroundColor: 'rgba(var(--theme-primary-rgb), 0.03)'}}>
        <div className="brand-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
              Professional Certifications
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {companyStory.expertise.certifications.map((cert, index) => (
              <div key={`cert-${index}`} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3" style={{backgroundColor: 'var(--theme-primary)'}}>
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>{cert}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section - Lazy loaded */}
      <ViewportLazyLoad
        fallback={<TeamSectionSkeleton />}
        delay={100}
      >
        <TeamSectionErrorBoundary>
          <section className="py-16" style={{backgroundColor: 'var(--theme-background)'}}>
            <div className="brand-container">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                  Meet Our Plant Experts
                </h2>
                <p className="text-lg max-w-2xl mx-auto" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                  Our team combines decades of horticultural expertise with genuine passion for plant care
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {teamMembers.map((member) => (
                  <div key={member.id} className="bg-white rounded-xl p-6 md:p-8 border hover:shadow-lg transition-shadow">
                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-4 md:gap-6">
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-bold text-green-600">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                        <p className="text-green-600 font-semibold mb-2">{member.title}</p>
                        <p className="text-sm text-gray-600 mb-3">{member.specialization}</p>
                        
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Professional Credentials:</p>
                          <div className="flex flex-wrap gap-1">
                            {member.credentials.map((credential, index) => (
                              <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                {credential}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 italic">
                          {member.experience}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </TeamSectionErrorBoundary>
      </ViewportLazyLoad>

      {/* Sustainability Section - Lazy loaded */}
      <ViewportLazyLoad
        fallback={<SustainabilitySkeleton />}
        delay={200}
      >
        <SustainabilityErrorBoundary>
          <section className="py-16" style={{backgroundColor: 'rgba(var(--theme-secondary-rgb), 0.03)'}}>
            <div className="brand-container">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                  Sustainability Practices
                </h2>
                <p className="text-lg max-w-2xl mx-auto" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                  Our commitment to environmental responsibility guides every aspect of our business
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {sustainabilityPractices.map((practice, index) => (
                  <div key={`practice-${index}`} className="bg-white rounded-lg p-6 border hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{backgroundColor: 'var(--theme-secondary)'}}>
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                      {practice.name}
                    </h3>
                    <p className="text-sm mb-3" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                      {practice.description}
                    </p>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <p className="text-xs font-medium text-green-800 mb-1">Impact:</p>
                      <p className="text-xs text-green-700">{practice.impact}</p>
                      {practice.metrics && (
                        <>
                          <p className="text-xs font-medium text-green-800 mt-2 mb-1">Results:</p>
                          <p className="text-xs text-green-700">{practice.metrics}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </SustainabilityErrorBoundary>
      </ViewportLazyLoad>
    </SiteRenderer>
  )
}