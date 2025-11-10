'use client';

/**
 * Color picker for rich text editor with theme color presets
 * Allows users to set text color overriding theme defaults
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SketchPicker, ColorResult } from 'react-color';
import { useFloating, autoUpdate, offset, flip, shift, FloatingPortal } from '@floating-ui/react';
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
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Floating UI setup
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({ padding: 8 }),
      shift({ padding: 8 })
    ],
    placement: 'bottom-start'
  });

  // Get theme colors
  const themeColors = useMemo(() => getThemeColors(), [isOpen]);

  // Get current text color from editor
  const currentColor = useMemo(() => {
    if (!editor) return null;
    return editor.getAttributes('textStyle').color || null;
  }, [editor, editor?.state.selection]);

  // Handle theme preset selection
  const handleThemeColorSelect = useCallback((color: string, colorName: string) => {
    if (!editor) return;

    editor.chain().focus().setColor(color).run();
    setIsOpen(false);
  }, [editor]);

  // Handle custom color change from SketchPicker
  const handleCustomColorChange = useCallback((color: ColorResult) => {
    setCustomColor(color.hex);
  }, []);

  // Apply custom color
  const handleCustomColorApply = useCallback(() => {
    if (!editor) return;

    editor.chain().focus().setColor(customColor).run();
    setIsOpen(false);
  }, [editor, customColor]);

  // Remove color (revert to theme default)
  const handleRemoveColor = useCallback(() => {
    if (!editor) return;

    editor.chain().focus().unsetColor().run();
    setIsOpen(false);
  }, [editor]);

  // Update custom color when current color changes
  useEffect(() => {
    if (currentColor) {
      setCustomColor(currentColor);
    }
  }, [currentColor]);

  // Check if editor is active and has selection
  const isActive = editor?.isActive('textStyle', { color: currentColor || undefined }) || false;

  return (
    <>
      <Button
        ref={(el) => {
          buttonRef.current = el;
          refs.setReference(el);
        }}
        size={size}
        variant={isActive ? 'secondary' : variant}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || !editor}
        className={cn(
          'relative',
          size === 'sm' && 'h-8 w-8 p-0',
          size === 'md' && 'h-9 w-9 p-0'
        )}
        title="Text color"
        aria-label="Text color"
        aria-pressed={isActive}
        aria-expanded={isOpen}
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

      {/* Color Picker Popover */}
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={cn(
              'z-50 rounded-lg border bg-popover shadow-lg',
              'animate-in fade-in-0 zoom-in-95 duration-150',
              'p-4'
            )}
            onMouseDown={(e) => {
              // Prevent editor blur when clicking inside popover
              e.preventDefault();
            }}
            role="dialog"
            aria-label="Color picker"
          >
            {/* Theme Color Presets */}
            <div className="mb-4">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Theme Colors
              </div>
              <div className="flex gap-2">
                {[
                  { color: themeColors.primary, label: 'Primary' },
                  { color: themeColors.secondary, label: 'Secondary' },
                  { color: themeColors.accent, label: 'Accent' },
                  { color: themeColors.text, label: 'Default' }
                ].map(({ color, label }) => (
                  <button
                    key={label}
                    onClick={() => handleThemeColorSelect(color, label)}
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

            <Separator className="my-3" />

            {/* Custom Color Picker */}
            <div className="mb-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Custom Color
              </div>
              <SketchPicker
                color={customColor}
                onChange={handleCustomColorChange}
                disableAlpha={true}
                presetColors={[
                  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
                  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
                ]}
                width="240px"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleCustomColorApply}
                className="flex-1"
              >
                Apply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemoveColor}
                className="flex-1"
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>

            {/* Close hint */}
            <div className="text-[10px] text-muted-foreground text-center mt-2">
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">Esc</kbd> to close
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
