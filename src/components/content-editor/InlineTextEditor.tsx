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
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import TextAlign from '@tiptap/extension-text-align';
import Heading from '@tiptap/extension-heading';
import { useDebounceCallback } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { FloatingToolbar } from './FloatingToolbar';
import { SimpleFloatingToolbar } from './SimpleFloatingToolbar';
import type { Editor } from '@tiptap/react';

export interface InlineTextEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  isEnabled: boolean;
  fieldPath: string; // e.g., "sections.hero.data.title"
  format?: 'plain' | 'rich' | 'simple-toolbar';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  debounceDelay?: number;
  showToolbar?: boolean;
  singleLine?: boolean; // If true, prevents line breaks and Enter key
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
  showToolbar = true,
  singleLine = false
}: InlineTextEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const toolbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Lightweight Tiptap instance with minimal extensions
  const editor = useEditor({
    extensions: singleLine 
      ? [
          // Single-line mode: document, paragraph (single only), and text
          Document,
          Paragraph.configure({
            HTMLAttributes: {
              class: 'single-line-paragraph'
            }
          }),
          Text,
          Placeholder.configure({
            placeholder,
            showOnlyWhenEditable: true,
            showOnlyCurrent: false,
          })
        ]
      : format === 'plain' 
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
      : format === 'simple-toolbar'
      ? [
          StarterKit.configure({ 
            heading: false, 
            codeBlock: false,
            blockquote: false,
            horizontalRule: false,
            dropcursor: false,
            gapcursor: false
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
        ]
      : [
          StarterKit.configure({
            heading: false, // Disable StarterKit's heading to use custom one
            paragraph: {
              HTMLAttributes: {
                style: 'color: var(--theme-text); font-family: var(--theme-font-body);'
              }
            }
          }),
          Heading.configure({
            levels: [1, 2]
          }).extend({
            renderHTML({ node, HTMLAttributes }) {
              const level = node.attrs.level;
              const classes = level === 1
                ? 'text-4xl md:text-6xl font-bold mb-6'
                : level === 2
                ? 'text-3xl md:text-4xl font-bold mb-8'
                : '';

              return [`h${level}`, {
                ...HTMLAttributes,
                class: classes,
                style: 'color: var(--theme-primary); font-family: var(--theme-font-heading);'
              }, 0];
            }
          }),
          Link.configure({
            openOnClick: false,
            HTMLAttributes: {
              class: 'text-primary underline',
              rel: 'noopener noreferrer',
            }
          }),
          TextAlign.configure({
            types: ['heading', 'paragraph'],
            alignments: ['left', 'center', 'right'],
            defaultAlignment: 'left'
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
    editorProps: {
      handleKeyDown: (view, event) => {
        // Prevent Enter key in single-line mode
        if (singleLine && event.key === 'Enter') {
          event.preventDefault()
          return true
        }
        return false
      }
    },
    onUpdate: ({ editor }) => {
      // For single-line or plain format, extract text without HTML tags
      const newContent = (singleLine || format === 'plain')
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
      const currentContent = (singleLine || format === 'plain')
        ? editor.getText() 
        : editor.getHTML();
      
      if (content !== currentContent) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor, format, singleLine]);
  
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
        isEnabled && !isEditing && 'cursor-text hover:bg-gradient-primary-50/50 transition-colors',
        isEditing && 'ring-2 ring-primary/50 ring-offset-1 bg-white rounded',
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
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-500',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:absolute',
          '[&_.ProseMirror_p]:m-0', // Remove default margins for inline editing
          // Single-line specific styles
          singleLine && '[&_.ProseMirror_.single-line-paragraph]:inline',
          singleLine && '[&_.ProseMirror]:whitespace-nowrap',
          singleLine && '[&_.ProseMirror]:overflow-hidden',
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
        format === 'simple-toolbar' ? (
          <SimpleFloatingToolbar 
            editor={editor} 
            anchorEl={elementRef.current}
            onClose={() => setShowFloatingToolbar(false)}
          />
        ) : (
          <FloatingToolbar 
            editor={editor} 
            anchorEl={elementRef.current}
            format={format}
            onClose={() => setShowFloatingToolbar(false)}
          />
        )
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
    prevProps.showToolbar === nextProps.showToolbar &&
    prevProps.singleLine === nextProps.singleLine
  );
});

InlineTextEditor.displayName = 'InlineTextEditor';