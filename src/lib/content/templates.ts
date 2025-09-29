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
      version: '1.0',
      layout: 'landing',
      sections: {
        hero: {
          type: 'hero',
          visible: true,
          order: 0,
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
        features: {
          type: 'features',
          visible: true,
          order: 1,
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
        cta: {
          type: 'cta',
          visible: true,
          order: 2,
          data: {
            content: '<h2>Ready to Get Started?</h2><p>Join thousands of satisfied customers today.</p>'
          }
        }
      }
    },
    blog: {
      version: '1.0',
      layout: 'blog',
      sections: {
        header: {
          type: 'hero',
          visible: true,
          order: 0,
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}<p class="text-sm text-gray-500">Published on ${new Date().toLocaleDateString()}</p>`
          }
        },
        content: {
          type: 'richText',
          visible: true,
          order: 1,
          data: {
            content: `<h2>Introduction</h2><p>Start your blog post with an engaging introduction that captures your reader's attention.</p><h2>Main Content</h2><p>This is where you'll add the main body of your blog post. Use headings, paragraphs, lists, and images to structure your content effectively.</p><h2>Conclusion</h2><p>Wrap up your post with a strong conclusion that summarizes your key points and encourages reader engagement.</p>`
          }
        }
      }
    },
    portfolio: {
      version: '1.0',
      layout: 'portfolio',
      sections: {
        header: {
          type: 'hero',
          visible: true,
          order: 0,
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}`
          }
        },
        gallery: {
          type: 'gallery',
          visible: true,
          order: 1,
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
      }
    },
    about: {
      version: '1.0',
      layout: 'about',
      sections: {
        header: {
          type: 'hero',
          visible: true,
          order: 0,
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}`
          }
        },
        mission: {
          type: 'mission',
          visible: true,
          order: 1,
          data: {
            content: '<h2>Our Mission</h2><p>We are dedicated to providing exceptional value and service to our customers. Our mission is to make a positive impact through innovation and excellence.</p>'
          }
        },
        values: {
          type: 'values',
          visible: true,
          order: 2,
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
      }
    },
    product: {
      version: '1.0',
      layout: 'product',
      sections: {
        header: {
          type: 'hero',
          visible: true,
          order: 0,
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}`
          }
        },
        gallery: {
          type: 'gallery',
          visible: true,
          order: 1,
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
        features: {
          type: 'features',
          visible: true,
          order: 2,
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
        specifications: {
          type: 'specifications',
          visible: true,
          order: 3,
          data: {
            content: '<h2>Technical Specifications</h2><ul><li>Dimension: 10" x 8" x 3"</li><li>Weight: 2.5 lbs</li><li>Material: Premium Grade</li><li>Color Options: Multiple Available</li></ul>'
          }
        },
        pricing: {
          type: 'pricing',
          visible: true,
          order: 4,
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
      }
    },
    contact: {
      version: '1.0',
      layout: 'contact',
      sections: {
        header: {
          type: 'hero',
          visible: true,
          order: 0,
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}<p>We\'d love to hear from you. Get in touch with us today.</p>`
          }
        },
        form: {
          type: 'form',
          visible: true,
          order: 1,
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
        features: {
          type: 'features',
          visible: true,
          order: 2,
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
      }
    },
    other: {
      version: '1.0',
      layout: 'other',
      sections: {
        hero: {
          type: 'hero',
          visible: true,
          order: 0,
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}<p>This is a flexible layout where you can add any content sections you need.</p>`,
            subtitle: subtitle || '',
            alignment: 'center'
          }
        }
      },
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
      version: '1.0',
      layout: 'plant_shop',
      sections: {
        hero: {
          type: 'hero',
          visible: true,
          order: 0,
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}<p>Discover beautiful plants for your home and garden.</p>`,
            subtitle: subtitle || '',
            alignment: 'center'
          }
        }
      }
    },
    plant_care: {
      version: '1.0',
      layout: 'plant_care',
      sections: {
        hero: {
          type: 'hero',
          visible: true,
          order: 0,
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}<p>Learn how to care for your plants.</p>`,
            subtitle: subtitle || '',
            alignment: 'center'
          }
        }
      }
    },
    plant_catalog: {
      version: '1.0',
      layout: 'plant_catalog',
      sections: {
        hero: {
          type: 'hero',
          visible: true,
          order: 0,
          data: {
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}<p>Browse our complete plant catalog.</p>`,
            subtitle: subtitle || '',
            alignment: 'center'
          }
        }
      }
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
    const layout = templateId.includes('about') ? 'about' : 'landing'
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
      version: '1.0',
      layout: 'landing',
      sections: {
        hero: {
          type: 'hero',
          order: 1,
          visible: true,
          data: {
            headline: title || 'Transform Your Space with Living Beauty',
            subheadline: subtitle || 'Discover premium plants and expert horticultural guidance for thriving indoor and outdoor gardens',
            features: [
              'Expert horticultural guidance',
              'Premium plant selection', 
              'Comprehensive care resources',
              'Local hardiness zone expertise'
            ],
            ctaText: 'Shop Plants',
            ctaLink: '/plants',
            secondaryCtaText: 'Care Guides!',
            secondaryCtaLink: '/care-guides',
            backgroundImage: '/images/hero-greenhouse.jpg'
          }
        },
        featured: {
          type: 'featured',
          order: 2,
          visible: true,
          data: {
            headline: 'Featured Plants This Season',
            subheadline: 'Handpicked selections from our master horticulturists, perfect for current growing conditions',
            viewAllText: 'View All Plants',
            viewAllLink: '/plants'
          },
          settings: {
            backgroundColor: 'default'
          }
        },
        features: {
          type: 'features',
          order: 3,
          visible: true,
          data: {
            headline: 'Essential Plant Care Features',
            description: 'Master these key practices for healthy, thriving plants year-round',
            features: [
              'Reduce watering frequency as growth slows',
              'Move tender plants indoors before first frost!',
              'Apply winter protection to marginally hardy plants'
            ]
          },
          settings: {
            backgroundColor: 'alternate'
          }
        },
        categories: {
          type: 'categories',
          order: 4,
          visible: true,
          data: {
            headline: 'Find Your Perfect Plant Match',
            description: 'Browse our expertly curated collections organized by care complexity and plant type'
          },
          settings: {
            backgroundColor: 'default'
          }
        },
        cta: {
          type: 'cta',
          order: 5,
          visible: true,
          data: {
            headline: 'Growing Together, Sustainably',
            description: 'Our mission is to help you create thriving plant sanctuaries while protecting our planet. Every plant comes with expert care guidance, sustainable growing practices, and our commitment to your plant parenthood success.',
            ctaText: 'Shop Plants',
            ctaLink: '/',
            secondaryCtaText: 'Browse Plants',
            secondaryCtaLink: '/'
          },
          settings: {
            backgroundColor: 'primary'
          }
        }
      }
    }
  }
  
  // Return empty template when no sample content is requested
  return {
    version: '1.0',
    layout: 'landing',
    sections: {
      hero: {
        type: 'hero',
        order: 1,
        visible: true,
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
      featured: {
        type: 'featured',
        order: 2,
        visible: true,
        data: {
          headline: '',
          subheadline: '',
          viewAllText: '',
          viewAllLink: ''
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      features: {
        type: 'features',
        order: 3,
        visible: true,
        data: {
          headline: '',
          description: '',
          features: []
        },
        settings: {
          backgroundColor: 'alternate'
        }
      },
      categories: {
        type: 'categories',
        order: 4,
        visible: true,
        data: {
          headline: '',
          description: ''
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      cta: {
        type: 'cta',
        order: 5,
        visible: true,
        data: {
          headline: '',
          description: '',
          ctaText: '',
          ctaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: ''
        },
        settings: {
          backgroundColor: 'primary'
        }
      }
    }
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
      version: '1.0',
      layout: 'landing',
      sections: {
        hero: {
          type: 'hero',
          order: 1,
          visible: true,
          data: {
            headline: title || 'Transform Your Space with Living Beauty',
            subheadline: subtitle || 'Discover premium plants and expert horticultural guidance for thriving indoor and outdoor gardens',
            features: [
              'Expert horticultural guidance',
              'Premium plant selection', 
              'Comprehensive care resources',
              'Local hardiness zone expertise'
            ],
            ctaText: 'Shop Plants',
            ctaLink: '/plants',
            secondaryCtaText: 'Care Guides!',
            secondaryCtaLink: '/care-guides',
            backgroundImage: '/images/hero-greenhouse.jpg'
          }
        },
        cta: {
          type: 'cta',
          order: 5,
          visible: true,
          data: {
            headline: 'Growing Together, Sustainably',
            description: 'Our mission is to help you create thriving plant sanctuaries while protecting our planet. Every plant comes with expert care guidance, sustainable growing practices, and our commitment to your plant parenthood success.',
            ctaText: 'Shop Plants',
            ctaLink: '/',
            secondaryCtaText: 'Browse Plants',
            secondaryCtaLink: '/'
          },
          settings: {
            backgroundColor: 'primary'
          }
        }
      }
    }
  }
  
  // Return empty template when no sample content is requested
  return {
    version: '1.0',
    layout: 'landing',
    sections: {
      hero: {
        type: 'hero',
        order: 1,
        visible: true,
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
      cta: {
        type: 'cta',
        order: 5,
        visible: true,
        data: {
          headline: '',
          description: '',
          ctaText: '',
          ctaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: ''
        },
        settings: {
          backgroundColor: 'primary'
        }
      }
    }
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
      version: '1.0',
      layout: 'about',
      sections: {
        hero: {
          type: 'hero',
          order: 1,
          visible: true,
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
            secondaryCtaText: 'View Our Services',
            secondaryCtaLink: '/services'
          }
        },
        mission: {
          type: 'mission',
          order: 2,
          visible: true,
          data: {
            headline: 'Our Mission',
            content: 'We believe that plants have the power to transform spaces and lives. Our mission is to provide expert guidance, premium plants, and sustainable practices that help create thriving green sanctuaries in every home and office.'
          }
        },
        values: {
          type: 'values',
          order: 3,
          visible: true,
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
          },
          settings: {
            backgroundColor: 'alternate'
          }
        },
        features: {
          type: 'features',
          order: 5,
          visible: true,
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
          },
          settings: {
            backgroundColor: 'alternate'
          }
        },
        richText: {
          type: 'richText',
          order: 6,
          visible: true,
          data: {
            headline: 'Our Story',
            content: 'Founded with a passion for plants and a commitment to sustainability, we have grown from a small local nursery into a trusted source for premium plants and expert care guidance. Our journey began with the simple belief that everyone deserves to experience the joy and benefits of thriving plants in their space.<br><br>Today, we continue to honor that founding vision by combining scientific expertise with genuine care for our customers and the environment. Every plant we sell and every piece of advice we give reflects our deep commitment to helping you succeed with your green companions.'
          }
        },
        cta: {
          type: 'cta',
          order: 7,
          visible: true,
          data: {
            headline: 'Ready to Start Your Plant Journey?',
            description: 'Let our experts help you create the perfect green sanctuary for your space.',
            ctaText: 'Schedule Consultation',
            ctaLink: '/consultation',
            secondaryCtaText: 'Browse Plants',
            secondaryCtaLink: '/plants'
          },
          settings: {
            backgroundColor: 'primary'
          }
        }
      }
    }
  }

  // Return empty template when no sample content is requested
  return {
    version: '1.0',
    layout: 'about',
    sections: {
      hero: {
        type: 'hero',
        order: 1,
        visible: true,
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
      mission: {
        type: 'mission',
        order: 2,
        visible: true,
        data: {
          headline: '',
          content: ''
        }
      },
      values: {
        type: 'values',
        order: 3,
        visible: true,
        data: {
          headline: '',
          description: '',
          items: []
        },
        settings: {
          backgroundColor: 'alternate'
        }
      },
      features: {
        type: 'features',
        order: 5,
        visible: true,
        data: {
          headline: '',
          description: '',
          features: []
        },
        settings: {
          backgroundColor: 'alternate'
        }
      },
      richText: {
        type: 'richText',
        order: 6,
        visible: true,
        data: {
          headline: '',
          content: ''
        }
      },
      cta: {
        type: 'cta',
        order: 7,
        visible: true,
        data: {
          headline: '',
          description: '',
          ctaText: '',
          ctaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: ''
        },
        settings: {
          backgroundColor: 'primary'
        }
      }
    }
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
      version: '1.0',
      layout: 'about',
      sections: {
        hero: {
          type: 'hero',
          order: 1,
          visible: true,
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
            secondaryCtaText: 'View Our Services',
            secondaryCtaLink: '/services'
          }
        },
        mission: {
          type: 'mission',
          order: 2,
          visible: true,
          data: {
            headline: 'Our Mission',
            content: 'We believe that plants have the power to transform spaces and lives. Our mission is to provide expert guidance, premium plants, and sustainable practices that help create thriving green sanctuaries in every home and office.'
          }
        },
        cta: {
          type: 'cta',
          order: 3,
          visible: true,
          data: {
            headline: 'Ready to Start Your Plant Journey?',
            description: 'Let our experts help you create the perfect green sanctuary for your space.',
            ctaText: 'Schedule Consultation',
            ctaLink: '/consultation',
            secondaryCtaText: 'Browse Plants',
            secondaryCtaLink: '/plants'
          },
          settings: {
            backgroundColor: 'primary'
          }
        }
      }
    }
  }

  // Return empty template when no sample content is requested
  return {
    version: '1.0',
    layout: 'about',
    sections: {
      hero: {
        type: 'hero',
        order: 1,
        visible: true,
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
      mission: {
        type: 'mission',
        order: 2,
        visible: true,
        data: {
          headline: '',
          content: ''
        }
      },
      cta: {
        type: 'cta',
        order: 3,
        visible: true,
        data: {
          headline: '',
          description: '',
          ctaText: '',
          ctaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: ''
        },
        settings: {
          backgroundColor: 'primary'
        }
      }
    }
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
    version: '1.0',
    layout: 'landing',
    sections: {
      hero: {
        type: 'hero',
        visible: true,
        order: 0,
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
      features: {
        type: 'features',
        visible: true,
        order: 1,
        data: {
          items: features
        }
      },
      testimonials: {
        type: 'testimonials',
        visible: true,
        order: 2,
        data: {
          items: testimonials
        }
      },
      pricing: {
        type: 'pricing',
        visible: true,
        order: 3,
        data: {
          items: pricingTiers
        }
      },
      cta: {
        type: 'cta',
        visible: true,
        order: 4,
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
    }
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
    version: '1.0',
    layout: 'about',
    sections: {
      header: {
        type: 'hero',
        visible: true,
        order: 0,
        data: {
          content: `<h1>${title || 'About Our Company'}</h1>
<p class="text-xl text-gray-600">${subtitle || 'Building the future of digital transformation since 2020.'}</p>`,
          image: config.includeImages ? `/api/placeholder/1200/400/gradient/${encodeURIComponent(JSON.stringify({
            colors: ['#f59e0b', '#dc2626'],
            direction: 'horizontal'
          }))}` : undefined
        }
      },
      mission: {
        type: 'mission',
        visible: true,
        order: 1,
        data: {
          content: `<h2>Our Mission</h2>
<p>We believe in empowering businesses with tools that make complex tasks simple, enabling teams to focus on what truly matters: innovation and growth.</p>
<p>Through cutting-edge technology and unwavering commitment to customer success, we're creating a world where every business can thrive in the digital age.</p>
<p>Our approach combines deep industry expertise with innovative thinking to deliver solutions that not only meet today's challenges but anticipate tomorrow's opportunities.</p>`
        }
      },
      values: {
        type: 'values',
        visible: true,
        order: 2,
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
      testimonials: {
        type: 'testimonials',
        visible: true,
        order: 4,
        data: {
          items: testimonials
        }
      }
    }
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
  const features = generateFeatures(6, config)
  const gallery = generateGalleryItems(4, 'product')
  const pricingTiers = generatePricingTiers()
  const testimonials = generateTestimonials(3, config)

  return {
    version: '1.0',
    layout: 'product',
    sections: {
      header: {
        type: 'hero',
        visible: true,
        order: 0,
        data: {
          content: `<h1>${title || 'Professional Platform Suite'}</h1>
<p class="text-xl text-gray-600">${subtitle || 'Everything you need to run your business in one integrated platform.'}</p>`
        }
      },
      gallery: {
        type: 'gallery',
        visible: true,
        order: 1,
        data: {
          items: gallery
        }
      },
      features: {
        type: 'features',
        visible: true,
        order: 2,
        data: {
          items: features
        }
      },
      specifications: {
        type: 'specifications',
        visible: true,
        order: 3,
        data: {
          content: `<h3>Technical Specifications</h3>
<table class="w-full">
  <tr><td class="font-semibold">Platform</td><td>Cloud-based SaaS</td></tr>
  <tr><td class="font-semibold">Availability</td><td>99.9% SLA guaranteed</td></tr>
  <tr><td class="font-semibold">API</td><td>RESTful & GraphQL</td></tr>
  <tr><td class="font-semibold">Security</td><td>SOC 2 Type II certified</td></tr>
  <tr><td class="font-semibold">Compliance</td><td>GDPR, CCPA, HIPAA</td></tr>
  <tr><td class="font-semibold">Integrations</td><td>500+ native integrations</td></tr>
  <tr><td class="font-semibold">Support</td><td>24/7 dedicated support</td></tr>
  <tr><td class="font-semibold">Languages</td><td>15+ languages supported</td></tr>
  <tr><td class="font-semibold">Mobile</td><td>iOS & Android apps</td></tr>
  <tr><td class="font-semibold">Data Export</td><td>CSV, JSON, API</td></tr>
</table>`
        }
      },
      pricing: {
        type: 'pricing',
        visible: true,
        order: 4,
        data: {
          items: pricingTiers
        }
      },
      testimonials: {
        type: 'testimonials',
        visible: true,
        order: 5,
        data: {
          items: testimonials
        }
      },
      cta: {
        type: 'cta',
        visible: true,
        order: 6,
        data: {
          content: `<h2>Start Your Free Trial</h2>
<p>Experience the full power of our platform with a 14-day free trial.</p>`,
          items: [
            {
              id: 'trial-cta',
              title: 'Start Free Trial',
              url: '/signup',
              metadata: { variant: 'primary' }
            },
            {
              id: 'demo-cta',
              title: 'Schedule Demo',
              url: '/demo',
              metadata: { variant: 'secondary' }
            }
          ]
        }
      }
    }
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
    version: '1.0',
    layout: 'contact',
    sections: {
      header: {
        type: 'hero',
        visible: true,
        order: 0,
        data: {
          content: `<h1>${title || 'Get in Touch'}</h1>
<p class="text-xl text-gray-600">${subtitle || "We'd love to hear from you. Send us a message and we'll respond within 24 hours."}</p>`
        }
      },
      form: {
        type: 'form',
        visible: true,
        order: 1,
        data: {
          fields: [
            {
              id: 'name',
              type: 'text',
              label: 'Full Name',
              placeholder: 'John Doe',
              required: true,
              order: 0
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email Address',
              placeholder: 'john@example.com',
              required: true,
              validation: {
                pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                message: 'Please enter a valid email address'
              },
              order: 1
            },
            {
              id: 'phone',
              type: 'phone',
              label: 'Phone Number',
              placeholder: '+1 (555) 123-4567',
              required: false,
              order: 2
            },
            {
              id: 'company',
              type: 'text',
              label: 'Company',
              placeholder: 'Acme Corp',
              required: false,
              order: 3
            },
            {
              id: 'department',
              type: 'select',
              label: 'How can we help?',
              required: true,
              options: ['Sales', 'Support', 'Partnerships', 'Media', 'Careers', 'Other'],
              order: 4
            },
            {
              id: 'message',
              type: 'textarea',
              label: 'Message',
              placeholder: 'Tell us more about how we can help you...',
              required: true,
              validation: {
                minLength: 10,
                message: 'Please enter at least 10 characters'
              },
              order: 5
            },
            {
              id: 'newsletter',
              type: 'checkbox',
              label: "I'd like to receive updates and newsletters",
              required: false,
              order: 6
            }
          ]
        }
      },
      features: {
        type: 'features',
        visible: true,
        order: 2,
        data: {
          items: [
            {
              id: 'contact-email',
              title: 'Email Us',
              content: 'hello@example.com\nFor general inquiries',
              icon: 'Mail',
              order: 0
            },
            {
              id: 'contact-phone',
              title: 'Call Us',
              content: '+1 (555) 123-4567\nMon-Fri, 9am-6pm PST',
              icon: 'Phone',
              order: 1
            },
            {
              id: 'contact-office',
              title: 'Visit Us',
              content: '123 Business Ave, Suite 100\nSan Francisco, CA 94105',
              icon: 'MapPin',
              order: 2
            },
            {
              id: 'contact-support',
              title: 'Support Center',
              content: 'support.example.com\n24/7 help documentation',
              icon: 'HelpCircle',
              order: 3
            }
          ]
        }
      }
    }
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
    version: '1.0',
    layout: 'blog',
    sections: {
      header: {
        type: 'hero',
        visible: true,
        order: 0,
        data: {
          content: `<h1>${title || 'Digital Transformation: A Strategic Guide'}</h1>
<p class="text-xl text-gray-600">${subtitle || 'Insights and strategies for navigating the modern business landscape'}</p>
<p class="text-sm text-gray-500">Published on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · 8 min read</p>`
        }
      },
      content: {
        type: 'richText',
        visible: true,
        order: 1,
        data: {
          content: richContent
        }
      }
    }
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
    version: '1.0',
    layout: 'portfolio',
    sections: {
      header: {
        type: 'hero',
        visible: true,
        order: 0,
        data: {
          content: `<h1>${title || 'Our Portfolio'}</h1>
<p class="text-xl text-gray-600">${subtitle || 'Showcasing our best work and successful projects'}</p>
<p>Explore our collection of innovative solutions and creative achievements that demonstrate our expertise and commitment to excellence.</p>`
        }
      },
      gallery: {
        type: 'gallery',
        visible: true,
        order: 1,
        data: {
          items: gallery
        }
      },
      cta: {
        type: 'cta',
        visible: true,
        order: 2,
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
    }
  }
}