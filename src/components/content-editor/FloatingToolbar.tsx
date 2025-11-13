'use client';

/**
 * Floating toolbar for inline text editing
 * Provides minimal formatting options with smart positioning
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useFloating, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/react';
import { Bold, Italic, Link, Type, Check, X, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/src/lib/utils';
import type { Editor } from '@tiptap/react';
import { ImageUploadDialog } from './ImageUploadDialog';
import { ColorPicker } from './ColorPicker';

interface FloatingToolbarProps {
  editor: Editor | null;
  anchorEl: HTMLElement | null;
  format?: 'plain' | 'rich';
  siteId?: string;
  onClose?: () => void;
}

export const FloatingToolbar = ({
  editor,
  anchorEl,
  format = 'plain',
  siteId,
  onClose
}: FloatingToolbarProps) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const arrowRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  const { refs, floatingStyles, context } = useFloating({
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({ 
        padding: 8,
        fallbackAxisSideDirection: 'start'
      }),
      shift({ 
        padding: 8,
        crossAxis: true
      }),
      arrow({
        element: arrowRef
      })
    ],
    placement: 'top'
  });
  
  useEffect(() => {
    if (anchorEl) {
      // Get selection range for more precise positioning
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Create a virtual element for the selection
        const virtualEl = {
          getBoundingClientRect: () => rect,
          contextElement: anchorEl
        };
        
        refs.setReference(virtualEl as any);
      } else {
        refs.setReference(anchorEl);
      }
    }
  }, [anchorEl, refs]);
  
  const handleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);
  
  const handleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);
  
  const handleParagraph = useCallback(() => {
    editor?.chain().focus().setParagraph().run();
  }, [editor]);

  const handleHeading1 = useCallback(() => {
    editor?.chain().focus().toggleHeading({ level: 1 }).run();
  }, [editor]);

  const handleHeading2 = useCallback(() => {
    editor?.chain().focus().toggleHeading({ level: 2 }).run();
  }, [editor]);

  const handleAlignLeft = useCallback(() => {
    editor?.chain().focus().setTextAlign('left').run();
  }, [editor]);

  const handleAlignCenter = useCallback(() => {
    editor?.chain().focus().setTextAlign('center').run();
  }, [editor]);

  const handleAlignRight = useCallback(() => {
    editor?.chain().focus().setTextAlign('right').run();
  }, [editor]);
  
  const handleLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setShowLinkInput(true);
  }, [editor]);
  
  const applyLink = useCallback(() => {
    if (linkUrl === '') {
      editor?.chain().focus().unsetLink().run();
    } else {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);
  
  const cancelLink = useCallback(() => {
    setShowLinkInput(false);
    setLinkUrl('');
    editor?.commands.focus();
  }, [editor]);

  const handleImageInsert = useCallback((url: string, alt: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url, alt }).run();
    }
  }, [editor]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && showLinkInput) {
      e.preventDefault();
      applyLink();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (showLinkInput) {
        cancelLink();
      } else if (onClose) {
        onClose();
      }
    }
  }, [showLinkInput, applyLink, cancelLink, onClose]);
  
  if (!editor) return null;

  // Use portal to render outside overflow:hidden containers
  const toolbar = (
    <div
      ref={(el) => {
        refs.setFloating(el);
        toolbarRef.current = el;
      }}
      style={{...floatingStyles, position: 'fixed'}}
      className={cn(
        "inline-toolbar z-50 flex items-center gap-1 rounded-lg border shadow-lg",
        // Enhanced visibility - always light background (consistent with SimpleFloatingToolbar)
        "bg-white/95 backdrop-blur-sm",
        "border-gray-200",
        "animate-in fade-in-0 zoom-in-95 duration-150",
        "p-2"
      )}
      onMouseDown={(e) => {
        // Only prevent default if not clicking inside a dialog
        // This allows dialog inputs to receive focus
        const target = e.target as HTMLElement;
        const isDialogElement = target.closest('[data-slot="dialog-overlay"], [data-slot="dialog-content"], [data-slot="dialog-portal"]');
        if (!isDialogElement) {
          e.preventDefault();
        }
      }}
      onKeyDown={handleKeyDown}
      data-state="open"
    >
      <div
        ref={arrowRef}
        className="absolute w-2 h-2 bg-white/95 border border-gray-200 rotate-45"
        style={{
          bottom: '-5px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        }}
      />
      
      {!showLinkInput ? (
        <>
          {/* Basic Formatting: Bold, Italic */}
          <Button
            size="sm"
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            onClick={handleBold}
            className="h-7 w-7 p-0 text-foreground"
            style={{ color: 'hsl(var(--foreground))' }}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            onClick={handleItalic}
            className="h-7 w-7 p-0 text-foreground"
            style={{ color: 'hsl(var(--foreground))' }}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>

          {/* Color Picker - available in plain and rich mode */}
          <>
            {/* Separator */}
            <div className="w-px h-5 bg-border mx-0.5" />

            {/* Color Picker */}
            <ColorPicker editor={editor} size="sm" variant="ghost" />
          </>

          {format === 'rich' && (
            <>
              {/* Separator */}
              <div className="w-px h-5 bg-border mx-0.5" />

              {/* Heading Controls: Paragraph, H1, H2 */}
              <Button
                size="sm"
                variant={!editor.isActive('heading') ? 'secondary' : 'ghost'}
                onClick={handleParagraph}
                className="h-7 w-7 p-0 text-xs font-medium text-foreground"
                style={{ color: 'hsl(var(--foreground))' }}
                title="Paragraph"
              >
                P
              </Button>

              <Button
                size="sm"
                variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
                onClick={handleHeading1}
                className="h-7 w-8 p-0 text-xs font-medium text-foreground"
                style={{ color: 'hsl(var(--foreground))' }}
                title="Heading 1"
              >
                H1
              </Button>

              <Button
                size="sm"
                variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
                onClick={handleHeading2}
                className="h-7 w-8 p-0 text-xs font-medium text-foreground"
                style={{ color: 'hsl(var(--foreground))' }}
                title="Heading 2"
              >
                H2
              </Button>

              {/* Separator */}
              <div className="w-px h-5 bg-border mx-0.5" />

              {/* Alignment Controls */}
              <Button
                size="sm"
                variant={editor.isActive({ textAlign: 'left' }) || (!editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' })) ? 'secondary' : 'ghost'}
                onClick={handleAlignLeft}
                className="h-7 w-7 p-0 text-foreground"
                style={{ color: 'hsl(var(--foreground))' }}
                title="Align Left"
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
                onClick={handleAlignCenter}
                className="h-7 w-7 p-0 text-foreground"
                style={{ color: 'hsl(var(--foreground))' }}
                title="Align Center"
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
                onClick={handleAlignRight}
                className="h-7 w-7 p-0 text-foreground"
                style={{ color: 'hsl(var(--foreground))' }}
                title="Align Right"
              >
                <AlignRight className="h-3.5 w-3.5" />
              </Button>

              {/* Separator */}
              <div className="w-px h-5 bg-border mx-0.5" />

              {/* Link Control */}
              <Button
                size="sm"
                variant={editor.isActive('link') ? 'secondary' : 'ghost'}
                onClick={handleLink}
                className="h-7 w-7 p-0 text-foreground"
                style={{ color: 'hsl(var(--foreground))' }}
                title="Link (Ctrl+K)"
              >
                <Link className="h-3.5 w-3.5" />
              </Button>

              {/* Image Control - only show if siteId is available */}
              {siteId && (
                <>
                  {/* Separator */}
                  <div className="w-px h-5 bg-border mx-0.5" />

                  <Button
                    size="sm"
                    variant={editor.isActive('image') ? 'secondary' : 'ghost'}
                    onClick={() => setImageDialogOpen(true)}
                    className="h-7 w-7 p-0 text-foreground"
                    style={{ color: 'hsl(var(--foreground))' }}
                    title="Insert Image"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </>
          )}
        </>
      ) : (
        <div className="flex items-center gap-1">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL..."
            className="h-7 w-48 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={applyLink}
            className="h-7 w-7 p-0"
            title="Apply"
          >
            <Check className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancelLink}
            className="h-7 w-7 p-0"
            title="Cancel"
          >
            <X className="h-3.5 w-3.5 text-red-600" />
          </Button>
        </div>
      )}

      {/* Image Upload Dialog */}
      {siteId && (
        <ImageUploadDialog
          isOpen={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          onInsert={handleImageInsert}
          siteId={siteId}
        />
      )}
    </div>
  );

  // Render toolbar using portal to escape overflow:hidden containers
  return typeof window !== 'undefined' ? createPortal(toolbar, document.body) : null;
};