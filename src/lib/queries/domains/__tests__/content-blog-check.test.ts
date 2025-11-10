/**
 * Tests for hasPublishedBlogPosts function
 */

import { describe, it, expect, vi, beforeEach } from '@jest/globals';
import { hasPublishedBlogPosts } from '../content';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database/types';

describe('hasPublishedBlogPosts', () => {
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    // Create a mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient<Database>;
  });

  it('should return true when published blog posts exist', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    // Mock the final response with count > 0
    (mockQuery.eq as any).mockResolvedValueOnce({
      count: 5,
      error: null,
    });

    (mockSupabase.from as any).mockReturnValue(mockQuery);

    const result = await hasPublishedBlogPosts(mockSupabase, 'test-site-id');

    expect(result).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('content');
    expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
  });

  it('should return false when no published blog posts exist', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    // Mock the final response with count = 0
    (mockQuery.eq as any).mockResolvedValueOnce({
      count: 0,
      error: null,
    });

    (mockSupabase.from as any).mockReturnValue(mockQuery);

    const result = await hasPublishedBlogPosts(mockSupabase, 'test-site-id');

    expect(result).toBe(false);
  });

  it('should return false when there is a database error', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    // Mock the final response with an error
    (mockQuery.eq as any).mockResolvedValueOnce({
      count: null,
      error: { message: 'Database error' },
    });

    (mockSupabase.from as any).mockReturnValue(mockQuery);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await hasPublishedBlogPosts(mockSupabase, 'test-site-id');

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error checking for published blog posts:',
      { message: 'Database error' }
    );

    consoleSpy.mockRestore();
  });

  it('should filter by site_id, content_type=blog_post, and is_published=true', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    (mockQuery.eq as any).mockResolvedValueOnce({
      count: 1,
      error: null,
    });

    (mockSupabase.from as any).mockReturnValue(mockQuery);

    await hasPublishedBlogPosts(mockSupabase, 'test-site-id');

    // Verify all filters are applied
    expect(mockQuery.eq).toHaveBeenCalledWith('site_id', 'test-site-id');
    expect(mockQuery.eq).toHaveBeenCalledWith('content_type', 'blog_post');
    expect(mockQuery.eq).toHaveBeenCalledWith('is_published', true);
  });
});
