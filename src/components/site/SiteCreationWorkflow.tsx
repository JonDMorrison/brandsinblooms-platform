'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Separator } from '@/src/components/ui/separator'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import {
  Plus,
  Globe,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { validateSubdomainFormat, checkSubdomainAvailability } from '@/src/lib/site/domain-verification'

const siteCreationSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(100, 'Site name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters'),
  category: z.string().min(1, 'Please select a category'),
  template: z.string().optional(),
})

type SiteCreationData = z.infer<typeof siteCreationSchema>

interface SiteCreationWorkflowProps {
  triggerButton?: React.ReactNode
  onSiteCreated?: (siteId: string) => void
}

const siteCategories = [
  { value: 'business', label: 'Business & Services' },
  { value: 'portfolio', label: 'Portfolio & Creative' },
  { value: 'blog', label: 'Blog & Content' },
  { value: 'ecommerce', label: 'E-commerce & Shop' },
  { value: 'restaurant', label: 'Restaurant & Food' },
  { value: 'fitness', label: 'Fitness & Health' },
  { value: 'education', label: 'Education & Training' },
  { value: 'nonprofit', label: 'Non-Profit & Community' },
  { value: 'event', label: 'Event & Wedding' },
  { value: 'personal', label: 'Personal & Lifestyle' },
]

const siteTemplates = [
  { 
    id: 'minimal-business', 
    name: 'Minimal Business', 
    category: 'business',
    description: 'Clean and professional design for businesses' 
  },
  { 
    id: 'creative-portfolio', 
    name: 'Creative Portfolio', 
    category: 'portfolio',
    description: 'Showcase your creative work with style' 
  },
  { 
    id: 'modern-blog', 
    name: 'Modern Blog', 
    category: 'blog',
    description: 'Perfect for content creators and bloggers' 
  },
  { 
    id: 'online-store', 
    name: 'Online Store', 
    category: 'ecommerce',
    description: 'Complete e-commerce solution' 
  },
  { 
    id: 'restaurant-menu', 
    name: 'Restaurant & Menu', 
    category: 'restaurant',
    description: 'Beautiful restaurant website with menu' 
  },
]

export function SiteCreationWorkflow({ triggerButton, onSiteCreated }: SiteCreationWorkflowProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  
  // Subdomain availability state
  const [subdomainCheck, setSubdomainCheck] = useState<{
    checking: boolean
    available: boolean | null
    errors: string[]
    suggestions: string[]
  }>({
    checking: false,
    available: null,
    errors: [],
    suggestions: []
  })

  const form = useForm<SiteCreationData>({
    resolver: zodResolver(siteCreationSchema),
    defaultValues: {
      name: '',
      description: '',
      subdomain: '',
      category: '',
      template: '',
    },
  })

  // Check subdomain availability when it changes
  React.useEffect(() => {
    const subdomain = form.watch('subdomain')
    if (subdomain && subdomain.length >= 3) {
      const timer = setTimeout(async () => {
        setSubdomainCheck(prev => ({ ...prev, checking: true }))
        try {
          const result = await checkSubdomainAvailability(subdomain)
          setSubdomainCheck({
            checking: false,
            available: result.available,
            errors: result.errors,
            suggestions: result.suggestions || []
          })
        } catch (error) {
          setSubdomainCheck({
            checking: false,
            available: false,
            errors: ['Failed to check availability'],
            suggestions: []
          })
        }
      }, 500)
      
      return () => clearTimeout(timer)
    } else {
      setSubdomainCheck({
        checking: false,
        available: null,
        errors: [],
        suggestions: []
      })
    }
  }, [form.watch('subdomain')])

  const onSubmit = async (data: SiteCreationData) => {
    setIsCreating(true)
    try {
      // Validate subdomain availability one more time
      const subdomainResult = await checkSubdomainAvailability(data.subdomain)
      if (!subdomainResult.available) {
        toast.error('Subdomain is not available. Please choose a different one.')
        return
      }

      // Simulate site creation API call
      console.log('Creating site:', data)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockSiteId = `site_${Date.now()}`
      
      toast.success('Site created successfully!')
      
      // Close dialog and redirect
      setOpen(false)
      setCurrentStep(1)
      form.reset()
      
      if (onSiteCreated) {
        onSiteCreated(mockSiteId)
      } else {
        router.push('/dashboard')
      }
      
    } catch (error) {
      console.error('Site creation error:', error)
      toast.error('Failed to create site. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate basic info before proceeding
      const basicFields = ['name', 'subdomain', 'category'] as const
      const isValid = basicFields.every(field => {
        const value = form.getValues(field)
        return value && value.trim().length > 0
      })
      
      if (!isValid) {
        toast.error('Please fill in all required fields')
        return
      }
      
      if (subdomainCheck.available !== true) {
        toast.error('Please choose an available subdomain')
        return
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const getFilteredTemplates = () => {
    const selectedCategory = form.watch('category')
    if (!selectedCategory) return siteTemplates
    return siteTemplates.filter(template => template.category === selectedCategory)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Basic Information</h3>
              <p className="text-sm text-muted-foreground">
                Let&apos;s start with the basics about your new site.
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Site" {...field} />
                  </FormControl>
                  <FormDescription>
                    This will be displayed as your site&apos;s title.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your site..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of what your site is about.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subdomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subdomain *</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Input placeholder="my-site" {...field} />
                      <span className="ml-2 text-sm text-muted-foreground">
                        .blooms.cc
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Your site will be available at this URL.
                  </FormDescription>
                  <FormMessage />
                  
                  {/* Subdomain availability check */}
                  {subdomainCheck.checking && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Checking availability...
                    </div>
                  )}
                  
                  {subdomainCheck.available === true && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Check className="h-4 w-4" />
                      Subdomain is available
                    </div>
                  )}
                  
                  {subdomainCheck.available === false && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <X className="h-4 w-4" />
                        {subdomainCheck.errors.join(', ')}
                      </div>
                      {subdomainCheck.suggestions.length > 0 && (
                        <div className="text-sm">
                          <p className="text-muted-foreground mb-1">Suggestions:</p>
                          <div className="flex flex-wrap gap-1">
                            {subdomainCheck.suggestions.slice(0, 3).map((suggestion, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                onClick={() => form.setValue('subdomain', suggestion)}
                              >
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="What type of site are you creating?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {siteCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This helps us recommend the best templates for you.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Choose a Template</h3>
              <p className="text-sm text-muted-foreground">
                Select a starting template for your site. You can customize it later.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFilteredTemplates().map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    form.watch('template') === template.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : ''
                  }`}
                  onClick={() => form.setValue('template', template.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {form.watch('template') === template.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-md flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {getFilteredTemplates().length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No templates available for the selected category. Please go back and choose a different category.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Review & Create</h3>
              <p className="text-sm text-muted-foreground">
                Review your site configuration before creating.
              </p>
            </div>
            
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Site Name</p>
                    <p className="text-sm text-muted-foreground">{form.getValues('name')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p className="text-sm text-muted-foreground">
                      {siteCategories.find(c => c.value === form.getValues('category'))?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">URL</p>
                    <p className="text-sm text-muted-foreground">
                      https://{form.getValues('subdomain')}.blooms.cc
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Template</p>
                    <p className="text-sm text-muted-foreground">
                      {form.getValues('template') 
                        ? siteTemplates.find(t => t.id === form.getValues('template'))?.name
                        : 'None selected'
                      }
                    </p>
                  </div>
                </div>
                
                {form.getValues('description') && (
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">{form.getValues('description')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Site
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Create New Site
          </DialogTitle>
          <DialogDescription>
            Step {currentStep} of 3 - Let&apos;s get your new site set up!
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-12 h-1 ml-2 ${
                    step < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderStep()}

            <Separator />

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>

              <div className="flex items-center gap-2">
                {currentStep < 3 ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating Site...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create Site
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default SiteCreationWorkflow