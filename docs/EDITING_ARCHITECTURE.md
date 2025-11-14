# Editing Architecture Diagram

## High-Level Flow Diagram

```
                    EDITING IN BRANDS IN BLOOMS

    ┌──────────────────────────────────────────────────────────┐
    │                   THREE EDITING MODES                     │
    └──────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   INLINE EDITING     │  │  DASHBOARD EDITOR    │  │  FULL SITE EDITOR    │
│   (Click to Edit)    │  │  (3-Panel Organized) │  │  (Live WYSIWYG)      │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
   ↓                          ↓                          ↓
yoursite.com?edit=true   /dashboard/content/       yoursite.com?edit=true
                         editor                         +Top Bar
   ↓                          ↓                          ↓
Click text               Left Sidebar              Edit/Navigate
Floating toolbar         + Center Preview              Toggle
Auto-save (manual)       + Right Settings             Auto-save (2s)
```

## Three-Panel Dashboard Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         EditorHeader                                │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Save | Unsaved Badge | Viewport (Mobile/Tablet/Desktop)     │ │
│  │ Sidebar Toggle | Layout Type | Undo/Redo                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
├──────────────────────┬───────────────────────┬────────────────────┤
│                      │                       │                    │
│  EditorSidebar       │  VisualEditor        │  Settings Panel    │
│  (Sections Panel)    │  (Preview Canvas)    │  (Page Settings)   │
│                      │                       │                    │
│  ┌────────────────┐  │  ┌────────────────┐  │  ┌──────────────┐  │
│  │ Section List:  │  │  │ Live Preview:  │  │  │ Page Info:   │  │
│  │                │  │  │                │  │  │              │  │
│  │ ⭐ Hero        │  │  │ ┌────────────┐ │  │  │ Title:       │  │
│  │ 📝 Rich Text   │  │  │ │  CLICK ME   │ │  │  │ ┌──────────┐│  │
│  │ 🖼️ Image       │  │  │ │  TO EDIT   │ │  │  │ │Product   ││  │
│  │ ⚡ Features    │  │  │ │ (inline)   │ │  │  │ │List      ││  │
│  │ 💬 Testimonials│  │  │ │            │ │  │  │ └──────────┘│  │
│  │ ...more       │  │  │ └────────────┘ │  │  │              │  │
│  │                │  │  │ [Floating Tbar]│  │  │ Slug:        │  │
│  │  + Add Sections│  │  │ (when editing) │  │  │ ┌──────────┐│  │
│  │                │  │  │                │  │  │ │/product- ││  │
│  └────────────────┘  │  │ Responsive:    │  │  │ │list      ││  │
│                      │  │ Mobile/Tablet/ │  │  │ └──────────┘│  │
│ Each Section:        │  │ Desktop        │  │  │              │  │
│ ├─ Icon & name       │  │                │  │  │ Published:   │  │
│ ├─ Badges (Req'd,    │  │                │  │  │ ☐ Toggle    │  │
│ │  Hidden, Empty)    │  │                │  │  │              │  │
│ ├─ Up/Down arrows    │  │                │  │  │ SEO:         │  │
│ ├─ Eye (visibility)  │  │                │  │  │ - Meta Desc  │  │
│ └─ Editor Form       │  │                │  │  │ - OG Tags    │  │
│   (scrollable)       │  │                │  │  │ - Layout     │  │
│                      │  │                │  │  │              │  │
└──────────────────────┴───────────────────────┴────────────────────┘
│                                                                      │
│                   EditorStatusBar                                   │
│  Last saved: 2 minutes ago | Viewport: Desktop | Layout: Landing   │
└──────────────────────────────────────────────────────────────────┘
```

## Inline Editor Component Hierarchy

```
InlineTextEditor (Main Component)
├─ EditorContent (Tiptap ProseMirror)
│  ├─ Text content
│  ├─ Formatting marks (bold, italic, etc)
│  └─ Nodes (headings, lists, images, links)
├─ FloatingToolbar (appears on selection)
│  ├─ Bold button
│  ├─ Italic button
│  ├─ Color picker
│  ├─ Link editor
│  ├─ Alignment buttons
│  ├─ Image upload
│  └─ List buttons
├─ ImageBubbleMenu (appears on image selection)
│  ├─ Replace image
│  ├─ Delete image
│  ├─ Edit alt text
│  └─ Adjust alignment
└─ State Management
   ├─ isEditing (boolean)
   ├─ showFloatingToolbar (boolean)
   ├─ selectionRange ({ from, to })
   └─ debouncedUpdate (500ms)
```

## Full Site Editor Component Hierarchy

```
FullSiteEditorBar (Top Navigation)
├─ Logo/Site name
├─ Page Navigator
│  └─ QuickPageSwitcher (dropdown)
├─ Edit/Navigate Toggle
├─ Viewport Selector (Mobile/Tablet/Desktop)
├─ Page Settings (modal)
├─ Create Page (modal)
├─ Save Status & Button
├─ Last Saved Time
└─ User Menu (Profile, Settings, Logout)

FullSiteEditorWrapper (Context Provider)
├─ EditModeProvider
├─ VisualEditorProvider
└─ FullSiteEditorProvider (manages state)

EditableCustomerSiteSection (Per-Section Wrapper)
├─ In Edit Mode:
│  ├─ SectionControls (visible on hover)
│  │  ├─ Edit icon (open settings)
│  │  ├─ Up/Down arrows (reorder)
│  │  ├─ Delete icon
│  │  ├─ Eye icon (visibility)
│  │  └─ + Add button
│  ├─ InlineEditors (click elements to edit)
│  ├─ SectionSettingsModal
│  └─ AddSectionModal (insert new section)
└─ In Navigate Mode:
   └─ (Just renders preview, no controls)
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PAGE CONTENT (State)                      │
│                                                              │
│  PageContent {                                              │
│    version: "1.0"                                          │
│    layout: "landing"                                       │
│    sections: {                                             │
│      "hero": ContentSection { ... }                        │
│      "features": ContentSection { ... }                    │
│      "cta": ContentSection { ... }                         │
│    }                                                        │
│    settings: {}                                            │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                        ↓ Updated by ↑
                        ↓            ↑
┌─────────────────────────────────────────────────────────────┐
│            EDITING INTERFACE (Components)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Inline Edit          │  Dashboard Edit     │  Site Edit    │
│  ─────────────────────┼─────────────────────┼──────────────│
│  Click text to edit   │  Sidebar forms      │  Click+       │
│  │                    │  │                  │  floating     │
│  └─→ InlineEditor    │  └─→ SectionEditor  │  toolbar      │
│      ↓                    ↓                 │  │             │
│      onChange()           onChange()        │  └─→ onChange()│
│      ↓                    ↓                 │  ↓             │
│      updateFieldContent() updateSection()  │  updateField() │
│      ↓                    ↓                 │  ↓             │
│      Trigger onUpdate() hook                Trigger update  │
│      ↓                    ↓                 │  ↓             │
│      Props update         Props update      │  Context update│
│      ↓                    ↓                 │  ↓             │
│      Preview re-renders   Preview re-renders Preview updates│
│                                                              │
└─────────────────────────────────────────────────────────────┘
                        ↓ Save ↑
                        ↓      ↑
┌─────────────────────────────────────────────────────────────┐
│              PERSISTENT STORAGE (Database)                   │
│                                                              │
│  Supabase.content {                                         │
│    id, site_id, slug, title, layout                        │
│    content: JSONB (serialized PageContent)                 │
│    meta_data: JSONB (theme, colors, etc)                   │
│    is_published, created_at, updated_at                    │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

## State Management Hierarchy

```
EditModeContext (Global Edit Mode)
├─ editMode: 'form' | 'inline' | 'preview'
├─ isInlineEditEnabled: boolean
├─ isDirty: boolean
├─ isSaving: boolean
└─ Used in: Dashboard Editor

FullSiteEditorContext (Full Site Editor State)
├─ isEditMode: boolean
├─ editorMode: 'edit' | 'navigate'
├─ viewportSize: 'mobile' | 'tablet' | 'desktop'
├─ pageContent: PageContent | null
├─ currentPageId: string | null
├─ activeSection: string | null
├─ hasUnsavedChanges: boolean
├─ isSaving: boolean
├─ lastSaved: Date | null
├─ updateFieldContent(): void
├─ updateSectionContent(): void
├─ addSection(): void
├─ deleteSection(): void
├─ savePage(): Promise<void>
└─ Used in: Full Site Editor on live pages

VisualEditorContext (Interactive Editor State)
├─ activeElement: EditableElement | null
├─ hoveredElement: EditableElement | null
├─ editableElements: EditableElement[]
├─ showOverlay: boolean
└─ Used in: Visual Editor preview
```

## Section Type to Editor Mapping

```
ContentSectionType              Editor Component
─────────────────────────────────────────────────────────

hero                      →     HeroEditor
header                    →     HeaderEditor
blogHeader                →     BlogHeaderEditor
featured                  →     FeaturedEditor
categories                →     CategoriesEditor
richText                  →     RichTextSectionEditor
text                      →     TextSectionEditor
image                     →     ImageSectionEditor
icon                      →     IconSectionEditor
features                  →     FeaturesEditor
cta                       →     CTAEditor
testimonials              →     TestimonialsEditor
faq                       →     FAQEditor
values                    →     ValuesEditor
mission                   →     MissionEditor
pricing                   →     PricingEditor
specifications            →     SpecificationsEditor
form                      →     FormBuilder
gallery                   →     GalleryEditor
team                      →     (Not implemented)

plant_showcase            →     PlantShowcaseEditor
plant_grid                →     PlantGridEditor
plant_care_guide          →     PlantCareGuideEditor
seasonal_tips             →     SeasonalTipsEditor
plant_categories          →     PlantCategoriesEditor
growing_conditions        →     GrowingConditionsEditor
plant_comparison          →     PlantComparisonEditor
care_calendar             →     CareCalendarEditor
plant_benefits            →     PlantBenefitsEditor
soil_guide                →     SoilGuideEditor
```

## Content Serialization Flow

```
┌──────────────────────────┐
│  PageContent (Runtime)   │ (In-memory TypeScript object)
│  ├─ version              │
│  ├─ layout               │
│  ├─ sections {}          │
│  │  ├─ type              │
│  │  ├─ data {}           │
│  │  ├─ visible           │
│  │  └─ settings {}       │
│  └─ settings {}          │
└──────────────────────────┘
        ↓ Save
        └→ serializePageContent()
             ├─ Convert HTML to JSON
             ├─ Normalize formatting
             └─ Prepare for DB storage
        ↓
┌──────────────────────────┐
│  Serialized JSON String  │ (JSONB in database)
│  (Stored in DB)          │
└──────────────────────────┘
        ↓ Load
        └→ deserializePageContent()
             ├─ Parse JSON
             ├─ Restore HTML
             └─ Validate structure
        ↓
┌──────────────────────────┐
│  PageContent (Runtime)   │ (Back in memory)
│  (Ready for editing)     │
└──────────────────────────┘
```

## Auto-Save Timeline (Full Site Editor)

```
User Action
    ↓
500ms → Debounce window opens (no immediate save)
    ↓
User types more... (still debouncing)
    ↓
User stops typing
    ↓
2000ms (2 seconds) → Debounce timeout fires
    ↓
Auto-save triggered
    ↓
Serialize & POST to API
    ↓
Database update
    ↓
Success toast notification
    ↓
Last saved time updated
```

## Permission Model

```
                        User Roles
┌──────────────────────────────────────────────────────┐
│ Owner  │  Admin  │  Editor  │  Viewer               │
├────────┼─────────┼──────────┼──────────┐            │
│Can Edit│ Can Edit│Can Edit  │ View Only│            │
│Can Mgmt│ Can Mgmt│ Limited* │          │            │
│CanPub  │CanPub   │ CannotPub│          │            │
└────────┴─────────┴──────────┴──────────┘            │

EditPermissions Interface {
  canEdit: boolean      (Can make edits)
  canManage: boolean    (Can add/remove sections)
  canPublish: boolean   (Can publish to live)
  role: 'owner' | 'admin' | 'editor' | 'viewer'
}
```

## Image Handling Pipeline

```
User clicks image button
    ↓
ImageUploadDialog opens
    ↓
User selects file (or drag & drop)
    ↓
File validation
├─ Type check (JPG, PNG, WebP, GIF, SVG)
└─ Size check (limits enforced)
    ↓
Upload to Supabase Storage
├─ Path: /sites/{siteId}/{filename}
└─ CDN delivery enabled
    ↓
Receive URL from storage
    ↓
Insert into content
├─ Inline: <img src="url" />
└─ Attributes: alt, align, class
    ↓
User can edit:
├─ Alt text (accessibility)
├─ Alignment (left/center/right)
└─ Replace/delete
```

## Responsive Preview Architecture

```
┌─────────────────────────────────────────┐
│         ViewportSize State              │
│  'desktop' | 'tablet' | 'mobile'       │
└─────────────────────────────────────────┘
            ↓ Affects:
            ↓
┌─────────────────────────────────────────┐
│    Container Width Constraints          │
├──────────────────────────────────────────┤
│ Desktop: 100% (full width)              │
│ Tablet:  768px                          │
│ Mobile:  375px                          │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Preview Component Rendering            │
│  (Responsive CSS applied)                │
│                                          │
│  @media (max-width: 768px) { ... }     │
│  @media (max-width: 640px) { ... }     │
│                                          │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│    User sees site as mobile/tablet      │
│    (testing responsive behavior)        │
└─────────────────────────────────────────┘
```

## File Organization Summary

```
Editing System
│
├── Components (UI)
│   ├── content-editor/
│   │   ├── Inline editing (InlineTextEditor.tsx)
│   │   ├── Formatting (FloatingToolbar.tsx)
│   │   ├── Dashboard panels (EditorHeader/Sidebar/StatusBar.tsx)
│   │   ├── Visual preview (visual/VisualEditor.tsx)
│   │   ├── Image management (ImageUploadDialog.tsx)
│   │   └── Section editors/ (30+ custom editors)
│   │
│   └── site-editor/
│       ├── Top bar (FullSiteEditorBar.tsx)
│       ├── Wrappers (FullSiteEditorWrapper.tsx)
│       ├── Section controls (SectionControls.tsx)
│       ├── Modals (AddSectionModal.tsx, etc)
│       └── Utilities (ViewportManager.tsx)
│
├── State Management (Contexts)
│   ├── EditModeContext.tsx (editor mode)
│   ├── FullSiteEditorContext.tsx (full site editor)
│   └── VisualEditorContext.tsx (preview interactions)
│
├── Data Management
│   ├── schema.ts (ContentSectionType, PageContent)
│   ├── serialization.ts (serialize/deserialize)
│   └── types.ts (TypeScript interfaces)
│
└── Pages
    └── /app/dashboard/content/editor/page.tsx
```

---

This architecture enables:
- Multiple editing modes with consistent UX
- Real-time preview updates
- Type-safe content structure
- Extensible section system (30+ types)
- Responsive editing (mobile/tablet/desktop)
- Auto-save with conflict prevention
- Permission-based access control
