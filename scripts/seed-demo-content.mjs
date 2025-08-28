#!/usr/bin/env node

/**
 * Seed script to create demo pages with all layout types
 * Creates one page for each layout type with rich mock data
 * 
 * Usage: pnpm seed:demo-content <site-id>
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
  console.error('❌ Missing required environment variables:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseServiceKey && !supabaseAnonKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

// Create Supabase client (prefer service role key for admin operations)
const supabaseKey = supabaseServiceKey || supabaseAnonKey
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Define demo pages to create - using pre-built content
const demoPages = [
  {
    title: 'Landing Page Demo',
    slug: 'landing-page-demo',
    layout: 'landing',
    description: 'Professional landing page with hero, features, testimonials, and pricing',
    contentType: 'page'
  },
  {
    title: 'Blog Article Demo',
    slug: 'blog-article-demo',
    layout: 'blog',
    description: 'Rich blog post with comprehensive content and formatting',
    contentType: 'blog_post'
  },
  {
    title: 'Portfolio Demo',
    slug: 'portfolio-demo',
    layout: 'portfolio',
    description: 'Beautiful portfolio showcase with project gallery',
    contentType: 'page'
  },
  {
    title: 'About Us Demo',
    slug: 'about-us-demo',
    layout: 'about',
    description: 'Company story with mission, values, and team profiles',
    contentType: 'page'
  },
  {
    title: 'Product Page Demo',
    slug: 'product-page-demo',
    layout: 'product',
    description: 'Detailed product showcase with specifications and pricing',
    contentType: 'page'
  },
  {
    title: 'Contact Page Demo',
    slug: 'contact-page-demo',
    layout: 'contact',
    description: 'Contact form with business information and location details',
    contentType: 'page'
  },
  {
    title: 'Custom Page Demo',
    slug: 'custom-page-demo',
    layout: 'other',
    description: 'Flexible custom layout with mixed content sections',
    contentType: 'page'
  }
]

// Pre-built rich content for each layout type
const getContentForLayout = (layout) => {
  const contents = {
    landing: {
      version: '1.0',
      layout: 'landing',
      sections: {
        hero: {
          type: 'hero',
          visible: true,
          order: 0,
          data: {
            content: '<h1>Transform Your Business Today</h1>\n<p class="lead">Powerful solutions that drive real results for modern teams.</p>\n<p>Join thousands of companies already using our platform to accelerate growth.</p>',
            items: [
              { id: 'cta-1', title: 'Get Started Free', url: '/signup' },
              { id: 'cta-2', title: 'Watch Demo', url: '/demo' }
            ]
          }
        },
        features: {
          type: 'features',
          visible: true,
          order: 1,
          data: {
            items: [
              { id: 'f1', title: 'Lightning Fast', content: 'Optimized performance with sub-second response times.', icon: 'Zap', order: 0 },
              { id: 'f2', title: 'Enterprise Security', content: 'Bank-level encryption to protect your data.', icon: 'Shield', order: 1 },
              { id: 'f3', title: 'Easy Deployment', content: 'Go from concept to production in minutes.', icon: 'Rocket', order: 2 },
              { id: 'f4', title: 'Global Scale', content: 'Distributed infrastructure ensures reliability.', icon: 'Globe', order: 3 },
              { id: 'f5', title: 'Privacy First', content: 'GDPR compliant with full data ownership.', icon: 'Lock', order: 4 },
              { id: 'f6', title: 'Customer Success', content: 'Dedicated support team ensures your success.', icon: 'Heart', order: 5 }
            ]
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
            content: '<h1>Digital Transformation: A Strategic Guide</h1>\n<p class="text-xl">Insights and strategies for navigating the modern business landscape</p>'
          }
        },
        content: {
          type: 'richText',
          visible: true,
          order: 1,
          data: {
            content: '<h2>Introduction</h2>\n<p>In today\'s rapidly evolving digital landscape, businesses face unprecedented challenges and opportunities.</p>\n\n<h2>The Current State</h2>\n<p>Digital transformation has moved from a competitive advantage to a business necessity. Organizations that fail to adapt risk becoming obsolete.</p>\n\n<h2>Key Drivers of Change</h2>\n<ul>\n<li>Customer Expectations</li>\n<li>Technological Advancement</li>\n<li>Market Dynamics</li>\n<li>Regulatory Requirements</li>\n</ul>\n\n<h2>Conclusion</h2>\n<p>The journey of transformation is unique for every organization. By understanding your specific challenges and opportunities, you can chart a path toward sustainable success.</p>'
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
            content: '<h1>Our Portfolio</h1>\n<p>Showcasing our best work and successful projects</p>'
          }
        },
        gallery: {
          type: 'gallery',
          visible: true,
          order: 1,
          data: {
            items: [
              { id: 'p1', title: 'Project Alpha', content: 'Enterprise solution for Fortune 500 company', image: '/api/placeholder/800/600', order: 0 },
              { id: 'p2', title: 'Project Beta', content: 'Mobile app with 1M+ downloads', image: '/api/placeholder/800/600', order: 1 },
              { id: 'p3', title: 'Project Gamma', content: 'Award-winning design system', image: '/api/placeholder/800/600', order: 2 },
              { id: 'p4', title: 'Project Delta', content: 'AI-powered analytics platform', image: '/api/placeholder/800/600', order: 3 },
              { id: 'p5', title: 'Project Epsilon', content: 'E-commerce platform processing $10M+', image: '/api/placeholder/800/600', order: 4 },
              { id: 'p6', title: 'Project Zeta', content: 'Healthcare solution serving 100K+ patients', image: '/api/placeholder/800/600', order: 5 }
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
            content: '<h1>About Our Company</h1>\n<p>Building the future of digital transformation since 2020</p>'
          }
        },
        mission: {
          type: 'mission',
          visible: true,
          order: 1,
          data: {
            content: '<h2>Our Mission</h2>\n<p>We believe in empowering businesses with tools that make complex tasks simple, enabling teams to focus on what truly matters: innovation and growth.</p>'
          }
        },
        values: {
          type: 'values',
          visible: true,
          order: 2,
          data: {
            items: [
              { id: 'v1', title: 'Integrity', content: 'We build trust through transparency', icon: 'Shield', order: 0 },
              { id: 'v2', title: 'Innovation', content: 'We constantly push boundaries', icon: 'Lightbulb', order: 1 },
              { id: 'v3', title: 'Collaboration', content: 'Great things happen when we work together', icon: 'Users', order: 2 },
              { id: 'v4', title: 'Excellence', content: 'We strive for excellence in everything', icon: 'Award', order: 3 }
            ]
          }
        },
        team: {
          type: 'team',
          visible: true,
          order: 3,
          data: {
            items: [
              { id: 't1', title: 'Alexandra Chen', subtitle: 'CEO', content: '15+ years in tech leadership', image: '/api/placeholder/400/400', order: 0 },
              { id: 't2', title: 'Marcus Johnson', subtitle: 'CTO', content: 'Former Google engineer', image: '/api/placeholder/400/400', order: 1 },
              { id: 't3', title: 'Sofia Rodriguez', subtitle: 'VP Product', content: 'Product visionary', image: '/api/placeholder/400/400', order: 2 },
              { id: 't4', title: 'David Kim', subtitle: 'Head of Design', content: 'Award-winning designer', image: '/api/placeholder/400/400', order: 3 }
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
            content: '<h1>Professional Platform Suite</h1>\n<p>Everything you need to run your business in one integrated platform</p>'
          }
        },
        features: {
          type: 'features',
          visible: true,
          order: 1,
          data: {
            items: [
              { id: 'pf1', title: 'All-in-One', content: 'Complete business solution', icon: 'Package', order: 0 },
              { id: 'pf2', title: 'Scalable', content: 'Grows with your business', icon: 'TrendingUp', order: 1 },
              { id: 'pf3', title: 'Secure', content: 'Enterprise-grade security', icon: 'Lock', order: 2 }
            ]
          }
        },
        specifications: {
          type: 'specifications',
          visible: true,
          order: 2,
          data: {
            content: '<h3>Technical Specifications</h3>\n<ul>\n<li>Cloud-based SaaS</li>\n<li>99.9% SLA</li>\n<li>RESTful & GraphQL APIs</li>\n<li>SOC 2 Type II certified</li>\n<li>500+ integrations</li>\n</ul>'
          }
        },
        pricing: {
          type: 'pricing',
          visible: true,
          order: 3,
          data: {
            items: [
              { id: 'pr1', title: 'Starter', subtitle: '$49/mo', content: 'Perfect for small teams', order: 0 },
              { id: 'pr2', title: 'Professional', subtitle: '$199/mo', content: 'For growing businesses', order: 1 },
              { id: 'pr3', title: 'Enterprise', subtitle: 'Custom', content: 'Tailored solutions', order: 2 }
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
            content: '<h1>Get in Touch</h1>\n<p>We\'d love to hear from you</p>'
          }
        },
        form: {
          type: 'form',
          visible: true,
          order: 1,
          data: {
            fields: [
              { id: 'name', type: 'text', label: 'Full Name', required: true, order: 0 },
              { id: 'email', type: 'email', label: 'Email', required: true, order: 1 },
              { id: 'message', type: 'textarea', label: 'Message', required: true, order: 2 }
            ]
          }
        },
        features: {
          type: 'features',
          visible: true,
          order: 2,
          data: {
            items: [
              { id: 'c1', title: 'Email', content: 'hello@example.com', icon: 'Mail', order: 0 },
              { id: 'c2', title: 'Phone', content: '+1 (555) 123-4567', icon: 'Phone', order: 1 },
              { id: 'c3', title: 'Office', content: '123 Business Ave', icon: 'MapPin', order: 2 }
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
            content: '<h1>Custom Page Layout</h1>\n<p>This flexible layout allows you to create any type of content</p>'
          }
        }
      }
    }
  }
  
  return contents[layout] || contents.other
}

async function seedDemoContent() {
  console.log('🌱 Starting demo content seed...\n')

  try {
    // Get site ID from command line argument
    const siteId = process.argv[2]
    
    if (!siteId) {
      console.error('❌ Please provide a site ID as an argument:')
      console.error('   pnpm seed:demo-content <site-id>')
      console.error('\nTo find your site ID:')
      console.error('1. Go to your dashboard')
      console.error('2. The site ID is typically a UUID like: 123e4567-e89b-12d3-a456-426614174000\n')
      process.exit(1)
    }

    // Verify the site exists
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      console.error(`❌ Site with ID "${siteId}" not found`)
      console.error('Error details:', siteError)
      console.error('Make sure the site ID is correct and the site exists.\n')
      process.exit(1)
    }

    console.log(`📍 Creating demo content for site: ${site.name}`)
    console.log('─'.repeat(50))

    // Create demo pages
    const results = []
    
    for (const page of demoPages) {
      console.log(`\n📄 Creating ${page.title}...`)
      
      // Get pre-built content for this layout
      const pageContent = getContentForLayout(page.layout)
      
      // Prepare content data
      const contentData = {
        site_id: siteId,
        title: page.title,
        slug: page.slug,
        content_type: page.contentType,
        content: pageContent,
        is_published: true,
        is_featured: page.layout === 'landing',
        meta_data: {
          layout: page.layout,
          description: page.description,
          seededDemo: true
        }
      }
      
      // Check if page already exists
      const { data: existing } = await supabase
        .from('content')
        .select('id')
        .eq('site_id', siteId)
        .eq('slug', page.slug)
        .single()
      
      if (existing) {
        console.log(`   ⚠️  Page already exists, updating...`)
        
        const { error: updateError } = await supabase
          .from('content')
          .update(contentData)
          .eq('id', existing.id)
        
        if (updateError) {
          console.error(`   ❌ Failed to update: ${updateError.message}`)
          results.push({ page: page.title, status: 'failed', error: updateError.message })
        } else {
          console.log(`   ✅ Updated successfully`)
          results.push({ page: page.title, status: 'updated' })
        }
      } else {
        // Create new page
        const { error: createError } = await supabase
          .from('content')
          .insert(contentData)
        
        if (createError) {
          console.error(`   ❌ Failed to create: ${createError.message}`)
          results.push({ page: page.title, status: 'failed', error: createError.message })
        } else {
          console.log(`   ✅ Created successfully`)
          results.push({ page: page.title, status: 'created' })
        }
      }
    }
    
    // Summary
    console.log('\n' + '═'.repeat(50))
    console.log('📊 SEED SUMMARY')
    console.log('─'.repeat(50))
    
    const created = results.filter(r => r.status === 'created').length
    const updated = results.filter(r => r.status === 'updated').length
    const failed = results.filter(r => r.status === 'failed').length
    
    console.log(`✅ Created: ${created} pages`)
    console.log(`🔄 Updated: ${updated} pages`)
    if (failed > 0) {
      console.log(`❌ Failed: ${failed} pages`)
      results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`   - ${r.page}: ${r.error}`)
      })
    }
    
    console.log('\n🎉 Demo content seed completed!')
    console.log('\n📍 Next steps:')
    console.log('1. Go to the Content Library in your dashboard')
    console.log('2. You will see all 7 demo pages with different layout types')
    console.log('3. The Type column now shows: Landing Page, Blog Article, Portfolio, etc.')
    console.log('4. Click on any page to view or edit the rich content\n')
    
  } catch (error) {
    console.error('❌ Seed failed with error:', error)
    process.exit(1)
  }
}

// Run the seed script
seedDemoContent()