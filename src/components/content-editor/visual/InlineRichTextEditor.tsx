'use client';

/**
 * Enhanced inline rich text editor for visual WYSIWYG editing
 * Integrates with VisualEditorContext and provides full rich text capabilities
 */

import React, { useState, useRef, useCallback, memo, useEffect, useMemo } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import { useDebounceCallback } from '@/hooks/useDebounce';
import { cn } from '@/src/lib/utils';
import { FloatingToolbar } from './FloatingToolbar';
import { useVisualEditor } from '@/src/contexts/VisualEditorContext';

export interface InlineRichTextEditorProps {
  /** The content to edit */
  content: string;
  /** Callback when content changes */
  onUpdate: (content: string) => void;
  /** Whether editing is enabled */
  isEnabled: boolean;
  /** Field path for the content (e.g., "sections.hero.data.title") */
  fieldPath: string;
  /** Section key for visual editor integration */
  sectionKey: string;
  /** Content format - 'rich' supports all formatting, 'simple' supports basic formatting */
  format?: 'simple' | 'rich';
  /** CSS class for styling */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay for auto-save */
  debounceDelay?: number;
  /** Whether to show the floating toolbar */
  showToolbar?: boolean;
  /** Element type for semantic HTML */
  as?: keyof JSX.IntrinsicElements;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

const InlineRichTextEditorComponent = ({
  content,
  onUpdate,
  isEnabled,
  fieldPath,
  sectionKey,
  format = 'rich',
  className,
  style,
  placeholder = 'Click to edit...',
  debounceDelay = 500,
  showToolbar = true,
  as = 'div',
  ariaLabel
}: InlineRichTextEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  
  const elementRef = useRef<HTMLDivElement>(null);
  const toolbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMount = useRef(true);
  const savedSelection = useRef<{ from: number; to: number } | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Visual editor integration
  const { updateElementContent } = useVisualEditor();

  // Configure Tiptap extensions based on format
  const extensions = useMemo(() => {
    const baseExtensions = [
      StarterKit.configure({
        // Configure based on format
        heading: format === 'rich' ? {
          levels: [1, 2, 3, 4, 5, 6]
        } : false,
        bulletList: format === 'rich',
        orderedList: format === 'rich',
        listItem: format === 'rich',
        blockquote: format === 'rich',
        codeBlock: format === 'rich',
        code: format === 'rich',
        horizontalRule: format === 'rich',
        hardBreak: true,
        dropcursor: false,
        gapcursor: false
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
      TextStyle
    ];

    // Add rich text extensions for 'rich' format
    if (format === 'rich') {
      baseExtensions.push(
        Underline,
        Strike,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-primary underline cursor-pointer',
            rel: 'noopener noreferrer',
            target: '_blank'
          }
        }),
        Highlight.configure({
          HTMLAttributes: {
            class: 'bg-yellow-200 dark:bg-yellow-800'
          }
        })
      );
    } else if (format === 'simple') {
      // Simple format only allows basic link functionality
      baseExtensions.push(
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-primary underline cursor-pointer',
            rel: 'noopener noreferrer',
            target: '_blank'
          }
        })
      );
    }

    return baseExtensions;
  }, [format, placeholder]);

  // Create Tiptap editor with enhanced configuration
  const editor = useEditor({
    extensions,
    content,
    editable: isEditing && isEnabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        'class': cn(
          'outline-none focus:outline-none',
          'prose prose-sm max-w-none',
          '[&>*]:my-0', // Remove default margins
          // Rich text styling
          format === 'rich' && [
            '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4',
            '[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3',
            '[&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2',
            '[&_h4]:text-lg [&_h4]:font-bold [&_h4]:mb-2',
            '[&_h5]:text-base [&_h5]:font-bold [&_h5]:mb-1',
            '[&_h6]:text-sm [&_h6]:font-bold [&_h6]:mb-1',
            '[&_ul]:list-disc [&_ul]:pl-6',
            '[&_ol]:list-decimal [&_ol]:pl-6',
            '[&_li]:mb-1',
            '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic',
            '[&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded'
          ]
        ),
        'role': 'textbox',
        'aria-multiline': format === 'rich' ? 'true' : 'false',
        'aria-label': ariaLabel || `Edit ${fieldPath}`,
        'data-testid': `rich-text-editor-${fieldPath}`
      }
    },
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      debouncedUpdate(newContent);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;
      const hasContent = !editor.isEmpty;

      // Save current selection for cursor preservation
      savedSelection.current = { from, to };

      if ((hasSelection || hasContent) && isEditing && showToolbar && format !== 'simple') {
        setSelectionRange({ from, to });
        setShowFloatingToolbar(true);
      } else {
        setShowFloatingToolbar(false);
        setSelectionRange(null);
      }
    },
    onFocus: () => {
      setIsEditing(true);
    },
    onBlur: (props) => {
      // Delay blur to allow toolbar interactions
      if (toolbarTimeoutRef.current) {
        clearTimeout(toolbarTimeoutRef.current);
      }

      toolbarTimeoutRef.current = setTimeout(() => {
        const activeElement = document.activeElement;
        const isToolbarFocused = elementRef.current?.querySelector('.floating-toolbar')?.contains(activeElement);
        const isEditorFocused = elementRef.current?.contains(activeElement);

        // Check if focus is inside a Dialog portal (like ImageUploadDialog)
        const isDialogFocused = activeElement?.closest('[data-slot="dialog-overlay"], [data-slot="dialog-content"], [data-slot="dialog-portal"]');

        if (!isToolbarFocused && !isDialogFocused && !isEditorFocused) {
          setIsEditing(false);
          setShowFloatingToolbar(false);
        }
      }, 150);
    }
  });

  // Update editor content when prop changes with cursor preservation
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const currentContent = editor.getHTML();
      if (content !== currentContent) {
        // Save current selection before updating content
        const currentSelection = savedSelection.current;
        
        editor.commands.setContent(content, false);
        
        // Restore selection if it was saved and editor becomes focused
        if (currentSelection && isEditing) {
          // Use setTimeout to ensure content is updated before restoring selection
          setTimeout(() => {
            try {
              editor.commands.setTextSelection({
                from: currentSelection.from,
                to: currentSelection.to
              });
            } catch (error) {
              // If selection restoration fails, just focus at end
              editor.commands.focus('end');
            }
          }, 0);
        }
      }
    }
  }, [content, editor, isEditing]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing && isEnabled);
    }
  }, [editor, isEditing, isEnabled]);

  // Initialize editing state on first mount if content is empty
  useEffect(() => {
    if (isFirstMount.current && isEnabled && (!content || content.trim() === '')) {
      isFirstMount.current = false;
      // Don't auto-focus empty fields to avoid UX issues
    } else {
      isFirstMount.current = false;
    }
  }, [isEnabled, content]);

  // Debounced update function
  const debouncedUpdate = useDebounceCallback((newContent: string) => {
    if (newContent !== content) {
      onUpdate(newContent);
      // Also notify visual editor context for auto-save
      updateElementContent(fieldPath, newContent);
    }
  }, debounceDelay);

  // Handle container click for editing activation with improved focus management
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (isEnabled && !isEditing) {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);

      // Clear any existing focus timeout
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }

      // Focus editor after state update with better positioning
      focusTimeoutRef.current = setTimeout(() => {
        if (editor) {
          // Try to position cursor where user clicked
          const rect = elementRef.current?.getBoundingClientRect();
          if (rect) {
            const relativeX = e.clientX - rect.left;
            const relativeY = e.clientY - rect.top;
            
            // Use Tiptap's coordsAtPos to position cursor more precisely
            try {
              const pos = editor.view.posAtCoords({
                left: e.clientX,
                top: e.clientY
              });
              
              if (pos) {
                editor.commands.setTextSelection(pos.pos);
                editor.commands.focus();
              } else {
                editor.commands.focus('end');
              }
            } catch (error) {
              // Fallback to focusing at end
              editor.commands.focus('end');
            }
          } else {
            editor.commands.focus('end');
          }
        }
      }, 0);
    }
  }, [isEnabled, isEditing, editor]);

  // Handle keyboard shortcuts and navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Escape key exits editing mode
    if (e.key === 'Escape' && isEditing) {
      e.preventDefault();
      editor?.commands.blur();
      setIsEditing(false);
      setShowFloatingToolbar(false);
      return;
    }

    // Global keyboard shortcuts (when editing)
    if (isEditing && editor && (e.ctrlKey || e.metaKey)) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          editor.chain().focus().toggleBold().run();
          break;
        case 'i':
          e.preventDefault();
          editor.chain().focus().toggleItalic().run();
          break;
        case 'u':
          if (format === 'rich') {
            e.preventDefault();
            editor.chain().focus().toggleUnderline().run();
          }
          break;
        case 'k':
          if (format === 'rich' || format === 'simple') {
            e.preventDefault();
            // This will be handled by the FloatingToolbar
            setShowFloatingToolbar(true);
          }
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            editor.chain().focus().redo().run();
          } else {
            e.preventDefault();
            editor.chain().focus().undo().run();
          }
          break;
      }
    }
  }, [isEditing, editor, format]);

  // Cleanup timeouts and destroy editor on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts to prevent memory leaks
      if (toolbarTimeoutRef.current) {
        clearTimeout(toolbarTimeoutRef.current);
        toolbarTimeoutRef.current = null;
      }
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = null;
      }
      
      // CRITICAL: Destroy Tiptap editor to prevent memory leaks
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Don't render if editor is not ready
  if (!editor) {
    return (
      <div className={cn('min-h-[1.5em]', className)} style={style}>
        {content || placeholder}
      </div>
    );
  }

  return (
    <div
      ref={elementRef}
      className={cn(
        'inline-rich-text-editor-wrapper relative',
        // Visual states
        isEnabled && !isEditing && [
          'cursor-text',
          'hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10',
          'hover:outline hover:outline-2 hover:outline-primary/20 hover:outline-offset-1',
          'transition-all duration-200'
        ],
        isEditing && [
          'ring-2 ring-primary/50 ring-offset-2',
          'bg-white dark:bg-gray-950',
          'rounded-md',
          'shadow-sm'
        ],
        className
      )}
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
      data-editable={isEnabled}
      data-editing={isEditing}
      data-field={fieldPath}
      data-section={sectionKey}
      data-format={format}
      role={isEnabled ? 'button' : undefined}
      tabIndex={isEnabled && !isEditing ? 0 : undefined}
      aria-label={isEnabled && !isEditing ? `Click to edit ${ariaLabel || fieldPath}` : undefined}
    >
      <EditorContent
        editor={editor}
        className={cn(
          'rich-text-content',
          isEditing && 'p-2',
          // Ensure proper styling for different elements
          as === 'h1' && 'text-3xl font-bold',
          as === 'h2' && 'text-2xl font-bold',
          as === 'h3' && 'text-xl font-bold',
          as === 'h4' && 'text-lg font-bold',
          as === 'h5' && 'text-base font-bold',
          as === 'h6' && 'text-sm font-bold'
        )}
        style={style}
      />

      {/* Empty state indicator */}
      {isEnabled && !isEditing && (!content || content === '<p></p>' || content.trim() === '') && (
        <div className="absolute inset-0 flex items-center text-gray-400 italic pointer-events-none">
          {placeholder}
        </div>
      )}

      {/* Enhanced floating toolbar */}
      {showFloatingToolbar && editor && format === 'rich' && (
        <FloatingToolbar
          editor={editor}
          anchorEl={elementRef.current}
          format={format}
          onClose={() => setShowFloatingToolbar(false)}
          selectionRange={selectionRange}
        />
      )}

      {/* Accessibility announcements */}
      <div className="sr-only" aria-live="polite" role="status">
        {isEditing ? 'Editing mode active. Use Escape to exit.' : ''}
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const InlineRichTextEditor = memo(InlineRichTextEditorComponent, (prevProps, nextProps) => {
  return (
    prevProps.content === nextProps.content &&
    prevProps.isEnabled === nextProps.isEnabled &&
    prevProps.fieldPath === nextProps.fieldPath &&
    prevProps.sectionKey === nextProps.sectionKey &&
    prevProps.format === nextProps.format &&
    prevProps.className === nextProps.className &&
    prevProps.style === nextProps.style &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.debounceDelay === nextProps.debounceDelay &&
    prevProps.showToolbar === nextProps.showToolbar &&
    prevProps.as === nextProps.as &&
    prevProps.ariaLabel === nextProps.ariaLabel
  );
});

InlineRichTextEditor.displayName = 'InlineRichTextEditor';