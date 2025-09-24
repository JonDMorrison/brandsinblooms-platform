'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createContent } from '@/src/lib/queries/domains/content'
import { supabase } from '@/src/lib/supabase/client'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { getTemplateContent } from '@/src/lib/content/templates'
import { MOCK_DATA_PRESETS } from '@/src/lib/content/mock-data'
import { serializePageContent } from '@/src/lib/content'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form'
import { Badge } from '@/src/components/ui/badge'
import { Switch } from '@/src/components/ui/switch'
import { toast } from 'sonner'
import { 
  ArrowRight, 
  Check,
  Layout,
  Sparkles,
  Wand2,
  ArrowLeft
} from 'lucide-react'

const createContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  layout: z.enum(['landing', 'about']),
  template: z.string().optional()
})

type CreateContentForm = z.infer<typeof createContentSchema>

interface PageTypeOption {
  id: 'landing' | 'about'
  name: string
  description: string
  preview: string
  icon: React.ComponentType<{ className?: string }>
  recommended?: boolean
}

interface TemplateOption {
  id: string
  name: string
  description: string
  preview: string
  recommended: boolean
}

const pageTypeOptions: PageTypeOption[] = [
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Complete homepage with marketing sections',
    preview: 'Hero, Featured, Categories, Features, and CTA blocks',
    icon: Layout,
    recommended: true
  },
  {
    id: 'about',
    name: 'About Page',
    description: 'Professional about page with company information',
    preview: 'Hero, Mission, Values, Team, Features, Story, and CTA blocks',
    icon: ({ className }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    )
  }
]

const landingTemplateOptions: TemplateOption[] = [
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

const aboutTemplateOptions: TemplateOption[] = [
  {
    id: 'full-about',
    name: 'Full About Page',
    description: 'Complete about page with all sections',
    preview: 'Hero, Mission, Values, Team, Features, Story, and CTA sections',
    recommended: true
  },
  {
    id: 'minimal-about',
    name: 'Minimal About',
    description: 'Essential about sections only',
    preview: 'Hero, Mission, and CTA sections only',
    recommended: false
  }
]

interface CreateContentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContentCreated?: () => void
}

export function CreateContentModal({ open, onOpenChange, onContentCreated }: CreateContentModalProps) {
  const router = useRouter()
  const { currentSite } = useSiteContext()
  const [step, setStep] = useState(1)
  const [selectedPageType, setSelectedPageType] = useState<'landing' | 'about'>('landing')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('home-page')
  const [isCreating, setIsCreating] = useState(false)
  const [useMockData, setUseMockData] = useState(true)

  const form = useForm<CreateContentForm>({
    resolver: zodResolver(createContentSchema),
    defaultValues: {
      title: '',
      layout: 'landing',
      template: 'home-page'
    }
  })

  // Get current template options based on selected page type
  const currentTemplateOptions = selectedPageType === 'about' ? aboutTemplateOptions : landingTemplateOptions

  const handlePageTypeSelect = (pageType: 'landing' | 'about') => {
    setSelectedPageType(pageType)
    form.setValue('layout', pageType, { shouldValidate: true })

    // Reset template selection when page type changes
    const defaultTemplate = pageType === 'about' ? 'full-about' : 'home-page'
    setSelectedTemplate(defaultTemplate)
    form.setValue('template', defaultTemplate, { shouldValidate: true })
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
    } else if (step === 2) {
      setStep(3)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const resetModal = () => {
    setStep(1)
    setSelectedPageType('landing')
    setSelectedTemplate('home-page')
    setUseMockData(true)
    form.reset()
  }

  const handleModalClose = (open: boolean) => {
    if (!open) {
      resetModal()
    }
    onOpenChange(open)
  }

  const onSubmit = async (data: CreateContentForm) => {
    if (!data.title || !data.layout) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!currentSite?.id) {
      toast.error('No site selected. Please select a site first.')
      return
    }
    
    setIsCreating(true)
    const toastId = toast.loading('Creating page...')
    
    try {
      // Generate slug from title
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      // Get template content based on selected template and settings
      const selectedTemplateName = form.getValues('template') || selectedTemplate
      const templateContent = useMockData 
        ? getTemplateContent(selectedTemplateName, data.title, undefined, MOCK_DATA_PRESETS.technology)
        : getTemplateContent(selectedTemplateName, data.title, undefined, { ...MOCK_DATA_PRESETS.technology, complexity: 'simple' })
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
          layout: data.layout,
          template: selectedTemplateName
        }
      }
      
      // Create the content in the database
      const newContent = await createContent(supabase, contentData)
      
      toast.success('Page created successfully!', { id: toastId })
      
      // Close modal and refresh content list
      handleModalClose(false)
      onContentCreated?.()
      
      // Navigate to the editor with the created content ID
      setTimeout(() => {
        router.push(`/dashboard/content/editor?id=${newContent.id}`)
      }, 100)
      
    } catch (error) {
      console.error('Error creating content:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create page. Please try again.'
      toast.error(errorMessage, { id: toastId })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left pb-6 border-b">
          <DialogTitle className="text-2xl font-bold">Create New Content</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {
              step === 1 ? 'Page Details' :
              step === 2 ? 'Page Type' :
              'Choose Template'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4 py-4">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                ${step >= stepNumber 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step > stepNumber ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`
                  w-12 h-1 mx-2 rounded-full transition-all
                  ${step > stepNumber ? 'bg-green-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Page Details */}
            {step === 1 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Page Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter a descriptive title for your page"
                          className="h-12 text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <div className="p-6 border rounded-xl bg-gradient-to-br from-blue-50 to-emerald-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <Wand2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <Label htmlFor="mock-data" className="text-base font-semibold text-green-900">
                          Include Sample Content
                        </Label>
                        <p className="text-sm text-green-700 mt-1">
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

                <div className="flex justify-end pt-4">
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Page Type Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-4 block">Choose Page Type</Label>
                  <p className="text-sm text-gray-600 mb-6">
                    Select the type of page you want to create. Each type has different sections and layouts.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pageTypeOptions.map((pageType) => {
                      const IconComponent = pageType.icon
                      return (
                        <div
                          key={pageType.id}
                          className={`
                            relative p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
                            ${selectedPageType === pageType.id
                              ? 'border-green-600 bg-green-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                          onClick={() => handlePageTypeSelect(pageType.id)}
                        >
                          {pageType.recommended && (
                            <Badge className="absolute top-2 right-2 bg-yellow-500 text-yellow-900 text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Recommended
                            </Badge>
                          )}

                          <div className="flex items-start gap-4">
                            <div className={`
                              p-3 rounded-md transition-colors
                              ${selectedPageType === pageType.id
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-600'
                              }
                            `}>
                              <IconComponent className="h-6 w-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className={`text-lg font-semibold mb-2 ${
                                selectedPageType === pageType.id ? 'text-green-900' : 'text-gray-900'
                              }`}>{pageType.name}</h3>
                              <p className={`text-sm mb-3 ${
                                selectedPageType === pageType.id
                                  ? 'text-green-800'
                                  : 'text-gray-600'
                              }`}>
                                {pageType.description}
                              </p>
                              <p className={`text-xs leading-relaxed ${
                                selectedPageType === pageType.id
                                  ? 'text-green-700'
                                  : 'text-gray-500'
                              }`}>
                                {pageType.preview}
                              </p>
                            </div>

                            {selectedPageType === pageType.id && (
                              <div className="absolute top-2 left-2">
                                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    size="lg"
                    className="px-8"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Template Selection */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Page Type Display */}
                <div className={`p-4 rounded-lg border ${
                  selectedPageType === 'about'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 text-white rounded-md ${
                      selectedPageType === 'about' ? 'bg-blue-600' : 'bg-green-600'
                    }`}>
                      {selectedPageType === 'about' ? (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <Layout className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${
                        selectedPageType === 'about' ? 'text-blue-900' : 'text-green-900'
                      }`}>
                        {selectedPageType === 'about' ? 'About Page' : 'Landing Page'}
                      </h3>
                      <p className={`text-sm ${
                        selectedPageType === 'about' ? 'text-blue-700' : 'text-green-700'
                      }`}>
                        {selectedPageType === 'about'
                          ? 'Includes: Hero, Mission, Values, Team, Features, Story, and CTA blocks'
                          : 'Includes: Hero, Featured, Categories, Features, and CTA blocks'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-4 block">Choose a Template</Label>
                  <p className="text-sm text-gray-600 mb-6">
                    Select a template for your {selectedPageType === 'about' ? 'About Page' : 'Landing Page'}. You can customize all content later.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentTemplateOptions.map((template) => (
                      <div
                        key={template.id}
                        className={`
                          relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
                          ${selectedTemplate === template.id 
                            ? 'border-green-600 bg-green-50 shadow-lg' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        {template.recommended && (
                          <Badge className="absolute top-2 right-2 bg-yellow-500 text-yellow-900 text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <div className={`
                            p-2 rounded-md transition-colors
                            ${selectedTemplate === template.id 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-100 text-gray-600'
                            }
                          `}>
                            <Wand2 className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-lg font-semibold mb-1 ${
                              selectedTemplate === template.id ? 'text-green-900' : 'text-gray-900'
                            }`}>{template.name}</h3>
                            <p className={`text-sm mb-2 ${
                              selectedTemplate === template.id 
                                ? 'text-green-800' 
                                : 'text-gray-600'
                            }`}>
                              {template.description}
                            </p>
                            <p className={`text-xs leading-relaxed ${
                              selectedTemplate === template.id 
                                ? 'text-green-700' 
                                : 'text-gray-500'
                            }`}>
                              {template.preview}
                            </p>
                          </div>
                          
                          {selectedTemplate === template.id && (
                            <div className="absolute top-2 left-2">
                              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                    size="lg"
                    className="px-8"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isCreating || !selectedTemplate}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8"
                  >
                    {isCreating ? 'Creating...' : 'Create Page'}
                    {!isCreating && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}