'use client';

/**
 * Text input component with integrated color picker
 * Allows customizing text color per-field in addition to editing the text content
 */

import React, { useState, useMemo } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Palette, RotateCcw } from 'lucide-react';
import { cn } from '@/src/lib/utils';

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

/**
 * Get theme colors from CSS variables
 */
function getThemeColors() {
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
  const [customColor, setCustomColor] = useState<string>(colorValue || '#000000');

  // Get theme colors
  const themeColors = useMemo(() => getThemeColors(), []);

  const handleThemeColorSelect = (color: string) => {
    onColorChange(color);
    setIsColorPickerOpen(false);
  };

  const handleCustomColorApply = () => {
    onColorChange(customColor);
    setIsColorPickerOpen(false);
  };

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
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
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
                    Reset
                  </Button>
                )}
              </div>

              {/* Theme Color Presets */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Theme Colors
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { color: themeColors.primary, label: 'Primary' },
                    { color: themeColors.secondary, label: 'Secondary' },
                    { color: themeColors.accent, label: 'Accent' },
                    { color: themeColors.text, label: 'Text' }
                  ].map(({ color, label }) => (
                    <button
                      key={label}
                      onClick={() => handleThemeColorSelect(color)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-md hover:bg-accent transition-colors',
                        colorValue === color && 'bg-accent'
                      )}
                      title={label}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          colorValue === color ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-border'
                        )}
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Custom Color Picker */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Custom Color
                </div>
                <div className="flex flex-col gap-3">
                  <HexColorPicker
                    color={customColor}
                    onChange={setCustomColor}
                    style={{ width: '100%' }}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="flex-1 h-9 text-sm font-mono"
                      placeholder="#000000"
                      maxLength={7}
                    />
                    <Button
                      onClick={handleCustomColorApply}
                      size="sm"
                      className="h-9"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
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
