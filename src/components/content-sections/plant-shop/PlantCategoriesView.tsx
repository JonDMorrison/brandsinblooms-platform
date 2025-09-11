'use client'

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { cn } from '@/src/lib/utils'

interface PlantCategoriesViewProps {
  section: ContentSection
  className?: string
}

interface PlantCategory {
  id: string
  name: string
  description: string
  icon?: string
  plantCount?: number
  image?: string
  url?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

/**
 * Theme-aware Plant Categories View Component
 * Displays plant categories in an organized, browseable layout
 */
export function PlantCategoriesView({ section, className }: PlantCategoriesViewProps) {
  const categories = (section.data.items as PlantCategory[]) || []
  const layout = section.data.layout || 'grid'
  const columns = section.data.columns || 3

  if (!categories.length) {
    return (
      <div className="plant-section">
        <div className="text-center py-8 text-gray-500">
          No plant categories added yet
        </div>
      </div>
    )
  }

  return (
    <div className={cn('plant-section', className)}>
      {/* Categories Header */}
      <div className="mb-6">
        <h2 className="plant-category-header text-2xl">
          Plant Categories
        </h2>
        <p className="plant-description mt-2">
          Explore our collection organized by plant types and care requirements
        </p>
      </div>

      {/* Categories Layout */}
      {layout === 'grid' ? (
        <div 
          className="plant-grid"
          style={{ 
            '--plant-grid-columns-desktop': columns,
            '--plant-grid-columns-tablet': Math.min(columns, 2),
            '--plant-grid-columns-mobile': 1
          } as React.CSSProperties}
        >
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Category Card Component for Grid Layout
 */
interface CategoryCardProps {
  category: PlantCategory
}

function CategoryCard({ category }: CategoryCardProps) {
  const difficulty = category.difficulty || 'beginner'
  
  const CardContent = (
    <div className="plant-card h-full">
      {/* Category Icon/Image */}
      <div className="mb-4">
        {category.image ? (
          <div className="plant-image bg-green-50 flex items-center justify-center">
            <img 
              src={category.image} 
              alt={category.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="plant-image bg-green-50 flex items-center justify-center text-4xl">
            {category.icon || '🌿'}
          </div>
        )}
      </div>

      {/* Category Info */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="plant-name">{category.name}</h3>
          <span className={`care-badge care-badge-${getDifficultyLevel(difficulty)} text-xs`}>
            {difficulty}
          </span>
        </div>

        <p className="plant-description mb-3">
          {category.description}
        </p>

        {/* Plant Count */}
        {category.plantCount && (
          <div className="text-sm text-gray-600 mb-3">
            <span className="plant-icon-small">🌱</span>
            <span className="ml-1">{category.plantCount} plants</span>
          </div>
        )}
      </div>

      {/* Browse Button */}
      <div className="mt-auto">
        <div className="btn-theme-primary text-center py-2">
          Browse {category.name}
        </div>
      </div>
    </div>
  )

  if (category.url) {
    return (
      <a href={category.url} className="block group">
        {CardContent}
      </a>
    )
  }

  return CardContent
}

/**
 * Category Row Component for List Layout
 */
function CategoryRow({ category }: CategoryCardProps) {
  const difficulty = category.difficulty || 'beginner'
  
  const RowContent = (
    <div className="plant-card">
      <div className="flex items-center gap-4">
        {/* Category Icon */}
        <div className="flex-shrink-0">
          {category.image ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-green-50">
              <img 
                src={category.image} 
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-green-50 flex items-center justify-center text-2xl">
              {category.icon || '🌿'}
            </div>
          )}
        </div>

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="plant-name">{category.name}</h3>
            <span className={`care-badge care-badge-${getDifficultyLevel(difficulty)} text-xs`}>
              {difficulty}
            </span>
            {category.plantCount && (
              <span className="text-sm text-gray-500">
                ({category.plantCount} plants)
              </span>
            )}
          </div>
          
          <p className="plant-description text-sm">
            {category.description}
          </p>
        </div>

        {/* Browse Arrow */}
        <div className="flex-shrink-0">
          <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )

  if (category.url) {
    return (
      <a href={category.url} className="block group">
        {RowContent}
      </a>
    )
  }

  return RowContent
}

/**
 * Helper function to map difficulty to care level colors
 */
function getDifficultyLevel(difficulty: string): string {
  const difficultyMap = {
    beginner: 'easy',
    intermediate: 'medium', 
    advanced: 'challenging'
  }
  return difficultyMap[difficulty as keyof typeof difficultyMap] || 'easy'
}