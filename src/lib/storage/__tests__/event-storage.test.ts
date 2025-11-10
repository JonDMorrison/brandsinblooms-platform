/**
 * Tests for EventStorageAdapter
 */

import { EventStorageAdapter } from '../event-storage';

describe('EventStorageAdapter', () => {
  let adapter: EventStorageAdapter;

  beforeEach(() => {
    adapter = new EventStorageAdapter({
      siteId: 'test-site-id',
      eventId: 'test-event-id',
    });
  });

  describe('isSupabaseUrl', () => {
    it('should detect Supabase storage URLs', () => {
      const supabaseUrls = [
        'https://example.supabase.co/storage/v1/object/public/bucket/file.jpg',
        'https://example.supabase.in/storage/v1/object/public/bucket/file.jpg',
        'https://custom.domain.com/storage/v1/object/public/bucket/file.jpg',
      ];

      supabaseUrls.forEach(url => {
        expect(adapter.isSupabaseUrl(url)).toBe(true);
      });
    });

    it('should not detect non-Supabase URLs', () => {
      const nonSupabaseUrls = [
        'https://cdn.example.com/file.jpg',
        'https://s3.amazonaws.com/bucket/file.jpg',
        'https://example.cloudflare.com/file.jpg',
      ];

      nonSupabaseUrls.forEach(url => {
        expect(adapter.isSupabaseUrl(url)).toBe(false);
      });
    });

    it('should handle invalid URLs', () => {
      expect(adapter.isSupabaseUrl('not-a-url')).toBe(false);
      expect(adapter.isSupabaseUrl('')).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('should validate event media files', () => {
      const validMediaFile = new File(['content'], 'image.jpg', {
        type: 'image/jpeg'
      });
      Object.defineProperty(validMediaFile, 'size', { value: 4 * 1024 * 1024 }); // 4MB

      const result = adapter.validateFile(validMediaFile, 'event-media');
      expect(result.isValid).toBe(true);
    });

    it('should reject oversized media files', () => {
      const oversizedFile = new File(['content'], 'image.jpg', {
        type: 'image/jpeg'
      });
      Object.defineProperty(oversizedFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB

      const result = adapter.validateFile(oversizedFile, 'event-media');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('5MB');
    });

    it('should validate event attachment files', () => {
      const validAttachment = new File(['content'], 'document.pdf', {
        type: 'application/pdf'
      });
      Object.defineProperty(validAttachment, 'size', { value: 8 * 1024 * 1024 }); // 8MB

      const result = adapter.validateFile(validAttachment, 'event-attachment');
      expect(result.isValid).toBe(true);
    });

    it('should reject oversized attachment files', () => {
      const oversizedFile = new File(['content'], 'document.pdf', {
        type: 'application/pdf'
      });
      Object.defineProperty(oversizedFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB

      const result = adapter.validateFile(oversizedFile, 'event-attachment');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('10MB');
    });
  });

  describe('getMediaUrl', () => {
    it('should return URL as-is for now', async () => {
      const testUrl = 'https://example.com/media/image.jpg';
      const result = await adapter.getMediaUrl(testUrl);
      expect(result).toBe(testUrl);
    });
  });
});