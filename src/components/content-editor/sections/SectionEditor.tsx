'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionEditorProps } from '@/types/content-editor';
import { SectionHeader } from './SectionHeader';

/**
 * Section editor wrapper component with collapsible content
 * Provides section management and content organization
 */
export function SectionEditor({
  section,
  onSectionChange,
  children,
  className,
  collapsible = true,
  defaultCollapsed = false,
  showHeader = true,
  headerActions,
}: SectionEditorProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const handleVisibilityChange = React.useCallback((visible: boolean) => {
    onSectionChange({
      ...section,
      isVisible: visible,
    });
  }, [section, onSectionChange]);

  const handleTitleChange = React.useCallback((title: string) => {
    onSectionChange({
      ...section,
      title: title,
    });
  }, [section, onSectionChange]);

  const toggleCollapse = React.useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const headerActionsWithCollapse = React.useMemo(() => {
    if (!collapsible && !headerActions) return undefined;

    return (
      <div className="flex items-center gap-1">
        {headerActions}
        {collapsible && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand section" : "Collapse section"}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    );
  }, [collapsible, headerActions, isCollapsed, toggleCollapse]);

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200",
      !section.isVisible && "opacity-60 bg-muted/20",
      className
    )}>
      {showHeader && (
        <SectionHeader
          title={section.title}
          isVisible={section.isVisible}
          onVisibilityChange={handleVisibilityChange}
          onTitleChange={handleTitleChange}
          isDragHandle={false} // TODO: Implement drag and drop in future
          showDragHandle={true}
          actions={headerActionsWithCollapse}
          className={cn(
            !section.isVisible && "bg-muted/50",
            isCollapsed && collapsible && "border-b-0"
          )}
        />
      )}

      {/* Collapsible Content */}
      <div className={cn(
        "transition-all duration-200 ease-in-out overflow-hidden",
        isCollapsed && collapsible ? "max-h-0" : "max-h-none"
      )}>
        <CardContent className={cn(
          "p-0",
          !section.isVisible && "pointer-events-none"
        )}>
          {/* Content Warning for Hidden Sections */}
          {!section.isVisible && (
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-200">
              <p className="text-sm text-amber-800">
                This section is hidden and will not be visible to visitors.
                Enable visibility to make it accessible.
              </p>
            </div>
          )}

          {/* Main Content */}
          <div className={cn(
            "transition-opacity duration-200",
            !section.isVisible && "opacity-50"
          )}>
            {children}
          </div>
        </CardContent>
      </div>

      {/* Collapsed State Indicator */}
      {isCollapsed && collapsible && (
        <div className="px-6 py-2 bg-muted/30 border-t">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Section content is collapsed
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={toggleCollapse}
            >
              Expand
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}