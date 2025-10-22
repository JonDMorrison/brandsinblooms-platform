/**
 * Remove the problematic trigger
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeTrigger() {
  console.log('🗑️  Removing trigger...\n');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      DROP TRIGGER IF EXISTS sync_primary_category_assignment_trigger ON products;
      DROP FUNCTION IF EXISTS sync_primary_category_assignment();
    `
  });

  if (error) {
    console.error('Error:', error);
    // Try alternative method
    console.log('\nTrying alternative method...');

    const { error: error1 } = await supabase.from('products').select('id').limit(1);
    if (!error1) {
      console.log('✅ Database connection OK');
    }
  } else {
    console.log('✅ Trigger removed successfully');
  }
}

removeTrigger().catch((error) => {
  console.error('Error:', error);
});
