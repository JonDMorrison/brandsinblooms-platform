import { z } from 'zod'

// Color palette schema for AI generation
const ColorPaletteSchema = z.object({
  primary: z.string().regex(/^#[0-9A-F]{6}$/i),
  secondary: z.string().regex(/^#[0-9A-F]{6}$/i),
  accent: z.string().regex(/^#[0-9A-F]{6}$/i),
  background: z.string().regex(/^#[0-9A-F]{6}$/i),
  text: z.string().regex(/^#[0-9A-F]{6}$/i),
  reasoning: z.string()
})

// Font pairing schema
const FontPairingSchema = z.object({
  headingFont: z.string(),
  bodyFont: z.string(),
  reasoning: z.string(),
  example: z.string()
})

// Layout recommendation schema
const LayoutRecommendationSchema = z.object({
  headerStyle: z.enum(['modern', 'classic', 'minimal']),
  footerStyle: z.enum(['minimal', 'detailed', 'hidden']),
  menuStyle: z.enum(['horizontal', 'vertical', 'sidebar']),
  reasoning: z.string()
})

export type ColorPalette = z.infer<typeof ColorPaletteSchema>
export type FontPairing = z.infer<typeof FontPairingSchema>
export type LayoutRecommendation = z.infer<typeof LayoutRecommendationSchema>

// Mock AI service for now - in production, this would call OpenAI/Anthropic
export async function generateColorPalette(input: {
  industry?: string
  brand?: string
  mood?: 'professional' | 'playful' | 'elegant' | 'bold' | 'minimal'
  baseColor?: string
}): Promise<ColorPalette> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Generate colors based on mood and industry
  const palettes: Record<string, ColorPalette> = {
    professional: {
      primary: '#1E40AF',
      secondary: '#047857',
      accent: '#DC2626',
      background: '#F9FAFB',
      text: '#111827',
      reasoning: 'Professional palette with trust-building blue, growth-oriented green, and attention-grabbing red accents. Clean background ensures readability.'
    },
    playful: {
      primary: '#EC4899',
      secondary: '#8B5CF6',
      accent: '#10B981',
      background: '#FEF3C7',
      text: '#1F2937',
      reasoning: 'Vibrant and energetic colors that convey creativity and fun. Warm background adds to the playful atmosphere.'
    },
    elegant: {
      primary: '#6B21A8',
      secondary: '#0891B2',
      accent: '#F59E0B',
      background: '#FAFAF9',
      text: '#18181B',
      reasoning: 'Sophisticated purple with complementary cyan and gold accents. Neutral background maintains elegance.'
    },
    bold: {
      primary: '#DC2626',
      secondary: '#EA580C',
      accent: '#FACC15',
      background: '#0F172A',
      text: '#F8FAFC',
      reasoning: 'High-impact colors with strong contrast. Dark background makes colors pop for maximum visual impact.'
    },
    minimal: {
      primary: '#374151',
      secondary: '#6B7280',
      accent: '#3B82F6',
      background: '#FFFFFF',
      text: '#111827',
      reasoning: 'Clean, understated palette focusing on grayscale with a single accent color for important elements.'
    }
  }
  
  const mood = input.mood || 'professional'
  return palettes[mood] || palettes.professional
}

export async function suggestFontPairings(input: {
  style: 'modern' | 'classic' | 'playful' | 'elegant' | 'technical'
  purpose?: string
}): Promise<FontPairing[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const pairings: Record<string, FontPairing[]> = {
    modern: [
      {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        reasoning: 'Clean and highly legible system font that works across all devices',
        example: 'Used by companies like Linear, Vercel, and GitHub'
      },
      {
        headingFont: 'Poppins',
        bodyFont: 'Open Sans',
        reasoning: 'Geometric heading font paired with humanist body for personality and readability',
        example: 'Popular in tech startups and SaaS products'
      },
      {
        headingFont: 'Montserrat',
        bodyFont: 'Source Sans Pro',
        reasoning: 'Bold geometric headers with clean, readable body text',
        example: 'Great for modern web applications'
      }
    ],
    classic: [
      {
        headingFont: 'Playfair Display',
        bodyFont: 'Lato',
        reasoning: 'Elegant serif headers with clean sans-serif body for contrast',
        example: 'Perfect for editorial and content-heavy sites'
      },
      {
        headingFont: 'Merriweather',
        bodyFont: 'Open Sans',
        reasoning: 'Readable serif paired with neutral sans-serif',
        example: 'Trusted by news sites and blogs'
      },
      {
        headingFont: 'Georgia',
        bodyFont: 'Helvetica',
        reasoning: 'Classic web-safe combination that works everywhere',
        example: 'Timeless and reliable choice'
      }
    ],
    playful: [
      {
        headingFont: 'Fredoka',
        bodyFont: 'Nunito',
        reasoning: 'Rounded, friendly fonts that convey approachability',
        example: 'Great for kids products or casual brands'
      },
      {
        headingFont: 'Pacifico',
        bodyFont: 'Quicksand',
        reasoning: 'Script heading with rounded sans-serif body',
        example: 'Perfect for creative and artistic brands'
      },
      {
        headingFont: 'Comfortaa',
        bodyFont: 'Raleway',
        reasoning: 'Rounded geometric fonts with personality',
        example: 'Modern yet playful combination'
      }
    ],
    elegant: [
      {
        headingFont: 'Cormorant Garamond',
        bodyFont: 'Montserrat',
        reasoning: 'Luxurious serif with clean geometric sans',
        example: 'High-end fashion and luxury brands'
      },
      {
        headingFont: 'Libre Baskerville',
        bodyFont: 'Roboto',
        reasoning: 'Traditional elegance with modern readability',
        example: 'Professional services and law firms'
      },
      {
        headingFont: 'Crimson Text',
        bodyFont: 'Lato',
        reasoning: 'Book-like serif with versatile sans-serif',
        example: 'Publishing and literary websites'
      }
    ],
    technical: [
      {
        headingFont: 'Space Mono',
        bodyFont: 'IBM Plex Sans',
        reasoning: 'Monospace headers for technical feel with readable body',
        example: 'Developer tools and documentation sites'
      },
      {
        headingFont: 'JetBrains Mono',
        bodyFont: 'Inter',
        reasoning: 'Code-inspired headers with system font body',
        example: 'Programming blogs and tech products'
      },
      {
        headingFont: 'Roboto Mono',
        bodyFont: 'Roboto',
        reasoning: 'Consistent font family with mono/sans variants',
        example: "Google's Material Design approach"
      }
    ]
  }
  
  return pairings[input.style] || pairings.modern
}

export async function recommendLayout(input: {
  contentType: 'blog' | 'ecommerce' | 'portfolio' | 'corporate' | 'landing'
  hasLogo: boolean
  menuItems: number
}): Promise<LayoutRecommendation> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600))
  
  const recommendations: Record<string, LayoutRecommendation> = {
    blog: {
      headerStyle: 'minimal',
      footerStyle: 'minimal',
      menuStyle: 'horizontal',
      reasoning: 'Clean, distraction-free layout that puts content first. Minimal header keeps focus on articles.'
    },
    ecommerce: {
      headerStyle: 'modern',
      footerStyle: 'detailed',
      menuStyle: input.menuItems > 5 ? 'sidebar' : 'horizontal',
      reasoning: 'Modern header with search and cart functionality. Detailed footer for policies and support links.'
    },
    portfolio: {
      headerStyle: 'minimal',
      footerStyle: 'minimal',
      menuStyle: 'horizontal',
      reasoning: 'Minimal design to showcase work without distractions. Clean navigation for easy browsing.'
    },
    corporate: {
      headerStyle: 'classic',
      footerStyle: 'detailed',
      menuStyle: 'horizontal',
      reasoning: 'Professional appearance with traditional navigation. Comprehensive footer for company information.'
    },
    landing: {
      headerStyle: 'modern',
      footerStyle: 'minimal',
      menuStyle: 'horizontal',
      reasoning: 'Contemporary header with clear CTAs. Minimal footer to keep focus on conversion.'
    }
  }
  
  return recommendations[input.contentType] || recommendations.corporate
}

// Color harmony utilities
export function generateComplementaryColors(baseColor: string): ColorPalette {
  // Simple complementary color generation
  // In production, use a proper color theory library
  return {
    primary: baseColor,
    secondary: adjustHue(baseColor, 180),
    accent: adjustHue(baseColor, 60),
    background: '#FFFFFF',
    text: '#1A1A1A',
    reasoning: 'Complementary color scheme based on your brand color'
  }
}

export function generateAnalogousColors(baseColor: string): ColorPalette {
  return {
    primary: baseColor,
    secondary: adjustHue(baseColor, 30),
    accent: adjustHue(baseColor, -30),
    background: '#FAFAFA',
    text: '#1F2937',
    reasoning: 'Analogous color harmony for a cohesive, harmonious feel'
  }
}

export function generateTriadicColors(baseColor: string): ColorPalette {
  return {
    primary: baseColor,
    secondary: adjustHue(baseColor, 120),
    accent: adjustHue(baseColor, 240),
    background: '#FFFFFF',
    text: '#111827',
    reasoning: 'Triadic color scheme for vibrant, balanced design'
  }
}

// Helper function to adjust hue (simplified - use chroma.js in production)
function adjustHue(hex: string, degrees: number): string {
  // This is a simplified version - in production, use a proper color manipulation library
  const hsl = hexToHsl(hex)
  hsl.h = (hsl.h + degrees) % 360
  return hslToHex(hsl)
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { h: 0, s: 0, l: 0 }
  
  const r = parseInt(result[1], 16) / 255
  const g = parseInt(result[2], 16) / 255
  const b = parseInt(result[3], 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToHex(hsl: { h: number; s: number; l: number }): string {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100
  
  let r, g, b
  
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}