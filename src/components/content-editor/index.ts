/**
 * Content editor components exports
 */

// Rich Text Editor Components
export { RichTextEditor } from './RichTextEditor';
export { EditorToolbar } from './EditorToolbar';
export type { RichTextEditorProps, RichTextEditorRef } from './RichTextEditor';

// Inline Editing Components
export { InlineTextEditor } from './InlineTextEditor';
export { FloatingToolbar } from './FloatingToolbar';
export { EditableWrapper } from './EditableWrapper';
export type { InlineTextEditorProps } from './InlineTextEditor';

// Input Components
export { SimpleTextInput } from './inputs/SimpleTextInput';
export { ImageInput } from './inputs/ImageInput';
export { IconPicker } from './inputs/IconPicker';

// Section Components
export { SectionEditor } from './sections/SectionEditor';
export { SectionHeader } from './sections/SectionHeader';

// Main Editor Components
export { ContentEditor } from './ContentEditor';
export { SectionManager } from './SectionManager';

// Optimized Components (Milestone 6: Polish & Optimization)
export { OptimizedContentEditor } from './OptimizedContentEditor';

// Error Boundaries
export { 
  ErrorBoundary, 
  EditorErrorBoundary, 
  RichTextEditorErrorBoundary, 
  IconPickerErrorBoundary, 
  PreviewErrorBoundary,
  useErrorBoundary 
} from './ErrorBoundary';

// Loading States
export {
  LoadingSpinner,
  SaveStatusIndicator,
  ContentEditorSkeleton,
  SectionEditorSkeleton,
  RichTextEditorSkeleton,
  IconPickerSkeleton,
  PreviewSkeleton,
  LoadingOverlay,
  ShimmerOverlay
} from './LoadingStates';

// Lazy Loading Components
export {
  LazyRichTextEditor,
  LazyIconPicker,
  LazyDynamicSection,
  LazyContentEditor,
  SuspensefulRichTextEditor,
  SuspensefulIconPicker,
  SuspensefulDynamicSection,
  SuspensefulContentEditor,
  preloadEditorComponents,
  usePreloadComponents,
  loadComponent
} from './LazyComponents';

// Mobile Optimizations
export {
  useScreenSize,
  MobileEditorLayout,
  MobileToolbar,
  TouchSectionControls,
  ResponsivePreview,
  useTouchGestures
} from './MobileOptimizations';

// Type Exports
export type {
  SimpleTextInputProps,
  ImageInputProps,
  ImageData,
  ImagePreviewState,
  IconPickerProps,
  IconOption,
  SectionEditorProps,
  SectionHeaderProps,
  SectionData,
  EditorFieldProps,
  ValidationResult,
  UrlValidationOptions,
  LoadingState,
  EditorComponentState,
} from '@/types/content-editor';