'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  Sparkles
} from 'lucide-react'

const createContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  layout: z.enum(['landing', 'blog', 'portfolio', 'about', 'product', 'contact'])
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

const layoutOptions: LayoutOption[] = [
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Perfect for homepage or promotional pages',
    icon: <Layout className="h-6 w-6" />,
    preview: 'Hero section, features grid, call-to-action',
    features: ['Hero Section', 'Feature Cards', 'CTA Buttons', 'Social Proof'],
    recommended: true
  },
  {
    id: 'blog',
    name: 'Blog Article',
    description: 'Great for articles, news, and content marketing',
    icon: <FileText className="h-6 w-6" />,
    preview: 'Article header, content sections, sidebar',
    features: ['Article Header', 'Rich Content', 'Author Bio', 'Related Posts'],
    recommended: false
  },
  {
    id: 'portfolio',
    name: 'Portfolio Grid',
    description: 'Showcase your work and projects beautifully',
    icon: <Grid3X3 className="h-6 w-6" />,
    preview: 'Image gallery, project details, categories',
    features: ['Image Gallery', 'Project Details', 'Filter Categories', 'Lightbox'],
    recommended: false
  },
  {
    id: 'about',
    name: 'About/Company',
    description: 'Tell your story and introduce your team',
    icon: <User className="h-6 w-6" />,
    preview: 'Company story, team members, timeline',
    features: ['Company Story', 'Team Profiles', 'Timeline', 'Values Section'],
    recommended: false
  },
  {
    id: 'product',
    name: 'Product Page',
    description: 'Detailed product or service showcase',
    icon: <Package className="h-6 w-6" />,
    preview: 'Product gallery, specifications, pricing',
    features: ['Product Gallery', 'Specifications', 'Pricing Table', 'Reviews'],
    recommended: false
  },
  {
    id: 'contact',
    name: 'Contact/Services',
    description: 'Contact information and service offerings',
    icon: <Phone className="h-6 w-6" />,
    preview: 'Contact form, location map, service list',
    features: ['Contact Form', 'Location Map', 'Service List', 'Business Hours'],
    recommended: false
  }
]

export default function CreateContentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedLayout, setSelectedLayout] = useState<CreateContentForm['layout'] | null>(null)

  const form = useForm<CreateContentForm>({
    resolver: zodResolver(createContentSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      layout: 'landing'
    }
  })

  const onSubmit = (data: CreateContentForm) => {
    // Navigate to page editor with form data
    // In Next.js, we'll use sessionStorage to pass data
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('newPageData', JSON.stringify({
        pageData: data,
        isNew: true
      }))
    }
    router.push('/dashboard/content/editor')
  }

  const handleLayoutSelect = (layoutId: CreateContentForm['layout']) => {
    setSelectedLayout(layoutId)
    form.setValue('layout', layoutId)
  }

  const nextStep = () => {
    if (step === 1) {
      form.trigger(['title']).then((isValid) => {
        if (isValid) {
          setStep(2)
        }
      })
    } else if (step === 2 && selectedLayout) {
      setStep(3)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const getSelectedLayoutInfo = () => {
    return layoutOptions.find(layout => layout.id === selectedLayout)
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
          <p className="text-muted-foreground mt-1">
            Step {step} of 3: {step === 1 ? 'Page Details' : step === 2 ? 'Choose Layout' : 'Review & Create'}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step >= stepNumber 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }
            `}>
              {step > stepNumber ? <Check className="h-4 w-4" /> : stepNumber}
            </div>
            {stepNumber < 3 && (
              <div className={`
                w-12 h-1 mx-2
                ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
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

                <div className="flex justify-end">
                  <Button type="button" onClick={nextStep}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Layout Selection */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Choose Layout
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {layoutOptions.map((layout) => (
                    <div
                      key={layout.id}
                      className={`
                        relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
                        ${selectedLayout === layout.id 
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950' 
                          : 'border-gray-200 dark:border-gray-700'
                        }
                      `}
                      onClick={() => handleLayoutSelect(layout.id)}
                    >
                      {layout.recommended && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500 text-yellow-900">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                      
                      <div className="flex items-start gap-3">
                        <div className={`
                          p-2 rounded-md 
                          ${selectedLayout === layout.id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }
                        `}>
                          {layout.icon}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{layout.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {layout.description}
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            {layout.preview}
                          </p>
                          
                          <div className="flex flex-wrap gap-1">
                            {layout.features.map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {selectedLayout === layout.id && (
                          <div className="absolute top-2 left-2">
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    disabled={!selectedLayout}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review & Create */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Review & Create
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                    <p className="text-lg font-semibold">{form.getValues('title')}</p>
                  </div>
                  
                  {form.getValues('subtitle') && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Subtitle</Label>
                      <p className="text-sm">{form.getValues('subtitle')}</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Layout</Label>
                    {getSelectedLayoutInfo() && (
                      <div className="flex items-center gap-3 mt-2 p-3 border rounded-lg">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
                          {getSelectedLayoutInfo()!.icon}
                        </div>
                        <div>
                          <p className="font-medium">{getSelectedLayoutInfo()!.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getSelectedLayoutInfo()!.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit">
                    Create Page
                    <ArrowRight className="h-4 w-4 ml-2" />
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