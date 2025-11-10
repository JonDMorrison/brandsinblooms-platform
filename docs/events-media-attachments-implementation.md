# Event Media and Attachments Implementation

## Summary

Backend functions and React hooks for managing event media and attachments have been successfully implemented.

## Backend Functions (Already Existed)

Location: `src/lib/queries/domains/events.ts`

### Media Functions
- **`addEventMedia`** - Creates new event media (lines 544-556)
  - Soft delete pattern with `deleted_at`
  - Returns the created media object
  - Uses `handleSingleResponse` for error handling

- **`deleteEventMedia`** - Soft deletes event media (lines 558-570)
  - Sets `deleted_at` timestamp
  - Uses `SupabaseError.fromPostgrestError` for error handling

### Attachment Functions
- **`addEventAttachment`** - Creates new event attachment (lines 590-602)
  - Soft delete pattern with `deleted_at`
  - Returns the created attachment object
  - Uses `handleSingleResponse` for error handling

- **`deleteEventAttachment`** - Soft deletes event attachment (lines 604-616)
  - Sets `deleted_at` timestamp
  - Uses `SupabaseError.fromPostgrestError` for error handling

## React Hooks (Newly Added)

Location: `src/hooks/useEvents.ts`

### Media Hooks

#### `useAddEventMedia`
```typescript
export function useAddEventMedia() {
  // Returns mutation hook for adding media to an event
  // Accepts: { eventId, media_type, media_url, thumbnail_url?, alt_text?, caption?, sort_order? }
  // Returns: EventMedia
  // Auto-invalidates: Event cache for the specific event
}
```

#### `useDeleteEventMedia`
```typescript
export function useDeleteEventMedia() {
  // Returns mutation hook for deleting event media
  // Accepts: { mediaId, eventId }
  // Returns: void
  // Auto-invalidates: Event cache for the specific event
}
```

### Attachment Hooks

#### `useAddEventAttachment`
```typescript
export function useAddEventAttachment() {
  // Returns mutation hook for adding attachment to an event
  // Accepts: { eventId, file_name, file_url, file_size_bytes?, mime_type? }
  // Returns: EventAttachment
  // Auto-invalidates: Event cache for the specific event
}
```

#### `useDeleteEventAttachment`
```typescript
export function useDeleteEventAttachment() {
  // Returns mutation hook for deleting event attachment
  // Accepts: { attachmentId, eventId }
  // Returns: void
  // Auto-invalidates: Event cache for the specific event
}
```

## Features

### Cache Invalidation
- All mutations automatically clear the specific event cache using `clearSpecificEventCache(siteId, eventId)`
- Ensures UI updates immediately after mutations

### Toast Notifications
- Success toasts configured for all mutations:
  - "Media added successfully"
  - "Media deleted successfully"
  - "Attachment added successfully"
  - "Attachment deleted successfully"

### Error Handling
- Backend functions use `SupabaseError.fromPostgrestError` for consistent error handling
- Hooks use `useSupabaseMutation` which handles errors automatically

### TypeScript Types
- All functions and hooks are fully typed
- Uses generated database types from `@/lib/database/types`
- No `any` types used

## Usage Example

### Adding Media
```typescript
const addMedia = useAddEventMedia();

await addMedia.mutateAsync({
  eventId: 'event-uuid',
  media_type: 'image',
  media_url: 'https://example.com/image.jpg',
  alt_text: 'Event photo',
  caption: 'Our amazing event',
  sort_order: 0
});
```

### Adding Attachment
```typescript
const addAttachment = useAddEventAttachment();

await addAttachment.mutateAsync({
  eventId: 'event-uuid',
  file_name: 'event-schedule.pdf',
  file_url: 'https://example.com/schedule.pdf',
  file_size_bytes: 1024000,
  mime_type: 'application/pdf'
});
```

### Deleting Media
```typescript
const deleteMedia = useDeleteEventMedia();

await deleteMedia.mutateAsync({
  mediaId: 'media-uuid',
  eventId: 'event-uuid'
});
```

## Verification

✓ All backend functions exist and follow established patterns
✓ All hooks exported and properly typed
✓ No TypeScript errors introduced
✓ Cache invalidation implemented
✓ Toast notifications configured
✓ Follows soft delete pattern (sets `deleted_at`)
✓ Uses SupabaseError for error handling
✓ No `any` types used

## Next Steps

These hooks are ready to be used in the event management UI components for:
- Image/video gallery management
- PDF/document attachment uploads
- Media reordering (existing `reorderEventMedia` function available)
- File upload flows
