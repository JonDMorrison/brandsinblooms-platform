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
import { Progress } from '@/src/components/ui/progress'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Globe,
  User,
  Building,
  Palette
} from 'lucide-react'
import { TemplateSelector } from './TemplateSelector'
import { 
  createSiteWithTemplate, 
  checkSubdomainAvailability,
  type SiteTemplate, 
  type SiteCreationRequest,
  type SiteCreationResult 
} from '@/src/lib/admin/sites'

// Schema for form validation
const siteCreationSchema = z.object({
  // Step 1: Template Selection
  template_slug: z.string().min(1, 'Please select a template'),
  
  // Step 2: Site Information
  site_name: z.string().min(3, 'Site name must be at least 3 characters'),
  site_subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must be less than 63 characters')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/, 
           'Subdomain can only contain letters, numbers, and hyphens'),
           
  // Step 3: Owner Information
  owner_email: z.string().email('Please enter a valid email address'),
  
  // Step 4: Business Information (optional)
  business_name: z.string().optional(),
  business_email: z.string().email().optional().or(z.literal('')),
  business_phone: z.string().optional(),
  business_address: z.string().optional(),
  primary_color: z.string().optional(),
  
  // Business hours (optional)
  business_hours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
  }).optional()
})

type SiteCreationForm = z.infer<typeof siteCreationSchema>

const steps = [
  { id: 1, title: 'Choose Template', icon: Palette, description: 'Select a design template' },
  { id: 2, title: 'Site Details', icon: Globe, description: 'Configure site name and URL' },
  { id: 3, title: 'Owner Info', icon: User, description: 'Assign site ownership' },
  { id: 4, title: 'Business Info', icon: Building, description: 'Add business details' },
]

export function SiteCreationWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<SiteTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [creationResult, setCreationResult] = useState<SiteCreationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [subdomainChecking, setSubdomainChecking] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)

  const form = useForm<SiteCreationForm>({
    resolver: zodResolver(siteCreationSchema),
    defaultValues: {
      template_slug: '',
      site_name: '',
      site_subdomain: '',
      owner_email: '',
      business_name: '',
      business_email: '',
      business_phone: '',
      business_address: '',
      primary_color: '#22c55e',
    }
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form

  const watchedSubdomain = watch('site_subdomain')

  // Check subdomain availability with debouncing
  const checkSubdomain = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null)
      return
    }

    setSubdomainChecking(true)
    try {
      const available = await checkSubdomainAvailability(subdomain)
      setSubdomainAvailable(available)
    } catch (err) {
      console.error('Error checking subdomain:', err)
      setSubdomainAvailable(null)
    } finally {
      setSubdomainChecking(false)
    }
  }

  // Debounced subdomain checking
  useState(() => {
    const timer = setTimeout(() => {
      if (watchedSubdomain) {
        checkSubdomain(watchedSubdomain)
      }
    }, 500)

    return () => clearTimeout(timer)
  })

  const handleTemplateSelect = (template: SiteTemplate) => {
    setSelectedTemplate(template)
    setValue('template_slug', template.slug)
    
    // Auto-populate some fields from template
    if (template.template_config && typeof template.template_config === 'object' && !Array.isArray(template.template_config)) {
      const config = template.template_config as Record<string, unknown>
      if (config.primary_color) {
        setValue('primary_color', config.primary_color as string)
      }
    }
  }

  const nextStep = async () => {
    const currentStepFields = getStepFields(currentStep)
    const isValid = await form.trigger(currentStepFields)
    
    if (isValid) {
      if (currentStep === 2 && subdomainAvailable === false) {
        setError('Please choose an available subdomain')
        return
      }
      
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
      setError(null)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const getStepFields = (step: number): (keyof SiteCreationForm)[] => {
    switch (step) {
      case 1: return ['template_slug']
      case 2: return ['site_name', 'site_subdomain']
      case 3: return ['owner_email']
      case 4: return []
      default: return []
    }
  }

  const onSubmit = async (data: SiteCreationForm) => {
    setIsCreating(true)
    setError(null)

    try {
      const request: SiteCreationRequest = {
        template_slug: data.template_slug,
        site_name: data.site_name,
        site_subdomain: data.site_subdomain,
        owner_email: data.owner_email,
        business_info: {
          business_name: data.business_name,
          business_email: data.business_email,
          business_phone: data.business_phone,
          business_address: data.business_address,
          primary_color: data.primary_color,
          business_hours: data.business_hours
        }
      }

      const result = await createSiteWithTemplate(request)
      setCreationResult(result)
    } catch (err) {
      console.error('Error creating site:', err)
      setError(err instanceof Error ? err.message : 'Failed to create site. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const progress = (currentStep / steps.length) * 100

  // Success screen
  if (creationResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Site Created Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{creationResult.site_name}</h3>
              <Badge variant="secondary" className="mb-4">
                {creationResult.subdomain}.brandsinblooms.com
              </Badge>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {creationResult.content_created}
                  </div>
                  <div className="text-sm text-gray-600">Pages Created</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {creationResult.products_created}
                  </div>
                  <div className="text-sm text-gray-600">Products Added</div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">What happens next?</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Site owner ({creationResult.owner_email}) has been notified
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Default content and products have been added
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Site is ready for customization
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => router.push('/admin')}
              >
                Back to Dashboard
              </Button>
              <Button 
                className="flex-1"
                onClick={() => router.push(`/admin/sites/${creationResult.site_id}/edit`)}
              >
                Configure Site
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Site</h1>
        <p className="text-gray-600">Follow the steps below to create a new site using a template</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          
          return (
            <div key={step.id} className="flex-1">
              <div className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${isCompleted 
                    ? 'bg-green-100 border-green-300 text-green-700' 
                    : isActive 
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                {step.id < steps.length && (
                  <div className={`flex-1 h-0.5 ml-4 ${
                    isCompleted ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
              <div className="mt-2">
                <div className={`text-sm font-medium ${
                  isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Template Selection */}
            {currentStep === 1 && (
              <TemplateSelector
                selectedTemplate={selectedTemplate?.slug}
                onTemplateSelect={handleTemplateSelect}
              />
            )}

            {/* Step 2: Site Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="site_name">Site Name *</Label>
                  <Input
                    id="site_name"
                    {...register('site_name')}
                    placeholder="My Garden Center"
                    className={errors.site_name ? 'border-red-500' : ''}
                  />
                  {errors.site_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.site_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="site_subdomain">Subdomain *</Label>
                  <div className="flex items-center">
                    <Input
                      id="site_subdomain"
                      {...register('site_subdomain')}
                      placeholder="my-garden-center"
                      className={`rounded-r-none ${errors.site_subdomain ? 'border-red-500' : ''}`}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                        setValue('site_subdomain', value)
                        setSubdomainAvailable(null)
                      }}
                    />
                    <div className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-md text-sm text-gray-600">
                      .brandsinblooms.com
                    </div>
                  </div>
                  
                  {/* Subdomain validation feedback */}
                  <div className="mt-1 min-h-[20px]">
                    {subdomainChecking && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking availability...
                      </div>
                    )}
                    {subdomainAvailable === true && !subdomainChecking && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Subdomain is available
                      </div>
                    )}
                    {subdomainAvailable === false && !subdomainChecking && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        Subdomain is already taken
                      </div>
                    )}
                    {errors.site_subdomain && (
                      <p className="text-red-500 text-sm">{errors.site_subdomain.message}</p>
                    )}
                  </div>
                </div>

                {selectedTemplate && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <Palette className="w-4 h-4" />
                      <span className="font-medium">Selected Template: {selectedTemplate.name}</span>
                    </div>
                    <p className="text-blue-600 text-sm">{selectedTemplate.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Owner Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="owner_email">Site Owner Email *</Label>
                  <Input
                    id="owner_email"
                    type="email"
                    {...register('owner_email')}
                    placeholder="owner@example.com"
                    className={errors.owner_email ? 'border-red-500' : ''}
                  />
                  {errors.owner_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.owner_email.message}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    This person will receive owner access to manage the site. They must already have an account.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Business Information */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    {...register('business_name')}
                    placeholder="Green Thumb Garden Center"
                  />
                </div>

                <div>
                  <Label htmlFor="business_email">Business Email</Label>
                  <Input
                    id="business_email"
                    type="email"
                    {...register('business_email')}
                    placeholder="info@example.com"
                  />
                  {errors.business_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.business_email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="business_phone">Business Phone</Label>
                  <Input
                    id="business_phone"
                    {...register('business_phone')}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="business_address">Business Address</Label>
                  <Textarea
                    id="business_address"
                    {...register('business_address')}
                    placeholder="123 Garden Way, Green City, GC 12345"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="primary_color">Primary Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      {...register('primary_color')}
                      className="w-20 h-10"
                    />
                    <Input
                      {...register('primary_color')}
                      placeholder="#22c55e"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  All business information is optional and can be updated later in the site configuration.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Site...
                </>
              ) : (
                'Create Site'
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}