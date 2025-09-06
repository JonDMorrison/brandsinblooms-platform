'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CategoryNode, CategoryWithChildren } from './CategoryNode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  FolderTree, 
  Filter,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tables } from '@/lib/database/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ProductCategory = Tables<'product_categories'>;

interface CategoryTreeProps {
  categories: CategoryWithChildren[];
  loading?: boolean;
  error?: string | null;
  selectedCategory?: ProductCategory | null;
  expandedCategories?: Set<string>;
  searchQuery?: string;
  showInactive?: boolean;
  className?: string;
  onCategorySelect?: (category: ProductCategory) => void;
  onCategoryEdit?: (category: ProductCategory) => void;
  onCategoryDelete?: (category: ProductCategory) => void;
  onCategoryReorder?: (reorderData: ReorderItem[]) => void;
  onCreateCategory?: (parentId?: string) => void;
  onSearchChange?: (query: string) => void;
  onToggleInactive?: (show: boolean) => void;
  onExpandedChange?: (expanded: Set<string>) => void;
}

interface ReorderItem {
  id: string;
  sort_order: number;
  parent_id?: string | null;
}

const measuringConfig = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

export function CategoryTree({
  categories,
  loading = false,
  error = null,
  selectedCategory = null,
  expandedCategories = new Set(),
  searchQuery = '',
  showInactive = false,
  className,
  onCategorySelect,
  onCategoryEdit,
  onCategoryDelete,
  onCategoryReorder,
  onCreateCategory,
  onSearchChange,
  onToggleInactive,
  onExpandedChange,
}: CategoryTreeProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<CategoryWithChildren | null>(null);
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(expandedCategories);
  const [internalSearch, setInternalSearch] = useState(searchQuery);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  // Use controlled or uncontrolled state for expanded categories
  const currentExpanded = onExpandedChange ? expandedCategories : internalExpanded;
  const currentSearch = onSearchChange ? searchQuery : internalSearch;

  // Filter categories based on search and active status
  const filteredCategories = useMemo(() => {
    const filterCategory = (category: CategoryWithChildren): CategoryWithChildren | null => {
      const matchesSearch = !currentSearch || 
        category.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
        category.description?.toLowerCase().includes(currentSearch.toLowerCase());
      
      const matchesActiveFilter = showInactive || category.is_active;
      
      // Filter children recursively
      const filteredChildren = category.children
        ?.map(child => filterCategory(child))
        .filter(Boolean) as CategoryWithChildren[] | undefined;
      
      // Include category if it matches filters or has matching children
      const shouldInclude = (matchesSearch && matchesActiveFilter) || 
        (filteredChildren && filteredChildren.length > 0);
      
      if (!shouldInclude) return null;
      
      return {
        ...category,
        children: filteredChildren,
      };
    };

    return categories
      .map(category => filterCategory(category))
      .filter(Boolean) as CategoryWithChildren[];
  }, [categories, currentSearch, showInactive]);

  // Flatten categories for drag and drop
  const flattenedCategories = useMemo(() => {
    const flatten = (cats: CategoryWithChildren[], parentId: string | null = null): CategoryWithChildren[] => {
      return cats.reduce<CategoryWithChildren[]>((acc, category) => {
        acc.push({ ...category, parent_id: parentId });
        if (category.children && currentExpanded.has(category.id)) {
          acc.push(...flatten(category.children, category.id));
        }
        return acc;
      }, []);
    };
    return flatten(filteredCategories);
  }, [filteredCategories, currentExpanded]);

  const handleToggleExpand = useCallback((categoryId: string) => {
    const newExpanded = new Set(currentExpanded);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    
    if (onExpandedChange) {
      onExpandedChange(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  }, [currentExpanded, onExpandedChange]);

  const handleSearchChange = useCallback((query: string) => {
    if (onSearchChange) {
      onSearchChange(query);
    } else {
      setInternalSearch(query);
    }
  }, [onSearchChange]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const category = flattenedCategories.find(cat => cat.id === active.id);
    if (category) {
      setDraggedCategory(category);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic if needed for visual feedback
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedCategory(null);
    
    if (!over || active.id === over.id) {
      return;
    }

    if (onCategoryReorder) {
      // Calculate new positions and reorder data
      const activeIndex = flattenedCategories.findIndex(cat => cat.id === active.id);
      const overIndex = flattenedCategories.findIndex(cat => cat.id === over.id);
      
      if (activeIndex === -1 || overIndex === -1) return;
      
      // Create reorder data based on the new positions
      const reorderData: ReorderItem[] = [];
      const newOrder = [...flattenedCategories];
      const [removed] = newOrder.splice(activeIndex, 1);
      newOrder.splice(overIndex, 0, removed);
      
      newOrder.forEach((category, index) => {
        reorderData.push({
          id: category.id,
          sort_order: index,
          parent_id: category.parent_id,
        });
      });
      
      onCategoryReorder(reorderData);
    }
  };

  const renderCategoryTree = (categories: CategoryWithChildren[], level = 0) => {
    return categories.map(category => {
      const isExpanded = currentExpanded.has(category.id);
      const isSelected = selectedCategory?.id === category.id;
      
      return (
        <div key={category.id}>
          <CategoryNode
            category={category}
            level={level}
            isExpanded={isExpanded}
            isSelected={isSelected}
            onToggleExpand={handleToggleExpand}
            onEdit={onCategoryEdit}
            onDelete={onCategoryDelete}
            onSelect={onCategorySelect}
          />
          {isExpanded && category.children && category.children.length > 0 && (
            <div className="mt-1">
              {renderCategoryTree(category.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const totalCategories = categories.length;
  const activeCategories = categories.filter(cat => cat.is_active).length;
  const totalProducts = categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0);

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Error Loading Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Categories
            </CardTitle>
            <CardDescription>
              {totalCategories} categories ({activeCategories} active) • {totalProducts} products
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Display Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onToggleInactive?.(!showInactive)}>
                  {showInactive ? 'Hide' : 'Show'} Inactive Categories
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const allIds = new Set(flattenedCategories.map(cat => cat.id));
                  if (onExpandedChange) {
                    onExpandedChange(allIds);
                  } else {
                    setInternalExpanded(allIds);
                  }
                }}>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Expand All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (onExpandedChange) {
                    onExpandedChange(new Set());
                  } else {
                    setInternalExpanded(new Set());
                  }
                }}>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Collapse All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {onCreateCategory && (
              <Button size="sm" onClick={() => onCreateCategory()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            )}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search categories..."
            value={currentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Active filters */}
        {(currentSearch || showInactive) && (
          <div className="flex items-center gap-2 flex-wrap">
            {currentSearch && (
              <Badge variant="secondary" className="text-xs">
                Search: {currentSearch}
              </Badge>
            )}
            {showInactive && (
              <Badge variant="secondary" className="text-xs">
                Including inactive
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Loading categories...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <FolderTree className="h-8 w-8 text-gray-500 mb-2" />
              <p className="text-sm font-medium">No categories found</p>
              <p className="text-xs text-gray-500">
                {currentSearch ? 'Try adjusting your search terms' : 'Get started by creating your first category'}
              </p>
              {!currentSearch && onCreateCategory && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => onCreateCategory()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              )}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              measuring={measuringConfig}
            >
              <SortableContext
                items={flattenedCategories.map(cat => cat.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {renderCategoryTree(filteredCategories)}
                </div>
              </SortableContext>
              
              <DragOverlay>
                {draggedCategory && (
                  <CategoryNode
                    category={draggedCategory}
                    isDragOverlay
                    className="shadow-lg"
                  />
                )}
              </DragOverlay>
            </DndContext>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}