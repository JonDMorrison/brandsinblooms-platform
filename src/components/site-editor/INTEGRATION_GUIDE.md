# Full Site Editor - Integration Guide

This guide shows how to integrate the full site editor into customer-facing pages.

## Overview

The full site editor allows users to edit their site directly on the customer-facing pages with visual click-to-edit functionality, section management, and real-time preview.

## Architecture

```
Customer Site Page (app/[...slug]/page.tsx)
├── Check edit mode (server-side)
├── Fetch page content
├── Wrap with FullSiteEditorWrapper (client)
│   ├── EditModeProvider
│   ├── VisualEditorProvider
│   ├── FullSiteEditorProvider
│   │   └── FullSiteEditorBar (when edit mode active)
│   └── SiteRenderer
│       ├── SiteNavigation
│       ├── Page Content
│       │   └── EditableCustomerSiteSection (wraps each section in edit mode)
│       │       ├── SectionControls (hover overlay)
│       │       └── CustomerSiteSection
│       │           └── Click-to-edit fields
│       └── SiteFooter (with login link)
```

## Step-by-Step Integration

### 1. Update Customer Site Page (Server Component)

```typescript
// app/[...slug]/page.tsx or app/[...slug]/components/HomePage.tsx

import { getEditModeStatus } from '@/src/lib/site-editor/server-utils'
import { FullSiteEditorWrapper } from '@/src/components/site-editor/FullSiteEditorWrapper'
import { FullSiteEditorBar } from '@/src/components/site-editor/FullSiteEditorBar'

export async function HomePage() {
  const { siteId } = await getSiteHeaders()
  const editModeStatus = await getEditModeStatus()

  // Fetch content...
  const supabase = await createClient()
  const contentResult = await getContentBySlug(supabase, siteId, 'home')
  const pageContent = contentResult ? deserializePageContent(contentResult.content) : null

  // Save handler for edit mode
  const handleSave = async (content: PageContent) => {
    'use server'
    // Implement save logic
    const supabase = await createClient()
    await updateContent(supabase, siteId, contentResult.id, {
      content: serializePageContent(content)
    })
  }

  return (
    <FullSiteEditorWrapper
      isEditMode={editModeStatus.isEditMode}
      permissions={editModeStatus.permissions}
      pageContent={pageContent}
      pageId={contentResult?.id}
      onSave={handleSave}
    >
      {/* Editor Bar (only shows in edit mode) */}
      <FullSiteEditorBar />

      {/* Regular site content */}
      <SiteRenderer siteId={siteId} mode="live" showNavigation={true}>
        {/* Your page sections here */}
      </SiteRenderer>
    </FullSiteEditorWrapper>
  )
}
```

### 2. Wrap Sections with EditableCustomerSiteSection

```typescript
// In your page component where sections are rendered

import { EditableCustomerSiteSection } from '@/src/components/site-editor/EditableCustomerSiteSection'
import { useIsEditModeActive } from '@/src/contexts/FullSiteEditorContext'

function YourPageContent() {
  const isEditMode = useIsEditModeActive()

  return (
    <>
      {orderedSections.map(({ key, section }) => {
        const sectionInfo = sectionDataMap[key]

        if (!sectionInfo || !sectionInfo.data) return null

        // Wrap in editable wrapper if in edit mode
        const sectionContent = (
          <CustomerSiteSection
            key={key}
            section={section}
            sectionKey={key}
            sectionData={sectionInfo.data}
            backgroundSetting={sectionInfo.backgroundSetting}
          />
        )

        if (isEditMode) {
          return (
            <EditableCustomerSiteSection
              key={key}
              sectionKey={key}
              section={section}
              onUpdate={(updatedSection) => {
                // Update section in context
              }}
            >
              {sectionContent}
            </EditableCustomerSiteSection>
          )
        }

        return sectionContent
      })}
    </>
  )
}
```

### 3. Add Click-to-Edit to Text Fields

Already implemented in `CustomerSiteSection` - when wrapped with `EditableCustomerSiteSection`, text fields automatically become editable.

### 4. Testing Edit Mode

1. **Access edit mode:**
   - Visit customer site (e.g., `soul-bloom-sanctuary.localhost:3001/home`)
   - Scroll to footer
   - Click "Site owner? Log in" or "Edit this site"
   - Log in with site owner/admin/editor credentials
   - System sets edit mode cookie and redirects back

2. **Edit mode features:**
   - Top bar appears with edit controls
   - Toggle Edit/Navigate mode
   - Switch viewport sizes
   - Hover over sections to see controls
   - Click text to edit inline
   - Save changes
   - Exit editor

## Key Components Created

### Phase 1: Authentication & Edit Mode
- ✅ `src/lib/site-editor/edit-session.ts` - Session management
- ✅ `src/lib/site-editor/middleware-helpers.ts` - Middleware utilities
- ✅ `app/api/site-editor/exit/route.ts` - Exit API endpoint
- ✅ `src/components/site/SiteFooter.tsx` - Enhanced with login link
- ✅ `middleware.ts` - Enhanced for edit mode detection

### Phase 2: Context & State
- ✅ `src/contexts/FullSiteEditorContext.tsx` - Edit state management
- ✅ `src/lib/site-editor/server-utils.ts` - Server-side utilities
- ✅ `src/components/site-editor/FullSiteEditorWrapper.tsx` - Page wrapper

### Phase 3: UI Components
- ✅ `src/components/site-editor/FullSiteEditorBar.tsx` - Top navigation bar

### Phase 4-5: Section Editing
- 🔄 `src/components/site-editor/EditableCustomerSiteSection.tsx` - TO BE CREATED
- 🔄 `src/components/site-editor/SectionControls.tsx` - TO BE CREATED

### Phase 6-7: Operations & Auto-save
- 🔄 `src/lib/site-editor/section-operations.ts` - TO BE CREATED
- 🔄 `src/hooks/useSiteEditorAutoSave.ts` - TO BE CREATED

### Phase 8-9: Advanced Features
- 🔄 `src/components/site-editor/CreatePageModal.tsx` - TO BE CREATED
- 🔄 Device preview functionality - TO BE IMPLEMENTED

## Next Steps

1. Create `EditableCustomerSiteSection` wrapper component
2. Create `SectionControls` overlay component
3. Implement section operations (hide, delete, reorder)
4. Add auto-save functionality
5. Test full workflow
6. Add page creation modal
7. Polish UI and add keyboard shortcuts

## Important Notes

- **Performance**: Edit mode components only load when edit session is active
- **Security**: Middleware validates edit permissions on every request
- **State Management**: Changes tracked in FullSiteEditorContext, persisted via save handler
- **Mobile**: Edit bar is responsive, section controls adapt to touch
- **Navigation**: Edit/Navigate mode toggle allows browsing site while editing

## Troubleshooting

**Edit mode not activating:**
- Check middleware logs for edit session validation
- Verify user has edit permissions in `site_memberships` table
- Check browser cookies for `x-site-edit-mode`

**Changes not saving:**
- Verify `onSave` handler is provided to `FullSiteEditorWrapper`
- Check network tab for save API calls
- Look for errors in browser console

**Visual editor not responding:**
- Ensure `EditModeProvider` and `VisualEditorProvider` are wrapping content
- Check that sections are wrapped with `EditableCustomerSiteSection`
- Verify edit mode is set to 'edit' not 'navigate'
