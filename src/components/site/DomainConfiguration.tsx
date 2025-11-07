'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/src/components/ui/tabs'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
import { Progress } from '@/src/components/ui/progress'
import { Separator } from '@/src/components/ui/separator'
import {
  Globe,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  Shield,
  Clock,
  Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCurrentSite, useSitePermissions } from '@/src/hooks/useSite'
import { useUpdateSiteSettings } from '@/src/hooks/useSiteSettings'
import {
  validateDomainFormat,
  validateSubdomainFormat,
  checkSubdomainAvailability,
  verifyDomainConfiguration,
  getDomainHealth,
  testDomainConnectivity,
  generateRequiredDNSRecords,
  type DomainVerificationResult,
  type DNSRecord,
} from '@/src/lib/site/domain-verification'

const domainSchema = z.object({
  customDomain: z.string().optional(),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters'),
})

type DomainFormData = z.infer<typeof domainSchema>

interface DomainConfigurationProps {
  onDomainUpdate?: (domain: string, type: 'subdomain' | 'custom') => void
}

export function DomainConfiguration({ onDomainUpdate }: DomainConfigurationProps) {
  const { site, loading: siteLoading } = useCurrentSite()
  const { canManage } = useSitePermissions()
  const updateSiteSettings = useUpdateSiteSettings()

  // Form state
  const [activeTab, setActiveTab] = useState('subdomain')

  // Get the app domain for display
  const appDomain = typeof window !== 'undefined'
    ? window.location.host
    : process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3001'
  
  // Verification state
  const [verificationResult, setVerificationResult] = useState<DomainVerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [domainHealth, setDomainHealth] = useState<any>(null)
  const [connectivityResult, setConnectivityResult] = useState<any>(null)
  
  // Subdomain availability
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

  const form = useForm<DomainFormData>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      customDomain: site?.custom_domain || '',
      subdomain: site?.subdomain || '',
    },
  })

  // Update form when site data loads
  useEffect(() => {
    if (site) {
      form.setValue('customDomain', site.custom_domain || '')
      form.setValue('subdomain', site.subdomain || '')
    }
  }, [site, form])

  // Check subdomain availability when it changes
  useEffect(() => {
    const subdomain = form.watch('subdomain')
    if (subdomain && subdomain !== site?.subdomain) {
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
    }
  }, [form.watch('subdomain'), site?.subdomain])

  const handleVerifyDomain = async (domain: string) => {
    setIsVerifying(true)
    try {
      const result = await verifyDomainConfiguration(domain)
      setVerificationResult(result)
      
      if (result.success && result.status.isConfigured) {
        toast.success('Domain verification successful!')
      } else if (result.success) {
        toast.warning('Domain verification in progress. Please check the DNS configuration.')
      } else {
        toast.error('Domain verification failed. Please check your DNS settings.')
      }
    } catch (error) {
      toast.error('Failed to verify domain')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCheckDomainHealth = async (domain: string) => {
    try {
      const [health, connectivity] = await Promise.all([
        getDomainHealth(domain),
        testDomainConnectivity(domain)
      ])
      setDomainHealth(health)
      setConnectivityResult(connectivity)
    } catch (error) {
      toast.error('Failed to check domain health')
    }
  }

  const handleCopyDNSRecord = (record: DNSRecord) => {
    navigator.clipboard.writeText(record.value)
    toast.success('DNS record value copied to clipboard')
  }

  const onSubmit = async (data: DomainFormData) => {
    if (!canManage) {
      toast.error('You do not have permission to modify domain settings')
      return
    }

    // Validate domains
    if (data.customDomain) {
      const validation = validateDomainFormat(data.customDomain)
      if (!validation.isValid) {
        toast.error(`Custom domain error: ${validation.errors.join(', ')}`)
        return
      }
    }

    if (data.subdomain) {
      const validation = validateSubdomainFormat(data.subdomain)
      if (!validation.isValid) {
        toast.error(`Subdomain error: ${validation.errors.join(', ')}`)
        return
      }
    }

    // Update site settings using the hook
    updateSiteSettings.mutate({
      // Preserve current site information
      name: site?.name || 'My Site',
      description: site?.description ?? undefined,
      timezone: site?.timezone ?? undefined,
      business_name: site?.business_name ?? undefined,
      business_email: site?.business_email ?? undefined,
      business_phone: site?.business_phone ?? undefined,
      business_address: site?.business_address ?? undefined,
      // Update domain information
      subdomain: data.subdomain,
      custom_domain: data.customDomain,
    })

    // Notify parent component
    if (data.customDomain && onDomainUpdate) {
      onDomainUpdate(data.customDomain, 'custom')
    } else if (data.subdomain && onDomainUpdate) {
      onDomainUpdate(data.subdomain, 'subdomain')
    }
  }

  if (siteLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!site) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Site Selected</AlertTitle>
        <AlertDescription>
          Please select a site to configure domain settings.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Configuration
          </CardTitle>
          <CardDescription>
            Configure your custom domain and subdomain settings. Changes take effect immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="subdomain">Subdomain</TabsTrigger>
                  <TabsTrigger value="custom">Custom Domain</TabsTrigger>
                </TabsList>

                <TabsContent value="subdomain" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subdomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomain</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input 
                              placeholder="my-site" 
                              {...field} 
                              disabled={!canManage}
                            />
                            <span className="ml-2 text-sm text-gray-500">
                              .{appDomain}
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Your free subdomain on our platform.
                        </FormDescription>
                        <FormMessage />
                        
                        {/* Subdomain availability check */}
                        {subdomainCheck.checking && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
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
                                <p className="text-gray-500 mb-1">Suggestions:</p>
                                <div className="flex flex-wrap gap-1">
                                  {subdomainCheck.suggestions.map((suggestion, index) => (
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

                  {/* Current subdomain status */}
                  {site.subdomain && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Current Subdomain</p>
                          <p className="text-sm text-gray-500">
                            https://{site.subdomain}.{appDomain}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://${site.subdomain}.${appDomain}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customDomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Domain</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input 
                              placeholder="yourdomain.com" 
                              {...field} 
                              disabled={!canManage}
                            />
                            {field.value && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => field.value && handleVerifyDomain(field.value)}
                                disabled={isVerifying}
                              >
                                {isVerifying ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Verify'
                                )}
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Your custom domain (without www or https://).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Domain verification results */}
                  {verificationResult && (
                    <div className="space-y-4">
                      <Separator />
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Domain Status</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckDomainHealth(verificationResult.status.domain)}
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            Check Health
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            {verificationResult.status.dnsConfigured ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">DNS Configured</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {verificationResult.status.sslEnabled ? (
                              <Shield className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="text-sm">SSL Certificate</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {verificationResult.status.isConfigured ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="text-sm">Domain Ready</span>
                          </div>
                        </div>

                        {/* DNS Configuration Table */}
                        {verificationResult.requiredRecords.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Required DNS Records</h4>
                            <div className="border rounded-lg">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>TTL</TableHead>
                                    <TableHead></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {verificationResult.requiredRecords.map((record, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-mono text-sm">{record.type}</TableCell>
                                      <TableCell className="font-mono text-sm">{record.name}</TableCell>
                                      <TableCell className="font-mono text-sm max-w-xs truncate">
                                        {record.value}
                                      </TableCell>
                                      <TableCell className="text-sm">{record.ttl || 'Auto'}</TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleCopyDNSRecord(record)}
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}

                        {/* Next Steps */}
                        {verificationResult.nextSteps.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Next Steps</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-500">
                              {verificationResult.nextSteps.map((step, index) => (
                                <li key={index}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Domain Health */}
                        {domainHealth && (
                          <div>
                            <h4 className="font-medium mb-2">Domain Health</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">Status:</span>
                                  <Badge 
                                    variant={
                                      domainHealth.status === 'healthy' ? 'default' :
                                      domainHealth.status === 'warning' ? 'secondary' : 'destructive'
                                    }
                                  >
                                    {domainHealth.status}
                                  </Badge>
                                </div>
                                <div className="text-sm">
                                  <span>Uptime: </span>
                                  <span className="font-mono">{domainHealth.uptime.toFixed(2)}%</span>
                                </div>
                                <div className="text-sm">
                                  <span>Response Time: </span>
                                  <span className="font-mono">{domainHealth.responseTime}ms</span>
                                </div>
                              </div>
                              
                              {domainHealth.issues.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Issues:</p>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-500">
                                    {domainHealth.issues.map((issue: string, index: number) => (
                                      <li key={index}>{issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Errors */}
                        {verificationResult.status.errors.length > 0 && (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Configuration Issues</AlertTitle>
                            <AlertDescription>
                              <ul className="list-disc list-inside space-y-1">
                                {verificationResult.status.errors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateSiteSettings.loading || !canManage}
                >
                  {updateSiteSettings.loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}