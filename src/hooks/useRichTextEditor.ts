/**
 * Rich text editor state management hook
 */

import { useCallback, useEffect, useState } from 'react';
import { useEditor, Editor } from '@tiptap/react';
import { useDebounceCallback } from '@/hooks/useDebounce';
import { getTiptapConfig, exportEditorContent, isValidContent, type EditorContent } from '@/lib/editor/tiptap-config';
import { handleError } from '@/lib/types/error-handling';

export interface UseRichTextEditorOptions {
  initialContent?: string | object;
  placeholder?: string;
  onSave?: (content: EditorContent) => void | Promise<void>;
  saveDelay?: number;
  readOnly?: boolean;
}

export interface UseRichTextEditorReturn {
  editor: Editor | null;
  content: EditorContent;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  save: () => Promise<void>;
  reset: () => void;
  setContent: (content: string | object) => void;
}

/**
 * Hook for managing rich text editor state with debounced saves
 */
export function useRichTextEditor(options: UseRichTextEditorOptions = {}): UseRichTextEditorReturn {
  const {
    initialContent = '',
    placeholder,
    onSave,
    saveDelay = 1000,
    readOnly = false,
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [content, setContentState] = useState<EditorContent>({
    html: '',
    json: {},
    text: '',
  });

  // Create the editor instance
  const editor = useEditor({
    extensions: getTiptapConfig(placeholder),
    content: initialContent,
    editable: !readOnly,
    immediatelyRender: false, // Prevent SSR hydration mismatches
    onCreate: ({ editor }) => {
      setIsLoading(false);
      updateContent(editor);
    },
    onUpdate: ({ editor }) => {
      setIsDirty(true);
      updateContent(editor);
      debouncedSave();
    },
  }, [initialContent, placeholder, readOnly]);

  // Update content state from editor
  const updateContent = useCallback((editorInstance: Editor) => {
    try {
      const newContent = exportEditorContent(editorInstance);
      setContentState(newContent);
      setError(null);
    } catch (error: unknown) {
      const errorDetails = handleError(error);
      setError(errorDetails.message);
    }
  }, []);

  // Save function
  const save = useCallback(async (): Promise<void> => {
    if (!editor || !onSave || !isDirty) return;

    try {
      setError(null);
      const currentContent = exportEditorContent(editor);
      await onSave(currentContent);
      setIsDirty(false);
    } catch (error: unknown) {
      const errorDetails = handleError(error);
      setError(errorDetails.message);
      throw error;
    }
  }, [editor, onSave, isDirty]);

  // Debounced save
  const debouncedSave = useDebounceCallback(async () => {
    if (onSave && isDirty) {
      try {
        await save();
      } catch (error: unknown) {
        // Error is already handled in save function
        console.error('Auto-save failed:', error);
      }
    }
  }, saveDelay);

  // Reset editor to initial content
  const reset = useCallback(() => {
    if (!editor) return;

    try {
      editor.commands.setContent(initialContent);
      setIsDirty(false);
      setError(null);
      updateContent(editor);
    } catch (error: unknown) {
      const errorDetails = handleError(error);
      setError(errorDetails.message);
    }
  }, [editor, initialContent, updateContent]);

  // Set editor content programmatically
  const setContent = useCallback((newContent: string | object) => {
    if (!editor) return;

    try {
      if (!isValidContent(newContent)) {
        throw new Error('Invalid content format');
      }

      editor.commands.setContent(newContent);
      setIsDirty(true);
      updateContent(editor);
    } catch (error: unknown) {
      const errorDetails = handleError(error);
      setError(errorDetails.message);
    }
  }, [editor, updateContent]);

  // Update content when editor changes and handle initialization errors
  useEffect(() => {
    if (editor && !isLoading) {
      try {
        updateContent(editor);
      } catch (error: unknown) {
        const errorDetails = handleError(error);
        setError(errorDetails.message);
      }
    } else if (!editor && !isLoading) {
      // Editor failed to initialize
      setError('Failed to initialize editor');
    }
  }, [editor, isLoading, updateContent]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  return {
    editor,
    content,
    isLoading,
    error,
    isDirty,
    save,
    reset,
    setContent,
  };
}