'use client';

import { toast } from 'sonner';
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { 
  getMediaFiles, 
  uploadMedia, 
  deleteMediaWithStorage,
  getMediaStats
} from '@/lib/queries/domains/media';
import { useSiteId } from '@/src/contexts/SiteContext';
import { supabase } from '@/lib/supabase/client';

// Get all media files
export function useMediaFiles(type?: 'image' | 'video' | 'document') {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    (signal: AbortSignal) => getMediaFiles(supabase, siteId!, { type }),
    {
      enabled: !!siteId,
      staleTime: 60 * 1000, // 1 minute
      persistKey: `media-files-${siteId}-${type || 'all'}`,
    },
    [siteId, type] // Re-fetch when siteId or type changes
  );
}

// Get media statistics
export function useMediaStats() {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    (signal: AbortSignal) => getMediaStats(supabase, siteId!),
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      persistKey: `media-stats-${siteId}`,
    },
    [siteId] // Re-fetch when siteId changes
  );
}

// Upload file mutation
export function useUploadFile() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    ({ 
      file, 
      path,
      onProgress 
    }: { 
      file: File; 
      path?: string;
      onProgress?: (progress: number) => void;
    }, signal: AbortSignal) => uploadMedia(supabase, siteId!, file, { path }),
    {
      showSuccessToast: 'File uploaded successfully',
      onSuccess: () => {
        // Clear local storage cache for media files and stats
        if (typeof window !== 'undefined') {
          Object.keys(localStorage)
            .filter(key => key.startsWith(`media-files-${siteId}`) || key.startsWith(`media-stats-${siteId}`))
            .forEach(key => localStorage.removeItem(key));
        }
      }
    }
  );
}

// Delete file mutation
export function useDeleteFile() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    (mediaId: string, signal: AbortSignal) => deleteMediaWithStorage(supabase, siteId!, mediaId),
    {
      showSuccessToast: 'File deleted successfully',
      onSuccess: () => {
        // Clear local storage cache for media files and stats
        if (typeof window !== 'undefined') {
          Object.keys(localStorage)
            .filter(key => key.startsWith(`media-files-${siteId}`) || key.startsWith(`media-stats-${siteId}`))
            .forEach(key => localStorage.removeItem(key));
        }
      }
    }
  );
}

// Get signed URL for private files
export function useFileUrl(path: string | null) {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal: AbortSignal) => {
      // Get signed URL for private files
      const { data } = await supabase.storage
        .from('media')
        .createSignedUrl(path!, 3600); // 1 hour expiry
      return data?.signedUrl || null;
    },
    {
      enabled: !!siteId && !!path,
      staleTime: 55 * 60 * 1000, // 55 minutes (URLs typically expire after 1 hour)
      persistKey: `file-url-${siteId}-${path}`,
    }
  );
}

// Hook for handling multiple file uploads
export function useMultipleFileUpload() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async ({ 
      files, 
      path,
      onProgress 
    }: { 
      files: File[]; 
      path?: string;
      onProgress?: (fileIndex: number, progress: number) => void;
    }, signal: AbortSignal) => {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if the request was aborted
        if (signal.aborted) {
          throw new Error('Upload cancelled');
        }
        
        try {
          const result = await uploadMedia(
            supabase,
            siteId!, 
            file, 
            {
              path: path
            }
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
    {
      onSuccess: (results) => {
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        if (successful > 0) {
          // Clear local storage cache for media files and stats
          if (typeof window !== 'undefined') {
            Object.keys(localStorage)
              .filter(key => key.startsWith(`media-files-${siteId}`) || key.startsWith(`media-stats-${siteId}`))
              .forEach(key => localStorage.removeItem(key));
          }
        }
      },
      showErrorToast: false, // We handle toasts manually
      onSettled: (results) => {
        if (results) {
          const successful = results.filter(r => r.success).length;
          const failed = results.filter(r => !r.success).length;
          
          if (successful > 0) {
            toast.success(`${successful} file(s) uploaded successfully`);
          }
          
          if (failed > 0) {
            toast.error(`${failed} file(s) failed to upload`);
          }
        }
      }
    }
  );
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