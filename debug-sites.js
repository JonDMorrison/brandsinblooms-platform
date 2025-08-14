const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hrwadgiraankbhbnchmx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Get the anon key from .env.local
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debugSites() {
  console.log('Testing user ID: 22222222-2222-2222-2222-222222222222\n');
  
  // 1. Check site memberships
  console.log('1. Checking site_memberships:');
  const { data: memberships, error: membershipError } = await supabase
    .from('site_memberships')
    .select('*')
    .eq('user_id', '22222222-2222-2222-2222-222222222222')
    .eq('is_active', true);
    
  if (membershipError) {
    console.log('Error fetching memberships:', membershipError);
  } else {
    console.log('Found memberships:', JSON.stringify(memberships, null, 2));
  }
  
  // 2. Check sites directly
  console.log('\n2. Checking sites for membership IDs:');
  const siteIds = memberships?.map(m => m.site_id) || [];
  
  if (siteIds.length > 0) {
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .in('id', siteIds)
      .eq('is_active', true);
      
    if (sitesError) {
      console.log('Error fetching sites:', sitesError);
    } else {
      console.log('Found sites:', JSON.stringify(sites, null, 2));
    }
  }
  
  // 3. Test the exact query used in getUserSites
  console.log('\n3. Testing getUserSites query flow:');
  const { data: membershipData, error: memError } = await supabase
    .from('site_memberships')
    .select(`
      id,
      user_id,
      site_id,
      role,
      is_active,
      created_at
    `)
    .eq('user_id', '22222222-2222-2222-2222-222222222222')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
    
  console.log('Membership query result:', membershipData?.length, 'records');
  if (memError) console.log('Membership query error:', memError);
  
  if (membershipData && membershipData.length > 0) {
    const siteIds = membershipData.map(m => m.site_id);
    const { data: siteData, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .in('id', siteIds)
      .eq('is_active', true);
      
    console.log('Sites query result:', siteData?.length, 'records');
    if (siteError) console.log('Sites query error:', siteError);
    
    if (siteData) {
      console.log('Site details:');
      siteData.forEach(site => {
        console.log(`  - ${site.name} (${site.id}): active=${site.is_active}, published=${site.is_published}`);
      });
    }
  }
}

debugSites().catch(console.error);