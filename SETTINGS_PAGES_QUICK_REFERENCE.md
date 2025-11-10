# Settings Pages Quick Reference

## Settings Page Pattern Comparison

```
CONSISTENT PATTERN (5 pages)
============================

Profile        Site           Business       Security       Payments
│              │              │              │              │
└─ page.tsx    └─ page.tsx     └─ page.tsx     └─ page.tsx     └─ page.tsx
   (18 lines)     (18 lines)     (18 lines)     (18 lines)     (18 lines)

   Imports:       Imports:       Imports:       Imports:       Imports:
   └─ ProfileSettings    └─ SiteInformationSettings  └─ BusinessSettings  └─ SecuritySettings  └─ PaymentSettings

   Renders:       Renders:       Renders:       Renders:       Renders:
   └─ <Header>    └─ <Header>    └─ <Header>    └─ <Header>    └─ <Header>
   └─ <Component> └─ <Component> └─ <Component> └─ <Component> └─ <Component>


DIVERGENT PATTERN (1 page)
==========================

Domains
│
└─ page.tsx
   (206 lines) ← 10x larger!

   Imports:
   ├─ 6 UI imports
   ├─ 6 icon imports
   ├─ 3 hook imports
   └─ 3 component imports

   Has:
   ├─ Inline hook usage (useCurrentSite, useSitePermissions)
   ├─ Business logic (getDomainStatus)
   ├─ Complex JSX (150+ lines)
   └─ NO wrapper component
```

---

## File Sizes Comparison

```
Profile Page:        18 lines  ✓
Site Page:           18 lines  ✓
Business Page:       18 lines  ✓
Security Page:       18 lines  ✓
Payments Page:       18 lines  ✓
Domains Page:        206 lines ❌ (11x larger)
```

---

## Import Count Comparison

```
Profile Page:        1 import from settings
Site Page:           1 import from settings
Business Page:       1 import from settings
Security Page:       1 import from settings
Payments Page:       1 import from settings
Domains Page:        15+ imports ❌ (15x more)
  ├─ 6 from @/src/components/ui/*
  ├─ 1 from lucide-react (6 icons)
  ├─ 2 from @/src/hooks/*
  ├─ 3 from @/src/components/site/*
  └─ 0 from @/src/components/settings/
```

---

## Hook Usage Pattern

```
✓ CONSISTENT (Not in page files):
- Profile settings logic → ProfileSettings component
- Site settings logic → SiteInformationSettings component
- Business settings logic → BusinessSettings component
- Security settings logic → SecuritySettings component
- Payments settings logic → PaymentSettings component

❌ DIVERGENT:
- Domains settings logic → Inline in page.tsx
  ├─ useCurrentSite
  ├─ useSitePermissions
  └─ Business logic: getDomainStatus()
```

---

## Component Hierarchy

```
✓ CORRECT PATTERN:
DomainsPage (wrapper)
└─ DomainSettings (encapsulation)
   ├─ useCurrentSite
   ├─ useSitePermissions
   ├─ getDomainStatus logic
   └─ JSX rendering

❌ CURRENT PATTERN:
DomainsPage (bloated)
├─ useCurrentSite
├─ useSitePermissions
├─ getDomainStatus logic
└─ JSX rendering (150+ lines)
```

---

## Code Organization Issue

### Where Logic Should Live

```
app/dashboard/settings/domains/page.tsx
└─ Should only contain:
   - Page layout
   - Import statement
   - Render single component

src/components/settings/DomainSettings.tsx  ← MISSING!
└─ Should contain:
   - Hook usage
   - Business logic
   - Complex JSX
   - State management
```

### Where Logic Actually Lives

```
app/dashboard/settings/domains/page.tsx
├─ Hook usage ❌ (should be in settings component)
├─ Business logic ❌ (should be in settings component)
└─ Complex JSX ❌ (should be in settings component)

src/components/settings/DomainSettings.tsx  ← DOESN'T EXIST!
```

---

## React Pattern Violations

```
❌ Domains Page Issues:

1. Violation: Component has too many responsibilities
   - UI layout
   - Hook management
   - Business logic
   - State handling

2. Violation: Inconsistent with project pattern
   - All other settings follow composition pattern
   - Domains page uses monolithic pattern

3. Violation: Hard to test
   - Business logic mixed with rendering
   - Can't test getDomainStatus independently
   - Can't test JSX without hooks

4. Violation: Hard to maintain
   - 206 lines in one file
   - Multiple concerns tangled
   - Difficult to navigate and modify
```

---

## Import Correctness Check

```
✓ All imports are syntactically correct:
  - UI components from @/src/components/ui/*
  - Icons from lucide-react
  - Hooks from @/src/hooks/useSite
  - Components from @/src/components/site/*

✓ All named exports match imports:
  - DomainConfigurationIntegrated (named export)
  - SitePreview (exported)
  - SiteSwitcher (exported)

✓ No circular imports detected:
  - useSite.ts imports from SiteContext
  - SiteContext imports from lib/site/*
  - No back-references to page.tsx

✓ File paths use correct alias:
  - @/src/* (all internal)
  - Consistent with Next.js config
```

---

## Summary

| Aspect | Other Pages | Domains Page |
|--------|------------|--------------|
| File Size | 18 lines | 206 lines |
| Import Count | 1 | 15+ |
| Hook Usage in Page | None | Inline |
| Business Logic in Page | None | getDomainStatus() |
| Wrapper Component | Yes | No |
| Test Difficulty | Easy | Hard |
| Maintainability | High | Low |
| Pattern Consistency | Yes | No |

**Verdict**: Domains page needs refactoring to match established pattern.
