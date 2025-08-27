'use client';

/**
 * Context for managing global inline edit mode state
 * Provides centralized control over editing capabilities across the application
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type EditMode = 'form' | 'inline' | 'preview';

interface EditModeContextValue {
  editMode: EditMode;
  setEditMode: (mode: EditMode) => void;
  isInlineEditEnabled: boolean;
  toggleInlineEdit: () => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}

const EditModeContext = createContext<EditModeContextValue | undefined>(undefined);

interface EditModeProviderProps {
  children: ReactNode;
  defaultMode?: EditMode;
}

export function EditModeProvider({ 
  children, 
  defaultMode = 'inline' 
}: EditModeProviderProps) {
  const [editMode, setEditMode] = useState<EditMode>(defaultMode);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const isInlineEditEnabled = editMode === 'inline';
  
  const toggleInlineEdit = useCallback(() => {
    setEditMode(current => current === 'inline' ? 'preview' : 'inline');
  }, []);
  
  const handleSetEditMode = useCallback((mode: EditMode) => {
    // If switching away from inline mode with unsaved changes, you might want to warn
    if (editMode === 'inline' && isDirty && mode !== 'inline') {
      const confirmSwitch = window.confirm('You have unsaved changes. Do you want to continue?');
      if (!confirmSwitch) {
        return;
      }
    }
    setEditMode(mode);
  }, [editMode, isDirty]);
  
  const value: EditModeContextValue = {
    editMode,
    setEditMode: handleSetEditMode,
    isInlineEditEnabled,
    toggleInlineEdit,
    isDirty,
    setIsDirty,
    isSaving,
    setIsSaving
  };
  
  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
}

/**
 * Hook to access the edit mode context
 */
export function useEditMode() {
  const context = useContext(EditModeContext);
  
  if (!context) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  
  return context;
}

/**
 * Optional: Hook for components that only need to know if inline editing is enabled
 */
export function useIsInlineEditEnabled() {
  const { isInlineEditEnabled } = useEditMode();
  return isInlineEditEnabled;
}