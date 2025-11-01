/**
 * Default categories for the Categories section
 * Shared between CategoriesPreview and CustomerSiteSection to ensure consistent fallback behavior
 */

export interface Category {
  id: string
  name: string
  image: string
  link: string
  plantCount?: number
  description?: string
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'beginner-friendly',
    name: 'Beginner-Friendly',
    image: '/images/golden-pothos.jpg',
    link: '/plants?care-level=beginner',
    plantCount: 12,
    description: 'Perfect for new plant parents - low maintenance, forgiving varieties'
  },
  {
    id: 'houseplants',
    name: 'Houseplants',
    image: '/images/snake-plant.jpg',
    link: '/plants?category=houseplants',
    plantCount: 25,
    description: 'Transform indoor spaces with air-purifying and decorative plants'
  },
  {
    id: 'outdoor',
    name: 'Outdoor Specimens',
    image: '/images/japanese-maple.jpg',
    link: '/plants?category=outdoor',
    plantCount: 18,
    description: 'Hardy outdoor plants for landscaping and garden design'
  },
  {
    id: 'succulents',
    name: 'Succulents & Cacti',
    image: '/images/fiddle-leaf-fig.jpg',
    link: '/plants?category=succulents',
    plantCount: 15,
    description: 'Drought-tolerant beauties perfect for sunny spots and xeriscaping'
  }
]
