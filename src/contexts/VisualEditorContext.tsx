'use client';

/**
 * Context for managing visual editor state - extends the existing EditModeContext
 * with additional state management for visual editing features
 */

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { useEditMode } from './EditModeContext';
import { ContentSection } from '@/lib/content/schema';

export interface EditableElement {
  id: string;
  sectionKey: string;
  fieldPath: string;
  type: 'text' | 'rich-text' | 'image' | 'icon';
  element: HTMLElement;
  bounds: DOMRect;
}

export interface VisualEditorState {
  activeElement: EditableElement | null;
  hoveredElement: EditableElement | null;
  isSelecting: boolean;
  editableElements: Map<string, EditableElement>;
  showOverlay: boolean;
}

interface VisualEditorContextValue extends VisualEditorState {
  // Element management
  registerElement: (element: EditableElement) => void;
  unregisterElement: (id: string) => void;
  setActiveElement: (element: EditableElement | null) => void;
  setHoveredElement: (element: EditableElement | null) => void;
  
  // Selection state
  setIsSelecting: (selecting: boolean) => void;
  toggleOverlay: () => void;
  
  // Content updates with auto-save
  updateElementContent: (elementId: string, content: string) => void;
  
  // Section management
  addSection: (templateId: string, insertAfter?: string) => void;
  deleteSection: (sectionKey: string) => void;
  
  // Visual feedback
  highlightElement: (elementId: string) => void;
  clearHighlight: () => void;
  
  // Utility methods
  getElementByPath: (fieldPath: string) => EditableElement | undefined;
  getElementsInSection: (sectionKey: string) => EditableElement[];
  refreshElementBounds: () => void;
}

const VisualEditorContext = createContext<VisualEditorContextValue | undefined>(undefined);

interface VisualEditorProviderProps {
  children: ReactNode;
  onContentUpdate?: (fieldPath: string, content: string) => void;
  onSectionAdd?: (sectionKey: string, section: ContentSection) => void;
  onSectionDelete?: (sectionKey: string) => void;
}

export function VisualEditorProvider({ 
  children, 
  onContentUpdate,
  onSectionAdd,
  onSectionDelete
}: VisualEditorProviderProps) {
  const { editMode, isInlineEditEnabled } = useEditMode();
  
  const [state, setState] = useState<VisualEditorState>({
    activeElement: null,
    hoveredElement: null,
    isSelecting: false,
    editableElements: new Map(),
    showOverlay: isInlineEditEnabled && editMode === 'inline'
  });
  
  // Register/unregister editable elements
  const registerElement = useCallback((element: EditableElement) => {
    setState(prev => {
      const newElements = new Map(prev.editableElements);
      newElements.set(element.id, element);
      return {
        ...prev,
        editableElements: newElements
      };
    });
  }, []);
  
  const unregisterElement = useCallback((id: string) => {
    setState(prev => {
      const newElements = new Map(prev.editableElements);
      newElements.delete(id);
      return {
        ...prev,
        editableElements: newElements,
        activeElement: prev.activeElement?.id === id ? null : prev.activeElement,
        hoveredElement: prev.hoveredElement?.id === id ? null : prev.hoveredElement
      };
    });
  }, []);
  
  // Active element management
  const setActiveElement = useCallback((element: EditableElement | null) => {
    setState(prev => ({ ...prev, activeElement: element }));
  }, []);
  
  const setHoveredElement = useCallback((element: EditableElement | null) => {
    setState(prev => ({ ...prev, hoveredElement: element }));
  }, []);
  
  // Selection state
  const setIsSelecting = useCallback((selecting: boolean) => {
    setState(prev => ({ ...prev, isSelecting: selecting }));
  }, []);
  
  const toggleOverlay = useCallback(() => {
    setState(prev => ({ ...prev, showOverlay: !prev.showOverlay }));
  }, []);
  
  // Content updates (no auto-save - manual save only)
  const updateElementContent = useCallback((elementId: string, content: string) => {
    const element = state.editableElements.get(elementId);
    if (!element || !onContentUpdate) return;
    
    // Call update callback immediately (no debounce/auto-save)
    onContentUpdate(element.fieldPath, content);
  }, [state.editableElements, onContentUpdate]);
  
  // Section management methods
  const addSection = useCallback((templateId: string, insertAfter?: string) => {
    if (!onSectionAdd) {
      console.warn('onSectionAdd callback not provided to VisualEditorProvider');
      return;
    }

    // Import the section template function
    const { createSectionFromTemplate } = require('@/lib/content/section-templates');
    
    // Calculate insertion order
    let insertOrder = 1;
    if (insertAfter) {
      // Find the section to insert after and set order accordingly
      // This will be handled by the parent component that manages the full content state
    }
    
    const result = createSectionFromTemplate(templateId, insertOrder);
    if (result) {
      onSectionAdd(result.key, result.section);
    }
  }, [onSectionAdd]);

  const deleteSection = useCallback((sectionKey: string) => {
    if (!onSectionDelete) {
      console.warn('onSectionDelete callback not provided to VisualEditorProvider');
      return;
    }

    // Remove all elements belonging to this section from the registry
    setState(prev => {
      const newElements = new Map(prev.editableElements);
      for (const [id, element] of newElements.entries()) {
        if (element.sectionKey === sectionKey) {
          newElements.delete(id);
        }
      }
      return {
        ...prev,
        editableElements: newElements,
        activeElement: prev.activeElement?.sectionKey === sectionKey ? null : prev.activeElement,
        hoveredElement: prev.hoveredElement?.sectionKey === sectionKey ? null : prev.hoveredElement
      };
    });

    onSectionDelete(sectionKey);
  }, [onSectionDelete]);
  
  // Visual feedback methods
  const highlightElement = useCallback((elementId: string) => {
    const element = state.editableElements.get(elementId);
    if (!element) return;
    
    element.element.classList.add('visual-editor-highlight');
    setTimeout(() => {
      element.element.classList.remove('visual-editor-highlight');
    }, 1000);
  }, [state.editableElements]);
  
  const clearHighlight = useCallback(() => {
    state.editableElements.forEach(element => {
      element.element.classList.remove('visual-editor-highlight');
    });
  }, [state.editableElements]);
  
  // Utility methods
  const getElementByPath = useCallback((fieldPath: string): EditableElement | undefined => {
    for (const element of state.editableElements.values()) {
      if (element.fieldPath === fieldPath) {
        return element;
      }
    }
    return undefined;
  }, [state.editableElements]);
  
  const getElementsInSection = useCallback((sectionKey: string): EditableElement[] => {
    return Array.from(state.editableElements.values()).filter(
      element => element.sectionKey === sectionKey
    );
  }, [state.editableElements]);
  
  const refreshElementBounds = useCallback(() => {
    setState(prev => {
      const updatedElements = new Map(prev.editableElements);
      
      for (const [id, element] of updatedElements.entries()) {
        if (element.element.isConnected) {
          const bounds = element.element.getBoundingClientRect();
          updatedElements.set(id, { ...element, bounds });
        } else {
          // Element no longer in DOM, remove it
          updatedElements.delete(id);
        }
      }
      
      return {
        ...prev,
        editableElements: updatedElements
      };
    });
  }, []);
  
  // Update overlay visibility when edit mode changes
  React.useEffect(() => {
    setState(prev => ({ 
      ...prev, 
      showOverlay: isInlineEditEnabled && editMode === 'inline'
    }));
  }, [isInlineEditEnabled, editMode]);
  
  // Periodic cleanup of disconnected elements to prevent memory leaks
  React.useEffect(() => {
    const cleanupInterval = setInterval(() => {
      refreshElementBounds();
    }, 30000); // Clean up every 30 seconds
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, [refreshElementBounds]);

  // Cleanup on unmount - clear all references to prevent memory leaks
  React.useEffect(() => {
    return () => {
      // Clear all element references
      setState(prev => ({
        ...prev,
        activeElement: null,
        hoveredElement: null,
        editableElements: new Map(), // Clear all DOM element references
        isSelecting: false
      }));
    };
  }, []);
  
  const value: VisualEditorContextValue = {
    ...state,
    registerElement,
    unregisterElement,
    setActiveElement,
    setHoveredElement,
    setIsSelecting,
    toggleOverlay,
    updateElementContent,
    addSection,
    deleteSection,
    highlightElement,
    clearHighlight,
    getElementByPath,
    getElementsInSection,
    refreshElementBounds
  };
  
  return (
    <VisualEditorContext.Provider value={value}>
      {children}
    </VisualEditorContext.Provider>
  );
}

/**
 * Hook to access the visual editor context
 */
export function useVisualEditor() {
  const context = useContext(VisualEditorContext);
  
  if (!context) {
    throw new Error('useVisualEditor must be used within a VisualEditorProvider');
  }
  
  return context;
}

/**
 * Hook for components that only need to check if visual editing is active
 */
export function useIsVisualEditingEnabled() {
  const { editMode } = useEditMode();
  return editMode === 'inline';
}