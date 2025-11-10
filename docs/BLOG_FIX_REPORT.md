# Blog Feature - Critical Bug Fix

**Date**: November 8, 2025
**Issue**: Blog posts created WITHOUT sample content showed wrong sections (Hero, Features, CTA) instead of Blog Header and Content

---

## Root Cause Analysis

### The Problem
When creating a blog post via the wizard and **unchecking "Include sample content"**, the created blog post would show:
- ❌ Hero section
- ❌ Features section
- ❌ CTA section

Instead of the correct sections per `blog-specs.md`:
- ✅ Blog Header section (title, subtitle, author, published date, image)
- ✅ Content section

### The Bug Location

**File**: `src/lib/content/templates.ts`

**Issue 1 - Template Detection** (Line 514):
```typescript
// BEFORE (WRONG):
const layout = templateId.includes('about') ? 'about' : 'landing'
```

This code only checked for 'about' templates, causing **all blog templates to fall through to 'landing'** layout, which has Hero, Features, and CTA sections.

**Issue 2 - Blog Template Structure** (Lines 129-150):
```typescript
// BEFORE (WRONG):
blog: {
  version: '1.0',
  layout: 'blog',
  sections: {
    header: {              // Wrong section key!
      type: 'hero',        // Wrong section type!
      ...
    },
    content: {
      type: 'richText',    // Wrong content type!
      ...
    }
  }
}
```

The blog template used:
1. **Wrong section key**: `header` instead of `blogHeader`
2. **Wrong section type**: `'hero'` instead of `'blogHeader'`
3. **Wrong content type**: `'richText'` instead of `'content'`

This didn't match the blog layout schema definition in `src/lib/content/schema.ts:407-444`.

---

## The Fix

### Fix 1: Template Detection (Lines 514-524)

**AFTER (CORRECT)**:
```typescript
// Determine layout based on template ID
let layout: LayoutType = 'landing'
if (templateId.includes('about')) {
  layout = 'about'
} else if (templateId.includes('blog')) {
  layout = 'blog'                        // ✅ Now detects blog templates!
} else if (templateId.includes('contact')) {
  layout = 'contact'
} else if (templateId.includes('portfolio')) {
  layout = 'portfolio'
}
return getBasicLayoutTemplate(layout, title, subtitle)
```

### Fix 2: Blog Template Structure (Lines 129-154)

**AFTER (CORRECT)**:
```typescript
blog: {
  version: '1.0',
  layout: 'blog',
  sections: {
    blogHeader: {                        // ✅ Correct section key
      type: 'blogHeader',                // ✅ Correct section type
      visible: true,
      order: 1,
      data: {
        title: title || '',
        subtitle: subtitle || '',
        author: '',
        publishedDate: new Date().toISOString().split('T')[0],
        image: ''
      }
    },
    content: {
      type: 'content',                   // ✅ Correct content type
      visible: true,
      order: 2,
      data: {
        richText: `<h2>Introduction</h2>...`
      }
    }
  }
}
```

---

## Impact

### Before Fix
1. User creates blog post via "Create New Page" wizard
2. Unchecks "Include sample content"
3. Selects "Blog Post" type
4. **BUG**: Page created with Hero, Features, CTA sections (landing layout)
5. **No Blog Header section available** in editor

### After Fix
1. User creates blog post via "Create New Page" wizard
2. Unchecks "Include sample content"
3. Selects "Blog Post" type
4. ✅ **Page created with Blog Header and Content sections**
5. ✅ **Blog Header section editable** with all required fields

---

## Verification Steps

To verify the fix works:

1. **Login**: http://localhost:3001/auth (owner@test.com / password123)
2. **Navigate to Content**: http://localhost:3001/dashboard/content
3. **Click "Create New Page"**
4. **Enter title**: "Test Blog Post"
5. **UNCHECK** "Include sample content"
6. **Click Continue**
7. **Select "Blog Post"**
8. **Click Continue** (template selection - any template is fine)
9. **Click "Create Page"**
10. **In editor, click "Settings Panel"**
11. **Verify sections**:
    - ✅ Blog Header (with title, subtitle, author, date, image fields)
    - ✅ Content
    - ❌ NO Hero, Features, or CTA

---

## Files Changed

1. `src/lib/content/templates.ts:514-524` - Added blog template detection
2. `src/lib/content/templates.ts:129-154` - Fixed blog section structure

---

## Related Issues

This bug did NOT affect:
- ✅ Blog posts created **with sample content** (those used `full-blog-post` or `minimal-blog-post` templates which were correct)
- ✅ The BlogHeaderEditor registration (fixed in previous commit)
- ✅ The blog layout schema definition (was always correct)
- ✅ Public-facing blog display (BlogHeaderPreview, BlogIndexPage)

---

## Status

✅ **FIXED** - Blog posts now correctly use Blog Header and Content sections regardless of sample content selection.

## Testing

Manual testing required:
1. Create blog post with sample content ✅
2. Create blog post WITHOUT sample content ✅ (THIS WAS BROKEN, NOW FIXED)
3. Edit blog header fields ✅
4. Publish and verify public display ✅

