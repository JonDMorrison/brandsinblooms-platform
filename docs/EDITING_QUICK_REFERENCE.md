# Editing Experience: Quick Reference Guide

## Three Ways to Edit Content

### 1. Inline Editing (Click to Edit)
**Best for:** Quick content changes, WYSIWYG feedback

```
Live Site: yoursite.com?edit=true
↓
Hover over text → Click to edit → Floating toolbar appears
↓
Edit text, format, add links/images → Click outside to save
```

**File Paths:**
- Main editor: `/src/components/content-editor/InlineTextEditor.tsx`
- Toolbar: `/src/components/content-editor/FloatingToolbar.tsx`

**What You Can Edit:**
- All text content (titles, body, descriptions)
- Text formatting (bold, italic, color, alignment)
- Links and images within rich text
- Button text and links
- Image alt text and alignment

**What You CANNOT Edit:**
- Section background colors → Use settings modal
- Page structure/layout → Use dashboard
- Page metadata (slug, SEO) → Use dashboard
- Section visibility → Use sidebar or section controls

---

### 2. Dashboard Editor (Organized Panels)
**Best for:** Comprehensive editing, bulk changes, SEO metadata

```
/dashboard/content/editor
↓
Left Sidebar        Center Preview         Right Settings
(Sections)          (Visual Preview)       (Page Settings)
├─ Section list     ├─ Live preview       ├─ Title
├─ Add sections     ├─ Click to edit      ├─ Slug
├─ Edit each        └─ Floating toolbar   ├─ Published status
└─ Reorder          ├─ SEO metadata
                    ├─ OG tags
                    └─ Layout type
```

**File Paths:**
- Main page: `/app/dashboard/content/editor/page.tsx`
- Sidebar: `/src/components/content-editor/EditorSidebar.tsx`
- Header: `/src/components/content-editor/EditorHeader.tsx`
- Visual: `/src/components/content-editor/visual/VisualEditor.tsx`
- Status: `/src/components/content-editor/EditorStatusBar.tsx`

**What You Can Edit:**
- Everything in inline editing PLUS:
- Section visibility (show/hide)
- Add/remove sections
- Reorder sections
- Page metadata (title, slug, published)
- SEO settings (meta description, OG tags)
- Layout type (landing, blog, portfolio, etc.)

---

### 3. Full Site Editor (Live Site Editing)
**Best for:** WYSIWYG editing on actual site, with auto-save

```
Live Site: yoursite.com?edit=true
↓
Top Bar: Edit/Navigate toggle, Save, Settings
↓
Edit Mode          OR         Navigate Mode
↓                            ↓
Click sections      →         Browse normally
Inline edit text              (no editing)
Section controls
Auto-save (2s)
```

**File Paths:**
- Top bar: `/src/components/site-editor/FullSiteEditorBar.tsx`
- Wrapper: `/src/components/site-editor/FullSiteEditorWrapper.tsx`
- Context: `/src/contexts/FullSiteEditorContext.tsx`
- Controls: `/src/components/site-editor/SectionControls.tsx`

**Key Features:**
- Auto-save every 2 seconds
- Edit vs Navigate mode toggle
- Viewport options (mobile/tablet/desktop)
- Section management (add/edit/delete/reorder)
- Page quick-switcher
- Responsive preview

---

## Section Types Available

### Core Sections
- Text, Rich Text, Image, Icon, Gallery

### Marketing Sections
- Hero (title + subtitle + features)
- Header (title + subtitle only)
- Featured (products/items showcase)
- Features (features list)
- Categories (product categories)
- CTA (call-to-action)
- Testimonials (customer quotes)

### Business Sections
- FAQ, Values, Mission, Pricing, Team, Form
- Specifications, Business Info

### Blog Sections
- Blog Header (title + author + date)

### Plant Shop Sections
- Plant Showcase, Plant Grid, Care Guide, Seasonal Tips
- Plant Categories, Growing Conditions, Plant Comparison
- Care Calendar, Plant Benefits, Soil Guide

**30+ section types total, each with custom editor**

---

## Editing Common Elements

### Edit a Hero Title
**Inline:** Click title → Edit text → Escape/click outside → Auto-save
**Dashboard:** Left sidebar → Hero section → TextInput field → Save

### Change Section Background Color
**Only Available:** Dashboard Editor → Expand section → Background color picker

### Add Text Formatting (Bold, Color, Link)
**Inline:** Select text → Floating toolbar → Click formatting button
**Dashboard:** Left sidebar → RichText section → Editor toolbar

### Upload an Image
**Inline:** Click image icon in floating toolbar → Choose file → Auto-upload
**Dashboard:** Left sidebar → ImageSectionEditor → Click upload → Choose file

### Add a New Section
**Inline:** Click "+" button in section → AddSectionModal → Choose type → Position
**Dashboard:** Left sidebar → "Add optional sections" → Click section type

### Hide/Show a Section
**Inline:** Section controls → Eye icon
**Dashboard:** Left sidebar → Section header → Eye icon

### Reorder Sections
**Inline:** Section controls → Up/Down arrows
**Dashboard:** Left sidebar → Section header → Chevron buttons (up/down)

### Publish/Unpublish Page
**Only Available:** Dashboard Editor → Right sidebar → Published Status toggle → Save

---

## Text Formatting Toolbar

### Available Formatting Commands

| Command | Inline | Dashboard | Shortcut |
|---------|--------|-----------|----------|
| Bold | Yes | Yes | Ctrl/Cmd+B |
| Italic | Yes | Yes | Ctrl/Cmd+I |
| Underline | Yes | Yes | Ctrl/Cmd+U |
| Strikethrough | Yes | Yes | - |
| Heading 1/2 | Yes | Yes | - |
| Bullet List | Yes | Yes | Ctrl/Cmd+Shift+8 |
| Numbered List | Yes | Yes | Ctrl/Cmd+Shift+7 |
| Alignment | Yes | Yes | - |
| Text Color | Yes | Yes | Color picker |
| Link | Yes | Yes | Ctrl/Cmd+K |
| Image | Yes | Yes | Upload button |
| Code | Limited | Limited | - |

### Toolbar Variants

1. **Full Toolbar** (Rich format)
   - All formatting options
   - Used in rich text sections

2. **Simple Toolbar** (Simple format)
   - Basic formatting + links + images
   - Lightweight variant

3. **Plain Toolbar** (Plain format)
   - Basic formatting only
   - Minimal options

4. **Single Line** (singleLine=true)
   - No line breaks
   - Text only
   - Used for titles, single-line fields

**File Path:** `/src/components/content-editor/InlineTextEditor.tsx`

---

## Image Management

### Upload Workflow
1. Click image button in floating toolbar (or upload area in section editor)
2. Select file from computer (drag & drop supported)
3. File uploads to Supabase Storage (CDN delivered)
4. Image inserted into content
5. Edit alt text and alignment after upload

### Image Editing
- **Alt Text:** Click image → Edit accessibility text
- **Alignment:** Set left/center/right alignment
- **Replace:** Delete and upload new image
- **Remove:** Delete button in image bubble menu

### Supported Formats
JPG/JPEG, PNG, WebP, GIF, SVG

**File Paths:**
- Upload dialog: `/src/components/content-editor/ImageUploadDialog.tsx`
- Bubble menu: `/src/components/content-editor/ImageBubbleMenu.tsx`
- Storage: `/src/lib/supabase/` (Supabase Storage client)

---

## Save & Auto-Save Behavior

### Dashboard Editor
- **Save:** Manual click on Save button in header
- **When to click:** After making changes
- **Unsaved badge:** Orange "Unsaved" badge in header
- **Validation:** Must pass validation to save

### Full Site Editor (Live Site)
- **Auto-save:** Every 2 seconds (debounced)
- **Manual save:** Click Save button anytime
- **Visual feedback:** Toast notification on success
- **Prevents:** Data loss with automatic saves

### Save Indicators
- **Unsaved badge:** Shows pending changes
- **Last saved time:** "Last saved 2 minutes ago"
- **Toast messages:** Success/error notifications

**File Paths:**
- Auto-save hook: `/src/hooks/useSiteEditorAutoSave.ts`
- Status bar: `/src/components/content-editor/EditorStatusBar.tsx`

---

## Comparison Matrix

| Feature | Inline | Dashboard | Full Site |
|---------|--------|-----------|-----------|
| **Quick edits** | ✓ | ✓ | ✓ |
| **WYSIWYG** | ✓ | ✓ | ✓✓ |
| **Page structure** | ✗ | ✓ | ✓ |
| **SEO editing** | ✗ | ✓ | Limited |
| **Auto-save** | ✗ | ✗ | ✓ |
| **Mobile friendly** | Responsive | Desktop | Responsive |
| **Best for** | Quick changes | Comprehensive | WYSIWYG + auto-save |

---

## Common Tasks

### Update Product Title
1. **Inline:** Click title on site → Edit → Save
2. **Dashboard:** Sidebar → Featured section → Title field → Save

### Add Product Description
1. **Inline:** Click description area → Edit → Formatting toolbar → Save
2. **Dashboard:** Sidebar → RichText section → Editor → Save

### Change Page Title/Slug
1. **Inline:** (Not available)
2. **Dashboard:** Right sidebar → Page Title → Edit title/slug → Save

### Make Page Published
1. **Inline:** (Limited - may have menu)
2. **Dashboard:** Right sidebar → Published Status → Toggle → Save

### Add a Features Section
1. **Inline:** Click "+" → AddSectionModal → Features → Position → Save
2. **Dashboard:** Sidebar → "Add optional sections" → Features → Configure → Save

### Hide/Show Section
1. **Inline:** Section controls → Eye icon
2. **Dashboard:** Sidebar section header → Eye icon

---

## Editor Modes (Full Site Only)

### Edit Mode
- Click sections to edit content
- Inline editors active
- Section controls visible
- Auto-save enabled
- Can add/remove sections

### Navigate Mode
- Browse site normally
- No editing
- Section controls hidden
- Useful for previewing
- Toggle via top bar button

**Context:** `/src/contexts/FullSiteEditorContext.tsx` (EditorMode type)

---

## Keyboard Shortcuts

### Text Editing
| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd+B | Bold |
| Ctrl/Cmd+I | Italic |
| Ctrl/Cmd+U | Underline |
| Ctrl/Cmd+K | Add link |
| Ctrl/Cmd+Shift+8 | Bullet list |
| Ctrl/Cmd+Shift+7 | Numbered list |
| Escape | Exit editor |

### Editor Actions
- Escape: Exit inline editor / close floating toolbar
- Ctrl/Cmd+S: Save (may be supported in dashboard)

---

## Important Notes

### Section Visibility
- **Hidden sections:** Don't appear on live site but remain in editor
- **Required sections:** Cannot be hidden (integrity)
- **Empty badge:** Shows sections with no content

### Permissions
- **Owner/Admin:** Full edit + publish
- **Editor:** Can edit, may not publish
- **Viewer:** Read-only access

### Validation
- Required fields shown in forms
- Cannot save with validation errors
- Error messages displayed

### Content Sync
- Live preview updates in real-time
- Changes sync between inline and sidebar editors
- All edits use same underlying data structure

---

## File Structure (Quick Navigation)

```
Editor Components:
├── /src/components/content-editor/
│   ├── InlineTextEditor.tsx (click-to-edit)
│   ├── FloatingToolbar.tsx (formatting)
│   ├── EditorSidebar.tsx (sections panel)
│   ├── EditorHeader.tsx (save, viewport)
│   └── editors/ (30+ section editors)
├── /src/components/site-editor/
│   ├── FullSiteEditorBar.tsx (top bar)
│   └── modals/ (settings, add sections)

State Management:
├── /src/contexts/EditModeContext.tsx
├── /src/contexts/FullSiteEditorContext.tsx
└── /src/contexts/VisualEditorContext.tsx

Data & Schema:
├── /src/lib/content/schema.ts (section types)
└── /src/lib/content/serialization.ts
```

---

**For full documentation, see:** `/EDITING_EXPERIENCE.md`
