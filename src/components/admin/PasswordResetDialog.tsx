'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, AlertTriangle } from 'lucide-react'

interface PasswordResetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function PasswordResetDialog({ open, onOpenChange, userId }: PasswordResetDialogProps) {
  const [loading, setLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleResetPassword = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate: true }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to reset password')
      }

      setTempPassword(result.data.temp_password)
      toast.success('Password reset successfully')
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTempPassword(null)
    setCopied(false)
    onOpenChange(false)
  }

  const handleCopyPassword = async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Password copied to clipboard')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reset User Password</DialogTitle>
          <DialogDescription>
            {tempPassword
              ? 'Password reset successfully. Copy the temporary password and share it securely with the user.'
              : 'Generate a new temporary password for this user. This will immediately replace their current password.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {tempPassword ? (
            // Success state - show temp password
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Temporary Password</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all">
                      {tempPassword}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyPassword}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Make sure to copy this password and share it with the user. It will not be shown again.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            // Confirmation state
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will immediately reset the user's password. They will not be able to log in with their old password.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {tempPassword ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetPassword}
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
