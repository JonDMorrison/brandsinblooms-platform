'use client';

import React from 'react';
import { useToast } from '@/src/components/ui/use-toast';
import { 
  Check, 
  AlertTriangle, 
  Info, 
  X, 
  Save, 
  Upload, 
  Download,
  Trash2,
  Plus,
  Move,
  Copy,
  Undo,
  Redo
} from 'lucide-react';

/**
 * Toast notification types specific to visual editor
 */
export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'destructive',
  WARNING = 'warning',
  INFO = 'info',
  DEFAULT = 'default'
}

/**
 * Visual editor specific toast notifications
 */
export interface VisualEditorToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: React.ReactElement;
  persistent?: boolean;
}

/**
 * Hook for visual editor toast notifications with predefined messages
 */
export function useVisualEditorToast() {
  const { toast, dismiss } = useToast();

  const showToast = React.useCallback((
    type: ToastType,
    options: VisualEditorToastOptions = {}
  ) => {
    const { title, description, duration = 3000, action, persistent = false } = options;

    return toast({
      variant: type,
      title,
      description,
      action,
      duration: persistent ? undefined : duration,
    });
  }, [toast]);

  // Auto-save related toasts
  const autoSave = React.useMemo(() => ({
    saving: () => showToast(ToastType.INFO, {
      title: 'Saving changes...',
      description: 'Your content is being saved automatically',
      duration: 2000
    }),
    
    saved: () => showToast(ToastType.SUCCESS, {
      title: 'Changes saved',
      description: 'Your content has been saved successfully',
      duration: 2000
    }),
    
    error: (error?: string) => showToast(ToastType.ERROR, {
      title: 'Save failed',
      description: error || 'Unable to save your changes. Please try again.',
      persistent: true
    })
  }), [showToast]);

  // Content management toasts
  const content = React.useMemo(() => ({
    loaded: () => showToast(ToastType.SUCCESS, {
      title: 'Content loaded',
      description: 'Page content has been loaded successfully'
    }),
    
    loadError: () => showToast(ToastType.ERROR, {
      title: 'Failed to load content',
      description: 'Unable to load page content. Please refresh and try again.',
      persistent: true
    }),
    
    updated: () => showToast(ToastType.SUCCESS, {
      title: 'Content updated',
      description: 'Your changes have been applied'
    }),
    
    reverted: () => showToast(ToastType.INFO, {
      title: 'Changes reverted',
      description: 'Content has been restored to the previous version'
    })
  }), [showToast]);

  // Section management toasts
  const sections = React.useMemo(() => ({
    added: (sectionType?: string) => showToast(ToastType.SUCCESS, {
      title: 'Section added',
      description: sectionType ? `${sectionType} section has been added` : 'New section has been added'
    }),
    
    deleted: () => showToast(ToastType.SUCCESS, {
      title: 'Section deleted',
      description: 'Section has been removed from the page'
    }),
    
    moved: () => showToast(ToastType.SUCCESS, {
      title: 'Section moved',
      description: 'Section has been repositioned'
    }),
    
    duplicated: () => showToast(ToastType.SUCCESS, {
      title: 'Section duplicated',
      description: 'A copy of the section has been created'
    }),
    
    deleteError: () => showToast(ToastType.ERROR, {
      title: 'Delete failed',
      description: 'Unable to delete section. Please try again.'
    })
  }), [showToast]);

  // Drag and drop toasts
  const dragDrop = React.useMemo(() => ({
    started: () => showToast(ToastType.INFO, {
      title: 'Drag mode active',
      description: 'Drag sections to reorder them',
      duration: 2000
    }),
    
    completed: () => showToast(ToastType.SUCCESS, {
      title: 'Section reordered',
      description: 'Section has been moved to new position'
    }),
    
    cancelled: () => showToast(ToastType.INFO, {
      title: 'Drag cancelled',
      description: 'Section returned to original position',
      duration: 2000
    }),
    
    error: () => showToast(ToastType.ERROR, {
      title: 'Reorder failed',
      description: 'Unable to reorder sections. Please try again.'
    })
  }), [showToast]);

  // Edit mode toasts
  const editMode = React.useMemo(() => ({
    activated: () => showToast(ToastType.INFO, {
      title: 'Edit mode activated',
      description: 'Click on any text or element to start editing',
      duration: 3000
    }),
    
    deactivated: () => showToast(ToastType.INFO, {
      title: 'View mode activated',
      description: 'Editing has been disabled',
      duration: 2000
    }),
    
    switching: () => showToast(ToastType.INFO, {
      title: 'Switching modes...',
      description: 'Please wait while the editor switches modes',
      duration: 1500
    })
  }), [showToast]);

  // Media/upload toasts
  const media = React.useMemo(() => ({
    uploading: () => showToast(ToastType.INFO, {
      title: 'Uploading media...',
      description: 'Your file is being uploaded',
      persistent: true
    }),
    
    uploaded: (fileName?: string) => showToast(ToastType.SUCCESS, {
      title: 'Upload complete',
      description: fileName ? `${fileName} has been uploaded successfully` : 'File uploaded successfully'
    }),
    
    uploadError: (error?: string) => showToast(ToastType.ERROR, {
      title: 'Upload failed',
      description: error || 'Failed to upload file. Please check file size and format.',
      persistent: true
    }),
    
    processing: () => showToast(ToastType.INFO, {
      title: 'Processing media...',
      description: 'Image is being optimized',
      duration: 3000
    })
  }), [showToast]);

  // Undo/Redo toasts
  const history = React.useMemo(() => ({
    undone: () => showToast(ToastType.INFO, {
      title: 'Action undone',
      description: 'Last change has been reverted',
      duration: 2000
    }),
    
    redone: () => showToast(ToastType.INFO, {
      title: 'Action redone',
      description: 'Change has been reapplied',
      duration: 2000
    }),
    
    noHistory: () => showToast(ToastType.WARNING, {
      title: 'No more actions',
      description: 'Nothing to undo or redo',
      duration: 2000
    })
  }), [showToast]);

  // Template/component library toasts
  const templates = React.useMemo(() => ({
    applied: (templateName?: string) => showToast(ToastType.SUCCESS, {
      title: 'Template applied',
      description: templateName ? `${templateName} template has been applied` : 'Template has been applied successfully'
    }),
    
    loadError: () => showToast(ToastType.ERROR, {
      title: 'Template load failed',
      description: 'Unable to load template. Please try again.'
    }),
    
    saved: (name?: string) => showToast(ToastType.SUCCESS, {
      title: 'Template saved',
      description: name ? `Template "${name}" has been saved` : 'Template has been saved successfully'
    })
  }), [showToast]);

  // Validation toasts
  const validation = React.useMemo(() => ({
    passed: () => showToast(ToastType.SUCCESS, {
      title: 'Validation passed',
      description: 'All content validation checks passed'
    }),
    
    failed: (issues: string[]) => showToast(ToastType.WARNING, {
      title: `${issues.length} validation issue${issues.length > 1 ? 's' : ''}`,
      description: issues.slice(0, 2).join(', ') + (issues.length > 2 ? '...' : ''),
      persistent: true
    }),
    
    checking: () => showToast(ToastType.INFO, {
      title: 'Validating content...',
      description: 'Checking for content issues',
      duration: 2000
    })
  }), [showToast]);

  // Performance toasts
  const performance = React.useMemo(() => ({
    slowOperation: () => showToast(ToastType.WARNING, {
      title: 'Operation taking longer than usual',
      description: 'Please wait while we process your request',
      duration: 5000
    }),
    
    memoryWarning: () => showToast(ToastType.WARNING, {
      title: 'High memory usage detected',
      description: 'Consider refreshing the page to improve performance',
      persistent: true
    })
  }), [showToast]);

  return {
    // Core toast function
    showToast,
    dismiss,
    
    // Categorized toast functions
    autoSave,
    content,
    sections,
    dragDrop,
    editMode,
    media,
    history,
    templates,
    validation,
    performance
  };
}

/**
 * Toast notification component with visual editor icons
 */
export function VisualEditorToastIcon({ type, operation }: { 
  type: ToastType; 
  operation?: 'save' | 'upload' | 'delete' | 'add' | 'move' | 'copy' | 'undo' | 'redo';
}) {
  const getIcon = () => {
    // Priority: operation-specific icons, then type-based icons
    if (operation) {
      switch (operation) {
        case 'save':
          return <Save className="h-4 w-4" />;
        case 'upload':
          return <Upload className="h-4 w-4" />;
        case 'delete':
          return <Trash2 className="h-4 w-4" />;
        case 'add':
          return <Plus className="h-4 w-4" />;
        case 'move':
          return <Move className="h-4 w-4" />;
        case 'copy':
          return <Copy className="h-4 w-4" />;
        case 'undo':
          return <Undo className="h-4 w-4" />;
        case 'redo':
          return <Redo className="h-4 w-4" />;
        default:
          break;
      }
    }

    switch (type) {
      case ToastType.SUCCESS:
        return <Check className="h-4 w-4" />;
      case ToastType.ERROR:
        return <X className="h-4 w-4" />;
      case ToastType.WARNING:
        return <AlertTriangle className="h-4 w-4" />;
      case ToastType.INFO:
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="mr-2 flex-shrink-0">
      {getIcon()}
    </div>
  );
}

/**
 * Provider component for visual editor toasts
 */
export function VisualEditorToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Toaster is already included in the main app, but we can add custom positioning if needed */}
    </>
  );
}