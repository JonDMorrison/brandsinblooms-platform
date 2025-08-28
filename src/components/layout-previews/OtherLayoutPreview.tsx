'use client'

import React from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { 
  Layers, 
  Plus, 
  Star, 
  Zap, 
  Users, 
  Image, 
  FileText,
  Grid3X3,
  MessageSquare,
  DollarSign,
  Target,
  Briefcase
} from 'lucide-react'

interface OtherLayoutPreviewProps {
  title: string
  subtitle?: string
  content?: Record<string, unknown>
  className?: string
}

export function OtherLayoutPreview({ title, subtitle, className = '' }: OtherLayoutPreviewProps) {
  const availableSections = [
    { type: 'hero', name: 'Hero Section', icon: Target, description: 'Eye-catching header with CTA' },
    { type: 'text', name: 'Text Content', icon: FileText, description: 'Simple text block' },
    { type: 'richText', name: 'Rich Text', icon: FileText, description: 'Formatted content with styling' },
    { type: 'image', name: 'Image', icon: Image, description: 'Single image with caption' },
    { type: 'gallery', name: 'Image Gallery', icon: Grid3X3, description: 'Grid of images' },
    { type: 'features', name: 'Features', icon: Star, description: 'Feature cards grid' },
    { type: 'cta', name: 'Call to Action', icon: Zap, description: 'Action section with buttons' },
    { type: 'testimonials', name: 'Testimonials', icon: MessageSquare, description: 'Customer reviews' },
    { type: 'form', name: 'Contact Form', icon: MessageSquare, description: 'Customizable form' },
    { type: 'pricing', name: 'Pricing Table', icon: DollarSign, description: 'Pricing plans comparison' },
    { type: 'team', name: 'Team Members', icon: Users, description: 'Team profiles grid' },
    { type: 'mission', name: 'Mission Statement', icon: Target, description: 'Company mission' },
    { type: 'values', name: 'Company Values', icon: Star, description: 'Core values list' },
    { type: 'specifications', name: 'Specifications', icon: Briefcase, description: 'Product details' }
  ]

  return (
    <div className={`flex-1 bg-gray-50 min-h-screen ${className}`}>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            <Layers className="h-3 w-3 mr-1" />
            Custom Layout
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
          {subtitle && (
            <p className="text-xl text-gray-600 mb-6">{subtitle}</p>
          )}
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            This is a flexible layout where you can mix and match any combination of content sections. 
            Build your page exactly how you want it with no restrictions.
          </p>
        </div>
      </div>

      {/* Available Sections Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Available Content Sections</h2>
          <p className="text-gray-600">
            Choose from any of these content blocks to build your custom page
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableSections.map((section) => {
            const Icon = section.icon
            return (
              <Card key={section.type} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="mt-3">{section.name}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white px-6 py-12 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Choose Custom Layout?</h2>
            <p className="text-gray-600">Complete freedom to design your page</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">No Requirements</h3>
              <p className="text-gray-600 text-sm">
                Unlike other layouts, there are no mandatory sections. Add only what you need.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                <Layers className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Mix & Match</h3>
              <p className="text-gray-600 text-sm">
                Combine any sections in any order to create your perfect page layout.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Full Control</h3>
              <p className="text-gray-600 text-sm">
                Edit, reorder, show, or hide sections as needed for your content.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gray-50 px-6 py-12 text-center border-t">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Build Your Custom Page?</h2>
          <p className="text-gray-600 mb-6">
            Start adding content sections to create your unique layout
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add First Section
            </Button>
            <Button size="lg" variant="outline">
              View Examples
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}