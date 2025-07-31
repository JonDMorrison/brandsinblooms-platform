'use client'

import { useState } from 'react'
import { useAdminAuth } from '@/src/contexts/AdminAuthContext'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Alert, AlertDescription } from '@/src/components/ui/alert'

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
  const { signIn, error: contextError, clearError } = useAdminAuth()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

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
      // Success - the AdminGuard will handle the redirect/state change
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
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Admin Login</CardTitle>
        <CardDescription>
          Sign in with your admin credentials to access the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <Alert variant="destructive">
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="admin@example.com"
              disabled={isLoading}
              aria-invalid={!!errors.email}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder="Enter your password"
              disabled={isLoading}
              aria-invalid={!!errors.password}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact your system administrator.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}