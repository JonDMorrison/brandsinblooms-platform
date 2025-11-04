export const HEADER_STYLES = [
  { 
    value: 'modern', 
    label: 'Modern', 
    description: 'Clean and minimal design',
    preview: 'modern'
  },
  { 
    value: 'classic', 
    label: 'Classic', 
    description: 'Traditional navigation layout',
    preview: 'classic'
  },
  { 
    value: 'minimal', 
    label: 'Minimal', 
    description: 'Ultra-simple header',
    preview: 'minimal'
  },
] as const

export const NAVIGATION_OPTIONS = [
  { value: 'home', label: 'Home', required: false },
  { value: 'about', label: 'About', required: false },
  { value: 'contact', label: 'Contact', required: false },
] as const