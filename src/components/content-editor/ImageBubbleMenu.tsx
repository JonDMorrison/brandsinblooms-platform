'use client';

/**
 * Bubble menu for editing images in the rich text editor
 * Appears when an image is selected
 */

import React, { useCallback, useState, useEffect } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { type Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Edit,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface ImageBubbleMenuProps {
  editor: Editor;
}

export function ImageBubbleMenu({ editor }: ImageBubbleMenuProps) {
  const [width, setWidth] = useState<number>(100);
  const [altText, setAltText] = useState<string>('');
  const [isEditingAlt, setIsEditingAlt] = useState(false);

  // Update local state when image selection changes
  useEffect(() => {
    if (!editor.isActive('image')) return;

    const { node } = editor.state.selection as { node?: { attrs?: { width?: string; alt?: string } } };
    if (node?.attrs) {
      // Parse width from percentage or pixel value
      const widthAttr = node.attrs.width;
      if (widthAttr) {
        const widthNum = parseInt(widthAttr.toString().replace('%', '').replace('px', ''));
        if (!isNaN(widthNum)) {
          setWidth(widthNum);
        }
      }

      // Get alt text
      setAltText(node.attrs.alt || '');
    }
  }, [editor, editor.state.selection]);

  const updateImageWidth = useCallback((value: number[]) => {
    const newWidth = value[0];
    setWidth(newWidth);

    // Get current node position before update
    const { from } = editor.state.selection;

    // Update attributes and re-select the node to keep it selected
    editor.chain()
      .updateAttributes('image', {
        width: `${newWidth}%`
      })
      .setNodeSelection(from)
      .run();
  }, [editor]);

  const setAlignment = useCallback((align: 'left' | 'center' | 'right') => {
    // Get current node position before update
    const { from } = editor.state.selection;

    // Update attributes and re-select the node to keep it selected
    editor.chain()
      .updateAttributes('image', {
        align
      })
      .setNodeSelection(from)
      .run();
  }, [editor]);

  const deleteImage = useCallback(() => {
    editor.chain().focus().deleteSelection().run();
  }, [editor]);

  const updateAltText = useCallback(() => {
    editor.chain().focus().updateAttributes('image', {
      alt: altText
    }).run();
    setIsEditingAlt(false);
  }, [editor, altText]);

  const getAlignment = useCallback(() => {
    if (!editor.isActive('image')) return 'center';
    const { node } = editor.state.selection as { node?: { attrs?: { align?: string } } };
    return (node?.attrs?.align as 'left' | 'center' | 'right') || 'center';
  }, [editor]);

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => editor.isActive('image')}
      className="bg-white/95 backdrop-blur-sm border-gray-200 rounded-lg shadow-lg p-2 flex items-center gap-1"
    >
      {/* Width Control */}
      <div className="flex items-center gap-2 px-2 min-w-[200px]">
        <Label className="text-xs whitespace-nowrap">Width:</Label>
        <Slider
          value={[width]}
          onValueChange={updateImageWidth}
          min={25}
          max={100}
          step={5}
          className="flex-1"
        />
        <span className="text-xs font-medium w-10 text-right">{width}%</span>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Alignment Controls */}
      <Button
        variant={getAlignment() === 'left' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setAlignment('left')}
        title="Align Left"
        className="h-7 w-7 p-0"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={getAlignment() === 'center' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setAlignment('center')}
        title="Align Center"
        className="h-7 w-7 p-0"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={getAlignment() === 'right' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setAlignment('right')}
        title="Align Right"
        className="h-7 w-7 p-0"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Alt Text Editor */}
      <Popover open={isEditingAlt} onOpenChange={setIsEditingAlt}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            title="Edit Alt Text"
            className="h-7 w-7 p-0"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-white" align="start">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="image-alt">Alt Text</Label>
              <Input
                id="image-alt"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe the image..."
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Describe the image for screen readers and accessibility
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingAlt(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={updateAltText}>
                Update
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6" />

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={deleteImage}
        title="Delete Image"
        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </BubbleMenu>
  );
}
