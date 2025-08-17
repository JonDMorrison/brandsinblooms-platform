/**
 * Type definitions for the content editor components
 */

import { LucideIcon } from 'lucide-react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';

// Base types for form integration
export interface EditorFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  control?: Control<TFieldValues>;
  disabled?: boolean;
  required?: boolean;
}

// Simple Text Input Types
export interface SimpleTextInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends EditorFieldProps<TFieldValues, TName> {
  label: string;
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
  showCharCount?: boolean;
  className?: string;
  error?: string;
}

// Image Input Types
export interface ImageData {
  url: string;
  alt: string;
}

export interface ImageInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends EditorFieldProps<TFieldValues, TName> {
  label: string;
  placeholder?: string;
  helperText?: string;
  className?: string;
  error?: string;
  onImageLoad?: (loaded: boolean) => void;
  onImageError?: (error: string) => void;
}

export interface ImagePreviewState {
  isLoading: boolean;
  isValid: boolean;
  error?: string;
}

// Icon Picker Types
export interface IconPickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends EditorFieldProps<TFieldValues, TName> {
  label: string;
  placeholder?: string;
  helperText?: string;
  className?: string;
  error?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  iconSize?: number;
  maxResults?: number;
}

export interface IconOption {
  name: string;
  component: LucideIcon;
  keywords?: string[];
}

// Section Editor Types
export interface SectionData {
  id: string;
  title: string;
  isVisible: boolean;
  order: number;
  content?: unknown; // Can be any content type
}

export interface SectionHeaderProps {
  title: string;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  onTitleChange?: (title: string) => void;
  isDragHandle?: boolean;
  showDragHandle?: boolean;
  className?: string;
  actions?: React.ReactNode;
}

export interface SectionEditorProps {
  section: SectionData;
  onSectionChange: (section: SectionData) => void;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  showHeader?: boolean;
  headerActions?: React.ReactNode;
}

// Common validation types
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// URL validation helper type
export interface UrlValidationOptions {
  allowEmpty?: boolean;
  requireImageExtension?: boolean;
  allowedProtocols?: string[];
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Editor component state management
export interface EditorComponentState {
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}