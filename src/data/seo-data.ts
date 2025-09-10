/**
 * SEO-Optimized Meta Data Structures for Plant Shop
 * 
 * Comprehensive SEO data including:
 * - Plant-specific keywords and descriptions
 * - JSON-LD structured data for LocalBusiness
 * - OpenGraph and social sharing optimization
 * - Meta data for all 5 page types
 */

// Base business information for structured data
export const BUSINESS_INFO = {
  name: 'Brands in Blooms',
  description: 'Premium plant shop specializing in indoor plants, rare specimens, and expert plant care guidance',
  url: 'https://brandsinblooms.com',
  telephone: '+1-555-PLANTS',
  email: 'hello@brandsinblooms.com',
  address: {
    streetAddress: '123 Garden Street',
    addressLocality: 'Plant City',
    addressRegion: 'FL',
    postalCode: '33563',
    addressCountry: 'US'
  },
  geo: {
    latitude: '28.0181',
    longitude: '-82.1248'
  },
  openingHours: [
    'Mo-Fr 09:00-18:00',
    'Sa 09:00-17:00',
    'Su 11:00-16:00'
  ],
  priceRange: '$$',
  categories: [
    'Plant Store',
    'Garden Center',
    'Indoor Plant Specialist',
    'Plant Care Consultation'
  ]
} as const;

// Plant-specific keywords for SEO optimization
export const PLANT_KEYWORDS = {
  primary: [
    'indoor plants',
    'houseplants',
    'plant shop',
    'plant care',
    'rare plants',
    'plant nursery',
    'garden center',
    'plant delivery'
  ],
  secondary: [
    'monstera',
    'fiddle leaf fig',
    'snake plant',
    'pothos',
    'philodendron',
    'air plants',
    'succulents',
    'tropical plants',
    'plant accessories',
    'plant pots',
    'plant fertilizer',
    'plant care tips'
  ],
  local: [
    'plant shop near me',
    'local plant store',
    'plant nursery Plant City',
    'indoor plants Florida',
    'plant care consultation',
    'plant delivery service'
  ],
  longtail: [
    'best indoor plants for beginners',
    'low light houseplants',
    'air purifying plants',
    'pet safe plants',
    'easy care houseplants',
    'rare plant collection',
    'plant care guide',
    'how to care for indoor plants'
  ]
} as const;

// OpenGraph and social media configurations
export const SOCIAL_CONFIG = {
  twitterCard: 'summary_large_image' as const,
  twitterSite: '@brandsinblooms',
  twitterCreator: '@brandsinblooms',
  facebookAppId: '123456789',
  ogType: 'website' as const,
  ogLocale: 'en_US' as const,
  ogSiteName: BUSINESS_INFO.name,
  defaultImage: {
    url: '/images/og-default-plants.jpg',
    width: 1200,
    height: 630,
    alt: 'Brands in Blooms - Premium Indoor Plants and Plant Care'
  }
} as const;

// JSON-LD Structured Data Templates
export const STRUCTURED_DATA = {
  // Local Business Schema
  localBusiness: {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${BUSINESS_INFO.url}#business`,
    name: BUSINESS_INFO.name,
    description: BUSINESS_INFO.description,
    url: BUSINESS_INFO.url,
    telephone: BUSINESS_INFO.telephone,
    email: BUSINESS_INFO.email,
    priceRange: BUSINESS_INFO.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS_INFO.address.streetAddress,
      addressLocality: BUSINESS_INFO.address.addressLocality,
      addressRegion: BUSINESS_INFO.address.addressRegion,
      postalCode: BUSINESS_INFO.address.postalCode,
      addressCountry: BUSINESS_INFO.address.addressCountry
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS_INFO.geo.latitude,
      longitude: BUSINESS_INFO.geo.longitude
    },
    openingHoursSpecification: BUSINESS_INFO.openingHours.map(hours => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.split(' ')[0].split('-').length > 1 
        ? hours.split(' ')[0].split('-').map(day => {
            const dayMap: Record<string, string> = {
              'Mo': 'Monday', 'Tu': 'Tuesday', 'We': 'Wednesday',
              'Th': 'Thursday', 'Fr': 'Friday', 'Sa': 'Saturday', 'Su': 'Sunday'
            };
            return dayMap[day];
          })
        : [hours.split(' ')[0]],
      opens: hours.split(' ')[1].split('-')[0],
      closes: hours.split(' ')[1].split('-')[1]
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1'
    },
    review: [
      {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'Sarah Johnson'
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5'
        },
        reviewBody: 'Amazing selection of healthy plants and expert care advice. My monstera is thriving!'
      }
    ],
    sameAs: [
      'https://facebook.com/brandsinblooms',
      'https://instagram.com/brandsinblooms',
      'https://twitter.com/brandsinblooms'
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Plant Collection',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Product',
            name: 'Indoor Plants',
            category: 'Houseplants'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Product',
            name: 'Plant Care Services',
            category: 'Consultation'
          }
        }
      ]
    }
  },

  // Organization Schema
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BUSINESS_INFO.url}#organization`,
    name: BUSINESS_INFO.name,
    url: BUSINESS_INFO.url,
    logo: {
      '@type': 'ImageObject',
      url: `${BUSINESS_INFO.url}/images/logo.png`,
      width: '300',
      height: '100'
    },
    sameAs: [
      'https://facebook.com/brandsinblooms',
      'https://instagram.com/brandsinblooms',
      'https://twitter.com/brandsinblooms'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: BUSINESS_INFO.telephone,
      contactType: 'Customer Service',
      email: BUSINESS_INFO.email,
      availableLanguage: 'English'
    }
  },

  // Website Schema
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BUSINESS_INFO.url}#website`,
    name: BUSINESS_INFO.name,
    url: BUSINESS_INFO.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BUSINESS_INFO.url}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@id': `${BUSINESS_INFO.url}#organization`
    }
  }
} as const;

// Page-specific SEO data for all 5 page types
export const PAGE_SEO_DATA = {
  home: {
    title: `${BUSINESS_INFO.name} - Premium Indoor Plants & Expert Plant Care | Plant Shop`,
    description: 'Discover premium indoor plants, rare specimens, and expert plant care guidance. Transform your space with our curated collection of healthy houseplants and professional plant care services.',
    keywords: [
      ...PLANT_KEYWORDS.primary,
      ...PLANT_KEYWORDS.local,
      'premium houseplants',
      'plant care experts',
      'indoor plant collection'
    ].join(', '),
    canonical: BUSINESS_INFO.url,
    openGraph: {
      title: `${BUSINESS_INFO.name} - Premium Indoor Plants & Expert Care`,
      description: 'Transform your space with our curated collection of healthy houseplants, rare specimens, and professional plant care guidance.',
      type: 'website' as const,
      url: BUSINESS_INFO.url,
      images: [{
        url: `${BUSINESS_INFO.url}/images/og-home-plants.jpg`,
        width: 1200,
        height: 630,
        alt: 'Premium indoor plant collection at Brands in Blooms'
      }] as any[],
      siteName: BUSINESS_INFO.name,
      locale: 'en_US'
    },
    twitter: {
      card: 'summary_large_image' as const,
      site: SOCIAL_CONFIG.twitterSite,
      creator: SOCIAL_CONFIG.twitterCreator,
      title: `${BUSINESS_INFO.name} - Premium Indoor Plants`,
      description: 'Premium houseplants and expert plant care guidance',
      image: `${BUSINESS_INFO.url}/images/twitter-home-plants.jpg`
    },
    structuredData: [
      STRUCTURED_DATA.localBusiness,
      STRUCTURED_DATA.organization,
      STRUCTURED_DATA.website
    ]
  },

  about: {
    title: `About Us - Plant Care Experts & Indoor Plant Specialists | ${BUSINESS_INFO.name}`,
    description: 'Meet our team of plant care experts and learn about our passion for indoor plants. Discover our mission to bring the beauty of nature into your home with healthy, thriving houseplants.',
    keywords: [
      'plant care experts',
      'indoor plant specialists',
      'plant nursery team',
      'houseplant professionals',
      'plant care consultation',
      'botanical expertise'
    ].join(', '),
    canonical: `${BUSINESS_INFO.url}/about`,
    openGraph: {
      title: 'About Our Plant Care Experts - Indoor Plant Specialists',
      description: 'Meet our passionate team of plant care experts dedicated to helping your houseplants thrive with professional guidance and quality plants.',
      type: 'website' as const,
      url: `${BUSINESS_INFO.url}/about`,
      images: [{
        url: `${BUSINESS_INFO.url}/images/og-about-team.jpg`,
        width: 1200,
        height: 630,
        alt: 'Plant care experts and team at Brands in Blooms'
      }] as any[],
      siteName: BUSINESS_INFO.name,
      locale: 'en_US'
    },
    twitter: {
      card: 'summary_large_image' as const,
      site: SOCIAL_CONFIG.twitterSite,
      creator: SOCIAL_CONFIG.twitterCreator,
      title: 'About Our Plant Care Experts',
      description: 'Passionate plant specialists dedicated to your houseplants success',
      image: `${BUSINESS_INFO.url}/images/twitter-about-team.jpg`
    },
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        '@id': `${BUSINESS_INFO.url}/about#aboutpage`,
        mainEntity: {
          '@id': `${BUSINESS_INFO.url}#organization`
        },
        name: 'About Us',
        description: 'Learn about our plant care experts and our mission to bring beautiful, healthy indoor plants to your home.',
        url: `${BUSINESS_INFO.url}/about`
      }
    ]
  },

  contact: {
    title: `Contact Us - Plant Care Questions & Store Location | ${BUSINESS_INFO.name}`,
    description: 'Get in touch with our plant care experts for personalized advice, visit our plant shop location, or schedule a plant care consultation. We\'re here to help your plants thrive!',
    keywords: [
      'plant care consultation',
      'plant shop location',
      'plant care questions',
      'plant advice',
      'plant store hours',
      'plant care experts contact'
    ].join(', '),
    canonical: `${BUSINESS_INFO.url}/contact`,
    openGraph: {
      title: 'Contact Our Plant Care Experts - Get Professional Plant Advice',
      description: 'Reach out for plant care consultation, visit our store, or get expert advice on your houseplants. Professional plant care guidance available.',
      type: 'website' as const,
      url: `${BUSINESS_INFO.url}/contact`,
      images: [{
        url: `${BUSINESS_INFO.url}/images/og-contact-store.jpg`,
        width: 1200,
        height: 630,
        alt: 'Contact Brands in Blooms plant care experts and store location'
      }] as any[],
      siteName: BUSINESS_INFO.name,
      locale: 'en_US'
    },
    twitter: {
      card: 'summary_large_image' as const,
      site: SOCIAL_CONFIG.twitterSite,
      creator: SOCIAL_CONFIG.twitterCreator,
      title: 'Contact Our Plant Care Experts',
      description: 'Professional plant care consultation and expert advice',
      image: `${BUSINESS_INFO.url}/images/twitter-contact-store.jpg`
    },
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        '@id': `${BUSINESS_INFO.url}/contact#contactpage`,
        mainEntity: {
          '@id': `${BUSINESS_INFO.url}#business`
        },
        name: 'Contact Us',
        description: 'Get in touch for plant care consultation and expert advice',
        url: `${BUSINESS_INFO.url}/contact`
      }
    ]
  },

  privacy: {
    title: `Privacy Policy - Data Protection & Plant Care Information | ${BUSINESS_INFO.name}`,
    description: 'Learn how we protect your privacy and handle your personal information when you shop for plants, use our plant care services, or visit our website.',
    keywords: [
      'privacy policy',
      'data protection',
      'plant shop privacy',
      'customer information',
      'website privacy',
      'plant care data'
    ].join(', '),
    canonical: `${BUSINESS_INFO.url}/privacy`,
    openGraph: {
      title: 'Privacy Policy - How We Protect Your Information',
      description: 'Our commitment to protecting your privacy when shopping for plants and using our plant care services.',
      type: 'website' as const,
      url: `${BUSINESS_INFO.url}/privacy`,
      images: [{
        url: SOCIAL_CONFIG.defaultImage.url,
        width: SOCIAL_CONFIG.defaultImage.width,
        height: SOCIAL_CONFIG.defaultImage.height,
        alt: SOCIAL_CONFIG.defaultImage.alt
      }] as any[],
      siteName: BUSINESS_INFO.name,
      locale: 'en_US'
    },
    twitter: {
      card: 'summary' as const,
      site: SOCIAL_CONFIG.twitterSite,
      title: 'Privacy Policy',
      description: 'How we protect your privacy and handle your information'
    },
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${BUSINESS_INFO.url}/privacy#webpage`,
        name: 'Privacy Policy',
        description: 'Our privacy policy and data protection practices',
        url: `${BUSINESS_INFO.url}/privacy`,
        isPartOf: {
          '@id': `${BUSINESS_INFO.url}#website`
        },
        about: {
          '@id': `${BUSINESS_INFO.url}#organization`
        },
        dateModified: new Date().toISOString(),
        inLanguage: 'en-US'
      }
    ]
  },

  terms: {
    title: `Terms of Service - Plant Shop Policies & Plant Care Services | ${BUSINESS_INFO.name}`,
    description: 'Read our terms of service for plant purchases, plant care consultations, and use of our website. Understand our policies for plant health guarantees and services.',
    keywords: [
      'terms of service',
      'plant shop policies',
      'plant care terms',
      'plant guarantee',
      'plant purchase terms',
      'service conditions'
    ].join(', '),
    canonical: `${BUSINESS_INFO.url}/terms`,
    openGraph: {
      title: 'Terms of Service - Plant Shop Policies & Service Terms',
      description: 'Our terms of service for plant purchases, plant care consultations, and website usage policies.',
      type: 'website' as const,
      url: `${BUSINESS_INFO.url}/terms`,
      images: [{
        url: SOCIAL_CONFIG.defaultImage.url,
        width: SOCIAL_CONFIG.defaultImage.width,
        height: SOCIAL_CONFIG.defaultImage.height,
        alt: SOCIAL_CONFIG.defaultImage.alt
      }] as any[],
      siteName: BUSINESS_INFO.name,
      locale: 'en_US'
    },
    twitter: {
      card: 'summary' as const,
      site: SOCIAL_CONFIG.twitterSite,
      title: 'Terms of Service',
      description: 'Our terms of service and policies for plant purchases and services'
    },
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${BUSINESS_INFO.url}/terms#webpage`,
        name: 'Terms of Service',
        description: 'Terms and conditions for our plant shop and services',
        url: `${BUSINESS_INFO.url}/terms`,
        isPartOf: {
          '@id': `${BUSINESS_INFO.url}#website`
        },
        about: {
          '@id': `${BUSINESS_INFO.url}#organization`
        },
        dateModified: new Date().toISOString(),
        inLanguage: 'en-US'
      }
    ]
  }
} as const;

// Helper function to generate meta tags for Next.js
export function generateMetaTags(pageKey: keyof typeof PAGE_SEO_DATA) {
  const pageData = PAGE_SEO_DATA[pageKey];
  
  return {
    title: pageData.title,
    description: pageData.description,
    keywords: pageData.keywords,
    canonical: pageData.canonical,
    openGraph: pageData.openGraph,
    twitter: pageData.twitter,
    other: {
      'theme-color': '#16a34a', // Plant green theme
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'format-detection': 'telephone=yes',
      'mobile-web-app-capable': 'yes',
      'msapplication-TileColor': '#16a34a',
      'msapplication-tap-highlight': 'no'
    }
  };
}

// Helper function to generate JSON-LD script tags
export function generateStructuredData(pageKey: keyof typeof PAGE_SEO_DATA) {
  const pageData = PAGE_SEO_DATA[pageKey];
  
  return pageData.structuredData.map(schema => ({
    type: 'application/ld+json',
    children: JSON.stringify(schema, null, 0)
  }));
}

// SEO-optimized content snippets for plant shop
export const SEO_CONTENT = {
  brandDescription: 'Premium indoor plants and expert plant care guidance for thriving houseplants',
  serviceAreas: [
    'Indoor Plant Care',
    'Houseplant Selection',
    'Plant Care Consultation',
    'Rare Plant Sourcing',
    'Plant Health Assessment',
    'Botanical Advice'
  ],
  plantCategories: [
    'Low Light Plants',
    'Air Purifying Plants',
    'Pet-Safe Plants',
    'Rare & Exotic Plants',
    'Easy Care Houseplants',
    'Flowering Indoor Plants',
    'Large Statement Plants',
    'Desk & Office Plants'
  ],
  careServices: [
    'Plant Care Workshops',
    'One-on-One Plant Consultations',
    'Plant Health Assessments',
    'Repotting Services',
    'Plant Care Plans',
    'Seasonal Plant Care'
  ]
} as const;

// Export all SEO data for easy access
export default {
  BUSINESS_INFO,
  PLANT_KEYWORDS,
  SOCIAL_CONFIG,
  STRUCTURED_DATA,
  PAGE_SEO_DATA,
  SEO_CONTENT,
  generateMetaTags,
  generateStructuredData
};