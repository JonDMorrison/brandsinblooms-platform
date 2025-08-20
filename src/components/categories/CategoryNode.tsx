'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronDown, 
  GripVertical, 
  Edit, 
  Trash2,
  Eye,
  EyeOff,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tables } from '@/lib/database/types';
import * as LucideIcons from 'lucide-react';

type ProductCategory = Tables<'product_categories'>;

export interface CategoryWithChildren extends ProductCategory {
  children?: CategoryWithChildren[];
  product_count?: number;
}

interface CategoryNodeProps {
  category: CategoryWithChildren;
  level?: number;
  isExpanded?: boolean;
  isSelected?: boolean;
  isDragOverlay?: boolean;
  onToggleExpand?: (categoryId: string) => void;
  onEdit?: (category: ProductCategory) => void;
  onDelete?: (category: ProductCategory) => void;
  onSelect?: (category: ProductCategory) => void;
  className?: string;
}

export function CategoryNode({
  category,
  level = 0,
  isExpanded = false,
  isSelected = false,
  isDragOverlay = false,
  onToggleExpand,
  onEdit,
  onDelete,
  onSelect,
  className,
}: CategoryNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    data: {
      type: 'category',
      category,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = category.children && category.children.length > 0;
  const productCount = category.product_count || 0;
  
  // Get icon component
  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[iconName];
    return IconComponent && typeof IconComponent === 'function' ? IconComponent : null;
  };

  const IconComponent = getIconComponent(category.icon);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren && onToggleExpand) {
      onToggleExpand(category.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(category);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(category);
  };

  const handleSelect = () => {
    onSelect?.(category);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative',
        isDragOverlay && 'shadow-lg border border-primary rounded-lg bg-background',
        isDragging && 'opacity-50',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-muted/50',
          'border border-transparent hover:border-muted-foreground/20',
          isSelected && 'bg-primary/10 border-primary/20',
          !category.is_active && 'opacity-60'
        )}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Drag Handle */}
        <div
          className={cn(
            'opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing',
            'flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-foreground',
            isDragOverlay && 'opacity-100'
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-6 w-6 p-0 hover:bg-muted',
            !hasChildren && 'invisible'
          )}
          onClick={handleToggleExpand}
          disabled={!hasChildren}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          )}
        </Button>

        {/* Category Icon */}
        <div className="flex items-center justify-center w-5 h-5">
          {IconComponent ? (
            <IconComponent className="h-4 w-4" style={{ color: category.color || undefined }} />
          ) : (
            <Package className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Category Name */}
        <span 
          className={cn(
            'flex-1 text-sm font-medium truncate',
            !category.is_active && 'line-through text-muted-foreground'
          )}
          title={category.name}
        >
          {category.name}
        </span>

        {/* Product Count Badge */}
        {productCount > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
            {productCount}
          </Badge>
        )}

        {/* Active Status Indicator */}
        <div className="flex items-center">
          {category.is_active ? (
            <Eye className="h-3 w-3 text-green-600" title="Active" />
          ) : (
            <EyeOff className="h-3 w-3 text-muted-foreground" title="Inactive" />
          )}
        </div>

        {/* Action Buttons */}
        <div className={cn(
          'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isDragOverlay && 'opacity-100'
        )}>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={handleEdit}
              title="Edit category"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleDelete}
              title="Delete category"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Color indicator bar */}
      {category.color && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ backgroundColor: category.color }}
        />
      )}
    </div>
  );
}