# Brands in Blooms Platform: Site Editing Experience Documentation

## Overview

The platform provides multiple editing modes for site owners to customize their content and design. This document details each editing modality, their capabilities, and workflows.

---

## 1. INLINE EDITING (Edit in Place)

### What Is It?

Inline editing allows site owners to edit content directly on the live site preview without switching to a separate editor interface. This is the primary editing mode for customer-facing site editing.

### When Available

- **On Live Customer Sites**: When accessing your site with `?edit=true` query parameter
- **Full Site Editor Mode**: When the site is in "edit mode" toggle (Edit vs Navigate)
- **Active by default** in dashboard editor's visual preview (center panel)

### How It Works

**Access Points:**
1. Live site with edit mode enabled (`/site-url?edit=true`)
2. Dashboard editor visual preview (VisualEditor component)
3. Full Site Editor on customer pages

**Interaction Model:**

**Hover State:**
- Hovering over editable content shows subtle background highlight (violet-500/5)
- Cursor changes to `cursor-text`
- Visual feedback indicates content is editable

**Click to Edit:**
- Click on any editable text to enter edit mode
- Editor wraps with ring styling: `ring-2 ring-primary/50 ring-offset-1 bg-white rounded`
- Focus indicator shows which field is being edited

**Active Editing:**
- Floating toolbar appears above edited text automatically
- Escape key exits editing mode
- Click outside to blur and save (auto-save with debounce)

### What Can Be Edited Inline

**Text Content:**
- Page titles and subtitles (headlines)
- Section headings
- Body text and descriptions
- Feature list items
- Testimonials
- Testimonial author names
- Value statements
- CTA copy

**Rich Text Formatting (in visual preview):**
- Bold (`Ctrl/Cmd+B`)
- Italic (`Ctrl/Cmd+I`)
- Text alignment (left, center, right)
- Font size / heading levels
- Text color (via color picker)
- Links (insert/edit/remove)
- Lists (bullet and numbered)
- Images within rich text

**Images:**
- Upload new images via dialog
- Replace existing images
- Adjust image alignment
- Edit image alt text

**Links & Buttons:**
- Edit button text
- Change button links and targets
- Set button styles

### What CANNOT Be Edited Inline

- Section background colors (use Settings panel)
- Layout and positioning of sections
- Section visibility (use sidebar or section controls)
- Advanced section settings
- Page metadata (slug, published status, SEO)
- Adding/removing sections
- Reordering sections

### Floating Toolbar Features

**Text Formatting Options (appears on selection):**
- Bold button
- Italic button
- Text color picker
- Link editor (popup with URL input)
- Alignment buttons (left/center/right)
- Image upload button
- List formatting (bullet/numbered)

**Toolbar Positioning:**
- Uses floating-ui for smart positioning
- Appears above selected text (primary placement)
- Falls back to top-start/top-end if space constraints
- Auto-repositions as text selection changes
- Stays visible while interacting

### File Paths (Inline Editing Components)

Core inline editing implementation:
- `/src/components/content-editor/InlineTextEditor.tsx` - Main inline editor component with Tiptap
- `/src/components/content-editor/FloatingToolbar.tsx` - Rich formatting toolbar
- `/src/components/content-editor/SimpleFloatingToolbar.tsx` - Simplified toolbar variant
- `/src/contexts/EditModeContext.tsx` - Manages edit vs preview mode state

---

## 2. DASHBOARD EDITOR

### What Is It?

The Dashboard Editor is a dedicated editing environment accessible at `/dashboard/content/editor` with three main panels:

1. **Left Sidebar (Sections Panel)** - Edit sections and their content
2. **Center Canvas (Visual Preview)** - Live preview with inline editing
3. **Right Sidebar (Settings Panel)** - Page metadata and SEO settings

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│                      EditorHeader (Save, Undo, Viewport)        │
├──────────────────┬──────────────────────────┬──────────────────┤
│                  │                          │                  │
│   EditorSidebar  │   VisualEditor           │   Settings Panel │
│   (Sections)     │   (Live Preview)         │   (Page Settings)│
│                  │   with InlineEditors     │                  │
│                  │                          │                  │
└──────────────────┴──────────────────────────┴──────────────────┘
│                      EditorStatusBar (Save Status)              │
└────────────────────────────────────────────────────────────────┘
```

### Left Sidebar: Sections Panel

**File Path:** `/src/components/content-editor/EditorSidebar.tsx`

**What It Does:**
- Lists all sections on the current page
- Allows editing each section's content and settings
- Shows section type, visibility, and required status
- Enables section management (add, remove, reorder, hide)

**Section Display:**
- Icon for section type (hero 🦸, features ⚡, etc.)
- Section name (auto-formatted from key)
- Badges showing:
  - "Required" - Cannot be hidden
  - "Hidden" - Section not visible on live site
  - "Empty" - No content entered yet

**Section Editing:**
- Click to expand section editor
- Each section type has custom editor form
- Real-time visual preview in center panel
- Save button at header level (not per-section)

**Section Management:**
- **Move Up/Down:** Reorder sections (chevron buttons)
- **Show/Hide:** Eye icon toggles visibility
- **Add Sections:** "Add optional sections" area shows available types
- **Required Sections:** Cannot be hidden, always show eye icon disabled

**Supported Section Editors:**

| Section Type | Editor Component | Capabilities |
|---|---|---|
| Hero | HeroEditor | Title, subtitle, CTA buttons, features with icons |
| Header | HeaderEditor | Simplified: title + subtitle only |
| Blog Header | BlogHeaderEditor | Title, subtitle, author, date, featured image |
| Featured | FeaturedEditor | Product showcase, database integration toggle |
| Categories | CategoriesEditor | Category cards with images and descriptions |
| Rich Text | RichTextSectionEditor | Full formatting, headings, links, images |
| Text | TextSectionEditor | Plain text content |
| Image | ImageSectionEditor | Single image with upload and alt text |
| Icon | IconSectionEditor | Icon selection and sizing |
| Features | FeaturesEditor | List of features with descriptions |
| CTA | CTAEditor | Call-to-action section with button |
| Testimonials | TestimonialsEditor | Customer quotes and author info |
| FAQ | FAQEditor | Question/answer pairs |
| Values | ValuesEditor | Company values with descriptions |
| Mission | MissionEditor | Mission statement |
| Pricing | PricingEditor | Pricing tiers and features |
| Specifications | SpecificationsEditor | Product specifications |
| Form | FormBuilder | Contact form builder |
| Gallery | GalleryEditor | Multiple image grid |
| Plant-specific | Various editors | Plant showcase, care guide, seasonal tips, etc. |

**File Paths (Section Editors):**
- `/src/components/content-editor/editors/` - All section editor components
- `/src/components/content-editor/ContentEditor.tsx` - Container managing all sections

### Center Canvas: Visual Preview

**File Path:** `/src/components/content-editor/visual/VisualEditor.tsx`

**What It Shows:**
- Live, responsive preview of page as it appears to visitors
- Shows all sections in their actual layout
- Real-time updates as sidebar edits are made

**Interactive Features:**
- Click any text to enter inline edit mode
- Hover for visual feedback
- Floating toolbar appears when editing
- Images can be edited inline
- Links clickable with Ctrl/Cmd (opens in new tab)

**Viewport Options:**
- Desktop (full width)
- Tablet (768px)
- Mobile (375px)
- Responsive viewport selector in header

**Edit Mode vs Navigate Mode:**
In full site editor on live pages:
- **Edit Mode** - Can click sections to edit, inline editing enabled
- **Navigate Mode** - Browse page normally, no editing
- Toggle in top bar

### Right Sidebar: Page Settings Panel

**File Path:** `/src/components/content-editor/EditorSidebar.tsx` (integrated)

**Manages:**
- **Page Title** - Display name and H1 tag
- **Page Slug** - URL path (e.g., `/about` for about page)
- **Published Status** - Toggle to publish/unpublish page
- **Home Page** - Set as site home page
- **SEO Settings:**
  - Meta description
  - OG title and description
  - OG image
  - Custom meta tags
- **Layout Type** - Landing, blog, portfolio, about, product, contact, other

**File Path:** `/src/components/content-editor/EditorSidebar.tsx`

### Header: Editor Controls

**File Path:** `/src/components/content-editor/EditorHeader.tsx`

**Controls:**
- **Save Button** - Saves all changes (disabled if no unsaved changes)
- **Unsaved Badge** - Shows "Unsaved" when changes exist
- **Viewport Selector** - Switch between mobile/tablet/desktop preview
- **Sidebar Toggle** - Show/hide sections panel
- **Undo/Redo** - Navigate change history (if implemented)
- **Last Saved Timestamp** - Shows when page was last saved

### Status Bar: Save Status

**File Path:** `/src/components/content-editor/EditorStatusBar.tsx`

**Displays:**
- Last saved timestamp (e.g., "Last saved 2 minutes ago")
- Active viewport size
- Page layout type
- Unsaved changes indicator

---

## 3. FULL SITE EDITOR (Live Site Editing)

### What Is It?

Editing directly on your published website with a floating toolbar at the top. This provides the most natural WYSIWYG (What You See Is What You Get) experience.

### Access

- Visit your site with `?edit=true` parameter
- Or use edit button in site settings (if available)
- Requires site edit permissions

### User Interface

**Top Bar (FullSiteEditorBar):**
- **Logo/Brand Name** - Site identification
- **Page Navigation** - Current page, quick page switcher
- **Edit/Navigate Toggle** - Switch between edit and view modes
- **Viewport Selector** - Mobile/tablet/desktop preview
- **Page Settings** - Access page metadata
- **Create Page** - Add new pages
- **Save Status** - Shows unsaved changes indicator
- **Save Button** - Manual save
- **Last Saved Time** - Timestamp of last save
- **User Menu** - Profile, settings, logout

**Fixed Top Bar Height:** 56px (pt-14 = 14*4px)

**File Path:** `/src/components/site-editor/FullSiteEditorBar.tsx`

### Editing Modes

**Edit Mode:**
- Click text/images to edit inline
- Section controls appear on hover
- Add/remove sections available
- Changes tracked automatically
- Auto-save enabled (2 second debounce)

**Navigate Mode:**
- Browse site normally
- No editing possible
- No section controls visible
- Useful for previewing changes

**File Path:** `/src/contexts/FullSiteEditorContext.tsx` (manages both modes)

### Section Controls (Edit Mode)

When hovering over a section in edit mode:

**Visible Controls:**
- **Edit Icon** - Expand section settings
- **Move Icons** - Reorder sections up/down
- **Delete Icon** - Remove section
- **Visibility Icon** - Show/hide section
- **Add Section Button** - Insert new section above/below

**Settings Modal:**
- Edit section-specific settings
- Change background colors
- Adjust padding/spacing
- Modify section appearance

**Add Section Modal:**
- Search section types by name
- Grouped by category (Core, Marketing, Business, Plant Shop)
- Searchable and filterable
- Insert above or below current section

**File Paths:**
- `/src/components/site-editor/SectionControls.tsx` - Control buttons
- `/src/components/site-editor/modals/SectionSettingsModal.tsx` - Settings editor
- `/src/components/site-editor/AddSectionModal.tsx` - Section picker

### Auto-Save Behavior

**File Path:** `/src/hooks/useSiteEditorAutoSave.ts`

**How It Works:**
- Changes auto-saved every 2 seconds (configurable)
- Debounced to prevent excessive database writes
- Success toast on save completion
- Error toast if save fails
- Can be disabled if needed

**Manual Save:**
- Click save button in top bar anytime
- Keyboard shortcut available (Ctrl/Cmd+S may be supported)

### Section Types & Customization

**Available Section Types:** (Same as dashboard editor)

30+ section types grouped by purpose:
- **Core:** Text, Rich Text, Image, Icon, Gallery
- **Marketing:** Hero, Header, Features, Featured, CTA, Testimonials
- **Business:** FAQ, Values, Mission, Pricing, Team, Form
- **Plant Shop:** Plant Grid, Care Guide, Seasonal Tips, etc.

**Section-Specific Customization:**

Each section type supports different editable properties:
- Text content (inline)
- Background colors/patterns
- Layout variations
- Button links and styles
- Image sources
- Feature lists
- Pricing details
- etc.

### Permissions & Roles

**File Path:** `/src/contexts/FullSiteEditorContext.tsx` (EditPermissions)

Supported Roles:
- **Owner** - Full access, can publish
- **Admin** - Full access, can publish
- **Editor** - Can edit content, may not publish
- **Viewer** - Read-only access

Permissions:
- `canEdit` - Can make changes
- `canManage` - Can manage sections/pages
- `canPublish` - Can publish to live site

---

## 4. SECTION TYPES & CAPABILITIES MATRIX

### Hero Section
- **Dashboard Editor:** HeroEditor
- **Inline Editable:** Title, subtitle, CTA text, feature items
- **Settings:** CTA button URL, feature icons, colors
- **Related Components:** `/src/components/content-editor/editors/HeroEditor.tsx`

### Header Section
- **Dashboard Editor:** HeaderEditor
- **Inline Editable:** Title, subtitle
- **Settings:** Background style, padding
- **Simpler:** Title + subtitle only (vs hero with features)

### Featured Products
- **Dashboard Editor:** FeaturedEditor
- **Inline Editable:** Title, subtitle
- **Settings:** Database integration toggle, product limit
- **Displays:** Featured products from inventory or manual items
- **Related Components:** `/src/components/content-editor/editors/FeaturedEditor.tsx`

### Features/Values
- **Dashboard Editor:** FeaturesEditor, ValuesEditor
- **Inline Editable:** Feature/value titles and descriptions
- **Settings:** Icons, layout, colors
- **Allows:** Add/remove feature items, reorder
- **Customization:** Icon selection per item

### Testimonials
- **Dashboard Editor:** TestimonialsEditor
- **Inline Editable:** Quote, author name, role
- **Settings:** Author image, rating (if applicable)
- **Allows:** Add/remove testimonials

### Categories / Products
- **Dashboard Editor:** CategoriesEditor
- **Inline Editable:** Category name, description, image
- **Settings:** Category display, filtering
- **Related:** Plant-specific category editors

### Blog Header
- **Dashboard Editor:** BlogHeaderEditor
- **Inline Editable:** Title, subtitle, author, date
- **Special:** Featured image with upload
- **Related:** `/src/components/content-editor/editors/BlogHeaderEditor.tsx`

### CTA (Call-to-Action)
- **Dashboard Editor:** CTAEditor
- **Inline Editable:** Headline, description, button text
- **Settings:** Button color, link target
- **Related:** `/src/components/content-sections/editors/CTAEditor.tsx`

### Rich Text Blocks
- **Dashboard Editor:** RichTextSectionEditor
- **Inline Editable:** Full formatted content
- **Formatting:** Headings, bold, italic, links, lists, alignment
- **Media:** Inline images with captions
- **Advanced:** Color picker for text

### Image Section
- **Dashboard Editor:** ImageSectionEditor
- **Inline Editable:** Image source, alt text, caption
- **Controls:** Upload, replace, adjust size
- **Settings:** Image alignment, border, shadow

---

## 5. TEXT FORMATTING CAPABILITIES

### Available Formatting

**In Inline Editors:**

| Feature | Support | Method |
|---------|---------|--------|
| Bold | Yes | Button or Ctrl/Cmd+B |
| Italic | Yes | Button or Ctrl/Cmd+I |
| Underline | Yes | Button or Ctrl/Cmd+U |
| Strikethrough | Yes | Available in toolbar |
| Heading 1/2 | Yes | Dropdown in toolbar |
| Bullet List | Yes | Button or Ctrl/Cmd+Shift+8 |
| Numbered List | Yes | Button or Ctrl/Cmd+Shift+7 |
| Text Alignment | Yes | Left/Center/Right buttons |
| Text Color | Yes | Color picker in toolbar |
| Link | Yes | Add/edit/remove via dialog |
| Inline Image | Yes | Upload dialog |
| Code Block | Limited | Partial support |

**Format Variants:**

Three toolbar variants available:
1. **Full Toolbar** (format='rich') - All formatting options
2. **Simple Toolbar** (format='simple-toolbar') - Basic formatting + links + images
3. **Plain** (format='plain') - Basic formatting only
4. **Single Line** (singleLine=true) - Text only, no line breaks or paragraphs

**File Path:** `/src/components/content-editor/InlineTextEditor.tsx` (lines 31-51, 66-192)

### Color Customization

**Text Colors:**
- Color picker integrated in floating toolbar
- Hex color input (e.g., `#FF5733`)
- Applied per selection or field-wide
- Theme-aware defaults if not specified

**Section Background Colors:**
- Set via section settings modal (not inline)
- Predefined color options
- Custom hex input available
- Affects entire section background

**Button Colors:**
- Part of button styling settings
- Available in CTA, hero, and featured sections
- Affects button background and text color

**File Paths:**
- `/src/components/content-editor/ColorPicker.tsx` - Color selection component
- `/src/components/content-editor/inputs/TextInputWithColorPicker.tsx` - Combined input

---

## 6. IMAGE MANAGEMENT

### Image Upload Workflow

**Where Available:**
1. Inline in rich text - Click image icon in toolbar
2. Section editors - Upload buttons for featured images
3. Gallery sections - Multi-image upload
4. Hero/Featured sections - Background or showcase images

**Upload Process:**
1. Click image button in toolbar (or upload area)
2. Select file from computer
3. File uploaded to Supabase Storage
4. Image URL inserted into content
5. Can edit alt text and alignment after upload

**Inline Image Dialog:**
- **File Path:** `/src/components/content-editor/ImageUploadDialog.tsx`
- Drag & drop support
- File type validation
- Size limits enforced
- Progress indicator during upload

### Image Editing

**After Upload:**
- **Alt Text:** Click image to edit accessibility text
- **Alignment:** Set image alignment (left/center/right)
- **Sizing:** Auto-scaled to fit content width
- **Replacement:** Delete and upload new image
- **Position:** Drag to reorder in multi-image sections

**Image Bubble Menu:**
- **File Path:** `/src/components/content-editor/ImageBubbleMenu.tsx`
- Appears when image selected
- Options: Replace, delete, edit alt text, adjust alignment

### Storage & Delivery

**Storage Location:**
- Supabase Storage (cloud object storage)
- Organized by site ID
- Automatic CDN delivery
- Persistent across edits

**Image Types Supported:**
- JPG/JPEG
- PNG
- WebP
- GIF
- SVG

**File Paths:**
- `/src/lib/supabase/` - Storage client methods
- `/src/hooks/` - Custom hooks for image operations

---

## 7. COMPARISON: INLINE vs DASHBOARD EDITING

### Quick Reference Table

| Feature | Inline Editing | Dashboard Editor |
|---------|---|---|
| **Access Location** | Live site with `?edit=true` | `/dashboard/content/editor` |
| **Preview Type** | Actual live site | Center canvas preview |
| **Edit Text** | Click to edit | Sidebar form or inline |
| **Add Sections** | Click "+" button | Plus button in sidebar |
| **Remove Sections** | Section controls menu | Sidebar section delete |
| **Reorder Sections** | Drag or arrow controls | Sidebar move buttons |
| **Page Settings** | Top bar menu | Right sidebar |
| **Best For** | Quick edits, WYSIWYG | Comprehensive editing |
| **Performance** | Full site rendering | Lightweight preview |
| **SEO Editing** | Limited | Full control |
| **Multi-page** | One page at a time | Switch via sidebar |
| **Undo/Redo** | Not visible | Via context (if impl.) |
| **Save** | Auto-save + manual | Manual save button |
| **Mobile-friendly** | Yes (responsive viewport) | Desktop optimized |

### When to Use Each

**Use Inline Editing When:**
- Making quick text changes
- Want WYSIWYG feedback
- Prefer intuitive "edit in place" UX
- Testing content on actual site layout
- Not changing page structure

**Use Dashboard Editor When:**
- Redesigning page layout
- Adding/removing sections
- Bulk content changes
- Editing SEO metadata
- Want organized section forms
- Managing multiple sections efficiently

---

## 8. EDITING WORKFLOW EXAMPLES

### Example 1: Update Product Featured Description (Inline)

1. Navigate to live site in edit mode (`?edit=true`)
2. Scroll to Featured Products section
3. Click on featured product title or description
4. Inline editor activates with floating toolbar
5. Edit text and formatting
6. Click outside or press Escape to save
7. Auto-save persists changes (2 second debounce)

### Example 2: Add New Features Section (Dashboard)

1. Go to `/dashboard/content/editor`
2. Scroll down in left sidebar to "Add optional sections"
3. Click "+ Features" button
4. Section appears in sidebar
5. Click to expand Features section editor
6. Add feature items via "Add Feature" button
7. Fill in icon, title, description per item
8. Center preview updates in real-time
9. Click "Save" in header when done

### Example 3: Change Hero Title & Colors (Inline + Settings)

**Quick Edit (Inline):**
1. Site in edit mode
2. Click hero title text
3. Edit and format with toolbar
4. Auto-saves

**Full Edit (Dashboard):**
1. Dashboard editor
2. Click Hero section in sidebar
3. Use HeroEditor form to edit
4. Adjust title color via color picker
5. Set CTA button and link
6. Save page

### Example 4: Publish Content (Dashboard)

1. Dashboard editor
2. Right sidebar → Scroll to "Published Status"
3. Toggle "Publish this page"
4. Click Save
5. Page now visible to visitors

---

## 9. FILE STRUCTURE REFERENCE

### Main Editor Components

```
/src/components/
├── content-editor/
│   ├── ContentEditor.tsx (main section editor container)
│   ├── EditorHeader.tsx (toolbar with save, viewport, etc.)
│   ├── EditorSidebar.tsx (sections panel + page settings)
│   ├── EditorStatusBar.tsx (save status display)
│   ├── InlineTextEditor.tsx (click-to-edit text with Tiptap)
│   ├── FloatingToolbar.tsx (rich formatting toolbar)
│   ├── SimpleFloatingToolbar.tsx (simplified toolbar)
│   ├── ColorPicker.tsx (hex color input)
│   ├── ImageUploadDialog.tsx (file upload dialog)
│   ├── ImageBubbleMenu.tsx (image editing menu)
│   │
│   ├── visual/
│   │   ├── VisualEditor.tsx (center canvas with inline editing)
│   │   ├── EditOverlay.tsx (edit indicators and overlay)
│   │   └── ...utilities and hooks
│   │
│   └── editors/
│       ├── HeroEditor.tsx
│       ├── HeaderEditor.tsx
│       ├── BlogHeaderEditor.tsx
│       ├── FeaturedEditor.tsx
│       ├── FeaturesEditor.tsx
│       ├── TestimonialsEditor.tsx
│       ├── CategoriesEditor.tsx
│       ├── FAQEditor.tsx
│       ├── RichTextSectionEditor.tsx
│       ├── ImageSectionEditor.tsx
│       └── ...all 30+ section editors
│
├── site-editor/
│   ├── FullSiteEditorBar.tsx (top bar UI)
│   ├── FullSiteEditorWrapper.tsx (context provider wrapper)
│   ├── ClientSiteEditorWrapper.tsx (load/save wrapper)
│   ├── EditableCustomerSiteSection.tsx (section wrapper with controls)
│   ├── SectionControls.tsx (edit/delete/reorder buttons)
│   ├── AddSectionModal.tsx (section type picker)
│   │
│   └── modals/
│       ├── SectionSettingsModal.tsx
│       ├── PageSettingsModal.tsx
│       └── ...other modals
│
└── content-sections/
    ├── preview/ (section preview components for live render)
    ├── editors/ (section-specific editors for plant shop)
    └── shared/ (shared editor utilities)

/src/contexts/
├── EditModeContext.tsx (form/inline/preview mode state)
├── FullSiteEditorContext.tsx (full site editor state management)
└── VisualEditorContext.tsx (visual editor interactive state)

/app/dashboard/content/
└── editor/
    └── page.tsx (dashboard editor page)

/src/lib/content/
├── schema.ts (section types, content structure)
└── serialization.ts (serialize/deserialize content)
```

### Context & State Management

**EditModeContext:**
- Edit mode: 'form' | 'inline' | 'preview'
- Manages global edit state
- Used in dashboard editor

**FullSiteEditorContext:**
- Full site editor state (edit vs navigate mode)
- Section CRUD operations
- Content updates and persistence
- Used on live customer sites during editing

**VisualEditorContext:**
- Visual editor interactive state
- Active/hovered elements
- Edit overlay indicators

---

## 10. KEY FEATURES & BEHAVIORS

### Auto-Save

- **When:** Every 2 seconds with debounce (edit mode only)
- **Where:** Full site editor on customer sites
- **Visual Feedback:** Toast notification on success/failure
- **Manual Save:** Also available via Save button

### Unsaved Changes Warning

- Dashboard: "Unsaved" badge in header
- Before leaving: May prompt if changes exist
- Visual indicator on page title

### Section Visibility

- **Hidden sections:** Don't appear on live site but remain in editor
- **Required sections:** Cannot be hidden (for layout integrity)
- **Toggle:** Eye icon in sidebar or section controls

### Responsive Editing

- Desktop (full width)
- Tablet (768px width)
- Mobile (375px width)
- Switch viewport without losing edits
- Content scales responsively

### Undo/Redo

- **Status:** May be partially implemented
- **Context:** Managed by EditModeContext
- **Scope:** Session-based (not persisted)

### Content Validation

- Required fields marked in forms
- Inline validation on save
- Error messages displayed
- Cannot save with validation errors

### Draft Auto-Save

- Changes tracked locally
- Server saves every 2 seconds (full site editor)
- Dashboard: Only saves on explicit Save click
- Prevents data loss

---

## 11. TROUBLESHOOTING & KNOWN BEHAVIORS

### Inline Editor Won't Open

**Causes:**
- Not in edit mode (`?edit=true` missing)
- Not on editable section
- Rich text in plain text field

**Solution:**
- Verify URL has `?edit=true`
- Check section type supports inline editing
- Use dashboard editor for non-inline sections

### Floating Toolbar Disappears

**Normal behavior:**
- Toolbar hides when blur event fires
- Short delay (150ms) allows toolbar interaction
- Press Escape to close editor

**If stuck:**
- Refresh page
- Switch to navigate mode and back

### Changes Not Saving

**Check:**
- Unsaved badge visible? Click Save button
- Network connection active
- Database permissions for site
- Server logs for errors

### Section Not Appearing

**Causes:**
- Section hidden (eye icon off)
- Invalid section type
- Layout doesn't support section
- Section empty and marked hidden

**Fix:**
- Show section (eye icon)
- Verify layout type
- Add content to section

---

## Summary

The Brands in Blooms platform provides **two complementary editing modes**:

1. **Inline Editing** - Fast, intuitive, WYSIWYG on live site
2. **Dashboard Editor** - Comprehensive, structured, organized

Both modes support the same **30+ section types** with full customization of text, images, colors, and styling. Auto-save ensures no data loss, while flexible permissions allow teams to collaborate safely.

The architecture separates concerns cleanly:
- **Contexts** manage state globally
- **Editors** handle section-specific forms
- **Preview components** render actual output
- **Inline components** enable click-to-edit

This enables both power users (dashboard) and casual editors (inline) to work efficiently.
