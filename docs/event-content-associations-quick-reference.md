# Event-Content Associations Quick Reference

## One-Liner

Link events with pages/blog posts in a many-to-many relationship with automatic site isolation.

## Database Table

```sql
event_content_associations (
    id, event_id, content_id, site_id, created_at, created_by
)
```

## Helper Functions (Use These!)

### Get Content for an Event

```sql
SELECT * FROM get_event_content('event-uuid');
```

Returns: content_id, content_type, title, slug, is_published, published_at, association_created_at

### Get Events for Content

```sql
SELECT * FROM get_content_events('content-uuid');
```

Returns: event_id, title, slug, start_datetime, end_datetime, status, location, association_created_at

### Create Association

```sql
SELECT create_event_content_association('event-uuid', 'content-uuid');
```

Returns: association UUID (existing or new). Validates same site. Idempotent.

### Remove Association

```sql
SELECT remove_event_content_association('event-uuid', 'content-uuid');
```

Returns: true if deleted, false if not found.

### Bulk Create

```sql
SELECT * FROM bulk_create_event_content_associations(
    'event-uuid',
    ARRAY['content-1', 'content-2', 'content-3']::UUID[]
);
```

Returns: Table with success/failure for each content_id.

## TypeScript Example

```typescript
// Fetch content for an event
const { data } = await supabase
  .rpc('get_event_content', { p_event_id: eventId });

// Create association
const { data, error } = await supabase
  .rpc('create_event_content_association', {
    p_event_id: eventId,
    p_content_id: contentId
  });

// Remove association
const { data, error } = await supabase
  .rpc('remove_event_content_association', {
    p_event_id: eventId,
    p_content_id: contentId
  });
```

## Direct SQL Queries

### All Content for Event

```sql
SELECT c.*
FROM event_content_associations eca
JOIN content c ON c.id = eca.content_id
WHERE eca.event_id = 'event-uuid'
ORDER BY eca.created_at DESC;
```

### All Events for Content

```sql
SELECT e.*
FROM event_content_associations eca
JOIN events e ON e.id = eca.event_id
WHERE eca.content_id = 'content-uuid'
AND e.deleted_at IS NULL
ORDER BY e.start_datetime ASC;
```

### Create Association (Manual)

```sql
INSERT INTO event_content_associations (event_id, content_id)
VALUES ('event-uuid', 'content-uuid')
ON CONFLICT (event_id, content_id) DO NOTHING;
```

Note: site_id is set automatically by trigger.

### Delete Association

```sql
DELETE FROM event_content_associations
WHERE event_id = 'event-uuid' AND content_id = 'content-uuid';
```

## React Hooks

```typescript
// hooks/useEventContent.ts
import { useQuery } from '@tanstack/react-query';

export function useEventContent(eventId: string) {
  return useQuery({
    queryKey: ['event-content', eventId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .rpc('get_event_content', { p_event_id: eventId });
      return data;
    },
  });
}

export function useContentEvents(contentId: string) {
  return useQuery({
    queryKey: ['content-events', contentId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .rpc('get_content_events', { p_content_id: contentId });
      return data;
    },
  });
}
```

## Security Rules

- **Public**: Can view associations for published events
- **Site Members**: Can view all associations for their site
- **Site Editors**: Can create/delete associations for their site
- **Platform Admins**: Full access

## Automatic Features

1. **Site Isolation**: site_id set automatically, validates same site
2. **Created By**: created_by set to current user
3. **Cascade Delete**: Associations removed when event/content deleted
4. **No Duplicates**: Unique constraint on (event_id, content_id)
5. **Cross-Site Prevention**: Trigger validates both belong to same site

## Common Errors

### "Event and content must belong to the same site"

**Cause**: Trying to associate event from site A with content from site B.

**Fix**: Ensure both belong to the same site.

### "Permission denied"

**Cause**: User doesn't have editor/owner role for the site.

**Fix**: Check site_memberships table and user role.

## Performance Tips

1. Always filter by site_id when possible
2. Use helper functions (they're optimized)
3. Batch operations with bulk_create_event_content_associations
4. Index usage is automatic (already created)
5. Consider caching with React Query

## Component Example

```typescript
'use client';

import { useEventContent } from '@/hooks/useEventContent';

export function EventRelatedContent({ eventId }: { eventId: string }) {
  const { data: content, isLoading } = useEventContent(eventId);

  if (isLoading) return <div>Loading...</div>;
  if (!content?.length) return null;

  return (
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
  );
}
```

## Migration Commands

```bash
# Apply migration
pnpm supabase migration up

# Rollback (if needed - drops table and functions)
pnpm supabase migration down 20251109000000

# Generate TypeScript types
pnpm generate-types
```

## Troubleshooting

```sql
-- Check if association exists
SELECT * FROM event_content_associations
WHERE event_id = 'event-uuid' AND content_id = 'content-uuid';

-- Check event's site
SELECT id, title, site_id FROM events WHERE id = 'event-uuid';

-- Check content's site
SELECT id, title, site_id FROM content WHERE id = 'content-uuid';

-- Check user's site access
SELECT * FROM site_memberships WHERE user_id = auth.uid();

-- View all indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'event_content_associations';
```

## Full Documentation

For detailed explanations, see:
- `docs/event-content-associations-guide.md` - Usage guide with examples
- `docs/event-content-associations-architecture.md` - Design decisions and trade-offs
