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
  onChange?: (content: string) => void;
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
    onChange,
    onSave,
    saveDelay = 1000,
    readOnly = false,
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [content, setContentState] = useState<EditorContent>({
    html: '',
    json: {},
    text: '',
  });

  // Create the editor instance - dependencies are carefully selected
  const editor = useEditor({
    extensions: getTiptapConfig(placeholder),
    content: initialContent,
    editable: !readOnly,
    immediatelyRender: false, // Prevent SSR hydration mismatches
    onCreate: ({ editor }) => {
      setIsLoading(false);
      // Skip onChange during creation to prevent false dirty state
      updateContent(editor, true);
      // Mark initialization as complete after a brief delay
      setTimeout(() => setIsInitializing(false), 100);
    },
    onUpdate: ({ editor }) => {
      // Only mark as dirty and trigger onChange if not initializing
      if (!isInitializing) {
        setIsDirty(true);
        updateContent(editor);
        debouncedSave();
      }
    },
  });

  // Update content state from editor with safety checks
  const updateContent = useCallback((editorInstance: Editor, skipOnChange = false) => {
    try {
      const newContent = exportEditorContent(editorInstance);
      setContentState(newContent);
      setError(null);

      // Only call onChange if:
      // 1. onChange callback exists
      // 2. Not initializing (prevent false triggers during setup)
      // 3. Content actually changed (like InlineTextEditor safety check)
      // 4. Not explicitly skipping onChange
      if (onChange && !isInitializing && !skipOnChange) {
        const currentHtml = typeof initialContent === 'string' ? initialContent : '';
        if (newContent.html !== currentHtml) {
          onChange(newContent.html);
        }
      }
    } catch (error: unknown) {
      const errorDetails = handleError(error);
      setError(errorDetails.message);
    }
  }, [onChange, isInitializing, initialContent]);

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
      setIsInitializing(true);
      editor.commands.setContent(initialContent);
      setIsDirty(false);
      setError(null);
      updateContent(editor, true); // Skip onChange during reset
      setTimeout(() => setIsInitializing(false), 100);
    } catch (error: unknown) {
      const errorDetails = handleError(error);
      setError(errorDetails.message);
      setIsInitializing(false);
    }
  }, [editor, initialContent, updateContent]);

  // Set editor content programmatically
  const setContent = useCallback((newContent: string | object) => {
    if (!editor) return;

    try {
      if (!isValidContent(newContent)) {
        throw new Error('Invalid content format');
      }

      setIsInitializing(true);
      editor.commands.setContent(newContent);
      setIsDirty(true);
      updateContent(editor);
      setTimeout(() => setIsInitializing(false), 100);
    } catch (error: unknown) {
      const errorDetails = handleError(error);
      setError(errorDetails.message);
      setIsInitializing(false);
    }
  }, [editor, updateContent]);

  // Update editor configuration when props change
  useEffect(() => {
    if (editor) {
      // Update editable state
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // Update content when initial content changes
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      setIsInitializing(true);
      editor.commands.setContent(initialContent);
      setIsDirty(false);
      // Reset initialization flag after content is set
      setTimeout(() => setIsInitializing(false), 100);
    }
  }, [editor, initialContent]);

  // Update content when editor changes and handle initialization errors
  useEffect(() => {
    if (editor && !isLoading) {
      try {
        // Skip onChange during initial content load to prevent false dirty state
        updateContent(editor, true);
      } catch (error: unknown) {
        const errorDetails = handleError(error);
        setError(errorDetails.message);
      }
    } else if (!editor && !isLoading) {
      // Editor failed to initialize
      setError('Failed to initialize editor');
    }
  }, [editor, isLoading, updateContent]);

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