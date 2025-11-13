'use client';

/**
 * Text input component with integrated color picker
 * Allows customizing text color per-field in addition to editing the text content
 */

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Palette, RotateCcw } from 'lucide-react';
import { ColorPicker } from '@/src/components/content-editor/ColorPicker';
import { cn } from '@/src/lib/utils';
import type { Editor } from '@tiptap/react';

export interface TextInputWithColorPickerProps {
  /** Field label */
  label: string;
  /** Current text value */
  value: string;
  /** Current color value (hex) - undefined means use theme color */
  colorValue?: string;
  /** Callback when text changes */
  onTextChange: (text: string) => void;
  /** Callback when color changes */
  onColorChange: (color: string | undefined) => void;
  /** Input placeholder */
  placeholder?: string;
  /** Use textarea instead of input */
  multiline?: boolean;
  /** Number of rows for textarea */
  rows?: number;
  /** Disable the input */
  disabled?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const TextInputWithColorPicker = React.memo(function TextInputWithColorPicker({
  label,
  value,
  colorValue,
  onTextChange,
  onColorChange,
  placeholder,
  multiline = false,
  rows = 3,
  disabled = false,
  className
}: TextInputWithColorPickerProps) {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Create a mock editor object for ColorPicker compatibility
  // ColorPicker expects an editor with setColor command and state.selection
  // useMemo to ensure it updates when colorValue changes
  const mockEditor = React.useMemo<Partial<Editor>>(() => ({
    chain: () => ({
      focus: () => ({
        setColor: (color: string) => {
          onColorChange(color);
          return { run: () => {} };
        },
        unsetColor: () => {
          onColorChange(undefined);
          return { run: () => {} };
        },
        run: () => {}
      } as any)
    } as any),
    isActive: () => false,
    getAttributes: () => ({ color: colorValue }),
    state: {
      selection: { from: 0, to: 0 }
    } as any
  } as any), [colorValue, onColorChange]);

  const handleResetColor = () => {
    onColorChange(undefined);
    setIsColorPickerOpen(false);
  };

  const InputComponent = multiline ? Textarea : Input;
  const inputProps = multiline ? { rows } : {};

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <InputComponent
            value={value}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full"
            {...inputProps}
          />
        </div>

        <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-10 w-10 flex-shrink-0",
                colorValue && "border-2"
              )}
              style={colorValue ? { borderColor: colorValue } : undefined}
              disabled={disabled}
              title={colorValue ? `Custom color: ${colorValue}` : "Use theme color"}
            >
              {colorValue ? (
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: colorValue }}
                />
              ) : (
                <Palette className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Text Color</span>
                {colorValue && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetColor}
                    className="h-7 px-2 text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset to Theme
                  </Button>
                )}
              </div>

              <ColorPicker
                editor={mockEditor as Editor}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {colorValue && (
        <p className="text-xs text-gray-500">
          Using custom color: <span className="font-mono">{colorValue}</span>
        </p>
      )}
    </div>
  );
});

TextInputWithColorPicker.displayName = 'TextInputWithColorPicker';
