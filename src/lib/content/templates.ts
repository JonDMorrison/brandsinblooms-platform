/**
 * Default content templates for each layout type
 * These templates provide pre-filled content when creating new pages
 */

import { PageContent, LayoutType } from './schema'

/**
 * Get default template content for a specific layout
 */
export function getLayoutTemplate(layout: LayoutType, title: string, subtitle?: string): PageContent {
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
            content: `<h1>${title}</h1>${subtitle ? `<p class="text-xl text-gray-600">${subtitle}</p>` : ''}<p>Welcome to our amazing platform. Discover how we can help you achieve your goals.</p>`,
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
        },
        team: {
          type: 'team',
          visible: true,
          order: 3,
          data: {
            items: [
              {
                id: 'member-1',
                title: 'John Doe',
                subtitle: 'Founder & CEO',
                content: 'Leading our vision with passion and expertise.',
                image: '/api/placeholder/200/200',
                order: 0
              },
              {
                id: 'member-2',
                title: 'Jane Smith',
                subtitle: 'Chief Technology Officer',
                content: 'Driving innovation and technical excellence.',
                image: '/api/placeholder/200/200',
                order: 1
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
    }
  }

  return templates[layout]
}