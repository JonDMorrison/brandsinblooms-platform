'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
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
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCurrentSite, useSitePermissions, useSiteContext } from '@/src/hooks/useSite'
import { getAppDomain } from '@/lib/env/app-domain'
import { validateDomainFormat } from '@/src/lib/site/domain-verification'
import { DNS_PROVIDERS } from '@/src/lib/dns/types'
import {
  getProviderInstructions,
  type DNSProvider,
} from '@/src/lib/site/dns-provider-detection'

interface DomainConfigurationProps {
  onDomainUpdate?: (domain: string, type: 'subdomain' | 'custom') => void
}

interface WizardData {
  domain: string
  provider: DNSProvider
  dnsRecords: Array<{
    type: 'CNAME' | 'TXT'
    name: string
    value: string
    ttl: number
  }> | null
  verificationToken: string
}

interface VerificationStatus {
  cnameValid: boolean
  txtValid: boolean
  fullyVerified: boolean
  nextCheckAvailable: number
}

const DNS_PROVIDER_OPTIONS: Array<{ id: DNSProvider; name: string }> = [
  { id: 'cloudflare', name: 'Cloudflare' },
  { id: 'godaddy', name: 'GoDaddy' },
  { id: 'namecheap', name: 'Namecheap' },
  { id: 'google', name: 'Google Domains' },
  { id: 'route53', name: 'AWS Route 53' },
  { id: 'other', name: 'Other Provider' },
]

export function DomainConfiguration({ onDomainUpdate }: DomainConfigurationProps) {
  const { site, loading: siteLoading } = useCurrentSite()
  const { canManage } = useSitePermissions()
  const siteContext = useSiteContext()

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState<WizardData>({
    domain: '',
    provider: 'unknown' as DNSProvider,
    dnsRecords: null,
    verificationToken: '',
  })

  // Loading states
  const [isInitializing, setIsInitializing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  // Verification state
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [verificationAttempts, setVerificationAttempts] = useState(0)
  const [countdownSeconds, setCountdownSeconds] = useState(0)

  // Domain validation
  const [domainError, setDomainError] = useState<string>('')

  // Get the app domain for display
  const appDomain = typeof window !== 'undefined'
    ? window.location.host
    : getAppDomain()

  // Rate limit countdown
  useEffect(() => {
    if (countdownSeconds > 0) {
      const timer = setTimeout(() => setCountdownSeconds(countdownSeconds - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdownSeconds])

  // Auto-verify on step 4
  useEffect(() => {
    if (currentStep === 4 && wizardData.domain && !verificationStatus) {
      handleVerifyDomain()
    }
  }, [currentStep])

  const validateDomain = useCallback((domain: string) => {
    if (!domain) {
      setDomainError('Please enter a domain')
      return false
    }

    const validation = validateDomainFormat(domain)
    if (!validation.isValid) {
      setDomainError(validation.errors[0] || 'Invalid domain format')
      return false
    }

    setDomainError('')
    return true
  }, [])

  const handleDomainChange = (value: string) => {
    const cleanDomain = value.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')

    setWizardData(prev => ({ ...prev, domain: cleanDomain }))

    // Validate as user types
    if (cleanDomain) {
      validateDomain(cleanDomain)
    } else {
      setDomainError('')
    }
  }

  const handleInitializeDomain = async () => {
    if (!site?.id) return
    if (!validateDomain(wizardData.domain)) return

    setIsInitializing(true)
    try {
      const response = await fetch(`/api/sites/${site.id}/domain/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: wizardData.domain }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Failed to initialize domain')
      }

      const result = await response.json()

      // Convert dnsRecords format from the API response
      const dnsRecordsArray = result.dnsRecords ? [
        result.dnsRecords.cname,
        result.dnsRecords.txt
      ] : []

      setWizardData(prev => ({
        ...prev,
        provider: result.provider || 'unknown',
        dnsRecords: dnsRecordsArray,
        verificationToken: result.verificationToken,
      }))

      setCurrentStep(2)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initialize domain')
    } finally {
      setIsInitializing(false)
    }
  }

  const handleVerifyDomain = async () => {
    if (!site?.id) return

    setIsVerifying(true)
    setVerificationAttempts(prev => prev + 1)

    try {
      const response = await fetch(`/api/sites/${site.id}/domain/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (response.status === 429) {
        // Rate limited
        const nextCheck = result.data.nextCheckAvailable
        const secondsUntilNext = Math.ceil((nextCheck - Date.now()) / 1000)
        setCountdownSeconds(Math.max(0, secondsUntilNext))
        toast.error('Please wait before checking again')
      }

      if (result.success) {
        setVerificationStatus(result.data)

        if (result.data.fullyVerified) {
          toast.success('Domain verified successfully!')
          // Refresh site data and close wizard after a delay
          setTimeout(() => {
            siteContext.refreshSite()
            setWizardOpen(false)
            if (onDomainUpdate) {
              onDomainUpdate(wizardData.domain, 'custom')
            }
          }, 2000)
        }
      }
    } catch (error) {
      toast.error('Failed to verify domain')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisconnectDomain = async () => {
    if (!site?.id || !window.confirm('Are you sure you want to disconnect this domain?')) return

    setIsDisconnecting(true)
    try {
      const response = await fetch(`/api/sites/${site.id}/domain`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_domain: null }),
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect domain')
      }

      toast.success('Domain disconnected successfully')
      siteContext.refreshSite()
    } catch (error) {
      toast.error('Failed to disconnect domain')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const resetWizard = () => {
    setCurrentStep(1)
    setWizardData({
      domain: '',
      provider: 'unknown' as DNSProvider,
      dnsRecords: null,
      verificationToken: '',
    })
    setVerificationStatus(null)
    setVerificationAttempts(0)
    setCountdownSeconds(0)
    setDomainError('')
  }

  const openWizard = () => {
    resetWizard()
    setWizardOpen(true)
  }

  if (siteLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!site) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please select a site to configure domain settings.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Configuration
          </CardTitle>
          <CardDescription>
            Manage your site's domain settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Subdomain - Read Only */}
          <div>
            <h3 className="text-sm font-medium mb-3">Default Subdomain</h3>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm">
                    {site.subdomain}.{appDomain}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your free subdomain on our platform
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <Check className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(`https://${site.subdomain}.${appDomain}`, '_blank')}
                    aria-label="Open subdomain in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Custom Domain Section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Custom Domain</h3>
            {site.custom_domain ? (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm">{site.custom_domain}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                      <Badge variant="outline">
                        <Shield className="h-3 w-3 mr-1" />
                        SSL Active
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openWizard}
                      disabled={!canManage}
                    >
                      Change
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnectDomain}
                      disabled={!canManage || isDisconnecting}
                    >
                      {isDisconnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Disconnect'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed rounded-lg text-center">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your own domain to make your site more professional
                </p>
                <Button
                  onClick={openWizard}
                  disabled={!canManage}
                  className="btn-gradient-primary"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Use a Custom Domain
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Domain Configuration Wizard */}
      <Dialog open={wizardOpen} onOpenChange={(open) => !open && resetWizard()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Custom Domain Setup</DialogTitle>
            <DialogDescription>
              Connect your own domain in just a few steps
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex items-center ${step < 4 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep >= step
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-colors ${
                        currentStep > step ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Enter Domain</span>
              <span>Choose Provider</span>
              <span>Add DNS Records</span>
              <span>Verify</span>
            </div>
          </div>

          {/* Step 1: Domain Entry */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="domain" className="text-sm font-medium">
                  Enter your domain
                </label>
                <Input
                  id="domain"
                  type="text"
                  placeholder="yourdomain.com"
                  value={wizardData.domain}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  className={`mt-2 ${domainError ? 'border-red-500' : ''}`}
                />
                {domainError && (
                  <p className="text-sm text-red-500 mt-1">{domainError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Enter your domain without http:// or www
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setWizardOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInitializeDomain}
                  disabled={!wizardData.domain || !!domainError || isInitializing}
                >
                  {isInitializing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Provider Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-3">
                  Select your DNS provider
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {DNS_PROVIDER_OPTIONS.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        setWizardData(prev => ({ ...prev, provider: provider.id }))
                        setCurrentStep(3)
                      }}
                      className={`p-4 text-left rounded-lg border-2 transition-colors hover:border-primary ${
                        wizardData.provider === provider.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted'
                      }`}
                    >
                      <p className="font-medium text-sm">{provider.name}</p>
                      {wizardData.provider === provider.id && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Auto-detected
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: DNS Instructions */}
          {currentStep === 3 && wizardData.dnsRecords && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-3">
                  Add these DNS records to your domain
                </p>

                {/* Provider-specific instructions */}
                {wizardData.provider && (
                  <Alert className="mb-4">
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">
                          {getProviderInstructions(wizardData.provider).title}
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                          {getProviderInstructions(wizardData.provider).steps.slice(0, 3).map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* DNS Records */}
                <div className="space-y-3">
                  {wizardData.dnsRecords.map((record, idx) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{record.type} Record</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(record.value, `${record.type} value`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Name/Host</p>
                          <p className="font-mono mt-1">{record.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">TTL</p>
                          <p className="font-mono mt-1">{record.ttl || 'Auto'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Value/Points To</p>
                        <p className="font-mono text-xs mt-1 break-all bg-muted p-2 rounded">
                          {record.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(4)}
                  className="btn-gradient-primary"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  I've Added the Records
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Verification */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {verificationStatus?.fullyVerified ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Domain Verified Successfully!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your custom domain is now connected
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium mb-4">
                      Verifying your domain configuration
                    </p>

                    {/* Verification Progress */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {verificationStatus?.cnameValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : isVerifying ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">CNAME Record</p>
                          <p className="text-xs text-muted-foreground">
                            {verificationStatus?.cnameValid
                              ? 'Verified'
                              : 'Checking DNS configuration...'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {verificationStatus?.txtValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : isVerifying ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">TXT Verification</p>
                          <p className="text-xs text-muted-foreground">
                            {verificationStatus?.txtValid
                              ? 'Verified'
                              : 'Verifying domain ownership...'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status Message */}
                    {verificationAttempts > 0 && !verificationStatus?.fullyVerified && (
                      <Alert className="mt-4">
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          DNS changes can take up to 48 hours to propagate.
                          {verificationAttempts > 2 && ' If verification continues to fail, please double-check your DNS records.'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex justify-between gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setWizardOpen(false)}
                    >
                      Skip for Now
                    </Button>
                    <Button
                      onClick={handleVerifyDomain}
                      disabled={isVerifying || countdownSeconds > 0}
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : countdownSeconds > 0 ? (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          Wait {countdownSeconds}s
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Check Again
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}