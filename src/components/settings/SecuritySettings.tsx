import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form'
import { Badge } from '@/src/components/ui/badge'
import { Switch } from '@/src/components/ui/switch'
import { Label } from '@/src/components/ui/label'
import { Separator } from '@/src/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/src/components/ui/dialog'
import { toast } from 'sonner'
import { Shield, Key, Eye, EyeOff, Smartphone, Clock, MapPin, Monitor, QrCode } from 'lucide-react'
import {
  useChangePassword,
  useEnroll2FA,
  useVerify2FA,
  useUnenroll2FA,
  useMFAFactors,
  useRevokeSession,
  useRevokeAllSessions,
  useUpdateSecurityNotifications,
  useSecurityNotificationPreferences
} from '@/src/hooks/useSecurity'
import Image from 'next/image'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type PasswordFormData = z.infer<typeof passwordSchema>

interface Session {
  id: string
  device: string
  location: string
  ip: string
  lastActive: string
  current: boolean
}

export function SecuritySettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [show2FADialog, setShow2FADialog] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')
  const [factorId, setFactorId] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState('')
  
  // Hooks
  const changePassword = useChangePassword()
  const enroll2FA = useEnroll2FA()
  const verify2FA = useVerify2FA()
  const unenroll2FA = useUnenroll2FA()
  const { data: mfaFactors = [], isLoading: loadingFactors } = useMFAFactors()
  const revokeSession = useRevokeSession()
  const revokeAllSessions = useRevokeAllSessions()
  const updateSecurityNotifications = useUpdateSecurityNotifications()
  const { data: securityPrefs, isLoading: loadingPrefs } = useSecurityNotificationPreferences()
  
  const twoFactorEnabled = mfaFactors.some(factor => factor.status === 'verified')
  const isLoading = changePassword.isPending

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const mockSessions: Session[] = [
    {
      id: '1',
      device: 'MacBook Pro - Chrome',
      location: 'New York, NY',
      ip: '192.168.1.100',
      lastActive: '2 minutes ago',
      current: true,
    },
    {
      id: '2',
      device: 'iPhone 15 Pro - Safari',
      location: 'New York, NY',
      ip: '192.168.1.101',
      lastActive: '1 hour ago',
      current: false,
    },
    {
      id: '3',
      device: 'Windows PC - Edge',
      location: 'San Francisco, CA',
      ip: '203.0.113.42',
      lastActive: '3 days ago',
      current: false,
    },
  ]

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })
      form.reset()
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Password change error:', error)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession.mutateAsync(sessionId)
    } catch (error) {
      console.error('Session revoke error:', error)
    }
  }

  const handleRevokeAllSessions = async () => {
    try {
      await revokeAllSessions.mutateAsync()
    } catch (error) {
      console.error('Revoke all sessions error:', error)
    }
  }

  const handle2FAToggle = async (checked: boolean) => {
    if (checked) {
      // Enroll in 2FA
      try {
        const enrollmentData = await enroll2FA.mutateAsync()
        setQrCode(enrollmentData.totp.qr_code)
        setFactorId(enrollmentData.id)
        setShow2FADialog(true)
      } catch (error) {
        console.error('2FA enrollment error:', error)
      }
    } else {
      // Disable 2FA
      const verifiedFactor = mfaFactors.find(f => f.status === 'verified')
      if (verifiedFactor) {
        try {
          await unenroll2FA.mutateAsync(verifiedFactor.id)
        } catch (error) {
          console.error('2FA unenrollment error:', error)
        }
      }
    }
  }

  const handleVerify2FA = async () => {
    if (!factorId || !verificationCode) return
    
    try {
      await verify2FA.mutateAsync({
        factorId,
        code: verificationCode
      })
      setShow2FADialog(false)
      setVerificationCode('')
    } catch (error) {
      console.error('2FA verification error:', error)
    }
  }

  const handleSecurityNotificationChange = async (type: 'email' | 'login', checked: boolean) => {
    const currentPrefs = securityPrefs || { emailNotifications: true, loginAlerts: true }
    
    try {
      await updateSecurityNotifications.mutateAsync({
        emailNotifications: type === 'email' ? checked : currentPrefs.emailNotifications,
        loginAlerts: type === 'login' ? checked : currentPrefs.loginAlerts
      })
    } catch (error) {
      console.error('Security notification update error:', error)
    }
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++

    if (strength <= 2) return { label: 'Weak', color: 'destructive' }
    if (strength <= 3) return { label: 'Medium', color: 'default' }
    if (strength <= 4) return { label: 'Strong', color: 'default' }
    return { label: 'Very Strong', color: 'default' }
  }

  const passwordStrength = getPasswordStrength(form.watch('newPassword') || '')

  return (
    <>
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? 'text' : 'password'}
                          placeholder="Enter your current password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Enter your new password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    {field.value && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="text-sm">Password strength:</div>
                        <Badge variant={passwordStrength.color as "default" | "secondary" | "destructive" | "outline"}>
                          {passwordStrength.label}
                        </Badge>
                      </div>
                    )}
                    <FormDescription>
                      Password must be at least 8 characters with uppercase, lowercase, and numbers.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your new password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Use an authenticator app to generate verification codes
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handle2FAToggle}
              disabled={loadingFactors || enroll2FA.isPending || unenroll2FA.isPending}
            />
          </div>

          {twoFactorEnabled && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Two-Factor Authentication is Enabled</p>
              <p className="text-sm text-muted-foreground">
                Your account is protected with two-factor authentication.
              </p>
              <div className="mt-4">
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handle2FAToggle(false)}
                  disabled={unenroll2FA.isPending}
                >
                  {unenroll2FA.isPending ? 'Disabling...' : 'Disable 2FA'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Notifications
          </CardTitle>
          <CardDescription>
            Configure security-related notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email alerts for security events
              </p>
            </div>
            <Switch
              checked={securityPrefs?.emailNotifications ?? true}
              onCheckedChange={(checked) => handleSecurityNotificationChange('email', checked)}
              disabled={loadingPrefs || updateSecurityNotifications.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Login Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your account is accessed from a new device
              </p>
            </div>
            <Switch
              checked={securityPrefs?.loginAlerts ?? true}
              onCheckedChange={(checked) => handleSecurityNotificationChange('login', checked)}
              disabled={loadingPrefs || updateSecurityNotifications.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active sessions across different devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockSessions.map((session, index) => (
            <div key={session.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{session.device}</span>
                      {session.current && <Badge variant="secondary">Current</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.lastActive}
                        </span>
                      </div>
                      <div>IP: {session.ip}</div>
                    </div>
                  </div>
                </div>
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={revokeSession.isPending}
                  >
                    Revoke
                  </Button>
                )}
              </div>
              {index < mockSessions.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}

          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleRevokeAllSessions}
              disabled={revokeAllSessions.isPending}
            >
              {revokeAllSessions.isPending ? 'Revoking...' : 'Revoke All Other Sessions'}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This will sign you out of all other devices and browsers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* 2FA Setup Dialog */}
    <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Scan this QR code with your authenticator app, then enter the verification code below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {qrCode && (
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <Image
                src={qrCode}
                alt="2FA QR Code"
                width={200}
                height={200}
                className="rounded"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShow2FADialog(false)
                setVerificationCode('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify2FA}
              disabled={!verificationCode || verify2FA.isPending}
            >
              {verify2FA.isPending ? 'Verifying...' : 'Verify and Enable'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  )
}