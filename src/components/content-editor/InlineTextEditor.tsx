'use client';

/**
 * Lightweight inline text editor using minimal Tiptap configuration
 * Provides click-to-edit functionality with visual indicators
 */

import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useDebounceCallback } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { FloatingToolbar } from './FloatingToolbar';
import type { Editor } from '@tiptap/react';

export interface InlineTextEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  isEnabled: boolean;
  fieldPath: string; // e.g., "sections.hero.data.title"
  format?: 'plain' | 'rich';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  debounceDelay?: number;
  showToolbar?: boolean;
}

const InlineTextEditorComponent = ({ 
  content, 
  onUpdate, 
  isEnabled, 
  fieldPath,
  format = 'plain',
  className,
  style,
  placeholder = 'Click to edit...',
  debounceDelay = 500,
  showToolbar = true
}: InlineTextEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const toolbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Lightweight Tiptap instance with minimal extensions
  const editor = useEditor({
    extensions: format === 'plain' 
      ? [
          StarterKit.configure({ 
            heading: false, 
            codeBlock: false,
            blockquote: false,
            horizontalRule: false,
            dropcursor: false,
            gapcursor: false
          }),
          Placeholder.configure({
            placeholder,
            showOnlyWhenEditable: true,
            showOnlyCurrent: false,
          })
        ]
      : [
          StarterKit.configure({
            heading: {
              levels: [2, 3]
            }
          }),
          Link.configure({
            openOnClick: false,
            HTMLAttributes: {
              class: 'text-primary underline',
              rel: 'noopener noreferrer',
            }
          }),
          Placeholder.configure({
            placeholder,
            showOnlyWhenEditable: true,
            showOnlyCurrent: false,
          })
        ],
    content,
    editable: isEditing && isEnabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // For plain format, extract text without HTML tags
      const newContent = format === 'plain' 
        ? editor.getText() 
        : editor.getHTML();
      debouncedUpdate(newContent);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;
      
      if (hasSelection && isEditing && showToolbar) {
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
    onBlur: () => {
      // Delay blur to allow toolbar interactions
      if (toolbarTimeoutRef.current) {
        clearTimeout(toolbarTimeoutRef.current);
      }
      
      toolbarTimeoutRef.current = setTimeout(() => {
        const activeElement = document.activeElement;
        const isToolbarFocused = elementRef.current?.querySelector('.inline-toolbar')?.contains(activeElement);
        
        if (!isToolbarFocused && !elementRef.current?.contains(activeElement)) {
          setIsEditing(false);
          setShowFloatingToolbar(false);
        }
      }, 150);
    }
  });
  
  // Update editor content when prop changes
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const currentContent = format === 'plain' 
        ? editor.getText() 
        : editor.getHTML();
      
      if (content !== currentContent) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor, format]);
  
  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing && isEnabled);
    }
  }, [editor, isEditing, isEnabled]);
  
  const debouncedUpdate = useDebounceCallback((newContent: string) => {
    if (newContent !== content) {
      onUpdate(newContent);
    }
  }, debounceDelay);
  
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (isEnabled && !isEditing) {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);
      
      // Focus editor after state update
      setTimeout(() => {
        editor?.commands.focus('end');
      }, 0);
    }
  }, [isEnabled, isEditing, editor]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isEditing) {
      e.preventDefault();
      editor?.commands.blur();
      setIsEditing(false);
      setShowFloatingToolbar(false);
    }
  }, [isEditing, editor]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toolbarTimeoutRef.current) {
        clearTimeout(toolbarTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div 
      ref={elementRef}
      className={cn(
        'inline-editor-wrapper relative',
        isEnabled && !isEditing && 'cursor-text hover:bg-muted/50 transition-colors',
        isEditing && 'ring-2 ring-primary/50 ring-offset-1 bg-background rounded',
        className
      )}
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
      data-editable={isEnabled}
      data-field={fieldPath}
      data-editing={isEditing}
    >
      <EditorContent 
        editor={editor} 
        className={cn(
          'outline-none',
          isEditing && 'p-1',
          // Inline editor specific styles
          '[&_.ProseMirror]:outline-none',
          '[&_.ProseMirror]:min-h-[1.5em]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:absolute',
          '[&_.ProseMirror_p]:m-0', // Remove default margins for inline editing
          // Format-specific styles
          format === 'rich' && [
            '[&_.ProseMirror_h2]:text-2xl',
            '[&_.ProseMirror_h2]:font-bold',
            '[&_.ProseMirror_h3]:text-xl',
            '[&_.ProseMirror_h3]:font-bold',
            '[&_.ProseMirror_strong]:font-bold',
            '[&_.ProseMirror_em]:italic',
          ]
        )}
        style={style}
      />
      
      {showFloatingToolbar && editor && (
        <FloatingToolbar 
          editor={editor} 
          anchorEl={elementRef.current}
          format={format}
          onClose={() => setShowFloatingToolbar(false)}
        />
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const InlineTextEditor = memo(InlineTextEditorComponent, (prevProps, nextProps) => {
  return (
    prevProps.content === nextProps.content &&
    prevProps.isEnabled === nextProps.isEnabled &&
    prevProps.fieldPath === nextProps.fieldPath &&
    prevProps.format === nextProps.format &&
    prevProps.className === nextProps.className &&
    prevProps.style === nextProps.style &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.debounceDelay === nextProps.debounceDelay &&
    prevProps.showToolbar === nextProps.showToolbar
  );
});

InlineTextEditor.displayName = 'InlineTextEditor';