/**
 * Admin Sites Service Tests
 * 
 * Tests for the admin sites management functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  AdminSiteError,
  getAllSites,
  searchSites,
  getSiteStats,
  updateSiteStatus,
  checkAdminAccess
} from '@/src/lib/admin/sites'

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(),
  auth: {
    getUser: vi.fn()
  }
}

// Mock the supabase client import
vi.mock('@/src/lib/supabase/client', () => ({
  supabase: mockSupabase
}))

describe('Admin Sites Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AdminSiteError', () => {
    it('should create error with proper properties', () => {
      const error = new AdminSiteError('Test message', 'TEST_CODE', { detail: 'test' })
      
      expect(error.message).toBe('Test message')
      expect(error.code).toBe('TEST_CODE')
      expect(error.details).toEqual({ detail: 'test' })
      expect(error.name).toBe('AdminSiteError')
    })
  })

  describe('getAllSites', () => {
    it('should fetch sites successfully', async () => {
      const mockResponse = {
        sites: [
          {
            id: 'site1',
            name: 'Test Site',
            subdomain: 'test',
            owner_count: 1,
            content_count: 5,
            product_count: 10
          }
        ],
        total_count: 1
      }

      mockSupabase.rpc.mockResolvedValue({
        data: mockResponse,
        error: null
      })

      const result = await getAllSites(1, 10)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_all_sites_with_stats', {
        search_query: null,
        status_filter: null,
        limit_count: 10,
        offset_count: 0
      })

      expect(result).toEqual({
        sites: mockResponse.sites,
        total_count: 1,
        page: 1,
        limit: 10,
        has_more: false
      })
    })

    it('should handle database errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(getAllSites()).rejects.toThrow(AdminSiteError)
      await expect(getAllSites()).rejects.toThrow('Failed to fetch sites')
    })

    it('should handle empty results', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await getAllSites()

      expect(result).toEqual({
        sites: [],
        total_count: 0,
        page: 1,
        limit: 50,
        has_more: false
      })
    })
  })

  describe('searchSites', () => {
    it('should search sites with query', async () => {
      const mockResponse = {
        sites: [
          {
            id: 'site1',
            name: 'Garden Center',
            subdomain: 'garden',
            owner_count: 1
          }
        ],
        total_count: 1
      }

      mockSupabase.rpc.mockResolvedValue({
        data: mockResponse,
        error: null
      })

      const result = await searchSites('garden', { status: 'active' })

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_all_sites_with_stats', {
        search_query: 'garden',
        status_filter: 'active',
        limit_count: 50,
        offset_count: 0
      })

      expect(result.sites).toHaveLength(1)
      expect(result.sites[0].name).toBe('Garden Center')
    })
  })

  describe('getSiteStats', () => {
    it('should fetch site statistics', async () => {
      const mockStats = {
        site_id: 'site1',
        total_content: 10,
        published_content: 8,
        total_products: 50,
        active_products: 45,
        total_inquiries: 5,
        recent_inquiries: 2
      }

      mockSupabase.rpc.mockResolvedValue({
        data: mockStats,
        error: null
      })

      const result = await getSiteStats('site1')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_site_summary_stats', {
        site_uuid: 'site1'
      })

      expect(result).toEqual(mockStats)
    })

    it('should throw error for missing site ID', async () => {
      await expect(getSiteStats('')).rejects.toThrow(AdminSiteError)
      await expect(getSiteStats('')).rejects.toThrow('Site ID is required')
    })

    it('should handle access denied error', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Access denied: Admin privileges required' }
      })

      await expect(getSiteStats('site1')).rejects.toThrow(AdminSiteError)
      await expect(getSiteStats('site1')).rejects.toThrow('Access denied')
    })
  })

  describe('updateSiteStatus', () => {
    it('should update site status successfully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null
      })

      const result = await updateSiteStatus('site1', {
        is_active: false,
        admin_notes: 'Site temporarily disabled'
      })

      expect(mockSupabase.rpc).toHaveBeenCalledWith('admin_update_site_status', {
        site_uuid: 'site1',
        new_is_active: false,
        new_is_published: null,
        notes: 'Site temporarily disabled'
      })

      expect(result).toBe(true)
    })

    it('should throw error for empty updates', async () => {
      await expect(updateSiteStatus('site1', {})).rejects.toThrow(AdminSiteError)
      await expect(updateSiteStatus('site1', {})).rejects.toThrow('At least one update field is required')
    })

    it('should handle site not found error', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Site not found: site1' }
      })

      await expect(updateSiteStatus('site1', { is_active: true })).rejects.toThrow(AdminSiteError)
      await expect(updateSiteStatus('site1', { is_active: true })).rejects.toThrow('Site not found')
    })
  })

  describe('checkAdminAccess', () => {
    it('should return true for admin user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      })

      const result = await checkAdminAccess()

      expect(result).toBe(true)
    })

    it('should return false for non-admin user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'site_owner' },
              error: null
            })
          })
        })
      })

      const result = await checkAdminAccess()

      expect(result).toBe(false)
    })

    it('should return false for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await checkAdminAccess()

      expect(result).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      })

      const result = await checkAdminAccess()

      expect(result).toBe(false)
    })
  })
})

describe('Admin Sites Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Site listing with filters', () => {
    it('should apply multiple filters correctly', async () => {
      const mockResponse = {
        sites: [],
        total_count: 0
      }

      mockSupabase.rpc.mockResolvedValue({
        data: mockResponse,
        error: null
      })

      await getAllSites(1, 25, {
        search: 'garden',
        status: 'active'
      })

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_all_sites_with_stats', {
        search_query: 'garden',
        status_filter: 'active',
        limit_count: 25,
        offset_count: 0
      })
    })

    it('should handle pagination correctly', async () => {
      const mockResponse = {
        sites: new Array(10).fill(null).map((_, i) => ({
          id: `site${i}`,
          name: `Site ${i}`,
          subdomain: `site${i}`
        })),
        total_count: 100
      }

      mockSupabase.rpc.mockResolvedValue({
        data: mockResponse,
        error: null
      })

      const result = await getAllSites(3, 10)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_all_sites_with_stats', {
        search_query: null,
        status_filter: null,
        limit_count: 10,
        offset_count: 20 // (page 3 - 1) * 10
      })

      expect(result.page).toBe(3)
      expect(result.has_more).toBe(true)
      expect(result.total_count).toBe(100)
    })
  })

  describe('Error handling patterns', () => {
    it('should preserve original AdminSiteError instances', async () => {
      const originalError = new AdminSiteError('Original error', 'ORIGINAL_CODE')
      
      mockSupabase.rpc.mockImplementation(() => {
        throw originalError
      })

      try {
        await getAllSites()
        expect.fail('Expected error to be thrown')
      } catch (error) {
        expect(error).toBe(originalError)
        expect(error.code).toBe('ORIGINAL_CODE')
      }
    })

    it('should wrap unexpected errors in AdminSiteError', async () => {
      const unexpectedError = new Error('Unexpected error')
      
      mockSupabase.rpc.mockImplementation(() => {
        throw unexpectedError
      })

      try {
        await getAllSites()
        expect.fail('Expected error to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(AdminSiteError)
        expect(error.code).toBe('UNEXPECTED_ERROR')
        expect(error.details).toBe(unexpectedError)
      }
    })
  })
})