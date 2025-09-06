'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronRight, 
  Home, 
  Package,
  MoreHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tables } from '@/lib/database/types';
import * as LucideIcons from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ProductCategory = Tables<'product_categories'>;

export interface CategoryWithAncestors extends ProductCategory {
  ancestors?: ProductCategory[];
  product_count?: number;
}

interface CategoryBreadcrumbProps {
  category?: ProductCategory | null;
  ancestors?: ProductCategory[];
  rootLabel?: string;
  showRoot?: boolean;
  showProductCount?: boolean;
  showInactiveIndicator?: boolean;
  maxItems?: number;
  onCategoryClick?: (category: ProductCategory | null) => void;
  onRootClick?: () => void;
  className?: string;
  itemClassName?: string;
  separatorClassName?: string;
  responsive?: boolean;
}

export function CategoryBreadcrumb({
  category = null,
  ancestors = [],
  rootLabel = 'All Categories',
  showRoot = true,
  showProductCount = false,
  showInactiveIndicator = true,
  maxItems = 4,
  onCategoryClick,
  onRootClick,
  className,
  itemClassName,
  separatorClassName,
  responsive = true,
}: CategoryBreadcrumbProps) {
  // Get icon component
  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[iconName];
    return IconComponent && typeof IconComponent === 'function' ? IconComponent : null;
  };

  // Build full breadcrumb path
  const buildBreadcrumbPath = () => {
    const path: (ProductCategory | null)[] = [];
    
    if (showRoot) {
      path.push(null); // Represents root/home
    }
    
    // Add ancestors
    path.push(...ancestors);
    
    // Add current category
    if (category) {
      path.push(category);
    }
    
    return path;
  };

  const fullPath = buildBreadcrumbPath();
  
  // Handle truncation if there are too many items
  const shouldTruncate = fullPath.length > maxItems;
  const visiblePath = shouldTruncate 
    ? [
        ...fullPath.slice(0, 1), // Always show root
        'truncated' as const,
        ...fullPath.slice(-(maxItems - 2)) // Show last items
      ]
    : fullPath;

  // Render individual breadcrumb item
  const renderBreadcrumbItem = (
    item: ProductCategory | null | 'truncated', 
    index: number, 
    isLast: boolean
  ) => {
    if (item === 'truncated') {
      const hiddenItems = fullPath.slice(1, -(maxItems - 2));
      
      return (
        <DropdownMenu key="truncated">
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-auto px-2 py-1 text-sm font-normal hover:bg-gradient-primary-50',
                itemClassName
              )}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {hiddenItems.map((hiddenItem) => {
              if (!hiddenItem) return null;
              
              const IconComponent = getIconComponent(hiddenItem.icon);
              
              return (
                <DropdownMenuItem
                  key={hiddenItem.id}
                  onClick={() => onCategoryClick?.(hiddenItem)}
                  className="cursor-pointer"
                  disabled={!hiddenItem.is_active}
                >
                  <div className="flex items-center gap-2">
                    {IconComponent ? (
                      <IconComponent 
                        className="h-4 w-4" 
                        style={{ color: hiddenItem.color || undefined }} 
                      />
                    ) : (
                      <Package className="h-4 w-4 text-gray-500" />
                    )}
                    <span className={cn(
                      !hiddenItem.is_active && 'text-gray-500 line-through'
                    )}>
                      {hiddenItem.name}
                    </span>
                    {showInactiveIndicator && !hiddenItem.is_active && (
                      <EyeOff className="h-3 w-3 text-gray-500" />
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    const isRoot = item === null;
    const isClickable = (isRoot && onRootClick) || (!isRoot && onCategoryClick);
    
    if (isRoot) {
      const content = (
        <div className="flex items-center gap-2">
          <Home className="h-3 w-3" />
          <span>{rootLabel}</span>
        </div>
      );

      return (
        <div key="root" className="flex items-center">
          {isClickable ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRootClick}
              className={cn(
                'h-auto px-2 py-1 text-sm font-normal hover:bg-gradient-primary-50',
                isLast && 'font-medium',
                itemClassName
              )}
            >
              {content}
            </Button>
          ) : (
            <div className={cn(
              'px-2 py-1 text-sm',
              isLast && 'font-medium text-gray-900',
              !isLast && 'text-gray-500',
              itemClassName
            )}>
              {content}
            </div>
          )}
        </div>
      );
    }

    if (!item) return null;

    const IconComponent = getIconComponent(item.icon);
    
    const content = (
      <div className="flex items-center gap-2">
        {IconComponent ? (
          <IconComponent 
            className="h-3 w-3" 
            style={{ color: item.color || undefined }} 
          />
        ) : (
          <Package className="h-3 w-3 text-gray-500" />
        )}
        
        <span className={cn(
          showInactiveIndicator && !item.is_active && 'line-through'
        )}>
          {item.name}
        </span>
        
        {showProductCount && item.product_count !== undefined && item.product_count > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
            {item.product_count}
          </Badge>
        )}
        
        {showInactiveIndicator && !item.is_active && (
          <EyeOff className="h-3 w-3 text-gray-500" />
        )}
      </div>
    );

    const itemElement = isClickable ? (
      <TooltipProvider key={item.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCategoryClick?.(item)}
              disabled={!item.is_active}
              className={cn(
                'h-auto px-2 py-1 text-sm font-normal hover:bg-gradient-primary-50 max-w-48',
                isLast && 'font-medium',
                !item.is_active && 'opacity-60',
                itemClassName
              )}
            >
              <div className="truncate">
                {content}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{item.name}</div>
              {item.description && (
                <div className="text-xs text-gray-500 max-w-64">
                  {item.description}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <div 
        key={item.id}
        className={cn(
          'px-2 py-1 text-sm max-w-48',
          isLast && 'font-medium text-gray-900',
          !isLast && 'text-gray-500',
          !item.is_active && 'opacity-60',
          itemClassName
        )}
      >
        <div className="truncate">
          {content}
        </div>
      </div>
    );

    return itemElement;
  };

  // Don't render if no path to show
  if (visiblePath.length === 0 || (visiblePath.length === 1 && !showRoot)) {
    return null;
  }

  const containerClasses = cn(
    'flex items-center gap-1 text-sm',
    responsive && 'flex-wrap sm:flex-nowrap',
    className
  );

  return (
    <nav aria-label="Category breadcrumb" className={containerClasses}>
      {visiblePath.map((item, index) => {
        const isLast = index === visiblePath.length - 1;
        
        return (
          <React.Fragment key={item === null ? 'root' : item === 'truncated' ? 'truncated' : item.id}>
            {renderBreadcrumbItem(item, index, isLast)}
            
            {!isLast && (
              <Separator 
                orientation="vertical" 
                className={cn(
                  'h-4 mx-1',
                  separatorClassName
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Convenience component for when you just have a single category with ancestors
interface CategoryPathProps {
  category: CategoryWithAncestors;
  rootLabel?: string;
  showRoot?: boolean;
  showProductCount?: boolean;
  maxItems?: number;
  onCategoryClick?: (category: ProductCategory | null) => void;
  onRootClick?: () => void;
  className?: string;
  responsive?: boolean;
}

export function CategoryPath({
  category,
  rootLabel = 'All Categories',
  showRoot = true,
  showProductCount = false,
  maxItems = 4,
  onCategoryClick,
  onRootClick,
  className,
  responsive = true,
}: CategoryPathProps) {
  return (
    <CategoryBreadcrumb
      category={category}
      ancestors={category.ancestors || []}
      rootLabel={rootLabel}
      showRoot={showRoot}
      showProductCount={showProductCount}
      maxItems={maxItems}
      onCategoryClick={onCategoryClick}
      onRootClick={onRootClick}
      className={className}
      responsive={responsive}
    />
  );
}