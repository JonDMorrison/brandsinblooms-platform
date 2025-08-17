# Rich Text Editor Components

A complete Tiptap-based rich text editor implementation for the Brands in Blooms platform.

## Components

### RichTextEditor

Main rich text editor component with toolbar and content editing capabilities.

```tsx
import { RichTextEditor } from '@/components/content-editor';

function MyComponent() {
  return (
    <RichTextEditor
      placeholder="Start writing your content..."
      onSave={async (content) => {
        // Save content to your backend
        console.log('HTML:', content.html);
        console.log('JSON:', content.json);
        console.log('Text:', content.text);
      }}
      showToolbar={true}
      showSaveButton={false}
      autoFocus={true}
      minHeight="300px"
    />
  );
}
```

### EditorToolbar

Standalone toolbar component (automatically included in RichTextEditor).

```tsx
import { EditorToolbar } from '@/components/content-editor';

function MyEditor() {
  const { editor } = useRichTextEditor();
  
  return (
    <div>
      <EditorToolbar editor={editor} disabled={false} />
      {/* Your editor content */}
    </div>
  );
}
```

## Hooks

### useRichTextEditor

Hook for managing editor state with debounced saves.

```tsx
import { useRichTextEditor } from '@/hooks/useRichTextEditor';

function MyComponent() {
  const {
    editor,
    content,
    isLoading,
    error,
    isDirty,
    save,
    reset,
    setContent,
  } = useRichTextEditor({
    initialContent: '<p>Initial content</p>',
    placeholder: 'Type something...',
    onSave: async (content) => {
      // Auto-save functionality
    },
    saveDelay: 1000,
    readOnly: false,
  });

  return (
    <div>
      {isLoading && <div>Loading editor...</div>}
      {error && <div>Error: {error}</div>}
      <EditorContent editor={editor} />
    </div>
  );
}
```

## Features

- **Basic Formatting**: Bold, italic, strikethrough
- **Headings**: H1, H2, H3
- **Lists**: Bullet and ordered lists
- **Links**: Add and remove links with URL validation
- **Undo/Redo**: Full history support
- **Auto-save**: Debounced saving with configurable delay
- **Multiple Export Formats**: HTML, JSON, and plain text
- **Loading States**: Proper loading and error handling
- **TypeScript**: Full type safety with proper error handling
- **Responsive**: Works on desktop and mobile devices

## SSR Compatibility

The editor is designed to work with Next.js 15 App Router:

- Uses `'use client'` directive for client-side rendering
- Handles editor initialization with proper loading states
- Guards against null editor during SSR

## Type Safety

All components follow the platform's type safety standards:

- No `any` types used
- Proper error handling with `handleError` utility
- Generated types from Tiptap extensions
- Full TypeScript coverage

## Styling

Uses Tailwind CSS with shadcn/ui components:

- Consistent with platform design system
- Responsive and accessible
- Dark mode support via next-themes
- Customizable via className props