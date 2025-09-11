/**
 * Plant Shop Content Management System - Integration Test Suite
 * Milestone 6: Integration Testing and Optimization
 * 
 * Comprehensive end-to-end testing of plant content system functionality
 */

import { createClient } from '@supabase/supabase-js'
import { performance } from 'perf_hooks'

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Test data
const TEST_SITE_ID = 'test-plant-shop-integration'
const TEST_USER_ID = 'test-user-integration'

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  performance: {},
  errors: []
}

// Helper functions
function assert(condition, message) {
  if (condition) {
    testResults.passed++
    console.log(`✅ ${message}`)
  } else {
    testResults.failed++
    testResults.errors.push(message)
    console.log(`❌ ${message}`)
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    testResults.passed++
    console.log(`✅ ${message}`)
  } else {
    testResults.failed++
    testResults.errors.push(`${message} (expected: ${expected}, actual: ${actual})`)
    console.log(`❌ ${message} (expected: ${expected}, actual: ${actual})`)
  }
}

function measurePerformance(name, fn) {
  return async (...args) => {
    const start = performance.now()
    const result = await fn(...args)
    const end = performance.now()
    const duration = end - start
    testResults.performance[name] = duration
    console.log(`⏱️  ${name}: ${duration.toFixed(2)}ms`)
    return result
  }
}

// Test suite implementation
class PlantContentIntegrationTest {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }

  async setup() {
    console.log('🚀 Setting up test environment...')
    
    // Create test site with correct schema fields
    const { error: siteError } = await this.supabase
      .from('sites')
      .upsert({
        id: TEST_SITE_ID,
        name: 'Integration Test Plant Shop',
        subdomain: 'integration-test',
        is_active: true,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (siteError && siteError.code !== '23505') {
      console.warn('Site setup warning:', siteError)
    }

    // Clean up any existing test content
    await this.supabase.from('content').delete().eq('site_id', TEST_SITE_ID)
    
    console.log('✅ Test environment ready')
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...')
    await this.supabase.from('content').delete().eq('site_id', TEST_SITE_ID)
    await this.supabase.from('sites').delete().eq('id', TEST_SITE_ID)
    console.log('✅ Cleanup complete')
  }

  async testPlantBlockTypes() {
    console.log('\n📦 Testing Plant Content Block Types...')

    const plantBlockTypes = [
      'hero',
      'featured_plants',
      'mission',
      'team',
      'contact_form',
      'rich_text',
      'cta',
      'plant_gallery',
      'care_guide',
      'testimonials',
      'plant_categories',
      'seasonal_collection',
      'plant_finder',
      'delivery_info',
      'sustainability'
    ]

    for (const blockType of plantBlockTypes) {
      const testContent = {
        id: `content-${blockType}-test`,
        site_id: TEST_SITE_ID,
        content_type: 'home_page',
        slug: `test-${blockType}`,
        title: `Test ${blockType} Page`,
        content: {
          version: '1.0',
          layout: 'plant_shop',
          sections: [{
            id: `section-${blockType}`,
            type: blockType,
            title: `Test ${blockType} Section`,
            order: 1,
            visible: true,
            content: this.generateMockContent(blockType),
            styling: {
              layout: 'grid',
              padding: { top: 'md', bottom: 'md' }
            }
          }]
        },
        is_published: true,
        author_id: TEST_USER_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('content')
        .insert(testContent)
        .select()
        .single()

      assert(!error, `Created ${blockType} block without errors`)
      assert(data?.content?.sections?.length === 1, `${blockType} block has correct structure`)
      assert(data?.content?.sections?.[0]?.type === blockType, `${blockType} block has correct type`)
    }

    console.log(`✅ Tested ${plantBlockTypes.length} plant block types`)
  }

  async testContentCRUDOperations() {
    console.log('\n🔄 Testing Content CRUD Operations...')

    // CREATE
    const createTest = measurePerformance('content_create', async () => {
      const content = {
        id: 'crud-test-content',
        site_id: TEST_SITE_ID,
        content_type: 'home_page',
        slug: 'crud-test',
        title: 'CRUD Test Page',
        content: {
          version: '1.0',
          layout: 'plant_shop',
          sections: [{
            id: 'crud-hero',
            type: 'hero',
            title: 'CRUD Hero',
            order: 1,
            visible: true,
            content: {
              headline: 'CRUD Test Hero',
              subheading: 'Testing operations'
            }
          }]
        },
        is_published: true,
        author_id: TEST_USER_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return await this.supabase.from('content').insert(content).select().single()
    })

    const { data: created, error: createError } = await createTest()
    assert(!createError, 'Content creation successful')
    assert(created?.title === 'CRUD Test Page', 'Created content has correct title')

    // READ
    const readTest = measurePerformance('content_read', async () => {
      return await this.supabase
        .from('content')
        .select('*')
        .eq('id', 'crud-test-content')
        .single()
    })

    const { data: read, error: readError } = await readTest()
    assert(!readError, 'Content read successful')
    assert(read?.id === 'crud-test-content', 'Read correct content')

    // UPDATE
    const updateTest = measurePerformance('content_update', async () => {
      const updatedContent = {
        ...read.content,
        sections: [
          ...read.content.sections,
          {
            id: 'crud-featured-plants',
            type: 'featured_plants',
            title: 'Featured Plants',
            order: 2,
            visible: true,
            content: {
              title: 'Best Sellers',
              plants: [{
                id: 'test-plant-1',
                name: 'Test Plant',
                price: 25.99
              }],
              showPricing: true
            }
          }
        ]
      }

      return await this.supabase
        .from('content')
        .update({
          content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'crud-test-content')
        .select()
        .single()
    })

    const { data: updated, error: updateError } = await updateTest()
    assert(!updateError, 'Content update successful')
    assert(updated?.content?.sections?.length === 2, 'Updated content has additional section')

    // DELETE
    const deleteTest = measurePerformance('content_delete', async () => {
      return await this.supabase
        .from('content')
        .delete()
        .eq('id', 'crud-test-content')
    })

    const { error: deleteError } = await deleteTest()
    assert(!deleteError, 'Content deletion successful')

    console.log('✅ CRUD operations completed successfully')
  }

  async testPerformanceBenchmarks() {
    console.log('\n⚡ Testing Performance Benchmarks...')

    // Create multiple content items for performance testing
    const performanceContent = Array.from({ length: 10 }, (_, i) => ({
      id: `perf-content-${i}`,
      site_id: TEST_SITE_ID,
      type: 'home_page',
      layout: 'plant_shop',
      slug: `perf-test-${i}`,
      title: `Performance Test ${i}`,
      content: {
        version: '1.0',
        layout: 'plant_shop',
        sections: this.generateLargeSectionSet()
      },
      published: true,
      author_id: TEST_USER_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    // Bulk insert test
    const bulkInsertTest = measurePerformance('bulk_insert_10_items', async () => {
      return await this.supabase.from('content').insert(performanceContent).select()
    })

    const { data: inserted, error: insertError } = await bulkInsertTest()
    assert(!insertError, 'Bulk insert successful')
    assert(inserted?.length === 10, 'All 10 items inserted')

    // Query performance test
    const queryTest = measurePerformance('query_all_content', async () => {
      return await this.supabase
        .from('content')
        .select('*')
        .eq('site_id', TEST_SITE_ID)
        .eq('is_published', true)
    })

    const { data: queried, error: queryError } = await queryTest()
    assert(!queryError, 'Query successful')
    assert(queried?.length === 10, 'Query returned all items')

    // Single item query test
    const singleQueryTest = measurePerformance('single_content_load', async () => {
      return await this.supabase
        .from('content')
        .select('*')
        .eq('id', 'perf-content-0')
        .single()
    })

    const { data: singleItem, error: singleError } = await singleQueryTest()
    assert(!singleError, 'Single item query successful')
    assert(singleItem?.id === 'perf-content-0', 'Correct item returned')

    // Performance assertions (targets from M5 report)
    assert(testResults.performance.bulk_insert_10_items < 1000, 'Bulk insert under 1000ms')
    assert(testResults.performance.query_all_content < 200, 'Query all content under 200ms')
    assert(testResults.performance.single_content_load < 50, 'Single content load under 50ms')

    console.log('✅ Performance benchmarks completed')
  }

  async testContentIntegrity() {
    console.log('\n🔒 Testing Content Integrity...')

    const integrityContent = {
      id: 'integrity-test-content',
      site_id: TEST_SITE_ID,
      type: 'home_page',
      layout: 'plant_shop',
      slug: 'integrity-test',
      title: 'Integrity Test',
      content: {
        version: '1.0',
        layout: 'plant_shop',
        sections: [{
          id: 'integrity-featured-plants',
          type: 'featured_plants',
          title: 'Featured Plants',
          order: 1,
          visible: true,
          content: {
            title: 'Plant Collection',
            plants: [{
              id: 'integrity-plant-1',
              name: 'Peace Lily',
              scientificName: 'Spathiphyllum wallisii',
              description: 'Elegant indoor plant with white blooms',
              price: 34.99,
              salePrice: 29.99,
              image: '/images/peace-lily.jpg',
              category: 'Indoor Plants',
              difficulty: 'easy',
              lightRequirement: 'medium',
              waterRequirement: 'medium',
              size: 'medium',
              stock: 12,
              inStock: true,
              featured: true,
              tags: ['beginner-friendly', 'air-purifying', 'flowering'],
              careInstructions: 'Water when topsoil feels dry, prefers bright indirect light',
              benefits: ['Air purification', 'Low maintenance', 'Beautiful flowers'],
              url: '/plants/peace-lily',
              metadata: {
                origin: 'Central America',
                botanicalFamily: 'Araceae',
                toxicity: 'mildly toxic to pets',
                bloomingSeason: 'spring-summer'
              }
            }],
            showPricing: true,
            showCareInfo: true,
            filterOptions: {
              byCategory: true,
              byDifficulty: true,
              byLight: true,
              bySize: true
            }
          }
        }]
      },
      published: true,
      author_id: TEST_USER_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Create content
    await this.supabase.from('content').insert(integrityContent)

    // Perform multiple operations to test integrity
    for (let i = 0; i < 5; i++) {
      // Read current state
      const { data: current } = await this.supabase
        .from('content')
        .select('*')
        .eq('id', 'integrity-test-content')
        .single()

      // Update with small modification
      const modifiedContent = {
        ...current.content,
        sections: current.content.sections.map(section => ({
          ...section,
          content: {
            ...section.content,
            title: `${section.content.title} - Update ${i}`
          }
        }))
      }

      await this.supabase
        .from('content')
        .update({
          content: modifiedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'integrity-test-content')
    }

    // Verify final integrity
    const { data: final, error: finalError } = await this.supabase
      .from('content')
      .select('*')
      .eq('id', 'integrity-test-content')
      .single()

    assert(!finalError, 'Final integrity check successful')
    
    const finalSection = final.content.sections[0]
    assert(finalSection.content.title === 'Plant Collection - Update 4', 'Title updated correctly')
    assert(finalSection.content.plants.length === 1, 'Plant data preserved')
    assert(finalSection.content.plants[0].name === 'Peace Lily', 'Plant name preserved')
    assert(finalSection.content.plants[0].metadata.botanicalFamily === 'Araceae', 'Complex metadata preserved')
    assert(finalSection.content.plants[0].tags.includes('air-purifying'), 'Array data preserved')

    console.log('✅ Content integrity maintained through multiple operations')
  }

  async testMultiTenantIsolation() {
    console.log('\n🏢 Testing Multi-Tenant Site Isolation...')

    const site2Id = 'test-site-2-isolation'
    
    // Create second test site
    await this.supabase.from('sites').upsert({
      id: site2Id,
      name: 'Test Site 2',
      domain: 'test-site-2.example.com',
      subdomain: 'test-site-2',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    // Create content for both sites
    const site1Content = {
      id: 'site-1-content',
      site_id: TEST_SITE_ID,
      type: 'home_page',
      layout: 'plant_shop',
      slug: 'home',
      title: 'Site 1 Home',
      content: { version: '1.0', layout: 'plant_shop', sections: [] },
      published: true,
      author_id: TEST_USER_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const site2Content = {
      id: 'site-2-content',
      site_id: site2Id,
      type: 'home_page',
      layout: 'plant_shop',
      slug: 'home',
      title: 'Site 2 Home',
      content: { version: '1.0', layout: 'plant_shop', sections: [] },
      published: true,
      author_id: TEST_USER_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await this.supabase.from('content').insert([site1Content, site2Content])

    // Test site isolation
    const { data: site1Data, error: site1Error } = await this.supabase
      .from('content')
      .select('*')
      .eq('site_id', TEST_SITE_ID)

    const { data: site2Data, error: site2Error } = await this.supabase
      .from('content')
      .select('*')
      .eq('site_id', site2Id)

    assert(!site1Error && !site2Error, 'Both site queries successful')
    assert(site1Data?.some(item => item.title === 'Site 1 Home'), 'Site 1 content accessible')
    assert(site2Data?.some(item => item.title === 'Site 2 Home'), 'Site 2 content accessible')
    assert(!site1Data?.some(item => item.title === 'Site 2 Home'), 'Site 1 query does not return Site 2 content')
    assert(!site2Data?.some(item => item.title === 'Site 1 Home'), 'Site 2 query does not return Site 1 content')

    // Cleanup site 2
    await this.supabase.from('content').delete().eq('site_id', site2Id)
    await this.supabase.from('sites').delete().eq('id', site2Id)

    console.log('✅ Multi-tenant isolation working correctly')
  }

  generateMockContent(blockType) {
    const mockContent = {
      hero: {
        headline: 'Hero Headline',
        subheading: 'Hero Subheading',
        backgroundImage: '/images/hero.jpg'
      },
      featured_plants: {
        title: 'Featured Plants',
        plants: [{
          id: 'mock-plant',
          name: 'Mock Plant',
          price: 25.99
        }],
        showPricing: true
      },
      mission: {
        statement: 'Our mission statement'
      },
      team: {
        title: 'Our Team',
        members: [{
          id: 'mock-member',
          name: 'Mock Member',
          title: 'Plant Expert'
        }]
      },
      contact_form: {
        config: {
          id: 'mock-form',
          fields: []
        }
      },
      rich_text: {
        content: '<p>Rich text content</p>'
      },
      cta: {
        headline: 'Call to Action',
        primaryAction: {
          text: 'Click Here',
          href: '/action'
        }
      },
      plant_gallery: {
        title: 'Plant Gallery',
        plants: [],
        galleryType: 'grid'
      },
      care_guide: {
        title: 'Care Guide',
        guides: []
      },
      testimonials: {
        title: 'Testimonials',
        reviews: []
      },
      plant_categories: {
        title: 'Plant Categories',
        categories: []
      },
      seasonal_collection: {
        title: 'Seasonal Collection',
        season: 'spring',
        plants: []
      },
      plant_finder: {
        title: 'Plant Finder',
        questions: []
      },
      delivery_info: {
        title: 'Delivery Info',
        deliveryOptions: []
      },
      sustainability: {
        title: 'Sustainability',
        statement: 'Sustainability statement',
        initiatives: []
      }
    }

    return mockContent[blockType] || {}
  }

  generateLargeSectionSet() {
    return [
      {
        id: 'large-hero',
        type: 'hero',
        title: 'Hero',
        order: 1,
        visible: true,
        content: {
          headline: 'Large Content Test',
          subheading: 'Performance testing with substantial data'
        }
      },
      {
        id: 'large-featured-plants',
        type: 'featured_plants',
        title: 'Featured Plants',
        order: 2,
        visible: true,
        content: {
          title: 'Large Plant Collection',
          plants: Array.from({ length: 20 }, (_, i) => ({
            id: `large-plant-${i}`,
            name: `Plant ${i}`,
            price: 15 + i,
            category: ['Indoor', 'Outdoor', 'Succulent'][i % 3],
            difficulty: ['easy', 'moderate', 'challenging'][i % 3],
            stock: 10 + i,
            tags: [`tag-${i}`, 'performance-test']
          })),
          showPricing: true
        }
      }
    ]
  }

  async run() {
    console.log('🌱 Plant Shop Content Management System - Integration Test Suite')
    console.log('================================================================\n')

    try {
      await this.setup()
      
      await this.testPlantBlockTypes()
      await this.testContentCRUDOperations()
      await this.testPerformanceBenchmarks()
      await this.testContentIntegrity()
      await this.testMultiTenantIsolation()
      
      console.log('\n📊 Test Results Summary:')
      console.log('========================')
      console.log(`✅ Passed: ${testResults.passed}`)
      console.log(`❌ Failed: ${testResults.failed}`)
      console.log(`📈 Total: ${testResults.passed + testResults.failed}`)
      
      if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:')
        testResults.errors.forEach(error => console.log(`   - ${error}`))
      }
      
      console.log('\n⚡ Performance Results:')
      Object.entries(testResults.performance).forEach(([test, duration]) => {
        const status = duration < 200 ? '✅' : duration < 1000 ? '⚠️' : '❌'
        console.log(`   ${status} ${test}: ${duration.toFixed(2)}ms`)
      })
      
      const success = testResults.failed === 0
      console.log(`\n${success ? '🎉' : '💥'} Integration Test Suite ${success ? 'PASSED' : 'FAILED'}`)
      
      return success
      
    } catch (error) {
      console.error('💥 Test suite error:', error)
      return false
    } finally {
      await this.cleanup()
    }
  }
}

// Run the test suite
const testSuite = new PlantContentIntegrationTest()
const success = await testSuite.run()
process.exit(success ? 0 : 1)