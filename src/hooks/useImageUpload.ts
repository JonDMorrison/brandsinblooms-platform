'use client';

/**
 * Hook for uploading images to S3 for use in the rich text editor
 */

import { useState, useCallback } from 'react';
import {
  uploadFileToS3,
  validateFileForS3,
  type UploadProgressCallback
} from '@/src/lib/storage/s3-upload';
import { handleError } from '@/src/lib/types/error-handling';

export interface ImageUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedUrl: string | null;
}

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  cdnUrl?: string;
  error?: string;
}

export interface UseImageUploadOptions {
  siteId: string;
  resourceType?: 'products' | 'media' | 'profiles' | 'content';
  resourceId?: string;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export function useImageUpload({
  siteId,
  resourceType = 'content',
  resourceId = 'editor',
  onSuccess,
  onError,
}: UseImageUploadOptions) {
  const [state, setState] = useState<ImageUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedUrl: null,
  });

  const uploadImage = useCallback(async (file: File): Promise<ImageUploadResult> => {
    // Validate siteId is provided
    if (!siteId || siteId.trim() === '') {
      const error = 'siteId is required for image uploads';
      setState({
        isUploading: false,
        progress: 0,
        error,
        uploadedUrl: null,
      });
      onError?.(error);
      return { success: false, error };
    }

    // Reset state
    setState({
      isUploading: true,
      progress: 0,
      error: null,
      uploadedUrl: null,
    });


    try {
      // Validate file
      const validation = validateFileForS3(file);
      if (!validation.isValid) {
        const error = validation.error || 'Invalid file';
        setState({
          isUploading: false,
          progress: 0,
          error,
          uploadedUrl: null,
        });
        onError?.(error);
        return { success: false, error };
      }

      // Progress callback
      const onProgress: UploadProgressCallback = (progress) => {
        setState(prev => ({
          ...prev,
          progress: Math.round(progress),
        }));
      };

      // Upload to S3
      const result = await uploadFileToS3(
        file,
        siteId,
        resourceType,
        resourceId,
        {
          filename: file.name,
          onProgress,
        }
      );

      if (!result.success || !result.data) {
        const error = result.error || 'Upload failed';
        setState({
          isUploading: false,
          progress: 0,
          error,
          uploadedUrl: null,
        });
        onError?.(error);
        return { success: false, error };
      }

      // Use CDN URL if available, otherwise use regular URL
      const finalUrl = result.data.cdnUrl || result.data.url;

      setState({
        isUploading: false,
        progress: 100,
        error: null,
        uploadedUrl: finalUrl,
      });

      onSuccess?.(finalUrl);

      return {
        success: true,
        url: result.data.url,
        cdnUrl: result.data.cdnUrl,
      };
    } catch (error) {
      const handled = handleError(error);
      setState({
        isUploading: false,
        progress: 0,
        error: handled.message,
        uploadedUrl: null,
      });
      onError?.(handled.message);
      return { success: false, error: handled.message };
    }
  }, [siteId, resourceType, resourceId, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedUrl: null,
    });
  }, []);

  return {
    ...state,
    uploadImage,
    reset,
  };
}
