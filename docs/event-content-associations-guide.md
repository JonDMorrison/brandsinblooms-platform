# Event-Content Associations Guide

## Overview

The `event_content_associations` table creates a many-to-many relationship between events and content (pages and blog posts). This allows:

- Events to be featured on multiple pages
- Blog posts to reference multiple related events
- Dynamic content discovery and cross-linking
- Site-isolated associations for multi-tenant security

## Database Schema

### Table Structure

```sql
CREATE TABLE public.event_content_associations (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(event_id, content_id)
);
```

### Key Features

1. **Automatic Site Isolation**: The `site_id` is automatically set from the event via trigger
2. **Cross-Site Prevention**: Trigger validates both event and content belong to same site
3. **Cascade Deletion**: Associations are automatically removed when event or content is deleted
4. **Duplicate Prevention**: Unique constraint on (event_id, content_id)
5. **Performance Indexes**: Optimized for common query patterns

## Helper Functions

### 1. Get Content Associated with an Event

```sql
-- Returns all pages/blog posts associated with an event
SELECT * FROM get_event_content('event-uuid-here');
```

**Returns:**
- `content_id`: UUID of the content item
- `content_type`: 'page' or 'blog_post'
- `title`: Content title
- `slug`: Content URL slug
- `is_published`: Publication status
- `published_at`: Publication timestamp
- `association_created_at`: When the association was created

**Use Cases:**
- Display "Related Content" on event detail pages
- Show which blog posts mention an event
- Generate event landing pages with linked resources

### 2. Get Events Associated with Content

```sql
-- Returns all events associated with a page/blog post
SELECT * FROM get_content_events('content-uuid-here');
```

**Returns:**
- `event_id`: UUID of the event
- `title`: Event title
- `slug`: Event URL slug
- `start_datetime`: Event start date/time
- `end_datetime`: Event end date/time
- `status`: 'draft', 'published', or 'unpublished'
- `location`: Event location
- `association_created_at`: When the association was created

**Use Cases:**
- Display "Upcoming Events" on blog posts
- Show event widgets on related pages
- Generate event calendars filtered by content

### 3. Create Association

```sql
-- Create a single association
SELECT create_event_content_association(
    'event-uuid-here',
    'content-uuid-here'
);
```

**Returns:** UUID of the association (existing or newly created)

**Features:**
- Validates event exists
- Validates content exists
- Ensures both belong to same site
- Idempotent (safe to call multiple times)
- Returns existing association if already exists

### 4. Remove Association

```sql
-- Remove a specific association
SELECT remove_event_content_association(
    'event-uuid-here',
    'content-uuid-here'
);
```

**Returns:**
- `true` if association was deleted
- `false` if association didn't exist

### 5. Bulk Create Associations

```sql
-- Associate one event with multiple content items
SELECT * FROM bulk_create_event_content_associations(
    'event-uuid-here',
    ARRAY['content-uuid-1', 'content-uuid-2', 'content-uuid-3']::UUID[]
);
```

**Returns Table:**
- `content_id`: UUID of content item
- `association_id`: UUID of created association (NULL on failure)
- `success`: true/false
- `error_message`: Error details if failed

**Use Cases:**
- Event creation workflow: associate with multiple pages at once
- Bulk import operations
- Admin UI for managing associations

## SQL Query Examples

### Find All Blog Posts Mentioning a Specific Event

```sql
SELECT
    c.id,
    c.title,
    c.slug,
    c.published_at,
    eca.created_at as linked_at
FROM event_content_associations eca
JOIN content c ON c.id = eca.content_id
WHERE eca.event_id = 'event-uuid-here'
AND c.content_type = 'blog_post'
AND c.is_published = true
ORDER BY c.published_at DESC;
```

### Find All Events on a Page (Sorted by Date)

```sql
SELECT
    e.id,
    e.title,
    e.slug,
    e.start_datetime,
    e.end_datetime,
    e.location,
    e.status
FROM event_content_associations eca
JOIN events e ON e.id = eca.event_id
WHERE eca.content_id = 'content-uuid-here'
AND e.deleted_at IS NULL
AND e.status = 'published'
ORDER BY e.start_datetime ASC;
```

### Find Upcoming Events for a Site with Associated Content Count

```sql
SELECT
    e.id,
    e.title,
    e.slug,
    e.start_datetime,
    e.location,
    COUNT(DISTINCT eca.content_id) as linked_content_count,
    ARRAY_AGG(DISTINCT c.title) FILTER (WHERE c.is_published) as published_content_titles
FROM events e
LEFT JOIN event_content_associations eca ON eca.event_id = e.id
LEFT JOIN content c ON c.id = eca.content_id
WHERE e.site_id = 'site-uuid-here'
AND e.status = 'published'
AND e.deleted_at IS NULL
AND e.start_datetime >= NOW()
GROUP BY e.id, e.title, e.slug, e.start_datetime, e.location
ORDER BY e.start_datetime ASC
LIMIT 10;
```

### Find Events Without Any Associated Content

```sql
SELECT
    e.id,
    e.title,
    e.slug,
    e.start_datetime,
    e.status
FROM events e
WHERE e.site_id = 'site-uuid-here'
AND e.deleted_at IS NULL
AND NOT EXISTS (
    SELECT 1
    FROM event_content_associations eca
    WHERE eca.event_id = e.id
)
ORDER BY e.created_at DESC;
```

### Get Content with Most Event Associations (Popular Content)

```sql
SELECT
    c.id,
    c.title,
    c.slug,
    c.content_type,
    COUNT(eca.event_id) as event_count,
    ARRAY_AGG(e.title ORDER BY e.start_datetime) as event_titles
FROM content c
JOIN event_content_associations eca ON eca.content_id = c.id
JOIN events e ON e.id = eca.event_id
WHERE c.site_id = 'site-uuid-here'
AND c.is_published = true
AND e.deleted_at IS NULL
GROUP BY c.id, c.title, c.slug, c.content_type
HAVING COUNT(eca.event_id) >= 2
ORDER BY event_count DESC;
```

## TypeScript Integration

### Define Types

```typescript
// Add to @/lib/database/types.ts or generate from Supabase CLI

export interface EventContentAssociation {
  id: string;
  event_id: string;
  content_id: string;
  site_id: string;
  created_at: string;
  created_by: string | null;
}

export interface EventWithContent {
  id: string;
  title: string;
  slug: string;
  start_datetime: string;
  end_datetime: string | null;
  status: 'draft' | 'published' | 'unpublished';
  location: string | null;
  associated_content: {
    id: string;
    title: string;
    slug: string;
    content_type: 'page' | 'blog_post';
  }[];
}

export interface ContentWithEvents {
  id: string;
  title: string;
  slug: string;
  content_type: 'page' | 'blog_post';
  associated_events: {
    id: string;
    title: string;
    slug: string;
    start_datetime: string;
  }[];
}
```

### API Route Examples

```typescript
// app/api/events/[eventId]/content/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_event_content', { p_event_id: params.eventId });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const supabase = createClient();
  const { content_ids } = await request.json();

  const { data, error } = await supabase
    .rpc('bulk_create_event_content_associations', {
      p_event_id: params.eventId,
      p_content_ids: content_ids
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

```typescript
// app/api/content/[contentId]/events/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { contentId: string } }
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_content_events', { p_content_id: params.contentId });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

### React Hook Examples

```typescript
// hooks/useEventContent.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useEventContent(eventId: string) {
  return useQuery({
    queryKey: ['event-content', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/content`);
      if (!response.ok) throw new Error('Failed to fetch event content');
      return response.json();
    },
  });
}

export function useAddEventContent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentIds: string[]) => {
      const response = await fetch(`/api/events/${eventId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_ids: contentIds }),
      });
      if (!response.ok) throw new Error('Failed to add content associations');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-content', eventId] });
    },
  });
}

export function useRemoveEventContent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const response = await fetch(
        `/api/events/${eventId}/content/${contentId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to remove content association');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-content', eventId] });
    },
  });
}
```

```typescript
// hooks/useContentEvents.ts
import { useQuery } from '@tanstack/react-query';

export function useContentEvents(contentId: string) {
  return useQuery({
    queryKey: ['content-events', contentId],
    queryFn: async () => {
      const response = await fetch(`/api/content/${contentId}/events`);
      if (!response.ok) throw new Error('Failed to fetch content events');
      return response.json();
    },
  });
}
```

## Security & Permissions

### Row Level Security (RLS) Policies

The table has comprehensive RLS policies:

1. **Public Read**: Anyone can view associations for published events
2. **Site Members Read**: Site members can view all associations for their site
3. **Site Editors Insert**: Owners/editors can create associations for their site
4. **Site Editors Delete**: Owners/editors can remove associations for their site
5. **Platform Admins**: Full access across all sites

### Site Isolation

The trigger automatically:
- Sets `site_id` from the event
- Validates content belongs to the same site
- Prevents cross-site associations
- Maintains referential integrity

### User Attribution

The trigger automatically:
- Sets `created_by` to the current user
- Tracks who created each association
- Allows audit trails for compliance

## Performance Considerations

### Indexes

The migration creates these indexes for optimal performance:

1. `idx_event_content_assoc_event`: Find content for an event
2. `idx_event_content_assoc_content`: Find events for content
3. `idx_event_content_assoc_site`: Site-scoped RLS queries
4. `idx_event_content_assoc_site_event`: Composite site + event queries
5. `idx_event_content_assoc_site_content`: Composite site + content queries

### Query Optimization Tips

1. **Always filter by site_id** when possible to leverage indexes
2. **Use helper functions** for common operations (they're optimized)
3. **Batch operations** using `bulk_create_event_content_associations`
4. **Avoid N+1 queries** by joining associations in a single query
5. **Consider pagination** for sites with many events/content

## Common Use Cases

### 1. Event Landing Page

Show all blog posts and resources related to an event:

```typescript
const EventDetailPage = async ({ eventId }: { eventId: string }) => {
  const supabase = createClient();

  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  // Get associated content
  const { data: content } = await supabase
    .rpc('get_event_content', { p_event_id: eventId });

  return (
    <div>
      <h1>{event.title}</h1>

      {content && content.length > 0 && (
        <section>
          <h2>Related Resources</h2>
          <ul>
            {content.map((item) => (
              <li key={item.content_id}>
                <a href={`/${item.slug}`}>{item.title}</a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
```

### 2. Blog Post with Related Events

Show upcoming events mentioned in a blog post:

```typescript
const BlogPostPage = async ({ slug }: { slug: string }) => {
  const supabase = createClient();

  // Get blog post
  const { data: post } = await supabase
    .from('content')
    .select('*')
    .eq('slug', slug)
    .eq('content_type', 'blog_post')
    .single();

  // Get associated events
  const { data: events } = await supabase
    .rpc('get_content_events', { p_content_id: post.id })
    .gte('start_datetime', new Date().toISOString())
    .order('start_datetime', { ascending: true });

  return (
    <article>
      <h1>{post.title}</h1>
      {/* Blog content */}

      {events && events.length > 0 && (
        <aside>
          <h3>Related Upcoming Events</h3>
          {events.map((event) => (
            <EventCard key={event.event_id} event={event} />
          ))}
        </aside>
      )}
    </article>
  );
};
```

### 3. Admin UI for Managing Associations

```typescript
'use client';

import { useEventContent, useAddEventContent, useRemoveEventContent } from '@/hooks/useEventContent';

export function EventContentManager({ eventId }: { eventId: string }) {
  const { data: associatedContent } = useEventContent(eventId);
  const addContent = useAddEventContent(eventId);
  const removeContent = useRemoveEventContent(eventId);

  const handleAddContent = (contentIds: string[]) => {
    addContent.mutate(contentIds);
  };

  const handleRemoveContent = (contentId: string) => {
    removeContent.mutate(contentId);
  };

  return (
    <div>
      <h2>Associated Content</h2>
      <ul>
        {associatedContent?.data?.map((item) => (
          <li key={item.content_id}>
            {item.title}
            <button onClick={() => handleRemoveContent(item.content_id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <ContentPicker onSelect={handleAddContent} />
    </div>
  );
}
```

## Migration & Rollback

### Apply Migration

```bash
pnpm supabase migration up
```

### Rollback (if needed)

```sql
-- Drop the table and all related objects
DROP TABLE IF EXISTS public.event_content_associations CASCADE;
DROP FUNCTION IF EXISTS set_event_content_association_site_id() CASCADE;
DROP FUNCTION IF EXISTS get_event_content(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_content_events(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_event_content_association(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS remove_event_content_association(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS bulk_create_event_content_associations(UUID, UUID[]) CASCADE;
```

## Testing

### Manual Testing Queries

```sql
-- 1. Create test event
INSERT INTO events (site_id, title, slug, start_datetime, status)
VALUES (
  'your-site-id',
  'Test Event',
  'test-event',
  NOW() + INTERVAL '7 days',
  'published'
) RETURNING id;

-- 2. Create test content
INSERT INTO content (site_id, title, slug, content_type, content)
VALUES (
  'your-site-id',
  'Test Blog Post',
  'test-blog-post',
  'blog_post',
  '{}'
) RETURNING id;

-- 3. Create association
SELECT create_event_content_association(
  'event-id-from-step-1',
  'content-id-from-step-2'
);

-- 4. Verify association
SELECT * FROM event_content_associations;

-- 5. Get event content
SELECT * FROM get_event_content('event-id-from-step-1');

-- 6. Get content events
SELECT * FROM get_content_events('content-id-from-step-2');

-- 7. Remove association
SELECT remove_event_content_association(
  'event-id-from-step-1',
  'content-id-from-step-2'
);
```

## Best Practices

1. **Always use helper functions** instead of direct table operations when possible
2. **Validate inputs** in your application layer before calling functions
3. **Handle errors gracefully** - functions will raise exceptions for invalid operations
4. **Cache query results** using TanStack Query or similar
5. **Batch operations** when creating multiple associations
6. **Monitor performance** - add indexes if you notice slow queries
7. **Consider soft deletes** - associations are automatically removed when events/content are deleted

## Troubleshooting

### "Event and content must belong to the same site"

This error occurs when trying to associate an event with content from a different site. This is a security feature to prevent cross-site data leaks.

**Solution**: Ensure both the event and content belong to the same site before creating the association.

### Duplicate Associations

The unique constraint prevents duplicate associations. If you try to create an existing association, the function will return the existing one instead of erroring.

### RLS Policy Violations

If you get permission denied errors, check:
1. User is authenticated
2. User has site membership with appropriate role (editor/owner)
3. Event and content belong to a site the user has access to

### Performance Issues

If queries are slow:
1. Check if you're filtering by `site_id`
2. Verify indexes exist: `SELECT * FROM pg_indexes WHERE tablename = 'event_content_associations';`
3. Use `EXPLAIN ANALYZE` to diagnose slow queries
4. Consider denormalizing if you have very high query volume
