'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createContent } from '@/src/lib/queries/domains/content'
import { supabase } from '@/src/lib/supabase/client'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { getLayoutTemplate, getEnhancedLayoutTemplate, getTemplateContent } from '@/src/lib/content/templates'
import { MOCK_DATA_PRESETS } from '@/src/lib/content/mock-data'
import { serializePageContent } from '@/src/lib/content'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form'
import { Badge } from '@/src/components/ui/badge'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Layout,
  FileText,
  Grid3X3,
  User,
  Package,
  Phone,
  Sparkles,
  Layers,
  Wand2
} from 'lucide-react'
import { Switch } from '@/src/components/ui/switch'

const createContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  layout: z.enum(['landing']),
  template: z.string().optional()
})

type CreateContentForm = z.infer<typeof createContentSchema>

interface LayoutOption {
  id: CreateContentForm['layout']
  name: string
  description: string
  icon: React.ReactNode
  preview: string
  features: string[]
  recommended: boolean
}

interface TemplateOption {
  id: string
  name: string
  description: string
  preview: string
  recommended: boolean
}

const layoutOptions: LayoutOption[] = [
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Perfect for homepage or promotional pages',
    icon: <Layout className="h-6 w-6" />,
    preview: 'Hero, Featured, Categories, Features, Call-to-Action',
    features: ['Hero', 'Featured', 'Categories', 'Features', 'CTA'],
    recommended: true
  }
]

const templateOptions: TemplateOption[] = [
  {
    id: 'home-page',
    name: 'Home Page',
    description: 'A complete homepage template with all sections',
    preview: 'Hero section, featured content, categories, features, and CTA',
    recommended: true
  },
  {
    id: 'minimal',
    name: 'Minimal Start',
    description: 'Simple landing page with basic blocks',
    preview: 'Hero and CTA sections only',
    recommended: false
  }
]

export default function CreateContentPage() {
  const router = useRouter()
  const { currentSite } = useSiteContext()
  const [step, setStep] = useState(1)
  const [selectedLayout, setSelectedLayout] = useState<CreateContentForm['layout'] | null>('landing')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('home-page')
  const [isCreating, setIsCreating] = useState(false)
  const [useMockData, setUseMockData] = useState(true)

  const form = useForm<CreateContentForm>({
    resolver: zodResolver(createContentSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      layout: 'landing',
      template: 'home-page'
    }
  })

  const onSubmit = async (data: CreateContentForm) => {
    console.log('Form submitted with data:', data)
    
    // Ensure we have all required data
    if (!data.title || !data.layout) {
      toast.error('Please fill in all required fields')
      console.error('Missing required fields:', { title: data.title, layout: data.layout })
      return
    }

    if (!currentSite?.id) {
      console.error('No current site:', currentSite)
      toast.error('No site selected. Please select a site first.')
      return
    }
    
    setIsCreating(true)
    const toastId = toast.loading('Creating page...')
    
    // Set a timeout to handle if the request hangs
    const timeoutId = setTimeout(() => {
      toast.error('Request timed out. Please try again.', { id: toastId })
      setIsCreating(false)
    }, 30000) // 30 second timeout
    
    try {
      console.log('Starting content creation for site:', currentSite.id)
      
      // Generate slug from title
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      console.log('Generated slug:', slug)
      
      // Get template content based on selected template and settings
      const selectedTemplateName = form.getValues('template') || selectedTemplate
      const templateContent = useMockData 
        ? getTemplateContent(selectedTemplateName, data.title, data.subtitle, MOCK_DATA_PRESETS.technology)
        : getTemplateContent(selectedTemplateName, data.title, data.subtitle, { ...MOCK_DATA_PRESETS.technology, complexity: 'simple' })
      const serializedContent = serializePageContent(templateContent)
      
      const contentData = {
        site_id: currentSite.id,
        title: data.title,
        slug,
        content_type: 'page',
        content: serializedContent,
        is_published: false,
        is_featured: false,
        meta_data: {
          subtitle: data.subtitle,
          layout: data.layout,
          template: selectedTemplateName
        }
      }
      
      console.log('Creating content with data:', contentData)
      
      // Create the content in the database
      const newContent = await createContent(supabase, contentData)
      
      console.log('Content created successfully:', newContent)
      clearTimeout(timeoutId)
      toast.success('Page created successfully!', { id: toastId })
      
      // Navigate to the editor with the created content ID
      setTimeout(() => {
        router.push(`/dashboard/content/editor?id=${newContent.id}`)
      }, 100)
      
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('Error creating content - Full error:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create page. Please try again.'
      toast.error(errorMessage, { id: toastId })
    } finally {
      clearTimeout(timeoutId)
      setIsCreating(false)
    }
  }

  const handleLayoutSelect = (layoutId: CreateContentForm['layout']) => {
    setSelectedLayout(layoutId)
    form.setValue('layout', layoutId, { shouldValidate: true })
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    form.setValue('template', templateId, { shouldValidate: true })
  }

  const nextStep = () => {
    if (step === 1) {
      form.trigger(['title']).then((isValid) => {
        if (isValid) {
          setStep(2)
        }
      })
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const getSelectedLayoutInfo = () => {
    const currentLayout = form.getValues('layout') || selectedLayout
    return layoutOptions.find(layout => layout.id === currentLayout)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/content')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Content
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Content</h1>
          <p className="text-gray-500 mt-1">
            Step {step} of 2: {step === 1 ? 'Page Details' : 'Choose Template'}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step >= stepNumber 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
              }
            `}>
              {step > stepNumber ? <Check className="h-4 w-4" /> : stepNumber}
            </div>
            {stepNumber < 2 && (
              <div className={`
                w-12 h-1 mx-2
                ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}
              `} />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step 1: Page Details */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Page Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter a descriptive title for your page"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add a brief description or subtitle"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <Wand2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <Label htmlFor="mock-data" className="font-medium">
                          Include Sample Content
                        </Label>
                        <p className="text-sm text-gray-500">
                          Automatically populate with professional content examples
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="mock-data"
                      checked={useMockData}
                      onCheckedChange={setUseMockData}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={nextStep}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Template Selection */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Choose Template
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Select a template for your Landing Page. You can customize all content later.
                </p>
              </CardHeader>
              <CardContent>
                {/* Page Type Display */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-md">
                      <Layout className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">Landing Page</h3>
                      <p className="text-sm text-blue-700">Includes: Hero, Featured, Categories, Features, and CTA blocks</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {templateOptions.map((template) => (
                    <div
                      key={template.id}
                      className={`
                        relative p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
                        ${selectedTemplate === template.id 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200'
                        }
                      `}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      {template.recommended && (
                        <Badge className="absolute top-3 right-3 bg-yellow-500 text-yellow-900">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                      
                      <div className="flex items-start gap-4">
                        <div className={`
                          p-3 rounded-md
                          ${selectedTemplate === template.id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-600'
                          }
                        `}>
                          <Wand2 className="h-6 w-6" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className={`font-semibold text-xl mb-2 ${
                            selectedTemplate === template.id ? 'text-blue-900' : ''
                          }`}>{template.name}</h3>
                          <p className={`text-sm mb-3 ${
                            selectedTemplate === template.id 
                              ? 'text-blue-800' 
                              : 'text-gray-600'
                          }`}>
                            {template.description}
                          </p>
                          <p className={`text-xs ${
                            selectedTemplate === template.id 
                              ? 'text-blue-700' 
                              : 'text-gray-500'
                          }`}>
                            {template.preview}
                          </p>
                        </div>
                        
                        {selectedTemplate === template.id && (
                          <div className="absolute top-3 left-3">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isCreating || !selectedTemplate}
                  >
                    {isCreating ? 'Creating...' : 'Create Page'}
                    {!isCreating && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </form>
      </Form>
    </div>
  )
}