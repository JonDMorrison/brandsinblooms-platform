/**
 * Event Storage Adapter for the Brands in Blooms platform
 * Handles event media and attachment uploads to R2/CDN
 * Provides dual-read support for migration compatibility
 */

import { handleError } from '../types/error-handling';
import { getCdnUrl } from './s3-client';

/**
 * Event file upload types
 */
export type EventUploadType = 'event-media' | 'event-attachment';

/**
 * Event storage configuration
 */
export interface EventStorageConfig {
  siteId: string;
  eventId: string;
  apiUrl?: string; // Override API URL for testing
}

/**
 * Presigned URL request interface
 */
interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
  siteId: string;
  eventId: string;
  uploadType: EventUploadType;
  metadata?: Record<string, string>;
}

/**
 * Presigned URL response interface
 */
interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
  maxFileSize: number;
}

/**
 * Event Storage Adapter class
 * Provides methods for uploading and managing event files in R2/CDN
 */
export class EventStorageAdapter {
  private config: EventStorageConfig;
  private apiUrl: string;

  constructor(config: EventStorageConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl || '/api/upload/presigned';
  }

  /**
   * Get a presigned URL for direct upload to R2
   */
  private async getPresignedUrl(
    file: File,
    uploadType: EventUploadType
  ): Promise<PresignedUrlResponse> {
    try {
      const request: PresignedUrlRequest = {
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        siteId: this.config.siteId,
        eventId: this.config.eventId,
        uploadType,
        metadata: {
          'uploaded-via': 'event-storage-adapter',
          'event-id': this.config.eventId,
        },
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to get presigned URL: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get presigned URL');
      }

      return data.data as PresignedUrlResponse;
    } catch (error) {
      const handled = handleError(error);
      throw new Error(`Failed to get presigned URL: ${handled.message}`);
    }
  }

  /**
   * Upload file directly to R2 using presigned URL
   */
  private async uploadToR2(file: File, presignedData: PresignedUrlResponse): Promise<void> {
    try {
      const response = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Upload failed: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }
    } catch (error) {
      const handled = handleError(error);
      throw new Error(`Failed to upload file to R2: ${handled.message}`);
    }
  }

  /**
   * Upload event media (images/videos)
   * Returns the CDN URL of the uploaded file
   */
  async uploadEventMedia(file: File, eventId: string, siteId: string): Promise<string> {
    try {
      // Update config with provided IDs
      this.config.eventId = eventId;
      this.config.siteId = siteId;

      // Get presigned URL
      const presignedData = await this.getPresignedUrl(file, 'event-media');

      // Upload file to R2
      await this.uploadToR2(file, presignedData);

      // Return the CDN URL
      return presignedData.publicUrl;
    } catch (error) {
      const handled = handleError(error);
      throw new Error(`Failed to upload event media: ${handled.message}`);
    }
  }

  /**
   * Upload event attachment (documents)
   * Returns the CDN URL of the uploaded file
   */
  async uploadEventAttachment(file: File, eventId: string, siteId: string): Promise<string> {
    try {
      // Update config with provided IDs
      this.config.eventId = eventId;
      this.config.siteId = siteId;

      // Get presigned URL
      const presignedData = await this.getPresignedUrl(file, 'event-attachment');

      // Upload file to R2
      await this.uploadToR2(file, presignedData);

      // Return the CDN URL
      return presignedData.publicUrl;
    } catch (error) {
      const handled = handleError(error);
      throw new Error(`Failed to upload event attachment: ${handled.message}`);
    }
  }

  /**
   * Delete event file from R2
   * Note: This requires server-side implementation as we cannot delete directly from the client
   */
  async deleteEventFile(cdnUrl: string): Promise<void> {
    try {
      // Extract the key from the CDN URL
      const url = new URL(cdnUrl);
      const pathParts = url.pathname.split('/');

      // Remove leading slash if present
      const key = pathParts[0] === '' ? pathParts.slice(1).join('/') : pathParts.join('/');

      // Call delete API endpoint (to be implemented)
      const response = await fetch('/api/storage/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          siteId: this.config.siteId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to delete file: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete file');
      }
    } catch (error) {
      const handled = handleError(error);
      console.error('Failed to delete event file:', handled.message);
      // Don't throw - deletion failures shouldn't break the flow
    }
  }

  /**
   * Get media URL with dual-read support
   * Returns the URL as-is for now (future: handle Supabase to CDN migration)
   */
  async getMediaUrl(url: string): Promise<string> {
    // For now, just return the URL as-is
    // In the future, this method will handle:
    // 1. Detecting Supabase URLs
    // 2. Checking if the file exists in R2
    // 3. Returning the appropriate URL
    return url;
  }

  /**
   * Check if a URL is from Supabase storage
   */
  isSupabaseUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // Check for common Supabase storage patterns
      return (
        urlObj.hostname.includes('supabase.co') ||
        urlObj.hostname.includes('supabase.in') ||
        urlObj.pathname.includes('/storage/v1/object/')
      );
    } catch {
      // Invalid URL
      return false;
    }
  }

  /**
   * Get file metadata (for future use)
   */
  async getFileMetadata(cdnUrl: string): Promise<{
    size?: number;
    contentType?: string;
    lastModified?: Date;
  }> {
    try {
      // HEAD request to get metadata
      const response = await fetch(cdnUrl, {
        method: 'HEAD',
      });

      if (!response.ok) {
        throw new Error(`Failed to get file metadata: ${response.statusText}`);
      }

      return {
        size: parseInt(response.headers.get('Content-Length') || '0', 10),
        contentType: response.headers.get('Content-Type') || undefined,
        lastModified: response.headers.get('Last-Modified')
          ? new Date(response.headers.get('Last-Modified')!)
          : undefined,
      };
    } catch (error) {
      const handled = handleError(error);
      console.error('Failed to get file metadata:', handled.message);
      return {};
    }
  }

  /**
   * Batch upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    uploadType: EventUploadType,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Array<{ file: File; url?: string; error?: string }>> {
    const results: Array<{ file: File; url?: string; error?: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const url = uploadType === 'event-media'
          ? await this.uploadEventMedia(file, this.config.eventId, this.config.siteId)
          : await this.uploadEventAttachment(file, this.config.eventId, this.config.siteId);

        results.push({ file, url });
      } catch (error) {
        const handled = handleError(error);
        results.push({ file, error: handled.message });
      }

      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }

    return results;
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, uploadType: EventUploadType): {
    isValid: boolean;
    error?: string;
  } {
    // Import validation from storage config
    const maxSize = uploadType === 'event-media'
      ? 5 * 1024 * 1024  // 5MB for media
      : 10 * 1024 * 1024; // 10MB for attachments

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`,
      };
    }

    // Additional type validation could be added here
    return { isValid: true };
  }
}

/**
 * Create a singleton instance for convenience
 */
let defaultAdapter: EventStorageAdapter | null = null;

/**
 * Get or create the default event storage adapter
 */
export function getEventStorageAdapter(config?: EventStorageConfig): EventStorageAdapter {
  if (!defaultAdapter || config) {
    defaultAdapter = new EventStorageAdapter(
      config || {
        siteId: '',
        eventId: '',
      }
    );
  }
  return defaultAdapter;
}

// Types are already exported above