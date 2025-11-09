'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/lib/supabase/server';
import {
  updateEvent as updateEventQuery,
  publishEvent as publishEventQuery,
  unpublishEvent as unpublishEventQuery,
  UpdateEvent
} from '@/src/lib/queries/domains/events';

/**
 * Server action to update event with cache revalidation
 * Ensures that event pages display updated data immediately
 */
export async function updateEventWithRevalidation(
  siteId: string,
  eventId: string,
  data: UpdateEvent
) {
  const supabase = await createClient();
  const result = await updateEventQuery(supabase, siteId, eventId, data);

  // Revalidate relevant paths
  revalidatePath('/events', 'page');
  if (result.slug) {
    revalidatePath(`/events/${result.slug}`, 'page');
  }
  revalidatePath('/dashboard/events', 'page');
  revalidatePath('/', 'layout');

  return result;
}

/**
 * Server action to publish event with cache revalidation
 */
export async function publishEventWithRevalidation(
  siteId: string,
  eventId: string
) {
  const supabase = await createClient();
  const result = await publishEventQuery(supabase, siteId, eventId);

  // Revalidate paths to show newly published event
  revalidatePath('/events', 'page');
  if (result.slug) {
    revalidatePath(`/events/${result.slug}`, 'page');
  }
  revalidatePath('/dashboard/events', 'page');

  return result;
}

/**
 * Server action to unpublish event with cache revalidation
 */
export async function unpublishEventWithRevalidation(
  siteId: string,
  eventId: string
) {
  const supabase = await createClient();
  const result = await unpublishEventQuery(supabase, siteId, eventId);

  // Revalidate paths to hide unpublished event
  revalidatePath('/events', 'page');
  revalidatePath('/dashboard/events', 'page');

  return result;
}

/**
 * Revalidate a specific event path
 * Useful for manual cache invalidation
 */
export async function revalidateEventPath(path: string) {
  revalidatePath(path, 'page');
}

/**
 * Revalidate all event-related paths
 * Useful when multiple events are updated or reorganized
 */
export async function revalidateEventPaths() {
  revalidatePath('/events', 'page');
  revalidatePath('/', 'layout');
}
