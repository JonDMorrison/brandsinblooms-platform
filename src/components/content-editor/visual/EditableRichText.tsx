'use client';

/**
 * Enhanced editable rich text component that integrates with the visual editor system
 * Uses InlineRichTextEditor for actual editing functionality
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useVisualEditor } from '@/src/contexts/VisualEditorContext';
import { InlineRichTextEditor } from './InlineRichTextEditor';
import { cn } from '@/src/lib/utils';

interface EditableRichTextProps {
  /** Section key for organization */
  sectionKey: string;
  /** Field path for content updates (e.g., "sections.hero.data.title") */
  fieldPath: string;
  /** Current content value */
  content: string;
  /** Callback when content changes */
  onContentChange?: (fieldPath: string, content: string) => void;
  /** Format type - determines available formatting options */
  format?: 'simple' | 'rich';
  /** HTML element type for semantic rendering */
  as?: keyof JSX.IntrinsicElements;
  /** CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Placeholder text */
  placeholder?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Auto-focus when entering edit mode */
  autoFocus?: boolean;
  /** Children to render when not in edit mode */
  children?: React.ReactNode;
}

export const EditableRichText: React.FC<EditableRichTextProps> = ({
  sectionKey,
  fieldPath,
  content,
  onContentChange,
  format = 'rich',
  as: Component = 'div',
  className,
  style,
  placeholder = 'Click to edit...',
  ariaLabel,
  autoFocus = false,
  children
}) => {
  const {
    activeElement,
    hoveredElement,
    showOverlay,
    setActiveElement,
    setHoveredElement,
    registerElement,
    unregisterElement,
    updateElementContent
  } = useVisualEditor();

  const elementRef = useRef<HTMLElement>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [elementId, setElementId] = useState<string>('');

  // Generate consistent element ID
  const generateElementId = useCallback(() => {
    return `${sectionKey}:${fieldPath.replace(/\./g, '_')}`;
  }, [sectionKey, fieldPath]);

  // Check if this element is currently active or hovered
  const isActive = activeElement?.fieldPath === fieldPath;
  const isHovered = hoveredElement?.fieldPath === fieldPath;
  const isEditing = isActive && showOverlay;

  // Register element with visual editor context
  useEffect(() => {
    const element = elementRef.current;
    if (!element || isRegistered) return;

    const id = generateElementId();
    setElementId(id);

    const editableElement = {
      id,
      sectionKey,
      fieldPath,
      type: 'rich-text' as const,
      element,
      bounds: element.getBoundingClientRect()
    };

    registerElement(editableElement);
    setIsRegistered(true);

    return () => {
      unregisterElement(id);
      setIsRegistered(false);
    };
  }, [sectionKey, fieldPath, generateElementId, registerElement, unregisterElement, isRegistered]);

  // Handle mouse events for visual editor interaction
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!showOverlay) return;

    e.preventDefault();
    e.stopPropagation();

    const element = elementRef.current;
    if (!element) return;

    const editableElement = {
      id: elementId,
      sectionKey,
      fieldPath,
      type: 'rich-text' as const,
      element,
      bounds: element.getBoundingClientRect()
    };

    setActiveElement(editableElement);
  }, [showOverlay, elementId, sectionKey, fieldPath, setActiveElement]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (!showOverlay) return;

    const element = elementRef.current;
    if (!element) return;

    const editableElement = {
      id: elementId,
      sectionKey,
      fieldPath,
      type: 'rich-text' as const,
      element,
      bounds: element.getBoundingClientRect()
    };

    setHoveredElement(editableElement);
  }, [showOverlay, elementId, sectionKey, fieldPath, setHoveredElement]);

  const handleMouseLeave = useCallback(() => {
    if (!showOverlay) return;
    setHoveredElement(null);
  }, [showOverlay, setHoveredElement]);

  // Handle content updates
  const handleContentUpdate = useCallback((newContent: string) => {
    // Call the provided callback
    onContentChange?.(fieldPath, newContent);
    
    // Also update through visual editor context for auto-save
    updateElementContent(elementId, newContent);
  }, [fieldPath, onContentChange, updateElementContent, elementId]);

  // If we're in editing mode, render the rich text editor
  if (isEditing) {
    return (
      <InlineRichTextEditor
        content={content}
        onUpdate={handleContentUpdate}
        isEnabled={true}
        fieldPath={fieldPath}
        sectionKey={sectionKey}
        format={format}
        className={cn(className, 'editing')}
        style={style}
        placeholder={placeholder}
        as={as}
        ariaLabel={ariaLabel}
        showToolbar={true}
        debounceDelay={500}
      />
    );
  }

  // Otherwise, render the static content with visual editor interactions
  return (
    <Component
      ref={elementRef as any}
      className={cn(
        'editable-rich-text',
        showOverlay && [
          'cursor-text transition-all duration-200',
          isHovered && [
            'bg-gradient-to-r from-primary/5 to-primary/10',
            'outline outline-2 outline-primary/20 outline-offset-1',
            'rounded-sm'
          ]
        ],
        className
      )}
      style={style}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-editable={showOverlay}
      data-field={fieldPath}
      data-section={sectionKey}
      data-edit-type="rich-text"
      data-placeholder={placeholder}
      data-active={isActive}
      data-hovered={isHovered}
      role={showOverlay ? 'button' : undefined}
      tabIndex={showOverlay ? 0 : undefined}
      aria-label={showOverlay ? `Edit ${ariaLabel || fieldPath}` : undefined}
    >
      {children || (
        <div
          dangerouslySetInnerHTML={{ __html: content || '' }}
          className={cn(
            // Ensure rich text content is styled properly
            'prose prose-sm max-w-none',
            '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0'
          )}
        />
      )}
      
      {/* Empty state */}
      {showOverlay && (!content || content === '<p></p>' || content.trim() === '') && !children && (
        <div className="text-gray-400 italic">
          {placeholder}
        </div>
      )}

      {/* Visual editor styles */}
      {showOverlay && (
        <>
          <style jsx>{`
            .editable-rich-text:hover::after {
              content: 'Click to edit rich text';
              position: absolute;
              top: -22px;
              right: 0;
              font-size: 9px;
              font-weight: 500;
              color: rgba(139, 92, 246, 0.7);
              background: rgba(139, 92, 246, 0.1);
              padding: 2px 6px;
              border-radius: 3px;
              border: 1px solid rgba(139, 92, 246, 0.2);
              white-space: nowrap;
              z-index: 20;
              opacity: 0;
              animation: fadeInTooltip 0.2s ease forwards;
            }
            
            @keyframes fadeInTooltip {
              from { opacity: 0; transform: translateY(-2px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            .editable-rich-text[data-active="true"] {
              background: rgba(139, 92, 246, 0.1) !important;
              outline: 2px solid rgba(139, 92, 246, 0.5) !important;
              outline-offset: 2px;
              border-radius: 4px;
            }
          `}</style>
        </>
      )}
    </Component>
  );
};