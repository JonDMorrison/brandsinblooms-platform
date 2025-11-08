'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createContent, generateUniqueContentSlug } from '@/src/lib/queries/domains/content'
import { supabase } from '@/src/lib/supabase/client'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { useAuth } from '@/src/contexts/AuthContext'
import { getTemplateContent } from '@/src/lib/content/templates'
import { MOCK_DATA_PRESETS } from '@/src/lib/content/mock-data'
import { serializePageContent } from '@/src/lib/content'
import { SlugValidator } from '@/src/lib/content/slug-validator'
import { getDisplayErrorMessage } from '@/src/lib/queries/errors'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Calendar } from '@/src/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
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
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Check,
  Layout,
  Sparkles,
  Wand2,
  ArrowLeft,
  Loader2,
  CalendarIcon
} from 'lucide-react'

const createContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  layout: z.enum(['landing', 'about', 'contact', 'other', 'blog_post']),
  template: z.string().optional(),
  // Blog-specific metadata fields
  subtitle: z.string().optional(),
  featured_image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  author_id: z.string().optional(),
  publish_date: z.date().optional()
})

type CreateContentForm = z.infer<typeof createContentSchema>

interface PageTypeOption {
  id: 'landing' | 'about' | 'contact' | 'other' | 'blog_post'
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
    preview: 'Header, Mission, Values, Features, Story, and CTA blocks',
    icon: ({ className }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'contact',
    name: 'Contact Page',
    description: 'Contact page with business information and FAQ',
    preview: 'Header, Business Info, Rich Text, and FAQ blocks',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    id: 'other',
    name: 'Simple Content Page',
    description: 'Flexible page for privacy, terms, FAQ, and text content',
    preview: 'Header and Rich Text sections - fully customizable',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    id: 'blog_post',
    name: 'Blog Post',
    description: 'Article page for blogging with rich content',
    preview: 'Header, Featured Image, Content, Author Bio, and Related Posts',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    recommended: false
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
    preview: 'Header, Mission, Values, Features, Story, and CTA sections',
    recommended: true
  },
  {
    id: 'minimal-about',
    name: 'Minimal About',
    description: 'Essential about sections only',
    preview: 'Header, Mission, and CTA sections only',
    recommended: false
  }
]

const contactTemplateOptions: TemplateOption[] = [
  {
    id: 'full-contact',
    name: 'Full Contact Page',
    description: 'Complete contact page with all sections',
    preview: 'Header, Business Info, Rich Text, and FAQ sections',
    recommended: true
  },
  {
    id: 'minimal-contact',
    name: 'Simple Contact',
    description: 'Essential contact sections only',
    preview: 'Header and Business Info sections only',
    recommended: false
  }
]

const otherTemplateOptions: TemplateOption[] = [
  {
    id: 'privacy-policy',
    name: 'Privacy Policy',
    description: 'Complete privacy policy with all sections',
    preview: 'Header + 8 comprehensive privacy sections',
    recommended: true
  },
  {
    id: 'terms-of-service',
    name: 'Terms of Service',
    description: 'Complete terms of service with all sections',
    preview: 'Header + 8 comprehensive terms sections',
    recommended: true
  }
]

const blogTemplateOptions: TemplateOption[] = [
  {
    id: 'full-blog-post',
    name: 'Full Blog Post',
    description: 'Complete blog post with all sections',
    preview: 'Header, Featured Image, Rich Content, Author Bio, and Related Posts',
    recommended: true
  },
  {
    id: 'minimal-blog-post',
    name: 'Minimal Blog Post',
    description: 'Simple blog post with essential sections',
    preview: 'Header and Rich Content sections only',
    recommended: false
  }
]

interface CreateContentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContentCreated?: () => void
  siteIdOverride?: string
  onNavigateAfterCreate?: (newContent: { id: string; slug: string; title: string }) => void
  defaultPageType?: 'landing' | 'about' | 'contact' | 'other' | 'blog_post'
}

export function CreateContentModal({
  open,
  onOpenChange,
  onContentCreated,
  siteIdOverride,
  onNavigateAfterCreate,
  defaultPageType
}: CreateContentModalProps) {
  const router = useRouter()
  const { currentSite } = useSiteContext()
  const { user } = useAuth()

  // Use override site ID if provided, otherwise use site context
  const activeSiteId = siteIdOverride || currentSite?.id
  const [step, setStep] = useState(1)
  const [selectedPageType, setSelectedPageType] = useState<'landing' | 'about' | 'contact' | 'other' | 'blog_post'>(defaultPageType || 'landing')
  const [selectedTemplate, setSelectedTemplate] = useState<string>(defaultPageType === 'blog_post' ? 'full-blog-post' : 'home-page')
  const [isCreating, setIsCreating] = useState(false)
  const [useMockData, setUseMockData] = useState(true)

  // Slug validation state
  const [isValidatingSlug, setIsValidatingSlug] = useState(false)
  const [slugValidationMessage, setSlugValidationMessage] = useState<string>('')
  const [slugValidationStatus, setSlugValidationStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle')
  const [generatedSlug, setGeneratedSlug] = useState<string>('')

  const form = useForm<CreateContentForm>({
    resolver: zodResolver(createContentSchema),
    defaultValues: {
      title: '',
      layout: defaultPageType || 'landing',
      template: defaultPageType === 'blog_post' ? 'full-blog-post' : 'home-page',
      subtitle: '',
      featured_image: '',
      author_id: user?.id || '',
      publish_date: undefined
    }
  })

  // Get current template options based on selected page type
  const currentTemplateOptions =
    selectedPageType === 'about' ? aboutTemplateOptions :
    selectedPageType === 'contact' ? contactTemplateOptions :
    selectedPageType === 'other' ? otherTemplateOptions :
    selectedPageType === 'blog_post' ? blogTemplateOptions :
    landingTemplateOptions

  const handlePageTypeSelect = (pageType: 'landing' | 'about' | 'contact' | 'other' | 'blog_post') => {
    setSelectedPageType(pageType)
    form.setValue('layout', pageType, { shouldValidate: true })

    // Reset template selection when page type changes
    const defaultTemplate =
      pageType === 'about' ? 'full-about' :
      pageType === 'contact' ? 'full-contact' :
      pageType === 'other' ? 'privacy-policy' :
      pageType === 'blog_post' ? 'full-blog-post' :
      'home-page'
    setSelectedTemplate(defaultTemplate)
    form.setValue('template', defaultTemplate, { shouldValidate: true })

    // Reset blog-specific fields when switching to/from blog_post
    if (pageType === 'blog_post') {
      // Initialize blog fields with defaults
      form.setValue('author_id', user?.id || '')
      form.setValue('subtitle', '')
      form.setValue('featured_image', '')
      form.setValue('publish_date', undefined)
    } else {
      // Clear blog fields when switching to other types
      form.setValue('subtitle', '')
      form.setValue('featured_image', '')
      form.setValue('author_id', '')
      form.setValue('publish_date', undefined)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    form.setValue('template', templateId, { shouldValidate: true })
  }

  // Debounced slug validation - generates unique slug preview
  const validateSlugAvailability = useCallback(async (title: string) => {
    if (!title || !activeSiteId) {
      setSlugValidationStatus('idle')
      setSlugValidationMessage('')
      setGeneratedSlug('')
      return
    }

    setIsValidatingSlug(true)
    setSlugValidationStatus('checking')
    setSlugValidationMessage('Checking availability...')

    try {
      // Generate unique slug (auto-appends -1, -2, etc. if needed)
      const uniqueSlug = await generateUniqueContentSlug(supabase, title, activeSiteId)

      // Generate base slug to compare
      const baseSlug = SlugValidator.generateFromTitle(title)

      setGeneratedSlug(uniqueSlug)

      // If unique slug is different from base, it means we added a suffix
      if (uniqueSlug !== baseSlug) {
        setSlugValidationStatus('taken')
        setSlugValidationMessage(`Will be saved as: ${uniqueSlug}`)
      } else {
        setSlugValidationStatus('available')
        setSlugValidationMessage(`✓ Will be saved as: ${uniqueSlug}`)
      }
    } catch (error) {
      console.error('Error generating slug:', error)
      setSlugValidationStatus('error')
      setSlugValidationMessage('Unable to generate slug')
      setGeneratedSlug('')
    } finally {
      setIsValidatingSlug(false)
    }
  }, [activeSiteId])

  // Debounced title change handler
  useEffect(() => {
    const title = form.watch('title')
    const timeoutId = setTimeout(() => {
      validateSlugAvailability(title)
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [form.watch('title'), validateSlugAvailability])

  const nextStep = () => {
    if (step === 1) {
      form.trigger(['title']).then((isValid) => {
        // Just validate the title field, don't block on slug
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
    setSelectedPageType(defaultPageType || 'landing')
    setSelectedTemplate(defaultPageType === 'blog_post' ? 'full-blog-post' : 'home-page')
    setUseMockData(true)
    setSlugValidationStatus('idle')
    setSlugValidationMessage('')
    setIsValidatingSlug(false)
    setGeneratedSlug('')
    form.reset({
      title: '',
      layout: defaultPageType || 'landing',
      template: defaultPageType === 'blog_post' ? 'full-blog-post' : 'home-page',
      subtitle: '',
      featured_image: '',
      author_id: user?.id || '',
      publish_date: undefined
    })
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

    if (!activeSiteId) {
      toast.error('No site selected. Please select a site first.')
      return
    }

    setIsCreating(true)
    const toastId = toast.loading('Creating page...')

    try {
      // Use pre-generated unique slug, or generate it now
      const slug = generatedSlug || await generateUniqueContentSlug(supabase, data.title, activeSiteId)

      // Get template content based on selected template and settings
      const selectedTemplateName = form.getValues('template') || selectedTemplate
      const templateContent = useMockData 
        ? getTemplateContent(selectedTemplateName, data.title, undefined, MOCK_DATA_PRESETS.technology)
        : getTemplateContent(selectedTemplateName, data.title, undefined, { ...MOCK_DATA_PRESETS.technology, complexity: 'simple' })
      const serializedContent = serializePageContent(templateContent)

      // Map layout to correct content_type and meta_data.layout
      // For blog_post: content_type='blog_post' and layout='blog'
      // For other types: content_type=layout and layout=same value
      const isBlogPost = data.layout === 'blog_post'
      const contentType = isBlogPost ? 'blog_post' : data.layout
      const layoutValue = isBlogPost ? 'blog' : data.layout

      const contentData = {
        site_id: activeSiteId,
        title: data.title,
        slug,
        content_type: contentType,
        content: serializedContent,
        is_published: false,
        is_featured: false,
        author_id: isBlogPost && data.author_id ? data.author_id : null,
        published_at: isBlogPost && data.publish_date ? data.publish_date.toISOString() : null,
        meta_data: {
          layout: layoutValue,
          template: selectedTemplateName,
          ...(isBlogPost && {
            subtitle: data.subtitle || null,
            featured_image: data.featured_image || null
          })
        }
      }

      // Create the content in the database
      const newContent = await createContent(supabase, contentData)

      toast.success('Page created successfully!', { id: toastId })

      // Close modal and refresh content list
      handleModalClose(false)
      onContentCreated?.()

      // Handle navigation - use custom handler if provided, otherwise default behavior
      if (onNavigateAfterCreate) {
        // Custom navigation (e.g., for Full Site Editor)
        onNavigateAfterCreate({
          id: newContent.id,
          slug: newContent.slug,
          title: newContent.title
        })
      } else {
        // Default navigation to dashboard editor
        setTimeout(() => {
          router.push(`/dashboard/content/editor?id=${newContent.id}`)
        }, 100)
      }
      
    } catch (error) {
      console.error('Error creating content:', error)

      // Check if it's a duplicate key constraint error
      let errorMessage = 'Failed to create page. Please try again.'

      if (error instanceof Error) {
        // Check for duplicate slug error
        if (error.message.includes('duplicate key') || error.message.includes('content_site_id_slug_key')) {
          errorMessage = 'A page with this name already exists. Please choose a different name.'
        } else {
          errorMessage = getDisplayErrorMessage(error)
        }
      }

      toast.error(errorMessage, { id: toastId })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left pb-6 border-b">
          <DialogTitle className="text-2xl font-bold">Create New Page</DialogTitle>
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
                        <div className="relative">
                          <Input
                            placeholder="Enter a descriptive title for your page"
                            className="h-12 text-lg pr-10"
                            {...field}
                          />
                          {/* Validation status icon */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isValidatingSlug && (
                              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                            )}
                            {!isValidatingSlug && (slugValidationStatus === 'available' || slugValidationStatus === 'taken') && field.value && (
                              <Check className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                      {/* Validation feedback message */}
                      {slugValidationMessage && field.value && (
                        <p className={`text-sm mt-1 flex items-center gap-1 ${
                          slugValidationStatus === 'available' ? 'text-green-600' :
                          slugValidationStatus === 'taken' ? 'text-blue-600' :
                          slugValidationStatus === 'checking' ? 'text-gray-500' :
                          'text-yellow-600'
                        }`}>
                          {slugValidationMessage}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {/* Blog Post Metadata Fields */}
                {selectedPageType === 'blog_post' && (
                  <div className="space-y-4 mt-6 pt-6 border-t">
                    <p className="text-sm font-semibold text-gray-700">Blog Post Metadata</p>

                    {/* Subtitle */}
                    <FormField
                      control={form.control}
                      name="subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subtitle (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter a brief description or subtitle for your blog post"
                              className="min-h-[80px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">
                            Used as the blog post description/excerpt
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Featured Image URL */}
                    <FormField
                      control={form.control}
                      name="featured_image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Featured Image URL (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://example.com/image.jpg"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">
                            Enter a URL to an image that will be displayed in the blog index and post header
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Publish Date */}
                    <FormField
                      control={form.control}
                      name="publish_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Scheduled Publish Date (Optional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <p className="text-xs text-gray-500">
                            Set when this post should be published (only applies when published)
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

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
                  selectedPageType === 'about' ? 'bg-blue-50 border-blue-200' :
                  selectedPageType === 'contact' ? 'bg-purple-50 border-purple-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 text-white rounded-md ${
                      selectedPageType === 'about' ? 'bg-blue-600' :
                      selectedPageType === 'contact' ? 'bg-purple-600' :
                      'bg-green-600'
                    }`}>
                      {selectedPageType === 'about' ? (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      ) : selectedPageType === 'contact' ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <Layout className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${
                        selectedPageType === 'about' ? 'text-blue-900' :
                        selectedPageType === 'contact' ? 'text-purple-900' :
                        selectedPageType === 'blog_post' ? 'text-orange-900' :
                        'text-green-900'
                      }`}>
                        {selectedPageType === 'about' ? 'About Page' :
                         selectedPageType === 'contact' ? 'Contact Page' :
                         selectedPageType === 'blog_post' ? 'Blog Post' :
                         'Landing Page'}
                      </h3>
                      <p className={`text-sm ${
                        selectedPageType === 'about' ? 'text-blue-700' :
                        selectedPageType === 'contact' ? 'text-purple-700' :
                        selectedPageType === 'blog_post' ? 'text-orange-700' :
                        'text-green-700'
                      }`}>
                        {selectedPageType === 'about'
                          ? 'Includes: Header, Mission, Values, Features, Story, and CTA blocks'
                          : selectedPageType === 'contact'
                          ? 'Includes: Header, Business Info, Rich Text, and FAQ blocks'
                          : selectedPageType === 'blog_post'
                          ? 'Includes: Header, Featured Image, Content, Author Bio, and Related Posts'
                          : 'Includes: Hero, Featured, Categories, Features, and CTA blocks'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-4 block">Choose a Template</Label>
                  <p className="text-sm text-gray-600 mb-6">
                    Select a template for your {
                      selectedPageType === 'about' ? 'About Page' :
                      selectedPageType === 'contact' ? 'Contact Page' :
                      selectedPageType === 'blog_post' ? 'Blog Post' :
                      'Landing Page'
                    }. You can customize all content later.
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