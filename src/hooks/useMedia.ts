'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queries/keys';
import { 
  getMediaFiles, 
  uploadFile, 
  deleteFile,
  getFileUrl,
  getMediaStats
} from '@/lib/queries/domains/media';
import { useSiteId } from './useSite';
import { supabase } from '@/lib/supabase/client';

// Get all media files
export function useMediaFiles(folder?: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.media(siteId!), { folder }],
    queryFn: () => getMediaFiles(siteId!, folder),
    enabled: !!siteId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Get media statistics
export function useMediaStats() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.media(siteId!), 'stats'],
    queryFn: () => getMediaStats(siteId!),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Upload file mutation
export function useUploadFile() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      file, 
      folder,
      onProgress 
    }: { 
      file: File; 
      folder?: string;
      onProgress?: (progress: number) => void;
    }) => uploadFile(siteId!, file, folder, onProgress),
    onSuccess: (data, variables) => {
      toast.success('File uploaded successfully');
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.media(siteId!), { folder: variables.folder }] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.media(siteId!), 'stats'] 
      });
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

// Delete file mutation
export function useDeleteFile() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      toast.success('File deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.media(siteId!) });
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.media(siteId!), 'stats'] 
      });
    },
    onError: () => {
      toast.error('Failed to delete file');
    },
  });
}

// Get signed URL for private files
export function useFileUrl(path: string | null) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.media(siteId!), 'url', path],
    queryFn: () => getFileUrl(path!),
    enabled: !!siteId && !!path,
    staleTime: 55 * 60 * 1000, // 55 minutes (URLs typically expire after 1 hour)
  });
}

// Hook for handling multiple file uploads
export function useMultipleFileUpload() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      files, 
      folder,
      onProgress 
    }: { 
      files: File[]; 
      folder?: string;
      onProgress?: (fileIndex: number, progress: number) => void;
    }) => {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const result = await uploadFile(
            siteId!, 
            file, 
            folder,
            (progress) => onProgress?.(i, progress)
          );
          results.push({ file: file.name, success: true, data: result });
        } catch (error) {
          results.push({ 
            file: file.name, 
            success: false, 
            error: error instanceof Error ? error.message : 'Upload failed' 
          });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (successful > 0) {
        toast.success(`${successful} file(s) uploaded successfully`);
        queryClient.invalidateQueries({ queryKey: queryKeys.media(siteId!) });
      }
      
      if (failed > 0) {
        toast.error(`${failed} file(s) failed to upload`);
      }
    },
    onError: () => {
      toast.error('Upload process failed');
    },
  });
}

// Hook for drag and drop file handling
export function useFileDrop(onDrop: (files: File[]) => void) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onDrop(files);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  return {
    onDrop: handleDrop,
    onDragOver: handleDragOver,
  };
}