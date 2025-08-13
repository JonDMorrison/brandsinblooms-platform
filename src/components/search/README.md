# Global Search Components

This directory contains the global search functionality for the Brands in Blooms platform.

## Components

### `GlobalSearch`
Main search component with dropdown results.

**Features:**
- Real-time search with debouncing
- Results grouped by content type (Pages, Blog Posts, Events)
- Keyboard navigation support
- Click outside to close
- Loading and empty states
- Navigation to content editors

**Usage:**
```tsx
import { GlobalSearch } from '@/components/search';

<GlobalSearch 
  placeholder="Search content..."
  onNavigate={() => console.log('navigated')}
/>
```

### `GlobalSearchDialog`
Mobile-friendly dialog version of the search.

**Features:**
- Full-screen dialog interface
- Same search functionality as GlobalSearch
- Optimized for mobile use
- Auto-close on navigation

**Usage:**
```tsx
import { GlobalSearchDialog } from '@/components/search';

<GlobalSearchDialog 
  open={isOpen}
  onOpenChange={setIsOpen}
  placeholder="Search content..."
/>
```

## Implementation Notes

- Uses `useGlobalSearchWithKeyboard` hook for search and navigation
- Results link to appropriate editor routes:
  - Pages/Blog Posts: `/dashboard/content/edit/[id]`
  - Events: `/dashboard/events/edit/[id]`
- Requires site context for multi-tenancy
- Minimum 3 characters for search activation

## Icons Used

- Search: Input icon and empty state
- FileText: Pages
- PenSquare: Blog posts  
- Calendar: Events
- X: Clear search

## Keyboard Shortcuts

- Arrow Up/Down: Navigate results
- Enter: Select result
- Escape: Close search
- Home/End: First/last result