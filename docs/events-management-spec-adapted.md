# Events Management System - Implementation Guide for Brands in Blooms Platform

> **Purpose**: This document adapts the original Events Management specification to the Brands in Blooms platform's specific architecture, tech stack, and coding patterns. Use this as your complete implementation guide.

---

## Table of Contents

1. [Original Requirements Summary](#1-original-requirements-summary)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Database Implementation](#3-database-implementation)
4. [Backend Implementation](#4-backend-implementation)
5. [Admin Interface Implementation](#5-admin-interface-implementation)
6. [Public Frontend Implementation](#6-public-frontend-implementation)
7. [File Structure & Organization](#7-file-structure--organization)
8. [Implementation Checklist](#8-implementation-checklist)

---

## 1. Original Requirements Summary

### Core Features
- **Event CRUD**: Create, read, update, delete events with rich metadata
- **Event Types**: Single events, recurring events (RRule), all-day events
- **Media Management**: Multiple images, video embeds, file attachments
- **Publishing Workflow**: Draft → Published → Unpublished states
- **Calendar Views**: Monthly, weekly, daily calendar interfaces
- **iCalendar Feed**: Subscribable .ics feed for external calendars
- **Event Associations**: Link events to existing content pages and blog posts
- **Date Management**: Quick duplicate (+7 days, +30 days), RRule generation

### Admin Features
- Event dashboard with search/filter/tabs
- Multi-step event creation modal
- Bulk actions (publish, unpublish, delete)
- Drag-and-drop media reordering
- Rich text editor for event descriptions

### Public Features
- Events list page with filtering (upcoming/past)
- Event detail pages with SEO
- Calendar view with navigation
- "Add to Calendar" buttons (Google, Apple, Outlook)
- Calendar subscription link

---

## 2. Tech Stack & Architecture

### Framework & Core
```json
{
  "framework": "Next.js 15.4.5 (App Router)",
  "react": "19.1.1",
  "typescript": "5.8.3 (strict mode)",
  "node": ">=18.0.0"
}
```

### Database & Auth
- **Database**: PostgreSQL via Supabase v2.53.0
- **Auth**: Supabase Auth (not Clerk)
- **ORM**: Supabase client with auto-generated types
- **Real-time**: Supabase Realtime subscriptions

### UI & Styling
- **Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS v4.1.11
- **Icons**: Lucide React v0.535.0
- **Themes**: next-themes v0.4.6

### Forms & Validation
- **Forms**: React Hook Form v7.61.1
- **Validation**: Zod v4.0.14
- **Date Pickers**: shadcn/ui Calendar + date-fns

### State & Data Fetching
- **Custom Hooks**: `useSupabaseQuery`, `useSupabaseMutation`
- **Tables**: TanStack React Table v8.21.3
- **Notifications**: Sonner (toast)

### File Storage
- **Primary**: AWS S3 via `@aws-sdk/client-s3` v3.873.0
- **Fallback**: Supabase Storage
- **Pattern**: Presigned URLs for uploads

### Calendar Libraries
**Recommended additions for Events:**
```bash
pnpm add react-big-calendar date-fns rrule ical-generator
pnpm add -D @types/react-big-calendar
```

- **react-big-calendar**: Calendar UI component
- **rrule**: Recurrence rule parsing/generation
- **ical-generator**: iCalendar (.ics) feed generation
- **date-fns**: Date manipulation (already in project)

---

## 3. Database Implementation

### Migration File

**Create**: `supabase/migrations/YYYYMMDDHHMMSS_add_events_management.sql`

```sql
-- =============================================
-- EVENTS MANAGEMENT TABLES
-- =============================================

-- ---------------------------------------------
-- 1. Main Events Table
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Basic Info
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    slug VARCHAR(255) NOT NULL,
    description TEXT, -- Rich text/HTML body

    -- Date/Time
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'America/New_York' NOT NULL,
    is_all_day BOOLEAN DEFAULT false,

    -- Location
    location VARCHAR(500),

    -- Publishing
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unpublished')),

    -- Metadata (JSONB for flexibility)
    meta_data JSONB DEFAULT '{}',
    -- Example meta_data structure:
    -- {
    --   "seo": { "title": "", "description": "", "keywords": [] },
    --   "rrule": "FREQ=WEEKLY;BYDAY=TU;COUNT=10", (optional - for recurring events)
    --   "custom_fields": {}
    -- }

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    published_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ, -- Soft delete

    -- Constraints
    UNIQUE(site_id, slug),
    CHECK (end_datetime IS NULL OR end_datetime > start_datetime)
);

-- Indexes for Events
CREATE INDEX idx_events_site_status ON public.events(site_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_site_dates ON public.events(site_id, start_datetime DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_upcoming ON public.events(site_id, start_datetime)
    WHERE status = 'published' AND start_datetime > NOW() AND deleted_at IS NULL;
CREATE INDEX idx_events_slug ON public.events(site_id, slug) WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_events_search ON public.events
    USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(location, '')))
    WHERE deleted_at IS NULL;

COMMENT ON TABLE public.events IS 'Event management for multi-tenant sites';
COMMENT ON COLUMN public.events.meta_data IS 'JSONB field for SEO, RRule, and custom event metadata';

-- ---------------------------------------------
-- 2. Event Media Table
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text VARCHAR(255),
    caption VARCHAR(500),
    sort_order INTEGER DEFAULT 0 NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_event_media_event ON public.event_media(event_id, sort_order) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.event_media IS 'Images and videos for events';

-- ---------------------------------------------
-- 3. Event Attachments Table
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_event_attachments_event ON public.event_attachments(event_id, created_at DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.event_attachments IS 'File attachments for events (PDFs, docs, etc.)';

-- ---------------------------------------------
-- 4. Event Associations Table
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

    -- Polymorphic association to content table
    related_type VARCHAR(20) NOT NULL CHECK (related_type IN ('page', 'blog_post')),
    related_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(event_id, related_type, related_id)
);

CREATE INDEX idx_event_associations_event ON public.event_associations(event_id);
CREATE INDEX idx_event_associations_related ON public.event_associations(related_type, related_id);

COMMENT ON TABLE public.event_associations IS 'Link events to pages and blog posts';

-- =============================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_associations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- Events Policies
-- ---------------------------------------------

-- Public: Read published events
CREATE POLICY "public_read_published_events" ON public.events
    FOR SELECT USING (
        status = 'published' AND deleted_at IS NULL
    );

-- Site members: Manage events
CREATE POLICY "site_members_manage_events" ON public.events
    FOR ALL USING (
        site_id IN (
            SELECT site_id
            FROM site_memberships
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- ---------------------------------------------
-- Event Media Policies
-- ---------------------------------------------

-- Public: Read media for published events
CREATE POLICY "public_read_event_media" ON public.event_media
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events
            WHERE status = 'published' AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- Site members: Manage event media
CREATE POLICY "site_members_manage_event_media" ON public.event_media
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events
            WHERE site_id IN (
                SELECT site_id
                FROM site_memberships
                WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
            )
        )
    );

-- ---------------------------------------------
-- Event Attachments Policies
-- ---------------------------------------------

-- Public: Read attachments for published events
CREATE POLICY "public_read_event_attachments" ON public.event_attachments
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events
            WHERE status = 'published' AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- Site members: Manage attachments
CREATE POLICY "site_members_manage_event_attachments" ON public.event_attachments
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events
            WHERE site_id IN (
                SELECT site_id
                FROM site_memberships
                WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
            )
        )
    );

-- ---------------------------------------------
-- Event Associations Policies
-- ---------------------------------------------

-- Public: Read associations for published events
CREATE POLICY "public_read_event_associations" ON public.event_associations
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events
            WHERE status = 'published' AND deleted_at IS NULL
        )
    );

-- Site members: Manage associations
CREATE POLICY "site_members_manage_event_associations" ON public.event_associations
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events
            WHERE site_id IN (
                SELECT site_id
                FROM site_memberships
                WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
            )
        )
    );

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER handle_updated_at_events
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Cascade soft deletes to related tables
CREATE OR REPLACE FUNCTION cascade_event_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Soft-delete related data
    UPDATE event_media SET deleted_at = NEW.deleted_at WHERE event_id = NEW.id AND deleted_at IS NULL;
    UPDATE event_attachments SET deleted_at = NEW.deleted_at WHERE event_id = NEW.id AND deleted_at IS NULL;
  ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    -- Restore related data
    UPDATE event_media SET deleted_at = NULL WHERE event_id = NEW.id;
    UPDATE event_attachments SET deleted_at = NULL WHERE event_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cascade_event_soft_delete
    AFTER UPDATE OF deleted_at ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION cascade_event_soft_delete();

-- Auto-set created_by/updated_by
CREATE OR REPLACE FUNCTION set_event_user_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
    NEW.created_by = OLD.created_by; -- Preserve original creator
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_set_event_user_fields
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION set_event_user_fields();
```

### Type Generation

After creating the migration, regenerate TypeScript types:

```bash
pnpm generate-types
```

This will update `/src/lib/database/types.ts` with:
```typescript
export type Event = Tables<'events'>
export type InsertEvent = TablesInsert<'events'>
export type UpdateEvent = TablesUpdate<'events'>
export type EventMedia = Tables<'event_media'>
export type EventAttachment = Tables<'event_attachments'>
export type EventAssociation = Tables<'event_associations'>
```

---

## 4. Backend Implementation

### 4.1 Database Query Functions

**Create**: `/src/lib/queries/domains/events.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables, TablesInsert, TablesUpdate } from '@/src/lib/database/types'
import {
  handleQueryResponse,
  handleSingleResponse,
  handleCountResponse,
  buildPaginatedResponse,
  PaginatedResponse
} from '../base'
import { SupabaseError } from '../errors'

// Types
export type Event = Tables<'events'>
export type InsertEvent = TablesInsert<'events'>
export type UpdateEvent = TablesUpdate<'events'>
export type EventMedia = Tables<'event_media'>
export type EventAttachment = Tables<'event_attachments'>
export type EventAssociation = Tables<'event_associations'>

export interface EventFilters {
  page?: number
  limit?: number
  status?: 'draft' | 'published' | 'unpublished'
  upcoming?: boolean // true = future events, false = past events
  search?: string
  startDate?: Date
  endDate?: Date
}

export interface EventWithRelations extends Event {
  media?: EventMedia[]
  attachments?: EventAttachment[]
  associations?: EventAssociation[]
}

// =============================================
// QUERY FUNCTIONS
// =============================================

/**
 * Get paginated events with filters
 */
export async function getEvents(
  supabase: SupabaseClient<Database>,
  siteId: string,
  filters: EventFilters = {}
): Promise<PaginatedResponse<Event>> {
  const {
    page = 1,
    limit = 10,
    status,
    upcoming,
    search,
    startDate,
    endDate
  } = filters

  // Build base query
  let countQuery = supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .is('deleted_at', null)

  let dataQuery = supabase
    .from('events')
    .select('*')
    .eq('site_id', siteId)
    .is('deleted_at', null)

  // Apply filters
  if (status) {
    countQuery = countQuery.eq('status', status)
    dataQuery = dataQuery.eq('status', status)
  }

  if (upcoming !== undefined) {
    const now = new Date().toISOString()
    if (upcoming) {
      countQuery = countQuery.gte('start_datetime', now)
      dataQuery = dataQuery.gte('start_datetime', now)
    } else {
      countQuery = countQuery.lt('start_datetime', now)
      dataQuery = dataQuery.lt('start_datetime', now)
    }
  }

  if (search) {
    const searchPattern = `%${search}%`
    countQuery = countQuery.or(`title.ilike.${searchPattern},location.ilike.${searchPattern}`)
    dataQuery = dataQuery.or(`title.ilike.${searchPattern},location.ilike.${searchPattern}`)
  }

  if (startDate) {
    countQuery = countQuery.gte('start_datetime', startDate.toISOString())
    dataQuery = dataQuery.gte('start_datetime', startDate.toISOString())
  }

  if (endDate) {
    countQuery = countQuery.lte('start_datetime', endDate.toISOString())
    dataQuery = dataQuery.lte('start_datetime', endDate.toISOString())
  }

  // Get count
  const count = await handleCountResponse(await countQuery)

  // Paginate and sort
  const offset = (page - 1) * limit
  dataQuery = dataQuery
    .order('start_datetime', { ascending: true })
    .range(offset, offset + limit - 1)

  // Execute
  const data = await handleQueryResponse(await dataQuery)

  return buildPaginatedResponse(data, count, page, limit)
}

/**
 * Get single event by ID with relations
 */
export async function getEventById(
  supabase: SupabaseClient<Database>,
  siteId: string,
  eventId: string
): Promise<EventWithRelations> {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('site_id', siteId)
    .eq('id', eventId)
    .is('deleted_at', null)
    .single()

  if (eventError) throw new SupabaseError(eventError.message)
  if (!event) throw new Error('Event not found')

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
        .from('event_associations')
        .select('*')
        .eq('event_id', eventId)
    )
  ])

  return {
    ...event,
    media,
    attachments,
    associations
  }
}

/**
 * Get single event by slug (for public pages)
 */
export async function getEventBySlug(
  supabase: SupabaseClient<Database>,
  siteId: string,
  slug: string
): Promise<EventWithRelations> {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single()

  if (eventError) throw new SupabaseError(eventError.message)
  if (!event) throw new Error('Event not found')

  // Fetch relations (same as getEventById)
  const [media, attachments, associations] = await Promise.all([
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
        .from('event_associations')
        .select('*')
        .eq('event_id', event.id)
    )
  ])

  return {
    ...event,
    media,
    attachments,
    associations
  }
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
    .single()

  return handleSingleResponse(response)
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
    .update(data)
    .eq('site_id', siteId)
    .eq('id', eventId)
    .select()
    .single()

  return handleSingleResponse(response)
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
    .eq('id', eventId)

  if (error) throw new SupabaseError(error.message)
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
  })
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
  })
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
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100)

  // Check for conflicts
  let query = supabase
    .from('events')
    .select('slug')
    .eq('site_id', siteId)
    .is('deleted_at', null)
    .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query

  if (!data || data.length === 0) return baseSlug

  // Find next available number suffix
  const existingSlugs = new Set(data.map(item => item.slug))
  if (!existingSlugs.has(baseSlug)) return baseSlug

  let counter = 1
  let uniqueSlug = `${baseSlug}-${counter}`
  while (existingSlugs.has(uniqueSlug)) {
    counter++
    uniqueSlug = `${baseSlug}-${counter}`
  }

  return uniqueSlug
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
  const original = await getEventById(supabase, siteId, eventId)

  // Calculate new dates
  const newStartDate = new Date(original.start_datetime)
  newStartDate.setDate(newStartDate.getDate() + daysOffset)

  let newEndDate: string | undefined
  if (original.end_datetime) {
    const endDate = new Date(original.end_datetime)
    endDate.setDate(endDate.getDate() + daysOffset)
    newEndDate = endDate.toISOString()
  }

  // Generate unique slug
  const newSlug = await generateUniqueEventSlug(
    supabase,
    `${original.title} ${newStartDate.toLocaleDateString()}`,
    siteId
  )

  // Create duplicate
  const { site_id, created_by, updated_by, created_at, updated_at, published_at, deleted_at, ...eventData } = original

  const duplicatedEvent = await createEvent(supabase, {
    ...eventData,
    site_id: siteId,
    slug: newSlug,
    start_datetime: newStartDate.toISOString(),
    end_datetime: newEndDate,
    status: 'draft', // Always create as draft
    published_at: null
  })

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
    )
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
    )
  }

  return duplicatedEvent
}

/**
 * Get event statistics for dashboard
 */
export async function getEventStats(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<{
  total: number
  upcoming: number
  past: number
  published: number
  draft: number
}> {
  const now = new Date().toISOString()

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
  ])

  return { total, upcoming, past, published, draft }
}

// =============================================
// MEDIA FUNCTIONS
// =============================================

export async function addEventMedia(
  supabase: SupabaseClient<Database>,
  eventId: string,
  media: Omit<TablesInsert<'event_media'>, 'event_id'>
): Promise<EventMedia> {
  const response = await supabase
    .from('event_media')
    .insert({ ...media, event_id: eventId })
    .select()
    .single()

  return handleSingleResponse(response)
}

export async function deleteEventMedia(
  supabase: SupabaseClient<Database>,
  mediaId: string
): Promise<void> {
  const { error } = await supabase
    .from('event_media')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', mediaId)

  if (error) throw new SupabaseError(error.message)
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
  )
}

// =============================================
// ATTACHMENT FUNCTIONS
// =============================================

export async function addEventAttachment(
  supabase: SupabaseClient<Database>,
  eventId: string,
  attachment: Omit<TablesInsert<'event_attachments'>, 'event_id'>
): Promise<EventAttachment> {
  const response = await supabase
    .from('event_attachments')
    .insert({ ...attachment, event_id: eventId })
    .select()
    .single()

  return handleSingleResponse(response)
}

export async function deleteEventAttachment(
  supabase: SupabaseClient<Database>,
  attachmentId: string
): Promise<void> {
  const { error } = await supabase
    .from('event_attachments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', attachmentId)

  if (error) throw new SupabaseError(error.message)
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
    .from('event_associations')
    .insert({ event_id: eventId, related_type: relatedType, related_id: relatedId })
    .select()
    .single()

  return handleSingleResponse(response)
}

export async function removeEventAssociation(
  supabase: SupabaseClient<Database>,
  associationId: string
): Promise<void> {
  const { error } = await supabase
    .from('event_associations')
    .delete()
    .eq('id', associationId)

  if (error) throw new SupabaseError(error.message)
}
```

### 4.2 Custom Hooks

**Create**: `/src/hooks/useEvents.ts`

```typescript
'use client'

import { useSupabaseQuery } from '@/src/hooks/base/useSupabaseQuery'
import { useSupabaseMutation } from '@/src/hooks/base/useSupabaseMutation'
import { supabase } from '@/src/lib/supabase/client'
import { useSiteId } from '@/src/contexts/SiteContext'
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
  EventFilters,
  InsertEvent,
  UpdateEvent,
  Event
} from '@/src/lib/queries/domains/events'

/**
 * Fetch paginated events with filters
 */
export function useEvents(filters?: EventFilters) {
  const siteId = useSiteId()

  return useSupabaseQuery(
    (signal) => getEvents(supabase, siteId!, filters),
    {
      enabled: !!siteId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      persistKey: `events-list-${siteId}-${JSON.stringify(filters || {})}`,
    },
    [siteId, JSON.stringify(filters || {})]
  )
}

/**
 * Fetch single event by ID
 */
export function useEvent(eventId: string) {
  const siteId = useSiteId()

  return useSupabaseQuery(
    (signal) => getEventById(supabase, siteId!, eventId),
    {
      enabled: !!siteId && !!eventId,
      persistKey: `event-detail-${siteId}-${eventId}`,
    },
    [siteId, eventId]
  )
}

/**
 * Fetch event statistics for dashboard
 */
export function useEventStats() {
  const siteId = useSiteId()

  return useSupabaseQuery(
    (signal) => getEventStats(supabase, siteId!),
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      persistKey: `event-stats-${siteId}`,
    },
    [siteId]
  )
}

/**
 * Create new event
 */
export function useCreateEvent() {
  const siteId = useSiteId()

  return useSupabaseMutation<Event, Omit<InsertEvent, 'site_id'>>(
    (data, signal) => createEvent(supabase, { ...data, site_id: siteId! }),
    {
      showSuccessToast: 'Event created successfully',
      onSuccess: () => {
        // Invalidate caches
        // TODO: Implement cache invalidation
      }
    }
  )
}

/**
 * Update existing event
 */
export function useUpdateEvent() {
  const siteId = useSiteId()

  return useSupabaseMutation<Event, UpdateEvent & { id: string }>(
    ({ id, ...data }, signal) => updateEvent(supabase, siteId!, id, data),
    {
      showSuccessToast: 'Event updated successfully',
    }
  )
}

/**
 * Delete event
 */
export function useDeleteEvent() {
  const siteId = useSiteId()

  return useSupabaseMutation<void, string>(
    (id, signal) => deleteEvent(supabase, siteId!, id),
    {
      showSuccessToast: 'Event deleted successfully',
    }
  )
}

/**
 * Publish event
 */
export function usePublishEvent() {
  const siteId = useSiteId()

  return useSupabaseMutation<Event, string>(
    (id, signal) => publishEvent(supabase, siteId!, id),
    {
      showSuccessToast: 'Event published successfully',
    }
  )
}

/**
 * Unpublish event
 */
export function useUnpublishEvent() {
  const siteId = useSiteId()

  return useSupabaseMutation<Event, string>(
    (id, signal) => unpublishEvent(supabase, siteId!, id),
    {
      showSuccessToast: 'Event unpublished successfully',
    }
  )
}

/**
 * Duplicate event with date offset
 */
export function useDuplicateEvent() {
  const siteId = useSiteId()

  return useSupabaseMutation<Event, { id: string; daysOffset: number }>(
    ({ id, daysOffset }, signal) => duplicateEvent(supabase, siteId!, id, daysOffset),
    {
      showSuccessToast: 'Event duplicated successfully',
    }
  )
}
```

### 4.3 Server Actions

**Create**: `/app/actions/events.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import {
  updateEvent as updateEventQuery,
  publishEvent as publishEventQuery,
  unpublishEvent as unpublishEventQuery,
  UpdateEvent
} from '@/src/lib/queries/domains/events'

export async function updateEventWithRevalidation(
  siteId: string,
  eventId: string,
  data: UpdateEvent
) {
  const supabase = await createClient()
  const result = await updateEventQuery(supabase, siteId, eventId, data)

  // Revalidate event pages
  revalidatePath('/events', 'page')
  revalidatePath(`/events/${result.slug}`, 'page')
  revalidatePath('/dashboard/events', 'page')
  revalidatePath('/', 'layout')

  return result
}

export async function publishEventWithRevalidation(
  siteId: string,
  eventId: string
) {
  const supabase = await createClient()
  const result = await publishEventQuery(supabase, siteId, eventId)

  revalidatePath('/events', 'page')
  revalidatePath(`/events/${result.slug}`, 'page')
  revalidatePath('/dashboard/events', 'page')

  return result
}

export async function unpublishEventWithRevalidation(
  siteId: string,
  eventId: string
) {
  const supabase = await createClient()
  const result = await unpublishEventQuery(supabase, siteId, eventId)

  revalidatePath('/events', 'page')
  revalidatePath('/dashboard/events', 'page')

  return result
}
```

---

## 5. Admin Interface Implementation

### 5.1 Events Dashboard Page

**Create**: `/app/dashboard/events/page.tsx`

```typescript
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Plus, Calendar, Clock, MapPin } from 'lucide-react'
import { DataTable } from '@/src/components/ui/data-table'
import { createEventColumns, type EventItem } from '@/src/components/events/event-columns'
import { useEvents, useEventStats } from '@/src/hooks/useEvents'
import { useSiteId, useSiteContext } from '@/src/contexts/SiteContext'
import { DashboardStats, type DashboardStat } from '@/src/components/DashboardStats'
import { CreateEventModal } from '@/src/components/events/CreateEventModal'
import { Skeleton } from '@/src/components/ui/skeleton'

export default function EventsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const siteId = useSiteId()
  const { loading: siteLoading, currentSite } = useSiteContext()

  // Determine filter based on active tab
  const eventFilter = useMemo(() => {
    const filter: any = { page, limit: pageSize }
    if (activeTab === 'upcoming') filter.upcoming = true
    if (activeTab === 'past') filter.upcoming = false
    return filter
  }, [activeTab, page, pageSize])

  // Fetch events and stats
  const { data: eventResponse, loading: isLoading, error, refresh } = useEvents(eventFilter)
  const { data: eventStats, loading: statsLoading, refresh: refetchStats } = useEventStats()

  // Extract events and pagination
  const events = Array.isArray(eventResponse) ? eventResponse : eventResponse?.data || []
  const paginationMeta = !Array.isArray(eventResponse) && eventResponse ? {
    count: eventResponse.count,
    page: eventResponse.page,
    pageSize: eventResponse.pageSize,
    totalPages: eventResponse.totalPages,
  } : null

  // Transform to EventItem
  const eventItems: EventItem[] = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      event_date: new Date(event.start_datetime),
      location: event.location || undefined,
      status: event.status as 'draft' | 'published' | 'unpublished',
      is_all_day: event.is_all_day || false,
    }))
  }, [events])

  // Dashboard stats
  const dashboardStats: DashboardStat[] = useMemo(() => [
    {
      id: '1',
      title: 'Total Events',
      count: eventStats?.total || 0,
      trend: 'All events',
      icon: <Calendar className="h-6 w-6" />,
      color: 'text-blue-600',
      showTrendIcon: false
    },
    {
      id: '2',
      title: 'Upcoming',
      count: eventStats?.upcoming || 0,
      trend: 'Future events',
      icon: <Clock className="h-6 w-6" />,
      color: 'text-green-600',
      showTrendIcon: false
    },
    {
      id: '3',
      title: 'Past Events',
      count: eventStats?.past || 0,
      trend: 'Completed',
      icon: <MapPin className="h-6 w-6" />,
      color: 'text-gray-600',
      showTrendIcon: false
    },
    {
      id: '4',
      title: 'Published',
      count: eventStats?.published || 0,
      trend: 'Live events',
      icon: <Calendar className="h-6 w-6" />,
      color: 'text-purple-600',
      showTrendIcon: false
    }
  ], [eventStats])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setPage(1)
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between fade-in-up">
        <div>
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-gray-500 mt-2">
            Create and manage your events calendar
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="btn-gradient-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Quick Stats */}
      <DashboardStats
        stats={dashboardStats}
        isLoading={statsLoading || siteLoading || !siteId}
        className="fade-in-up"
        animationDelay={0.2}
      />

      {/* Events Library */}
      <Card className="fade-in-up" style={{ animationDelay: '0.7s' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Events Library</CardTitle>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">
                All Events ({eventStats?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({eventStats?.upcoming || 0})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({eventStats?.past || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {(() => {
                const shouldShowLoading = isLoading || siteLoading || !siteId || !currentSite

                if (shouldShowLoading) {
                  return (
                    <div className="w-full space-y-3">
                      <Skeleton className="h-10 w-full" />
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  )
                }

                if (error) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-red-500">Error loading events: {error.message}</p>
                      <Button variant="outline" onClick={() => refresh()} className="mt-4">
                        Try Again
                      </Button>
                    </div>
                  )
                }

                return (
                  <DataTable
                    columns={createEventColumns(refresh, refetchStats)}
                    data={eventItems}
                    searchKey="title"
                    searchPlaceholder="Search events..."
                    manualPagination={true}
                    pageCount={paginationMeta?.totalPages || 0}
                    pageIndex={page - 1}
                    pageSize={pageSize}
                    totalCount={paginationMeta?.count || 0}
                    onPaginationChange={(updater) => {
                      const newPagination = typeof updater === 'function'
                        ? updater({ pageIndex: page - 1, pageSize })
                        : updater
                      setPage(newPagination.pageIndex + 1)
                      setPageSize(newPagination.pageSize)
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                  />
                )
              })()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Event Modal */}
      <CreateEventModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onEventCreated={() => {
          refresh()
          refetchStats()
        }}
      />
    </div>
  )
}
```

### 5.2 Event Table Columns

**Create**: `/src/components/events/event-columns.tsx`

```typescript
'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog'
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, Copy, Eye, EyeOff, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDeleteEvent, usePublishEvent, useUnpublishEvent, useDuplicateEvent } from '@/src/hooks/useEvents'

export interface EventItem {
  id: string
  title: string
  event_date: Date
  location?: string
  status: 'draft' | 'published' | 'unpublished'
  is_all_day: boolean
}

function ActionsCell({
  row,
  onDeleteSuccess
}: {
  row: { original: EventItem }
  onDeleteSuccess?: () => void
}) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { mutate: deleteEvent, loading: isDeleting } = useDeleteEvent()
  const { mutate: publishEvent } = usePublishEvent()
  const { mutate: unpublishEvent } = useUnpublishEvent()
  const { mutate: duplicateEvent } = useDuplicateEvent()

  const handleDelete = async () => {
    try {
      await deleteEvent(row.original.id)
      setShowDeleteDialog(false)
      onDeleteSuccess?.()
    } catch (error) {
      toast.error('Failed to delete event')
    }
  }

  const handlePublishToggle = async () => {
    try {
      if (row.original.status === 'published') {
        await unpublishEvent(row.original.id)
      } else {
        await publishEvent(row.original.id)
      }
      onDeleteSuccess?.()
    } catch (error) {
      toast.error('Failed to update event status')
    }
  }

  const handleDuplicate = async (days: number) => {
    try {
      const newEvent = await duplicateEvent({ id: row.original.id, daysOffset: days })
      toast.success(`Event duplicated ${days} days ahead`)
      router.push(`/dashboard/events/edit/${newEvent.id}`)
    } catch (error) {
      toast.error('Failed to duplicate event')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/dashboard/events/edit/${row.original.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePublishToggle}>
            {row.original.status === 'published' ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Publish
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDuplicate(7)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate +7 Days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDuplicate(30)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate +30 Days
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{row.original.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const createEventColumns = (
  refreshEvents?: () => void,
  refreshStats?: () => void
): ColumnDef<EventItem>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Event Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="font-medium">{row.getValue("title")}</span>
      </div>
    ),
  },
  {
    accessorKey: "event_date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("event_date") as Date
      const isAllDay = row.original.is_all_day
      return (
        <div className="text-sm">
          <div className="font-medium">{format(date, 'PPP')}</div>
          {!isAllDay && (
            <div className="text-gray-500">{format(date, 'p')}</div>
          )}
          {isAllDay && (
            <div className="text-gray-500">All Day</div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      const location = row.getValue("location") as string | undefined
      return location ? (
        <span className="text-sm text-gray-600">{location}</span>
      ) : (
        <span className="text-sm text-gray-400">—</span>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const statusColors = {
        draft: 'bg-gray-100 text-gray-800',
        published: 'bg-green-100 text-green-800',
        unpublished: 'bg-red-100 text-red-800',
      }
      return (
        <Badge className={statusColors[status as keyof typeof statusColors]}>
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <ActionsCell
        row={row}
        onDeleteSuccess={() => {
          refreshEvents?.()
          refreshStats?.()
        }}
      />
    ),
  },
]
```

### 5.3 Create Event Modal

**Create**: `/src/components/events/CreateEventModal.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/src/components/ui/form'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Calendar } from '@/src/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { Switch } from '@/src/components/ui/switch'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useCreateEvent } from '@/src/hooks/useEvents'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { generateUniqueEventSlug } from '@/src/lib/queries/domains/events'
import { supabase } from '@/src/lib/supabase/client'

const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  event_date: z.date({ required_error: 'Event date is required' }),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  is_all_day: z.boolean().default(false),
  timezone: z.string().default('America/New_York'),
  location: z.string().optional(),
})

type EventFormData = z.infer<typeof eventFormSchema>

interface CreateEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventCreated?: () => void
}

export function CreateEventModal({ open, onOpenChange, onEventCreated }: CreateEventModalProps) {
  const router = useRouter()
  const { currentSite } = useSiteContext()
  const [isCreating, setIsCreating] = useState(false)

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      description: '',
      event_date: undefined,
      start_time: '09:00',
      end_time: '17:00',
      is_all_day: false,
      timezone: 'America/New_York',
      location: '',
    }
  })

  const isAllDay = form.watch('is_all_day')

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  const onSubmit = async (data: EventFormData) => {
    if (!currentSite) {
      toast.error('Site not found')
      return
    }

    setIsCreating(true)

    try {
      // Generate unique slug
      const slug = await generateUniqueEventSlug(supabase, data.title, currentSite.id)

      // Build datetime strings
      let start_datetime: string
      let end_datetime: string | undefined

      if (data.is_all_day) {
        // All-day events: set to midnight-to-midnight
        const startDate = new Date(data.event_date)
        startDate.setHours(0, 0, 0, 0)
        start_datetime = startDate.toISOString()

        const endDate = new Date(data.event_date)
        endDate.setHours(23, 59, 59, 999)
        end_datetime = endDate.toISOString()
      } else {
        // Timed events
        const startDate = new Date(data.event_date)
        const [startHour, startMinute] = (data.start_time || '09:00').split(':')
        startDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)
        start_datetime = startDate.toISOString()

        if (data.end_time) {
          const endDate = new Date(data.event_date)
          const [endHour, endMinute] = data.end_time.split(':')
          endDate.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)
          end_datetime = endDate.toISOString()
        }
      }

      // Create event
      const { mutate: createEvent } = useCreateEvent()
      const newEvent = await createEvent({
        title: data.title,
        subtitle: data.subtitle || null,
        slug,
        description: data.description || null,
        start_datetime,
        end_datetime,
        is_all_day: data.is_all_day,
        timezone: data.timezone,
        location: data.location || null,
        status: 'draft',
        meta_data: {},
      })

      toast.success('Event created successfully!')
      onOpenChange(false)
      onEventCreated?.()

      // Navigate to editor
      router.push(`/dashboard/events/edit/${newEvent.id}`)
    } catch (error) {
      console.error('Failed to create event:', error)
      toast.error('Failed to create event')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left pb-6 border-b">
          <DialogTitle className="text-2xl font-bold">Create New Event</DialogTitle>
          <DialogDescription>
            Fill in the event details to get started
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Summer Workshop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subtitle */}
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional tagline" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Event details..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* All Day Toggle */}
            <FormField
              control={form.control}
              name="is_all_day"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">All-Day Event</FormLabel>
                    <FormDescription>
                      Event runs the entire day
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Event Date */}
            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Event Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>When will this event take place?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Fields (only if not all-day) */}
            {!isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Hall, 123 Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t">
              <Button
                type="submit"
                disabled={isCreating}
                className="btn-gradient-primary"
              >
                {isCreating ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 6. Public Frontend Implementation

### 6.1 Events List Page

**Create**: `/app/[...slug]/components/EventsListPage.tsx`

```typescript
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { getSiteHeaders } from '../utils/routing'
import { getEvents } from '@/src/lib/queries/domains/events'
import { createClient } from '@/src/lib/supabase/server'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { format } from 'date-fns'

export async function EventsListPage() {
  const { siteId } = await getSiteHeaders()
  const supabase = await createClient()

  // Fetch published upcoming events
  const { data: upcomingEvents } = await getEvents(supabase, siteId, {
    status: 'published',
    upcoming: true,
    limit: 50
  })

  return (
    <SiteRenderer
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <div className="brand-container py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: 'var(--theme-font-heading)', color: 'var(--theme-text)' }}
            >
              Upcoming Events
            </h1>
            <p
              className="text-lg text-gray-600"
              style={{ fontFamily: 'var(--theme-font-body)' }}
            >
              Join us for these exciting events
            </p>
          </div>

          {/* Events Grid */}
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p
                className="text-lg text-gray-500"
                style={{ fontFamily: 'var(--theme-font-body)' }}
              >
                No upcoming events. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group block"
                >
                  <article className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Featured Image (if exists) */}
                    {event.meta_data?.featured_image && (
                      <div className="aspect-[16/9] relative overflow-hidden">
                        <Image
                          src={event.meta_data.featured_image as string}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="p-6">
                      {/* Date Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {format(new Date(event.start_datetime), 'PPP')}
                        </span>
                        {event.is_all_day && (
                          <Badge variant="outline" className="ml-2">All Day</Badge>
                        )}
                      </div>

                      {/* Title */}
                      <h2
                        className="text-xl font-bold mb-2 group-hover:text-green-600 transition-colors"
                        style={{ fontFamily: 'var(--theme-font-heading)' }}
                      >
                        {event.title}
                      </h2>

                      {/* Subtitle */}
                      {event.subtitle && (
                        <p
                          className="text-gray-600 mb-4"
                          style={{ fontFamily: 'var(--theme-font-body)' }}
                        >
                          {event.subtitle}
                        </p>
                      )}

                      {/* Time */}
                      {!event.is_all_day && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(event.start_datetime), 'p')}</span>
                        </div>
                      )}

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteRenderer>
  )
}
```

### 6.2 Event Detail Page

**Create**: `/app/[...slug]/components/EventDetailPage.tsx`

```typescript
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { getSiteHeaders } from '../utils/routing'
import { getEventBySlug } from '@/src/lib/queries/domains/events'
import { createClient } from '@/src/lib/supabase/server'
import { Calendar, MapPin, Clock, Download, ArrowLeft } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { format } from 'date-fns'

interface EventDetailPageProps {
  slug: string
}

export async function EventDetailPage({ slug }: EventDetailPageProps) {
  const { siteId } = await getSiteHeaders()
  const supabase = await createClient()

  // Fetch event
  let event
  try {
    event = await getEventBySlug(supabase, siteId, slug)
  } catch {
    notFound()
  }

  return (
    <SiteRenderer
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <div className="brand-container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/events"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>

          {/* Event Header */}
          <header className="mb-8">
            {/* Date/Time */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span
                  className="text-lg font-medium"
                  style={{ fontFamily: 'var(--theme-font-body)' }}
                >
                  {format(new Date(event.start_datetime), 'PPP')}
                </span>
              </div>

              {!event.is_all_day && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span
                    className="text-lg"
                    style={{ fontFamily: 'var(--theme-font-body)' }}
                  >
                    {format(new Date(event.start_datetime), 'p')}
                    {event.end_datetime && ` - ${format(new Date(event.end_datetime), 'p')}`}
                  </span>
                </div>
              )}

              {event.is_all_day && (
                <Badge variant="outline">All Day Event</Badge>
              )}
            </div>

            {/* Title */}
            <h1
              className="text-4xl font-bold mb-4"
              style={{
                fontFamily: 'var(--theme-font-heading)',
                color: 'var(--theme-text)'
              }}
            >
              {event.title}
            </h1>

            {/* Subtitle */}
            {event.subtitle && (
              <p
                className="text-xl text-gray-600 mb-4"
                style={{ fontFamily: 'var(--theme-font-body)' }}
              >
                {event.subtitle}
              </p>
            )}

            {/* Location */}
            {event.location && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-5 w-5" />
                <span
                  className="text-lg"
                  style={{ fontFamily: 'var(--theme-font-body)' }}
                >
                  {event.location}
                </span>
              </div>
            )}
          </header>

          {/* Featured Media */}
          {event.media && event.media.length > 0 && (
            <div className="mb-8">
              <div className="aspect-[16/9] relative rounded-lg overflow-hidden">
                <Image
                  src={event.media[0].media_url}
                  alt={event.media[0].alt_text || event.title}
                  fill
                  className="object-cover"
                />
              </div>
              {event.media[0].caption && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  {event.media[0].caption}
                </p>
              )}
            </div>
          )}

          {/* Event Description */}
          {event.description && (
            <div
              className="prose prose-lg max-w-none mb-8"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'var(--theme-text)'
              }}
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          )}

          {/* Additional Images Gallery */}
          {event.media && event.media.length > 1 && (
            <div className="mb-8">
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'var(--theme-font-heading)' }}
              >
                Gallery
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {event.media.slice(1).map((media, idx) => (
                  <div key={media.id} className="aspect-square relative rounded-lg overflow-hidden">
                    <Image
                      src={media.media_url}
                      alt={media.alt_text || `${event.title} image ${idx + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Attachments */}
          {event.attachments && event.attachments.length > 0 && (
            <div className="mb-8">
              <h2
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'var(--theme-font-heading)' }}
              >
                Downloads
              </h2>
              <div className="space-y-2">
                {event.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.file_url}
                    download
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">{attachment.file_name}</div>
                      {attachment.file_size_bytes && (
                        <div className="text-sm text-gray-500">
                          {(attachment.file_size_bytes / 1024).toFixed(0)} KB
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Add to Calendar Button (TODO: Implement .ics generation) */}
          <div className="mt-12 pt-8 border-t">
            <Button className="btn-gradient-primary">
              <Calendar className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
          </div>
        </div>
      </div>
    </SiteRenderer>
  )
}
```

### 6.3 Update Dynamic Route Handler

**Modify**: `/app/[...slug]/page.tsx`

Add event routing logic to the existing dynamic route handler:

```typescript
// In the existing page.tsx, add this to the route resolution logic:

// Check if slug is 'events'
if (slug.length === 1 && slug[0] === 'events') {
  const { EventsListPage } = await import('./components/EventsListPage')
  return <EventsListPage />
}

// Check if slug starts with 'events/' (event detail page)
if (slug.length === 2 && slug[0] === 'events') {
  const eventSlug = slug[1]
  const { EventDetailPage } = await import('./components/EventDetailPage')
  return <EventDetailPage slug={eventSlug} />
}
```

---

## 7. File Structure & Organization

After implementation, your file structure should include:

```
/Users/bradley/Projects/clustera/repos/client-brands-in-blooms-platform/
│
├── supabase/
│   └── migrations/
│       └── YYYYMMDDHHMMSS_add_events_management.sql
│
├── app/
│   ├── dashboard/
│   │   └── events/
│   │       ├── page.tsx                          # Events dashboard
│   │       └── edit/
│   │           └── [id]/
│   │               └── page.tsx                  # Event editor (TODO)
│   │
│   ├── [...slug]/
│   │   ├── page.tsx                              # Updated with event routes
│   │   └── components/
│   │       ├── EventsListPage.tsx                # Public events list
│   │       └── EventDetailPage.tsx               # Public event detail
│   │
│   └── actions/
│       └── events.ts                             # Server actions
│
├── src/
│   ├── components/
│   │   └── events/
│   │       ├── CreateEventModal.tsx
│   │       ├── event-columns.tsx
│   │       └── EventEditor.tsx                   # TODO: Rich editor
│   │
│   ├── hooks/
│   │   └── useEvents.ts
│   │
│   └── lib/
│       ├── database/
│       │   └── types.ts                          # Auto-generated (includes Events)
│       │
│       └── queries/
│           └── domains/
│               └── events.ts
│
└── docs/
    └── events-management-spec-adapted.md         # This file
```

---

## 8. Implementation Checklist

### Phase 1: Database & Backend (MVP)
- [ ] Create migration file with all 4 tables (events, event_media, event_attachments, event_associations)
- [ ] Run migration: `pnpm supabase db reset`
- [ ] Regenerate types: `pnpm generate-types`
- [ ] Implement `/src/lib/queries/domains/events.ts` with all CRUD functions
- [ ] Implement `/src/hooks/useEvents.ts` with all custom hooks
- [ ] Implement `/app/actions/events.ts` with server actions
- [ ] Test database queries in isolation

### Phase 2: Admin Interface
- [ ] Create `/app/dashboard/events/page.tsx` (events dashboard)
- [ ] Create `/src/components/events/event-columns.tsx` (table columns)
- [ ] Create `/src/components/events/CreateEventModal.tsx` (create modal)
- [ ] Test: Create event → appears in dashboard → can delete
- [ ] Implement publish/unpublish toggle
- [ ] Implement duplicate (+7, +30 days) functionality
- [ ] Add search/filter functionality

### Phase 3: Event Editor (Advanced)
- [ ] Create `/app/dashboard/events/edit/[id]/page.tsx`
- [ ] Build rich text editor for event description
- [ ] Implement image upload/management UI
- [ ] Implement file attachment upload UI
- [ ] Implement event associations selector
- [ ] Add RRule date generation modal (optional for V1)

### Phase 4: Public Frontend
- [ ] Create `/app/[...slug]/components/EventsListPage.tsx`
- [ ] Create `/app/[...slug]/components/EventDetailPage.tsx`
- [ ] Update `/app/[...slug]/page.tsx` with event route handling
- [ ] Test: Publish event → appears on `/events` → click → detail page loads
- [ ] Implement SEO metadata for event pages
- [ ] Add "Add to Calendar" button (.ics download)

### Phase 5: Calendar View (Advanced)
- [ ] Install `react-big-calendar` and dependencies
- [ ] Create calendar view component
- [ ] Add calendar route to events dashboard
- [ ] Add calendar to public events page (optional)
- [ ] Implement month/week/day view toggles

### Phase 6: iCalendar Feed (Advanced)
- [ ] Install `ical-generator`
- [ ] Create `/app/api/events/calendar.ics/route.ts`
- [ ] Generate .ics feed from published events
- [ ] Add subscription link to events page
- [ ] Test subscription in Apple Calendar, Google Calendar

### Phase 7: Polish & Testing
- [ ] Write unit tests for query functions
- [ ] Write integration tests for event CRUD
- [ ] Test RLS policies (can't access other sites' events)
- [ ] Test soft delete cascade (deleting event deletes media/attachments)
- [ ] Performance testing with 100+ events
- [ ] Mobile responsiveness check
- [ ] Accessibility audit

---

## Key Implementation Notes

### Type Safety
- Always use generated types from `/src/lib/database/types.ts`
- No `any` types - use `unknown` with type guards
- Run `pnpm typecheck` before commits

### Multi-Tenancy
- All queries MUST include `site_id` filter
- Use `useSiteId()` hook in components
- RLS policies enforce isolation at DB level

### Error Handling
- Use `try/catch` with `error: unknown`
- Use `handleError()` utility for consistent error handling
- Show user-friendly messages via `toast`

### Caching & Revalidation
- Use `persistKey` in `useSupabaseQuery` for client-side cache
- Use Server Actions with `revalidatePath()` for server-side invalidation
- Cache keys should include `siteId`

### File Uploads
- Follow existing S3 presigned URL pattern
- Store file URLs in database, not file data
- Validate file types and sizes server-side

### Soft Deletes
- Use `deleted_at` column for soft deletes
- Cascade trigger handles related tables
- Filter `deleted_at IS NULL` in all queries

---

## Next Steps After V1

1. **Event Categories/Tags**: Add taxonomy for event types
2. **Event Registration**: Ticketing/RSVP functionality
3. **Email Notifications**: Reminders for upcoming events
4. **Event Series**: Link recurring events together
5. **Analytics**: Track event views, registrations, calendar subscriptions
6. **Public Submission**: Allow users to submit events for approval
7. **Multi-language Support**: i18n for event content

---

**This document is ready to use as a complete implementation guide. Copy-paste directly to Claude for implementation.**

---

## 9. Featured Image Implementation

### Overview

Events support a featured/primary image that displays on event cards in listing pages. This is implemented using a foreign key relationship from `events.featured_image_id` to `event_media.id`.

### Database Schema

**Migration**: `20251108230000_add_event_featured_image.sql`

```sql
-- Add featured_image_id column to events table
ALTER TABLE public.events
ADD COLUMN featured_image_id UUID REFERENCES public.event_media(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_events_featured_image ON public.events(featured_image_id)
WHERE featured_image_id IS NOT NULL AND deleted_at IS NULL;
```

**Design Choice**: Foreign Key Approach

We chose `featured_image_id` (FK to event_media) over `is_featured` boolean because:

1. **Data Integrity**: FK constraint ensures featured image exists and belongs to the event
2. **Query Performance**: Single JOIN vs filtering with WHERE is_featured = true
3. **Clear Semantics**: The event "owns" the featured image relationship
4. **Simpler Logic**: No need to handle multiple images with is_featured = true

### Fallback Behavior

Events without a manually selected featured image automatically use the first image by `sort_order`:

1. **Primary**: Use `events.featured_image_id` if set
2. **Fallback**: Use first image from `event_media` ordered by `sort_order ASC, created_at ASC`
3. **No Images**: `featured_image = null` (UI shows placeholder)

This ensures backward compatibility and graceful degradation.

### API Changes

**EventWithRelations Type**:
```typescript
export interface EventWithRelations extends Event {
  media?: EventMedia[];
  attachments?: EventAttachment[];
  associations?: EventAssociation[];
  featured_image?: EventMedia | null; // NEW
}
```

**Query Updates**:

All event query functions now include featured image via JOIN:

```typescript
// getEvents(), getEventById(), getEventBySlug()
const dataQuery = supabase
  .from('events')
  .select(`
    *,
    featured_image:event_media!events_featured_image_id_fkey(*)
  `)
```

**Fallback Logic** (in getEvents):
```typescript
const eventsWithFeaturedImage = await Promise.all(
  data.map(async (event) => {
    const typedEvent = event as unknown as EventWithRelations;

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
```

### New Function: setEventFeaturedImage()

```typescript
export async function setEventFeaturedImage(
  supabase: SupabaseClient<Database>,
  siteId: string,
  eventId: string,
  mediaId: string | null
): Promise<Event>
```

**Usage**:
```typescript
// Set featured image
await setEventFeaturedImage(supabase, siteId, eventId, mediaId);

// Unset (will fallback to first image)
await setEventFeaturedImage(supabase, siteId, eventId, null);
```

### Data Migration

The migration automatically sets `featured_image_id` to the first image for all existing events:

```sql
DO $$
DECLARE
    event_record RECORD;
    first_media_id UUID;
BEGIN
    FOR event_record IN
        SELECT DISTINCT e.id
        FROM public.events e
        INNER JOIN public.event_media em ON em.event_id = e.id
        WHERE e.featured_image_id IS NULL
          AND e.deleted_at IS NULL
          AND em.deleted_at IS NULL
    LOOP
        SELECT em.id INTO first_media_id
        FROM public.event_media em
        WHERE em.event_id = event_record.id
          AND em.deleted_at IS NULL
        ORDER BY em.sort_order ASC, em.created_at ASC
        LIMIT 1;

        IF first_media_id IS NOT NULL THEN
            UPDATE public.events
            SET featured_image_id = first_media_id
            WHERE id = event_record.id;
        END IF;
    END LOOP;
END $$;
```

### UI Integration

**Event Cards** (List View):
```typescript
const { data: events } = await getEvents(supabase, siteId, filters);

events.data.forEach(event => {
  const featuredImage = event.featured_image;

  if (featuredImage) {
    return <img src={featuredImage.media_url} alt={featuredImage.alt_text} />;
  } else {
    return <PlaceholderImage />;
  }
});
```

**Event Detail Page**:
```typescript
const event = await getEventById(supabase, siteId, eventId);

// Featured image (for hero)
const featuredImage = event.featured_image;

// All images (for gallery)
const allImages = event.media;
```

### Future: Admin UI for Featured Image Selection

The backend is ready for a UI component:

1. **Image Grid**: Display all event images
2. **Mark as Featured**: Click to set featured image
3. **Visual Indicator**: Badge showing current featured image
4. **Drag to Reorder**: Reorder images, optionally auto-set first as featured

**Example Hook**:
```typescript
export function useSetFeaturedImage() {
  const siteId = useSiteId()

  return useSupabaseMutation<Event, { eventId: string; mediaId: string | null }>(
    ({ eventId, mediaId }, signal) =>
      setEventFeaturedImage(supabase, siteId!, eventId, mediaId),
    {
      showSuccessToast: 'Featured image updated',
    }
  )
}
```

### Performance Considerations

**Before** (N+1 problem):
- Get 10 events: 1 query
- For each event, get first image: 10 queries
- Total: 11 queries

**After** (optimized):
- Get 10 events with featured image JOIN: 1 query
- Fallback queries only for events without featured_image_id: ~0-3 queries
- Total: 1-4 queries

**Index Strategy**:
```sql
CREATE INDEX idx_events_featured_image ON public.events(featured_image_id)
WHERE featured_image_id IS NOT NULL AND deleted_at IS NULL;
```

Partial index only includes events with featured images, saving space while optimizing JOINs.

### Backward Compatibility

- **Existing Events**: Auto-migrated to use first image as featured
- **Events Without Media**: `featured_image = null` (gracefully handled)
- **API Consumers**: New field is optional, no breaking changes
- **Type Safety**: TypeScript requires handling `featured_image?` field

### Testing Checklist

- [ ] Migration runs without errors
- [ ] Existing events have featured_image_id set to first image
- [ ] `getEvents()` includes featured_image in response
- [ ] `getEventById()` includes featured_image in response
- [ ] `getEventBySlug()` includes featured_image in response
- [ ] Fallback works when featured_image_id is null
- [ ] Fallback works when featured_image is deleted
- [ ] `setEventFeaturedImage()` validates media belongs to event
- [ ] `setEventFeaturedImage()` with null unsets featured image
- [ ] Query performance is acceptable with 100+ events
- [ ] Index is used in query plans

---
