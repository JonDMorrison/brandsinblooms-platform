/**
 * Media file-related query functions
 * Handles all database operations for media files and uploads
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database/types';
import { 
  handleQueryResponse, 
  handleSingleResponse,
  handleCountResponse,
  buildPaginatedResponse,
  calculateOffset,
  filterUndefined,
  buildOrderBy,
  PaginatedResponse,
  QueryParams,
  RowType,
  InsertType,
  UpdateType
} from '../base';
import { SupabaseError } from '../errors';

type MediaFile = RowType<'media_files'>;
type InsertMediaFile = InsertType<'media_files'>;
type UpdateMediaFile = UpdateType<'media_files'>;

export type MediaFileType = 'image' | 'video' | 'document';

export interface MediaFileFilters extends QueryParams<MediaFile> {
  type?: MediaFileType;
  uploadedBy?: string;
}

/**
 * Get paginated media files
 */
export async function getMediaFiles(
  supabase: SupabaseClient<Database>,
  siteId: string,
  filters: MediaFileFilters = {}
): Promise<PaginatedResponse<MediaFile>> {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    type,
    uploadedBy,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = filters;

  // Build base query
  let countQuery = supabase
    .from('media_files')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId);

  let dataQuery = supabase
    .from('media_files')
    .select('*')
    .eq('site_id', siteId);

  // Apply filters
  if (type) {
    countQuery = countQuery.eq('file_type', type);
    dataQuery = dataQuery.eq('file_type', type);
  }

  if (uploadedBy) {
    countQuery = countQuery.eq('uploaded_by', uploadedBy);
    dataQuery = dataQuery.eq('uploaded_by', uploadedBy);
  }

  // Apply search
  if (search) {
    const searchCondition = `file_name.ilike.%${search}%,alt_text.ilike.%${search}%`;
    countQuery = countQuery.or(searchCondition);
    dataQuery = dataQuery.or(searchCondition);
  }

  // Get count
  const count = await handleCountResponse(await countQuery);

  // Apply pagination and sorting
  const offset = calculateOffset(page, limit);
  const orderBy = buildOrderBy<MediaFile>(sortBy, sortOrder);
  
  if (orderBy) {
    dataQuery = dataQuery.order(orderBy.column, { ascending: orderBy.ascending });
  }
  
  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // Execute query
  const data = await handleQueryResponse(await dataQuery);

  return buildPaginatedResponse(data, count, page, limit);
}

/**
 * Get a single media file by ID
 */
export async function getMediaFileById(
  supabase: SupabaseClient<Database>,
  siteId: string,
  mediaId: string
): Promise<MediaFile> {
  const response = await supabase
    .from('media_files')
    .select('*')
    .eq('site_id', siteId)
    .eq('id', mediaId)
    .single();

  return handleSingleResponse(response);
}

/**
 * Create media file record
 */
export async function createMediaFile(
  supabase: SupabaseClient<Database>,
  data: InsertMediaFile
): Promise<MediaFile> {
  const response = await supabase
    .from('media_files')
    .insert(data)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Update media file
 */
export async function updateMediaFile(
  supabase: SupabaseClient<Database>,
  siteId: string,
  mediaId: string,
  data: UpdateMediaFile
): Promise<MediaFile> {
  const filteredData = filterUndefined(data);
  
  const response = await supabase
    .from('media_files')
    .update(filteredData)
    .eq('site_id', siteId)
    .eq('id', mediaId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Delete media file record
 */
export async function deleteMediaFile(
  supabase: SupabaseClient<Database>,
  siteId: string,
  mediaId: string
): Promise<void> {
  const response = await supabase
    .from('media_files')
    .delete()
    .eq('site_id', siteId)
    .eq('id', mediaId);

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFileToStorage(
  supabase: SupabaseClient<Database>,
  siteId: string,
  file: File,
  path?: string
): Promise<{ url: string; path: string }> {
  // Generate unique file name
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = path ? `${path}/${fileName}` : `sites/${siteId}/${fileName}`;

  // Upload to storage
  const { data, error } = await supabase.storage
    .from('media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new SupabaseError(
      'Failed to upload file',
      error.message,
      { error }
    );
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFileFromStorage(
  supabase: SupabaseClient<Database>,
  path: string
): Promise<void> {
  const { error } = await supabase.storage
    .from('media')
    .remove([path]);

  if (error) {
    throw new SupabaseError(
      'Failed to delete file',
      error.message,
      { error }
    );
  }
}

/**
 * Upload file and create media record
 */
export async function uploadMedia(
  supabase: SupabaseClient<Database>,
  siteId: string,
  file: File,
  options?: {
    altText?: string;
    uploadedBy?: string;
    path?: string;
  }
): Promise<MediaFile> {
  // Determine file type
  let fileType: MediaFileType = 'document';
  const mimeType = file.type.toLowerCase();
  
  if (mimeType.startsWith('image/')) {
    fileType = 'image';
  } else if (mimeType.startsWith('video/')) {
    fileType = 'video';
  }

  // Upload file to storage
  const { url, path } = await uploadFileToStorage(
    supabase,
    siteId,
    file,
    options?.path
  );

  // Create media record
  const mediaData: InsertMediaFile = {
    site_id: siteId,
    file_name: file.name,
    file_url: url,
    file_type: fileType,
    file_size_bytes: file.size,
    alt_text: options?.altText,
    uploaded_by: options?.uploadedBy,
  };

  return createMediaFile(supabase, mediaData);
}

/**
 * Delete media file and storage
 */
export async function deleteMediaWithStorage(
  supabase: SupabaseClient<Database>,
  siteId: string,
  mediaId: string
): Promise<void> {
  // Get media file info
  const media = await getMediaFileById(supabase, siteId, mediaId);
  
  // Extract path from URL
  const url = new URL(media.file_url);
  const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/media\/(.*)/);
  
  if (pathMatch && pathMatch[1]) {
    // Delete from storage
    await deleteFileFromStorage(supabase, pathMatch[1]);
  }

  // Delete record
  await deleteMediaFile(supabase, siteId, mediaId);
}

/**
 * Get media statistics
 */
export async function getMediaStats(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<{
  total: number;
  images: number;
  videos: number;
  documents: number;
  totalSize: number;
}> {
  const [
    total,
    images,
    videos,
    documents,
    sizeResult
  ] = await Promise.all([
    supabase
      .from('media_files')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId),
    supabase
      .from('media_files')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('file_type', 'image'),
    supabase
      .from('media_files')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('file_type', 'video'),
    supabase
      .from('media_files')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('file_type', 'document'),
    supabase
      .from('media_files')
      .select('file_size_bytes')
      .eq('site_id', siteId),
  ]);

  // Calculate total size
  const totalSize = (sizeResult.data || [])
    .reduce((sum, file) => sum + (file.file_size_bytes || 0), 0);

  return {
    total: total.count || 0,
    images: images.count || 0,
    videos: videos.count || 0,
    documents: documents.count || 0,
    totalSize,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file type icon
 */
export function getFileTypeIcon(fileType: MediaFileType): string {
  const icons = {
    image: '🖼️',
    video: '🎥',
    document: '📄',
  };
  
  return icons[fileType] || '📎';
}

/**
 * Validate file for upload
 */
export function validateFile(
  file: File,
  options?: {
    maxSize?: number; // in bytes
    allowedTypes?: string[]; // mime types
  }
): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize || 10 * 1024 * 1024; // 10MB default
  const allowedTypes = options?.allowedTypes || [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(maxSize)} limit`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed',
    };
  }

  return { valid: true };
}