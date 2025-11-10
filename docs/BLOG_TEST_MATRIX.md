# Blog Feature - Complete Test Matrix

**All Possible Blog Creation Paths**

This document outlines all combinations of blog post creation and the expected sections for each path.

---

## Test Matrix: 4 Total Paths

| # | Template Selection | Sample Content | Expected Sections |
|---|-------------------|----------------|-------------------|
| 1 | Full Blog Post | ✅ Included | Blog Header + Content (richText) |
| 2 | Full Blog Post | ❌ NOT Included | Blog Header + Content (richText) |
| 3 | Minimal Blog Post | ✅ Included | Blog Header + Content (richText) |
| 4 | Minimal Blog Post | ❌ NOT Included | Blog Header + Content (richText) |

---

## Test Path Details

### Path 1: Full Blog Post WITH Sample Content

**Steps:**
1. Login → Content → Create New Page
2. Enter title: "Test Full Blog With Sample"
3. ✅ KEEP "Include sample content" CHECKED
4. Continue → Select "Blog Post"
5. Continue → Select "Full Blog Post" template
6. Create Page

**Expected Result:**
- ✅ Blog Header section (type: `'blogHeader'`)
  - Title: "Digital Transformation: A Strategic Guide"
  - Subtitle: "Insights and strategies..."
  - Author: "Admin"
  - Published Date: (today's date)
  - Image: "" (empty)

- ✅ Content section (type: `'richText'`)
  - Rich HTML content with Introduction, Main Content, Key Points, Conclusion

**Template Function:** `enhanceBlogTemplate()` (line 1585)
**Template File Location:** lines 1691-1716

---

### Path 2: Full Blog Post WITHOUT Sample Content

**Steps:**
1. Login → Content → Create New Page
2. Enter title: "Test Full Blog No Sample"
3. ❌ UNCHECK "Include sample content"
4. Continue → Select "Blog Post"
5. Continue → Select "Full Blog Post" template
6. Create Page

**Expected Result:**
- ✅ Blog Header section (type: `'blogHeader'`)
  - Title: "Test Full Blog No Sample" (from user input)
  - Subtitle: "" (empty)
  - Author: "" (empty)
  - Published Date: (today's date)
  - Image: "" (empty)

- ✅ Content section (type: `'richText'`)
  - Basic HTML content: Introduction, Main Content, Conclusion

**Template Function:** `getBasicLayoutTemplate('blog', ...)` (line 62)
**Template File Location:** lines 129-154

---

### Path 3: Minimal Blog Post WITH Sample Content

**Steps:**
1. Login → Content → Create New Page
2. Enter title: "Test Minimal Blog With Sample"
3. ✅ KEEP "Include sample content" CHECKED
4. Continue → Select "Blog Post"
5. Continue → Select "Minimal Blog Post" template
6. Create Page

**Expected Result:**
- ✅ Blog Header section (type: `'blogHeader'`)
  - Title: "Blog Post Title"
  - Subtitle: "A brief description..."
  - Author: "Admin"
  - Published Date: (today's date)
  - Image: "" (empty)

- ✅ Content section (type: `'richText'`)
  - Minimal HTML content: Introduction, Main Content, Conclusion

**Template Function:** `getMinimalBlogTemplate()` (line 1722)
**Template File Location:** lines 1736-1761

---

### Path 4: Minimal Blog Post WITHOUT Sample Content

**Steps:**
1. Login → Content → Create New Page
2. Enter title: "Test Minimal Blog No Sample"
3. ❌ UNCHECK "Include sample content"
4. Continue → Select "Blog Post"
5. Continue → Select "Minimal Blog Post" template
6. Create Page

**Expected Result:**
- ✅ Blog Header section (type: `'blogHeader'`)
  - Title: "Test Minimal Blog No Sample" (from user input)
  - Subtitle: "" (empty)
  - Author: "" (empty)
  - Published Date: (today's date)
  - Image: "" (empty)

- ✅ Content section (type: `'richText'`)
  - Basic HTML content: Introduction, Main Content, Conclusion

**Template Function:** `getBasicLayoutTemplate('blog', ...)` (line 62)
**Template File Location:** lines 129-154

---

## Common Section Structure

All 4 paths should produce:

### Blog Header Section
```typescript
blogHeader: {
  type: 'blogHeader',  // ✅ Must be 'blogHeader'
  visible: true,
  order: 1,
  data: {
    title: string,
    subtitle: string,
    author: string,
    publishedDate: string (ISO format),
    image: string (URL)
  }
}
```

### Content Section
```typescript
content: {
  type: 'richText',  // ✅ Must be 'richText', NOT 'content'
  visible: true,
  order: 2,
  data: {
    content: string (HTML),
    json: null
  }
}
```

---

## Historical Bugs Fixed

### Bug 1: BlogHeaderEditor Not Registered
**Commit:** feat: Complete blog feature implementation per specs
**Fix:** Added BlogHeaderEditor to ContentEditor switch statement

### Bug 2: Template Detection
**Commit:** fix: Blog posts without sample content now use correct sections
**Fix:** Added blog template detection in `getTemplateContent()` line 517

### Bug 3: Wrong Section Type - `type: 'content'`
**Commit:** (this commit)
**Fix:** Changed `type: 'content'` to `type: 'richText'` in basic blog template (line 146)
**Reason:** There is no `'content'` type in ContentSectionType enum. Content sections use `'richText'` type.

---

## Verification Checklist

For each of the 4 paths above:

- [ ] Blog post creates without errors
- [ ] Editor loads without "Unknown section type" errors
- [ ] Blog Header section appears in Settings Panel
- [ ] Blog Header has all 5 fields editable (title, subtitle, author, date, image)
- [ ] Content section appears in Settings Panel
- [ ] Content section uses richText editor
- [ ] Can save changes
- [ ] Can publish
- [ ] Public blog page displays correctly

---

## Manual Testing Instructions

1. **Start Services:**
   ```bash
   pnpm supabase:start
   pnpm dev
   ```

2. **Login:**
   - URL: http://localhost:3001/auth
   - Email: owner@test.com
   - Password: password123

3. **Test Each Path:**
   - Follow steps for Path 1-4 above
   - Verify expected sections appear
   - Check for any console errors
   - Verify no "Unknown section type" messages

4. **Clean Up:**
   - Delete test blog posts after verification

---

## Automated Testing

Playwright tests cover these scenarios in `tests/e2e/blog-feature.spec.ts`

To run tests:
```bash
pnpm test:blog
```

---

## Status

✅ **ALL 4 PATHS FIXED** - Basic blog template now correctly uses `type: 'richText'` for content section
