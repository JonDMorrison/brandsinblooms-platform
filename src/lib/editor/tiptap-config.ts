/**
 * Tiptap editor configuration for the Brands in Blooms platform
 */

import { type Extensions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Heading from '@tiptap/extension-heading';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';

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
      // Disable StarterKit's heading to use custom one (match InlineTextEditor)
      heading: false,
      // Disable lists and strike to match InlineTextEditor
      bulletList: false,
      orderedList: false,
      strike: false,
      // Basic text formatting
      bold: {},
      italic: {},
      // Paragraph with inline styles to match InlineTextEditor
      paragraph: {
        HTMLAttributes: {
          style: 'color: var(--theme-text); font-family: var(--theme-font-body);'
        },
      },
      // History for undo/redo (enabled by default in StarterKit)
    }),

    // Custom Heading extension to match InlineTextEditor exactly
    Heading.configure({
      levels: [1, 2]
    }),
    
    // Link extension with configuration matching InlineTextEditor
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary underline',
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

    // Text alignment extension
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right'],
      defaultAlignment: 'left'
    }),

    // Image extension with inline support and resizing
    Image.configure({
      inline: true,
      allowBase64: false,
      HTMLAttributes: {
        class: 'editor-image',
      },
    }),

    // Text color support
    TextStyle,
    Color.configure({
      types: ['textStyle'],
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