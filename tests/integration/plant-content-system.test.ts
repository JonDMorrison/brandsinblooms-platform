/**
 * Comprehensive Integration Tests for Plant Shop Content Management System
 * Milestone 6: Integration Testing and Optimization
 * 
 * Tests the complete end-to-end functionality of the plant shop content system
 * including all 10+ plant block types, content workflows, and system integration.
 */

import { describe, test, expect, beforeAll, beforeEach, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database/types'
import { ContentBlock, ContentBlockType, PlantItem, TeamMember } from '@/types/content-blocks'

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

// Test site data
const TEST_SITE_ID = 'test-plant-shop-site'
const TEST_USER_ID = 'test-user-id'

describe('Plant Shop Content Management System - Integration Tests', () => {
  let supabase: ReturnType<typeof createClient<Database>>
  let testSiteId: string
  let testUserId: string

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Create test site and user
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .insert({
        id: TEST_SITE_ID,
        name: 'Test Plant Shop',
        domain: 'test-plant-shop.example.com',
        subdomain: 'test-plant-shop',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (siteError && siteError.code !== '23505') { // Ignore duplicate key error
      console.warn('Site creation error:', siteError)
    }

    testSiteId = TEST_SITE_ID
    testUserId = TEST_USER_ID
  })

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('content').delete().eq('site_id', testSiteId)
    await supabase.from('sites').delete().eq('id', testSiteId)
  })

  beforeEach(async () => {
    // Clean up any existing test content
    await supabase.from('content').delete().eq('site_id', testSiteId)
  })

  describe('1. Plant Content Block Types - Complete Coverage', () => {
    test('should create and validate all 10+ plant block types', async () => {
      const plantBlockTypes: ContentBlockType[] = [
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

      const testBlocks: ContentBlock[] = plantBlockTypes.map((type, index) => ({
        id: `test-block-${type}-${index}`,
        type,
        title: `Test ${type} Block`,
        order: index,
        visible: true,
        content: generateMockContentForType(type),
        styling: {
          layout: 'grid',
          padding: { top: 'md', bottom: 'md' },
          background: { variant: 'transparent' }
        }
      }))

      // Test each block type creation
      for (const block of testBlocks) {
        const { data, error } = await supabase
          .from('content')
          .insert({
            id: `content-${block.id}`,
            site_id: testSiteId,
            type: 'home_page',
            layout: 'plant_shop',
            slug: `test-${block.type}`,
            title: `Test Page - ${block.type}`,
            content: {
              version: '1.0',
              layout: 'plant_shop',
              sections: [block]
            },
            published: true,
            author_id: testUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(data).toBeTruthy()
        expect(data?.content).toHaveProperty('sections')
        
        const sections = (data?.content as any)?.sections
        expect(sections).toHaveLength(1)
        expect(sections[0].type).toBe(block.type)
      }
    })

    test('should validate plant-specific content structures', async () => {
      // Test PlantItem structure
      const plantItem: PlantItem = {
        id: 'test-plant-1',
        name: 'Snake Plant',
        scientificName: 'Sansevieria trifasciata',
        description: 'Low-maintenance indoor plant',
        price: 29.99,
        salePrice: 24.99,
        image: '/images/snake-plant.jpg',
        category: 'Indoor Plants',
        difficulty: 'easy',
        lightRequirement: 'low',
        waterRequirement: 'low',
        size: 'medium',
        stock: 15,
        inStock: true,
        featured: true,
        tags: ['beginner-friendly', 'air-purifying'],
        careInstructions: 'Water sparingly, tolerates low light',
        benefits: ['Air purification', 'Low maintenance'],
        url: '/plants/snake-plant'
      }

      // Test TeamMember structure
      const teamMember: TeamMember = {
        id: 'test-team-1',
        name: 'Jane Green',
        title: 'Plant Care Specialist',
        bio: 'Expert in indoor plant care with 10+ years experience',
        image: '/images/team/jane-green.jpg',
        expertise: ['Indoor Plants', 'Plant Diseases', 'Hydroponic Systems'],
        experience: '10+ years',
        certifications: ['Certified Horticulturist', 'Plant Health Specialist']
      }

      const featuredPlantsBlock: ContentBlock = {
        id: 'test-featured-plants',
        type: 'featured_plants',
        title: 'Featured Plants',
        order: 1,
        visible: true,
        content: {
          title: 'Our Best Sellers',
          description: 'Popular plants perfect for beginners',
          plants: [plantItem],
          showPricing: true,
          showCareInfo: true,
          filterOptions: {
            byCategory: true,
            byDifficulty: true,
            byLight: true,
            bySize: true
          }
        }
      }

      const teamBlock: ContentBlock = {
        id: 'test-team',
        type: 'team',
        title: 'Our Team',
        order: 2,
        visible: true,
        content: {
          title: 'Plant Experts',
          description: 'Meet our passionate plant care team',
          members: [teamMember],
          showExpertise: true,
          showSocialLinks: false
        }
      }

      const { data, error } = await supabase
        .from('content')
        .insert({
          id: 'content-plant-structures',
          site_id: testSiteId,
          type: 'home_page',
          layout: 'plant_shop',
          slug: 'test-plant-structures',
          title: 'Plant Structure Test',
          content: {
            version: '1.0',
            layout: 'plant_shop',
            sections: [featuredPlantsBlock, teamBlock]
          },
          published: true,
          author_id: testUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.content).toHaveProperty('sections')
      
      const sections = (data?.content as any)?.sections
      expect(sections).toHaveLength(2)
      
      // Validate featured plants content
      const featuredSection = sections.find((s: any) => s.type === 'featured_plants')
      expect(featuredSection.content.plants).toHaveLength(1)
      expect(featuredSection.content.plants[0]).toMatchObject(plantItem)
      
      // Validate team content
      const teamSection = sections.find((s: any) => s.type === 'team')
      expect(teamSection.content.members).toHaveLength(1)
      expect(teamSection.content.members[0]).toMatchObject(teamMember)
    })
  })

  describe('2. Content Creation and Editing Workflows', () => {
    test('should support complete CRUD operations on plant content', async () => {
      // CREATE
      const initialContent = {
        id: 'content-crud-test',
        site_id: testSiteId,
        type: 'home_page' as const,
        layout: 'plant_shop',
        slug: 'crud-test',
        title: 'CRUD Test Page',
        content: {
          version: '1.0',
          layout: 'plant_shop',
          sections: [{
            id: 'hero-section',
            type: 'hero' as ContentBlockType,
            title: 'Welcome',
            order: 1,
            visible: true,
            content: {
              headline: 'Welcome to Our Plant Shop',
              subheading: 'Discover amazing plants',
              description: 'Find the perfect plants for your home',
              backgroundImage: '/images/hero-bg.jpg'
            }
          }]
        },
        published: true,
        author_id: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Test CREATE
      const { data: created, error: createError } = await supabase
        .from('content')
        .insert(initialContent)
        .select()
        .single()

      expect(createError).toBeNull()
      expect(created).toBeTruthy()

      // Test READ
      const { data: read, error: readError } = await supabase
        .from('content')
        .select('*')
        .eq('id', 'content-crud-test')
        .single()

      expect(readError).toBeNull()
      expect(read?.title).toBe('CRUD Test Page')

      // Test UPDATE - Add new section
      const updatedContent = {
        ...read.content,
        sections: [
          ...(read.content as any).sections,
          {
            id: 'new-featured-plants',
            type: 'featured_plants' as ContentBlockType,
            title: 'Featured Plants',
            order: 2,
            visible: true,
            content: {
              title: 'Best Sellers',
              plants: [],
              showPricing: true
            }
          }
        ]
      }

      const { data: updated, error: updateError } = await supabase
        .from('content')
        .update({
          content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'content-crud-test')
        .select()
        .single()

      expect(updateError).toBeNull()
      expect((updated?.content as any)?.sections).toHaveLength(2)

      // Test DELETE
      const { error: deleteError } = await supabase
        .from('content')
        .delete()
        .eq('id', 'content-crud-test')

      expect(deleteError).toBeNull()

      // Verify deletion
      const { data: deleted, error: verifyError } = await supabase
        .from('content')
        .select('*')
        .eq('id', 'content-crud-test')
        .single()

      expect(deleted).toBeNull()
    })

    test('should handle content block reordering', async () => {
      const contentWithMultipleSections = {
        id: 'content-reorder-test',
        site_id: testSiteId,
        type: 'home_page' as const,
        layout: 'plant_shop',
        slug: 'reorder-test',
        title: 'Reorder Test',
        content: {
          version: '1.0',
          layout: 'plant_shop',
          sections: [
            {
              id: 'section-1',
              type: 'hero' as ContentBlockType,
              title: 'Hero',
              order: 1,
              visible: true,
              content: { headline: 'Hero Section' }
            },
            {
              id: 'section-2',
              type: 'featured_plants' as ContentBlockType,
              title: 'Featured',
              order: 2,
              visible: true,
              content: { plants: [] }
            },
            {
              id: 'section-3',
              type: 'mission' as ContentBlockType,
              title: 'Mission',
              order: 3,
              visible: true,
              content: { statement: 'Our mission' }
            }
          ]
        },
        published: true,
        author_id: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Create initial content
      await supabase.from('content').insert(contentWithMultipleSections)

      // Reorder sections (reverse order)
      const reorderedContent = {
        ...contentWithMultipleSections.content,
        sections: [
          { ...contentWithMultipleSections.content.sections[2], order: 1 },
          { ...contentWithMultipleSections.content.sections[1], order: 2 },
          { ...contentWithMultipleSections.content.sections[0], order: 3 }
        ]
      }

      const { data: updated, error } = await supabase
        .from('content')
        .update({ 
          content: reorderedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'content-reorder-test')
        .select()
        .single()

      expect(error).toBeNull()
      
      const sections = (updated?.content as any)?.sections
      expect(sections[0].type).toBe('mission')
      expect(sections[1].type).toBe('featured_plants')
      expect(sections[2].type).toBe('hero')
      expect(sections[0].order).toBe(1)
      expect(sections[1].order).toBe(2)
      expect(sections[2].order).toBe(3)
    })
  })

  describe('3. Performance Testing', () => {
    test('should meet performance benchmarks for content operations', async () => {
      // Create multiple content items for performance testing
      const performanceContent = Array.from({ length: 10 }, (_, i) => ({
        id: `perf-content-${i}`,
        site_id: testSiteId,
        type: 'home_page' as const,
        layout: 'plant_shop',
        slug: `perf-test-${i}`,
        title: `Performance Test ${i}`,
        content: {
          version: '1.0',
          layout: 'plant_shop',
          sections: generateLargeSectionSet()
        },
        published: true,
        author_id: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      // Test bulk insert performance
      const insertStart = performance.now()
      const { data: inserted, error: insertError } = await supabase
        .from('content')
        .insert(performanceContent)
        .select()

      const insertEnd = performance.now()
      const insertTime = insertEnd - insertStart

      expect(insertError).toBeNull()
      expect(inserted).toHaveLength(10)
      expect(insertTime).toBeLessThan(1000) // Should complete in under 1 second

      // Test query performance
      const queryStart = performance.now()
      const { data: queried, error: queryError } = await supabase
        .from('content')
        .select('*')
        .eq('site_id', testSiteId)
        .eq('published', true)

      const queryEnd = performance.now()
      const queryTime = queryEnd - queryStart

      expect(queryError).toBeNull()
      expect(queried).toHaveLength(10)
      expect(queryTime).toBeLessThan(200) // Should query in under 200ms (target from M5)

      // Test single content item load performance
      const singleQueryStart = performance.now()
      const { data: singleItem, error: singleError } = await supabase
        .from('content')
        .select('*')
        .eq('id', 'perf-content-0')
        .single()

      const singleQueryEnd = performance.now()
      const singleQueryTime = singleQueryEnd - singleQueryStart

      expect(singleError).toBeNull()
      expect(singleItem).toBeTruthy()
      expect(singleQueryTime).toBeLessThan(50) // Should load single item in under 50ms

      console.log('Performance Results:')
      console.log(`- Bulk Insert (10 items): ${insertTime.toFixed(2)}ms`)
      console.log(`- Query All Items: ${queryTime.toFixed(2)}ms`)
      console.log(`- Single Item Load: ${singleQueryTime.toFixed(2)}ms`)
    })

    test('should efficiently handle JSONB content queries', async () => {
      // Create content with complex nested structures
      const complexContent = {
        id: 'complex-jsonb-test',
        site_id: testSiteId,
        type: 'home_page' as const,
        layout: 'plant_shop',
        slug: 'complex-test',
        title: 'Complex JSONB Test',
        content: {
          version: '1.0',
          layout: 'plant_shop',
          sections: [
            {
              id: 'complex-featured-plants',
              type: 'featured_plants' as ContentBlockType,
              title: 'Featured Plants',
              order: 1,
              visible: true,
              content: {
                title: 'Best Sellers',
                plants: Array.from({ length: 50 }, (_, i) => ({
                  id: `plant-${i}`,
                  name: `Plant ${i}`,
                  price: 10 + i,
                  category: ['Indoor', 'Outdoor', 'Succulent'][i % 3],
                  metadata: {
                    tags: [`tag-${i}`, `category-${i % 3}`],
                    details: {
                      care: { water: 'weekly', light: 'bright' },
                      origin: 'greenhouse',
                      certifications: ['organic', 'sustainable']
                    }
                  }
                })),
                filterOptions: {
                  byCategory: true,
                  byDifficulty: true,
                  byLight: true,
                  bySize: true
                }
              }
            }
          ]
        },
        published: true,
        author_id: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await supabase.from('content').insert(complexContent)

      // Test JSONB path queries
      const jsonbQueryStart = performance.now()
      const { data: jsonbResult, error: jsonbError } = await supabase
        .from('content')
        .select('*')
        .eq('site_id', testSiteId)
        .eq('type', 'home_page')
        .contains('content', { layout: 'plant_shop' })

      const jsonbQueryEnd = performance.now()
      const jsonbQueryTime = jsonbQueryEnd - jsonbQueryStart

      expect(jsonbError).toBeNull()
      expect(jsonbResult).toHaveLength(1)
      expect(jsonbQueryTime).toBeLessThan(100) // JSONB queries should be fast

      console.log(`JSONB Query Performance: ${jsonbQueryTime.toFixed(2)}ms`)
    })
  })

  describe('4. Content Export/Import Functionality', () => {
    test('should export and import plant content with full fidelity', async () => {
      const exportTestContent = {
        id: 'export-import-test',
        site_id: testSiteId,
        type: 'home_page' as const,
        layout: 'plant_shop',
        slug: 'export-test',
        title: 'Export Test Page',
        content: {
          version: '1.0',
          layout: 'plant_shop',
          sections: [
            {
              id: 'hero-export',
              type: 'hero' as ContentBlockType,
              title: 'Hero Section',
              order: 1,
              visible: true,
              content: {
                headline: 'Plant Shop Hero',
                subheading: 'Quality plants for your home',
                backgroundImage: '/images/hero.jpg',
                ctaButtons: [{
                  id: 'cta-1',
                  text: 'Shop Now',
                  href: '/shop',
                  variant: 'primary' as const
                }]
              },
              styling: {
                background: { variant: 'primary' as const },
                padding: { top: 'lg' as const, bottom: 'lg' as const }
              }
            },
            {
              id: 'plants-export',
              type: 'featured_plants' as ContentBlockType,
              title: 'Featured Plants',
              order: 2,
              visible: true,
              content: {
                title: 'Best Sellers',
                plants: [{
                  id: 'plant-export-1',
                  name: 'Peace Lily',
                  scientificName: 'Spathiphyllum wallisii',
                  price: 34.99,
                  image: '/images/peace-lily.jpg',
                  difficulty: 'easy' as const,
                  lightRequirement: 'medium' as const,
                  careInstructions: 'Water when topsoil is dry'
                }],
                showPricing: true,
                showCareInfo: true
              }
            }
          ]
        },
        published: true,
        author_id: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Create original content
      await supabase.from('content').insert(exportTestContent)

      // Export (simulate by querying)
      const { data: exported, error: exportError } = await supabase
        .from('content')
        .select('*')
        .eq('id', 'export-import-test')
        .single()

      expect(exportError).toBeNull()
      expect(exported).toBeTruthy()

      // Delete original
      await supabase.from('content').delete().eq('id', 'export-import-test')

      // Import (re-insert with new ID)
      const importedContent = {
        ...exported,
        id: 'imported-content-test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: imported, error: importError } = await supabase
        .from('content')
        .insert(importedContent)
        .select()
        .single()

      expect(importError).toBeNull()
      expect(imported).toBeTruthy()

      // Verify content integrity
      expect(imported.title).toBe(exported.title)
      expect(imported.layout).toBe(exported.layout)
      expect((imported.content as any).sections).toHaveLength(2)
      
      const importedSections = (imported.content as any).sections
      const originalSections = (exported.content as any).sections
      
      expect(importedSections[0].content.headline).toBe(originalSections[0].content.headline)
      expect(importedSections[1].content.plants[0].name).toBe(originalSections[1].content.plants[0].name)
    })
  })

  describe('5. Integration with Existing Systems', () => {
    test('should integrate with multi-tenant site system', async () => {
      // Create content for multiple sites to test isolation
      const site1Content = {
        id: 'site-1-content',
        site_id: testSiteId,
        type: 'home_page' as const,
        layout: 'plant_shop',
        slug: 'home',
        title: 'Site 1 Home',
        content: { version: '1.0', layout: 'plant_shop', sections: [] },
        published: true,
        author_id: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const site2Id = 'test-site-2'
      const site2Content = {
        id: 'site-2-content',
        site_id: site2Id,
        type: 'home_page' as const,
        layout: 'plant_shop',
        slug: 'home',
        title: 'Site 2 Home',
        content: { version: '1.0', layout: 'plant_shop', sections: [] },
        published: true,
        author_id: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Create site 2
      await supabase.from('sites').insert({
        id: site2Id,
        name: 'Test Site 2',
        domain: 'test-site-2.example.com',
        subdomain: 'test-site-2',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      // Insert content for both sites
      await supabase.from('content').insert([site1Content, site2Content])

      // Test site isolation - query site 1 content
      const { data: site1Data, error: site1Error } = await supabase
        .from('content')
        .select('*')
        .eq('site_id', testSiteId)

      expect(site1Error).toBeNull()
      expect(site1Data).toHaveLength(1)
      expect(site1Data?.[0].title).toBe('Site 1 Home')

      // Test site isolation - query site 2 content
      const { data: site2Data, error: site2Error } = await supabase
        .from('content')
        .select('*')
        .eq('site_id', site2Id)

      expect(site2Error).toBeNull()
      expect(site2Data).toHaveLength(1)
      expect(site2Data?.[0].title).toBe('Site 2 Home')

      // Cleanup site 2
      await supabase.from('content').delete().eq('site_id', site2Id)
      await supabase.from('sites').delete().eq('id', site2Id)
    })

    test('should work with theme system integration', async () => {
      const themedContent = {
        id: 'themed-content-test',
        site_id: testSiteId,
        type: 'home_page' as const,
        layout: 'plant_shop',
        slug: 'themed-test',
        title: 'Themed Content Test',
        content: {
          version: '1.0',
          layout: 'plant_shop',
          sections: [
            {
              id: 'themed-hero',
              type: 'hero' as ContentBlockType,
              title: 'Themed Hero',
              order: 1,
              visible: true,
              content: {
                headline: 'Themed Plant Shop',
                subheading: 'With custom styling'
              },
              styling: {
                background: { 
                  variant: 'gradient-primary' as const,
                  opacity: 0.9 
                },
                padding: { 
                  top: 'xl' as const, 
                  bottom: 'xl' as const 
                },
                border: {
                  radius: 'lg' as const,
                  width: 2,
                  style: 'solid' as const,
                  color: '#10b981'
                },
                shadow: 'lg' as const,
                animation: 'fade-in' as const
              }
            }
          ]
        },
        published: true,
        author_id: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: themed, error: themedError } = await supabase
        .from('content')
        .insert(themedContent)
        .select()
        .single()

      expect(themedError).toBeNull()
      expect(themed).toBeTruthy()

      const themedSection = (themed.content as any).sections[0]
      expect(themedSection.styling).toBeTruthy()
      expect(themedSection.styling.background.variant).toBe('gradient-primary')
      expect(themedSection.styling.animation).toBe('fade-in')
      expect(themedSection.styling.shadow).toBe('lg')
    })
  })

  describe('6. Content Integrity and Validation', () => {
    test('should maintain content integrity across operations', async () => {
      const integrityTestContent = {
        id: 'integrity-test',
        site_id: testSiteId,
        type: 'home_page' as const,
        layout: 'plant_shop',
        slug: 'integrity-test',
        title: 'Integrity Test',
        content: {
          version: '1.0',
          layout: 'plant_shop',
          sections: [
            {
              id: 'integrity-plants',
              type: 'featured_plants' as ContentBlockType,
              title: 'Plant Integrity Test',
              order: 1,
              visible: true,
              content: {
                title: 'Featured Plants',
                plants: [
                  {
                    id: 'plant-integrity-1',
                    name: 'Monstera Deliciosa',
                    scientificName: 'Monstera deliciosa',
                    description: 'Swiss cheese plant with iconic split leaves',
                    price: 89.99,
                    salePrice: 69.99,
                    image: '/images/monstera.jpg',
                    images: ['/images/monstera-1.jpg', '/images/monstera-2.jpg'],
                    category: 'Tropical Plants',
                    difficulty: 'moderate' as const,
                    lightRequirement: 'bright' as const,
                    waterRequirement: 'medium' as const,
                    size: 'large' as const,
                    stock: 8,
                    inStock: true,
                    featured: true,
                    tags: ['tropical', 'statement-plant', 'air-purifying'],
                    careInstructions: 'Bright indirect light, water when top inch of soil is dry',
                    benefits: ['Air purification', 'Aesthetic appeal', 'Natural humidifier'],
                    url: '/plants/monstera-deliciosa',
                    order: 1,
                    metadata: {
                      origin: 'Central America',
                      mature_size: '6-8 feet indoors',
                      growth_rate: 'fast',
                      toxicity: 'toxic to pets',
                      botanical_family: 'Araceae'
                    }
                  }
                ],
                showPricing: true,
                showCareInfo: true,
                filterOptions: {
                  byCategory: true,
                  byDifficulty: true,
                  byLight: true,
                  bySize: true
                }
              }
            }
          ]
        },
        published: true,
        author_id: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Create content
      await supabase.from('content').insert(integrityTestContent)

      // Perform multiple operations
      for (let i = 0; i < 5; i++) {
        // Read
        const { data: read, error: readError } = await supabase
          .from('content')
          .select('*')
          .eq('id', 'integrity-test')
          .single()

        expect(readError).toBeNull()

        // Update with slight modification
        const updatedContent = {
          ...read.content,
          sections: (read.content as any).sections.map((section: any) => ({
            ...section,
            content: {
              ...section.content,
              title: `${section.content.title} - Update ${i}`
            }
          }))
        }

        const { data: updated, error: updateError } = await supabase
          .from('content')
          .update({
            content: updatedContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', 'integrity-test')
          .select()
          .single()

        expect(updateError).toBeNull()
        
        // Verify data integrity
        const updatedSection = (updated.content as any).sections[0]
        expect(updatedSection.content.plants).toHaveLength(1)
        expect(updatedSection.content.plants[0].metadata).toBeTruthy()
        expect(updatedSection.content.plants[0].metadata.botanical_family).toBe('Araceae')
      }

      // Final integrity check
      const { data: final, error: finalError } = await supabase
        .from('content')
        .select('*')
        .eq('id', 'integrity-test')
        .single()

      expect(finalError).toBeNull()
      const finalSection = (final.content as any).sections[0]
      expect(finalSection.content.title).toBe('Featured Plants - Update 4')
      expect(finalSection.content.plants[0].name).toBe('Monstera Deliciosa')
      expect(finalSection.content.plants[0].tags).toContain('air-purifying')
    })
  })
})

// Helper functions

function generateMockContentForType(type: ContentBlockType): any {
  switch (type) {
    case 'hero':
      return {
        headline: 'Hero Headline',
        subheading: 'Hero Subheading',
        backgroundImage: '/images/hero.jpg'
      }
    case 'featured_plants':
      return {
        title: 'Featured Plants',
        plants: [{
          id: 'mock-plant',
          name: 'Mock Plant',
          price: 25.99
        }],
        showPricing: true
      }
    case 'mission':
      return {
        statement: 'Our mission statement'
      }
    case 'team':
      return {
        title: 'Our Team',
        members: [{
          id: 'mock-member',
          name: 'Mock Member',
          title: 'Plant Expert'
        }]
      }
    case 'contact_form':
      return {
        config: {
          id: 'mock-form',
          fields: []
        }
      }
    case 'rich_text':
      return {
        content: '<p>Rich text content</p>'
      }
    case 'cta':
      return {
        headline: 'Call to Action',
        primaryAction: {
          text: 'Click Here',
          href: '/action'
        }
      }
    case 'plant_gallery':
      return {
        title: 'Plant Gallery',
        plants: [],
        galleryType: 'grid' as const
      }
    case 'care_guide':
      return {
        title: 'Care Guide',
        guides: []
      }
    case 'testimonials':
      return {
        title: 'Testimonials',
        reviews: []
      }
    case 'plant_categories':
      return {
        title: 'Plant Categories',
        categories: []
      }
    case 'seasonal_collection':
      return {
        title: 'Seasonal Collection',
        season: 'spring' as const,
        plants: []
      }
    case 'plant_finder':
      return {
        title: 'Plant Finder',
        questions: []
      }
    case 'delivery_info':
      return {
        title: 'Delivery Info',
        deliveryOptions: []
      }
    case 'sustainability':
      return {
        title: 'Sustainability',
        statement: 'Sustainability statement',
        initiatives: []
      }
    default:
      return {}
  }
}

function generateLargeSectionSet(): any[] {
  return [
    {
      id: 'large-hero',
      type: 'hero',
      title: 'Hero',
      order: 1,
      visible: true,
      content: {
        headline: 'Large Content Test',
        subheading: 'Performance testing with large datasets',
        description: 'Testing content system with substantial data loads'
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
          scientificName: `Plantus ${i}`,
          price: 15 + i,
          salePrice: 10 + i,
          category: ['Indoor', 'Outdoor', 'Succulent'][i % 3],
          difficulty: ['easy', 'moderate', 'challenging'][i % 3],
          lightRequirement: ['low', 'medium', 'bright', 'direct'][i % 4],
          stock: 10 + i,
          inStock: true,
          tags: [`tag-${i}`, `category-${i % 3}`, 'performance-test']
        })),
        showPricing: true,
        showCareInfo: true
      }
    },
    {
      id: 'large-mission',
      type: 'mission',
      title: 'Mission',
      order: 3,
      visible: true,
      content: {
        statement: 'Our mission is to provide high-quality plants and exceptional service to plant enthusiasts everywhere.',
        values: Array.from({ length: 5 }, (_, i) => ({
          id: `value-${i}`,
          title: `Value ${i}`,
          description: `Description for value ${i}`,
          icon: `icon-${i}`
        }))
      }
    }
  ]
}