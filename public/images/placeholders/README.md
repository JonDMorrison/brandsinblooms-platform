# Static Placeholder Images

This directory contains static placeholder images for the Brands in Blooms platform.

## Available Placeholders

### Default Placeholders
- `product-default.svg` - Default product placeholder (400x400)
- `image-default.svg` - Default image placeholder (400x300)
- `user-avatar.svg` - Default user avatar placeholder (200x200)

### Gradient Placeholders
- `gradient-blue.svg` - Blue gradient placeholder (400x400)

### Pattern Placeholders
- `pattern-dots.svg` - Dots pattern placeholder (400x400)

## Usage

### In React Components
```tsx
import Image from 'next/image';

// Static placeholder
<Image 
  src="/images/placeholders/product-default.svg" 
  alt="Product placeholder" 
  width={400} 
  height={400} 
/>

// Dynamic placeholder (via API)
<Image 
  src="/api/placeholder/400/400/gradient" 
  alt="Dynamic placeholder" 
  width={400} 
  height={400} 
/>
```

### Dynamic API Placeholders

For dynamic placeholders, use the API endpoint:
`/api/placeholder/[width]/[height]/[type]/[config]`

#### Examples:
- `/api/placeholder/400/300/gradient` - Basic gradient
- `/api/placeholder/200/200/icon` - Basic icon
- `/api/placeholder/400/400/pattern` - Basic pattern

#### With Configuration:
```
/api/placeholder/400/400/gradient/${encodeURIComponent(JSON.stringify({
  colors: ['#ff0000', '#00ff00'],
  direction: 'vertical'
}))}
```

## Adding New Static Placeholders

1. Create SVG files following the naming convention
2. Ensure proper dimensions and optimization
3. Use consistent color schemes with the design system
4. Update this README with new additions

## Notes

- All SVG files should be optimized for web delivery
- Use semantic naming for easy identification
- Static placeholders are cached by the browser
- Dynamic placeholders are cached with immutable headers