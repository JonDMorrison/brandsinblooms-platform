'use client';

/**
 * Enhanced floating toolbar for rich text editing
 * Provides comprehensive formatting options with smart positioning and accessibility
 */

import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { useFloating, autoUpdate, offset, flip, shift, arrow, FloatingPortal } from '@floating-ui/react';
import {
  Bold,
  Italic,
  Underline,
  Link,
  Type,
  List,
  ListOrdered,
  Quote,
  Code,
  Highlighter,
  Check,
  X,
  ChevronDown,
  Undo,
  Redo,
  Strikethrough
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/src/lib/utils';
import type { Editor } from '@tiptap/react';
import { ColorPicker } from '../ColorPicker';

interface FloatingToolbarProps {
  /** The Tiptap editor instance */
  editor: Editor | null;
  /** Element to anchor the toolbar to */
  anchorEl: HTMLElement | null;
  /** Format type - determines available tools */
  format?: 'simple' | 'rich';
  /** Callback when toolbar is closed */
  onClose?: () => void;
  /** Current selection range for positioning */
  selectionRange?: { from: number; to: number } | null;
}

interface ToolbarButton {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
  isActive: boolean;
  shortcut?: string;
}

interface ToolbarSection {
  buttons: ToolbarButton[];
  separator?: boolean;
}

const FloatingToolbarComponent = ({
  editor,
  anchorEl,
  format = 'rich',
  onClose,
  selectionRange
}: FloatingToolbarProps) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const arrowRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { refs, floatingStyles, context, placement } = useFloating({
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(12),
      flip({
        padding: 8,
        fallbackAxisSideDirection: 'start',
        crossAxis: false
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

  // Get current selection text for link creation
  const selectedText = useMemo(() => {
    if (!editor || !selectionRange) return '';
    const { from, to } = selectionRange;
    return editor.state.doc.textBetween(from, to, '');
  }, [editor, selectionRange]);

  // Update floating position based on selection
  useEffect(() => {
    if (anchorEl && editor) {
      // Get selection range for precise positioning
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Create virtual element for selection positioning
        const virtualEl = {
          getBoundingClientRect: () => rect,
          contextElement: anchorEl
        };

        refs.setReference(virtualEl as any);
      } else {
        refs.setReference(anchorEl);
      }
    }
  }, [anchorEl, editor, refs, selectionRange]);

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = null;
      }
    };
  }, []);

  // Toolbar button handlers
  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline?.().run();
  }, [editor]);

  const toggleStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run();
  }, [editor]);

  const toggleCode = useCallback(() => {
    editor?.chain().focus().toggleCode().run();
  }, [editor]);

  const toggleHighlight = useCallback(() => {
    editor?.chain().focus().toggleHighlight().run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run();
  }, [editor]);

  const undo = useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.chain().focus().redo().run();
  }, [editor]);

  const setHeading = useCallback((level: 1 | 2 | 3 | 4 | 5 | 6) => {
    editor?.chain().focus().toggleHeading({ level }).run();
  }, [editor]);

  const setParagraph = useCallback(() => {
    editor?.chain().focus().setParagraph().run();
  }, [editor]);

  // Link handling
  const handleLinkClick = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href || '';
    const currentText = selectedText || '';
    
    setLinkUrl(previousUrl);
    setLinkText(currentText);
    setShowLinkInput(true);
    
    // Clear existing timeout to prevent memory leaks
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    
    // Focus the link input after state update
    focusTimeoutRef.current = setTimeout(() => {
      linkInputRef.current?.focus();
      focusTimeoutRef.current = null;
    }, 100);
  }, [editor, selectedText]);

  const applyLink = useCallback(() => {
    if (!linkUrl.trim()) {
      editor?.chain().focus().unsetLink().run();
    } else {
      // Validate URL
      let validUrl = linkUrl;
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://') && !validUrl.startsWith('mailto:')) {
        validUrl = `https://${validUrl}`;
      }

      if (linkText && linkText !== selectedText) {
        // Replace selected text with new link text
        editor?.chain().focus().insertContent(`<a href="${validUrl}">${linkText}</a>`).run();
      } else {
        // Just apply the link to current selection
        editor?.chain().focus().setLink({ href: validUrl }).run();
      }
    }
    
    setShowLinkInput(false);
    setLinkUrl('');
    setLinkText('');
  }, [editor, linkUrl, linkText, selectedText]);

  const cancelLink = useCallback(() => {
    setShowLinkInput(false);
    setLinkUrl('');
    setLinkText('');
    editor?.commands.focus();
  }, [editor]);

  // Keyboard handling with toolbar navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showLinkInput) {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyLink();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelLink();
      }
      return;
    }

    // Handle toolbar navigation
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
      return;
    }

    // Arrow key navigation for toolbar buttons
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const toolbar = toolbarRef.current;
      if (!toolbar) return;

      const buttons = toolbar.querySelectorAll('button:not([disabled])');
      const currentIndex = Array.from(buttons).findIndex(button => button === document.activeElement);
      
      let nextIndex: number;
      if (e.key === 'ArrowLeft') {
        nextIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex >= buttons.length - 1 ? 0 : currentIndex + 1;
      }

      (buttons[nextIndex] as HTMLElement)?.focus();
    }

    // Space or Enter to activate focused button
    if ((e.key === ' ' || e.key === 'Enter') && document.activeElement?.tagName === 'BUTTON') {
      e.preventDefault();
      (document.activeElement as HTMLButtonElement).click();
    }
  }, [showLinkInput, applyLink, cancelLink, onClose]);

  // Define toolbar sections based on format
  const toolbarSections: ToolbarSection[] = useMemo(() => {
    if (!editor) return [];

    const basicSection: ToolbarSection = {
      buttons: [
        {
          icon: Bold,
          label: 'Bold',
          action: toggleBold,
          isActive: editor.isActive('bold'),
          shortcut: 'Ctrl+B'
        },
        {
          icon: Italic,
          label: 'Italic',
          action: toggleItalic,
          isActive: editor.isActive('italic'),
          shortcut: 'Ctrl+I'
        }
      ],
      separator: true
    };

    if (format === 'simple') {
      return [
        basicSection,
        {
          buttons: [
            {
              icon: Link,
              label: 'Link',
              action: handleLinkClick,
              isActive: editor.isActive('link'),
              shortcut: 'Ctrl+K'
            }
          ]
        }
      ];
    }

    // Rich format - all tools
    return [
      basicSection,
      {
        buttons: [
          {
            icon: Underline,
            label: 'Underline',
            action: toggleUnderline,
            isActive: editor.isActive('underline') || false,
            shortcut: 'Ctrl+U'
          },
          {
            icon: Strikethrough,
            label: 'Strikethrough',
            action: toggleStrike,
            isActive: editor.isActive('strike'),
          },
          {
            icon: Code,
            label: 'Inline Code',
            action: toggleCode,
            isActive: editor.isActive('code'),
          },
          {
            icon: Highlighter,
            label: 'Highlight',
            action: toggleHighlight,
            isActive: editor.isActive('highlight'),
          }
        ],
        separator: true
      },
      {
        buttons: [
          {
            icon: List,
            label: 'Bullet List',
            action: toggleBulletList,
            isActive: editor.isActive('bulletList'),
          },
          {
            icon: ListOrdered,
            label: 'Ordered List',
            action: toggleOrderedList,
            isActive: editor.isActive('orderedList'),
          },
          {
            icon: Quote,
            label: 'Blockquote',
            action: toggleBlockquote,
            isActive: editor.isActive('blockquote'),
          }
        ],
        separator: true
      },
      {
        buttons: [
          {
            icon: Link,
            label: 'Link',
            action: handleLinkClick,
            isActive: editor.isActive('link'),
            shortcut: 'Ctrl+K'
          }
        ],
        separator: true
      },
      {
        buttons: [
          {
            icon: Undo,
            label: 'Undo',
            action: undo,
            isActive: false,
            shortcut: 'Ctrl+Z'
          },
          {
            icon: Redo,
            label: 'Redo',
            action: redo,
            isActive: false,
            shortcut: 'Ctrl+Shift+Z'
          }
        ]
      }
    ];
  }, [editor, format, toggleBold, toggleItalic, toggleUnderline, toggleStrike, toggleCode, toggleHighlight, toggleBulletList, toggleOrderedList, toggleBlockquote, handleLinkClick, undo, redo]);

  // Arrow positioning
  const arrowPlacement = placement.split('-')[0];
  const arrowStyles = useMemo(() => {
    const styles: React.CSSProperties = {
      position: 'absolute',
      width: '8px',
      height: '8px',
      backgroundColor: 'hsl(var(--popover))',
      border: '1px solid hsl(var(--border))',
      transform: 'rotate(45deg)'
    };

    switch (arrowPlacement) {
      case 'top':
        return { ...styles, bottom: '-5px', left: '50%', marginLeft: '-4px' };
      case 'bottom':
        return { ...styles, top: '-5px', left: '50%', marginLeft: '-4px' };
      case 'left':
        return { ...styles, right: '-5px', top: '50%', marginTop: '-4px' };
      case 'right':
        return { ...styles, left: '-5px', top: '50%', marginTop: '-4px' };
      default:
        return { ...styles, bottom: '-5px', left: '50%', marginLeft: '-4px' };
    }
  }, [arrowPlacement]);

  if (!editor) return null;

  return (
    <FloatingPortal>
      <div
        ref={(el) => {
          refs.setFloating(el);
          toolbarRef.current = el;
        }}
        style={floatingStyles}
        className={cn(
          'floating-toolbar z-50 flex items-center gap-1 rounded-lg border bg-popover p-2 shadow-lg',
          'animate-in fade-in-0 zoom-in-95 duration-150',
          'max-w-fit'
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
        role="toolbar"
        aria-label="Text formatting toolbar"
        aria-orientation="horizontal"
      >
        {/* Arrow */}
        <div ref={arrowRef} style={arrowStyles} className="pointer-events-none" />

        {!showLinkInput ? (
          <>
            {/* Heading dropdown for rich format */}
            {format === 'rich' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-sm font-medium"
                    aria-label="Text style"
                  >
                    <Type className="h-3.5 w-3.5 mr-1" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-32">
                  <DropdownMenuItem
                    onClick={setParagraph}
                    className={cn(editor.isActive('paragraph') && 'bg-accent')}
                  >
                    <span className="text-sm">Paragraph</span>
                  </DropdownMenuItem>
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <DropdownMenuItem
                      key={level}
                      onClick={() => setHeading(level as 1 | 2 | 3 | 4 | 5 | 6)}
                      className={cn(editor.isActive('heading', { level }) && 'bg-accent')}
                    >
                      <span className={cn(
                        level === 1 && 'text-2xl font-bold',
                        level === 2 && 'text-xl font-bold',
                        level === 3 && 'text-lg font-bold',
                        level === 4 && 'text-base font-bold',
                        level === 5 && 'text-sm font-bold',
                        level === 6 && 'text-xs font-bold'
                      )}>
                        H{level}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {format === 'rich' && <Separator orientation="vertical" className="h-6" />}

            {/* Render toolbar sections */}
            {toolbarSections.map((section, sectionIndex) => (
              <React.Fragment key={sectionIndex}>
                {section.buttons.map((button, buttonIndex) => (
                  <Button
                    key={buttonIndex}
                    size="sm"
                    variant={button.isActive ? 'secondary' : 'ghost'}
                    onClick={button.action}
                    className="h-8 w-8 p-0"
                    title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ''}`}
                    aria-label={button.label}
                    aria-pressed={button.isActive}
                  >
                    <button.icon className="h-3.5 w-3.5" />
                  </Button>
                ))}
                {/* Add ColorPicker after the first section (basic formatting) */}
                {sectionIndex === 0 && (
                  <>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <ColorPicker editor={editor} size="sm" variant="ghost" />
                  </>
                )}
                {section.separator && sectionIndex < toolbarSections.length - 1 && (
                  <Separator orientation="vertical" className="h-6 mx-1" />
                )}
              </React.Fragment>
            ))}
          </>
        ) : (
          /* Link input form */
          <div className="flex items-center gap-2 min-w-0" role="form" aria-label="Link editor">
            <div className="flex flex-col gap-1">
              <Input
                ref={linkInputRef}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Enter URL..."
                className="h-7 w-48 text-xs"
                aria-label="Link URL"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyLink();
                  }
                }}
              />
              {selectedText && (
                <Input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text (optional)"
                  className="h-7 w-48 text-xs"
                  aria-label="Link text"
                />
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={applyLink}
              className="h-7 w-7 p-0"
              title="Apply link"
              aria-label="Apply link"
            >
              <Check className="h-3.5 w-3.5 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelLink}
              className="h-7 w-7 p-0"
              title="Cancel"
              aria-label="Cancel link edit"
            >
              <X className="h-3.5 w-3.5 text-red-600" />
            </Button>
          </div>
        )}
      </div>
    </FloatingPortal>
  );
};

// Memoize to prevent unnecessary re-renders
export const FloatingToolbar = memo(FloatingToolbarComponent, (prevProps, nextProps) => {
  return (
    prevProps.editor === nextProps.editor &&
    prevProps.anchorEl === nextProps.anchorEl &&
    prevProps.format === nextProps.format &&
    prevProps.onClose === nextProps.onClose &&
    JSON.stringify(prevProps.selectionRange) === JSON.stringify(nextProps.selectionRange)
  );
});

FloatingToolbar.displayName = 'FloatingToolbar';