// Jest globals are available globally, no import needed
import { sanitizeSlug, generateUniqueSlug, validateSlug, isReservedWord } from './slug'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/lib/database/types'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
} as unknown as SupabaseClient<Database>

describe('sanitizeSlug', () => {
  test('handles basic text conversion', () => {
    expect(sanitizeSlug('Hello World')).toBe('hello-world')
    expect(sanitizeSlug('Product Name')).toBe('product-name')
    expect(sanitizeSlug('TEST PRODUCT')).toBe('test-product')
  })

  test('handles unicode characters', () => {
    expect(sanitizeSlug('Café')).toBe('cafe')
    expect(sanitizeSlug('Résumé')).toBe('resume')
    expect(sanitizeSlug('Naïve')).toBe('naive')
    expect(sanitizeSlug('Zürich')).toBe('zurich')
  })

  test('removes emojis', () => {
    expect(sanitizeSlug('Rose 🌹')).toBe('rose')
    expect(sanitizeSlug('Happy 😊 Product')).toBe('happy-product')
    expect(sanitizeSlug('🎉 Party Supplies 🎊')).toBe('party-supplies')
  })

  test('handles special characters', () => {
    expect(sanitizeSlug('Price: $99.99!')).toBe('price-9999')
    expect(sanitizeSlug('Product@Store')).toBe('productstore')
    expect(sanitizeSlug('Item #1')).toBe('item-1')
    expect(sanitizeSlug('50% Off')).toBe('50-off')
  })

  test('collapses multiple hyphens', () => {
    expect(sanitizeSlug('Product - - Name')).toBe('product-name')
    expect(sanitizeSlug('Item___Name')).toBe('item-name')
    expect(sanitizeSlug('Test   Multiple   Spaces')).toBe('test-multiple-spaces')
  })

  test('removes leading and trailing hyphens', () => {
    expect(sanitizeSlug('-Product-')).toBe('product')
    expect(sanitizeSlug('---Name---')).toBe('name')
    expect(sanitizeSlug('- Test -')).toBe('test')
  })

  test('truncates long strings to 100 characters', () => {
    const longString = 'a'.repeat(150)
    const result = sanitizeSlug(longString)
    expect(result.length).toBeLessThanOrEqual(100)
    expect(result).toBe('a'.repeat(100))
  })

  test('generates fallback for empty strings', () => {
    const result1 = sanitizeSlug('')
    expect(result1).toMatch(/^product-\d+-\d+$/)
    
    const result2 = sanitizeSlug('   ')
    expect(result2).toMatch(/^product-\d+-\d+$/)
    
    const result3 = sanitizeSlug('!!!')
    expect(result3).toMatch(/^product-\d+-\d+$/)
  })

  test('blocks reserved words', () => {
    const result1 = sanitizeSlug('new')
    expect(result1).toMatch(/^new-\d+$/)
    
    const result2 = sanitizeSlug('admin')
    expect(result2).toMatch(/^admin-\d+$/)
    
    const result3 = sanitizeSlug('api')
    expect(result3).toMatch(/^api-\d+$/)
  })

  test('handles mixed cases correctly', () => {
    expect(sanitizeSlug('CamelCaseProduct')).toBe('camelcaseproduct')
    expect(sanitizeSlug('snake_case_product')).toBe('snake-case-product')
    expect(sanitizeSlug('kebab-case-product')).toBe('kebab-case-product')
  })

  test('handles numbers correctly', () => {
    expect(sanitizeSlug('Product 123')).toBe('product-123')
    expect(sanitizeSlug('123 Product')).toBe('123-product')
    expect(sanitizeSlug('Product123')).toBe('product123')
  })
})

describe('generateUniqueSlug', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns base slug when no conflicts', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      neq: jest.fn().mockResolvedValue({ data: [], error: null }),
    }
    
    ;(mockSupabase.from as any).mockReturnValue(mockQuery)
    
    const result = await generateUniqueSlug(mockSupabase, 'Test Product', 'site-123')
    
    expect(result).toBe('test-product')
    expect(mockSupabase.from).toHaveBeenCalledWith('products')
    expect(mockQuery.eq).toHaveBeenCalledWith('site_id', 'site-123')
  })

  test('appends counter for duplicates', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      neq: jest.fn().mockResolvedValue({
        data: [
          { id: '1', slug: 'test-product' },
          { id: '2', slug: 'test-product-1' },
        ],
        error: null,
      }),
    }
    
    ;(mockSupabase.from as any).mockReturnValue(mockQuery)
    
    const result = await generateUniqueSlug(mockSupabase, 'Test Product', 'site-123')
    
    expect(result).toBe('test-product-2')
  })

  test('excludes current product in edit mode', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
    }
    
    mockQuery.neq.mockResolvedValue({ data: [], error: null })
    ;(mockSupabase.from as any).mockReturnValue(mockQuery)
    
    const result = await generateUniqueSlug(mockSupabase, 'Test Product', 'site-123', 'product-456')
    
    expect(result).toBe('test-product')
    expect(mockQuery.neq).toHaveBeenCalledWith('id', 'product-456')
  })

  test('handles database errors gracefully', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      neq: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }
    
    ;(mockSupabase.from as any).mockReturnValue(mockQuery)
    
    const result = await generateUniqueSlug(mockSupabase, 'Test Product', 'site-123')
    
    // Should append timestamp on error
    expect(result).toMatch(/^test-product-\d+$/)
  })

  test('handles concurrent generations', async () => {
    const existingSlugs = Array.from({ length: 50 }, (_, i) => ({
      id: `id-${i}`,
      slug: i === 0 ? 'test-product' : `test-product-${i}`,
    }))
    
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      neq: jest.fn().mockResolvedValue({
        data: existingSlugs,
        error: null,
      }),
    }
    
    ;(mockSupabase.from as any).mockReturnValue(mockQuery)
    
    const result = await generateUniqueSlug(mockSupabase, 'Test Product', 'site-123')
    
    expect(result).toBe('test-product-51')
  })

  test('prevents infinite loops with safety check', async () => {
    // Create array with 1001 existing slugs
    const existingSlugs = Array.from({ length: 1001 }, (_, i) => ({
      id: `id-${i}`,
      slug: i === 0 ? 'test' : `test-${i}`,
    }))
    
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      neq: jest.fn().mockResolvedValue({
        data: existingSlugs,
        error: null,
      }),
    }
    
    ;(mockSupabase.from as any).mockReturnValue(mockQuery)
    
    const result = await generateUniqueSlug(mockSupabase, 'test', 'site-123')
    
    // Should fallback to timestamp after 1000 iterations
    expect(result).toMatch(/^test-\d{10,}$/)
  })
})

describe('validateSlug', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('validates correct slug format', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockResolvedValue({ data: [], error: null }),
    }
    
    ;(mockSupabase.from as any).mockReturnValue(mockQuery)
    
    const result = await validateSlug(mockSupabase, 'valid-slug-123', 'site-123')
    
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  test('rejects empty slug', async () => {
    const result = await validateSlug(mockSupabase, '', 'site-123')
    
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Slug is required')
  })

  test('rejects invalid characters', async () => {
    const result = await validateSlug(mockSupabase, 'Invalid Slug!', 'site-123')
    
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Slug can only contain lowercase letters, numbers, and hyphens')
  })

  test('rejects leading/trailing hyphens', async () => {
    const result1 = await validateSlug(mockSupabase, '-invalid', 'site-123')
    expect(result1.isValid).toBe(false)
    expect(result1.error).toBe('Slug cannot start or end with a hyphen')
    
    const result2 = await validateSlug(mockSupabase, 'invalid-', 'site-123')
    expect(result2.isValid).toBe(false)
    expect(result2.error).toBe('Slug cannot start or end with a hyphen')
  })

  test('rejects slug over 100 characters', async () => {
    const longSlug = 'a'.repeat(101)
    const result = await validateSlug(mockSupabase, longSlug, 'site-123')
    
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Slug must be 100 characters or less')
  })

  test('rejects reserved words', async () => {
    const result = await validateSlug(mockSupabase, 'admin', 'site-123')
    
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('This slug is reserved and cannot be used')
  })

  test('detects duplicate slugs', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockResolvedValue({
        data: [{ id: 'existing-product' }],
        error: null,
      }),
    }
    
    ;(mockSupabase.from as any).mockReturnValue(mockQuery)
    
    const result = await validateSlug(mockSupabase, 'existing-slug', 'site-123')
    
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('This slug is already in use')
  })

  test('excludes current product when validating', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
    }
    
    mockQuery.neq.mockResolvedValue({ data: [], error: null })
    ;(mockSupabase.from as any).mockReturnValue(mockQuery)
    
    const result = await validateSlug(mockSupabase, 'valid-slug', 'site-123', 'product-123')
    
    expect(result.isValid).toBe(true)
    expect(mockQuery.neq).toHaveBeenCalledWith('id', 'product-123')
  })

  test('handles database errors', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }
    
    ;(mockSupabase.from as any).mockReturnValue(mockQuery)
    
    const result = await validateSlug(mockSupabase, 'valid-slug', 'site-123')
    
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Failed to validate slug')
  })
})

describe('isReservedWord', () => {
  test('correctly identifies reserved words', () => {
    expect(isReservedWord('new')).toBe(true)
    expect(isReservedWord('admin')).toBe(true)
    expect(isReservedWord('api')).toBe(true)
    expect(isReservedWord('dashboard')).toBe(true)
    expect(isReservedWord('settings')).toBe(true)
  })

  test('correctly identifies non-reserved words', () => {
    expect(isReservedWord('product')).toBe(false)
    expect(isReservedWord('flower')).toBe(false)
    expect(isReservedWord('garden')).toBe(false)
    expect(isReservedWord('plant')).toBe(false)
  })

  test('is case-insensitive', () => {
    expect(isReservedWord('NEW')).toBe(true)
    expect(isReservedWord('Admin')).toBe(true)
    expect(isReservedWord('API')).toBe(true)
  })
})