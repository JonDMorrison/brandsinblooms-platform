'use client'

import React from 'react'
import { ContentSection, PlantItem } from '@/src/lib/content/schema'
import { PlantShopImage } from '@/src/components/ui/plant-shop-image'
import { cn } from '@/src/lib/utils'

interface PlantGridViewProps {
  section: ContentSection
  className?: string
}

/**
 * Theme-aware Plant Grid View Component
 * Displays plants in a compact grid layout optimized for browsing
 */
export function PlantGridView({ section, className }: PlantGridViewProps) {
  const items = (section.data.items as PlantItem[]) || []
  const columns = section.data.columns || 4
  const spacing = section.data.spacing || 'normal'

  if (!items.length) {
    return (
      <div className="plant-section">
        <div className="text-center py-8 text-gray-500">
          No plants in grid yet
        </div>
      </div>
    )
  }

  const spacingClass = {
    tight: 'gap-2',
    normal: 'gap-4', 
    loose: 'gap-6'
  }[spacing] || 'gap-4'

  return (
    <div className={cn('plant-section', className)}>
      <div 
        className={cn('plant-grid', spacingClass)}
        style={{ 
          '--plant-grid-columns-desktop': columns,
          '--plant-grid-columns-tablet': Math.min(columns, 3),
          '--plant-grid-columns-mobile': Math.min(columns, 2)
        } as React.CSSProperties}
      >
        {items.map((plant) => (
          <PlantGridItem key={plant.id} plant={plant} />
        ))}
      </div>
    </div>
  )
}

/**
 * Compact Plant Grid Item Component
 */
interface PlantGridItemProps {
  plant: PlantItem
}

function PlantGridItem({ plant }: PlantGridItemProps) {
  const careLevel = plant.careLevel || 'easy'

  return (
    <div className="plant-card group cursor-pointer">
      {/* Plant Image */}
      {plant.image && (
        <div className="relative mb-3 overflow-hidden">
          <PlantShopImage
            src={plant.image}
            alt={plant.commonName || plant.title || 'Plant image'}
            className="plant-image transition-transform group-hover:scale-105"
            width={250}
            height={250}
          />
          
          {/* Care Level Badge Overlay */}
          <div className="absolute top-2 right-2">
            <span className={`care-badge care-badge-${careLevel} text-xs`}>
              {careLevel}
            </span>
          </div>
        </div>
      )}

      {/* Plant Info */}
      <div className="space-y-2">
        <div>
          <h4 className="plant-name text-sm">
            {plant.commonName || plant.title}
          </h4>
          {plant.scientificName && (
            <p className="plant-scientific-name text-xs">
              {plant.scientificName}
            </p>
          )}
        </div>

        {/* Quick Care Info */}
        <div className="flex items-center justify-between text-xs">
          <div className={`light-indicator light-indicator-${plant.lightRequirement || 'medium'}`}>
            <LightIcon requirement={plant.lightRequirement || 'medium'} />
          </div>
          
          <div className={`water-indicator water-indicator-${plant.wateringFrequency || 'weekly'}`}>
            <WaterIcon frequency={plant.wateringFrequency || 'weekly'} />
          </div>
          
          {plant.plantType && (
            <span className="text-gray-500 capitalize">
              {plant.plantType}
            </span>
          )}
        </div>

        {/* Price or Action */}
        {plant.url && (
          <a 
            href={plant.url}
            className="btn-theme-primary text-xs py-1 px-2 text-center block mt-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            View
          </a>
        )}
      </div>
    </div>
  )
}

/**
 * Compact Light Icon
 */
function LightIcon({ requirement }: { requirement: string }) {
  const iconMap = {
    low: '🌙',
    medium: '☀️', 
    bright: '☀️',
    direct: '🌞'
  }
  
  return <span className="text-xs">{iconMap[requirement as keyof typeof iconMap] || '☀️'}</span>
}

/**
 * Compact Water Icon  
 */
function WaterIcon({ frequency }: { frequency: string }) {
  const iconMap = {
    weekly: '💧',
    'bi-weekly': '💧',
    monthly: '🌊',
    seasonal: '💧'
  }
  
  return <span className="text-xs">{iconMap[frequency as keyof typeof iconMap] || '💧'}</span>
}