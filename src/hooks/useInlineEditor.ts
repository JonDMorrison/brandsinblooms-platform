/**
 * Hook for managing inline editor state and interactions
 * Provides a simplified interface for inline text editing
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { useEditMode } from '@/contexts/EditModeContext';
import { useDebounceCallback } from '@/hooks/useDebounce';
import { handleError } from '@/lib/types/error-handling';

interface UseInlineEditorOptions {
  initialContent?: string;
  fieldPath: string;
  onSave?: (content: string, fieldPath: string) => void | Promise<void>;
  saveDelay?: number;
  validateContent?: (content: string) => boolean;
}

interface UseInlineEditorReturn {
  content: string;
  isEditing: boolean;
  isDirty: boolean;
  error: string | null;
  startEditing: () => void;
  stopEditing: () => void;
  updateContent: (newContent: string) => void;
  save: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for managing inline editor instances
 */
export function useInlineEditor(options: UseInlineEditorOptions): UseInlineEditorReturn {
  const {
    initialContent = '',
    fieldPath,
    onSave,
    saveDelay = 500,
    validateContent
  } = options;
  
  const { isInlineEditEnabled, setIsDirty: setGlobalDirty } = useEditMode();
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const originalContentRef = useRef(initialContent);
  
  // Update original content when initial content changes
  useEffect(() => {
    originalContentRef.current = initialContent;
    setContent(initialContent);
  }, [initialContent]);
  
  // Start editing
  const startEditing = useCallback(() => {
    if (isInlineEditEnabled) {
      setIsEditing(true);
      setError(null);
    }
  }, [isInlineEditEnabled]);
  
  // Stop editing
  const stopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);
  
  // Update content with validation
  const updateContent = useCallback((newContent: string) => {
    // Validate content if validator provided
    if (validateContent && !validateContent(newContent)) {
      setError('Invalid content format');
      return;
    }
    
    setContent(newContent);
    setError(null);
    
    // Check if content has changed from original
    const hasChanged = newContent !== originalContentRef.current;
    setIsDirty(hasChanged);
    setGlobalDirty(hasChanged);
    
    // Trigger debounced save
    if (hasChanged && onSave) {
      debouncedSave(newContent);
    }
  }, [validateContent, onSave, setGlobalDirty]);
  
  // Save function
  const save = useCallback(async (): Promise<void> => {
    if (!onSave || !isDirty) return;
    
    try {
      setError(null);
      await onSave(content, fieldPath);
      
      // Update original content after successful save
      originalContentRef.current = content;
      setIsDirty(false);
      setGlobalDirty(false);
    } catch (error: unknown) {
      const errorDetails = handleError(error);
      setError(errorDetails.message);
      throw error;
    }
  }, [content, fieldPath, onSave, isDirty, setGlobalDirty]);
  
  // Debounced save
  const debouncedSave = useDebounceCallback(async (newContent: string) => {
    if (onSave) {
      try {
        await onSave(newContent, fieldPath);
        originalContentRef.current = newContent;
        setIsDirty(false);
        setGlobalDirty(false);
      } catch (error: unknown) {
        const errorDetails = handleError(error);
        setError(errorDetails.message);
      }
    }
  }, saveDelay);
  
  // Reset to original content
  const reset = useCallback(() => {
    setContent(originalContentRef.current);
    setIsDirty(false);
    setGlobalDirty(false);
    setError(null);
  }, [setGlobalDirty]);
  
  // Stop editing when inline mode is disabled
  useEffect(() => {
    if (!isInlineEditEnabled && isEditing) {
      stopEditing();
    }
  }, [isInlineEditEnabled, isEditing, stopEditing]);
  
  return {
    content,
    isEditing,
    isDirty,
    error,
    startEditing,
    stopEditing,
    updateContent,
    save,
    reset
  };
}

/**
 * Helper hook for managing multiple inline editors
 */
export function useInlineEditorGroup(
  fields: Array<{ fieldPath: string; initialContent?: string }>
) {
  const { setIsDirty, setIsSaving } = useEditMode();
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());
  
  const updateFieldDirtyState = useCallback((fieldPath: string, isDirty: boolean) => {
    setDirtyFields(prev => {
      const next = new Set(prev);
      if (isDirty) {
        next.add(fieldPath);
      } else {
        next.delete(fieldPath);
      }
      setIsDirty(next.size > 0);
      return next;
    });
  }, [setIsDirty]);
  
  const updateFieldSavingState = useCallback((fieldPath: string, isSaving: boolean) => {
    setSavingFields(prev => {
      const next = new Set(prev);
      if (isSaving) {
        next.add(fieldPath);
      } else {
        next.delete(fieldPath);
      }
      setIsSaving(next.size > 0);
      return next;
    });
  }, [setIsSaving]);
  
  return {
    dirtyFields,
    savingFields,
    updateFieldDirtyState,
    updateFieldSavingState,
    hasUnsavedChanges: dirtyFields.size > 0,
    isSaving: savingFields.size > 0
  };
}