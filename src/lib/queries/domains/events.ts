/**
 * Events-related query functions
 * Handles all database operations for events management
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/lib/database/types';
import {
  handleQueryResponse,
  handleSingleResponse,
  handleCountResponse,
  buildPaginatedResponse,
  calculateOffset,
  buildOrderBy,
  PaginatedResponse,
  RowType,
  InsertType,
  UpdateType
} from '../base';
import { SupabaseError } from '../errors';

// Types
type Event = RowType<'events'>;
type InsertEvent = InsertType<'events'>;
type UpdateEvent = UpdateType<'events'>;
type EventMedia = RowType<'event_media'>;
type EventAttachment = RowType<'event_attachments'>;
type EventAssociation = RowType<'event_content_associations'>;
type EventOccurrence = RowType<'event_occurrences'>;
type InsertEventOccurrence = InsertType<'event_occurrences'>;
type UpdateEventOccurrence = UpdateType<'event_occurrences'>;

export type { Event, InsertEvent, UpdateEvent, EventMedia, EventAttachment, EventAssociation, EventOccurrence, InsertEventOccurrence, UpdateEventOccurrence };

export type EventStatus = 'draft' | 'published' | 'unpublished';

export interface EventFilters {
  page?: number;
  limit?: number;
  status?: EventStatus;
  upcoming?: boolean; // true = future events, false = past events
  search?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'start_datetime' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export interface EventWithRelations extends Event {
  media?: EventMedia[];
  attachments?: EventAttachment[];
  associations?: EventAssociation[];
  occurrences?: EventOccurrence[];
  featured_image?: EventMedia | null;
}

// =============================================
// QUERY FUNCTIONS
// =============================================

/**
 * Get paginated events with filters
 * Returns events with featured image (or first image as fallback)
 */
export async function getEvents(
  supabase: SupabaseClient<Database>,
  siteId: string,
  filters: EventFilters = {}
): Promise<PaginatedResponse<EventWithRelations>> {
  const {
    page = 1,
    limit = 10,
    status,
    upcoming,
    search,
    startDate,
    endDate,
    sortBy = 'start_datetime',
    sortOrder = 'asc'
  } = filters;

  // Build base query with featured image join
  let countQuery = supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .is('deleted_at', null);

  let dataQuery = supabase
    .from('events')
    .select(`
      *,
      featured_image:event_media!events_featured_image_id_fkey(*),
      occurrences:event_occurrences(*)
    `)
    .eq('site_id', siteId)
    .is('deleted_at', null);

  // Apply filters
  if (status) {
    countQuery = countQuery.eq('status', status);
    dataQuery = dataQuery.eq('status', status);
  }

  if (upcoming !== undefined) {
    const now = new Date().toISOString();
    if (upcoming) {
      countQuery = countQuery.gte('start_datetime', now);
      dataQuery = dataQuery.gte('start_datetime', now);
    } else {
      countQuery = countQuery.lt('start_datetime', now);
      dataQuery = dataQuery.lt('start_datetime', now);
    }
  }

  if (search) {
    const searchPattern = `%${search}%`;
    countQuery = countQuery.or(`title.ilike.${searchPattern},location.ilike.${searchPattern}`);
    dataQuery = dataQuery.or(`title.ilike.${searchPattern},location.ilike.${searchPattern}`);
  }

  if (startDate) {
    countQuery = countQuery.gte('start_datetime', startDate.toISOString());
    dataQuery = dataQuery.gte('start_datetime', startDate.toISOString());
  }

  if (endDate) {
    countQuery = countQuery.lte('start_datetime', endDate.toISOString());
    dataQuery = dataQuery.lte('start_datetime', endDate.toISOString());
  }

  // Get count
  const count = await handleCountResponse(await countQuery);

  // Paginate and sort
  const offset = calculateOffset(page, limit);
  const orderBy = buildOrderBy<Event>(sortBy, sortOrder);

  if (orderBy) {
    dataQuery = dataQuery.order(orderBy.column, { ascending: orderBy.ascending });
  }

  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // Execute
  const data = await handleQueryResponse(await dataQuery);

  // For events without featured_image, fetch the first image as fallback
  const eventsWithFeaturedImage = await Promise.all(
    data.map(async (event) => {
      const typedEvent = event as unknown as EventWithRelations;

      // If no featured image set, get first image by sort_order
      if (!typedEvent.featured_image) {
        const { data: firstImage } = await supabase
          .from('event_media')
          .select('*')
          .eq('event_id', typedEvent.id)
          .is('deleted_at', null)
          .order('sort_order', { ascending: true })
          .limit(1)
          .single();

        typedEvent.featured_image = firstImage || null;
      }

      return typedEvent;
    })
  );

  return buildPaginatedResponse(eventsWithFeaturedImage, count, page, limit);
}

/**
 * Get single event by ID with relations
 * Includes featured image (or first image as fallback)
 */
export async function getEventById(
  supabase: SupabaseClient<Database>,
  siteId: string,
  eventId: string
): Promise<EventWithRelations> {
  const response = await supabase
    .from('events')
    .select(`
      *,
      featured_image:event_media!events_featured_image_id_fkey(*)
    `)
    .eq('site_id', siteId)
    .eq('id', eventId)
    .is('deleted_at', null)
    .single();

  const event = await handleSingleResponse(response) as unknown as EventWithRelations;

  // Fetch relations
  const [media, attachments, associations] = await Promise.all([
    handleQueryResponse(
      await supabase
        .from('event_media')
        .select('*')
        .eq('event_id', eventId)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
    ),
    handleQueryResponse(
      await supabase
        .from('event_attachments')
        .select('*')
        .eq('event_id', eventId)
        .is('deleted_at', null)
    ),
    handleQueryResponse(
      await supabase
        .from('event_content_associations')
        .select('*')
        .eq('event_id', eventId)
    )
  ]);

  // If no featured image, use first image as fallback
  let featuredImage = event.featured_image;
  if (!featuredImage && media.length > 0) {
    featuredImage = media[0];
  }

  return {
    ...event,
    media,
    attachments,
    associations,
    featured_image: featuredImage || null
  };
}

/**
 * Get single event by slug (for public pages)
 * Includes featured image (or first image as fallback) and all future occurrences
 */
export async function getEventBySlug(
  supabase: SupabaseClient<Database>,
  siteId: string,
  slug: string
): Promise<EventWithRelations> {
  const response = await supabase
    .from('events')
    .select(`
      *,
      featured_image:event_media!events_featured_image_id_fkey(*)
    `)
    .eq('site_id', siteId)
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single();

  const event = await handleSingleResponse(response) as unknown as EventWithRelations;

  // Get current time for filtering future occurrences
  const now = new Date().toISOString();

  // Fetch relations (same as getEventById) + future occurrences
  const [media, attachments, associations, occurrences] = await Promise.all([
    handleQueryResponse(
      await supabase
        .from('event_media')
        .select('*')
        .eq('event_id', event.id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
    ),
    handleQueryResponse(
      await supabase
        .from('event_attachments')
        .select('*')
        .eq('event_id', event.id)
        .is('deleted_at', null)
    ),
    handleQueryResponse(
      await supabase
        .from('event_content_associations')
        .select('*')
        .eq('event_id', event.id)
    ),
    handleQueryResponse(
      await supabase
        .from('event_occurrences')
        .select('*')
        .eq('event_id', event.id)
        .gte('start_datetime', now)
        .is('deleted_at', null)
        .order('start_datetime', { ascending: true })
    )
  ]);

  // Map occurrences with inherited location from parent event
  const occurrencesWithLocation = occurrences.map(occurrence => ({
    ...occurrence,
    location: occurrence.location || event.location || null
  }));

  // If no featured image, use first image as fallback
  let featuredImage = event.featured_image;
  if (!featuredImage && media.length > 0) {
    featuredImage = media[0];
  }

  return {
    ...event,
    media,
    attachments,
    associations,
    occurrences: occurrencesWithLocation,
    featured_image: featuredImage || null
  };
}

/**
 * Create new event
 */
export async function createEvent(
  supabase: SupabaseClient<Database>,
  data: InsertEvent
): Promise<Event> {
  const response = await supabase
    .from('events')
    .insert(data)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Update existing event
 */
export async function updateEvent(
  supabase: SupabaseClient<Database>,
  siteId: string,
  eventId: string,
  data: UpdateEvent
): Promise<Event> {
  const response = await supabase
    .from('events')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('site_id', siteId)
    .eq('id', eventId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Soft delete event
 */
export async function deleteEvent(
  supabase: SupabaseClient<Database>,
  siteId: string,
  eventId: string
): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ deleted_at: new Date().toISOString() })
    .eq('site_id', siteId)
    .eq('id', eventId);

  if (error) {
    throw SupabaseError.fromPostgrestError(error);
  }
}

/**
 * Publish event
 */
export async function publishEvent(
  supabase: SupabaseClient<Database>,
  siteId: string,
  eventId: string
): Promise<Event> {
  return updateEvent(supabase, siteId, eventId, {
    status: 'published',
    published_at: new Date().toISOString()
  });
}

/**
 * Unpublish event
 */
export async function unpublishEvent(
  supabase: SupabaseClient<Database>,
  siteId: string,
  eventId: string
): Promise<Event> {
  return updateEvent(supabase, siteId, eventId, {
    status: 'unpublished'
  });
}

/**
 * Generate unique slug for event
 */
export async function generateUniqueEventSlug(
  supabase: SupabaseClient<Database>,
  title: string,
  siteId: string,
  excludeId?: string
): Promise<string> {
  // Generate base slug
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length

  // If empty after processing, use a fallback
  if (!baseSlug) {
    return `event-${Date.now()}`;
  }

  // Check for conflicts
  let query = supabase
    .from('events')
    .select('slug')
    .eq('site_id', siteId)
    .is('deleted_at', null)
    .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking slug uniqueness:', error);
    return `${baseSlug}-${Date.now()}`;
  }

  if (!data || data.length === 0) return baseSlug;

  // Find next available number suffix
  const existingSlugs = new Set(data.map(item => item.slug));
  if (!existingSlugs.has(baseSlug)) return baseSlug;

  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  while (existingSlugs.has(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;

    // Safety check to prevent infinite loops
    if (counter > 1000) {
      return `${baseSlug}-${Date.now()}`;
    }
  }

  return uniqueSlug;
}

/**
 * Duplicate event (for +7 days, +30 days functionality)
 */
export async function duplicateEvent(
  supabase: SupabaseClient<Database>,
  siteId: string,
  eventId: string,
  daysOffset: number
): Promise<Event> {
  // Get original event
  const original = await getEventById(supabase, siteId, eventId);

  // Calculate new dates
  const newStartDate = new Date(original.start_datetime);
  newStartDate.setDate(newStartDate.getDate() + daysOffset);

  let newEndDate: string | undefined;
  if (original.end_datetime) {
    const endDate = new Date(original.end_datetime);
    endDate.setDate(endDate.getDate() + daysOffset);
    newEndDate = endDate.toISOString();
  }

  // Generate unique slug
  const newSlug = await generateUniqueEventSlug(
    supabase,
    `${original.title} ${newStartDate.toLocaleDateString()}`,
    siteId
  );

  // Create duplicate - exclude computed/managed fields
  const duplicatedEvent = await createEvent(supabase, {
    site_id: siteId,
    title: original.title,
    subtitle: original.subtitle,
    slug: newSlug,
    description: original.description,
    start_datetime: newStartDate.toISOString(),
    end_datetime: newEndDate ?? null,
    timezone: original.timezone,
    is_all_day: original.is_all_day,
    location: original.location,
    status: 'draft', // Always create as draft
    meta_data: original.meta_data,
    published_at: null
  });

  // Copy media
  if (original.media && original.media.length > 0) {
    await Promise.all(
      original.media.map(media =>
        supabase.from('event_media').insert({
          event_id: duplicatedEvent.id,
          media_type: media.media_type,
          media_url: media.media_url,
          thumbnail_url: media.thumbnail_url,
          alt_text: media.alt_text,
          caption: media.caption,
          sort_order: media.sort_order
        })
      )
    );
  }

  // Copy attachments
  if (original.attachments && original.attachments.length > 0) {
    await Promise.all(
      original.attachments.map(attachment =>
        supabase.from('event_attachments').insert({
          event_id: duplicatedEvent.id,
          file_name: attachment.file_name,
          file_url: attachment.file_url,
          file_size_bytes: attachment.file_size_bytes,
          mime_type: attachment.mime_type
        })
      )
    );
  }

  return duplicatedEvent;
}

/**
 * Get event statistics for dashboard
 */
export async function getEventStats(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<{
  total: number;
  upcoming: number;
  past: number;
  published: number;
  draft: number;
}> {
  const now = new Date().toISOString();

  const [total, upcoming, past, published, draft] = await Promise.all([
    handleCountResponse(
      await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .is('deleted_at', null)
    ),
    handleCountResponse(
      await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('status', 'published')
        .gte('start_datetime', now)
        .is('deleted_at', null)
    ),
    handleCountResponse(
      await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('status', 'published')
        .lt('start_datetime', now)
        .is('deleted_at', null)
    ),
    handleCountResponse(
      await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('status', 'published')
        .is('deleted_at', null)
    ),
    handleCountResponse(
      await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('status', 'draft')
        .is('deleted_at', null)
    )
  ]);

  return { total, upcoming, past, published, draft };
}

/**
 * Check if a site has any published events
 * Optimized query that only checks for existence (limit 1)
 */
export async function hasPublishedEvents(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('status', 'published')
    .is('deleted_at', null);

  if (error) {
    console.error('Error checking for published events:', error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Get published events with future occurrences for calendar feeds
 * Returns all published events with their future occurrences
 * Optimized for iCalendar (.ics) generation
 */
export async function getPublishedEventsForCalendar(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<EventWithRelations[]> {
  const now = new Date().toISOString();

  // Get all published events
  const eventsResponse = await supabase
    .from('events')
    .select('*')
    .eq('site_id', siteId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('start_datetime', { ascending: true });

  const events = await handleQueryResponse(eventsResponse);

  // For each event, fetch future occurrences
  const eventsWithOccurrences = await Promise.all(
    events.map(async (event) => {
      const occurrencesResponse = await supabase
        .from('event_occurrences')
        .select('*')
        .eq('event_id', event.id)
        .gte('start_datetime', now)
        .is('deleted_at', null)
        .order('start_datetime', { ascending: true });

      const occurrences = await handleQueryResponse(occurrencesResponse);

      // Map occurrences with inherited location from parent event
      const occurrencesWithLocation = occurrences.map(occurrence => ({
        ...occurrence,
        location: occurrence.location || event.location || null
      }));

      return {
        ...event,
        occurrences: occurrencesWithLocation
      } as EventWithRelations;
    })
  );

  // Filter out events with no future occurrences
  return eventsWithOccurrences.filter(event =>
    event.occurrences && event.occurrences.length > 0
  );
}

// =============================================
// MEDIA FUNCTIONS
// =============================================

export async function addEventMedia(
  supabase: SupabaseClient<Database>,
  eventId: string,
  media: Omit<InsertType<'event_media'>, 'event_id'>
): Promise<EventMedia> {
  const response = await supabase
    .from('event_media')
    .insert({ ...media, event_id: eventId })
    .select()
    .single();

  return handleSingleResponse(response);
}

export async function deleteEventMedia(
  supabase: SupabaseClient<Database>,
  mediaId: string,
  siteId?: string
): Promise<void> {
  // First get the media record to get the URL
  const { data: media, error: fetchError } = await supabase
    .from('event_media')
    .select('media_url, thumbnail_url, event_id')
    .eq('id', mediaId)
    .single();

  if (fetchError) {
    throw SupabaseError.fromPostgrestError(fetchError);
  }

  // Delete the actual file if we have the feature flag enabled
  if (process.env.NEXT_PUBLIC_EVENT_STORAGE_R2 === 'true' && media && siteId) {
    try {
      const { EventStorageAdapter } = await import('@/lib/storage/event-storage');
      const adapter = new EventStorageAdapter({
        siteId,
        eventId: media.event_id,
      });

      // Check if this is a CDN URL (new) or Supabase URL (legacy)
      if (media.media_url && !adapter.isSupabaseUrl(media.media_url)) {
        // Delete from R2
        await adapter.deleteEventFile(media.media_url);
      } else if (media.media_url && adapter.isSupabaseUrl(media.media_url)) {
        // Delete from Supabase Storage (legacy)
        const urlParts = media.media_url.split('/storage/v1/object/public/event-media/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          await supabase.storage.from('event-media').remove([filePath]);
        }
      }

      // Also delete thumbnail if different from main URL
      if (media.thumbnail_url && media.thumbnail_url !== media.media_url) {
        if (!adapter.isSupabaseUrl(media.thumbnail_url)) {
          await adapter.deleteEventFile(media.thumbnail_url);
        } else {
          const thumbParts = media.thumbnail_url.split('/storage/v1/object/public/event-media/');
          if (thumbParts.length === 2) {
            const thumbPath = thumbParts[1];
            await supabase.storage.from('event-media').remove([thumbPath]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete media file from storage:', error);
      // Continue with soft delete even if file deletion fails
    }
  }

  // Soft delete the database record
  const { error } = await supabase
    .from('event_media')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', mediaId);

  if (error) {
    throw SupabaseError.fromPostgrestError(error);
  }
}

export async function reorderEventMedia(
  supabase: SupabaseClient<Database>,
  updates: { id: string; sort_order: number }[]
): Promise<void> {
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase
        .from('event_media')
        .update({ sort_order })
        .eq('id', id)
    )
  );
}

/**
 * Set featured image for an event
 * @param eventId - Event ID
 * @param mediaId - Media ID to set as featured (null to unset)
 */
export async function setEventFeaturedImage(
  supabase: SupabaseClient<Database>,
  siteId: string,
  eventId: string,
  mediaId: string | null
): Promise<Event> {
  // Verify media belongs to this event if mediaId is provided
  if (mediaId) {
    const { data: media, error: mediaError } = await supabase
      .from('event_media')
      .select('event_id')
      .eq('id', mediaId)
      .is('deleted_at', null)
      .single();

    if (mediaError || !media || media.event_id !== eventId) {
      throw new Error('Media not found or does not belong to this event');
    }
  }

  return updateEvent(supabase, siteId, eventId, {
    featured_image_id: mediaId
  });
}

// =============================================
// ATTACHMENT FUNCTIONS
// =============================================

export async function addEventAttachment(
  supabase: SupabaseClient<Database>,
  eventId: string,
  attachment: Omit<InsertType<'event_attachments'>, 'event_id'>
): Promise<EventAttachment> {
  const response = await supabase
    .from('event_attachments')
    .insert({ ...attachment, event_id: eventId })
    .select()
    .single();

  return handleSingleResponse(response);
}

export async function deleteEventAttachment(
  supabase: SupabaseClient<Database>,
  attachmentId: string,
  siteId?: string
): Promise<void> {
  // First get the attachment record to get the URL
  const { data: attachment, error: fetchError } = await supabase
    .from('event_attachments')
    .select('file_url, event_id')
    .eq('id', attachmentId)
    .single();

  if (fetchError) {
    throw SupabaseError.fromPostgrestError(fetchError);
  }

  // Delete the actual file if we have the feature flag enabled
  if (process.env.NEXT_PUBLIC_EVENT_STORAGE_R2 === 'true' && attachment && siteId) {
    try {
      const { EventStorageAdapter } = await import('@/lib/storage/event-storage');
      const adapter = new EventStorageAdapter({
        siteId,
        eventId: attachment.event_id,
      });

      // Check if this is a CDN URL (new) or Supabase URL (legacy)
      if (attachment.file_url && !adapter.isSupabaseUrl(attachment.file_url)) {
        // Delete from R2
        await adapter.deleteEventFile(attachment.file_url);
      } else if (attachment.file_url && adapter.isSupabaseUrl(attachment.file_url)) {
        // Delete from Supabase Storage (legacy)
        const urlParts = attachment.file_url.split('/storage/v1/object/public/event-attachments/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          await supabase.storage.from('event-attachments').remove([filePath]);
        }
      }
    } catch (error) {
      console.error('Failed to delete attachment file from storage:', error);
      // Continue with soft delete even if file deletion fails
    }
  }

  // Soft delete the database record
  const { error } = await supabase
    .from('event_attachments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', attachmentId);

  if (error) {
    throw SupabaseError.fromPostgrestError(error);
  }
}

// =============================================
// ASSOCIATION FUNCTIONS
// =============================================

export async function addEventAssociation(
  supabase: SupabaseClient<Database>,
  eventId: string,
  relatedType: 'page' | 'blog_post',
  relatedId: string
): Promise<EventAssociation> {
  const response = await supabase
    .from('event_content_associations')
    .insert({ event_id: eventId, related_type: relatedType, related_id: relatedId })
    .select()
    .single();

  return handleSingleResponse(response);
}

export async function removeEventAssociation(
  supabase: SupabaseClient<Database>,
  associationId: string
): Promise<void> {
  const { error } = await supabase
    .from('event_content_associations')
    .delete()
    .eq('id', associationId);

  if (error) {
    throw SupabaseError.fromPostgrestError(error);
  }
}

// =============================================
// EVENT OCCURRENCE FUNCTIONS
// =============================================

/**
 * Get all occurrences for an event (ordered by date)
 * Uses the SQL function get_event_occurrences which returns occurrences with inherited location
 */
export async function getEventOccurrences(
  supabase: SupabaseClient<Database>,
  eventId: string
): Promise<EventOccurrence[]> {
  // First get occurrences directly from table to get all fields
  const response = await supabase
    .from('event_occurrences')
    .select('*')
    .eq('event_id', eventId)
    .is('deleted_at', null)
    .order('start_datetime', { ascending: true });

  const occurrences = await handleQueryResponse(response);

  // Get parent event location for inheritance
  const eventResponse = await supabase
    .from('events')
    .select('location')
    .eq('id', eventId)
    .single();

  const event = await handleSingleResponse(eventResponse);

  // Map occurrences with inherited location
  return occurrences.map(occurrence => ({
    ...occurrence,
    location: occurrence.location || event.location || null
  }));
}

/**
 * Add new occurrence to event with offset from base occurrence
 * Uses the SQL function add_event_occurrence
 * @param daysOffset - Number of days to offset from base occurrence (can be negative)
 * @param baseOccurrenceId - Optional base occurrence to copy from (if null, uses first occurrence)
 */
export async function addEventOccurrence(
  supabase: SupabaseClient<Database>,
  eventId: string,
  daysOffset: number,
  baseOccurrenceId?: string | null
): Promise<string> {
  const { data, error } = await supabase
    .rpc('add_event_occurrence', {
      p_event_id: eventId,
      p_days_offset: daysOffset,
      p_base_occurrence_id: baseOccurrenceId || undefined
    });

  if (error) {
    throw SupabaseError.fromPostgrestError(error);
  }

  return data as string; // Returns the new occurrence ID
}

/**
 * Update a single occurrence's all-day status
 */
export async function updateOccurrenceAllDay(
  supabase: SupabaseClient<Database>,
  occurrenceId: string,
  isAllDay: boolean
): Promise<EventOccurrence> {
  const response = await supabase
    .from('event_occurrences')
    .update({
      is_all_day: isAllDay,
      updated_at: new Date().toISOString()
    })
    .eq('id', occurrenceId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Bulk update all-day status for all occurrences of an event
 * Uses the SQL function update_event_occurrences_all_day
 * @returns Number of occurrences updated
 */
export async function updateAllOccurrencesAllDay(
  supabase: SupabaseClient<Database>,
  eventId: string,
  isAllDay: boolean
): Promise<number> {
  const { data, error } = await supabase
    .rpc('update_event_occurrences_all_day', {
      p_event_id: eventId,
      p_is_all_day: isAllDay
    });

  if (error) {
    throw SupabaseError.fromPostgrestError(error);
  }

  return data as number; // Returns count of updated occurrences
}

/**
 * Update an occurrence (dates, location, etc.)
 */
export async function updateEventOccurrence(
  supabase: SupabaseClient<Database>,
  occurrenceId: string,
  data: UpdateEventOccurrence
): Promise<EventOccurrence> {
  const response = await supabase
    .from('event_occurrences')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', occurrenceId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Soft delete an occurrence
 */
export async function deleteEventOccurrence(
  supabase: SupabaseClient<Database>,
  occurrenceId: string
): Promise<void> {
  const { error } = await supabase
    .from('event_occurrences')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', occurrenceId);

  if (error) {
    throw SupabaseError.fromPostgrestError(error);
  }
}

/**
 * Create a new occurrence manually
 */
export async function createEventOccurrence(
  supabase: SupabaseClient<Database>,
  data: InsertEventOccurrence
): Promise<EventOccurrence> {
  const response = await supabase
    .from('event_occurrences')
    .insert(data)
    .select()
    .single();

  return handleSingleResponse(response);
}
