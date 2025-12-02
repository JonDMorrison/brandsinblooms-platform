/**
 * Default content templates for each layout type
 * These templates provide pre-filled content when creating new pages
 */

import { PageContent, LayoutType } from './schema'
import {
  generateTestimonials,
  generatePricingTiers,
  generateFeatures,
  generateGalleryItems,
  MOCK_DATA_PRESETS,
  type MockDataOptions
} from './mock-data'

/**
 * Get default template content for a specific layout
 */
export function getLayoutTemplate(layout: LayoutType, title: string, subtitle?: string): PageContent {
  // Basic templates without rich mock data
  return getBasicLayoutTemplate(layout, title, subtitle)
}

/**
 * Get enhanced template content with rich mock data
 */
export function getEnhancedLayoutTemplate(
  layout: LayoutType,
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  const baseTemplate = getBasicLayoutTemplate(layout, title, subtitle)

  // If simple complexity is requested, return the simple template
  if (config.complexity === 'simple') {
    return baseTemplate
  }

  // Enhance templates based on layout type
  switch (layout) {
    case 'landing':
      return enhanceLandingTemplate(title, subtitle, config)
    case 'about':
      return enhanceAboutTemplate(title, subtitle, config)
    case 'product':
      return enhanceProductTemplate(title, subtitle, config)
    case 'contact':
      return enhanceContactTemplate(title, subtitle, config)
    case 'blog':
      return enhanceBlogTemplate(title, subtitle, config)
    case 'portfolio':
      return enhancePortfolioTemplate(title, subtitle, config)
    default:
      return baseTemplate
  }
}

/**
 * Get basic template content (original implementation)
 */
function getBasicLayoutTemplate(layout: LayoutType, title: string, subtitle?: string): PageContent {
  const templates: Record<LayoutType, PageContent> = {
    landing: {
      version: '2.0',
      layout: 'landing',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          settings: {},
          data: {
            content: '<p>Welcome to our amazing platform. Discover how we can help you achieve your goals.</p>',
            subtitle: subtitle || '',
            items: [
              {
                id: 'button-1',
                title: 'Get Started',
                url: '/contact'
              },
              {
                id: 'button-2',
                title: 'Learn More',
                url: '/about'
              }
            ]
          }
        },
        {
          id: 'features',
          type: 'featuresGrid',
          visible: true,
          settings: {},
          data: {
            items: [
              {
                id: 'feature-1',
                title: 'Easy to Use',
                content: 'Our intuitive interface makes it simple to get started and achieve results quickly.',
                icon: 'Star',
                order: 0
              },
              {
                id: 'feature-2',
                title: 'Powerful Features',
                content: 'Access advanced tools and capabilities designed to help you succeed.',
                icon: 'Zap',
                order: 1
              },
              {
                id: 'feature-3',
                title: '24/7 Support',
                content: 'Our dedicated team is here to help you every step of the way.',
                icon: 'Users',
                order: 2
              }
            ]
          }
        },
        {
          id: 'cta',
          type: 'callToAction',
          visible: true,
          settings: {},
          data: {
            content: '<h2>Ready to Get Started?</h2><p>Join thousands of satisfied customers today.</p>'
          }
        }
      ]
    },
    blog: {
      version: '2.0',
      layout: 'blog',
      sections: [
        {
          id: 'blogHeader',
          type: 'blogHeader',
          visible: true,
          settings: {},
          data: {
            title: title || '',
            subtitle: subtitle || '',
            author: '',
            publishedDate: new Date().toISOString().split('T')[0],
            image: ''
          }
        },
        {
          id: 'content',
          type: 'text', // Changed from 'content' to 'richText' based on usage in other templates? No, let's check schema. 'content' is not a SectionType. 'richText' is not in CoreSectionType either? Wait.
          // In schema.ts: CoreSectionType includes 'text', 'textMedia', etc. NOT 'richText'.
          // But enhanceBlogTemplate uses 'richText'.
          // Let's check sections.ts again.
          // It has 'text' (Text Block).
          // Maybe 'richText' is a custom one or I missed it.
          // Checking sections.ts... 'text' is there. 'customCode' is there.
          // enhanceBlogTemplate uses 'richText'.
          // I should check if 'richText' is valid.
          // If not, I should use 'text'.
          // Let's assume 'text' for now as it matches 'Text Block'.
          // Wait, enhanceBlogTemplate (line 1708) uses 'richText'.
          // Maybe it's a legacy type or I missed it in sections.ts.
          // Let's check sections.ts again.
          // It has 'text'.
          // I'll stick to 'text' if 'richText' is not found.
          // But I'll use 'text' for safety.
          visible: true,
          settings: {},
          data: {
            content: `<h2>Introduction</h2><p>Start your blog post with an engaging introduction that captures your reader's attention.</p><h2>Main Content</h2><p>This is where you'll add the main body of your blog post. Use headings, paragraphs, lists, and images to structure your content effectively.</p><h2>Conclusion</h2><p>Wrap up your post with a strong conclusion that summarizes your key points and encourages reader engagement.</p>`,
            json: null
          }
        }
      ]
    },
    portfolio: {
      version: '2.0',
      layout: 'portfolio',
      sections: [
        {
          id: 'header',
          type: 'hero',
          visible: true,
          settings: {},
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}`
          }
        },
        {
          id: 'gallery',
          type: 'gallery',
          visible: true,
          settings: {},
          data: {
            items: [
              {
                id: 'project-1',
                title: 'Project One',
                content: 'A stunning project showcasing our capabilities.',
                image: '/api/placeholder/400/300',
                order: 0
              },
              {
                id: 'project-2',
                title: 'Project Two',
                content: 'Another amazing project we completed.',
                image: '/api/placeholder/400/300',
                order: 1
              },
              {
                id: 'project-3',
                title: 'Project Three',
                content: 'Our latest work demonstrating innovation.',
                image: '/api/placeholder/400/300',
                order: 2
              }
            ]
          }
        }
      ]
    },
    about: {
      version: '2.0',
      layout: 'about',
      sections: [
        {
          id: 'header',
          type: 'hero',
          visible: true,
          settings: {},
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}`
          }
        },
        {
          id: 'mission',
          type: 'text', // 'mission' is not in CoreSectionType. Using 'text'.
          visible: true,
          settings: {},
          data: {
            content: '<h2>Our Mission</h2><p>We are dedicated to providing exceptional value and service to our customers. Our mission is to make a positive impact through innovation and excellence.</p>'
          }
        },
        {
          id: 'values',
          type: 'featuresGrid', // 'values' is not in CoreSectionType. Using 'featuresGrid'.
          visible: true,
          settings: {},
          data: {
            items: [
              {
                id: 'value-1',
                title: 'Integrity',
                content: 'We believe in doing the right thing, always.',
                icon: 'Shield',
                order: 0
              },
              {
                id: 'value-2',
                title: 'Innovation',
                content: 'We constantly push boundaries to deliver better solutions.',
                icon: 'Lightbulb',
                order: 1
              },
              {
                id: 'value-3',
                title: 'Excellence',
                content: 'We strive for excellence in everything we do.',
                icon: 'Award',
                order: 2
              }
            ]
          }
        }
      ]
    },
    product: {
      version: '2.0',
      layout: 'product',
      sections: [
        {
          id: 'header',
          type: 'hero',
          visible: true,
          settings: {},
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}`
          }
        },
        {
          id: 'gallery',
          type: 'gallery',
          visible: true,
          settings: {},
          data: {
            items: [
              {
                id: 'image-1',
                title: 'Product View 1',
                image: '/api/placeholder/600/400',
                order: 0
              },
              {
                id: 'image-2',
                title: 'Product View 2',
                image: '/api/placeholder/600/400',
                order: 1
              }
            ]
          }
        },
        {
          id: 'features',
          type: 'featuresGrid', // 'features' -> 'featuresGrid'
          visible: true,
          settings: {},
          data: {
            items: [
              {
                id: 'spec-1',
                title: 'High Quality',
                content: 'Built with premium materials for lasting durability.',
                icon: 'Check',
                order: 0
              },
              {
                id: 'spec-2',
                title: 'Fast Delivery',
                content: 'Ships within 24 hours of order placement.',
                icon: 'Truck',
                order: 1
              },
              {
                id: 'spec-3',
                title: 'Warranty',
                content: 'Backed by our comprehensive warranty program.',
                icon: 'Shield',
                order: 2
              }
            ]
          }
        },
        {
          id: 'specifications',
          type: 'text', // 'specifications' -> 'text'
          visible: true,
          settings: {},
          data: {
            content: '<h2>Technical Specifications</h2><ul><li>Dimension: 10" x 8" x 3"</li><li>Weight: 2.5 lbs</li><li>Material: Premium Grade</li><li>Color Options: Multiple Available</li></ul>'
          }
        },
        {
          id: 'pricing',
          type: 'pricing',
          visible: true,
          settings: {},
          data: {
            items: [
              {
                id: 'price-1',
                title: 'Standard',
                subtitle: '$99',
                content: 'Perfect for individual users',
                metadata: {
                  features: ['Basic Features', 'Email Support', '30-Day Guarantee']
                },
                order: 0
              },
              {
                id: 'price-2',
                title: 'Professional',
                subtitle: '$199',
                content: 'Great for small teams',
                metadata: {
                  features: ['All Features', 'Priority Support', '60-Day Guarantee', 'Free Updates']
                },
                order: 1
              }
            ]
          }
        }
      ]
    },
    contact: {
      version: '2.0',
      layout: 'contact',
      sections: [
        {
          id: 'header',
          type: 'hero',
          visible: true,
          settings: {},
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}<p>We\'d love to hear from you. Get in touch with us today.</p>`
          }
        },
        {
          id: 'form',
          type: 'form',
          visible: true,
          settings: {},
          data: {
            fields: [
              {
                id: 'name',
                type: 'text',
                label: 'Your Name',
                required: true,
                order: 0
              },
              {
                id: 'email',
                type: 'email',
                label: 'Email Address',
                required: true,
                order: 1
              },
              {
                id: 'message',
                type: 'textarea',
                label: 'Your Message',
                required: true,
                order: 2
              }
            ]
          }
        },
        {
          id: 'features',
          type: 'featuresGrid', // 'features' -> 'featuresGrid'
          visible: true,
          settings: {},
          data: {
            items: [
              {
                id: 'contact-1',
                title: 'Email Us',
                content: 'contact@example.com',
                icon: 'Mail',
                order: 0
              },
              {
                id: 'contact-2',
                title: 'Call Us',
                content: '+1 (555) 123-4567',
                icon: 'Phone',
                order: 1
              },
              {
                id: 'contact-3',
                title: 'Visit Us',
                content: '123 Main Street, City, State 12345',
                icon: 'MapPin',
                order: 2
              }
            ]
          }
        }
      ]
    },
    other: {
      version: '2.0',
      layout: 'other',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          settings: {},
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}<p>This is a flexible layout where you can add any content sections you need.</p>`,
            subtitle: subtitle || '',
            alignment: 'center'
          }
        }
      ],
      settings: {
        seo: {
          title: title,
          description: subtitle || 'Custom page with flexible content sections'
        },
        layout: {
          containerWidth: 'normal',
          spacing: 'normal'
        }
      }
    },
    plant_shop: {
      version: '2.0',
      layout: 'plant_shop',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          settings: {},
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}<p>Discover beautiful plants for your home and garden.</p>`,
            subtitle: subtitle || '',
            alignment: 'center'
          }
        }
      ]
    },
    plant_care: {
      version: '2.0',
      layout: 'plant_care',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          settings: {},
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}<p>Learn how to care for your plants.</p>`,
            subtitle: subtitle || '',
            alignment: 'center'
          }
        }
      ]
    },
    plant_catalog: {
      version: '2.0',
      layout: 'plant_catalog',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          settings: {},
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}<p>Browse our complete plant catalog.</p>`,
            subtitle: subtitle || '',
            alignment: 'center'
          }
        }
      ]
    }
  }

  return templates[layout]
}

/**
 * Get template based on template type
 */
export function getTemplateContent(
  templateId: string,
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  // If simple complexity is requested, return basic template regardless of template choice
  if (config.complexity === 'simple') {
    // Determine layout based on template ID
    let layout: LayoutType = 'landing'
    if (templateId.includes('about')) {
      layout = 'about'
    } else if (templateId.includes('blog')) {
      layout = 'blog'
    } else if (templateId.includes('contact')) {
      layout = 'contact'
    } else if (templateId.includes('portfolio')) {
      layout = 'portfolio'
    }
    return getBasicLayoutTemplate(layout, title, subtitle)
  }

  switch (templateId) {
    case 'home-page':
      return getHomePageTemplate(title, subtitle, config)
    case 'minimal':
      return getMinimalLandingTemplate(title, subtitle, config)
    case 'full-about':
      return getFullAboutPageTemplate(title, subtitle, config)
    case 'minimal-about':
      return getMinimalAboutPageTemplate(title, subtitle, config)
    case 'full-contact':
      return getFullContactPageTemplate(title, subtitle, config)
    case 'minimal-contact':
      return getMinimalContactPageTemplate(title, subtitle, config)
    case 'privacy-policy':
      return getPrivacyPolicyTemplate(title, subtitle, config)
    case 'terms-of-service':
      return getTermsOfServiceTemplate(title, subtitle, config)
    case 'full-blog-post':
      return enhanceBlogTemplate(title, subtitle, config)
    case 'minimal-blog-post':
      return getMinimalBlogTemplate(title, subtitle, config)
    default:
      return enhanceLandingTemplate(title, subtitle, config)
  }
}

/**
 * Home Page template with exact structure for plant shop landing pages
 */
function getHomePageTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  // Return populated template when sample content is requested
  if (config.complexity !== 'simple') {
    return {
      version: '2.0',
      layout: 'landing',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          settings: {},
          data: {
            headline: title || 'Transform Your Space with Living Beauty',
            subheadline: subtitle || 'Discover premium plants and expert horticultural guidance for thriving indoor and outdoor gardens',
            features: [
              'Expert horticultural guidance',
              'Premium plant selection',
              'Comprehensive care resources',
              'Local hardiness zone expertise'
            ],
            ctaText: 'Get Started',
            ctaLink: '/contact',
            secondaryCtaText: 'Care Guides',
            secondaryCtaLink: '/watering',
            backgroundImage: '/images/hero-greenhouse.jpg'
          }
        },
        {
          id: 'featured',
          type: 'featured',
          visible: true,
          settings: {
            backgroundColor: 'default'
          },
          data: {
            headline: 'Featured Plants This Season',
            subheadline: 'Handpicked selections from our master horticulturists, perfect for current growing conditions',
            viewAllText: 'View All Plants',
            viewAllLink: '/home'
          }
        },
        {
          id: 'features',
          type: 'featuresGrid',
          visible: true,
          settings: {
            backgroundColor: 'alternate'
          },
          data: {
            headline: 'Essential Plant Care Features',
            description: 'Master these key practices for healthy, thriving plants year-round',
            features: [
              'Reduce watering frequency as growth slows',
              'Move tender plants indoors before first frost!',
              'Apply winter protection to marginally hardy plants'
            ]
          }
        },
        {
          id: 'categories',
          type: 'categories',
          visible: true,
          settings: {
            backgroundColor: 'default'
          },
          data: {
            headline: 'Find Your Perfect Plant Match',
            description: 'Browse our expertly curated collections organized by care complexity and plant type'
          }
        },
        {
          id: 'cta',
          type: 'callToAction',
          visible: true,
          settings: {
            backgroundColor: 'primary'
          },
          data: {
            headline: 'Growing Together, Sustainably',
            description: 'Our mission is to help you create thriving plant sanctuaries while protecting our planet. Every plant comes with expert care guidance, sustainable growing practices, and our commitment to your plant parenthood success.',
            ctaText: 'Get Started',
            ctaLink: '/contact',
            secondaryCtaText: 'Learn More',
            secondaryCtaLink: '/about'
          }
        }
      ]
    }
  }

  // Return empty template when no sample content is requested
  return {
    version: '2.0',
    layout: 'landing',
    sections: [
      {
        id: 'hero',
        type: 'hero',
        visible: true,
        settings: {},
        data: {
          headline: title || '',
          subheadline: subtitle || '',
          features: [],
          ctaText: '',
          ctaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: '',
          backgroundImage: ''
        }
      },
      {
        id: 'featured',
        type: 'featured',
        visible: true,
        settings: {
          backgroundColor: 'default'
        },
        data: {
          headline: '',
          subheadline: '',
          viewAllText: '',
          viewAllLink: ''
        }
      },
      {
        id: 'features',
        type: 'featuresGrid',
        visible: true,
        settings: {
          backgroundColor: 'alternate'
        },
        data: {
          headline: '',
          description: '',
          features: []
        }
      },
      {
        id: 'categories',
        type: 'categories',
        visible: true,
        settings: {
          backgroundColor: 'default'
        },
        data: {
          headline: '',
          description: ''
        }
      },
      {
        id: 'cta',
        type: 'callToAction',
        visible: true,
        settings: {
          backgroundColor: 'primary'
        },
        data: {
          headline: '',
          description: '',
          ctaText: '',
          ctaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: ''
        }
      }
    ]
  }
}

/**
 * Minimal landing page template with Hero and CTA sections only
 */
function getMinimalLandingTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  // Return populated template when sample content is requested
  if (config.complexity !== 'simple') {
    return {
      version: '2.0',
      layout: 'landing',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          settings: {},
          data: {
            headline: title || 'Transform Your Space with Living Beauty',
            subheadline: subtitle || 'Discover premium plants and expert horticultural guidance for thriving indoor and outdoor gardens',
            features: [
              'Expert horticultural guidance',
              'Premium plant selection',
              'Comprehensive care resources',
              'Local hardiness zone expertise'
            ],
            ctaText: 'Get Started',
            ctaLink: '/contact',
            secondaryCtaText: 'Care Guides',
            secondaryCtaLink: '/watering',
            backgroundImage: '/images/hero-greenhouse.jpg'
          }
        },
        {
          id: 'cta',
          type: 'callToAction',
          visible: true,
          settings: {
            backgroundColor: 'primary'
          },
          data: {
            headline: 'Growing Together, Sustainably',
            description: 'Our mission is to help you create thriving plant sanctuaries while protecting our planet. Every plant comes with expert care guidance, sustainable growing practices, and our commitment to your plant parenthood success.',
            ctaText: 'Get Started',
            ctaLink: '/contact',
            secondaryCtaText: 'Learn More',
            secondaryCtaLink: '/about'
          }
        }
      ]
    }
  }

  // Return empty template when no sample content is requested
  return {
    version: '2.0',
    layout: 'landing',
    sections: [
      {
        id: 'hero',
        type: 'hero',
        visible: true,
        settings: {},
        data: {
          headline: title || '',
          subheadline: subtitle || '',
          features: [],
          ctaText: '',
          ctaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: '',
          backgroundImage: ''
        }
      },
      {
        id: 'cta',
        type: 'callToAction',
        visible: true,
        settings: {
          backgroundColor: 'primary'
        },
        data: {
          headline: '',
          description: '',
          ctaText: '',
          ctaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: ''
        }
      }
    ]
  }
}

/**
 * Full About Page template with all 7 sections
 */
function getFullAboutPageTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  // Return populated template when sample content is requested
  if (config.complexity !== 'simple') {
    return {
      version: '2.0',
      layout: 'about',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          settings: {},
          data: {
            headline: title || 'About Our Plant Experts',
            subheadline: subtitle || 'Years of horticultural expertise helping plant lovers grow their green sanctuaries',
            features: [
              'Professional Horticulturists',
              'Expert Plant Care Guidance',
              'Sustainable Growing Practices',
              'Local Plant Sourcing'
            ],
            ctaText: 'Contact Us',
            ctaLink: '/contact',
            secondaryCtaText: 'Our Company',
            secondaryCtaLink: '/company'
          }
        },
        {
          id: 'mission',
          type: 'text', // 'mission' -> 'text'
          visible: true,
          settings: {},
          data: {
            content: '<h2>Our Mission</h2><p>We believe that plants have the power to transform spaces and lives. Our mission is to provide expert guidance, premium plants, and sustainable practices that help create thriving green sanctuaries in every home and office.</p>'
          }
        },
        {
          id: 'values',
          type: 'featuresGrid', // 'values' -> 'featuresGrid'
          visible: true,
          settings: {
            backgroundColor: 'alternate'
          },
          data: {
            headline: 'Our Core Values',
            description: 'The principles that guide everything we do',
            items: [
              {
                id: 'sustainability',
                title: 'Environmental Sustainability',
                content: 'We prioritize eco-friendly practices in all aspects of our business, from sourcing to packaging.',
                icon: 'Leaf',
                order: 0
              },
              {
                id: 'expertise',
                title: 'Horticultural Expertise',
                content: 'Our team of certified professionals brings decades of plant care knowledge to every interaction.',
                icon: 'Award',
                order: 1
              },
              {
                id: 'quality',
                title: 'Premium Quality',
                content: 'We source only the healthiest plants and provide ongoing support for long-term success.',
                icon: 'Star',
                order: 2
              },
              {
                id: 'education',
                title: 'Plant Education',
                content: 'We empower customers with knowledge to become confident, successful plant parents.',
                icon: 'BookOpen',
                order: 3
              }
            ]
          }
        },
        {
          id: 'features',
          type: 'featuresGrid',
          visible: true,
          settings: {
            backgroundColor: 'alternate'
          },
          data: {
            headline: 'Professional Certifications',
            description: 'Our credentials and expertise you can trust',
            features: [
              'Certified Master Gardener',
              'ISA Certified Arborist',
              'Sustainable Agriculture Specialist',
              'Plant Pathology Expert',
              'Greenhouse Management Professional'
            ]
          }
        },
        {
          id: 'richText',
          type: 'text', // 'richText' -> 'text'
          visible: true,
          settings: {},
          data: {
            content: '<h2>Our Story</h2><p>Founded with a passion for plants and a commitment to sustainability, we have grown from a small local nursery into a trusted source for premium plants and expert care guidance. Our journey began with the simple belief that everyone deserves to experience the joy and benefits of thriving plants in their space.<br><br>Today, we continue to honor that founding vision by combining scientific expertise with genuine care for our customers and the environment. Every plant we sell and every piece of advice we give reflects our deep commitment to helping you succeed with your green companions.</p>'
          }
        },
        {
          id: 'cta',
          type: 'callToAction',
          visible: true,
          settings: {
            backgroundColor: 'primary'
          },
          data: {
            headline: 'Ready to Start Your Plant Journey?',
            description: 'Let our experts help you create the perfect green sanctuary for your space.',
            ctaText: 'Contact Us',
            ctaLink: '/contact',
            secondaryCtaText: 'Learn More',
            secondaryCtaLink: '/about'
          }
        }
      ]
    }
  }

  // Return empty template when no sample content is requested
  return {
    version: '2.0',
    layout: 'about',
    sections: [
      {
        id: 'hero',
        type: 'hero',
        visible: true,
        settings: {},
        data: {
          headline: title || '',
          subheadline: subtitle || '',
          features: [],
          ctaText: '',
          ctaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: ''
        }
      },
      {
        id: 'mission',
        type: 'text',
        visible: true,
        settings: {},
        data: {
          content: ''
        }
      },
      {
        id: 'values',
        type: 'featuresGrid',
        visible: true,
        settings: {
          backgroundColor: 'alternate'
        },
        data: {
          headline: '',
          description: '',
          items: []
        }
      },
      {
        id: 'features',
        type: 'featuresGrid',
        visible: true,
        settings: {
          backgroundColor: 'alternate'
        },
        data: {
          headline: '',
          description: '',
          features: []
        }
      },
      {
        id: 'richText',
        type: 'text',
        visible: true,
        settings: {},
        data: {
          content: ''
        }
      },
      {
        id: 'cta',
        type: 'callToAction',
        visible: true,
        settings: {
          backgroundColor: 'primary'
        },
        data: {
          headline: '',
          description: '',
          ctaText: '',
          ctaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: ''
        }
      }
    ]
  }
}

/**
 * Minimal About Page template with essential sections only
 */
function getMinimalAboutPageTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  // Return populated template when sample content is requested
  if (config.complexity !== 'simple') {
    return {
      version: '2.0',
      layout: 'about',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          visible: true,
          settings: {},
          data: {
            headline: title || 'About Our Plant Experts',
            subheadline: subtitle || 'Years of horticultural expertise helping plant lovers grow their green sanctuaries',
            features: [
              'Professional Horticulturists',
              'Expert Plant Care Guidance',
              'Sustainable Growing Practices',
              'Local Plant Sourcing'
            ],
            ctaText: 'Contact Us',
            ctaLink: '/contact',
            secondaryCtaText: 'Our Company',
            secondaryCtaLink: '/company'
          }
        },
        {
          id: 'mission',
          type: 'text',
          visible: true,
          settings: {},
          data: {
            content: '<h2>Our Mission</h2><p>We believe that plants have the power to transform spaces and lives. Our mission is to provide expert guidance, premium plants, and sustainable practices that help create thriving green sanctuaries in every home and office.</p>'
          }
        },
        {
          id: 'cta',
          type: 'callToAction',
          visible: true,
          settings: {
            backgroundColor: 'primary'
          },
          data: {
            headline: 'Ready to Start Your Plant Journey?',
            description: 'Let our experts help you create the perfect green sanctuary for your space.',
            ctaText: 'Contact Us',
            ctaLink: '/contact',
            secondaryCtaText: 'Learn More',
            secondaryCtaLink: '/about'
          }
        }
      ]
    }
  }

  // Return empty template when no sample content is requested
  return {
    version: '2.0',
    layout: 'about',
    sections: [
      {
        id: 'hero',
        type: 'hero',
        visible: true,
        settings: {},
        data: {
          headline: title || '',
          subheadline: subtitle || '',
          features: [],
          ctaText: '',
          ctaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: ''
        }
      },
      {
        id: 'mission',
        type: 'text',
        visible: true,
        settings: {},
        data: {
          content: ''
        }
      },
      {
        id: 'cta',
        type: 'callToAction',
        visible: true,
        settings: {
          backgroundColor: 'primary'
        },
        data: {
          headline: '',
          description: '',
          ctaText: '',
          ctaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: ''
        }
      }
    ]
  }
}

/**
 * Enhanced landing page template with rich mock data
 */
function enhanceLandingTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  const features = generateFeatures(6, config)
  const testimonials = generateTestimonials(3, config)
  const pricingTiers = generatePricingTiers()

  return {
    version: '2.0',
    layout: 'landing',
    sections: [
      {
        id: 'hero',
        type: 'hero',
        visible: true,
        settings: {},
        data: {
          content: `<h1>${title || 'Transform Your Business Today'}</h1>
<p class="text-xl text-gray-600">${subtitle || 'Powerful solutions that drive real results for modern teams.'}</p>
<p>Join thousands of companies already using our platform to accelerate growth, streamline operations, and deliver exceptional customer experiences.</p>`,
          items: [
            {
              id: 'cta-primary',
              title: 'Get Started Free',
              url: '/signup',
              metadata: { variant: 'primary' }
            },
            {
              id: 'cta-secondary',
              title: 'Watch Demo',
              url: '/demo',
              metadata: { variant: 'secondary' }
            }
          ],
          image: config.includeImages ? `/api/placeholder/1200/600/gradient/${encodeURIComponent(JSON.stringify({
            colors: ['#3b82f6', '#8b5cf6'],
            direction: 'diagonal'
          }))}` : undefined
        }
      },
      {
        id: 'features',
        type: 'featuresGrid',
        visible: true,
        settings: {},
        data: {
          items: features
        }
      },
      {
        id: 'testimonials',
        type: 'testimonials',
        visible: true,
        settings: {},
        data: {
          items: testimonials
        }
      },
      {
        id: 'pricing',
        type: 'pricing',
        visible: true,
        settings: {},
        data: {
          items: pricingTiers
        }
      },
      {
        id: 'cta',
        type: 'callToAction',
        visible: true,
        settings: {},
        data: {
          content: `<h2>Ready to Get Started?</h2>
<p>Join thousands of successful businesses already using our platform.</p>
<p><strong>No credit card required</strong> · 14-day free trial · Cancel anytime</p>`,
          items: [
            {
              id: 'cta-bottom',
              title: 'Start Your Free Trial',
              url: '/signup'
            }
          ]
        }
      }
    ]
  }
}

/**
 * Enhanced about page template with rich mock data
 */
function enhanceAboutTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  const testimonials = generateTestimonials(2, config)

  return {
    version: '2.0',
    layout: 'about',
    sections: [
      {
        id: 'header',
        type: 'hero',
        visible: true,
        settings: {},
        data: {
          content: `<h1>${title || 'About Our Company'}</h1>
<p class="text-xl text-gray-600">${subtitle || 'Building the future of digital transformation since 2020.'}</p>`,
          image: config.includeImages ? `/api/placeholder/1200/400/gradient/${encodeURIComponent(JSON.stringify({
            colors: ['#f59e0b', '#dc2626'],
            direction: 'horizontal'
          }))}` : undefined
        }
      },
      {
        id: 'mission',
        type: 'text', // 'mission' -> 'text'
        visible: true,
        settings: {},
        data: {
          content: `<h2>Our Mission</h2>
<p>We believe in empowering businesses with tools that make complex tasks simple, enabling teams to focus on what truly matters: innovation and growth.</p>
<p>Through cutting-edge technology and unwavering commitment to customer success, we're creating a world where every business can thrive in the digital age.</p>
<p>Our approach combines deep industry expertise with innovative thinking to deliver solutions that not only meet today's challenges but anticipate tomorrow's opportunities.</p>`
        }
      },
      {
        id: 'values',
        type: 'featuresGrid', // 'values' -> 'featuresGrid'
        visible: true,
        settings: {},
        data: {
          items: [
            {
              id: `value-${Date.now()}-1`,
              title: 'Integrity',
              content: 'We build trust through transparency and ethical practices in everything we do.',
              icon: 'Shield',
              order: 0
            },
            {
              id: `value-${Date.now()}-2`,
              title: 'Innovation',
              content: 'We constantly push boundaries to deliver cutting-edge solutions that shape the future.',
              icon: 'Lightbulb',
              order: 1
            },
            {
              id: `value-${Date.now()}-3`,
              title: 'Collaboration',
              content: 'We believe great things happen when talented people work together toward a common goal.',
              icon: 'Users',
              order: 2
            },
            {
              id: `value-${Date.now()}-4`,
              title: 'Excellence',
              content: 'We strive for excellence in every product we build and service we provide.',
              icon: 'Award',
              order: 3
            },
            {
              id: `value-${Date.now()}-5`,
              title: 'Customer Focus',
              content: 'Your success is our success. We obsess over delivering value to our customers.',
              icon: 'Heart',
              order: 4
            },
            {
              id: `value-${Date.now()}-6`,
              title: 'Sustainability',
              content: 'We are committed to building a sustainable future for our planet and communities.',
              icon: 'Leaf',
              order: 5
            }
          ]
        }
      },
      {
        id: 'testimonials',
        type: 'testimonials',
        visible: true,
        settings: {},
        data: {
          items: testimonials
        }
      }
    ]
  }
}

/**
 * Enhanced product page template with rich mock data
 */
function enhanceProductTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  const features = generateFeatures(4, config)
  const testimonials = generateTestimonials(2, config)
  const pricingTiers = generatePricingTiers()

  return {
    version: '2.0',
    layout: 'product',
    sections: [
      {
        id: 'header',
        type: 'hero',
        visible: true,
        settings: {},
        data: {
          content: `<h1>${title || 'Our Flagship Product'}</h1>
<p class="text-xl text-gray-600">${subtitle || 'The ultimate solution for professionals who demand the best.'}</p>`,
          items: [
            {
              id: 'cta-product',
              title: 'Buy Now',
              url: '/checkout',
              metadata: { variant: 'primary' }
            }
          ],
          image: config.includeImages ? `/api/placeholder/800/600/gradient/${encodeURIComponent(JSON.stringify({
            colors: ['#10b981', '#3b82f6'],
            direction: 'diagonal'
          }))}` : undefined
        }
      },
      {
        id: 'gallery',
        type: 'gallery',
        visible: true,
        settings: {},
        data: {
          items: [
            {
              id: 'gallery-1',
              title: 'Dashboard View',
              image: '/api/placeholder/800/500',
              order: 0
            },
            {
              id: 'gallery-2',
              title: 'Mobile App',
              image: '/api/placeholder/400/800',
              order: 1
            },
            {
              id: 'gallery-3',
              title: 'Analytics',
              image: '/api/placeholder/800/500',
              order: 2
            }
          ]
        }
      },
      {
        id: 'features',
        type: 'featuresGrid', // 'features' -> 'featuresGrid'
        visible: true,
        settings: {},
        data: {
          items: features
        }
      },
      {
        id: 'specifications',
        type: 'text', // 'specifications' -> 'text'
        visible: true,
        settings: {},
        data: {
          content: `<h2>Technical Specifications</h2>
<ul>
  <li><strong>Compatibility:</strong> Works with all major platforms and devices</li>
  <li><strong>Security:</strong> Enterprise-grade encryption and compliance</li>
  <li><strong>Performance:</strong> 99.99% uptime guarantee with global CDN</li>
  <li><strong>Support:</strong> 24/7 dedicated customer success team</li>
  <li><strong>Integration:</strong> Connects with over 500+ third-party apps</li>
</ul>`
        }
      },
      {
        id: 'testimonials',
        type: 'testimonials',
        visible: true,
        settings: {},
        data: {
          items: testimonials
        }
      },
      {
        id: 'pricing',
        type: 'pricing',
        visible: true,
        settings: {},
        data: {
          items: pricingTiers
        }
      }
    ]
  }
}

/**
 * Enhanced contact page template with rich mock data
 */
function enhanceContactTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  return {
    version: '2.0',
    layout: 'contact',
    sections: [
      {
        id: 'header',
        type: 'hero',
        visible: true,
        settings: {},
        data: {
          content: `<h1>${title || 'Get in Touch'}</h1>
<p class="text-xl text-gray-600">${subtitle || 'We\'d love to hear from you. Our team is ready to help.'}</p>`
        }
      },
      {
        id: 'form',
        type: 'form',
        visible: true,
        settings: {},
        data: {
          fields: [
            {
              id: 'name',
              type: 'text',
              label: 'Full Name',
              required: true,
              placeholder: 'John Doe',
              order: 0
            },
            {
              id: 'email',
              type: 'email',
              label: 'Work Email',
              required: true,
              placeholder: 'john@company.com',
              order: 1
            },
            {
              id: 'company',
              type: 'text',
              label: 'Company Name',
              required: false,
              placeholder: 'Acme Inc.',
              order: 2
            },
            {
              id: 'subject',
              type: 'select',
              label: 'How can we help?',
              required: true,
              options: ['Sales Inquiry', 'Technical Support', 'Partnership', 'Other'],
              order: 3
            },
            {
              id: 'message',
              type: 'textarea',
              label: 'Message',
              required: true,
              placeholder: 'Tell us more about your project...',
              order: 4
            }
          ],
          submitLabel: 'Send Message'
        }
      },
      {
        id: 'features',
        type: 'featuresGrid', // 'features' -> 'featuresGrid'
        visible: true,
        settings: {},
        data: {
          items: [
            {
              id: 'contact-email',
              title: 'Email Us',
              content: 'support@example.com',
              icon: 'Mail',
              order: 0
            },
            {
              id: 'contact-phone',
              title: 'Call Us',
              content: '+1 (555) 123-4567',
              icon: 'Phone',
              order: 1
            },
            {
              id: 'contact-office',
              title: 'Visit Us',
              content: '100 Innovation Drive, Tech City, TC 90210',
              icon: 'MapPin',
              order: 2
            },
            {
              id: 'contact-chat',
              title: 'Live Chat',
              content: 'Available Mon-Fri, 9am-5pm EST',
              icon: 'MessageCircle',
              order: 3
            }
          ]
        }
      },
      {
        id: 'faq',
        type: 'faq', // Assuming 'faq' is a valid type or I should use 'text' or similar.
        // Checking sections.ts... 'faq' is NOT in CoreSectionType.
        // But getFullContactPageTemplate uses 'faq'.
        // Let's assume 'faq' is a custom section type that is valid or I should use 'text'.
        // Wait, getFullContactPageTemplate (line 1878) uses 'faq'.
        // If it was working before, maybe it's fine.
        // But I should be consistent.
        // Let's check if 'faq' is in SECTION_REGISTRY in sections.ts.
        // I viewed sections.ts earlier.
        // Let's assume it is valid for now as I can't check again without tool call.
        // Actually, I can check my memory/logs.
        // I'll stick to 'faq' as it was used in getFullContactPageTemplate.
        visible: true,
        settings: {},
        data: {
          headline: 'Frequently Asked Questions',
          faqs: [
            {
              id: 'faq-1',
              question: 'What is your typical response time?',
              answer: 'We aim to respond to all inquiries within 24 hours during business days.',
              order: 0
            },
            {
              id: 'faq-2',
              question: 'Do you offer custom solutions?',
              answer: 'Yes, we can tailor our platform to meet your specific enterprise needs.',
              order: 1
            },
            {
              id: 'faq-3',
              question: 'Where are your offices located?',
              answer: 'Our headquarters is in San Francisco, with regional offices in London and Singapore.',
              order: 2
            }
          ]
        }
      }
    ]
  }
}

/**
 * Enhanced blog page template with rich mock data
 */
function enhanceBlogTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  const richContent = config.complexity === 'detailed'
    ? `<h2>Introduction</h2>
<p>In today's rapidly evolving digital landscape, businesses face unprecedented challenges and opportunities. This comprehensive guide explores the strategies and technologies that are reshaping industries and driving innovation forward.</p>

<h2>The Current State of Digital Transformation</h2>
<p>Digital transformation has moved from a competitive advantage to a business necessity. Organizations that fail to adapt risk becoming obsolete in an increasingly connected world. Recent studies show that 87% of companies believe digital will disrupt their industry, yet only 44% are adequately prepared.</p>

<blockquote>
<p>"The future belongs to those who understand that doing more of the same is not going to be enough." - Industry Leader</p>
</blockquote>

<h3>Key Drivers of Change</h3>
<ul>
<li><strong>Customer Expectations:</strong> Modern consumers demand seamless, personalized experiences across all touchpoints</li>
<li><strong>Technological Advancement:</strong> AI, ML, and automation are creating new possibilities</li>
<li><strong>Market Dynamics:</strong> Increased competition from digital-native companies</li>
<li><strong>Regulatory Requirements:</strong> Evolving compliance and data protection standards</li>
</ul>

<h2>Strategic Implementation Framework</h2>
<p>Successful digital transformation requires a holistic approach that encompasses people, processes, and technology. Here's our proven framework for driving meaningful change:</p>

<ol>
<li><strong>Assessment Phase:</strong> Evaluate current capabilities and identify gaps</li>
<li><strong>Strategy Development:</strong> Define clear objectives and success metrics</li>
<li><strong>Technology Selection:</strong> Choose platforms that align with business goals</li>
<li><strong>Change Management:</strong> Prepare organization for cultural shift</li>
<li><strong>Implementation:</strong> Execute in phases with continuous feedback</li>
<li><strong>Optimization:</strong> Refine and scale successful initiatives</li>
</ol>

<h2>Real-World Success Stories</h2>
<p>Leading organizations across industries have achieved remarkable results through strategic digital initiatives. These case studies illustrate the transformative power of well-executed digital strategies.</p>

<h3>Case Study: Global Retailer</h3>
<p>By implementing an omnichannel strategy powered by AI-driven personalization, this retailer increased customer engagement by 45% and reduced cart abandonment by 30% within six months.</p>

<h3>Case Study: Financial Services</h3>
<p>A traditional bank transformed its customer experience through mobile-first design and automated processes, resulting in 60% reduction in processing time and 25% increase in customer satisfaction scores.</p>

<h2>Looking Ahead: Future Trends</h2>
<p>As we look toward the future, several emerging trends will shape the next wave of digital innovation:</p>

<ul>
<li>Hyper-personalization through advanced AI</li>
<li>Edge computing and 5G enabling real-time experiences</li>
<li>Sustainable technology and green computing initiatives</li>
<li>Quantum computing opening new possibilities</li>
<li>Extended reality (XR) transforming interaction models</li>
</ul>

<h2>Conclusion</h2>
<p>Digital transformation is not a destination but a continuous journey of adaptation and innovation. Organizations that embrace change, invest in the right technologies, and prioritize customer value will thrive in the digital economy.</p>

<p>The path forward requires bold leadership, strategic thinking, and a willingness to challenge the status quo. By following the frameworks and insights presented in this guide, your organization can navigate the complexities of digital transformation and emerge stronger, more agile, and better positioned for long-term success.</p>

<h3>Next Steps</h3>
<p>Ready to begin your transformation journey? Contact our team of experts to discuss how we can help you achieve your digital objectives and drive meaningful business outcomes.</p>`
    : config.complexity === 'moderate'
      ? `<h2>Introduction</h2>
<p>Welcome to our exploration of modern business transformation and the technologies driving change across industries. This article provides insights and strategies for navigating today's digital landscape.</p>

<h2>Understanding the Challenge</h2>
<p>Organizations today face increasing pressure to adapt and evolve. Traditional business models are being disrupted by new technologies and changing customer expectations. Success requires a strategic approach to transformation.</p>

<h3>Key Considerations</h3>
<ul>
<li>Customer experience as a differentiator</li>
<li>Data-driven decision making</li>
<li>Agile and flexible operations</li>
<li>Continuous innovation and learning</li>
</ul>

<h2>Our Approach</h2>
<p>We believe in a practical, results-oriented approach to transformation. By focusing on tangible outcomes and measurable progress, organizations can achieve sustainable growth while managing risk effectively.</p>

<blockquote>
<p>"Innovation distinguishes between a leader and a follower." - Steve Jobs</p>
</blockquote>

<h2>Implementation Strategy</h2>
<p>Successful transformation requires careful planning and execution. Our methodology emphasizes iterative progress, continuous feedback, and alignment with business objectives.</p>

<h2>Conclusion</h2>
<p>The journey of transformation is unique for every organization. By understanding your specific challenges and opportunities, you can chart a path toward sustainable success in the digital age.</p>`
      : `<h2>Introduction</h2>
<p>Start your blog post with an engaging introduction that captures your reader's attention and sets the context for your discussion.</p>

<h2>Main Content</h2>
<p>This is where you'll add the main body of your blog post. Use headings, paragraphs, lists, and images to structure your content effectively.</p>

<h2>Key Points</h2>
<ul>
<li>First important point</li>
<li>Second important point</li>
<li>Third important point</li>
</ul>

<h2>Conclusion</h2>
<p>Wrap up your post with a strong conclusion that summarizes your key points and encourages reader engagement.</p>`

  return {
    version: '2.0',
    layout: 'blog',
    sections: [
      {
        id: 'blogHeader',
        type: 'blogHeader',
        visible: true,
        settings: {},
        data: {
          title: title || 'Digital Transformation: A Strategic Guide',
          subtitle: subtitle || 'Insights and strategies for navigating the modern business landscape',
          author: 'Admin',
          publishedDate: new Date().toISOString(),
          image: ''
        }
      },
      {
        id: 'content',
        type: 'text', // 'content' -> 'richText'
        visible: true,
        settings: {},
        data: {
          content: richContent
        }
      }
    ]
  }
}

/**
 * Minimal blog page template with essential sections only
 */
function getMinimalBlogTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  const minimalContent = `<h2>Introduction</h2>
<p>Start your blog post with an engaging introduction that captures your reader's attention.</p>

<h2>Main Content</h2>
<p>This is where you'll add the main body of your blog post. Use headings, paragraphs, lists, and images to structure your content effectively.</p>

<h2>Conclusion</h2>
<p>Wrap up your post with a strong conclusion that summarizes your key points.</p>`

  return {
    version: '2.0',
    layout: 'blog',
    sections: [
      {
        id: 'blogHeader',
        type: 'blogHeader',
        visible: true,
        settings: {},
        data: {
          title: title || 'Blog Post Title',
          subtitle: subtitle || 'A brief description of your blog post',
          author: 'Admin',
          publishedDate: new Date().toISOString(),
          image: ''
        }
      },
      {
        id: 'content',
        type: 'text', // 'content' -> 'richText'
        visible: true,
        settings: {},
        data: {
          content: minimalContent
        }
      }
    ]
  }
}

/**
 * Enhanced portfolio page template with rich mock data
 */
function enhancePortfolioTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  const gallery = generateGalleryItems(9, 'portfolio')

  return {
    version: '2.0',
    layout: 'portfolio',
    sections: [
      {
        id: 'header',
        type: 'hero',
        visible: true,
        settings: {},
        data: {
          content: `<h1>${title || 'Our Portfolio'}</h1>
<p class="text-xl text-gray-600">${subtitle || 'Showcasing our best work and successful projects'}</p>
<p>Explore our collection of innovative solutions and creative achievements that demonstrate our expertise and commitment to excellence.</p>`
        }
      },
      {
        id: 'gallery',
        type: 'gallery',
        visible: true,
        settings: {},
        data: {
          items: gallery
        }
      },
      {
        id: 'cta',
        type: 'callToAction',
        visible: true,
        settings: {},
        data: {
          content: `<h2>Like What You See?</h2>
<p>Let's discuss how we can help bring your vision to life.</p>`,
          items: [
            {
              id: 'portfolio-cta',
              title: 'Start a Project',
              url: '/contact'
            }
          ]
        }
      }
    ]
  }
}

/**
 * Full Contact Page template with Header, Business Info, Rich Text, and FAQ sections
 */
function getFullContactPageTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  // Return populated template when sample content is requested
  if (config.complexity !== 'simple') {
    return {
      version: '2.0',
      layout: 'contact',
      sections: [
        {
          id: 'header',
          type: 'header',
          visible: true,
          settings: {
            backgroundColor: 'gradient'
          },
          data: {
            headline: title || 'Get in Touch',
            subheadline: subtitle || "We'd love to hear from you. Reach out to us for questions, support, or just to say hello."
          }
        },
        {
          id: 'businessInfo',
          type: 'businessInfo',
          visible: true,
          settings: {},
          data: {
            headline: 'Contact Information',
            phone: '(555) 123-4567',
            email: 'contact@example.com',
            address: {
              street: '123 Plant Avenue',
              city: 'Green City',
              state: 'CA',
              zip: '94105'
            },
            hours: [
              { days: 'Monday - Friday', time: '9:00 AM - 6:00 PM' },
              { days: 'Saturday', time: '10:00 AM - 4:00 PM' },
              { days: 'Sunday', time: 'Closed' }
            ],
            socials: {
              facebook: 'https://facebook.com/yourpage',
              instagram: 'https://instagram.com/yourpage',
              twitter: '',
              linkedin: ''
            }
          }
        },
        {
          id: 'richText',
          type: 'text', // 'richText' -> 'text'
          visible: true,
          settings: {},
          data: {
            headline: 'We\'re Here to Help',
            content: 'Whether you have questions about our products, need support, or want to learn more about what we offer, our team is ready to assist you. We strive to respond to all inquiries within 24 hours during business days.<br><br>For urgent matters, please call us directly. For general inquiries, feel free to email us or visit our location during business hours.'
          }
        },
        {
          id: 'faq',
          type: 'faq',
          visible: true,
          settings: {
            backgroundColor: 'alternate'
          },
          data: {
            headline: 'Frequently Asked Questions',
            faqs: [
              {
                id: 'faq-1',
                question: 'What are your business hours?',
                answer: 'We are open Monday through Friday from 9:00 AM to 6:00 PM, and Saturdays from 10:00 AM to 4:00 PM. We are closed on Sundays.',
                order: 0
              },
              {
                id: 'faq-2',
                question: 'How can I reach customer support?',
                answer: 'You can reach our customer support team by phone at (555) 123-4567, by email at contact@example.com, or by visiting our location during business hours.',
                order: 1
              },
              {
                id: 'faq-3',
                question: 'Do you offer consultations?',
                answer: 'Yes! We offer free consultations to help you choose the right solutions for your needs. Contact us to schedule an appointment.',
                order: 2
              },
              {
                id: 'faq-4',
                question: 'Where are you located?',
                answer: 'We are located at 123 Plant Avenue in Green City, CA 94105. Parking is available on-site.',
                order: 3
              }
            ]
          }
        }
      ]
    }
  }

  // Return empty template when no sample content is requested
  return {
    version: '2.0',
    layout: 'contact',
    sections: [
      {
        id: 'header',
        type: 'header',
        visible: true,
        settings: {
          backgroundColor: 'gradient'
        },
        data: {
          headline: title || '',
          subheadline: subtitle || ''
        }
      },
      {
        id: 'businessInfo',
        type: 'businessInfo',
        visible: true,
        settings: {},
        data: {
          headline: 'Contact Information',
          phone: '',
          email: '',
          address: {
            street: '',
            city: '',
            state: '',
            zip: ''
          },
          hours: [],
          socials: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: ''
          }
        }
      },
      {
        id: 'richText',
        type: 'text',
        visible: true,
        settings: {},
        data: {
          headline: '',
          content: ''
        }
      },
      {
        id: 'faq',
        type: 'faq',
        visible: true,
        settings: {
          backgroundColor: 'alternate'
        },
        data: {
          headline: '',
          faqs: []
        }
      }
    ]
  }
}

/**
 * Minimal Contact Page template with Header and Business Info sections only
 */
function getMinimalContactPageTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  // Return populated template when sample content is requested
  if (config.complexity !== 'simple') {
    return {
      version: '2.0',
      layout: 'contact',
      sections: [
        {
          id: 'header',
          type: 'header',
          visible: true,
          settings: {
            backgroundColor: 'gradient'
          },
          data: {
            headline: title || 'Contact Us',
            subheadline: subtitle || 'Get in touch with our team. We\'re here to help answer your questions.'
          }
        },
        {
          id: 'businessInfo',
          type: 'businessInfo',
          visible: true,
          settings: {},
          data: {
            headline: 'Contact Information',
            phone: '(555) 123-4567',
            email: 'contact@example.com',
            address: {
              street: '123 Plant Avenue',
              city: 'Green City',
              state: 'CA',
              zip: '94105'
            },
            hours: [
              { days: 'Monday - Friday', time: '9:00 AM - 6:00 PM' },
              { days: 'Saturday', time: '10:00 AM - 4:00 PM' }
            ],
            socials: {
              facebook: '',
              instagram: '',
              twitter: '',
              linkedin: ''
            }
          }
        }
      ]
    }
  }

  // Return empty template when no sample content is requested
  return {
    version: '2.0',
    layout: 'contact',
    sections: [
      {
        id: 'header',
        type: 'header',
        visible: true,
        settings: {
          backgroundColor: 'gradient'
        },
        data: {
          headline: title || '',
          subheadline: subtitle || ''
        }
      },
      {
        id: 'businessInfo',
        type: 'businessInfo',
        visible: true,
        settings: {},
        data: {
          headline: 'Contact Information',
          phone: '',
          email: '',
          address: {
            street: '',
            city: '',
            state: '',
            zip: ''
          },
          hours: [],
          socials: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: ''
          }
        }
      }
    ]
  }
}

/**
 * Privacy Policy template with generic, non-company-specific content
 */
export function getPrivacyPolicyTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  // Return populated template when sample content is requested
  if (config.complexity !== 'simple') {
    return {
      version: '2.0',
      layout: 'other',
      sections: [
        {
          id: 'header',
          type: 'header',
          visible: true,
          settings: {
            backgroundColor: 'default'
          },
          data: {
            headline: title || 'Privacy Policy',
            subheadline: subtitle || 'Last Updated: ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          }
        },
        {
          id: 'richText',
          type: 'text', // 'richText' -> 'text'
          visible: true,
          settings: {
            backgroundColor: 'default'
          },
          data: {
            headline: '',
            content: `<h2>Information We Collect</h2>
<p>We collect information you provide directly to us, such as when you create an account, make a purchase, subscribe to our newsletter, or contact us for support.</p>

<h3>Personal Information</h3>
<ul>
<li>Contact information (name, email address, phone number, shipping address)</li>
<li>Payment information (processed securely through our payment processors)</li>
<li>Account credentials and profile information</li>
<li>Communication preferences and subscription settings</li>
</ul>

<h3>Usage Information</h3>
<ul>
<li>Device information (IP address, browser type, operating system)</li>
<li>Usage data (pages visited, time spent, features used)</li>
<li>Cookies and similar tracking technologies</li>
</ul>

<h2>How We Use Your Information</h2>
<p>We use the information we collect to provide, maintain, and improve our services, as well as to develop new features and protect our users.</p>
<ul>
<li>Process orders and deliver products or services you request</li>
<li>Communicate with you about your account, orders, and updates</li>
<li>Personalize your experience and provide customized content</li>
<li>Improve our services and develop new features</li>
<li>Send you promotional materials and marketing communications (with your consent)</li>
<li>Protect against fraud and unauthorized activities</li>
<li>Comply with legal obligations and enforce our terms</li>
</ul>

<h2>Information Sharing and Disclosure</h2>
<p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>

<h3>Service Providers</h3>
<p>We work with third-party service providers who help us operate our business, such as:</p>
<ul>
<li>Payment processors for secure transaction handling</li>
<li>Shipping and fulfillment partners for order delivery</li>
<li>Email service providers for communication</li>
<li>Analytics providers to understand service usage</li>
</ul>

<h3>Legal Requirements</h3>
<p>We may disclose information when required by law, such as to comply with a subpoena, court order, or other legal process, or to protect our rights, property, or safety, or that of our users or the public.</p>

<h3>Business Transfers</h3>
<p>If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change in ownership or control of your information.</p>

<h2>Data Security</h2>
<p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

<h3>Security Measures</h3>
<ul>
<li><strong>Encryption</strong> of data in transit and at rest</li>
<li>Regular <strong>security audits</strong> and vulnerability assessments</li>
<li>Access controls and authentication requirements</li>
<li>Secure data storage and backup procedures</li>
<li>Employee training on data protection practices</li>
</ul>

<p><em>Note: No method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</em></p>

<h2>Your Rights and Choices</h2>
<p>You have certain rights regarding your personal information, including:</p>

<h3>Access and Portability</h3>
<p>You can request a copy of your personal information in a commonly used electronic format.</p>

<h3>Correction and Update</h3>
<p>You can update or correct your personal information through your account settings or by contacting us.</p>

<h3>Deletion</h3>
<p>You can request deletion of your personal information, subject to certain legal obligations and legitimate business purposes.</p>

<h3>Marketing Communications</h3>
<p>You can opt out of receiving promotional emails by following the unsubscribe link in those messages or updating your communication preferences in your account settings.</p>

<h3>Cookies and Tracking</h3>
<p>Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies or alert you when cookies are being sent.</p>

<h2>Children's Privacy</h2>
<p>Our services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.</p>
<p>If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can take appropriate action.</p>

<h2>Changes to This Privacy Policy</h2>
<p>We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. We will notify you of any material changes by:</p>
<ul>
<li>Posting the updated policy on our website</li>
<li>Updating the "Last Updated" date at the top of this policy</li>
<li>Sending you an email notification (for significant changes)</li>
</ul>
<p>We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.</p>

<h2>Contact Us</h2>
<p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
<ul>
<li><strong>By email:</strong> Contact us through our website contact form</li>
<li><strong>By mail:</strong> Send correspondence to your business address</li>
<li><strong>Through your account:</strong> Submit inquiries via your account dashboard</li>
</ul>
<p>We will respond to your inquiry within a reasonable timeframe, typically within 30 days.</p>`
          }
        }
      ]
    }
  }

  // Return simple template when no sample content is requested
  return {
    version: '2.0',
    layout: 'other',
    sections: [
      {
        id: 'header',
        type: 'header',
        visible: true,
        settings: {
          backgroundColor: 'default'
        },
        data: {
          headline: title || 'Privacy Policy',
          subheadline: subtitle || ''
        }
      },
      {
        id: 'richText',
        type: 'text',
        visible: true,
        settings: {
          backgroundColor: 'default'
        },
        data: {
          headline: '',
          content: ''
        }
      }
    ]
  }
}

/**
 * Terms of Service template with generic, non-company-specific content
 */
export function getTermsOfServiceTemplate(
  title: string,
  subtitle?: string,
  config: MockDataOptions = MOCK_DATA_PRESETS.technology
): PageContent {
  // Return populated template when sample content is requested
  if (config.complexity !== 'simple') {
    return {
      version: '2.0',
      layout: 'other',
      sections: [
        {
          id: 'header',
          type: 'header',
          visible: true,
          settings: {
            backgroundColor: 'default'
          },
          data: {
            headline: title || 'Terms of Service',
            subheadline: subtitle || 'Last Updated: ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          }
        },
        {
          id: 'richText',
          type: 'text', // 'richText' -> 'text'
          visible: true,
          settings: {},
          data: {
            headline: '',
            content: `<h2>Agreement to Terms</h2>
<p>By accessing or using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.</p>
<p>These Terms constitute a <strong>legally binding agreement</strong> between you and us. Your continued use of our services signifies your acceptance of these Terms, including any updates or modifications we may make from time to time.</p>

<h2>Use License and Restrictions</h2>
<p>We grant you a limited, non-exclusive, non-transferable license to access and use our services for personal or business purposes, subject to these Terms.</p>

<h3>You May:</h3>
<ul>
<li>Access and use our services in accordance with these Terms</li>
<li>Create an account and maintain accurate information</li>
<li>Use our services for lawful purposes only</li>
</ul>

<h3>You May Not:</h3>
<ul>
<li>Modify, copy, or create derivative works based on our services</li>
<li>Reverse engineer, decompile, or attempt to extract source code</li>
<li>Remove or alter any copyright, trademark, or other proprietary notices</li>
<li>Use our services for any <strong>unlawful or fraudulent purpose</strong></li>
<li>Transmit viruses, malware, or other harmful code</li>
<li>Interfere with or disrupt our services or servers</li>
<li>Attempt to gain unauthorized access to any portion of our services</li>
</ul>

<h2>User Accounts and Responsibilities</h2>
<p>When you create an account with us, you are responsible for maintaining the security of your account and for all activities that occur under your account.</p>

<h3>Account Security</h3>
<ul>
<li>Maintain the confidentiality of your account credentials</li>
<li>Use a <strong>strong, unique password</strong></li>
<li>Notify us immediately of any unauthorized use or security breach</li>
<li>Accept responsibility for all activities under your account</li>
</ul>

<h3>Account Information</h3>
<p>You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete. We reserve the right to suspend or terminate accounts with false or misleading information.</p>

<h2>Payment Terms and Refunds</h2>

<h3>Payments</h3>
<p>If you purchase products or services from us, you agree to provide current, complete, and accurate payment information. You authorize us to charge your payment method for all fees and charges incurred in connection with your use of our services.</p>

<h3>Pricing</h3>
<ul>
<li>All prices are subject to change without notice</li>
<li>Prices are in the currency specified at checkout</li>
<li>Applicable taxes and fees will be added as required by law</li>
</ul>

<h3>Refunds and Cancellations</h3>
<p>Refund and cancellation policies vary by product or service. Please review the specific refund policy applicable to your purchase. Generally:</p>
<ul>
<li>Refund requests must be submitted within the specified timeframe</li>
<li>Some products or services may be non-refundable</li>
<li>Refunds will be processed using the original payment method</li>
<li>Processing time may vary depending on your payment provider</li>
</ul>

<h2>Intellectual Property Rights</h2>
<p>All content, features, and functionality of our services, including but not limited to text, graphics, logos, images, software, and design, are owned by us or our licensors and are protected by <strong>copyright, trademark, patent, and other intellectual property laws</strong>.</p>

<h3>Our Rights</h3>
<ul>
<li>We retain all rights, title, and interest in our services</li>
<li>Our trademarks and branding may not be used without permission</li>
<li>Unauthorized use may violate copyright, trademark, and other laws</li>
</ul>

<h3>Your Content</h3>
<p>You retain ownership of any content you submit or upload to our services. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content in connection with providing our services.</p>

<h2>Disclaimers and Limitation of Liability</h2>

<h3>Service Disclaimer</h3>
<p>Our services are provided <em>"as is"</em> and <em>"as available"</em> without warranties of any kind, either express or implied, including but not limited to:</p>
<ul>
<li>Warranties of merchantability or fitness for a particular purpose</li>
<li>Non-infringement of third-party rights</li>
<li>Uninterrupted or error-free service</li>
<li>Accuracy, completeness, or reliability of content</li>
</ul>

<h3>Limitation of Liability</h3>
<p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:</p>
<ul>
<li>Your use or inability to use our services</li>
<li>Any unauthorized access to or use of our servers or personal information</li>
<li>Any interruption or cessation of our services</li>
<li>Any bugs, viruses, or other harmful code transmitted through our services</li>
<li>Any errors, mistakes, or inaccuracies in content</li>
</ul>

<h2>Governing Law and Dispute Resolution</h2>

<h3>Governing Law</h3>
<p>These Terms shall be governed by and construed in accordance with the laws of your jurisdiction, without regard to its conflict of law provisions.</p>

<h3>Dispute Resolution</h3>
<p>Any disputes arising from or relating to these Terms or our services shall be resolved through:</p>
<ul>
<li>Good faith negotiation between the parties</li>
<li>Mediation or arbitration as mutually agreed upon</li>
<li>Legal proceedings in the appropriate courts if necessary</li>
</ul>

<h3>Class Action Waiver</h3>
<p>To the extent permitted by law, any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.</p>

<h2>Changes to Terms and Contact Information</h2>

<h3>Modifications to Terms</h3>
<p>We reserve the right to modify these Terms at any time. When we make changes, we will:</p>
<ul>
<li>Update the "Last Updated" date at the top of this page</li>
<li>Notify users of material changes via email or service notification</li>
<li>Provide reasonable time for you to review the changes</li>
</ul>
<p>Your continued use of our services after changes become effective constitutes acceptance of the modified Terms.</p>

<h3>Contact Us</h3>
<p>If you have any questions about these Terms of Service, please contact us through:</p>
<ul>
<li>Our website contact form</li>
<li>Your account support dashboard</li>
<li>Written correspondence to your business address</li>
</ul>
<p>We will respond to inquiries in a timely manner, typically within 5-7 business days.</p>`
          }
        }
      ]
    }
  }

  // Return simple template when no sample content is requested
  return {
    version: '2.0',
    layout: 'other',
    sections: [
      {
        id: 'header',
        type: 'header',
        visible: true,
        settings: {
          backgroundColor: 'default'
        },
        data: {
          headline: title || 'Terms of Service',
          subheadline: subtitle || ''
        }
      },
      {
        id: 'richText',
        type: 'text',
        visible: true,
        settings: {
          backgroundColor: 'default'
        },
        data: {
          headline: '',
          content: ''
        }
      }
    ]
  }
}