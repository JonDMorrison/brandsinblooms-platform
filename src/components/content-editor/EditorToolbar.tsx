'use client';

/**
 * Rich text editor toolbar component
 */

import { type Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUploadDialog } from './ImageUploadDialog';

interface EditorToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  siteId?: string;
}

interface LinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  initialUrl?: string;
}

function LinkDialog({ isOpen, onClose, onSubmit, initialUrl = '' }: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
    onClose();
  }, [url, onSubmit, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Link</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim()}>
              Add Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditorToolbar({ editor, disabled = false, siteId }: EditorToolbarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const handleLinkAdd = useCallback((url: string) => {
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleLinkRemove = useCallback(() => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  }, [editor]);

  const handleImageInsert = useCallback((url: string, alt: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url, alt }).run();
    }
  }, [editor]);

  const isActive = useCallback((name: string, attributes?: Record<string, unknown>) => {
    return editor?.isActive(name, attributes) ?? false;
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-border p-2 flex items-center gap-1 flex-wrap">
      {/* Basic Formatting: Bold, Italic */}
      <Button
        variant={isActive('bold') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled}
        title="Bold (Ctrl+B)"
        className="h-7 w-7 p-0"
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={isActive('italic') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
        title="Italic (Ctrl+I)"
        className="h-7 w-7 p-0"
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Heading Controls: Paragraph, H1, H2 */}
      <Button
        variant={!isActive('heading') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setParagraph().run()}
        disabled={disabled}
        title="Paragraph"
        className="h-7 w-7 p-0 text-xs font-medium"
      >
        P
      </Button>
      <Button
        variant={isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        disabled={disabled}
        title="Heading 1"
        className="h-7 w-8 p-0 text-xs font-medium"
      >
        H1
      </Button>
      <Button
        variant={isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={disabled}
        title="Heading 2"
        className="h-7 w-8 p-0 text-xs font-medium"
      >
        H2
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Alignment Controls */}
      <Button
        variant={isActive({ textAlign: 'left' }) || (!isActive({ textAlign: 'center' }) && !isActive({ textAlign: 'right' })) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        disabled={disabled}
        title="Align Left"
        className="h-7 w-7 p-0"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        disabled={disabled}
        title="Align Center"
        className="h-7 w-7 p-0"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        disabled={disabled}
        title="Align Right"
        className="h-7 w-7 p-0"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Link Control */}
      <Button
        variant={isActive('link') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLinkDialogOpen(true)}
        disabled={disabled}
        title="Link (Ctrl+K)"
        className="h-7 w-7 p-0"
      >
        <Link className="h-3.5 w-3.5" />
      </Button>

      {/* Image Control */}
      <Button
        variant={isActive('image') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setImageDialogOpen(true)}
        disabled={disabled || !siteId}
        title={!siteId ? 'Site ID required for image upload' : 'Insert Image'}
        className="h-7 w-7 p-0"
      >
        <ImageIcon className="h-3.5 w-3.5" />
      </Button>

      <LinkDialog
        isOpen={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onSubmit={handleLinkAdd}
      />

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
}