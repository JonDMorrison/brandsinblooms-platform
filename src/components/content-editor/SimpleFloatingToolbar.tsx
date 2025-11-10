'use client';

/**
 * Simplified floating toolbar for inline text editing
 * Provides only Bold, Italic, and Link options with enhanced visibility
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFloating, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/react';
import { Bold, Italic, Link, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/src/lib/utils';
import type { Editor } from '@tiptap/react';
import { ColorPicker } from './ColorPicker';

interface SimpleFloatingToolbarProps {
  editor: Editor | null;
  anchorEl: HTMLElement | null;
  onClose?: () => void;
}

export const SimpleFloatingToolbar = ({ 
  editor, 
  anchorEl,
  onClose
}: SimpleFloatingToolbarProps) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const arrowRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const handleLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setShowLinkInput(true);
    
    // Focus the link input after state update
    setTimeout(() => {
      linkInputRef.current?.focus();
    }, 100);
  }, [editor]);
  
  const applyLink = useCallback(() => {
    if (linkUrl === '') {
      editor?.chain().focus().unsetLink().run();
    } else {
      // Validate URL
      let validUrl = linkUrl;
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://') && !validUrl.startsWith('mailto:')) {
        validUrl = `https://${validUrl}`;
      }
      editor?.chain().focus().setLink({ href: validUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);
  
  const cancelLink = useCallback(() => {
    setShowLinkInput(false);
    setLinkUrl('');
    editor?.commands.focus();
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
  
  return (
    <div
      ref={(el) => {
        refs.setFloating(el);
        toolbarRef.current = el;
      }}
      style={floatingStyles}
      className={cn(
        "simple-toolbar z-50 flex items-center gap-1 rounded-lg border shadow-lg",
        // Enhanced visibility - always light background
        "bg-white/95 backdrop-blur-sm",
        "border-gray-200",
        "animate-in fade-in-0 zoom-in-95 duration-150",
        "p-2"
      )}
      onMouseDown={(e) => e.preventDefault()} // Prevent blur
      onKeyDown={handleKeyDown}
      data-state="open"
      role="toolbar"
      aria-label="Simple text formatting toolbar"
      aria-orientation="horizontal"
    >
      {/* Arrow with enhanced visibility */}
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
          {/* Bold Button */}
          <Button
            size="sm"
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            onClick={handleBold}
            className="h-8 w-8 p-0"
            title="Bold (Ctrl+B)"
            aria-label="Bold"
            aria-pressed={editor.isActive('bold')}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          
          {/* Italic Button */}
          <Button
            size="sm"
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            onClick={handleItalic}
            className="h-8 w-8 p-0"
            title="Italic (Ctrl+I)"
            aria-label="Italic"
            aria-pressed={editor.isActive('italic')}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          
          {/* Separator */}
          <div className="w-px h-5 bg-gray-300 mx-0.5" />
          
          {/* Link Button */}
          <Button
            size="sm"
            variant={editor.isActive('link') ? 'secondary' : 'ghost'}
            onClick={handleLink}
            className="h-8 w-8 p-0"
            title="Link (Ctrl+K)"
            aria-label="Link"
            aria-pressed={editor.isActive('link')}
          >
            <Link className="h-3.5 w-3.5" />
          </Button>

          {/* Separator */}
          <div className="w-px h-5 bg-gray-300 mx-0.5" />

          {/* Color Picker */}
          <ColorPicker editor={editor} size="sm" variant="ghost" />
        </>
      ) : (
        /* Link input form */
        <div className="flex items-center gap-2" role="form" aria-label="Link editor">
          <Input
            ref={linkInputRef}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL..."
            className="h-8 w-48 text-xs"
            aria-label="Link URL"
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
            className="h-8 w-8 p-0"
            title="Apply link"
            aria-label="Apply link"
          >
            <Check className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancelLink}
            className="h-8 w-8 p-0"
            title="Cancel"
            aria-label="Cancel link edit"
          >
            <X className="h-3.5 w-3.5 text-red-600" />
          </Button>
        </div>
      )}
    </div>
  );
};