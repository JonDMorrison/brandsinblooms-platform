/**
 * Tests for S3 Upload functionality
 * Ensures proper validation and error handling for presigned URL responses
 */

import { getPresignedUploadUrl } from '../s3-upload';

// Mock fetch globally
global.fetch = jest.fn();

describe('getPresignedUploadUrl', () => {
  const mockConfig = {
    key: 'test/file.jpg',
    fileName: 'file.jpg',
    siteId: 'test-site',
    contentType: 'image/jpeg',
    contentLength: 1024,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('Response Validation', () => {
    it('should handle valid success response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          success: true,
          data: {
            uploadUrl: 'https://s3.example.com/presigned',
            publicUrl: '/api/images/test/file.jpg',
            key: 'test/file.jpg',
            expiresIn: 300,
            maxFileSize: 5242880,
          },
        }),
      });

      const result = await getPresignedUploadUrl(mockConfig, 1); // No retries for tests

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.uploadUrl).toBe('https://s3.example.com/presigned');
      expect(result.data?.url).toBe('/api/images/test/file.jpg');
    });

    it('should handle success=true but missing data object', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          success: true,
          // data is missing
        }),
      });

      const result = await getPresignedUploadUrl(mockConfig, 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('data is missing or invalid');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[S3 Upload] API returned success=true but data is invalid'),
        expect.any(Object)
      );
    });

    it('should handle success=true but data is null', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          success: true,
          data: null,
        }),
      });

      const result = await getPresignedUploadUrl(mockConfig, 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('data is missing or invalid');
    });

    it('should handle success=true but missing required fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          success: true,
          data: {
            // Missing uploadUrl and publicUrl
            key: 'test/file.jpg',
            expiresIn: 300,
          },
        }),
      });

      const result = await getPresignedUploadUrl(mockConfig, 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing required fields');
      expect(result.error).toContain('uploadUrl');
      expect(result.error).toContain('publicUrl');
    });

    it('should handle success=false with error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          success: false,
          error: 'Storage not configured',
          code: 'STORAGE_ERROR',
        }),
      });

      const result = await getPresignedUploadUrl(mockConfig, 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage not configured');
    });

    it('should handle invalid JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => 'Not valid JSON {',
      });

      const result = await getPresignedUploadUrl(mockConfig, 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed after 1 attempts');
    });

    it('should handle non-object response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify('string response'),
      });

      const result = await getPresignedUploadUrl(mockConfig, 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not an object');
    });
  });

  describe('HTTP Error Handling', () => {
    it('should not retry on 4xx errors (except 429)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid request',
      });

      const result = await getPresignedUploadUrl(mockConfig, 3);

      expect(result.success).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retries
    });

    it('should retry on 429 (rate limit) errors', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: async () => 'Rate limited',
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({
            success: true,
            data: {
              uploadUrl: 'https://s3.example.com/presigned',
              publicUrl: '/api/images/test/file.jpg',
              key: 'test/file.jpg',
              expiresIn: 300,
              maxFileSize: 5242880,
            },
          }),
        });

      const result = await getPresignedUploadUrl(mockConfig, 3);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    it('should retry on 5xx errors', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server error',
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({
            success: true,
            data: {
              uploadUrl: 'https://s3.example.com/presigned',
              publicUrl: '/api/images/test/file.jpg',
              key: 'test/file.jpg',
              expiresIn: 300,
              maxFileSize: 5242880,
            },
          }),
        });

      const result = await getPresignedUploadUrl(mockConfig, 3);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Retry Logic', () => {
    it('should retry up to max attempts on transient failures', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({
            success: true,
            data: {
              uploadUrl: 'https://s3.example.com/presigned',
              publicUrl: '/api/images/test/file.jpg',
              key: 'test/file.jpg',
              expiresIn: 300,
              maxFileSize: 5242880,
            },
          }),
        });

      const result = await getPresignedUploadUrl(mockConfig, 3);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after exhausting all retries', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await getPresignedUploadUrl(mockConfig, 3);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed after 3 attempts');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff for retries', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({
            success: true,
            data: {
              uploadUrl: 'https://s3.example.com/presigned',
              publicUrl: '/api/images/test/file.jpg',
              key: 'test/file.jpg',
              expiresIn: 300,
              maxFileSize: 5242880,
            },
          }),
        });

      const promise = getPresignedUploadUrl(mockConfig, 3);

      // Fast-forward through retries
      await jest.advanceTimersByTimeAsync(1000); // First retry after 1s
      await jest.advanceTimersByTimeAsync(2000); // Second retry after 2s

      const result = await promise;

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      const result = await getPresignedUploadUrl(mockConfig, 1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle undefined response fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          success: true,
          data: {
            uploadUrl: undefined,
            publicUrl: '/api/images/test/file.jpg',
            key: 'test/file.jpg',
            expiresIn: 300,
            maxFileSize: 5242880,
          },
        }),
      });

      const result = await getPresignedUploadUrl(mockConfig, 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing required fields');
    });
  });
});