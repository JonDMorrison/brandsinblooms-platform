# Conditional Blog Navigation Implementation

## Overview
This implementation ensures the "Blog" navigation link only appears when published blog posts exist for the current site. This prevents users from seeing empty blog pages and improves UX.

## Implementation Details

### 1. Database Query Function
**File**: `/Users/bradley/Projects/clustera/repos/client-brands-in-blooms-platform/src/lib/queries/domains/content.ts`

Added `hasPublishedBlogPosts()` function:
- Uses Supabase's `count` with `head: true` for efficient query (no data returned)
- Filters by: `site_id`, `content_type='blog_post'`, and `is_published=true`
- Returns boolean indicating if at least one published blog post exists
- Handles errors gracefully by returning `false`

```typescript
export async function hasPublishedBlogPosts(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<boolean>
```

### 2. React Hook
**File**: `/Users/bradley/Projects/clustera/repos/client-brands-in-blooms-platform/src/hooks/useHasBlogPosts.ts`

Created `useHasBlogPosts()` hook:
- Wraps `hasPublishedBlogPosts()` with `useSupabaseQuery`
- Implements caching with 5-minute stale time
- Persists results to localStorage with key `has-blog-posts-${siteId}`
- Only runs when `siteId` is available
- Returns standard query result with `data`, `isLoading`, etc.

```typescript
export function useHasBlogPosts(siteId: string | undefined)
```

### 3. Navigation Component Updates
**File**: `/Users/bradley/Projects/clustera/repos/client-brands-in-blooms-platform/src/components/site/nav/SiteNavigation.tsx`

Modified `SiteNavigation` component:
- Imports `useHasBlogPosts` and `useMemo` hooks
- Calls `useHasBlogPosts(site?.id)` to check for blog posts
- Filters navigation items using `useMemo`:
  - Removes items with `/blog` in href when no posts exist
  - Shows blog navigation if posts exist OR user can edit
  - Prevents layout shift by showing all items during loading

```typescript
const navItems = useMemo(() => {
  if (isLoadingBlogCheck) {
    return allNavItems; // Prevent layout shift
  }

  return allNavItems.filter((item) => {
    if (!item.href.includes('/blog')) {
      return true;
    }
    return hasBlogPosts || canEdit;
  });
}, [allNavItems, hasBlogPosts, canEdit, isLoadingBlogCheck]);
```

### 4. Tests
**File**: `/Users/bradley/Projects/clustera/repos/client-brands-in-blooms-platform/src/lib/queries/domains/__tests__/content-blog-check.test.ts`

Created comprehensive unit tests for `hasPublishedBlogPosts()`:
- Tests successful case (posts exist)
- Tests empty case (no posts)
- Tests error handling
- Tests correct filter application

## Key Features

### 1. Performance Optimization
- **Efficient Query**: Uses `count` with `head: true` - only counts, doesn't fetch data
- **Caching**: Results cached for 5 minutes to avoid repeated DB queries
- **Persistence**: Results saved to localStorage for faster subsequent loads
- **Memoization**: Navigation filter uses `useMemo` to prevent unnecessary recalculations

### 2. User Experience
- **No Layout Shift**: Shows all items during loading, then filters
- **Editor Override**: Users with edit permissions always see blog nav (for content management)
- **Graceful Degradation**: On error, hides blog nav (safer than showing empty page)

### 3. Compatibility
- **Server Component Compatible**: Query function works in both client and server contexts
- **Existing Navigation Flow**: Minimal changes to existing navigation logic
- **Mobile & Desktop**: Works with both `MobileNav` and desktop navigation (they share `navItems`)

## Behavior

### Regular Users
- See "Blog" link only when published posts exist
- Don't see empty blog pages
- Improved UX with relevant navigation only

### Editors/Admins
- Always see "Blog" link (even without posts)
- Can access blog management features
- Can create first blog post

## Cache Invalidation

The cache automatically refreshes:
- After 5 minutes (stale time)
- When site ID changes
- On component remount (if past stale time)
- When localStorage is cleared

To manually invalidate:
```typescript
localStorage.removeItem(`has-blog-posts-${siteId}`);
```

## Future Improvements

1. **Real-time Updates**: Could use Supabase real-time subscriptions to update when posts are published/unpublished
2. **Preloading**: Could prefetch this data during initial site load
3. **More Granular**: Could extend to other content types (events, pages, etc.)
4. **Analytics**: Track how often users see vs. don't see blog navigation

## Testing

### Manual Testing Checklist
- [ ] Navigate to site without blog posts - Blog link should NOT appear
- [ ] Navigate to site with published blog posts - Blog link SHOULD appear
- [ ] Log in as editor on site without posts - Blog link SHOULD appear
- [ ] Check mobile navigation - Should match desktop behavior
- [ ] Clear cache and verify re-query works
- [ ] Check that navigation doesn't flash/shift during load

### Automated Tests
Run tests with:
```bash
pnpm test src/lib/queries/domains/__tests__/content-blog-check.test.ts
```

## Files Changed

1. `/src/lib/queries/domains/content.ts` - Added `hasPublishedBlogPosts()` function
2. `/src/hooks/useHasBlogPosts.ts` - New hook file
3. `/src/components/site/nav/SiteNavigation.tsx` - Updated to filter navigation
4. `/src/lib/queries/domains/__tests__/content-blog-check.test.ts` - New test file
