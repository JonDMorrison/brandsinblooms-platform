# Event-Content Associations Architecture

## Executive Summary

This document explains the database schema design for event-content associations, a many-to-many relationship system that allows events to be linked with pages and blog posts while maintaining strict multi-tenant isolation.

## Design Goals

1. **Multi-Tenant Security**: Prevent cross-site data access
2. **Data Integrity**: Ensure referential consistency
3. **Performance**: Optimize for common query patterns
4. **Developer Experience**: Simple, safe APIs
5. **Auditability**: Track who created associations and when

## Schema Design

### Core Table: event_content_associations

```sql
CREATE TABLE event_content_associations (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(event_id, content_id)
);
```

### Key Architectural Decisions

#### 1. Denormalized site_id

**Why**: Row-Level Security (RLS) performance

Traditional junction tables only store the two foreign keys (event_id, content_id). However, to enforce site-level isolation, RLS policies would need to:
1. Join to events table to get site_id
2. Join to site_memberships to check user access

This creates a performance bottleneck, especially with large datasets.

**Solution**: Denormalize `site_id` directly in the junction table.

**Benefits**:
- RLS policies can filter on `site_id` directly (indexed)
- No joins needed for security checks
- Faster queries overall

**Trade-offs**:
- Slight data redundancy (site_id exists in events and associations)
- Requires trigger to maintain consistency

**Validation**: The trigger validates that event and content belong to the same site, preventing data inconsistencies.

#### 2. Automatic Trigger for site_id

```sql
CREATE TRIGGER trigger_set_event_content_association_site_id
    BEFORE INSERT OR UPDATE
    EXECUTE FUNCTION set_event_content_association_site_id();
```

**Why**: Developer safety and data integrity

**What it does**:
1. Automatically sets `site_id` from the event
2. Validates content belongs to the same site
3. Sets `created_by` to current user
4. Raises exception if validation fails

**Benefits**:
- Impossible to create cross-site associations (even with SQL injection)
- Developers don't need to remember to set site_id
- Centralized validation logic

#### 3. Composite Unique Constraint

```sql
UNIQUE(event_id, content_id)
```

**Why**: Prevent duplicate associations

Without this constraint, you could accidentally create multiple identical associations. The constraint ensures:
- Each event-content pair can only exist once
- `ON CONFLICT` clauses work correctly
- Idempotent operations possible

#### 4. Cascade Deletion

```sql
ON DELETE CASCADE
```

**Why**: Automatic cleanup

When an event or content item is deleted (hard or soft), associated records are automatically removed. This prevents:
- Orphaned associations
- Foreign key violations
- Manual cleanup operations

#### 5. Strategic Indexing

```sql
-- Find content for an event (common in event detail pages)
CREATE INDEX idx_event_content_assoc_event
    ON event_content_associations(event_id, created_at DESC);

-- Find events for content (common in blog posts)
CREATE INDEX idx_event_content_assoc_content
    ON event_content_associations(content_id, created_at DESC);

-- RLS policy performance (filter by site)
CREATE INDEX idx_event_content_assoc_site
    ON event_content_associations(site_id);

-- Composite queries (site + event)
CREATE INDEX idx_event_content_assoc_site_event
    ON event_content_associations(site_id, event_id);

-- Composite queries (site + content)
CREATE INDEX idx_event_content_assoc_site_content
    ON event_content_associations(site_id, content_id);
```

**Why**: Performance optimization for real-world usage patterns

**Query patterns covered**:
1. "Show all content for this event" - uses event index
2. "Show all events for this page" - uses content index
3. "Show associations for this site" - uses site index
4. RLS filtering - uses site index
5. Admin queries combining site + event/content - uses composite indexes

**Cost**: ~5 indexes × ~50 bytes = 250 bytes per row (minimal overhead)

## Security Architecture

### Row Level Security (RLS) Policies

The table has 5 RLS policies covering different access patterns:

#### 1. Public Read (Anonymous Users)

```sql
FOR SELECT USING (
    event_id IN (
        SELECT id FROM events
        WHERE status = 'published' AND deleted_at IS NULL
    )
);
```

**Who**: Anyone (not logged in)
**What**: Can see associations for published events only
**Why**: Public event pages need to show related content

#### 2. Site Members Read (Authenticated Users)

```sql
FOR SELECT USING (
    site_id IN (
        SELECT site_id FROM site_memberships
        WHERE user_id = auth.uid() AND is_active = true
    )
);
```

**Who**: Site members (any role)
**What**: Can see all associations for their site
**Why**: Editors need to see draft events and their associations

#### 3. Site Editors Insert

```sql
FOR INSERT WITH CHECK (
    site_id IN (
        SELECT site_id FROM site_memberships
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'editor')
        AND is_active = true
    )
);
```

**Who**: Site owners and editors only
**What**: Can create new associations for their site
**Why**: Viewers shouldn't modify content

#### 4. Site Editors Delete

```sql
FOR DELETE USING (
    site_id IN (
        SELECT site_id FROM site_memberships
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'editor')
        AND is_active = true
    )
);
```

**Who**: Site owners and editors only
**What**: Can remove associations for their site
**Why**: Viewers shouldn't modify content

#### 5. Platform Admins (Superuser Access)

```sql
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND user_type = 'platform_admin'
    )
);
```

**Who**: Platform administrators
**What**: Full access across all sites
**Why**: Support and moderation

### Multi-Tenant Isolation

The trigger provides defense-in-depth by validating at the application level:

```sql
-- Validate same site
IF NOT EXISTS (
    SELECT 1 FROM content
    WHERE id = NEW.content_id
    AND site_id = NEW.site_id
) THEN
    RAISE EXCEPTION 'Event and content must belong to the same site';
END IF;
```

**Why both RLS and trigger validation?**

- **RLS**: Prevents unauthorized reads/writes at the database level
- **Trigger**: Prevents logical errors even from authorized users
- **Defense in depth**: Two layers of security are better than one

## Helper Functions

The migration includes 5 helper functions that abstract common operations:

### 1. get_event_content(event_id)

**Purpose**: Fetch all content associated with an event
**Security**: Uses SECURITY DEFINER with proper filtering
**Returns**: Table of content records with association metadata

### 2. get_content_events(content_id)

**Purpose**: Fetch all events associated with content
**Security**: Filters out soft-deleted events automatically
**Returns**: Table of event records ordered by start date

### 3. create_event_content_association(event_id, content_id)

**Purpose**: Create association with full validation
**Security**: Validates both IDs exist and belong to same site
**Returns**: UUID of association (existing or new)
**Idempotent**: Safe to call multiple times

### 4. remove_event_content_association(event_id, content_id)

**Purpose**: Remove specific association
**Returns**: Boolean (true if deleted, false if not found)
**Safe**: No error if association doesn't exist

### 5. bulk_create_event_content_associations(event_id, content_ids[])

**Purpose**: Create multiple associations in one call
**Returns**: Table with success/failure status for each
**Atomic**: Each association is independent
**Use case**: Admin UI, bulk imports

## Query Performance Analysis

### Common Query: "Get content for an event"

```sql
SELECT * FROM get_event_content('event-uuid');
```

**Query Plan**:
1. Index scan on `idx_event_content_assoc_event` - **O(log n + k)** where k = results
2. Nested loop join to `content` table - **O(k)** lookups
3. Total: **O(log n + k)**

**Optimization**: The event index includes `created_at` for sorting without an additional sort step.

### Common Query: "Get events for content"

```sql
SELECT * FROM get_content_events('content-uuid');
```

**Query Plan**:
1. Index scan on `idx_event_content_assoc_content` - **O(log n + k)**
2. Nested loop join to `events` table - **O(k)** lookups
3. Sort by `start_datetime` - **O(k log k)**
4. Total: **O(log n + k log k)**

**Note**: For small k (typical case), sorting overhead is negligible.

### RLS Policy Query: "Check user access"

```sql
-- Executed automatically by Postgres on every query
SELECT site_id IN (
    SELECT site_id FROM site_memberships
    WHERE user_id = auth.uid() AND is_active = true
)
```

**Query Plan**:
1. Index scan on `site_memberships(user_id)` - **O(log n + m)** where m = user's sites
2. Hash semi-join on `site_id` - **O(m)**
3. Total per row: **O(log n + m)**

**Optimization**: The denormalized `site_id` column allows this check without joining to `events` table.

## Data Flow Diagrams

### Create Association Flow

```
Client Request
    ↓
API Handler
    ↓
create_event_content_association(event_id, content_id)
    ↓
Validation:
- Event exists? → SELECT FROM events
- Content exists? → SELECT FROM content
- Same site? → Compare site_ids
    ↓
INSERT INTO event_content_associations
    ↓
TRIGGER: set_event_content_association_site_id()
- Set site_id from event
- Validate content.site_id matches
- Set created_by
    ↓
RLS Policy Check:
- Is user a site editor?
    ↓
Success: Return association UUID
```

### Read Associations Flow (Public User)

```
Public User → Event Detail Page
    ↓
get_event_content(event_id)
    ↓
SELECT with JOIN:
- event_content_associations
- content
    ↓
RLS Policy Filter:
- Only show if event.status = 'published'
    ↓
Return: List of associated content
```

## Comparison with Alternative Approaches

### Alternative 1: No site_id (Pure Junction Table)

```sql
-- Simpler schema
CREATE TABLE event_content_associations (
    event_id UUID REFERENCES events,
    content_id UUID REFERENCES content,
    PRIMARY KEY (event_id, content_id)
);
```

**Pros**:
- Simpler schema
- Less storage (no site_id)
- No trigger needed

**Cons**:
- RLS policies must join to events table (slow)
- No direct site-level querying
- Harder to debug (need to trace through events)
- Cross-site associations possible (security risk)

**Verdict**: Not suitable for multi-tenant systems with RLS

### Alternative 2: Polymorphic Association

```sql
-- Use related_type and related_id instead of content_id
CREATE TABLE event_associations (
    event_id UUID REFERENCES events,
    related_type VARCHAR(20),
    related_id UUID,
    -- No foreign key constraint
);
```

**Pros**:
- Could link to tables other than content
- Flexible for future expansion

**Cons**:
- No referential integrity (foreign key)
- Harder to query (need CASE statements)
- No automatic cascade deletion
- Complex RLS policies
- Slower queries (no index on polymorphic columns)

**Verdict**: Over-engineered for current needs

### Alternative 3: Embedded Arrays in Events

```sql
-- Store content IDs as array in events table
ALTER TABLE events ADD COLUMN related_content_ids UUID[];
```

**Pros**:
- Simple schema (no junction table)
- Fast for small numbers of associations

**Cons**:
- Can't query "which events are on this page?"
- No referential integrity
- No cascade deletion
- Array queries are slower than joins
- Denormalized data (harder to maintain)
- No audit trail (who created association?)

**Verdict**: Not suitable for many-to-many relationships

## Our Choice: Hybrid Approach

We chose a **denormalized junction table with triggers** because:

1. **Security First**: site_id enables efficient RLS policies
2. **Data Integrity**: Foreign keys + triggers prevent errors
3. **Performance**: Indexes optimize common query patterns
4. **Developer Experience**: Helper functions simplify usage
5. **Auditability**: created_by and created_at track changes

The additional complexity (trigger, denormalized site_id) is worth the benefits in a multi-tenant system.

## Monitoring & Observability

### Queries to Monitor

```sql
-- 1. Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'event_content_associations'
ORDER BY idx_scan DESC;

-- 2. Table statistics
SELECT n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup, last_vacuum, last_autovacuum
FROM pg_stat_user_tables
WHERE relname = 'event_content_associations';

-- 3. RLS policy execution count
SELECT * FROM pg_stat_user_functions
WHERE funcname LIKE '%event_content%';

-- 4. Average associations per event
SELECT
    COUNT(*) FILTER (WHERE event_count = 0) as events_with_no_content,
    AVG(event_count) as avg_content_per_event,
    MAX(event_count) as max_content_per_event
FROM (
    SELECT event_id, COUNT(*) as event_count
    FROM event_content_associations
    GROUP BY event_id
) subq;

-- 5. Sites with most associations
SELECT
    e.site_id,
    s.name as site_name,
    COUNT(*) as association_count
FROM event_content_associations eca
JOIN events e ON e.id = eca.event_id
JOIN sites s ON s.id = e.site_id
GROUP BY e.site_id, s.name
ORDER BY association_count DESC
LIMIT 10;
```

### Key Metrics to Track

1. **Query Performance**: p50, p95, p99 latency for helper functions
2. **Index Efficiency**: Index scan vs sequential scan ratio
3. **Table Growth**: Rows per day, storage size
4. **RLS Overhead**: Query time with vs without RLS
5. **Error Rate**: Trigger exceptions (cross-site attempts)

## Future Enhancements

### Potential Additions

1. **Association Metadata**
   ```sql
   ALTER TABLE event_content_associations
   ADD COLUMN display_type VARCHAR(20) DEFAULT 'related',
   ADD COLUMN sort_order INTEGER DEFAULT 0,
   ADD COLUMN notes TEXT;
   ```

2. **Soft Delete for Associations**
   ```sql
   ALTER TABLE event_content_associations
   ADD COLUMN deleted_at TIMESTAMPTZ;
   ```

3. **Association Types**
   ```sql
   ALTER TABLE event_content_associations
   ADD COLUMN association_type VARCHAR(20) DEFAULT 'mentions'
   CHECK (association_type IN ('mentions', 'featured', 'related', 'sponsored'));
   ```

4. **Analytics**
   ```sql
   CREATE TABLE event_content_association_views (
       id UUID PRIMARY KEY,
       association_id UUID REFERENCES event_content_associations,
       viewed_at TIMESTAMPTZ DEFAULT NOW(),
       user_id UUID,
       ip_address INET
   );
   ```

### Breaking Changes to Avoid

When extending the schema, avoid:
1. Changing the unique constraint (breaks idempotency)
2. Removing indexes (breaks performance)
3. Modifying trigger logic without careful testing
4. Adding NOT NULL columns without defaults

## Testing Strategy

### Unit Tests (SQL)

```sql
-- Test 1: Create association
DO $$
DECLARE
    v_event_id UUID;
    v_content_id UUID;
    v_assoc_id UUID;
BEGIN
    -- Setup
    INSERT INTO events (site_id, title, slug, start_datetime)
    VALUES ('test-site', 'Test Event', 'test-event', NOW())
    RETURNING id INTO v_event_id;

    INSERT INTO content (site_id, title, slug, content_type, content)
    VALUES ('test-site', 'Test Content', 'test-content', 'page', '{}')
    RETURNING id INTO v_content_id;

    -- Test
    v_assoc_id := create_event_content_association(v_event_id, v_content_id);

    -- Verify
    ASSERT v_assoc_id IS NOT NULL, 'Association ID should not be null';

    -- Cleanup
    DELETE FROM events WHERE id = v_event_id;
END $$;
```

### Integration Tests (TypeScript)

```typescript
import { describe, it, expect } from '@jest/globals';
import { createClient } from '@/lib/supabase/server';

describe('Event Content Associations', () => {
  it('should prevent cross-site associations', async () => {
    const supabase = createClient();

    // Create event in site A
    const { data: event } = await supabase
      .from('events')
      .insert({ site_id: 'site-a', ... })
      .select()
      .single();

    // Create content in site B
    const { data: content } = await supabase
      .from('content')
      .insert({ site_id: 'site-b', ... })
      .select()
      .single();

    // Try to associate
    const { error } = await supabase.rpc('create_event_content_association', {
      p_event_id: event.id,
      p_content_id: content.id
    });

    // Should fail
    expect(error).toBeTruthy();
    expect(error.message).toContain('same site');
  });

  it('should be idempotent', async () => {
    const supabase = createClient();

    // Create once
    const { data: assoc1 } = await supabase.rpc('create_event_content_association', {
      p_event_id: eventId,
      p_content_id: contentId
    });

    // Create again
    const { data: assoc2 } = await supabase.rpc('create_event_content_association', {
      p_event_id: eventId,
      p_content_id: contentId
    });

    // Should return same ID
    expect(assoc1).toBe(assoc2);
  });
});
```

## Conclusion

The event-content associations schema is designed for:
- **Security**: Multi-tenant isolation via denormalized site_id
- **Performance**: Strategic indexes for common queries
- **Safety**: Triggers prevent data integrity issues
- **Simplicity**: Helper functions abstract complexity

This architecture balances normalization (foreign keys) with pragmatic denormalization (site_id) to achieve both correctness and performance in a multi-tenant SaaS environment.
