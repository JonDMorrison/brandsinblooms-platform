'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Edit2, 
  Check, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeaderProps } from '@/types/content-editor';

/**
 * Section header component for managing section visibility and title
 * Includes drag handle preparation for future drag-and-drop functionality
 */
export function SectionHeader({
  title,
  isVisible,
  onVisibilityChange,
  onTitleChange,
  isDragHandle = false,
  showDragHandle = true,
  className,
  actions,
}: SectionHeaderProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Reset edit value when title changes from outside
  React.useEffect(() => {
    setEditValue(title);
  }, [title]);

  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = React.useCallback(() => {
    if (onTitleChange) {
      setIsEditing(true);
    }
  }, [onTitleChange]);

  const handleSaveEdit = React.useCallback(() => {
    if (onTitleChange && editValue.trim() !== title) {
      onTitleChange(editValue.trim());
    }
    setIsEditing(false);
  }, [onTitleChange, editValue, title]);

  const handleCancelEdit = React.useCallback(() => {
    setEditValue(title);
    setIsEditing(false);
  }, [title]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  const handleVisibilityToggle = React.useCallback((checked: boolean) => {
    onVisibilityChange(checked);
  }, [onVisibilityChange]);

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 border-b bg-muted/30",
      className
    )}>
      {/* Drag Handle */}
      {showDragHandle && (
        <div 
          className={cn(
            "flex items-center justify-center p-1 rounded hover:bg-gradient-primary-50",
            isDragHandle && "cursor-grab active:cursor-grabbing",
            !isDragHandle && "cursor-default opacity-50"
          )}
          title={isDragHandle ? "Drag to reorder" : "Drag handle (coming soon)"}
        >
          <GripVertical className="h-4 w-4 text-gray-500" />
        </div>
      )}

      {/* Title Section */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Label htmlFor="section-title-edit" className="sr-only">
              Section Title
            </Label>
            <Input
              ref={inputRef}
              id="section-title-edit"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEdit}
              className="h-8 text-sm font-medium"
              placeholder="Section title..."
            />
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleSaveEdit}
                title="Save changes"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleCancelEdit}
                title="Cancel editing"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium truncate">
              {title || 'Untitled Section'}
            </h3>
            {onTitleChange && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                onClick={handleStartEdit}
                title="Edit section title"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Visibility Toggle */}
      <div className="flex items-center gap-2">
        <Label htmlFor={`visibility-${title}`} className="sr-only">
          Section Visibility
        </Label>
        <div className="flex items-center gap-2 text-sm">
          <span className={cn(
            "text-xs font-medium",
            isVisible ? "text-emerald-600" : "text-gray-500"
          )}>
            {isVisible ? 'Visible' : 'Hidden'}
          </span>
          <Switch
            id={`visibility-${title}`}
            checked={isVisible}
            onCheckedChange={handleVisibilityToggle}
            className="scale-75"
            title={isVisible ? "Hide section" : "Show section"}
          />
          <div className="w-4 flex justify-center">
            {isVisible ? (
              <Eye className="h-4 w-4 text-emerald-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* Additional Actions */}
      {actions && (
        <div className="flex items-center gap-1">
          {actions}
        </div>
      )}
    </div>
  );
}