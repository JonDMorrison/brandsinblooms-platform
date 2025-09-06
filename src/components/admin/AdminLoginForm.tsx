'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/src/contexts/AdminAuthContext'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Loader2, Shield, Eye, EyeOff, CheckCircle } from 'lucide-react'

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export function AdminLoginForm() {
  const router = useRouter()
  const { isAdmin, signIn, error: contextError, clearError } = useAdminAuth()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isFormAnimated, setIsFormAnimated] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Trigger form animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsFormAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Success animation
  useEffect(() => {
    if (isAdmin) {
      setIsSuccess(true)
    }
  }, [isAdmin])

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAdmin) {
      router.push('/admin')
    }
  }, [isAdmin, router])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev
        return rest
      })
    }
    
    // Clear context error when user modifies form
    if (contextError) {
      clearError()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      await signIn(formData.email, formData.password)
      // Brief success state before redirect
      setIsSuccess(true)
      setTimeout(() => {
        // AdminGuard will handle the redirect
      }, 1000)
    } catch (err) {
      console.error('Admin login error:', err)
      
      // Set appropriate error message
      if (err instanceof Error) {
        const message = err.message.toLowerCase()
        if (message.includes('invalid credentials') || message.includes('email not confirmed')) {
          setErrors({ general: 'Invalid email or password. Please check your credentials.' })
        } else {
          setErrors({ general: err.message })
        }
      } else {
        setErrors({ general: 'Login failed. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const displayError = errors.general || contextError

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className={`text-center space-y-4 transition-all duration-700 ${isFormAnimated ? 'fade-in-up opacity-100' : 'opacity-0 translate-y-4'}`}>
        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow hover-scale-sm interactive group">
          <Shield className="w-8 h-8 text-white group-hover:shield-focus transition-transform duration-300" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-brand-heading text-gray-900 hover:animated-gradient-text transition-all duration-500">Platform Admin</h1>
          <p className="text-gray-500 font-brand-body">
            Secure access to your Brands in Blooms platform
          </p>
        </div>
      </div>

      {/* Login Card */}
      <Card className={`gradient-card shadow-lg border-0 transition-all duration-700 delay-200 glassmorphism admin-login-card ${isFormAnimated ? 'fade-in-up opacity-100' : 'opacity-0 translate-y-8'}`}>
        <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {displayError && (
            <Alert variant="destructive" className="animate-delay-1 fade-in border-l-4 border-l-destructive">
              <AlertDescription className="font-medium">{displayError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900 flex items-center gap-2">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="admin@brandsInblooms.com"
                  disabled={isLoading}
                  aria-invalid={!!errors.email}
                  autoComplete="email"
                  className={`h-12 pl-4 pr-4 text-base transition-all duration-200 bg-white/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/60 admin-input-glow enhanced-focus-ring interactive-hover ${errors.email ? 'border-destructive focus:border-destructive focus:ring-destructive/20 error-shake' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive font-medium animate-delay-1 fade-in flex items-center gap-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900 flex items-center gap-2">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  placeholder="Enter your secure password"
                  disabled={isLoading}
                  aria-invalid={!!errors.password}
                  autoComplete="current-password"
                  className={`h-12 pl-4 pr-12 text-base transition-all duration-200 bg-white/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/60 admin-input-glow enhanced-focus-ring interactive-hover ${errors.password ? 'border-destructive focus:border-destructive focus:ring-destructive/20 error-shake' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-all duration-200 p-1 rounded-sm hover:bg-gradient-primary-50/50 hover:scale-110 interactive-hover"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive font-medium animate-delay-1 fade-in flex items-center gap-1">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className={`w-full h-12 text-base font-medium shadow-glow transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 admin-login-button enhanced-focus-ring ${isSuccess ? 'bg-success hover:bg-success success-bounce' : 'bg-gradient-primary hover:opacity-90'}`} 
            disabled={isLoading || isSuccess}
          >
            {isSuccess ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Welcome back!</span>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing you in...</span>
              </div>
            ) : (
              'Access Platform'
            )}
          </Button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="h-px bg-border flex-1"></div>
            <span className="px-2 bg-card">Secure Access</span>
            <div className="h-px bg-border flex-1"></div>
          </div>
          <p className="text-sm text-gray-500">
            Need assistance? Contact your system administrator.
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}