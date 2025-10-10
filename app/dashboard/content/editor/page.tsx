'use client';

import { useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// Context & State
import { useSiteContext } from '@/src/contexts/SiteContext';
import { EditModeProvider } from '@/src/contexts/EditModeContext';
import { VisualEditorProvider } from '@/src/contexts/VisualEditorContext';

// Site Utils
import { getCustomerSiteDisplayUrl } from '@/src/lib/site/url-utils';

// Content Management
import { VisualEditor } from '@/src/components/content-editor/visual/VisualEditor';
import { InlineLoader } from '@/src/components/content-editor/visual/LoadingStates';
import {
  PageContent,
  LayoutType as ContentLayoutType,
  serializePageContent,
  LAYOUT_SECTIONS,
} from '@/src/lib/content';
import { handleError } from '@/src/lib/types/error-handling';

// Extracted Components
import { EditorHeader } from '@/src/components/content-editor/EditorHeader';
import { EditorSidebar } from '@/src/components/content-editor/EditorSidebar';
import { EditorStatusBar } from '@/src/components/content-editor/EditorStatusBar';
import { useContentEditorData } from '@/src/hooks/useContentEditorData';

// Database
import { supabase } from '@/src/lib/supabase/client';
import { updateContent } from '@/src/lib/queries/domains/content';

// Types
type LayoutType =
  | 'landing'
  | 'blog'
  | 'portfolio'
  | 'about'
  | 'product'
  | 'contact'
  | 'other';
type ViewportSize = 'mobile' | 'tablet' | 'desktop';

interface PageData {
  title: string;
  subtitle?: string;
  layout: LayoutType;
}

interface UnifiedPageContent extends PageContent {
  title?: string;
  subtitle?: string;
}

const layoutInfo = {
  landing: { name: 'Landing Page' },
  blog: { name: 'Blog Article' },
  portfolio: { name: 'Portfolio Grid' },
  about: { name: 'About/Company' },
  product: { name: 'Product Page' },
  contact: { name: 'Contact/Services' },
  other: { name: 'Custom/Other' },
};

function PageEditorContent() {
  const searchParams = useSearchParams();
  const contentId = searchParams?.get('id') || null;
  const { currentSite, loading: siteLoading } = useSiteContext();

  // UI state
  const [activeViewport, setActiveViewport] = useState<ViewportSize>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [activeSectionKey, setActiveSectionKey] = useState<
    string | undefined
  >();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const contentEditorRef = useRef<{ resetDirtyState: () => void } | null>(null);

  // Content data management
  const {
    pageData,
    setPageData,
    isLoading,
    pageContent,
    unifiedContent,
    setUnifiedContent,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    slug,
    isPublished,
    seoSettings,
    handleTitleChange,
    handleContentChange,
    handleContentSave,
    handleSlugChange,
    handlePublishedChange,
    handleSEOChange,
    handleSetAsHomePage,
  } = useContentEditorData({
    contentId,
    siteId: currentSite?.id,
    siteLoading,
  });

  // Handle section visibility toggle
  const toggleSectionVisibility = useCallback(
    (sectionKey: string) => {
      if (!pageContent) return;

      const currentSection = pageContent.sections[sectionKey];
      if (!currentSection) return;

      // Check if this is a required section - don't allow hiding required sections
      const layoutConfig = LAYOUT_SECTIONS[pageData?.layout as ContentLayoutType];
      if (layoutConfig?.required.includes(sectionKey) && currentSection.visible) {
        // Show a toast notification that required sections can't be hidden
        toast.info('Required sections cannot be hidden');
        return;
      }

      const updatedContent: PageContent = {
        ...pageContent,
        sections: {
          ...pageContent.sections,
          [sectionKey]: {
            ...currentSection,
            visible: !currentSection.visible,
          },
        },
      };

      handleContentChange(updatedContent, true);
    },
    [pageContent, handleContentChange, pageData?.layout]
  );

  const handleLayoutChange = (newLayout: LayoutType) => {
    if (!pageData) return;
    setPageData({ ...pageData, layout: newLayout });
    if (unifiedContent) {
      setUnifiedContent({
        ...unifiedContent,
        layout: newLayout as ContentLayoutType,
      });
    }
    setHasUnsavedChanges(true);
  };

  const handlePageTitleChange = (title: string) => {
    if (!pageData) return;
    setPageData({ ...pageData, title });
    if (unifiedContent) {
      setUnifiedContent({
        ...unifiedContent,
        title
      });
    }
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!contentId || !currentSite?.id || !unifiedContent) {
      toast.error('Missing required information to save');
      return;
    }

    setIsSaving(true);
    try {
      const metaData = {
        layout: pageContent?.layout || unifiedContent.layout,
        ...(pageContent?.settings || unifiedContent.settings || {}),
      };

      const contentData = serializePageContent(
        pageContent || {
          version: unifiedContent.version,
          layout: unifiedContent.layout,
          sections: unifiedContent.sections,
          settings: unifiedContent.settings,
        }
      );

      await updateContent(supabase, currentSite.id, contentId, {
        title: pageData.title || '',
        meta_data: metaData,
        content: contentData,
        content_type: pageContent?.layout === 'blog' ? 'blog_post' : 'page',
      });

      setHasUnsavedChanges(false);
      contentEditorRef.current?.resetDirtyState?.();
      toast.success('Content saved successfully!');
    } catch (error) {
      handleError(error);
      console.error('Failed to save content:', error);
      toast.error('Failed to save content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !pageData) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <InlineLoader
            size='md'
            message={isLoading ? 'Loading content...' : 'Preparing editor...'}
          />
        </div>
      </div>
    );
  }

  const validLayout =
    pageData.layout in layoutInfo ? pageData.layout : 'landing';

  return (
    <div className='h-full flex flex-col bg-white'>
      <EditorHeader
        pageData={pageData}
        unifiedContent={unifiedContent}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        activeViewport={activeViewport}
        isSidebarOpen={isSidebarOpen}
        pageContent={pageContent}
        onSave={handleSave}
        onViewportChange={setActiveViewport}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSectionVisibilityToggle={toggleSectionVisibility}
      />

      {/* Main Content */}
      <div className='flex-1 flex overflow-hidden'>
        {/* Sidebar */}
        {isSidebarOpen && contentId && currentSite?.id && (
          <EditorSidebar
            contentId={contentId}
            siteId={currentSite.id}
            pageData={pageData}
            pageContent={pageContent}
            activeSectionKey={activeSectionKey}
            contentEditorRef={contentEditorRef}
            onLayoutChange={handleLayoutChange}
            onContentSave={handleContentSave}
            onContentChange={handleContentChange}
            onTitleChange={handleTitleChange}
            onPageTitleChange={handlePageTitleChange}
            onSectionClick={setActiveSectionKey}
            siteUrl={currentSite ? getCustomerSiteDisplayUrl(currentSite) : 'example.com'}
            initialSlug={slug}
            initialIsPublished={isPublished}
            onSlugChange={handleSlugChange}
            onPublishedChange={handlePublishedChange}
            onSetAsHomePage={handleSetAsHomePage}
            seoSettings={seoSettings}
            onSEOChange={handleSEOChange}
          />
        )}

        {/* Visual Editor */}
        <div className='flex-1 bg-muted/20 overflow-hidden'>
          <VisualEditor
            content={(() => {
              const content = pageContent || {
                version: '1.0',
                layout: validLayout as ContentLayoutType,
                sections: {},
              };
              return content;
            })()}
            layout={validLayout as ContentLayoutType}
            title={pageData.title}
            subtitle={
              typeof pageContent?.sections?.hero?.data?.subtitle === 'string'
                ? pageContent.sections.hero.data.subtitle
                : typeof pageContent?.sections?.header?.data?.subtitle ===
                  'string'
                ? pageContent.sections.header.data.subtitle
                : pageData.subtitle
            }
            onContentChange={(content) => {
              handleContentChange(content, true);
            }}
            onTitleChange={handleTitleChange}
            onSubtitleChange={(subtitle) => {
              setPageData((prev) => (prev ? { ...prev, subtitle } : null));
              setHasUnsavedChanges(true);
            }}
            viewport={activeViewport}
            className='h-full w-full'
          />
        </div>
      </div>

      <EditorStatusBar
        layout={validLayout}
        activeViewport={activeViewport}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    </div>
  );
}

export default function PageEditorPage() {
  return (
    <EditModeProvider defaultMode='inline'>
      <VisualEditorProvider>
        <PageEditorContent />
      </VisualEditorProvider>
    </EditModeProvider>
  );
}
