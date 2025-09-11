'use client'

import React from 'react'
import Image from 'next/image'
import { ContentSection, PlantItem } from '@/src/lib/content/schema'
import { PlantShopImage } from '@/src/components/ui/plant-shop-image'
import { cn } from '@/src/lib/utils'

interface PlantShowcaseViewProps {
  section: ContentSection
  className?: string
}

/**
 * Theme-aware Plant Showcase View Component
 * Displays plants in a grid layout with full theme integration
 */
export function PlantShowcaseView({ section, className }: PlantShowcaseViewProps) {
  const items = (section.data.items as PlantItem[]) || []
  const columns = section.data.columns || 3

  if (!items.length) {
    return (
      <div className="plant-section">
        <div className="text-center py-8 text-gray-500">
          No plants to showcase yet
        </div>
      </div>
    )
  }

  return (
    <div className={cn('plant-section', className)}>
      <div 
        className="plant-grid"
        style={{ 
          '--plant-grid-columns-desktop': columns,
          '--plant-grid-columns-tablet': Math.min(columns, 2),
          '--plant-grid-columns-mobile': 1
        } as React.CSSProperties}
      >
        {items.map((plant) => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual Plant Card Component with Theme Integration
 */
interface PlantCardProps {
  plant: PlantItem
}

function PlantCard({ plant }: PlantCardProps) {
  const careLevel = plant.careLevel || 'easy'
  const lightRequirement = plant.lightRequirement || 'medium'
  const wateringFrequency = plant.wateringFrequency || 'weekly'

  return (
    <div className="plant-card">
      {/* Plant Image */}
      {plant.image && (
        <div className="mb-4">
          <PlantShopImage
            src={plant.image}
            alt={plant.commonName || plant.title || 'Plant image'}
            className="plant-image"
            width={300}
            height={300}
          />
        </div>
      )}

      {/* Plant Names */}
      <div className="mb-3">
        <h3 className="plant-name">
          {plant.commonName || plant.title}
        </h3>
        {plant.scientificName && (
          <p className="plant-scientific-name mt-1">
            {plant.scientificName}
          </p>
        )}
      </div>

      {/* Plant Description */}
      {plant.content && (
        <p className="plant-description mb-4">
          {plant.content}
        </p>
      )}

      {/* Care Information */}
      <div className="space-y-3">
        {/* Care Level Badge */}
        <div className="flex items-center gap-2">
          <span className={`care-badge care-badge-${careLevel}`}>
            {careLevel}
          </span>
        </div>

        {/* Light and Water Requirements */}
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className={`light-indicator light-indicator-${lightRequirement}`}>
            <LightIcon requirement={lightRequirement} />
            <span>{getLightLabel(lightRequirement)}</span>
          </div>
          
          <div className={`water-indicator water-indicator-${wateringFrequency}`}>
            <WaterIcon frequency={wateringFrequency} />
            <span>{getWaterLabel(wateringFrequency)}</span>
          </div>
        </div>

        {/* Additional Plant Details */}
        {(plant.maxHeight || plant.bloomTime) && (
          <div className="text-sm space-y-1 pt-2 border-t border-gray-100">
            {plant.maxHeight && (
              <div className="flex justify-between">
                <span className="text-gray-600">Max Height:</span>
                <span>{plant.maxHeight}</span>
              </div>
            )}
            {plant.bloomTime && (
              <div className="flex justify-between">
                <span className="text-gray-600">Bloom Time:</span>
                <span>{plant.bloomTime}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Link to Details */}
      {plant.url && (
        <div className="mt-4">
          <a 
            href={plant.url}
            className="btn-theme-primary text-center block"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn More
          </a>
        </div>
      )}
    </div>
  )
}

/**
 * Light requirement icon component
 */
function LightIcon({ requirement }: { requirement: string }) {
  const iconMap = {
    low: '🌙',
    medium: '☀️',
    bright: '☀️',
    direct: '🌞'
  }
  
  return <span className="plant-icon-small">{iconMap[requirement as keyof typeof iconMap] || '☀️'}</span>
}

/**
 * Water frequency icon component
 */
function WaterIcon({ frequency }: { frequency: string }) {
  const iconMap = {
    weekly: '💧',
    'bi-weekly': '💧',
    monthly: '🌊',
    seasonal: '💧'
  }
  
  return <span className="plant-icon-small">{iconMap[frequency as keyof typeof iconMap] || '💧'}</span>
}

/**
 * Helper functions for labels
 */
function getLightLabel(requirement: string): string {
  const labelMap = {
    low: 'Low Light',
    medium: 'Medium Light',
    bright: 'Bright Light',
    direct: 'Direct Sun'
  }
  return labelMap[requirement as keyof typeof labelMap] || 'Medium Light'
}

function getWaterLabel(frequency: string): string {
  const labelMap = {
    weekly: 'Weekly',
    'bi-weekly': 'Bi-weekly',
    monthly: 'Monthly', 
    seasonal: 'Seasonal'
  }
  return labelMap[frequency as keyof typeof labelMap] || 'Weekly'
}