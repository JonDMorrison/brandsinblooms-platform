'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Save,
  Key,
  UserX,
  UserCheck,
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { PasswordResetDialog } from '@/components/admin/PasswordResetDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useIsMobile } from '@/src/hooks/use-mobile'

interface UserDetails {
  user_id: string
  email: string | null
  full_name: string | null
  username: string | null
  bio: string | null
  phone: string | null
  role: 'user' | 'site_owner' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  site_count: number
}

interface UserEditFormData {
  email: string
  full_name: string
  username: string
  phone: string
  role: 'user' | 'site_owner' | 'admin'
}

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  onSuccess?: () => void
}

export function EditUserModal({ open, onOpenChange, userId, onSuccess }: EditUserModalProps) {
  const isMobile = useIsMobile()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordResetOpen, setPasswordResetOpen] = useState(false)
  const [toggleStatusOpen, setToggleStatusOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<UserEditFormData>()

  const role = watch('role')

  // Fetch user details when modal opens and userId is provided
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId || !open) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/admin/users/${userId}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error?.message || 'Failed to fetch user')
        }

        const userData = result.data.user
        setUser(userData)
        reset({
          email: userData.email || '',
          full_name: userData.full_name || '',
          username: userData.username || '',
          phone: userData.phone || '',
          role: userData.role,
        })
      } catch (error) {
        console.error('Error fetching user:', error)
        toast.error('Failed to load user details')
        onOpenChange(false)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId, open, reset, onOpenChange])

  const onSubmit = async (data: UserEditFormData) => {
    if (!userId) return

    try {
      setSaving(true)

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update user')
      }

      const updatedUser = result.data.user
      setUser(updatedUser)
      reset({
        email: updatedUser.email || '',
        full_name: updatedUser.full_name || '',
        username: updatedUser.username || '',
        phone: updatedUser.phone || '',
        role: updatedUser.role,
      })
      toast.success('User updated successfully')

      // Call onSuccess to refresh parent list
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!userId) return

    try {
      const response = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to toggle user status')
      }

      const updatedUser = result.data.user
      setUser(updatedUser)
      toast.success(result.data.message)
      setToggleStatusOpen(false)

      // Refresh parent list
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to toggle user status')
    }
  }

  const handleClose = () => {
    if (!saving) {
      setUser(null)
      reset()
      onOpenChange(false)
    }
  }

  // Render form content (shared between Dialog and Sheet)
  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )
    }

    if (!user) return null

    return (
      <>
        {/* Status Badges */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={user.is_active ? 'default' : 'outline'}>
            {user.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
            {user.role === 'site_owner' ? 'Site Owner' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-xs text-gray-600">Sites</p>
              <p className="font-semibold">{user.site_count}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-xs text-gray-600">Created</p>
              <p className="font-semibold text-sm">
                {format(new Date(user.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-xs text-gray-600">Last Sign In</p>
              <p className="font-semibold text-sm">
                {user.last_sign_in_at
                  ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy')
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Edit Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                className="pl-10"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email format',
                  },
                })}
                disabled={saving}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="full_name"
                className="pl-10"
                {...register('full_name')}
                disabled={saving}
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              {...register('username')}
              disabled={saving}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                className="pl-10"
                {...register('phone')}
                disabled={saving}
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={role}
              onValueChange={(value) => setValue('role', value as UserEditFormData['role'], { shouldDirty: true })}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="site_owner">Site Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600">
              {role === 'admin' && 'For platform administrators. Full platform access including user management, all sites, and admin dashboard.'}
              {role === 'site_owner' && 'For store owners. Can create and manage their own online stores with full control over design, content, products, and settings.'}
              {role === 'user' && 'For customers of stores. View-only access to sites they\'re invited to. Cannot create or manage sites.'}
            </p>
          </div>

          <Separator className="my-4" />

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {/* Secondary Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPasswordResetOpen(true)}
                disabled={saving}
                className="flex-1"
              >
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setToggleStatusOpen(true)}
                disabled={saving}
                className="flex-1"
              >
                {user.is_active ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
            </div>

            {/* Primary Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!isDirty || saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </>
    )
  }

  return (
    <>
      {/* Responsive Modal Container */}
      {isMobile ? (
        <Sheet open={open} onOpenChange={handleClose}>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit User</SheetTitle>
              <SheetDescription>
                Update user account details and manage permissions
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              {renderContent()}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user account details and manage permissions
              </DialogDescription>
            </DialogHeader>
            {renderContent()}
          </DialogContent>
        </Dialog>
      )}

      {/* Nested Modals */}
      {userId && (
        <>
          <PasswordResetDialog
            open={passwordResetOpen}
            onOpenChange={setPasswordResetOpen}
            userId={userId}
          />

          <AlertDialog open={toggleStatusOpen} onOpenChange={setToggleStatusOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {user?.is_active ? 'Deactivate User' : 'Activate User'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {user?.is_active
                    ? 'This will prevent the user from logging in and accessing the platform. You can reactivate them later.'
                    : 'This will allow the user to log in and access the platform again.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleToggleStatus}>
                  {user?.is_active ? 'Deactivate' : 'Activate'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  )
}
