'use client';

/**
 * Main Tiptap rich text editor component
 */

import React, { forwardRef, useImperativeHandle } from 'react';
import { EditorContent } from '@tiptap/react';
import { useRichTextEditor, type UseRichTextEditorOptions } from '@/hooks/useRichTextEditor';
import { EditorToolbar } from './EditorToolbar';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EditorContent as EditorContentType } from '@/lib/editor/tiptap-config';

export interface RichTextEditorProps extends UseRichTextEditorOptions {
  className?: string;
  showToolbar?: boolean;
  showSaveButton?: boolean;
  autoFocus?: boolean;
  minHeight?: string;
}

export interface RichTextEditorRef {
  getContent: () => EditorContentType;
  setContent: (content: string | object) => void;
  save: () => Promise<void>;
  reset: () => void;
  focus: () => void;
}

function RichTextEditorComponent(
  {
    className,
    showToolbar = true,
    showSaveButton = false,
    autoFocus = false,
    minHeight = '200px',
    ...editorOptions
  }: RichTextEditorProps,
  ref: React.Ref<RichTextEditorRef>
) {
  const {
    editor,
    content,
    isLoading,
    error,
    isDirty,
    save,
    reset,
    setContent,
  } = useRichTextEditor(editorOptions);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getContent: () => content,
    setContent,
    save,
    reset,
    focus: () => {
      if (editor) {
        editor.commands.focus();
      }
    },
  }), [content, setContent, save, reset, editor]);

  // Auto focus on mount
  if (autoFocus && editor && !isLoading) {
    editor.commands.focus();
  }

  if (isLoading) {
    return (
      <div className={cn('border border-border rounded-md', className)}>
        {showToolbar && (
          <div className="border-b border-border p-2">
            <Skeleton className="h-8 w-full" />
          </div>
        )}
        <div className="p-4">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!editor) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to initialize editor. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('border border-border rounded-md overflow-hidden', className)}>
      {showToolbar && (
        <EditorToolbar editor={editor} disabled={editorOptions.readOnly} />
      )}
      
      {error && (
        <Alert variant="destructive" className="m-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <EditorContent
          editor={editor}
          className={cn(
            'prose prose-sm max-w-none',
            'focus-within:outline-none',
            '[&_.ProseMirror]:outline-none',
            '[&_.ProseMirror]:p-4',
            '[&_.ProseMirror]:min-h-[var(--min-height)]',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
            // Link styles
            '[&_.ProseMirror_.editor-link]:text-primary',
            '[&_.ProseMirror_.editor-link]:underline',
            '[&_.ProseMirror_.editor-link:hover]:text-primary/80',
            // List styles
            '[&_.ProseMirror_ul]:list-disc',
            '[&_.ProseMirror_ol]:list-decimal',
            '[&_.ProseMirror_ul,_.ProseMirror_ol]:pl-6',
            '[&_.ProseMirror_li]:my-1',
            // Heading styles
            '[&_.ProseMirror_h1]:text-2xl',
            '[&_.ProseMirror_h1]:font-bold',
            '[&_.ProseMirror_h1]:mt-6',
            '[&_.ProseMirror_h1]:mb-4',
            '[&_.ProseMirror_h2]:text-xl',
            '[&_.ProseMirror_h2]:font-bold',
            '[&_.ProseMirror_h2]:mt-5',
            '[&_.ProseMirror_h2]:mb-3',
            '[&_.ProseMirror_h3]:text-lg',
            '[&_.ProseMirror_h3]:font-bold',
            '[&_.ProseMirror_h3]:mt-4',
            '[&_.ProseMirror_h3]:mb-2',
            // Paragraph styles
            '[&_.ProseMirror_p]:my-2',
            // Strong and emphasis
            '[&_.ProseMirror_strong]:font-bold',
            '[&_.ProseMirror_em]:italic',
            editorOptions.readOnly && 'pointer-events-none opacity-60'
          )}
          style={{ '--min-height': minHeight } satisfies React.CSSProperties}
        />

        {showSaveButton && (
          <div className="absolute top-2 right-2">
            <Button
              size="sm"
              variant="outline"
              onClick={save}
              disabled={!isDirty || editorOptions.readOnly}
              className="bg-background/80 backdrop-blur-sm"
            >
              <Save className="h-3 w-3 mr-1" />
              {isDirty ? 'Save' : 'Saved'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
const MemoizedRichTextEditor = React.memo(RichTextEditorComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.content === nextProps.content &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.className === nextProps.className &&
    prevProps.showToolbar === nextProps.showToolbar &&
    prevProps.showSaveButton === nextProps.showSaveButton &&
    prevProps.autoFocus === nextProps.autoFocus &&
    prevProps.minHeight === nextProps.minHeight
  )
})

MemoizedRichTextEditor.displayName = 'RichTextEditor'

export const RichTextEditor = React.forwardRef<RichTextEditorRef, RichTextEditorProps>(
  MemoizedRichTextEditor
);