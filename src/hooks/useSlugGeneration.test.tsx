// Jest globals are available globally, no import needed
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import {
  useSlugGeneration,
  useSlugValidation,
  useDebouncedSlugGeneration,
  useSlugField,
} from './useSlugGeneration'

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(() => mockSupabase),
}))

jest.mock('@/src/contexts/SiteContext', () => ({
  useSiteId: jest.fn(() => 'test-site-id'),
}))

jest.mock('@/lib/utils/slug', () => ({
  generateUniqueSlug: jest.fn(),
  validateSlug: jest.fn(),
  sanitizeSlug: jest.fn((input: string) => 
    input.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
  ),
}))

// Import after mocks are set up
import { generateUniqueSlug, validateSlug } from '@/lib/utils/slug'

const mockSupabase = {
  from: jest.fn(),
}

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useSlugGeneration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('generates unique slug successfully', async () => {
    const mockSlug = 'test-product-slug'
    ;(generateUniqueSlug as any).mockResolvedValue(mockSlug)

    const { result } = renderHook(() => useSlugGeneration(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({ name: 'Test Product' })
    })

    await waitFor(() => {
      expect(result.current.data).toBe(mockSlug)
      expect(result.current.isSuccess).toBe(true)
    })

    expect(generateUniqueSlug).toHaveBeenCalledWith(
      mockSupabase,
      'Test Product',
      'test-site-id',
      undefined
    )
  })

  test('handles empty name input', async () => {
    const { result } = renderHook(() => useSlugGeneration(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const slug = await result.current.mutateAsync({ name: '' })
      expect(slug).toBe('')
    })

    expect(generateUniqueSlug).not.toHaveBeenCalled()
  })

  test('uses cache for repeated requests', async () => {
    const mockSlug = 'cached-slug'
    ;(generateUniqueSlug as any).mockResolvedValue(mockSlug)

    const wrapper = createWrapper()
    const { result } = renderHook(() => useSlugGeneration(), { wrapper })

    // First call
    await act(async () => {
      await result.current.mutateAsync({ name: 'Cached Product' })
    })

    expect(generateUniqueSlug).toHaveBeenCalledTimes(1)

    // Second call with same name - should use cache
    await act(async () => {
      await result.current.mutateAsync({ name: 'Cached Product' })
    })

    // Should not call generateUniqueSlug again due to cache
    expect(generateUniqueSlug).toHaveBeenCalledTimes(1)
  })

  test('excludes product ID when provided', async () => {
    const mockSlug = 'edited-product-slug'
    ;(generateUniqueSlug as any).mockResolvedValue(mockSlug)

    const { result } = renderHook(() => useSlugGeneration(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        name: 'Edited Product',
        excludeId: 'product-123',
      })
    })

    expect(generateUniqueSlug).toHaveBeenCalledWith(
      mockSupabase,
      'Edited Product',
      'test-site-id',
      'product-123'
    )
  })

  test('handles errors gracefully', async () => {
    const error = new Error('Generation failed')
    ;(generateUniqueSlug as any).mockRejectedValue(error)

    const { result } = renderHook(() => useSlugGeneration(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({ name: 'Error Product' })
      } catch (e) {
        expect(e).toBe(error)
      }
    })

    expect(result.current.isError).toBe(true)
  })
})

describe('useSlugValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('validates slug successfully', async () => {
    const mockValidation = { isValid: true }
    ;(validateSlug as any).mockResolvedValue(mockValidation)

    const { result } = renderHook(() => useSlugValidation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const validation = await result.current.mutateAsync({ slug: 'valid-slug' })
      expect(validation).toEqual(mockValidation)
    })

    expect(validateSlug).toHaveBeenCalledWith(
      mockSupabase,
      'valid-slug',
      'test-site-id',
      undefined
    )
  })

  test('returns validation error', async () => {
    const mockValidation = { isValid: false, error: 'Slug already exists' }
    ;(validateSlug as any).mockResolvedValue(mockValidation)

    const { result } = renderHook(() => useSlugValidation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      const validation = await result.current.mutateAsync({ slug: 'duplicate-slug' })
      expect(validation).toEqual(mockValidation)
    })
  })

  test('excludes product ID when validating', async () => {
    const mockValidation = { isValid: true }
    ;(validateSlug as any).mockResolvedValue(mockValidation)

    const { result } = renderHook(() => useSlugValidation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        slug: 'edited-slug',
        excludeId: 'product-456',
      })
    })

    expect(validateSlug).toHaveBeenCalledWith(
      mockSupabase,
      'edited-slug',
      'test-site-id',
      'product-456'
    )
  })
})

describe('useDebouncedSlugGeneration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('debounces slug generation', async () => {
    const mockSlug = 'debounced-slug'
    ;(generateUniqueSlug as any).mockResolvedValue(mockSlug)

    const { result } = renderHook(() => useDebouncedSlugGeneration(500), {
      wrapper: createWrapper(),
    })

    // Call multiple times rapidly
    act(() => {
      result.current.generateSlug({ name: 'Product 1' })
      result.current.generateSlug({ name: 'Product 2' })
      result.current.generateSlug({ name: 'Product 3' })
    })

    // Should not be called yet
    expect(generateUniqueSlug).not.toHaveBeenCalled()

    // Fast-forward time
    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    await waitFor(() => {
      // Should only be called once with the last value
      expect(generateUniqueSlug).toHaveBeenCalledTimes(1)
      expect(generateUniqueSlug).toHaveBeenCalledWith(
        mockSupabase,
        'Product 3',
        'test-site-id',
        undefined
      )
    })
  })

  test('immediate generation bypasses debounce', async () => {
    const mockSlug = 'immediate-slug'
    ;(generateUniqueSlug as any).mockResolvedValue(mockSlug)

    const { result } = renderHook(() => useDebouncedSlugGeneration(500), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.generateSlugImmediate({ name: 'Immediate Product' })
    })

    // Should be called immediately
    expect(generateUniqueSlug).toHaveBeenCalledTimes(1)
  })

  test('tracks loading state correctly', async () => {
    const mockSlug = 'loading-test-slug'
    ;(generateUniqueSlug as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockSlug), 100))
    )

    const { result } = renderHook(() => useDebouncedSlugGeneration(0), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(false)

    act(() => {
      result.current.generateSlug({ name: 'Loading Test' })
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    await act(async () => {
      jest.advanceTimersByTime(100)
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.slug).toBe(mockSlug)
    })
  })
})

describe('useSlugField', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('manages slug field state correctly', async () => {
    const mockSlug = 'managed-slug'
    ;(generateUniqueSlug as any).mockResolvedValue(mockSlug)
    ;(validateSlug as any).mockResolvedValue({ isValid: true })

    const { result } = renderHook(() => useSlugField({ delay: 0 }), {
      wrapper: createWrapper(),
    })

    expect(result.current.currentSlug).toBe('')
    expect(result.current.manuallyEdited).toBe(false)

    // Trigger name change
    await act(async () => {
      result.current.handleNameChange('New Product Name')
    })

    await waitFor(() => {
      expect(result.current.currentSlug).toBe(mockSlug)
    })

    // Manual slug change
    act(() => {
      result.current.handleSlugChange('manual-slug')
    })

    expect(result.current.manuallyEdited).toBe(true)
    expect(result.current.currentSlug).toBe('manual-slug')
  })

  test('validates slug on demand', async () => {
    const mockValidation = { isValid: false, error: 'Invalid slug' }
    ;(validateSlug as any).mockResolvedValue(mockValidation)

    const { result } = renderHook(() => useSlugField(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.handleSlugChange('invalid-slug!')
    })

    const isValid = await act(async () => {
      return await result.current.validateCurrentSlug()
    })

    expect(isValid).toBe(false)
    expect(result.current.validationError).toBe('Invalid slug')
  })

  test('resets to auto-generated slug', async () => {
    const mockSlug = 'auto-generated-slug'
    ;(generateUniqueSlug as any).mockResolvedValue(mockSlug)

    const { result } = renderHook(() => useSlugField({ delay: 0 }), {
      wrapper: createWrapper(),
    })

    // Set manual slug
    act(() => {
      result.current.handleSlugChange('manual-slug')
    })

    expect(result.current.manuallyEdited).toBe(true)

    // Reset to auto-generated
    await act(async () => {
      result.current.resetToAutoGenerated('Product Name')
    })

    await waitFor(() => {
      expect(result.current.manuallyEdited).toBe(false)
      expect(result.current.currentSlug).toBe(mockSlug)
      expect(result.current.validationError).toBe(null)
    })
  })

  test('handles empty slug validation', async () => {
    const { result } = renderHook(() => useSlugField(), {
      wrapper: createWrapper(),
    })

    const isValid = await act(async () => {
      return await result.current.validateCurrentSlug()
    })

    expect(isValid).toBe(false)
    expect(result.current.validationError).toBe('Slug is required')
  })

  test('excludes product ID when provided', async () => {
    const mockSlug = 'excluded-product-slug'
    ;(generateUniqueSlug as any).mockResolvedValue(mockSlug)
    ;(validateSlug as any).mockResolvedValue({ isValid: true })

    const { result } = renderHook(
      () => useSlugField({ delay: 0, excludeId: 'product-789' }),
      { wrapper: createWrapper() }
    )

    await act(async () => {
      result.current.handleNameChange('Excluded Product')
    })

    await waitFor(() => {
      expect(generateUniqueSlug).toHaveBeenCalledWith(
        mockSupabase,
        'Excluded Product',
        'test-site-id',
        'product-789'
      )
    })

    await act(async () => {
      result.current.handleSlugChange('custom-slug')
      await result.current.validateCurrentSlug()
    })

    expect(validateSlug).toHaveBeenCalledWith(
      mockSupabase,
      'custom-slug',
      'test-site-id',
      'product-789'
    )
  })
})