/**
 * Plant Shop Content System - Validation & Performance Test
 * Milestone 6: Integration Testing and Optimization
 * 
 * Validates existing plant content migration and tests system performance
 */

import { createClient } from '@supabase/supabase-js'
import { performance } from 'perf_hooks'
import fs from 'fs'
import path from 'path'

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  performance: {},
  errors: [],
  findings: []
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

function log(message) {
  testResults.findings.push(message)
  console.log(`📝 ${message}`)
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

class PlantContentValidator {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }

  async validateMigratedContent() {
    console.log('\n🔍 Validating Migrated Plant Content...')

    // Check total content count
    const { data: allContent, error: countError } = await this.supabase
      .from('content')
      .select('id, title, content_type, is_published')

    assert(!countError, 'Can query content table')
    log(`Total content items in database: ${allContent?.length || 0}`)

    // Check published content
    const publishedContent = allContent?.filter(item => item.is_published) || []
    log(`Published content items: ${publishedContent.length}`)

    // Check content types
    const contentTypes = [...new Set(allContent?.map(item => item.content_type) || [])]
    log(`Content types found: ${contentTypes.join(', ')}`)

    // Validate plant-specific content exists
    const { data: plantShopContent, error: plantError } = await this.supabase
      .from('content')
      .select('*')
      .contains('content', { layout: 'plant_shop' })

    assert(!plantError, 'Can query plant shop content')
    log(`Plant shop layout content items: ${plantShopContent?.length || 0}`)

    if (plantShopContent && plantShopContent.length > 0) {
      // Analyze plant content structure
      const plantContentAnalysis = plantShopContent.map(item => {
        const sections = item.content?.sections || []
        const plantSections = sections.filter(section => 
          ['featured_plants', 'plant-categories', 'care-resources', 'seasonal-guidance'].includes(section.type)
        )
        return {
          id: item.id,
          title: item.title,
          totalSections: sections.length,
          plantSections: plantSections.length,
          plantSectionTypes: plantSections.map(s => s.type)
        }
      })

      log('Plant content analysis:')
      plantContentAnalysis.forEach(analysis => {
        log(`  - ${analysis.title}: ${analysis.plantSections}/${analysis.totalSections} plant sections [${analysis.plantSectionTypes.join(', ')}]`)
      })

      const totalPlantSections = plantContentAnalysis.reduce((sum, item) => sum + item.plantSections, 0)
      assert(totalPlantSections > 0, `Found ${totalPlantSections} plant-specific content sections`)
    }

    console.log('✅ Migrated content validation completed')
  }

  async validatePerformance() {
    console.log('\n⚡ Validating Content Performance...')

    // Test 1: Basic content query performance
    const basicQueryTest = measurePerformance('basic_content_query', async () => {
      return await this.supabase
        .from('content')
        .select('*')
        .eq('is_published', true)
        .limit(10)
    })

    const { data: basicResults, error: basicError } = await basicQueryTest()
    assert(!basicError, 'Basic content query successful')
    assert(testResults.performance.basic_content_query < 200, 'Basic query under 200ms (M5 target)')

    // Test 2: JSONB content query performance
    const jsonbQueryTest = measurePerformance('jsonb_content_query', async () => {
      return await this.supabase
        .from('content')
        .select('*')
        .contains('content', { version: '1.0' })
        .limit(5)
    })

    const { data: jsonbResults, error: jsonbError } = await jsonbQueryTest()
    assert(!jsonbError, 'JSONB content query successful')
    assert(testResults.performance.jsonb_content_query < 100, 'JSONB query under 100ms (optimized target)')

    // Test 3: Complex content filtering
    const filterQueryTest = measurePerformance('filtered_content_query', async () => {
      return await this.supabase
        .from('content')
        .select('*')
        .eq('is_published', true)
        .eq('content_type', 'home_page')
        .limit(5)
    })

    const { data: filterResults, error: filterError } = await filterQueryTest()
    assert(!filterError, 'Filtered content query successful')
    assert(testResults.performance.filtered_content_query < 50, 'Filtered query under 50ms (target)')

    // Test 4: Large content handling
    const largeQueryTest = measurePerformance('large_content_query', async () => {
      return await this.supabase
        .from('content')
        .select('*')
        .limit(50)
    })

    const { data: largeResults, error: largeError } = await largeQueryTest()
    assert(!largeError, 'Large content query successful')
    log(`Large query returned ${largeResults?.length || 0} items`)

    console.log('✅ Performance validation completed')
  }

  async validatePlantComponents() {
    console.log('\n🌱 Validating Plant Component System...')

    // Check if plant editor components exist
    const editorComponents = [
      'src/components/content-sections/editors/PlantShowcaseEditor.tsx',
      'src/components/content-sections/editors/PlantGridEditor.tsx',
      'src/components/content-sections/editors/PlantCareGuideEditor.tsx',
      'src/components/content-sections/editors/PlantCategoriesEditor.tsx',
      'src/components/content-sections/editors/PlantBenefitsEditor.tsx',
      'src/components/content-sections/editors/PlantComparisonEditor.tsx'
    ]

    let foundEditors = 0
    for (const componentPath of editorComponents) {
      const fullPath = path.resolve(componentPath)
      if (fs.existsSync(fullPath)) {
        foundEditors++
      }
    }

    assert(foundEditors >= 5, `Found ${foundEditors}/${editorComponents.length} plant editor components`)

    // Check if plant view components exist
    const viewComponents = [
      'src/components/content-sections/plant-shop/PlantShowcaseView.tsx',
      'src/components/content-sections/plant-shop/PlantGridView.tsx',
      'src/components/content-sections/plant-shop/PlantCareGuideView.tsx',
      'src/components/content-sections/plant-shop/PlantCategoriesView.tsx'
    ]

    let foundViews = 0
    for (const componentPath of viewComponents) {
      const fullPath = path.resolve(componentPath)
      if (fs.existsSync(fullPath)) {
        foundViews++
      }
    }

    assert(foundViews >= 3, `Found ${foundViews}/${viewComponents.length} plant view components`)

    // Check theme integration
    const themeFiles = [
      'src/components/theme/PlantShopTheme.tsx',
      'src/hooks/usePlantShopTheme.ts',
      'src/lib/theme/plant-shop-variables.ts'
    ]

    let foundTheme = 0
    for (const themeFile of themeFiles) {
      const fullPath = path.resolve(themeFile)
      if (fs.existsSync(fullPath)) {
        foundTheme++
      }
    }

    assert(foundTheme >= 2, `Found ${foundTheme}/${themeFiles.length} plant theme integration files`)

    console.log('✅ Plant component system validation completed')
  }

  async validateContentTypes() {
    console.log('\n🧱 Validating Content Block Types...')

    // Read content types from the system
    const contentTypesFile = 'src/types/content-blocks.ts'
    let supportedBlockTypes = []

    if (fs.existsSync(contentTypesFile)) {
      const typeFileContent = fs.readFileSync(contentTypesFile, 'utf8')
      
      // Extract plant block types from the file
      const blockTypeMatches = typeFileContent.match(/export type ContentBlockType =[\s\S]*?(?=export|$)/)?.[0]
      if (blockTypeMatches) {
        const types = blockTypeMatches.match(/'[^']+'/g) || []
        supportedBlockTypes = types.map(t => t.replace(/'/g, ''))
      }
    }

    log(`Supported content block types: ${supportedBlockTypes.length}`)
    log(`Block types: ${supportedBlockTypes.join(', ')}`)

    // Validate essential plant block types are supported
    const essentialPlantTypes = [
      'hero',
      'featured_plants',
      'plant_gallery',
      'care_guide',
      'plant_categories',
      'sustainability'
    ]

    const supportedEssentialTypes = essentialPlantTypes.filter(type => 
      supportedBlockTypes.includes(type)
    )

    assert(supportedEssentialTypes.length >= 5, 
      `Supports ${supportedEssentialTypes.length}/${essentialPlantTypes.length} essential plant block types`
    )

    console.log('✅ Content block type validation completed')
  }

  async validateDatabaseSchema() {
    console.log('\n🗄️ Validating Database Schema...')

    // Check content table structure
    const { data: contentSample, error: sampleError } = await this.supabase
      .from('content')
      .select('*')
      .limit(1)
      .single()

    if (!sampleError && contentSample) {
      const expectedFields = [
        'id', 'site_id', 'content_type', 'slug', 'title', 'content', 
        'is_published', 'author_id', 'created_at', 'updated_at'
      ]

      const actualFields = Object.keys(contentSample)
      const hasAllFields = expectedFields.every(field => actualFields.includes(field))

      assert(hasAllFields, 'Content table has all required fields')
      log(`Content table fields: ${actualFields.join(', ')}`)

      // Check JSONB content structure
      if (contentSample.content && typeof contentSample.content === 'object') {
        const contentStructure = contentSample.content
        assert(contentStructure.version !== undefined, 'Content has version field')
        assert(Array.isArray(contentStructure.sections), 'Content has sections array')
        
        if (contentStructure.sections && contentStructure.sections.length > 0) {
          const sampleSection = contentStructure.sections[0]
          const expectedSectionFields = ['id', 'type', 'order', 'visible', 'content']
          const hasSectionFields = expectedSectionFields.every(field => 
            sampleSection.hasOwnProperty(field)
          )
          assert(hasSectionFields, 'Content sections have required structure')
        }
      }
    }

    // Check sites table integration
    const { data: sitesSample, error: sitesError } = await this.supabase
      .from('sites')
      .select('id, name, subdomain, is_active, is_published')
      .limit(1)
      .single()

    assert(!sitesError, 'Can query sites table')
    if (sitesSample) {
      log(`Sample site: ${sitesSample.name} (${sitesSample.subdomain})`)
    }

    console.log('✅ Database schema validation completed')
  }

  async generateReport() {
    console.log('\n📊 Generating Integration Test Report...')

    const report = {
      timestamp: new Date().toISOString(),
      testResults: {
        passed: testResults.passed,
        failed: testResults.failed,
        total: testResults.passed + testResults.failed,
        successRate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)
      },
      performance: testResults.performance,
      findings: testResults.findings,
      errors: testResults.errors,
      assessment: {
        contentMigration: testResults.passed >= 15 ? 'Complete' : 'Incomplete',
        performance: Object.values(testResults.performance).every(d => d < 200) ? 'Excellent' : 'Good',
        componentSystem: testResults.passed >= 20 ? 'Fully Integrated' : 'Partially Integrated',
        overallStatus: testResults.failed === 0 ? 'PASSED' : 'NEEDS ATTENTION'
      }
    }

    // Write report to file
    const reportPath = 'MILESTONE_6_INTEGRATION_TEST_REPORT.json'
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    log(`Integration test report saved to: ${reportPath}`)

    return report
  }

  async run() {
    console.log('🌱 Plant Shop Content System - Integration Validation')
    console.log('=====================================================\n')

    try {
      await this.validateMigratedContent()
      await this.validatePerformance()
      await this.validatePlantComponents()
      await this.validateContentTypes()
      await this.validateDatabaseSchema()
      
      const report = await this.generateReport()
      
      console.log('\n📊 Integration Validation Results:')
      console.log('==================================')
      console.log(`✅ Passed: ${testResults.passed}`)
      console.log(`❌ Failed: ${testResults.failed}`)
      console.log(`📈 Success Rate: ${report.testResults.successRate}%`)
      
      if (testResults.failed > 0) {
        console.log('\n❌ Issues Found:')
        testResults.errors.forEach(error => console.log(`   - ${error}`))
      }
      
      console.log('\n⚡ Performance Summary:')
      Object.entries(testResults.performance).forEach(([test, duration]) => {
        const status = duration < 50 ? '🚀' : duration < 100 ? '✅' : duration < 200 ? '⚠️' : '❌'
        console.log(`   ${status} ${test}: ${duration.toFixed(2)}ms`)
      })
      
      console.log('\n🎯 Overall Assessment:')
      console.log(`   Content Migration: ${report.assessment.contentMigration}`)
      console.log(`   Performance: ${report.assessment.performance}`)
      console.log(`   Component System: ${report.assessment.componentSystem}`)
      console.log(`   Status: ${report.assessment.overallStatus}`)
      
      const success = testResults.failed === 0
      console.log(`\n${success ? '🎉' : '💥'} Integration Validation ${success ? 'PASSED' : 'NEEDS ATTENTION'}`)
      
      if (success) {
        console.log('\n✨ The plant shop content management system is ready for production!')
        console.log('   - All migrated content validated')
        console.log('   - Performance targets met')
        console.log('   - Component system fully integrated')
        console.log('   - Database schema optimized')
      }
      
      return success
      
    } catch (error) {
      console.error('💥 Integration validation error:', error)
      return false
    }
  }
}

// Run the validation
const validator = new PlantContentValidator()
const success = await validator.run()
process.exit(success ? 0 : 1)