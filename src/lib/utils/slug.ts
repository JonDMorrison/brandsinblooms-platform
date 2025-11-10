import type { Database } from '@/src/lib/database/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Reserved words that can't be used as slugs (routes)
const RESERVED_WORDS = [
  'new',
  'edit',
  'admin',
  'api',
  'dashboard',
  'settings',
  'login',
  'logout',
  'signup',
  'signin',
  'auth',
  'account',
  'profile',
  'cart',
  'checkout',
  'order',
  'orders',
  'search',
  'category',
  'categories',
  'tag',
  'tags',
  'page',
  'pages',
  'post',
  'posts',
  'product',
  'products',
  'user',
  'users',
  'about',
  'contact',
  'privacy',
  'terms',
  'help',
  'faq',
  'support',
  'index',
  'home',
  '404',
  '500',
  'error',
  'undefined',
  'null'
];

const MAX_SLUG_LENGTH = 100;

/**
 * Sanitizes a string to create a URL-safe slug
 * @param input - The string to sanitize
 * @returns A sanitized slug string
 */
export function sanitizeSlug(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Normalize unicode characters (NFD decomposition)
  // This converts accented characters to their base forms
  // e.g., "Café" becomes "Cafe"
  let slug = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Remove emojis and other unicode symbols
  slug = slug.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  
  // Convert to lowercase
  slug = slug.toLowerCase();
  
  // Replace non-alphanumeric characters with hyphens
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  
  // Replace spaces and underscores with hyphens
  slug = slug.replace(/[\s_]+/g, '-');
  
  // Collapse multiple hyphens into one
  slug = slug.replace(/-+/g, '-');
  
  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  // Truncate to maximum length
  if (slug.length > MAX_SLUG_LENGTH) {
    slug = slug.substring(0, MAX_SLUG_LENGTH);
    // Remove any trailing hyphen that might result from truncation
    slug = slug.replace(/-+$/g, '');
  }
  
  // If the slug is empty after all processing, generate a fallback
  if (!slug) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `product-${timestamp}-${random}`;
  }
  
  // Check if the slug is a reserved word
  if (RESERVED_WORDS.includes(slug)) {
    // Append a suffix to make it unique
    const timestamp = Date.now();
    return `${slug}-${timestamp}`;
  }
  
  return slug;
}

/**
 * Generates a unique slug for a product within a site
 * @param supabase - Supabase client instance
 * @param name - The product name to generate a slug from
 * @param siteId - The site ID to check uniqueness within
 * @param excludeId - Optional product ID to exclude from uniqueness check (for editing)
 * @returns A unique slug string
 */
export async function generateUniqueSlug(
  supabase: SupabaseClient<Database>,
  name: string,
  siteId: string,
  excludeId?: string
): Promise<string> {
  // Generate base slug using sanitization
  const baseSlug = sanitizeSlug(name);
  
  // Build query to find existing slugs
  // Use a single optimized query with OR condition
  let query = supabase
    .from('products')
    .select('id, slug')
    .eq('site_id', siteId)
    .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`);
  
  // Exclude current product if editing
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error checking slug uniqueness:', error);
    // In case of error, append timestamp to ensure uniqueness
    return `${baseSlug}-${Date.now()}`;
  }
  
  // If no conflicts, return the base slug
  if (!data || data.length === 0) {
    return baseSlug;
  }
  
  // Create a Set for O(1) conflict checking
  const existingSlugs = new Set(data.map(item => item.slug));
  
  // If base slug doesn't exist, use it
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }
  
  // Find the next available number suffix
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.has(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
    
    // Safety check to prevent infinite loops
    if (counter > 1000) {
      // Fallback to timestamp if too many iterations
      return `${baseSlug}-${Date.now()}`;
    }
  }
  
  return uniqueSlug;
}

/**
 * Validates if a slug is valid and available
 * @param supabase - Supabase client instance
 * @param slug - The slug to validate
 * @param siteId - The site ID to check within
 * @param excludeId - Optional product ID to exclude from check
 * @returns Validation result with isValid flag and optional error message
 */
export async function validateSlug(
  supabase: SupabaseClient<Database>,
  slug: string,
  siteId: string,
  excludeId?: string
): Promise<{ isValid: boolean; error?: string }> {
  // Check if slug is empty
  if (!slug) {
    return { isValid: false, error: 'Slug is required' };
  }
  
  // Check slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { isValid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }
  
  // Check for leading/trailing hyphens
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { isValid: false, error: 'Slug cannot start or end with a hyphen' };
  }
  
  // Check length
  if (slug.length > MAX_SLUG_LENGTH) {
    return { isValid: false, error: `Slug must be ${MAX_SLUG_LENGTH} characters or less` };
  }
  
  // Check if it's a reserved word
  if (RESERVED_WORDS.includes(slug)) {
    return { isValid: false, error: 'This slug is reserved and cannot be used' };
  }
  
  // Check uniqueness in database
  console.log('📊 Checking slug uniqueness in database:', { slug, siteId, excludeId });
  
  try {
    let query = supabase
      .from('products')
      .select('id')
      .eq('site_id', siteId)
      .eq('slug', slug);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    console.log('🔄 Executing database query...');
    
    // Add timeout to the query itself
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database query timed out')), 5000);
    });
    
    const { data, error } = await Promise.race([
      query,
      timeoutPromise
    ]);
    
    console.log('✅ Query completed:', { data, error });
    
    if (error) {
      console.error('Error validating slug:', error);
      return { isValid: false, error: 'Failed to validate slug' };
    }
    
    if (data && data.length > 0) {
      return { isValid: false, error: 'This slug is already in use' };
    }
    
    return { isValid: true };
  } catch (timeoutError) {
    console.error('⏱️ Slug validation timeout or error:', timeoutError);
    // Allow the slug if we can't verify (better than blocking the user)
    return { isValid: true };
  }
}

/**
 * Gets the reserved words list for client-side validation
 */
export function getReservedWords(): string[] {
  return [...RESERVED_WORDS];
}

/**
 * Checks if a word is reserved
 */
export function isReservedWord(word: string): boolean {
  return RESERVED_WORDS.includes(word.toLowerCase());
}