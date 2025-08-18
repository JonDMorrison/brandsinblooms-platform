/**
 * Tiptap editor configuration for the Brands in Blooms platform
 */

import { type Extensions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

/**
 * Default Tiptap editor configuration
 * Supports basic formatting: bold, italic, underline, links, lists, headings
 */
export const getTiptapConfig = (placeholder?: string): Extensions => {
  // Create a stable configuration that doesn't change between renders
  const extensions = [
    StarterKit.configure({
      // Disable Link extension from StarterKit since we're adding our own
      link: false,
      // Configure heading levels (H1-H3)
      heading: {
        levels: [1, 2, 3],
      },
      // Enable bullet and ordered lists
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
      // Basic text formatting
      bold: {},
      italic: {},
      strike: {},
      // Paragraph and line breaks
      paragraph: {
        HTMLAttributes: {
          class: 'editor-paragraph',
        },
      },
      // History for undo/redo (enabled by default in StarterKit)
    }),
    
    // Link extension with proper configuration
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'editor-link',
        rel: 'noopener noreferrer',
      },
      validate: (url) => {
        // Basic URL validation
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      },
    }),
    
    // Placeholder text
    Placeholder.configure({
      placeholder: placeholder || 'Start writing...',
      showOnlyWhenEditable: true,
      showOnlyCurrent: false,
    }),
  ];
  
  return extensions;
};

/**
 * Editor content types for export
 */
export type EditorContent = {
  html: string;
  json: object;
  text: string;
};

/**
 * Export editor content in multiple formats
 */
export const exportEditorContent = (editor: { getHTML(): string; getJSON(): object; getText(): string } | null): EditorContent => {
  if (!editor) {
    return {
      html: '',
      json: {},
      text: '',
    };
  }

  return {
    html: editor.getHTML(),
    json: editor.getJSON(),
    text: editor.getText(),
  };
};

/**
 * Validate editor content
 */
export const isValidContent = (content: unknown): boolean => {
  if (!content) return false;
  
  if (typeof content === 'string') {
    return content.trim().length > 0;
  }
  
  if (typeof content === 'object' && content !== null) {
    // Check if it's a valid Tiptap JSON structure
    const jsonContent = content as { type?: string; content?: unknown[] };
    return jsonContent.type === 'doc' && Array.isArray(jsonContent.content);
  }
  
  return false;
};