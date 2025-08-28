# Content Layout and Blocks Documentation

## Table of Contents

1. [Design System Integration](#1-design-system-integration)
2. [Layout Types](#2-layout-types)
3. [Content Sections Reference](#3-content-sections-reference)
4. [Property Matrix](#4-property-matrix)
5. [Examples & Use Cases](#5-examples--use-cases)

---

## 1. Design System Integration

### Theme Settings Overview

The Brands in Blooms platform uses a comprehensive theme system that cascades through all content sections. Every piece of content inherits design settings from the site's theme configuration.

#### Core Theme Structure

```typescript
interface ThemeSettings {
  colors: {
    primary: string      // Main brand color
    secondary: string    // Secondary brand color
    accent: string       // Accent/highlight color
    background: string   // Page background color
    text?: string        // Text color (optional, defaults to #1A1A1A)
  }
  typography: {
    headingFont: string  // Font for headings
    bodyFont: string     // Font for body text
    fontSize: 'small' | 'medium' | 'large'  // Base font size
    headingWeight?: string  // Font weight for headings
    bodyWeight?: string     // Font weight for body text
  }
  layout: {
    headerStyle: 'modern' | 'classic' | 'minimal'
    footerStyle: 'minimal' | 'detailed' | 'hidden'
    menuStyle: 'horizontal' | 'vertical' | 'sidebar'
  }
  logo: {
    url: string | null
    position: 'left' | 'center' | 'right'
    size: 'small' | 'medium' | 'large'
  }
}
```

### CSS Variable Cascade

The theme system generates CSS custom properties that are available throughout the content:

| CSS Variable | Description | Example Value |
|-------------|-------------|---------------|
| `--theme-primary` | Primary brand color | `#8B5CF6` |
| `--theme-secondary` | Secondary brand color | `#06B6D4` |
| `--theme-accent` | Accent color | `#F59E0B` |
| `--theme-background` | Background color | `#FFFFFF` |
| `--theme-text` | Text color | `#1A1A1A` |
| `--theme-font-heading` | Heading font family | `'Inter', system-ui, sans-serif` |
| `--theme-font-body` | Body font family | `'Inter', system-ui, sans-serif` |
| `--theme-font-size-base` | Base font size | `16px` |
| `--theme-font-weight-heading` | Heading font weight | `700` |
| `--theme-font-weight-body` | Body font weight | `400` |

### Theme Presets

The platform includes four pre-configured theme presets:

1. **Default Theme**: Modern purple and cyan color scheme
2. **Dark Theme**: Dark backgrounds with vibrant accents for contrast
3. **Professional Theme**: Corporate blue and green palette
4. **Creative Theme**: Playful pink and purple with cream backgrounds

### Custom Theming

Content managers can customize themes through:
- **Visual Editor**: Real-time preview of color and typography changes
- **Brand Color Generator**: Auto-generate harmonious color schemes from a single brand color
- **JSON Import/Export**: Share themes between sites or backup configurations
- **Live Preview**: See changes instantly without saving

---

## 2. Layout Types

The platform supports 7 distinct layout types, each optimized for specific content purposes. Layouts define the structure and required sections for pages.

### Landing Page Layout

**Purpose**: Marketing and conversion-focused pages designed to drive specific actions.

**Required Sections**: 
- `hero` - Main page header with call-to-action

**Optional Sections**:
- `features` - Highlight key features or benefits
- `cta` - Additional call-to-action sections
- `testimonials` - Customer reviews and social proof

**Use Cases**:
- Homepage
- Product launch pages
- Campaign landing pages
- Lead generation pages

**Visual Hierarchy**:
1. Hero section captures attention
2. Features build value proposition
3. Testimonials provide social proof
4. CTA drives conversion

### Blog Article Layout

**Purpose**: Long-form content presentation with author attribution and related content discovery.

**Required Sections**:
- `header` - Article title and metadata
- `content` - Main article body

**Optional Sections**:
- `author` - Author bio and credentials
- `related` - Related articles or content

**Use Cases**:
- Blog posts
- News articles
- Case studies
- Thought leadership pieces

**SEO Considerations**:
- Structured data for article schema
- Meta descriptions from content
- Author attribution
- Related content for engagement

### Portfolio Grid Layout

**Purpose**: Visual showcase of work samples, projects, or products with gallery-first presentation.

**Required Sections**:
- `header` - Portfolio title and introduction
- `gallery` - Visual grid of portfolio items

**Optional Sections**:
- `description` - Detailed portfolio description
- `details` - Technical specifications or project details

**Use Cases**:
- Project showcases
- Product galleries
- Photo portfolios
- Case study collections

**Display Options**:
- Configurable grid columns (1-6)
- Image aspect ratios maintained
- Lightbox or detail view support

### About/Company Layout

**Purpose**: Company information pages that build trust and communicate values.

**Required Sections**:
- `hero` - Company headline and vision

**Optional Sections**:
- `mission` - Mission statement
- `team` - Team member profiles
- `values` - Core company values

**Use Cases**:
- About Us pages
- Company history
- Culture pages
- Leadership pages

**Content Strategy**:
- Start with compelling vision
- Build trust through transparency
- Showcase team expertise
- Communicate values clearly

### Product Page Layout

**Purpose**: Detailed product presentations with features and specifications.

**Required Sections**:
- `header` - Product name and overview
- `features` - Key product features

**Optional Sections**:
- `pricing` - Pricing tiers and options
- `specifications` - Detailed specifications

**Use Cases**:
- Product details
- Service descriptions
- Solution pages
- Feature comparisons

**Conversion Elements**:
- Clear value proposition in header
- Feature benefits highlighted
- Transparent pricing
- Technical details for informed decisions

### Contact/Services Layout

**Purpose**: Facilitate communication with integrated contact forms.

**Required Sections**:
- `header` - Page title and introduction
- `form` - Contact form fields

**Optional Sections**:
- `info` - Contact information
- `map` - Location map (placeholder for future enhancement)

**Use Cases**:
- Contact pages
- Quote requests
- Support forms
- Booking pages

**Form Capabilities**:
- Customizable field types
- Validation rules
- Required field indicators
- Submission handling

### Custom/Other Layout

**Purpose**: Maximum flexibility for unique content structures without constraints.

**Required Sections**: None - complete flexibility

**Optional Sections**: All 15 section types available

**Use Cases**:
- Custom landing pages
- Specialized content
- Experimental layouts
- Unique page requirements

**Benefits**:
- No structural limitations
- Mix any section types
- Custom section ordering
- Full creative freedom

---

## 3. Content Sections Reference

### Text Content Sections

#### Text Section
Simple plain text blocks for basic content display.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| content | string | No | `""` | Plain text content |

**JSON Example**:
```json
{
  "type": "text",
  "data": {
    "content": "Welcome to our platform"
  },
  "visible": true
}
```

**Best Practices**:
- Use for simple, unformatted text
- Keep content concise
- Consider richText for formatting needs

#### Rich Text Section
HTML-formatted content with full editor support.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| content | string | No | `""` | HTML content for display |
| json | JSON | No | `null` | Tiptap editor JSON format |

**JSON Example**:
```json
{
  "type": "richText",
  "data": {
    "content": "<h2>Welcome</h2><p>Rich content with <strong>formatting</strong></p>",
    "json": {
      "type": "doc",
      "content": [...]
    }
  },
  "visible": true
}
```

**Editor Features**:
- Bold, italic, underline
- Headings (H1-H6)
- Lists (ordered/unordered)
- Links and quotes
- Code blocks

### Media Sections

#### Image Section
Single image display with optional caption.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| url | string | No | `""` | Image URL (must be valid URL) |
| alt | string | No | `""` | Alternative text for accessibility |
| caption | string | No | `""` | Image caption |

**JSON Example**:
```json
{
  "type": "image",
  "data": {
    "url": "https://example.com/image.jpg",
    "alt": "Product showcase",
    "caption": "Our latest product design"
  },
  "visible": true
}
```

**Accessibility**:
- Always provide alt text
- Captions enhance understanding
- Error handling for failed loads

#### Icon Section
Display Lucide icons with customization options.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| icon | string | No | `"Star"` | Lucide icon name |
| iconSize | enum | No | `"md"` | Size: 'sm', 'md', 'lg', 'xl' |
| iconColor | string | No | theme color | Icon color (hex or CSS value) |

**JSON Example**:
```json
{
  "type": "icon",
  "data": {
    "icon": "Shield",
    "iconSize": "lg",
    "iconColor": "#8B5CF6"
  },
  "visible": true
}
```

**Available Icons**:
- All Lucide React icons supported
- Name must match Lucide icon set
- PascalCase conversion automatic

#### Gallery Section
Grid display of multiple images.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| items | ContentItem[] | No | `[]` | Array of gallery items |
| columns | number | No | `3` | Grid columns (1-6) |
| content | string | No | `""` | Gallery title/description |

**ContentItem Structure**:
```typescript
{
  id: string          // Unique identifier
  title?: string      // Image title
  content?: string    // Image description
  image?: string      // Image URL
  url?: string        // Link URL
  order?: number      // Display order
}
```

**JSON Example**:
```json
{
  "type": "gallery",
  "data": {
    "content": "Our Work",
    "columns": 3,
    "items": [
      {
        "id": "1",
        "title": "Project Alpha",
        "image": "https://example.com/project1.jpg",
        "content": "Modern web application"
      }
    ]
  },
  "visible": true
}
```

### Interactive Sections

#### Hero Section
Page headers with prominent messaging and calls-to-action.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| content | string | No | `""` | Main hero content (HTML) |
| subtitle | string | No | `""` | Hero subtitle |
| alignment | enum | No | `"center"` | Text alignment: 'left', 'center', 'right' |
| items | ContentItem[] | No | `[]` | CTA buttons (max 2 used) |

**JSON Example**:
```json
{
  "type": "hero",
  "data": {
    "content": "<h1>Transform Your Business</h1>",
    "subtitle": "Professional solutions for modern challenges",
    "alignment": "center",
    "items": [
      {
        "id": "1",
        "title": "Get Started",
        "url": "/signup"
      },
      {
        "id": "2",
        "title": "Learn More",
        "url": "/features"
      }
    ]
  },
  "visible": true
}
```

**Styling Notes**:
- Inherits theme colors
- Responsive text sizing
- Button variants for primary/secondary

#### CTA Section
Focused call-to-action blocks.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| content | string | No | `""` | CTA message/content |
| alignment | enum | No | `"center"` | Text alignment |
| items | ContentItem[] | No | `[]` | Button definition (first item used) |

**JSON Example**:
```json
{
  "type": "cta",
  "data": {
    "content": "Ready to get started?",
    "alignment": "center",
    "items": [
      {
        "id": "1",
        "title": "Start Free Trial",
        "url": "/trial"
      }
    ]
  },
  "visible": true
}
```

#### Form Section
Customizable contact and input forms.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| fields | FormField[] | No | Default contact fields | Form field definitions |
| content | string | No | `""` | Form title/description |

**FormField Structure**:
```typescript
{
  id: string              // Unique field ID
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio'
  label: string           // Field label
  placeholder?: string    // Placeholder text
  required: boolean       // Is field required
  options?: string[]      // For select/radio/checkbox
  validation?: {
    pattern?: string      // Regex pattern
    minLength?: number
    maxLength?: number
    message?: string      // Error message
  }
  order?: number          // Field display order
}
```

**Default Contact Form**:
```json
{
  "type": "form",
  "data": {
    "content": "Get in Touch",
    "fields": [
      {
        "id": "name",
        "type": "text",
        "label": "Name",
        "required": true,
        "order": 1
      },
      {
        "id": "email",
        "type": "email",
        "label": "Email",
        "required": true,
        "order": 2
      },
      {
        "id": "message",
        "type": "textarea",
        "label": "Message",
        "required": true,
        "order": 3
      }
    ]
  },
  "visible": true
}
```

### Repeatable Sections

#### Features Section
Feature cards with icons and descriptions.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| items | ContentItem[] | No | `[]` | Feature items |
| columns | number | No | `3` | Grid columns (1-6) |
| content | string | No | `""` | Section title |

**Item Structure**:
```json
{
  "id": "1",
  "icon": "Shield",
  "title": "Secure",
  "content": "Enterprise-grade security"
}
```

**JSON Example**:
```json
{
  "type": "features",
  "data": {
    "content": "Why Choose Us",
    "columns": 3,
    "items": [
      {
        "id": "1",
        "icon": "Shield",
        "title": "Secure",
        "content": "Bank-level encryption protects your data"
      },
      {
        "id": "2",
        "icon": "Zap",
        "title": "Fast",
        "content": "Lightning-fast performance at scale"
      },
      {
        "id": "3",
        "icon": "Users",
        "title": "Collaborative",
        "content": "Built for teams from the ground up"
      }
    ]
  },
  "visible": true
}
```

#### Testimonials Section
Customer testimonials in card layout.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| items | ContentItem[] | No | `[]` | Testimonial items |
| columns | number | No | `2` | Grid columns |
| content | string | No | `""` | Section title |

**Item Structure**:
```json
{
  "id": "1",
  "title": "Jane Smith",
  "subtitle": "CEO, TechCorp",
  "content": "This platform transformed our business...",
  "image": "https://example.com/avatar.jpg"
}
```

#### Pricing Section
Pricing plans and tiers display.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| items | ContentItem[] | No | `[]` | Pricing plan items |
| columns | number | No | `3` | Grid columns |
| content | string | No | `""` | Section title |

**Item Structure with Metadata**:
```json
{
  "id": "1",
  "title": "Professional",
  "subtitle": "$29/month",
  "content": "Perfect for growing teams",
  "metadata": {
    "features": [
      "Unlimited projects",
      "Priority support",
      "Advanced analytics"
    ],
    "highlighted": true
  }
}
```

**Special Behavior**:
- Second item gets "Most Popular" badge
- Metadata.features displayed as list
- Highlighted items get special styling

#### Team Section
Team member profiles with photos.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| items | ContentItem[] | No | `[]` | Team member items |
| columns | number | No | `3` | Grid columns |
| content | string | No | `""` | Section title |

**Item Structure**:
```json
{
  "id": "1",
  "title": "John Doe",
  "subtitle": "Chief Technology Officer",
  "content": "20 years of experience in enterprise software",
  "image": "https://example.com/john.jpg"
}
```

### Specialized Sections

#### Mission Section
Company mission statement display.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| content | string | No | `""` | Mission statement content |
| items | ContentItem[] | No | `[]` | Additional mission items |
| columns | number | No | `2` | Layout columns |

**JSON Example**:
```json
{
  "type": "mission",
  "data": {
    "content": "To empower businesses with innovative technology solutions that drive growth and efficiency.",
    "items": []
  },
  "visible": true
}
```

#### Values Section
Company values with descriptions.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| items | ContentItem[] | No | `[]` | Value items with icons |
| columns | number | No | `2` | Grid columns |
| content | string | No | `""` | Section title |

**Item Structure**:
```json
{
  "id": "1",
  "icon": "Heart",
  "title": "Customer First",
  "content": "Every decision starts with customer impact"
}
```

#### Specifications Section
Product or service specifications.

**Properties**:
| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| content | string | No | `""` | Specification content (HTML) |
| items | ContentItem[] | No | `[]` | Structured spec items |
| columns | number | No | `2` | Layout columns |

**Flexible Usage**:
- Use content for free-form HTML lists
- Use items for structured data
- Combine both for mixed presentation

---

## 4. Property Matrix

### Quick Reference Table

| Section Type | content | items | columns | alignment | fields | url | icon | Required Props |
|-------------|---------|-------|---------|-----------|---------|-----|------|----------------|
| text | ✓ | - | - | - | - | - | - | None |
| richText | ✓ | - | - | - | - | - | - | None |
| image | - | - | - | - | - | ✓ | - | url (for visibility) |
| icon | - | - | - | - | - | - | ✓ | icon (for visibility) |
| gallery | ✓ | ✓ | ✓ | - | - | - | - | items (for visibility) |
| features | ✓ | ✓ | ✓ | - | - | - | - | items (for visibility) |
| hero | ✓ | ✓ | - | ✓ | - | - | - | None |
| cta | ✓ | ✓ | - | ✓ | - | - | - | None |
| testimonials | ✓ | ✓ | ✓ | - | - | - | - | items (for visibility) |
| form | ✓ | - | - | - | ✓ | - | - | fields (for visibility) |
| pricing | ✓ | ✓ | ✓ | - | - | - | - | items (for visibility) |
| team | ✓ | ✓ | ✓ | - | - | - | - | items (for visibility) |
| mission | ✓ | ✓ | ✓ | - | - | - | - | None |
| values | ✓ | ✓ | ✓ | - | - | - | - | None |
| specifications | ✓ | ✓ | ✓ | - | - | - | - | None |

### Data Types

| Property | Type | Values | Description |
|----------|------|--------|-------------|
| content | string | HTML or plain text | Primary content |
| items | ContentItem[] | Array of objects | Repeatable content |
| columns | number | 1-6 | Grid layout columns |
| alignment | enum | 'left', 'center', 'right' | Text alignment |
| spacing | enum | 'tight', 'normal', 'loose' | Content spacing |
| iconSize | enum | 'sm', 'md', 'lg', 'xl' | Icon display size |
| fields | FormField[] | Array of field definitions | Form structure |

### Validation Rules

1. **URL Validation**
   - Must be valid URL format
   - Supports http/https protocols
   - Required for image visibility

2. **Icon Validation**
   - Must match Lucide icon name
   - Case-insensitive input
   - Converted to PascalCase

3. **Column Constraints**
   - Minimum: 1
   - Maximum: 6
   - Default varies by section

4. **Field ID Uniqueness**
   - Form field IDs must be unique
   - Used for form data binding

5. **Required Options**
   - Select fields must have options array
   - Radio fields must have options array
   - Checkbox fields must have options array

---

## 5. Examples & Use Cases

### Complete Landing Page Example

```json
{
  "version": "1.0",
  "layout": "landing",
  "sections": {
    "hero": {
      "type": "hero",
      "data": {
        "content": "<h1>Welcome to Brands in Blooms</h1>",
        "subtitle": "Build beautiful websites without code",
        "alignment": "center",
        "items": [
          {
            "id": "cta1",
            "title": "Start Free Trial",
            "url": "/signup"
          },
          {
            "id": "cta2",
            "title": "View Demo",
            "url": "/demo"
          }
        ]
      },
      "visible": true,
      "order": 1
    },
    "features": {
      "type": "features",
      "data": {
        "content": "Everything You Need",
        "columns": 3,
        "items": [
          {
            "id": "f1",
            "icon": "Palette",
            "title": "Beautiful Themes",
            "content": "Choose from dozens of professional themes"
          },
          {
            "id": "f2",
            "icon": "Zap",
            "title": "Lightning Fast",
            "content": "Optimized for speed and performance"
          },
          {
            "id": "f3",
            "icon": "Shield",
            "title": "Secure by Default",
            "content": "Enterprise-grade security built-in"
          }
        ]
      },
      "visible": true,
      "order": 2
    },
    "testimonials": {
      "type": "testimonials",
      "data": {
        "content": "What Our Customers Say",
        "columns": 2,
        "items": [
          {
            "id": "t1",
            "title": "Sarah Johnson",
            "subtitle": "Marketing Director",
            "content": "This platform made it easy for our team to create beautiful landing pages without any coding knowledge."
          },
          {
            "id": "t2",
            "title": "Mike Chen",
            "subtitle": "Startup Founder",
            "content": "We launched our site in days, not weeks. The theme system is incredibly flexible."
          }
        ]
      },
      "visible": true,
      "order": 3
    },
    "cta": {
      "type": "cta",
      "data": {
        "content": "Ready to build something amazing?",
        "alignment": "center",
        "items": [
          {
            "id": "final-cta",
            "title": "Get Started Free",
            "url": "/signup"
          }
        ]
      },
      "visible": true,
      "order": 4
    }
  },
  "settings": {
    "seo": {
      "title": "Brands in Blooms - No-Code Website Builder",
      "description": "Create beautiful, fast websites without writing code",
      "keywords": ["website builder", "no-code", "landing pages"]
    },
    "layout": {
      "containerWidth": "normal",
      "spacing": "normal"
    }
  }
}
```

### TypeScript Usage Example

```typescript
import { PageContent, ContentSection, ContentItem } from '@/lib/content/schema'

// Create a new features section
const featuresSection: ContentSection = {
  type: 'features',
  data: {
    content: 'Our Features',
    columns: 3,
    items: [
      {
        id: crypto.randomUUID(),
        icon: 'Star',
        title: 'Premium Quality',
        content: 'Best-in-class solutions',
        order: 1
      }
    ] as ContentItem[]
  },
  visible: true,
  order: 2
}

// Create a complete page
const pageContent: PageContent = {
  version: '1.0',
  layout: 'landing',
  sections: {
    hero: heroSection,
    features: featuresSection
  },
  settings: {
    seo: {
      title: 'My Page',
      description: 'Page description'
    }
  }
}
```

### Common Patterns

#### Progressive Enhancement
Start with basic sections and add complexity:
```javascript
// Start simple
const basic = {
  type: 'text',
  data: { content: 'Hello' },
  visible: true
}

// Enhance with formatting
const enhanced = {
  type: 'richText',
  data: { 
    content: '<h2>Hello</h2><p>Welcome!</p>',
    json: tiptapJson 
  },
  visible: true
}

// Add interactivity
const interactive = {
  type: 'cta',
  data: {
    content: '<h2>Hello</h2>',
    items: [{ id: '1', title: 'Click Me', url: '/action' }]
  },
  visible: true
}
```

#### Responsive Grid Configuration
Adjust columns based on content:
```javascript
// Mobile-first approach
const responsiveGallery = {
  type: 'gallery',
  data: {
    items: images,
    columns: window.innerWidth < 768 ? 1 : 3
  },
  visible: true
}
```

#### Form Validation Patterns
Common form field configurations:
```javascript
const emailField = {
  id: 'email',
  type: 'email',
  label: 'Email Address',
  placeholder: 'you@example.com',
  required: true,
  validation: {
    pattern: '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$',
    message: 'Please enter a valid email address'
  }
}

const phoneField = {
  id: 'phone',
  type: 'phone',
  label: 'Phone Number',
  placeholder: '(555) 123-4567',
  required: false,
  validation: {
    pattern: '^[\\d\\s\\(\\)\\-\\+]+$',
    minLength: 10,
    message: 'Please enter a valid phone number'
  }
}
```

### Troubleshooting Guide

#### Section Not Displaying
1. Check `visible` property is `true`
2. Verify required data properties are present
3. Ensure section key exists in layout's sections object

#### Images Not Loading
1. Verify URL is valid and accessible
2. Check for CORS issues with external images
3. Provide fallback alt text

#### Form Submission Issues
1. Ensure all required fields have values
2. Check field ID uniqueness
3. Verify validation patterns are correct

#### Theme Not Applying
1. Confirm theme settings are saved
2. Check CSS variable generation
3. Verify data-theme-applied attribute

#### Layout Validation Errors
1. Required sections must be present
2. Section types must match layout requirements
3. Section keys must match expected names

---

## Additional Resources

### Related Documentation
- [Theme System Guide](./theme-system.md)
- [Content Editor Usage](./content-editor.md)
- [API Reference](./api-reference.md)

### Code References
- Schema definitions: `src/lib/content/schema.ts`
- Template examples: `src/lib/content/templates.ts`
- Component implementations: `src/components/content/`
- Theme system: `src/hooks/useThemeCSS.ts`

### Support
For additional help or to report issues:
- GitHub Issues: [Report a bug](https://github.com/your-org/brands-in-blooms/issues)
- Documentation updates: Submit a PR with improvements