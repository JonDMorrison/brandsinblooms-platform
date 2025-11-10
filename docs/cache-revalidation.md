# Cache Revalidation Strategy

## Overview

This document explains how cache invalidation works in the Brands in Blooms platform to ensure content updates appear immediately on customer-facing websites.

## Problem

Next.js 15 caches server components by default for performance. When content is updated via the dashboard editor, the cached pages continue serving stale data until something invalidates the cache.

## Solution

We use Next.js server actions with `revalidatePath()` to invalidate cached pages whenever content is updated.

## Implementation

### Server Action (`app/actions/content.ts`)

```typescript
export async function updateContentWithRevalidation(
  siteId: string,
  contentId: string,
  data: UpdateContent
) {
  const supabase = await createClient()
  const result = await updateContentQuery(supabase, siteId, contentId, data)

  // Revalidate blog index if blog post
  if (data.content_type === 'blog_post' || result.content_type === 'blog_post') {
    revalidatePath('/blog', 'page')
  }

  // Revalidate specific content page
  if (result.slug) {
    revalidatePath(`/${result.slug}`, 'page')
  }

  // Revalidate layout to update sidebars/navigation
  revalidatePath('/', 'layout')

  return result
}
```

### Editor Integration (`app/dashboard/content/editor/page.tsx`)

The content editor uses the server action instead of direct Supabase updates:

```typescript
// Before (no cache invalidation):
await updateContent(supabase, currentSite.id, contentId, {...})

// After (with cache invalidation):
await updateContentWithRevalidation(currentSite.id, contentId, {...})
```

### Dynamic Rendering (`app/[...slug]/page.tsx`)

Customer-facing pages use dynamic rendering to prevent aggressive caching:

```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

## When Cache is Revalidated

1. **Blog Post Updates**: `/blog` index page + specific post page + layout
2. **Page Updates**: Specific page slug + layout
3. **Content Type Changes**: Relevant content type pages

## Revalidation Scopes

- `revalidatePath('/path', 'page')`: Revalidates specific page only
- `revalidatePath('/', 'layout')`: Revalidates entire layout (navigation, sidebars, etc.)

## Testing Cache Invalidation

1. Edit a blog post in the dashboard
2. Save changes
3. Visit the blog on the customer site
4. Changes should appear immediately (no hard refresh needed)

## Performance Considerations

- **Development**: Cache revalidation happens instantly
- **Production**: May take a few seconds for CDN edge nodes to update
- **Fallback**: Users can still hard refresh (Cmd/Ctrl+Shift+R) if needed

## Alternative Approaches Considered

### ❌ Client-Side Query Invalidation (React Query)
**Why not**: Server components don't use React Query; data is fetched server-side

### ❌ Time-Based Revalidation (ISR)
**Why not**: Can result in stale content for minutes/hours; users expect immediate updates

### ✅ Server Actions + revalidatePath (Current)
**Why**: Provides immediate cache invalidation while maintaining server component benefits

## Related Files

- **Server Action**: `app/actions/content.ts`
- **Editor**: `app/dashboard/content/editor/page.tsx`
- **Display Pages**:
  - `app/[...slug]/components/BlogIndexPage.tsx`
  - `app/[...slug]/components/DynamicContentPage.tsx`
  - `app/[...slug]/page.tsx`
- **Database Queries**: `src/lib/queries/domains/content.ts`

## Debugging

If content updates aren't appearing:

1. **Check server action was called**: Look for network request to `updateContentWithRevalidation`
2. **Verify revalidation paths**: Check server logs for revalidatePath calls
3. **Check dynamic rendering**: Ensure `dynamic = 'force-dynamic'` in page.tsx
4. **Clear browser cache**: Hard refresh (Cmd/Ctrl+Shift+R)
5. **Check database**: Verify content actually saved to database

## Future Enhancements

- [ ] Add revalidation for category/tag pages when implemented
- [ ] Implement cache tags for more granular invalidation
- [ ] Add telemetry to track revalidation performance
- [ ] Consider edge function cache purging for global CDNs
