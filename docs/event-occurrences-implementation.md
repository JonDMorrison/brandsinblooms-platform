# Event Occurrences - Query Layer Implementation

## Overview
This document confirms the implementation of TypeScript query functions and React hooks for managing event occurrences with multiple dates per event.

## 1. Query Functions Added (/src/lib/queries/domains/events.ts)

### Types Exported
```typescript
type EventOccurrence = RowType<'event_occurrences'>;
type InsertEventOccurrence = InsertType<'event_occurrences'>;
type UpdateEventOccurrence = UpdateType<'event_occurrences'>;
```

### Query Functions

#### `getEventOccurrences(supabase, eventId): Promise<EventOccurrence[]>`
- Fetches all occurrences for an event (ordered by start_datetime ASC)
- Inherits location from parent event if occurrence.location is NULL
- Returns full EventOccurrence objects with all fields

**Implementation Note**: While the SQL migration provides a `get_event_occurrences()` RPC function, this implementation uses direct table queries to return complete `EventOccurrence` objects with all fields (created_at, updated_at, etc.) which the RPC doesn't include.

#### `addEventOccurrence(supabase, eventId, daysOffset, baseOccurrenceId?): Promise<string>`
- Adds new occurrence offset by N days from base occurrence
- Uses SQL function `add_event_occurrence()`
- Returns the new occurrence ID
- Optional baseOccurrenceId (defaults to first occurrence if not provided)

#### `updateOccurrenceAllDay(supabase, occurrenceId, isAllDay): Promise<EventOccurrence>`
- Updates all-day status for a single occurrence
- Direct table update (not RPC)
- Returns updated occurrence

#### `updateAllOccurrencesAllDay(supabase, eventId, isAllDay): Promise<number>`
- Bulk updates all-day status for ALL occurrences of an event
- Uses SQL function `update_event_occurrences_all_day()`
- Returns count of updated occurrences

#### `updateEventOccurrence(supabase, occurrenceId, data): Promise<EventOccurrence>`
- Updates any field(s) on an occurrence (dates, location, meta_data, etc.)
- Direct table update
- Returns updated occurrence

#### `deleteEventOccurrence(supabase, occurrenceId): Promise<void>`
- Soft deletes an occurrence
- Sets deleted_at timestamp

#### `createEventOccurrence(supabase, data): Promise<EventOccurrence>`
- Manually creates a new occurrence
- For custom date/time creation (vs offset-based with addEventOccurrence)
- Returns created occurrence

---

## 2. React Hooks Added (/src/hooks/useEvents.ts)

### Cache Management
Added `clearOccurrenceCache(siteId, eventId)` utility for invalidating occurrence-specific cache keys.

### Hooks

#### `useEventOccurrences(eventId)`
**Purpose**: Fetch all occurrences for an event
**Returns**: Query result with `EventOccurrence[]`
**Cache**: 2 minute stale time, persisted to localStorage

**Example Usage**:
```typescript
const { data: occurrences, isLoading } = useEventOccurrences(eventId);
```

---

#### `useAddOccurrence()`
**Purpose**: Add occurrence with offset (e.g., +7 days button)
**Input**: `{ eventId, daysOffset, baseOccurrenceId? }`
**Returns**: New occurrence ID
**Cache**: Clears occurrence + event cache on success

**Example Usage**:
```typescript
const { mutateAsync: addOccurrence } = useAddOccurrence();

// Add occurrence 7 days after first occurrence
await addOccurrence({
  eventId: 'event-123',
  daysOffset: 7
});

// Add occurrence 30 days after specific occurrence
await addOccurrence({
  eventId: 'event-123',
  daysOffset: 30,
  baseOccurrenceId: 'occurrence-abc'
});
```

---

#### `useUpdateOccurrenceAllDay()`
**Purpose**: Update all-day status for single occurrence
**Input**: `{ occurrenceId, isAllDay, eventId }`
**Returns**: Updated `EventOccurrence`
**Cache**: Clears occurrence cache on success

**Example Usage**:
```typescript
const { mutateAsync: updateAllDay } = useUpdateOccurrenceAllDay();

await updateAllDay({
  occurrenceId: 'occurrence-123',
  isAllDay: true,
  eventId: 'event-abc'
});
```

---

#### `useUpdateAllDayForAll()`
**Purpose**: Bulk update all-day for ALL occurrences
**Input**: `{ eventId, isAllDay }`
**Returns**: Count of updated occurrences
**Cache**: Clears occurrence + event cache on success
**Toast**: Shows "Updated N occurrence(s) successfully"

**Example Usage**:
```typescript
const { mutateAsync: updateAll } = useUpdateAllDayForAll();

const count = await updateAll({
  eventId: 'event-123',
  isAllDay: false
});

console.log(`Updated ${count} occurrences`);
```

---

#### `useUpdateOccurrence()`
**Purpose**: Update occurrence fields (dates, location, etc.)
**Input**: `UpdateEventOccurrence & { id, eventId }`
**Returns**: Updated `EventOccurrence`
**Cache**: Clears occurrence cache on success

**Example Usage**:
```typescript
const { mutateAsync: updateOccurrence } = useUpdateOccurrence();

await updateOccurrence({
  id: 'occurrence-123',
  eventId: 'event-abc',
  start_datetime: '2025-12-01T10:00:00Z',
  end_datetime: '2025-12-01T12:00:00Z',
  location: 'New Location'
});
```

---

#### `useDeleteOccurrence()`
**Purpose**: Soft delete an occurrence
**Input**: `{ occurrenceId, eventId }`
**Returns**: void
**Cache**: Clears occurrence + event cache on success

**Example Usage**:
```typescript
const { mutateAsync: deleteOccurrence } = useDeleteOccurrence();

await deleteOccurrence({
  occurrenceId: 'occurrence-123',
  eventId: 'event-abc'
});
```

---

#### `useCreateOccurrence()`
**Purpose**: Manually create occurrence with exact dates
**Input**: `InsertEventOccurrence`
**Returns**: Created `EventOccurrence`
**Cache**: Clears occurrence + event cache on success

**Example Usage**:
```typescript
const { mutateAsync: createOccurrence } = useCreateOccurrence();

const newOccurrence = await createOccurrence({
  event_id: 'event-123',
  start_datetime: '2025-12-25T14:00:00Z',
  end_datetime: '2025-12-25T16:00:00Z',
  is_all_day: false,
  location: 'Custom Venue', // or null to inherit from event
  meta_data: { capacity: 100 }
});
```

---

## 3. Type Definitions

All types are exported from `/src/lib/queries/domains/events.ts`:

```typescript
export type {
  EventOccurrence,
  InsertEventOccurrence,
  UpdateEventOccurrence
}
```

### EventOccurrence Structure
```typescript
{
  id: string;
  event_id: string;
  start_datetime: string; // ISO 8601
  end_datetime: string | null;
  is_all_day: boolean;
  location: string | null; // NULL = inherit from parent event
  meta_data: Json | null; // { capacity?, registration_count?, custom_fields? }
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

---

## 4. SQL Functions Used

These functions are defined in the migration `/supabase/migrations/20251108_add_event_occurrences.sql`:

### `get_event_occurrences(p_event_id UUID)`
Returns occurrences with inherited location from parent event.

**Note**: The TypeScript implementation uses direct table queries instead to return complete objects.

### `add_event_occurrence(p_event_id UUID, p_days_offset INTEGER, p_base_occurrence_id UUID?)`
Adds new occurrence offset by N days. Returns new occurrence ID.

### `update_event_occurrences_all_day(p_event_id UUID, p_is_all_day BOOLEAN)`
Bulk updates all-day flag for all occurrences. Returns count.

---

## 5. Cache Strategy

### Cache Keys Pattern
- **Occurrence list**: `event-occurrences-{siteId}-{eventId}`
- **Event detail**: `event-detail-{siteId}-{eventId}`
- **Event list**: `events-list-{siteId}-{filters}`
- **Event stats**: `event-stats-{siteId}`

### Cache Invalidation
All mutation hooks automatically clear relevant caches:
- Occurrence mutations → Clear occurrence cache + event detail cache
- Bulk operations → Also clear event list + stats caches

### Stale Time
- Occurrence queries: 2 minutes
- Event queries: 2 minutes
- Stats queries: 5 minutes

---

## 6. Issues Encountered

### No Issues
All functions and hooks implemented successfully with:
- Full type safety using generated database types
- Proper error handling via SupabaseError
- Optimistic updates where applicable
- Cache invalidation on mutations
- Success toasts for user feedback

---

## 7. Next Steps (UI Implementation)

Now that the query layer is complete, you can implement the UI:

1. **Event Edit Page**: Add occurrence management UI
   - List all occurrences with dates
   - "+7 Days" / "+30 Days" quick action buttons
   - "All Day" toggle with "Apply to All" option
   - Edit/delete individual occurrences

2. **Event Calendar View**: Display occurrences on calendar
   - Use `useEventOccurrences()` to fetch dates
   - Show multiple markers for multi-date events

3. **Event Detail Page**: Show next occurrence + all upcoming dates
   - Use `useEventOccurrences()` filtered by date

---

## Example: Complete Occurrence Management Component

```typescript
'use client';

import { useState } from 'react';
import {
  useEventOccurrences,
  useAddOccurrence,
  useUpdateAllDayForAll,
  useDeleteOccurrence
} from '@/hooks/useEvents';

export function EventOccurrences({ eventId }: { eventId: string }) {
  const { data: occurrences, isLoading } = useEventOccurrences(eventId);
  const { mutateAsync: addOccurrence } = useAddOccurrence();
  const { mutateAsync: updateAllDay } = useUpdateAllDayForAll();
  const { mutateAsync: deleteOccurrence } = useDeleteOccurrence();

  const handleAdd7Days = async () => {
    await addOccurrence({ eventId, daysOffset: 7 });
  };

  const handleAdd30Days = async () => {
    await addOccurrence({ eventId, daysOffset: 30 });
  };

  const handleToggleAllDay = async (isAllDay: boolean) => {
    await updateAllDay({ eventId, isAllDay });
  };

  const handleDelete = async (occurrenceId: string) => {
    if (confirm('Delete this occurrence?')) {
      await deleteOccurrence({ occurrenceId, eventId });
    }
  };

  if (isLoading) return <div>Loading occurrences...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={handleAdd7Days}>+7 Days</button>
        <button onClick={handleAdd30Days}>+30 Days</button>
        <button onClick={() => handleToggleAllDay(true)}>
          Make All All-Day
        </button>
      </div>

      <div className="space-y-2">
        {occurrences?.map(occurrence => (
          <div key={occurrence.id} className="flex items-center gap-4 p-2 border">
            <div>
              {new Date(occurrence.start_datetime).toLocaleString()}
              {occurrence.is_all_day && ' (All Day)'}
            </div>
            <div className="text-sm text-gray-500">
              {occurrence.location || 'Inherited location'}
            </div>
            <button
              onClick={() => handleDelete(occurrence.id)}
              className="text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Summary

The event occurrences query layer is **fully implemented and type-safe**:

- 7 query functions in `/src/lib/queries/domains/events.ts`
- 7 React hooks in `/src/hooks/useEvents.ts`
- Full TypeScript type safety with generated database types
- Comprehensive cache management
- Ready for UI integration

All functions tested against the SQL schema defined in the migration file.
