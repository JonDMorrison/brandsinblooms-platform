#!/usr/bin/env tsx
/**
 * Plant Shop Content Migration Script
 * Transforms hardcoded plant shop content to database-compatible format
 * 
 * Usage:
 *   pnpm tsx scripts/migrate-plant-shop-content.ts [options]
 * 
 * Options:
 *   --site-id <id>        Target site ID for content migration
 *   --author-id <id>      Author ID for content records
 *   --dry-run            Run transformation without database insertion
 *   --report-only        Generate report without performing migration
 *   --backup             Create backup before migration
 *   --validate-only      Validate transformed content only
 *   --verbose            Enable verbose logging
 *   --help               Show this help message
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { Database, Tables } from '@/lib/database/types'
import { PlantShopBatchMigration } from '@/lib/content/migration'
import { transformPlantShopContent } from '@/lib/content/plant-shop-transformer'
import { handleError } from '@/lib/types/error-handling'
import { plantShopContent } from '@/data/plant-shop-content'

// Configuration
interface MigrationConfig {
  siteId?: string
  authorId?: string
  dryRun: boolean
  reportOnly: boolean
  backup: boolean
  validateOnly: boolean
  verbose: boolean
}

// Default configuration
const DEFAULT_CONFIG: MigrationConfig = {
  dryRun: false,
  reportOnly: false,
  backup: true,
  validateOnly: false,
  verbose: false
}

/**
 * Migration result summary
 */
interface MigrationSummary {
  timestamp: string
  config: MigrationConfig
  contentStats: {
    totalPages: number
    originalSize: number
    transformedSize: number
    compressionRatio: number
  }
  transformationResults: {
    successful: number
    failed: number
    warnings: number
  }
  validationResults?: {
    allValid: boolean
    validationErrors: string[]
  }
  databaseResults?: {
    inserted: number
    errors: string[]
  }
  executionTime: number
}

/**
 * Parse command line arguments
 */
function parseArgs(): MigrationConfig {
  const args = process.argv.slice(2)
  const config: MigrationConfig = { ...DEFAULT_CONFIG }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--site-id':
        config.siteId = args[++i]
        break
      case '--author-id':
        config.authorId = args[++i]
        break
      case '--dry-run':
        config.dryRun = true
        break
      case '--report-only':
        config.reportOnly = true
        break
      case '--no-backup':
        config.backup = false
        break
      case '--validate-only':
        config.validateOnly = true
        break
      case '--verbose':
        config.verbose = true
        break
      case '--help':
        showHelp()
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
function showHelp(): void {
  console.log(`
Plant Shop Content Migration Script

USAGE:
  pnpm tsx scripts/migrate-plant-shop-content.ts [options]

OPTIONS:
  --site-id <id>        Target site ID for content migration
  --author-id <id>      Author ID for content records  
  --dry-run            Run transformation without database insertion
  --report-only        Generate report without performing migration
  --no-backup          Skip backup creation
  --validate-only      Validate transformed content only
  --verbose            Enable verbose logging
  --help               Show this help message

EXAMPLES:
  # Generate transformation report only
  pnpm tsx scripts/migrate-plant-shop-content.ts --report-only

  # Validate transformed content
  pnpm tsx scripts/migrate-plant-shop-content.ts --validate-only

  # Dry run for specific site
  pnpm tsx scripts/migrate-plant-shop-content.ts --site-id abc123 --dry-run

  # Full migration with backup
  pnpm tsx scripts/migrate-plant-shop-content.ts --site-id abc123 --author-id user123
`)
}

/**
 * Create Supabase client
 */
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}

/**
 * Validate configuration
 */
function validateConfig(config: MigrationConfig): void {
  if (!config.dryRun && !config.reportOnly && !config.validateOnly && !config.siteId) {
    throw new Error('Site ID is required for database operations')
  }

  // Check environment variables
  if (!config.dryRun && !config.reportOnly && !config.validateOnly) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables are required for database operations')
    }
  }
}

/**
 * Log message with optional verbose mode
 */
function log(message: string, verbose = false, config: MigrationConfig): void {
  if (!verbose || config.verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`)
  }
}

/**
 * Create content backup
 */
async function createContentBackup(siteId: string, supabase: any): Promise<void> {
  log(`Creating backup for site ${siteId}...`, false, {} as MigrationConfig)
  
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('site_id', siteId)

  if (error) {
    throw new Error(`Failed to query existing content: ${error.message}`)
  }

  if (data && data.length > 0) {
    const backupTable = `content_backup_plant_migration_${Date.now()}`
    
    // Create backup table (this would need to be implemented via SQL)
    console.log(`Would create backup table: ${backupTable} with ${data.length} records`)
    console.log('Note: Backup table creation needs to be implemented via database migration')
  } else {
    log('No existing content found to backup', false, {} as MigrationConfig)
  }
}

/**
 * Insert content records into database
 */
async function insertContentRecords(
  records: any[], 
  supabase: any, 
  config: MigrationConfig
): Promise<{ inserted: number; errors: string[] }> {
  const results = { inserted: 0, errors: [] as string[] }

  for (const record of records) {
    try {
      log(`Inserting content: ${record.title}`, true, config)
      
      const { data, error } = await supabase
        .from('content')
        .upsert(record, {
          onConflict: 'site_id,slug'
        })

      if (error) {
        results.errors.push(`Failed to insert ${record.title}: ${error.message}`)
      } else {
        results.inserted++
        log(`Successfully inserted: ${record.title}`, true, config)
      }
    } catch (error: unknown) {
      const errorDetails = handleError(error)
      results.errors.push(`Error inserting ${record.title}: ${errorDetails.message}`)
    }
  }

  return results
}

/**
 * Generate migration report
 */
function generateReport(
  summary: MigrationSummary,
  detailledResults?: any
): string {
  const report = [
    '=' * 80,
    'PLANT SHOP CONTENT MIGRATION REPORT',
    '=' * 80,
    '',
    `Timestamp: ${summary.timestamp}`,
    `Execution Time: ${summary.executionTime}ms`,
    '',
    'CONFIGURATION:',
    `  Site ID: ${summary.config.siteId || 'N/A'}`,
    `  Author ID: ${summary.config.authorId || 'N/A'}`,
    `  Dry Run: ${summary.config.dryRun}`,
    `  Report Only: ${summary.config.reportOnly}`,
    `  Validate Only: ${summary.config.validateOnly}`,
    `  Backup: ${summary.config.backup}`,
    '',
    'CONTENT STATISTICS:',
    `  Total Pages: ${summary.contentStats.totalPages}`,
    `  Original Size: ${Math.round(summary.contentStats.originalSize / 1024)}KB`,
    `  Transformed Size: ${Math.round(summary.contentStats.transformedSize / 1024)}KB`,
    `  Compression Ratio: ${(summary.contentStats.compressionRatio * 100).toFixed(1)}%`,
    '',
    'TRANSFORMATION RESULTS:',
    `  ✅ Successful: ${summary.transformationResults.successful}`,
    `  ❌ Failed: ${summary.transformationResults.failed}`,
    `  ⚠️  Warnings: ${summary.transformationResults.warnings}`,
    ''
  ]

  if (summary.validationResults) {
    report.push(
      'VALIDATION RESULTS:',
      `  All Valid: ${summary.validationResults.allValid ? '✅' : '❌'}`,
      `  Validation Errors: ${summary.validationResults.validationErrors.length}`,
      ''
    )

    if (summary.validationResults.validationErrors.length > 0) {
      report.push('VALIDATION ERRORS:')
      summary.validationResults.validationErrors.forEach(error => {
        report.push(`  - ${error}`)
      })
      report.push('')
    }
  }

  if (summary.databaseResults) {
    report.push(
      'DATABASE RESULTS:',
      `  ✅ Inserted: ${summary.databaseResults.inserted}`,
      `  ❌ Errors: ${summary.databaseResults.errors.length}`,
      ''
    )

    if (summary.databaseResults.errors.length > 0) {
      report.push('DATABASE ERRORS:')
      summary.databaseResults.errors.forEach(error => {
        report.push(`  - ${error}`)
      })
      report.push('')
    }
  }

  report.push('=' * 80)

  return report.join('\n')
}

/**
 * Main migration function
 */
async function runMigration(): Promise<void> {
  const startTime = Date.now()
  const config = parseArgs()
  
  try {
    // Validate configuration
    validateConfig(config)
    
    log('Starting plant shop content migration...', false, config)
    log(`Configuration: ${JSON.stringify(config, null, 2)}`, true, config)

    // Initialize migration
    const migration = new PlantShopBatchMigration()
    
    // Add all plant content to migration batch
    log('Loading and transforming plant shop content...', false, config)
    await migration.addAllPlantContent(config.siteId)
    
    // Get transformation results
    const plantResults = migration.getPlantResults()
    log(`Transformation completed: ${plantResults.successful}/${plantResults.total} successful`, false, config)

    // Prepare summary
    const summary: MigrationSummary = {
      timestamp: new Date().toISOString(),
      config,
      contentStats: {
        totalPages: plantResults.total,
        originalSize: plantResults.totalOriginalSize,
        transformedSize: plantResults.totalTransformedSize,
        compressionRatio: plantResults.compressionRatio
      },
      transformationResults: {
        successful: plantResults.successful,
        failed: plantResults.failed,
        warnings: plantResults.warnings
      },
      executionTime: Date.now() - startTime
    }

    // Validation step
    if (config.validateOnly || !config.reportOnly) {
      log('Validating transformed content...', false, config)
      const validation = await migration.validateTransformedContent()
      
      summary.validationResults = {
        allValid: validation.allValid,
        validationErrors: validation.validationResults
          .filter(v => !v.isValid)
          .flatMap(v => v.errors.map(e => `${v.pageId}: ${e}`))
      }
      
      log(`Validation completed: ${validation.allValid ? 'PASSED' : 'FAILED'}`, false, config)
    }

    // Database operations
    if (!config.dryRun && !config.reportOnly && !config.validateOnly && config.siteId) {
      const supabase = createSupabaseClient()
      
      // Create backup if requested
      if (config.backup) {
        await createContentBackup(config.siteId, supabase)
      }
      
      // Generate database records
      log('Generating database records...', false, config)
      const records = await migration.generateDatabaseRecords(config.siteId, config.authorId)
      
      // Insert into database
      log(`Inserting ${records.length} content records...`, false, config)
      const dbResults = await insertContentRecords(records, supabase, config)
      
      summary.databaseResults = dbResults
      log(`Database insertion completed: ${dbResults.inserted}/${records.length} successful`, false, config)
    }

    // Generate and display report
    const report = generateReport(summary)
    console.log('\n' + report)

    // Export detailed results if requested
    if (config.verbose) {
      const detailedReport = await migration.exportMigrationReport()
      console.log('\nDETAILED RESULTS:', JSON.stringify(detailedReport, null, 2))
    }

    // Exit with appropriate code
    const hasErrors = summary.transformationResults.failed > 0 || 
                     (summary.validationResults && !summary.validationResults.allValid) ||
                     (summary.databaseResults && summary.databaseResults.errors.length > 0)
    
    if (hasErrors) {
      console.error('\n❌ Migration completed with errors')
      process.exit(1)
    } else {
      console.log('\n✅ Migration completed successfully')
      process.exit(0)
    }

  } catch (error: unknown) {
    const errorDetails = handleError(error)
    console.error(`\n❌ Migration failed: ${errorDetails.message}`)
    console.error(errorDetails.stack)
    process.exit(1)
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
}

export { runMigration, parseArgs, MigrationConfig, MigrationSummary }