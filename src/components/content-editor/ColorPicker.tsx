'use client';

/**
 * Color picker dialog for rich text editor with theme color presets
 * Allows users to set text color overriding theme defaults
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Palette, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/src/lib/utils';
import type { Editor } from '@tiptap/react';

interface ColorPickerProps {
  /** The Tiptap editor instance */
  editor: Editor | null;
  /** Optional button size */
  size?: 'sm' | 'md';
  /** Optional button variant */
  variant?: 'ghost' | 'secondary';
  /** Disabled state */
  disabled?: boolean;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

/**
 * Get theme colors from CSS variables
 */
function getThemeColors(): ThemeColors {
  if (typeof window === 'undefined') {
    return {
      primary: '#10b981',
      secondary: '#8b5cf6',
      accent: '#f59e0b',
      text: '#1a1a1a'
    };
  }

  const computedStyle = getComputedStyle(document.body);

  return {
    primary: computedStyle.getPropertyValue('--theme-primary')?.trim() || '#10b981',
    secondary: computedStyle.getPropertyValue('--theme-secondary')?.trim() || '#8b5cf6',
    accent: computedStyle.getPropertyValue('--theme-accent')?.trim() || '#f59e0b',
    text: computedStyle.getPropertyValue('--theme-text')?.trim() || '#1a1a1a'
  };
}

export function ColorPicker({ editor, size = 'sm', variant = 'ghost', disabled = false }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState<string>('#000000');
  const [hexInputValue, setHexInputValue] = useState<string>('#000000');

  // Get theme colors
  const themeColors = useMemo(() => getThemeColors(), []);

  // Get current text color from editor
  const currentColor = useMemo(() => {
    if (!editor) return null;
    return editor.getAttributes('textStyle').color || null;
  }, [editor, editor?.state.selection]);

  // Handle theme preset selection
  const handleThemeColorSelect = useCallback((color: string) => {
    if (!editor) return;

    // Check if there's a text selection
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (hasSelection) {
      // Apply color to selected text only
      editor.chain().focus().setColor(color).run();
    } else {
      // No selection - apply color to all text in the editor
      editor.chain().focus().selectAll().setColor(color).run();
    }

    setIsOpen(false);
  }, [editor]);

  // Handle custom color apply
  const handleCustomColorApply = useCallback(() => {
    if (!editor) return;

    // Check if there's a text selection
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (hasSelection) {
      // Apply color to selected text only
      editor.chain().focus().setColor(customColor).run();
    } else {
      // No selection - apply color to all text in the editor
      editor.chain().focus().selectAll().setColor(customColor).run();
    }

    setIsOpen(false);
  }, [editor, customColor]);

  // Handle remove color
  const handleRemoveColor = useCallback(() => {
    if (!editor) return;

    // Check if there's a text selection
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (hasSelection) {
      // Remove color from selected text only
      editor.chain().focus().unsetColor().run();
    } else {
      // No selection - remove color from all text in the editor
      editor.chain().focus().selectAll().unsetColor().run();
    }

    setIsOpen(false);
  }, [editor]);

  // Handle hex input change
  const handleHexInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Always update the input display
    setHexInputValue(value);

    // Ensure it starts with #
    if (!value.startsWith('#')) {
      value = '#' + value;
      setHexInputValue(value);
    }

    // Only update customColor if it's a valid 6-character hex
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setCustomColor(value);
    }
  }, []);

  // Initialize custom color and hex input when dialog opens
  useEffect(() => {
    if (isOpen) {
      const editorColor = editor?.getAttributes('textStyle').color || '#000000';
      setCustomColor(editorColor);
      setHexInputValue(editorColor);
    }
  }, [isOpen]); // Only depend on isOpen to prevent resets

  // Sync hex input when customColor changes from color picker
  useEffect(() => {
    setHexInputValue(customColor);
  }, [customColor]);

  // Check if editor is active
  const isActive = editor?.isActive('textStyle', { color: currentColor || undefined }) || false;

  return (
    <>
      <Button
        size={size}
        variant={isActive ? 'secondary' : variant}
        onClick={() => setIsOpen(true)}
        disabled={disabled || !editor}
        className={cn(
          'relative text-foreground',
          size === 'sm' && 'h-8 w-8 p-0',
          size === 'md' && 'h-9 w-9 p-0'
        )}
        style={{ color: 'hsl(var(--foreground))' }}
        title="Text color"
        aria-label="Text color"
        aria-pressed={isActive}
      >
        <Palette className={cn(
          size === 'sm' && 'h-3.5 w-3.5',
          size === 'md' && 'h-4 w-4'
        )} />
        {/* Current color indicator */}
        {currentColor && (
          <div
            className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-white"
            style={{ backgroundColor: currentColor }}
          />
        )}
      </Button>

      {/* Color Picker Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Text Color</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {/* Theme Color Presets */}
            <div className="mb-4">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Theme Colors
              </div>
              <div className="flex gap-2 justify-center">
                {[
                  { color: themeColors.primary, label: 'Primary' },
                  { color: themeColors.secondary, label: 'Secondary' },
                  { color: themeColors.accent, label: 'Accent' },
                  { color: themeColors.text, label: 'Default' }
                ].map(({ color, label }) => (
                  <button
                    key={label}
                    onClick={() => handleThemeColorSelect(color)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-md hover:bg-accent transition-colors',
                      currentColor === color && 'bg-accent'
                    )}
                    title={label}
                    aria-label={`${label} color`}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all',
                        currentColor === color ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border'
                      )}
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Custom Color Picker */}
            <div className="mb-4">
              <div className="text-xs font-medium text-muted-foreground mb-3">
                Custom Color
              </div>
              <div className="flex flex-col items-center gap-3">
                <HexColorPicker
                  color={customColor}
                  onChange={setCustomColor}
                  style={{ width: '100%' }}
                />
                <div className="w-full">
                  <label htmlFor="hex-input" className="text-xs text-muted-foreground mb-1 block">
                    HEX
                  </label>
                  <input
                    id="hex-input"
                    type="text"
                    value={hexInputValue}
                    onChange={handleHexInputChange}
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-md border border-input',
                      'bg-background text-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      'placeholder:text-muted-foreground'
                    )}
                    placeholder="#000000"
                    maxLength={7}
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleRemoveColor}
            >
              <X className="h-4 w-4 mr-2" />
              Remove Color
            </Button>
            <Button onClick={handleCustomColorApply}>
              Apply Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
