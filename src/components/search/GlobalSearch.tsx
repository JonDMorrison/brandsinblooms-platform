'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, PenSquare, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './GlobalSearch.module.css';
import { useGlobalSearchWithKeyboard, SearchResult } from '@/hooks/useGlobalSearch';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  onNavigate?: () => void; // For mobile dialog closing
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

export function GlobalSearch({ placeholder = "Search content...", className, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    data: results,
    isLoading,
    isEmpty,
    hasMinLength,
    selectedIndex,
    handleKeyDown,
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
      onNavigate?.();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    clearSelection();
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(value.length > 0);
  };

  const handleFocus = () => {
    if (query.length > 0) {
      setIsOpen(true);
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      if (isOpen) {
        handleKeyDown(e);
      }
    };

    document.addEventListener('keydown', handleKeyDownEvent);
    return () => {
      document.removeEventListener('keydown', handleKeyDownEvent);
    };
  }, [isOpen, handleKeyDown]);

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
        <Search className="h-8 w-8 text-gray-500 mb-2" />
        <p className="text-sm text-gray-500">
          No content found for "{query}"
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Try adjusting your search terms
        </p>
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
                isSelected && "bg-gray-100 text-white"
              )}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {result.title}
                </div>
                {result.excerpt && (
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
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
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          className={cn(
            "w-full pl-10 pr-10 py-2 border border-input bg-white rounded-md",
            "text-sm placeholder:text-gray-500",
            "focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "transition-colors"
          )}
        />
        {query && (
          <button
            onClick={handleClose}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50">
          <div className={cn("border border-border rounded-md shadow-lg overflow-hidden", styles.searchDropdown)}>
            <Command>
            <CommandList className="max-h-96">
              {!hasMinLength ? (
                <div className="py-6 text-center text-sm text-gray-500">
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
          </Command>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;