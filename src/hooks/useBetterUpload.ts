'use client';

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSiteId } from '@/src/contexts/SiteContext';
import { handleError } from '@/lib/types/error-handling';
import { queryKeys } from '@/lib/queries/keys';
import { 
  uploadFileToS3, 
  validateFileForS3,
  type UploadProgressCallback,
  type S3UploadResult,
  type S3MultipartUploadResult
} from '@/lib/storage/s3-upload';
import { Tables, TablesInsert } from '@/lib/database/types';
import { supabase } from '@/lib/supabase/client';

type MediaFile = Tables<'media_files'>;
type MediaFileInsert = TablesInsert<'media_files'>;

/**
 * Upload status for tracking individual file uploads
 */
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

/**
 * Individual file upload state
 */
export interface FileUploadState {
  file: File;
  id: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  result?: S3UploadResult | S3MultipartUploadResult;
  mediaRecord?: MediaFile;
}

/**
 * Upload configuration options
 */
export interface UploadOptions {
  resourceType?: 'products' | 'media' | 'profiles' | 'content';
  resourceId?: string;
  autoStart?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedTypes?: string[];
  onSuccess?: (file: FileUploadState) => void;
  onError?: (file: FileUploadState) => void;
  onProgress?: (file: FileUploadState) => void;
  onComplete?: (files: FileUploadState[]) => void;
  createMediaRecord?: boolean; // Whether to create database record
  altText?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Drag and drop state
 */
export interface DragState {
  isDragging: boolean;
  isOver: boolean;
}

/**
 * Better upload hook with S3 support, progress tracking, and drag-and-drop
 */
export function useBetterUpload(options: UploadOptions = {}) {
  const {
    resourceType = 'media',
    resourceId,
    autoStart = true,
    maxFiles = 10,
    maxFileSize,
    acceptedTypes,
    onSuccess,
    onError,
    onProgress,
    onComplete,
    createMediaRecord = true,
    altText,
    metadata,
  } = options;

  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  // State
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [dragState, setDragState] = useState<DragState>({ isDragging: false, isOver: false });
  const [isUploading, setIsUploading] = useState(false);
  
  // Refs for cleanup
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  /**
   * Generates unique ID for file
   */
  const generateFileId = useCallback((file: File): string => {
    return `${file.name}_${file.size}_${file.lastModified}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Validates a file against configuration
   */
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file size
    const fileSizeLimit = maxFileSize || (100 * 1024 * 1024); // 100MB default
    if (file.size > fileSizeLimit) {
      return {
        isValid: false,
        error: `File size must be less than ${Math.round(fileSizeLimit / 1024 / 1024)}MB`,
      };
    }

    // Check file type if specified
    if (acceptedTypes && acceptedTypes.length > 0) {
      if (!acceptedTypes.includes(file.type)) {
        return {
          isValid: false,
          error: `File type ${file.type} is not supported. Allowed types: ${acceptedTypes.join(', ')}`,
        };
      }
    } else {
      // Use S3 validation as fallback
      return validateFileForS3(file);
    }

    return { isValid: true };
  }, [maxFileSize, acceptedTypes]);

  /**
   * Creates media database record
   */
  const createMediaDbRecord = useCallback(async (
    fileState: FileUploadState,
    uploadResult: S3UploadResult | S3MultipartUploadResult
  ): Promise<MediaFile | null> => {
    if (!siteId || !uploadResult.data) return null;

    try {
      const mediaData: MediaFileInsert = {
        site_id: siteId,
        file_name: fileState.file.name,
        file_type: fileState.file.type,
        file_size_bytes: fileState.file.size,
        file_url: uploadResult.data.url,
        cdn_url: uploadResult.data.cdnUrl || null,
        s3_key: uploadResult.data.key,
        s3_bucket: process.env.NEXT_PUBLIC_S3_BUCKET || '',
        storage_type: 's3',
        alt_text: altText || null,
        upload_metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id || null,
      };

      const { data, error } = await supabase
        .from('media_files')
        .insert(mediaData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to create media record:', handleError(error).message);
      return null;
    }
  }, [siteId, altText, metadata]);

  /**
   * Uploads a single file
   */
  const uploadSingleFile = useMutation({
    mutationFn: async (fileState: FileUploadState): Promise<FileUploadState> => {
      if (!siteId) throw new Error('Site ID is required');

      const effectiveResourceId = resourceId || 'general';
      
      // Create progress callback
      const onProgressCallback: UploadProgressCallback = (progress) => {
        setFiles(prev => prev.map(f => 
          f.id === fileState.id 
            ? { ...f, progress: Math.round(progress) }
            : f
        ));
        onProgress?.({ ...fileState, progress: Math.round(progress) });
      };

      // Upload to S3
      const uploadResult = await uploadFileToS3(
        fileState.file,
        siteId,
        resourceType,
        effectiveResourceId,
        {
          onProgress: onProgressCallback,
          metadata,
        }
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Create media record if requested
      let mediaRecord: MediaFile | null = null;
      if (createMediaRecord) {
        mediaRecord = await createMediaDbRecord(fileState, uploadResult);
      }

      return {
        ...fileState,
        status: 'success' as const,
        progress: 100,
        result: uploadResult,
        mediaRecord: mediaRecord || undefined,
      };
    },
    onSuccess: (updatedFile) => {
      setFiles(prev => prev.map(f => 
        f.id === updatedFile.id ? updatedFile : f
      ));
      onSuccess?.(updatedFile);
      
      // Invalidate relevant queries
      if (createMediaRecord) {
        queryClient.invalidateQueries({ queryKey: queryKeys.media.all(siteId!) });
      }
      
      toast.success(`${updatedFile.file.name} uploaded successfully`);
    },
    onError: (error, fileState) => {
      const handled = handleError(error);
      const updatedFile: FileUploadState = {
        ...fileState,
        status: 'error',
        error: handled.message,
      };
      
      setFiles(prev => prev.map(f => 
        f.id === fileState.id ? updatedFile : f
      ));
      onError?.(updatedFile);
      toast.error(`Failed to upload ${fileState.file.name}: ${handled.message}`);
    },
  });

  /**
   * Adds files to the upload queue
   */
  const addFiles = useCallback((newFiles: File[] | FileList) => {
    const fileArray = Array.from(newFiles);
    
    // Check max files limit
    const currentFileCount = files.length;
    const availableSlots = maxFiles - currentFileCount;
    
    if (availableSlots <= 0) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const filesToAdd = fileArray.slice(0, availableSlots);
    const validFiles: FileUploadState[] = [];

    filesToAdd.forEach(file => {
      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        toast.error(`${file.name}: ${validation.error}`);
        return;
      }

      // Check for duplicates
      const isDuplicate = files.some(f => 
        f.file.name === file.name && 
        f.file.size === file.size &&
        f.file.lastModified === file.lastModified
      );

      if (isDuplicate) {
        toast.error(`${file.name} is already in the upload queue`);
        return;
      }

      validFiles.push({
        file,
        id: generateFileId(file),
        status: 'idle',
        progress: 0,
      });
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      
      // Auto-start upload if enabled
      if (autoStart) {
        setTimeout(() => {
          validFiles.forEach(fileState => {
            uploadSingleFile.mutate(fileState);
          });
        }, 100);
      }
    }
  }, [files, maxFiles, validateFile, generateFileId, autoStart, uploadSingleFile]);

  /**
   * Removes a file from the queue
   */
  const removeFile = useCallback((fileId: string) => {
    // Cancel upload if in progress
    const controller = abortControllersRef.current.get(fileId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(fileId);
    }

    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  /**
   * Starts upload for specific files
   */
  const startUpload = useCallback((fileIds?: string[]) => {
    const filesToUpload = fileIds 
      ? files.filter(f => fileIds.includes(f.id) && f.status === 'idle')
      : files.filter(f => f.status === 'idle');

    if (filesToUpload.length === 0) {
      toast.info('No files to upload');
      return;
    }

    setIsUploading(true);
    
    filesToUpload.forEach(fileState => {
      setFiles(prev => prev.map(f => 
        f.id === fileState.id 
          ? { ...f, status: 'uploading' as const }
          : f
      ));
      uploadSingleFile.mutate(fileState);
    });

    // Check completion
    const checkCompletion = () => {
      setTimeout(() => {
        const currentFiles = files.filter(f => 
          fileIds ? fileIds.includes(f.id) : true
        );
        const completed = currentFiles.every(f => 
          f.status === 'success' || f.status === 'error'
        );
        
        if (completed) {
          setIsUploading(false);
          onComplete?.(currentFiles);
        }
      }, 1000);
    };

    checkCompletion();
  }, [files, uploadSingleFile, onComplete]);

  /**
   * Clears all files
   */
  const clearFiles = useCallback(() => {
    // Cancel all uploads
    abortControllersRef.current.forEach(controller => {
      controller.abort();
    });
    abortControllersRef.current.clear();
    
    setFiles([]);
    setIsUploading(false);
  }, []);

  /**
   * Retries failed uploads
   */
  const retryFailedUploads = useCallback(() => {
    const failedFiles = files.filter(f => f.status === 'error');
    
    if (failedFiles.length === 0) {
      toast.info('No failed uploads to retry');
      return;
    }

    failedFiles.forEach(fileState => {
      const resetFile = {
        ...fileState,
        status: 'idle' as const,
        progress: 0,
        error: undefined,
      };
      
      setFiles(prev => prev.map(f => 
        f.id === fileState.id ? resetFile : f
      ));
      
      if (autoStart) {
        uploadSingleFile.mutate(resetFile);
      }
    });
  }, [files, autoStart, uploadSingleFile]);

  /**
   * Drag and drop handlers
   */
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragState(prev => ({ ...prev, isDragging: true }));
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragState(prev => ({ ...prev, isDragging: false, isOver: false }));
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragState(prev => ({ ...prev, isOver: true }));
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragState({ isDragging: false, isOver: false });
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  /**
   * File input change handler
   */
  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    // Clear input to allow re-selecting the same file
    e.target.value = '';
  }, [addFiles]);

  // Computed values
  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'success' || f.status === 'error').length;
  const successfulUploads = files.filter(f => f.status === 'success').length;
  const failedUploads = files.filter(f => f.status === 'error').length;
  const uploadingFiles = files.filter(f => f.status === 'uploading').length;
  const overallProgress = totalFiles > 0 
    ? Math.round((completedFiles / totalFiles) * 100) 
    : 0;

  return {
    // State
    files,
    dragState,
    isUploading: isUploading || uploadingFiles > 0,
    
    // Statistics
    totalFiles,
    completedFiles,
    successfulUploads,
    failedUploads,
    uploadingFiles,
    overallProgress,
    
    // Actions
    addFiles,
    removeFile,
    startUpload,
    clearFiles,
    retryFailedUploads,
    
    // Drag and drop handlers
    dragHandlers: {
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
    },
    
    // File input handler
    onFileInputChange,
    
    // Utility functions
    getFileById: (id: string) => files.find(f => f.id === id),
    getFilesByStatus: (status: UploadStatus) => files.filter(f => f.status === status),
    
    // Upload mutation state
    isUploading: uploadSingleFile.isPending || isUploading,
    uploadError: uploadSingleFile.error,
  };
}

/**
 * Simple upload hook for single file uploads
 */
export function useSimpleUpload(options: Omit<UploadOptions, 'maxFiles' | 'autoStart'> = {}) {
  const betterUpload = useBetterUpload({ ...options, maxFiles: 1, autoStart: true });
  
  const uploadFile = useCallback((file: File) => {
    betterUpload.clearFiles();
    betterUpload.addFiles([file]);
  }, [betterUpload]);
  
  const currentFile = betterUpload.files[0] || null;
  
  return {
    file: currentFile,
    uploadFile,
    isUploading: betterUpload.isUploading,
    progress: currentFile?.progress || 0,
    status: currentFile?.status || 'idle',
    error: currentFile?.error,
    result: currentFile?.result,
    mediaRecord: currentFile?.mediaRecord,
    clear: betterUpload.clearFiles,
    retry: betterUpload.retryFailedUploads,
  };
}

/**
 * Hook for drag and drop upload zones
 */
export function useDropZone(options: UploadOptions = {}) {
  const upload = useBetterUpload(options);
  
  return {
    ...upload,
    dropZoneProps: {
      ...upload.dragHandlers,
      className: `
        ${upload.dragState.isDragging ? 'drag-active' : ''}
        ${upload.dragState.isOver ? 'drag-over' : ''}
      `.trim(),
    },
    isDragActive: upload.dragState.isDragging,
    isDragOver: upload.dragState.isOver,
  };
}

export type { UploadOptions, FileUploadState, UploadStatus, DragState };