// Test script to validate plant shop content migration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testPlantContentMigration() {
  console.log('Testing Plant Shop Content Migration...\n')

  try {
    // Test 1: Insert content with new plant shop types
    console.log('1. Testing new content types...')
    
    const testContent = [
      {
        site_id: '00000000-0000-0000-0000-000000000001',
        title: 'Plant Care Guide',
        slug: 'plant-care-guide-' + Date.now(),
        content_type: 'plant_care_guide',
        content: {
          version: '1.0',
          layout: 'plant_care',
          sections: {
            care_instructions: {
              type: 'plant_care_guide',
              data: {
                content: 'Basic plant care instructions',
                careLevel: 'easy',
                lightRequirement: 'medium',
                wateringFrequency: 'weekly'
              },
              visible: true,
              order: 1
            }
          }
        }
      },
      {
        site_id: '00000000-0000-0000-0000-000000000001',
        title: 'Home Page',
        slug: 'home-page-test-' + Date.now(),
        content_type: 'home_page',
        content: {
          version: '1.0',
          layout: 'plant_shop',
          sections: {
            featured_plants: {
              type: 'plant_showcase',
              data: {
                items: [],
                columns: 3,
                careLevel: 'easy'
              },
              visible: true,
              order: 1
            }
          }
        }
      }
    ]

    for (const content of testContent) {
      const { data, error } = await supabase
        .from('content')
        .insert(content)
        .select()

      if (error) {
        console.error(`❌ Failed to insert ${content.content_type}:`, error)
        return false
      } else {
        console.log(`✅ Successfully inserted ${content.content_type}`)
      }
    }

    // Test 2: Verify content type constraint works
    console.log('\n2. Testing content type constraints...')
    
    const { error: constraintError } = await supabase
      .from('content')
      .insert({
        site_id: '00000000-0000-0000-0000-000000000001',
        title: 'Invalid Content',
        slug: 'invalid-content',
        content_type: 'invalid_type',
        content: {}
      })

    if (constraintError) {
      console.log('✅ Content type constraint working (rejected invalid type)')
    } else {
      console.log('❌ Content type constraint not working')
      return false
    }

    // Test 3: Test plant page content creation function
    console.log('\n3. Testing plant page content creation function...')
    
    const { data: funcResult, error: funcError } = await supabase
      .rpc('create_plant_page_content', {
        page_type: 'home_page',
        layout_type: 'plant_shop'
      })

    if (funcError) {
      console.error('❌ Failed to create plant page content:', funcError)
      return false
    } else {
      console.log('✅ Plant page content creation function working')
      console.log('   Sample structure:', JSON.stringify(funcResult, null, 2).substring(0, 200) + '...')
    }

    // Test 4: Test content validation function
    console.log('\n4. Testing content validation function...')
    
    const { data: validResult, error: validError } = await supabase
      .rpc('validate_plant_content', {
        content_data: {
          version: '1.0',
          layout: 'plant_shop',
          sections: {}
        }
      })

    if (validError) {
      console.error('❌ Failed to validate content:', validError)
      return false
    } else {
      console.log(`✅ Content validation function working (result: ${validResult})`)
    }

    // Test 5: Verify backup table exists
    console.log('\n5. Checking backup table...')
    
    const { data: backupData, error: backupError } = await supabase
      .from('content_backup_20250910')
      .select('*', { count: 'exact' })

    if (backupError) {
      console.error('❌ Backup table not accessible:', backupError)
      return false
    } else {
      console.log('✅ Backup table exists and accessible')
    }

    // Test 6: Check migration log
    console.log('\n6. Checking migration log...')
    
    const { data: migrationLog, error: logError } = await supabase
      .from('content_migration_log')
      .select('*')

    if (logError) {
      console.error('❌ Migration log not accessible:', logError)
      return false
    } else {
      console.log('✅ Migration log accessible')
      console.log(`   Recorded ${migrationLog.length} migration entries`)
    }

    console.log('\n🎉 All tests passed! Plant shop content migration is working correctly.')
    return true

  } catch (error) {
    console.error('❌ Test failed with error:', error)
    return false
  }
}

// Run the tests
testPlantContentMigration().then(success => {
  process.exit(success ? 0 : 1)
})