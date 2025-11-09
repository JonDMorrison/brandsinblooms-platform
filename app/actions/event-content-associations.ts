'use server';

import { createClient } from '@/src/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { TablesInsert } from '@/lib/database/types';

/**
 * Get all content associations for an event
 */
export async function getEventContentAssociations(eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_content_associations')
    .select('*')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching event content associations:', error);
    throw new Error('Failed to fetch event content associations');
  }

  return data || [];
}

/**
 * Create a new association between an event and content
 */
export async function createEventContentAssociation(
  eventId: string,
  contentId: string,
  siteId: string
) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  const association: TablesInsert<'event_content_associations'> = {
    event_id: eventId,
    content_id: contentId,
    site_id: siteId,
    created_by: user?.id || null,
  };

  const { data, error } = await supabase
    .from('event_content_associations')
    .insert(association)
    .select()
    .single();

  if (error) {
    // Check if it's a unique constraint violation (already exists)
    if (error.code === '23505') {
      return { error: 'Association already exists' };
    }
    console.error('Error creating event content association:', error);
    throw new Error('Failed to create event content association');
  }

  // Revalidate paths
  revalidatePath('/dashboard/events');
  revalidatePath(`/dashboard/events/edit/${eventId}`);

  return { data };
}

/**
 * Remove an association between an event and content
 */
export async function deleteEventContentAssociation(
  eventId: string,
  contentId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('event_content_associations')
    .delete()
    .eq('event_id', eventId)
    .eq('content_id', contentId);

  if (error) {
    console.error('Error deleting event content association:', error);
    throw new Error('Failed to delete event content association');
  }

  // Revalidate paths
  revalidatePath('/dashboard/events');
  revalidatePath(`/dashboard/events/edit/${eventId}`);

  return { success: true };
}

/**
 * Toggle association between an event and content
 */
export async function toggleEventContentAssociation(
  eventId: string,
  contentId: string,
  siteId: string,
  isAssociated: boolean
) {
  if (isAssociated) {
    return deleteEventContentAssociation(eventId, contentId);
  } else {
    return createEventContentAssociation(eventId, contentId, siteId);
  }
}

/**
 * Get all content for a site with their association status for a specific event
 */
export async function getContentWithAssociations(
  siteId: string,
  eventId: string
) {
  const supabase = await createClient();

  // Get all content for the site
  const { data: content, error: contentError } = await supabase
    .from('content')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });

  if (contentError) {
    console.error('Error fetching content:', contentError);
    throw new Error('Failed to fetch content');
  }

  // Get all associations for this event
  const { data: associations, error: assocError } = await supabase
    .from('event_content_associations')
    .select('content_id')
    .eq('event_id', eventId);

  if (assocError) {
    console.error('Error fetching associations:', assocError);
    throw new Error('Failed to fetch associations');
  }

  // Create a set of associated content IDs for quick lookup
  const associatedContentIds = new Set(associations?.map(a => a.content_id) || []);

  // Map content with association status
  const contentWithStatus = (content || []).map(item => ({
    ...item,
    isAssociated: associatedContentIds.has(item.id)
  }));

  return contentWithStatus;
}