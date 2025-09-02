'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import SignIn from './SignIn'
import SignUp from './SignUp'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'signin' | 'signup'
  onModeChange: (mode: 'signin' | 'signup') => void
}

export default function AuthModal({ open, onOpenChange, mode, onModeChange }: AuthModalProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const signin = searchParams.get('signin') === 'true'
    const signup = searchParams.get('signup') === 'true'
    
    if (signin || signup) {
      onOpenChange(true)
      onModeChange(signup ? 'signup' : 'signin')
    } else {
      onOpenChange(false)
    }
  }, [searchParams, onOpenChange, onModeChange])

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    
    if (!newOpen) {
      const url = new URL(window.location.href)
      url.searchParams.delete('signup')
      url.searchParams.delete('signin')
      window.history.replaceState({}, '', url.toString())
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 w-[95%] max-w-md overflow-hidden border-0" showCloseButton={false}>
        <VisuallyHidden>
          <DialogTitle>{mode === 'signup' ? 'Create an Account' : 'Sign In'}</DialogTitle>
          <DialogDescription>
            {mode === 'signup' 
              ? 'Join Brands in Blooms to start creating beautiful websites' 
              : 'Sign in to your Brands in Blooms account'}
          </DialogDescription>
        </VisuallyHidden>
        {mode === 'signup' ? <SignUp /> : <SignIn />}
      </DialogContent>
    </Dialog>
  )
}