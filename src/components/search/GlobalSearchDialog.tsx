'use client';

import { useState } from 'react';
import { Search, FileText, PenSquare, Calendar, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useGlobalSearchWithKeyboard, SearchResult } from '@/hooks/useGlobalSearch';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
}

interface GroupedResults {
  pages: SearchResult[];
  blog_posts: SearchResult[];
  events: SearchResult[];
}

const contentTypeConfig = {
  page: {
    label: 'Pages',
    icon: FileText,
    route: (id: string) => `/dashboard/content/editor?id=${id}`,
  },
  blog_post: {
    label: 'Blog Posts',
    icon: PenSquare,
    route: (id: string) => `/dashboard/content/editor?id=${id}`,
  },
  event: {
    label: 'Events',
    icon: Calendar,
    route: (id: string) => `/dashboard/events/editor?id=${id}`,
  },
} as const;

export function GlobalSearchDialog({ 
  open, 
  onOpenChange, 
  placeholder = "Search content..." 
}: GlobalSearchDialogProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const {
    data: results,
    isLoading,
    isEmpty,
    hasMinLength,
    selectedIndex,
    clearSelection,
  } = useGlobalSearchWithKeyboard(
    query,
    10,
    (result) => {
      handleNavigate(result);
    },
    () => {
      handleClose();
    }
  );

  // Group results by content type
  const groupedResults: GroupedResults = results.reduce(
    (acc, result) => {
      // Map singular content_type to plural group names
      const typeMap: Record<string, keyof GroupedResults> = {
        'page': 'pages',
        'blog_post': 'blog_posts',
        'event': 'events'
      };
      
      const groupKey = typeMap[result.content_type] || null;
      if (groupKey && acc[groupKey]) {
        acc[groupKey].push(result);
      }
      return acc;
    },
    { pages: [], blog_posts: [], events: [] } as GroupedResults
  );

  const handleNavigate = (result: SearchResult) => {
    const config = contentTypeConfig[result.content_type as keyof typeof contentTypeConfig];
    if (config) {
      router.push(config.route(result.id));
      handleClose();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setQuery('');
    clearSelection();
  };

  const renderLoadingSkeleton = () => (
    <div className="p-2 space-y-2">
      <Skeleton className="h-4 w-20" />
      <div className="space-y-1">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <CommandEmpty>
      <div className="flex flex-col items-center py-6 text-center">
        <Search className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {query ? `No content found for "${query}"` : 'Start typing to search content'}
        </p>
        {query && (
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search terms
          </p>
        )}
      </div>
    </CommandEmpty>
  );

  const renderGroup = (type: keyof GroupedResults, items: SearchResult[]) => {
    if (items.length === 0) return null;

    const config = contentTypeConfig[type === 'pages' ? 'page' : type === 'blog_posts' ? 'blog_post' : 'event'];
    const Icon = config.icon;

    return (
      <CommandGroup key={type} heading={config.label}>
        {items.map((result, index) => {
          // Calculate global index for keyboard navigation
          const globalIndex = Object.entries(groupedResults)
            .slice(0, Object.keys(groupedResults).indexOf(type))
            .reduce((acc, [, items]) => acc + items.length, 0) + index;
          
          const isSelected = globalIndex === selectedIndex;

          return (
            <CommandItem
              key={result.id}
              value={result.id}
              onSelect={() => handleNavigate(result)}
              className={cn(
                "flex items-start gap-3 px-3 py-2 cursor-pointer",
                isSelected && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {result.title}
                </div>
                {result.excerpt && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {result.excerpt}
                  </div>
                )}
              </div>
            </CommandItem>
          );
        })}
      </CommandGroup>
    );
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Content"
      description="Find and navigate to your content quickly"
      className="bg-tan-400"
    >
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
        className="bg-tan-400 border-tan-500"
      />
      <CommandList className="max-h-96 bg-tan-400">
        {!hasMinLength ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Type at least 3 characters to search
          </div>
        ) : isLoading ? (
          renderLoadingSkeleton()
        ) : isEmpty ? (
          renderEmptyState()
        ) : (
          <>
            {renderGroup('pages', groupedResults.pages)}
            {renderGroup('blog_posts', groupedResults.blog_posts)}
            {renderGroup('events', groupedResults.events)}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export default GlobalSearchDialog;