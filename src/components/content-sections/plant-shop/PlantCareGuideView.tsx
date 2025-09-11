'use client'

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { cn } from '@/src/lib/utils'

interface PlantCareGuideViewProps {
  section: ContentSection
  className?: string
}

interface CareStep {
  id: string
  title: string
  description: string
  icon?: string
  difficulty?: 'easy' | 'medium' | 'challenging'
  frequency?: string
  season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'year-round'
}

/**
 * Theme-aware Plant Care Guide View Component
 * Displays comprehensive care instructions with visual guides
 */
export function PlantCareGuideView({ section, className }: PlantCareGuideViewProps) {
  const careSteps = (section.data.items as CareStep[]) || []
  const plantName = section.data.plantName || 'Your Plant'

  if (!careSteps.length) {
    return (
      <div className="plant-section">
        <div className="text-center py-8 text-gray-500">
          No care guide steps added yet
        </div>
      </div>
    )
  }

  return (
    <div className={cn('plant-section', className)}>
      {/* Care Guide Header */}
      <div className="mb-6">
        <h2 className="plant-category-header text-2xl">
          {plantName} Care Guide
        </h2>
        <p className="plant-description mt-2">
          Follow these steps to keep your plant healthy and thriving
        </p>
      </div>

      {/* Care Steps */}
      <div className="space-y-6">
        {careSteps.map((step, index) => (
          <CareStepCard key={step.id} step={step} stepNumber={index + 1} />
        ))}
      </div>

      {/* Care Calendar Summary */}
      <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="plant-category-header text-lg mb-3">Quick Care Calendar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {getSeasonalTasks(careSteps).map((task, index) => (
            <div key={index} className="text-sm">
              <div className={`season-${task.season} font-medium mb-1`}>
                {getSeasonIcon(task.season)} {task.season}
              </div>
              <div className="text-gray-700">{task.task}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Individual Care Step Card
 */
interface CareStepCardProps {
  step: CareStep
  stepNumber: number
}

function CareStepCard({ step, stepNumber }: CareStepCardProps) {
  const difficulty = step.difficulty || 'easy'

  return (
    <div className="plant-card">
      <div className="flex items-start gap-4">
        {/* Step Number */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-800 font-semibold">
              {step.icon || stepNumber}
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="plant-name text-lg">{step.title}</h3>
            <span className={`care-badge care-badge-${difficulty} text-xs`}>
              {difficulty}
            </span>
            {step.season && step.season !== 'year-round' && (
              <span className={`season-${step.season} text-sm`}>
                {getSeasonIcon(step.season)}
              </span>
            )}
          </div>

          <p className="plant-description mb-3">
            {step.description}
          </p>

          {/* Additional Details */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {step.frequency && (
              <div className="flex items-center gap-1">
                <span className="plant-icon-small">🔄</span>
                <span>Every {step.frequency}</span>
              </div>
            )}
            {step.season && (
              <div className="flex items-center gap-1">
                <span className="plant-icon-small">📅</span>
                <span className="capitalize">{step.season}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Helper function to get seasonal tasks
 */
function getSeasonalTasks(careSteps: CareStep[]) {
  const seasonalTasks: { season: string; task: string }[] = []
  
  careSteps.forEach(step => {
    if (step.season && step.season !== 'year-round') {
      seasonalTasks.push({
        season: step.season,
        task: step.title
      })
    }
  })

  // Add default seasonal tasks if none specified
  if (seasonalTasks.length === 0) {
    return [
      { season: 'spring', task: 'Increase watering' },
      { season: 'summer', task: 'Monitor for pests' },
      { season: 'autumn', task: 'Reduce fertilizing' },
      { season: 'winter', task: 'Water less frequently' }
    ]
  }

  return seasonalTasks
}

/**
 * Helper function to get season icons
 */
function getSeasonIcon(season: string): string {
  const icons = {
    spring: '🌱',
    summer: '☀️',
    autumn: '🍂',
    winter: '❄️'
  }
  return icons[season as keyof typeof icons] || '📅'
}