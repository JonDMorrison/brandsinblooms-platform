#!/usr/bin/env tsx
/**
 * Test Plant Shop Content Transformation
 * Validates the content transformation without database operations
 * 
 * Usage:
 *   pnpm tsx scripts/test-plant-content-transformation.ts [--verbose] [--page <pageId>]
 */

import { PlantShopTransformer, transformPlantShopContent } from '@/lib/content/plant-shop-transformer'
import { PlantShopBatchMigration } from '@/lib/content/migration'
import { 
  PlantShopContentSchema, 
  PageContentSchema,
  PlantMigrationInputSchema 
} from '@/lib/content/validation'
import { plantShopContent } from '@/data/plant-shop-content'
import { handleError } from '@/lib/types/error-handling'

/**
 * Test configuration
 */
interface TestConfig {
  verbose: boolean
  specificPage?: string
  showDetails: boolean
}

/**
 * Test results
 */
interface TestResults {
  timestamp: string
  config: TestConfig
  summary: {
    totalPages: number
    successful: number
    failed: number
    warnings: number
  }
  transformationStats: {
    originalSize: number
    transformedSize: number
    compressionRatio: number
  }
  validationResults: {
    schemaValidation: {
      passed: number
      failed: number
      errors: string[]
    }
    contentValidation: {
      passed: number
      failed: number
      errors: string[]
    }
  }
  pageResults: Array<{
    pageId: string
    success: boolean
    originalSize: number
    transformedSize: number
    validationErrors: string[]
    warnings: string[]
  }>
}

/**
 * Parse command line arguments
 */
function parseTestArgs(): TestConfig {
  const args = process.argv.slice(2)
  const config: TestConfig = {
    verbose: false,
    showDetails: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--verbose':
        config.verbose = true
        break
      case '--details':
        config.showDetails = true
        break
      case '--page':
        config.specificPage = args[++i]
        break
      case '--help':
        showTestHelp()
        process.exit(0)
        break
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`)
          process.exit(1)
        }
    }
  }

  return config
}

/**
 * Show help message
 */
function showTestHelp(): void {
  console.log(`
Plant Shop Content Transformation Test

USAGE:
  pnpm tsx scripts/test-plant-content-transformation.ts [options]

OPTIONS:
  --verbose        Enable verbose logging
  --details        Show detailed results for each page
  --page <id>      Test specific page only
  --help           Show this help message

EXAMPLES:
  # Test all pages
  pnpm tsx scripts/test-plant-content-transformation.ts

  # Test with verbose output
  pnpm tsx scripts/test-plant-content-transformation.ts --verbose --details

  # Test specific page
  pnpm tsx scripts/test-plant-content-transformation.ts --page home
`)
}

/**
 * Log test message
 */
function testLog(message: string, verbose = false, config: TestConfig): void {
  if (!verbose || config.verbose) {
    console.log(`[TEST ${new Date().toISOString()}] ${message}`)
  }
}

/**
 * Test single page transformation
 */
async function testPageTransformation(
  pageId: string, 
  pageData: any, 
  config: TestConfig
): Promise<{
  success: boolean
  originalSize: number
  transformedSize: number
  validationErrors: string[]
  warnings: string[]
  transformedContent?: any
}> {
  try {
    testLog(`Testing transformation for page: ${pageId}`, true, config)
    
    // Transform the page
    const transformer = new PlantShopTransformer()
    const result = await transformer.transformPage(pageId, pageData)
    
    if (!result.success) {
      return {
        success: false,
        originalSize: result.originalSize,
        transformedSize: result.transformedSize,
        validationErrors: result.errors || [],
        warnings: result.warnings || []
      }
    }

    // Validate against schema
    const validationErrors: string[] = []
    
    // Test PageContent schema
    const pageContentValidation = PageContentSchema.safeParse(result.data)
    if (!pageContentValidation.success) {
      pageContentValidation.error.issues.forEach(issue => {
        validationErrors.push(`Schema validation: ${issue.path.join('.')}: ${issue.message}`)
      })
    }

    // Test PlantShopContent schema if applicable
    if (result.data && ['plant_shop', 'plant_care', 'plant_catalog'].includes(result.data.layout)) {
      const plantValidation = PlantShopContentSchema.safeParse(result.data)
      if (!plantValidation.success) {
        plantValidation.error.issues.forEach(issue => {
          validationErrors.push(`Plant schema validation: ${issue.path.join('.')}: ${issue.message}`)
        })
      }
    }

    testLog(`Page ${pageId}: ${validationErrors.length === 0 ? 'PASSED' : 'VALIDATION ISSUES'}`, true, config)

    return {
      success: result.success,
      originalSize: result.originalSize,
      transformedSize: result.transformedSize,
      validationErrors,
      warnings: result.warnings || [],
      transformedContent: result.data
    }
  } catch (error: unknown) {
    const errorDetails = handleError(error)
    return {
      success: false,
      originalSize: 0,
      transformedSize: 0,
      validationErrors: [errorDetails.message],
      warnings: []
    }
  }
}

/**
 * Test all content transformation
 */
async function testAllTransformation(config: TestConfig): Promise<TestResults> {
  const startTime = Date.now()
  testLog('Starting plant shop content transformation test', false, config)

  const results: TestResults = {
    timestamp: new Date().toISOString(),
    config,
    summary: {
      totalPages: 0,
      successful: 0,
      failed: 0,
      warnings: 0
    },
    transformationStats: {
      originalSize: 0,
      transformedSize: 0,
      compressionRatio: 0
    },
    validationResults: {
      schemaValidation: {
        passed: 0,
        failed: 0,
        errors: []
      },
      contentValidation: {
        passed: 0,
        failed: 0,
        errors: []
      }
    },
    pageResults: []
  }

  // Test individual pages
  const pagesToTest = config.specificPage 
    ? { [config.specificPage]: plantShopContent[config.specificPage] }
    : plantShopContent

  if (config.specificPage && !plantShopContent[config.specificPage]) {
    throw new Error(`Page '${config.specificPage}' not found in plant shop content`)
  }

  for (const [pageId, pageData] of Object.entries(pagesToTest)) {
    const pageResult = await testPageTransformation(pageId, pageData, config)
    
    results.pageResults.push({
      pageId,
      success: pageResult.success,
      originalSize: pageResult.originalSize,
      transformedSize: pageResult.transformedSize,
      validationErrors: pageResult.validationErrors,
      warnings: pageResult.warnings
    })

    // Update summary stats
    results.summary.totalPages++
    if (pageResult.success) {
      results.summary.successful++
    } else {
      results.summary.failed++
    }
    if (pageResult.warnings.length > 0) {
      results.summary.warnings++
    }

    // Update transformation stats
    results.transformationStats.originalSize += pageResult.originalSize
    results.transformationStats.transformedSize += pageResult.transformedSize

    // Update validation stats
    if (pageResult.validationErrors.length === 0) {
      results.validationResults.schemaValidation.passed++
    } else {
      results.validationResults.schemaValidation.failed++
      results.validationResults.schemaValidation.errors.push(
        ...pageResult.validationErrors.map(e => `${pageId}: ${e}`)
      )
    }

    // Show progress
    if (config.verbose) {
      testLog(`Completed ${pageId}: ${pageResult.success ? 'SUCCESS' : 'FAILED'}`, false, config)
    }
  }

  // Calculate compression ratio
  if (results.transformationStats.originalSize > 0) {
    results.transformationStats.compressionRatio = 
      results.transformationStats.transformedSize / results.transformationStats.originalSize
  }

  // Test batch migration
  testLog('Testing batch migration functionality', false, config)
  try {
    const batchMigration = new PlantShopBatchMigration()
    await batchMigration.addAllPlantContent()
    
    const batchResults = batchMigration.getPlantResults()
    const batchValidation = await batchMigration.validateTransformedContent()
    
    testLog(`Batch migration: ${batchResults.successful}/${batchResults.total} successful`, false, config)
    testLog(`Batch validation: ${batchValidation.allValid ? 'PASSED' : 'FAILED'}`, false, config)
    
    if (!batchValidation.allValid) {
      results.validationResults.contentValidation.failed++
      results.validationResults.contentValidation.errors.push(
        ...batchValidation.validationResults
          .filter(v => !v.isValid)
          .flatMap(v => v.errors.map(e => `${v.pageId}: ${e}`))
      )
    } else {
      results.validationResults.contentValidation.passed++
    }
  } catch (error: unknown) {
    const errorDetails = handleError(error)
    results.validationResults.contentValidation.failed++
    results.validationResults.contentValidation.errors.push(`Batch migration error: ${errorDetails.message}`)
  }

  testLog(`Test completed in ${Date.now() - startTime}ms`, false, config)
  return results
}

/**
 * Display test results
 */
function displayResults(results: TestResults): void {
  console.log('\n' + '='.repeat(80))
  console.log('PLANT SHOP CONTENT TRANSFORMATION TEST RESULTS')
  console.log('='.repeat(80))
  
  console.log(`\nTimestamp: ${results.timestamp}`)
  console.log(`Configuration:`)
  console.log(`  Verbose: ${results.config.verbose}`)
  console.log(`  Specific Page: ${results.config.specificPage || 'All pages'}`)
  
  console.log(`\nSUMMARY:`)
  console.log(`  📄 Total Pages: ${results.summary.totalPages}`)
  console.log(`  ✅ Successful: ${results.summary.successful}`)
  console.log(`  ❌ Failed: ${results.summary.failed}`)
  console.log(`  ⚠️  Warnings: ${results.summary.warnings}`)
  
  console.log(`\nTRANSFORMATION STATS:`)
  console.log(`  📦 Original Size: ${Math.round(results.transformationStats.originalSize / 1024)}KB`)
  console.log(`  📦 Transformed Size: ${Math.round(results.transformationStats.transformedSize / 1024)}KB`)
  console.log(`  📊 Compression Ratio: ${(results.transformationStats.compressionRatio * 100).toFixed(1)}%`)
  
  console.log(`\nVALIDATION RESULTS:`)
  console.log(`  Schema Validation:`)
  console.log(`    ✅ Passed: ${results.validationResults.schemaValidation.passed}`)
  console.log(`    ❌ Failed: ${results.validationResults.schemaValidation.failed}`)
  console.log(`  Content Validation:`)
  console.log(`    ✅ Passed: ${results.validationResults.contentValidation.passed}`)
  console.log(`    ❌ Failed: ${results.validationResults.contentValidation.failed}`)

  // Show detailed results if requested
  if (results.config.showDetails) {
    console.log(`\nPAGE-BY-PAGE RESULTS:`)
    results.pageResults.forEach(page => {
      const status = page.success ? '✅' : '❌'
      const warnings = page.warnings.length > 0 ? ` (${page.warnings.length} warnings)` : ''
      console.log(`  ${status} ${page.pageId}: ${Math.round(page.originalSize / 1024)}KB → ${Math.round(page.transformedSize / 1024)}KB${warnings}`)
      
      if (page.validationErrors.length > 0) {
        page.validationErrors.forEach(error => {
          console.log(`    🔍 ${error}`)
        })
      }
      
      if (page.warnings.length > 0 && results.config.verbose) {
        page.warnings.forEach(warning => {
          console.log(`    ⚠️  ${warning}`)
        })
      }
    })
  }

  // Show validation errors
  if (results.validationResults.schemaValidation.errors.length > 0) {
    console.log(`\nSCHEMA VALIDATION ERRORS:`)
    results.validationResults.schemaValidation.errors.forEach(error => {
      console.log(`  🔍 ${error}`)
    })
  }

  if (results.validationResults.contentValidation.errors.length > 0) {
    console.log(`\nCONTENT VALIDATION ERRORS:`)
    results.validationResults.contentValidation.errors.forEach(error => {
      console.log(`  🔍 ${error}`)
    })
  }

  console.log('\n' + '='.repeat(80))

  // Overall result
  const hasErrors = results.summary.failed > 0 || 
                   results.validationResults.schemaValidation.failed > 0 ||
                   results.validationResults.contentValidation.failed > 0

  if (hasErrors) {
    console.log('❌ TEST FAILED - Content transformation has errors')
  } else {
    console.log('✅ TEST PASSED - All content transformed successfully')
  }
}

/**
 * Main test function
 */
async function runTest(): Promise<void> {
  try {
    const config = parseTestArgs()
    const results = await testAllTransformation(config)
    
    displayResults(results)
    
    // Exit with appropriate code
    const hasErrors = results.summary.failed > 0 || 
                     results.validationResults.schemaValidation.failed > 0 ||
                     results.validationResults.contentValidation.failed > 0
    
    process.exit(hasErrors ? 1 : 0)
  } catch (error: unknown) {
    const errorDetails = handleError(error)
    console.error(`\n❌ Test failed: ${errorDetails.message}`)
    if (errorDetails.stack) {
      console.error(errorDetails.stack)
    }
    process.exit(1)
  }
}

// Run test if called directly
if (require.main === module) {
  runTest()
}

export { runTest, testPageTransformation, TestConfig, TestResults }