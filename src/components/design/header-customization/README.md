# Header Customization Component

This directory contains a refactored and organized version of the HeaderCustomization component, broken down into focused, reusable parts.

## File Structure

```
header-customization/
├── README.md                    # This documentation
├── index.tsx                    # Main component that exports HeaderCustomization
├── types.ts                     # TypeScript interfaces and types
├── constants.ts                 # Static data and configuration
├── hooks.ts                     # Custom React hooks for state management
├── HeaderPreviewSection.tsx     # Live preview of header styles
├── BrandingSection.tsx          # Logo upload and brand text configuration
├── HeaderStyleSection.tsx       # Header style selection (modern/classic/minimal)
├── NavigationSection.tsx        # Navigation menu configuration
├── CtaSection.tsx              # Call-to-action button configuration
└── previews/                   # Header preview components
    ├── shared.tsx              # Reusable preview components and utilities
    ├── ModernPreview.tsx       # Modern header style preview
    ├── ClassicPreview.tsx      # Classic header style preview
    └── MinimalPreview.tsx      # Minimal header style preview
```

## Component Responsibilities

### Main Components

- **`index.tsx`** - Main entry point that orchestrates all sub-components and manages state
- **`types.ts`** - Centralized type definitions for props, state, and data structures
- **`constants.ts`** - Static configuration like header styles and navigation options
- **`hooks.ts`** - Custom hook for managing complex state logic and debounced updates

### Section Components

Each section is a self-contained, collapsible component:

- **`HeaderPreviewSection.tsx`** - Shows live preview of how the header will look
- **`BrandingSection.tsx`** - Handles logo upload, brand text, and display type selection
- **`HeaderStyleSection.tsx`** - Style selection with visual previews
- **`NavigationSection.tsx`** - Navigation menu item selection
- **`CtaSection.tsx`** - Call-to-action button configuration

### Preview Components

Modular preview components for different header styles:

- **`shared.tsx`** - Common elements used across all previews (branding, icons, etc.)
- **`ModernPreview.tsx`** - Modern header layout with horizontal navigation
- **`ClassicPreview.tsx`** - Traditional centered layout with separate navigation
- **`MinimalPreview.tsx`** - Ultra-simple header with minimal elements

## Key Features

### State Management
- Centralized state logic in `useHeaderCustomizationState` hook
- Debounced updates to prevent excessive API calls
- Local state for immediate UI feedback with proper synchronization

### User Experience
- Collapsible sections for better organization
- Live preview with real-time updates
- Toast notifications for user feedback
- Responsive design with mobile/desktop previews

### File Upload
- Secure presigned URL uploads to S3
- Progress tracking and error handling
- Image validation (type and size limits)
- Preview of uploaded logos

## Usage

Import and use the component as before - the API remains unchanged:

```tsx
import { HeaderCustomization } from '@/src/components/design/HeaderCustomization'

function MyComponent() {
  return (
    <HeaderCustomization
      value={themeSettings}
      colors={colors}
      typography={typography}
      onChange={handleChange}
    />
  )
}
```

## Benefits of This Organization

1. **Modularity** - Each component has a single responsibility
2. **Maintainability** - Easier to find and update specific functionality
3. **Reusability** - Preview components and utilities can be reused elsewhere
4. **Testability** - Smaller components are easier to test in isolation
5. **Performance** - Better code splitting and bundle optimization
6. **Developer Experience** - Clear file structure makes development faster

## Migration Notes

- The original `HeaderCustomization.tsx` now just exports from this directory
- All existing imports continue to work without changes
- No breaking changes to the component API
- All functionality is preserved with improved organization