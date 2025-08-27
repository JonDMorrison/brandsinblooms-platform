'use client';

/**
 * Enhanced content renderer with inline editing support
 * Conditionally renders either standard content or inline editable content
 */

import React, { memo } from 'react';
import { ContentRenderer } from './ContentRenderer';
import { InlineTextEditor } from '@/components/content-editor/InlineTextEditor';
import { useIsInlineEditEnabled } from '@/contexts/EditModeContext';

interface EditableContentRendererProps {
  content: string;
  onUpdate?: (content: string) => void;
  fieldPath: string;
  format?: 'plain' | 'rich';
  className?: string;
  placeholder?: string;
  forceReadOnly?: boolean; // Override inline edit mode for specific fields
}

const EditableContentRendererComponent = ({
  content,
  onUpdate,
  fieldPath,
  format = 'rich',
  className = '',
  placeholder = 'Click to edit...',
  forceReadOnly = false
}: EditableContentRendererProps) => {
  const isInlineEditEnabled = useIsInlineEditEnabled();
  const canEdit = isInlineEditEnabled && !forceReadOnly && onUpdate;
  
  // If inline editing is enabled and we have an update handler, use InlineTextEditor
  if (canEdit) {
    return (
      <InlineTextEditor
        content={content}
        onUpdate={onUpdate}
        isEnabled={true}
        fieldPath={fieldPath}
        format={format}
        className={className}
        placeholder={placeholder}
        debounceDelay={500}
      />
    );
  }
  
  // Otherwise, use standard ContentRenderer
  return <ContentRenderer content={content} className={className} />;
};

// Memoize to prevent unnecessary re-renders
export const EditableContentRenderer = memo(EditableContentRendererComponent, (prevProps, nextProps) => {
  return (
    prevProps.content === nextProps.content &&
    prevProps.fieldPath === nextProps.fieldPath &&
    prevProps.format === nextProps.format &&
    prevProps.className === nextProps.className &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.forceReadOnly === nextProps.forceReadOnly
  );
});

EditableContentRenderer.displayName = 'EditableContentRenderer';