import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { generateStructuredData, BUSINESS_INFO } from '@/src/data/seo-data'
import { teamMembers } from '@/src/data/plant-content-data'
import { 
  FAQSectionErrorBoundary
} from '@/src/components/ui/plant-shop-error-boundaries'
import {
  StoreInfoSkeleton,
  FAQSectionSkeleton
} from '@/src/components/ui/plant-shop-loading-states'
import { ViewportLazyLoad } from '@/src/components/ui/lazy-loading'
import { getSiteHeaders } from '../utils/routing'

export async function ContactPage() {
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
          __html: JSON.stringify(generateStructuredData('contact'))
        }}
      />
      
      {/* Hero Section */}
      <section className="py-16" style={{background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))'}}>
        <div className="brand-container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
              Get Expert Plant Care Help
            </h1>
            <p className="text-xl leading-relaxed" style={{color: 'var(--theme-text)', opacity: '0.8', fontFamily: 'var(--theme-font-body)'}}>
              Connect with our certified horticulturists for personalized plant care guidance
            </p>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-12 py-16 brand-container">
        {/* Contact Form */}
        <div>
          <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
            Plant Care Consultation Request
          </h2>
          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-base"
                  style={{
                    focusRingColor: 'var(--theme-primary)',
                    fontFamily: 'var(--theme-font-body)'
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-base"
                  style={{
                    focusRingColor: 'var(--theme-primary)',
                    fontFamily: 'var(--theme-font-body)'
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                Email Address *
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-base"
                style={{
                  focusRingColor: 'var(--theme-primary)',
                  fontFamily: 'var(--theme-font-body)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                Phone (optional)
              </label>
              <input
                type="tel"
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-base"
                style={{
                  focusRingColor: 'var(--theme-primary)',
                  fontFamily: 'var(--theme-font-body)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                Plant Care Experience Level
              </label>
              <select className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-base"
                style={{
                  focusRingColor: 'var(--theme-primary)',
                  fontFamily: 'var(--theme-font-body)'
                }}>
                <option value="">Select your experience level</option>
                <option value="beginner">Beginner (0-1 years)</option>
                <option value="intermediate">Intermediate (2-5 years)</option>
                <option value="advanced">Advanced (5+ years)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                Consultation Type
              </label>
              <div className="space-y-3">
                {[
                  'Plant health diagnosis',
                  'Plant selection for my space',
                  'Care routine optimization',
                  'Propagation guidance',
                  'Pest/disease troubleshooting',
                  'Indoor air quality improvement',
                  'General plant care questions'
                ].map((type, index) => (
                  <label key={`consultation-${index}`} className="flex items-center min-h-[44px]">
                    <input
                      type="radio"
                      name="consultation_type"
                      value={type}
                      className="w-4 h-4 mr-3"
                      style={{accentColor: 'var(--theme-primary)'}}
                    />
                    <span className="text-sm" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                Message *
              </label>
              <textarea
                required
                rows={6}
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-base resize-vertical"
                style={{
                  focusRingColor: 'var(--theme-primary)',
                  fontFamily: 'var(--theme-font-body)'
                }}
                placeholder="Tell us about your plants, specific concerns, or questions..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                Preferred Contact Method
              </label>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                {['Email', 'Phone call', 'Video consultation'].map((method, index) => (
                  <label key={`contact-${index}`} className="flex items-center min-h-[44px]">
                    <input
                      type="checkbox"
                      name="contact_method"
                      value={method}
                      className="w-4 h-4 mr-2"
                      style={{accentColor: 'var(--theme-primary)'}}
                    />
                    <span className="text-sm" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                      {method}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 min-h-[48px]"
              style={{backgroundColor: 'var(--theme-primary)', fontFamily: 'var(--theme-font-body)'}}
            >
              Send Consultation Request
            </button>
          </form>
        </div>

        {/* Contact Information and Services */}
        <div className="space-y-8">
          {/* Expert Availability */}
          <div>
            <h3 className="text-xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
              Expert Availability
            </h3>
            <div className="p-6 rounded-lg border" style={{backgroundColor: 'rgba(var(--theme-primary-rgb), 0.05)', borderColor: 'rgba(var(--theme-primary-rgb), 0.2)'}}>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></div>
                  <span className="text-sm font-medium" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                    Response within 24 hours
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></div>
                  <span className="text-sm font-medium" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                    Video consultations available
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></div>
                  <span className="text-sm font-medium" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                    Emergency plant care support
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Team */}
          <div>
            <h3 className="text-xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
              Contact Our Experts
            </h3>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={`contact-${member.id}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{backgroundColor: 'rgba(var(--theme-primary-rgb), 0.1)'}}>
                      <span className="text-lg font-bold" style={{color: 'var(--theme-primary)'}}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                        {member.name}
                      </h4>
                      <p className="text-sm" style={{color: 'var(--theme-primary)'}}>{member.title}</p>
                    </div>
                  </div>
                  <p className="text-sm" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                    {member.specialization}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Store Information - Lazy loaded */}
          <ViewportLazyLoad
            fallback={<StoreInfoSkeleton />}
            delay={100}
          >
            <div>
              <h3 className="text-xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                Store Information
              </h3>
              <div className="border rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mt-0.5 mr-3" style={{color: 'var(--theme-primary)'}} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                        {BUSINESS_INFO.address.street}
                      </p>
                      <p className="text-sm" style={{color: 'var(--theme-text)', opacity: '0.7', fontFamily: 'var(--theme-font-body)'}}>
                        {BUSINESS_INFO.address.city}, {BUSINESS_INFO.address.state} {BUSINESS_INFO.address.zipCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" style={{color: 'var(--theme-primary)'}} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="font-medium" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                      {BUSINESS_INFO.phone}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" style={{color: 'var(--theme-primary)'}} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="font-medium" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                      {BUSINESS_INFO.email}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <p className="font-medium mb-2" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                      Hours:
                    </p>
                    {BUSINESS_INFO.openingHours.map((hours, index) => {
                      const [days, time] = hours.split(' ');
                      const dayNames = days.includes('-') 
                        ? days.replace('Mo', 'Monday').replace('Fr', 'Friday').replace('Sa', 'Saturday').replace('Su', 'Sunday')
                        : days.replace('Mo', 'Monday').replace('Tu', 'Tuesday').replace('We', 'Wednesday').replace('Th', 'Thursday').replace('Fr', 'Friday').replace('Sa', 'Saturday').replace('Su', 'Sunday');
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <span style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>{dayNames}:</span>
                          <span style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>{time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </ViewportLazyLoad>

          {/* Plant Care Services */}
          <div>
            <h3 className="text-xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
              Our Plant Care Services
            </h3>
            <div className="space-y-3">
              {[
                'Personal plant health assessments',
                'Custom plant selection for your space',
                'Repotting and soil optimization',
                'Plant care workshops and education',
                'Seasonal plant care planning',
                'Pest and disease diagnosis & treatment'
              ].map((service, index) => (
                <div key={`service-${index}`} className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></div>
                  <span className="text-sm" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
                    {service}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section - Lazy loaded */}
      <ViewportLazyLoad
        fallback={<FAQSectionSkeleton />}
        delay={200}
      >
        <FAQSectionErrorBoundary>
          <section className="py-16" style={{backgroundColor: 'rgba(var(--theme-primary-rgb), 0.03)'}}>
            <div className="brand-container">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    question: "How quickly can I expect a response to my consultation request?",
                    answer: "We typically respond within 24 hours during business days. For urgent plant care emergencies, please call us directly for immediate assistance."
                  },
                  {
                    question: "Do you offer video consultations?",
                    answer: "Yes! Video consultations are available and often preferred for plant health assessments, as they allow us to see your plants and growing conditions in real-time."
                  },
                  {
                    question: "What should I include in my consultation request?",
                    answer: "Please describe your specific concerns, include photos if possible, tell us about your growing conditions (light, humidity, watering routine), and mention any recent changes to your plant care routine."
                  },
                  {
                    question: "Is there a fee for plant care consultations?",
                    answer: "Basic consultations for plant care questions are complimentary. Extended consultations or on-site visits may have associated fees, which we'll discuss upfront."
                  },
                  {
                    question: "Can you help me choose plants for my specific space?",
                    answer: "Absolutely! We love helping customers select the perfect plants based on their light conditions, space constraints, experience level, and lifestyle preferences."
                  },
                  {
                    question: "Do you provide ongoing plant care support?",
                    answer: "Yes, we offer ongoing support through follow-up consultations, seasonal care reminders, and our plant care workshop series. We're here to support your plant parenthood journey long-term."
                  }
                ].map((faq, index) => (
                  <div key={`faq-${index}`} className="bg-white rounded-lg p-6 border">
                    <h3 className="text-lg font-semibold mb-3" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
                      {faq.question}
                    </h3>
                    <p className="text-sm" style={{color: 'var(--theme-text)', opacity: '0.8', fontFamily: 'var(--theme-font-body)'}}>
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FAQSectionErrorBoundary>
      </ViewportLazyLoad>
    </SiteRenderer>
  )
}