'use client';

import { useState, useMemo } from 'react';
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { supabase } from '@/src/lib/supabase/client';
import { useSiteId } from '@/src/contexts/SiteContext';
import { toast } from 'sonner';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  duplicateEvent,
  getEventStats,
  getEventOccurrences,
  addEventOccurrence,
  updateOccurrenceAllDay,
  updateAllOccurrencesAllDay,
  updateEventOccurrence,
  deleteEventOccurrence,
  createEventOccurrence,
  addEventMedia,
  deleteEventMedia,
  addEventAttachment,
  deleteEventAttachment,
  EventFilters,
  InsertEvent,
  UpdateEvent,
  Event,
  EventOccurrence,
  InsertEventOccurrence,
  UpdateEventOccurrence,
  EventMedia,
  EventAttachment
} from '@/src/lib/queries/domains/events';

// Cache management utilities
const clearEventCaches = (siteId: string) => {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(localStorage);
  const eventKeys = keys.filter(key =>
    key.includes(`event-`) && key.includes(`-${siteId}-`)
  );

  eventKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear cache key:', key, error);
    }
  });
};

const clearSpecificEventCache = (siteId: string, eventId?: string) => {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(localStorage);
  const keysToRemove = eventId
    ? keys.filter(key =>
        key.includes(`event-`) &&
        key.includes(`-${siteId}-`) &&
        (key.includes(`-${eventId}`) || key.includes('list') || key.includes('stats'))
      )
    : keys.filter(key =>
        key.includes(`event-`) && key.includes(`-${siteId}-`)
      );

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear cache key:', key, error);
    }
  });
};

const clearOccurrenceCache = (siteId: string, eventId: string) => {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(localStorage);
  const keysToRemove = keys.filter(key =>
    key.includes(`event-occurrences-`) && key.includes(`-${siteId}-${eventId}`)
  );

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear occurrence cache key:', key, error);
    }
  });
};

/**
 * Fetch paginated events with filters
 */
export function useEvents(filters?: EventFilters) {
  const siteId = useSiteId();

  const memoizedDeps = useMemo(() => [
    siteId,
    JSON.stringify(filters || {})
  ], [siteId, filters]);

  return useSupabaseQuery(
    (signal) => getEvents(supabase, siteId!, filters),
    {
      enabled: !!siteId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      persistKey: `events-list-${siteId}-${JSON.stringify(filters || {})}`,
    },
    memoizedDeps
  );
}

/**
 * Fetch single event by ID
 */
export function useEvent(eventId: string) {
  const siteId = useSiteId();

  return useSupabaseQuery(
    (signal) => getEventById(supabase, siteId!, eventId),
    {
      enabled: !!siteId && !!eventId,
      persistKey: `event-detail-${siteId}-${eventId}`,
    },
    [siteId, eventId]
  );
}

/**
 * Fetch event statistics for dashboard
 */
export function useEventStats() {
  const siteId = useSiteId();

  return useSupabaseQuery(
    (signal) => getEventStats(supabase, siteId!),
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      persistKey: `event-stats-${siteId}`,
    },
    [siteId]
  );
}

/**
 * Create new event
 */
export function useCreateEvent() {
  const siteId = useSiteId();
  const [optimisticEvent, setOptimisticEvent] = useState<Event | null>(null);

  const mutation = useSupabaseMutation<Event, Omit<InsertEvent, 'site_id'>>(
    (data, signal) => createEvent(supabase, { ...data, site_id: siteId! }),
    {
      showSuccessToast: 'Event created successfully',
      optimisticUpdate: (newEvent) => {
        // Store optimistic event for UI updates
        const optimistic = {
          ...newEvent,
          id: crypto.randomUUID(),
          site_id: siteId!,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          created_by: null,
          updated_by: null
        } as Event;

        setOptimisticEvent(optimistic);
      },
      rollbackOnError: () => {
        setOptimisticEvent(null);
      },
      onSuccess: () => {
        setOptimisticEvent(null);
        clearEventCaches(siteId!);
      },
      onError: () => {
        setOptimisticEvent(null);
      }
    }
  );

  return {
    ...mutation,
    optimisticEvent
  };
}

/**
 * Update existing event
 */
export function useUpdateEvent() {
  const siteId = useSiteId();
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, Partial<Event>>>({});

  const mutation = useSupabaseMutation<Event, UpdateEvent & { id: string }>(
    ({ id, ...data }, signal) => updateEvent(supabase, siteId!, id, data),
    {
      showSuccessToast: 'Event updated successfully',
      optimisticUpdate: ({ id, ...updates }) => {
        setOptimisticUpdates(prev => ({
          ...prev,
          [id]: {
            ...updates,
            updated_at: new Date().toISOString(),
          }
        }));
      },
      rollbackOnError: () => {
        setOptimisticUpdates({});
      },
      onSuccess: (data, variables) => {
        setOptimisticUpdates(prev => {
          const { [variables.id]: removed, ...rest } = prev;
          return rest;
        });
        clearSpecificEventCache(siteId!, variables.id);
      },
      onError: (error, variables) => {
        setOptimisticUpdates(prev => {
          const { [variables.id]: removed, ...rest } = prev;
          return rest;
        });
      }
    }
  );

  return {
    ...mutation,
    optimisticUpdates
  };
}

/**
 * Delete event
 */
export function useDeleteEvent() {
  const siteId = useSiteId();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const mutation = useSupabaseMutation<void, string>(
    (id, signal) => deleteEvent(supabase, siteId!, id),
    {
      showSuccessToast: 'Event deleted successfully',
      optimisticUpdate: (eventId) => {
        setDeletingIds(prev => new Set([...prev, eventId]));
      },
      rollbackOnError: () => {
        setDeletingIds(new Set());
      },
      onSuccess: (data, eventId) => {
        setDeletingIds(prev => {
          const updated = new Set(prev);
          updated.delete(eventId);
          return updated;
        });
        clearSpecificEventCache(siteId!, eventId);
      },
      onError: (error, eventId) => {
        setDeletingIds(prev => {
          const updated = new Set(prev);
          updated.delete(eventId);
          return updated;
        });
      }
    }
  );

  return {
    ...mutation,
    deletingIds
  };
}

/**
 * Publish event
 */
export function usePublishEvent() {
  const siteId = useSiteId();

  return useSupabaseMutation<Event, string>(
    (id, signal) => publishEvent(supabase, siteId!, id),
    {
      showSuccessToast: 'Event published successfully',
      onSuccess: (data, eventId) => {
        clearSpecificEventCache(siteId!, eventId);
      }
    }
  );
}

/**
 * Unpublish event
 */
export function useUnpublishEvent() {
  const siteId = useSiteId();

  return useSupabaseMutation<Event, string>(
    (id, signal) => unpublishEvent(supabase, siteId!, id),
    {
      showSuccessToast: 'Event unpublished successfully',
      onSuccess: (data, eventId) => {
        clearSpecificEventCache(siteId!, eventId);
      }
    }
  );
}

/**
 * Duplicate event with date offset
 */
export function useDuplicateEvent() {
  const siteId = useSiteId();

  return useSupabaseMutation<Event, { id: string; daysOffset: number }>(
    ({ id, daysOffset }, signal) => duplicateEvent(supabase, siteId!, id, daysOffset),
    {
      showSuccessToast: 'Event duplicated successfully',
      onSuccess: () => {
        clearEventCaches(siteId!);
      }
    }
  );
}

// =============================================
// EVENT OCCURRENCE HOOKS
// =============================================

/**
 * Fetch all occurrences for an event
 */
export function useEventOccurrences(eventId: string) {
  const siteId = useSiteId();

  return useSupabaseQuery(
    (signal) => getEventOccurrences(supabase, eventId),
    {
      enabled: !!siteId && !!eventId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      persistKey: `event-occurrences-${siteId}-${eventId}`,
    },
    [siteId, eventId]
  );
}

/**
 * Add new occurrence to event with date offset
 */
export function useAddOccurrence() {
  const siteId = useSiteId();

  return useSupabaseMutation<string, { eventId: string; daysOffset: number; baseOccurrenceId?: string }>(
    ({ eventId, daysOffset, baseOccurrenceId }, signal) =>
      addEventOccurrence(supabase, eventId, daysOffset, baseOccurrenceId),
    {
      showSuccessToast: 'Occurrence added successfully',
      onSuccess: (newOccurrenceId, variables) => {
        clearOccurrenceCache(siteId!, variables.eventId);
        clearSpecificEventCache(siteId!, variables.eventId);
      }
    }
  );
}

/**
 * Update all-day status for a single occurrence
 */
export function useUpdateOccurrenceAllDay() {
  const siteId = useSiteId();

  return useSupabaseMutation<EventOccurrence, { occurrenceId: string; isAllDay: boolean; eventId: string }>(
    ({ occurrenceId, isAllDay }, signal) =>
      updateOccurrenceAllDay(supabase, occurrenceId, isAllDay),
    {
      showSuccessToast: 'Occurrence updated successfully',
      onSuccess: (data, variables) => {
        clearOccurrenceCache(siteId!, variables.eventId);
      }
    }
  );
}

/**
 * Update all-day status for ALL occurrences of an event
 */
export function useUpdateAllDayForAll() {
  const siteId = useSiteId();

  return useSupabaseMutation<number, { eventId: string; isAllDay: boolean }>(
    ({ eventId, isAllDay }, signal) =>
      updateAllOccurrencesAllDay(supabase, eventId, isAllDay),
    {
      showSuccessToast: true,
      onSuccess: (count, variables) => {
        toast.success(`Updated ${count} occurrence(s) successfully`);
        clearOccurrenceCache(siteId!, variables.eventId);
        clearSpecificEventCache(siteId!, variables.eventId);
      }
    }
  );
}

/**
 * Update an occurrence (dates, location, etc.)
 */
export function useUpdateOccurrence() {
  const siteId = useSiteId();

  return useSupabaseMutation<EventOccurrence, UpdateEventOccurrence & { id: string; eventId: string }>(
    ({ id, eventId, ...data }, signal) =>
      updateEventOccurrence(supabase, id, data),
    {
      showSuccessToast: 'Occurrence updated successfully',
      onSuccess: (data, variables) => {
        clearOccurrenceCache(siteId!, variables.eventId);
      }
    }
  );
}

/**
 * Delete an occurrence
 */
export function useDeleteOccurrence() {
  const siteId = useSiteId();

  return useSupabaseMutation<void, { occurrenceId: string; eventId: string }>(
    ({ occurrenceId }, signal) =>
      deleteEventOccurrence(supabase, occurrenceId),
    {
      showSuccessToast: 'Occurrence deleted successfully',
      onSuccess: (data, variables) => {
        clearOccurrenceCache(siteId!, variables.eventId);
        clearSpecificEventCache(siteId!, variables.eventId);
      }
    }
  );
}

/**
 * Create a new occurrence manually
 */
export function useCreateOccurrence() {
  const siteId = useSiteId();

  return useSupabaseMutation<EventOccurrence, InsertEventOccurrence>(
    (data, signal) =>
      createEventOccurrence(supabase, data),
    {
      showSuccessToast: 'Occurrence created successfully',
      onSuccess: (newOccurrence) => {
        clearOccurrenceCache(siteId!, newOccurrence.event_id);
        clearSpecificEventCache(siteId!, newOccurrence.event_id);
      }
    }
  );
}

// =============================================
// EVENT MEDIA HOOKS
// =============================================

/**
 * Add media to an event
 */
export function useAddEventMedia() {
  const siteId = useSiteId();

  return useSupabaseMutation<
    EventMedia,
    {
      eventId: string;
      media_type: 'image' | 'video';
      media_url: string;
      thumbnail_url?: string | null;
      alt_text?: string | null;
      caption?: string | null;
      sort_order?: number;
    }
  >(
    ({ eventId, ...media }, signal) =>
      addEventMedia(supabase, eventId, media),
    {
      showSuccessToast: 'Media added successfully',
      onSuccess: (media) => {
        clearSpecificEventCache(siteId!, media.event_id);
      }
    }
  );
}

/**
 * Delete event media
 */
export function useDeleteEventMedia() {
  const siteId = useSiteId();

  return useSupabaseMutation<void, { mediaId: string; eventId: string }>(
    ({ mediaId }, signal) =>
      deleteEventMedia(supabase, mediaId, siteId || undefined),
    {
      showSuccessToast: 'Media deleted successfully',
      onSuccess: (_, variables) => {
        clearSpecificEventCache(siteId!, variables.eventId);
      }
    }
  );
}

// =============================================
// EVENT ATTACHMENT HOOKS
// =============================================

/**
 * Add attachment to an event
 */
export function useAddEventAttachment() {
  const siteId = useSiteId();

  return useSupabaseMutation<
    EventAttachment,
    {
      eventId: string;
      file_name: string;
      file_url: string;
      file_size_bytes?: number | null;
      mime_type?: string | null;
    }
  >(
    ({ eventId, ...attachment }, signal) =>
      addEventAttachment(supabase, eventId, attachment),
    {
      showSuccessToast: 'Attachment added successfully',
      onSuccess: (attachment) => {
        clearSpecificEventCache(siteId!, attachment.event_id);
      }
    }
  );
}

/**
 * Delete event attachment
 */
export function useDeleteEventAttachment() {
  const siteId = useSiteId();

  return useSupabaseMutation<void, { attachmentId: string; eventId: string }>(
    ({ attachmentId }, signal) =>
      deleteEventAttachment(supabase, attachmentId, siteId || undefined),
    {
      showSuccessToast: 'Attachment deleted successfully',
      onSuccess: (_, variables) => {
        clearSpecificEventCache(siteId!, variables.eventId);
      }
    }
  );
}
