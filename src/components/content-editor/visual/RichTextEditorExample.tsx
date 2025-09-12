'use client';

/**
 * Example usage of the Milestone 2 inline rich text editing system
 * Demonstrates integration with VisualEditorContext and M1 foundation
 */

import React, { useState } from 'react';
import { VisualEditorProvider } from '@/src/contexts/VisualEditorContext';
import { EditModeProvider } from '@/src/contexts/EditModeContext';
import { InlineRichTextEditor } from './InlineRichTextEditor';
import { EditableRichText } from './EditableRichText';

interface ExampleContent {
  title: string;
  description: string;
  richContent: string;
}

export const RichTextEditorExample: React.FC = () => {
  const [content, setContent] = useState<ExampleContent>({
    title: 'Welcome to Rich Text Editing',
    description: 'Click anywhere to start editing with full rich text capabilities.',
    richContent: '<h2>Rich Text Example</h2><p>This is a <strong>rich text</strong> editor with <em>italic</em>, <u>underline</u>, and <a href="https://example.com">link</a> support.</p><ul><li>Bullet lists</li><li>With multiple items</li></ul>'
  });

  const handleContentChange = (fieldPath: string, newContent: string) => {
    console.log('Content updated:', { fieldPath, newContent });
    
    // Update the appropriate field based on path
    if (fieldPath === 'title') {
      setContent(prev => ({ ...prev, title: newContent }));
    } else if (fieldPath === 'description') {
      setContent(prev => ({ ...prev, description: newContent }));
    } else if (fieldPath === 'richContent') {
      setContent(prev => ({ ...prev, richContent: newContent }));
    }
  };

  return (
    <EditModeProvider>
      <VisualEditorProvider onContentUpdate={handleContentChange}>
        <div className="max-w-4xl mx-auto p-8 space-y-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            Milestone 2: Rich Text Editor Demo
          </h1>

          {/* Example 1: Simple Rich Text Editor */}
          <div className="border rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Direct InlineRichTextEditor Usage</h3>
            <div className="bg-white p-4 rounded border">
              <InlineRichTextEditor
                content={content.title}
                onUpdate={(newContent) => handleContentChange('title', newContent)}
                isEnabled={true}
                fieldPath="title"
                sectionKey="example"
                format="simple"
                placeholder="Click to edit title..."
                className="text-xl font-bold"
              />
            </div>
          </div>

          {/* Example 2: Full Rich Text with All Features */}
          <div className="border rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-semibold mb-4">Full Rich Text Editor</h3>
            <div className="bg-white p-4 rounded border">
              <InlineRichTextEditor
                content={content.richContent}
                onUpdate={(newContent) => handleContentChange('richContent', newContent)}
                isEnabled={true}
                fieldPath="richContent"
                sectionKey="example"
                format="rich"
                placeholder="Click to edit rich content..."
                className="prose max-w-none"
              />
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded text-sm">
              <p><strong>Available Features:</strong></p>
              <ul className="list-disc list-inside mt-2">
                <li><kbd>Ctrl+B</kbd> - Bold</li>
                <li><kbd>Ctrl+I</kbd> - Italic</li>
                <li><kbd>Ctrl+U</kbd> - Underline</li>
                <li><kbd>Ctrl+K</kbd> - Link</li>
                <li><kbd>Esc</kbd> - Exit editing</li>
                <li>Select text to show floating toolbar</li>
              </ul>
            </div>
          </div>

          {/* Example 3: Visual Editor Integration */}
          <div className="border rounded-lg p-6 bg-green-50">
            <h3 className="text-lg font-semibold mb-4">Visual Editor Integration</h3>
            <div className="bg-white p-4 rounded border">
              <EditableRichText
                sectionKey="hero"
                fieldPath="sections.hero.data.description"
                content={content.description}
                onContentChange={handleContentChange}
                format="rich"
                placeholder="Click to edit description..."
                className="text-gray-700"
              />
            </div>
            <div className="mt-4 p-3 bg-green-100 rounded text-sm">
              <p><strong>Visual Editor Features:</strong></p>
              <ul className="list-disc list-inside mt-2">
                <li>Hover indicators</li>
                <li>Click to edit activation</li>
                <li>Auto-save integration</li>
                <li>Focus management</li>
                <li>Accessibility compliance</li>
              </ul>
            </div>
          </div>

          {/* Implementation Status */}
          <div className="border rounded-lg p-6 bg-purple-50">
            <h3 className="text-lg font-semibold mb-4">Milestone 2 Implementation Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-700 mb-2">✅ Completed Features</h4>
                <ul className="text-sm space-y-1">
                  <li>✅ Enhanced InlineRichTextEditor with full rich text capabilities</li>
                  <li>✅ Contextual FloatingToolbar with formatting options</li>
                  <li>✅ Rich text extensions (bold, italic, underline, links, headings, lists)</li>
                  <li>✅ Keyboard shortcuts for common formatting</li>
                  <li>✅ Proper focus management and cursor preservation</li>
                  <li>✅ ARIA labels and accessibility compliance</li>
                  <li>✅ Integration with M1 VisualEditorContext</li>
                  <li>✅ Auto-save with 2-second debouncing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-700 mb-2">🔧 Technical Features</h4>
                <ul className="text-sm space-y-1">
                  <li>🔧 Tiptap-based rich text engine</li>
                  <li>🔧 Two format modes: 'simple' and 'rich'</li>
                  <li>🔧 Floating UI positioning</li>
                  <li>🔧 Selection-based toolbar activation</li>
                  <li>🔧 Click-to-cursor positioning</li>
                  <li>🔧 Keyboard navigation in toolbar</li>
                  <li>🔧 Memoized re-render optimization</li>
                  <li>🔧 TypeScript type safety</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Raw Content Display */}
          <div className="border rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Current Content State</h3>
            <pre className="bg-white p-4 rounded border text-xs overflow-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        </div>
      </VisualEditorProvider>
    </EditModeProvider>
  );
};