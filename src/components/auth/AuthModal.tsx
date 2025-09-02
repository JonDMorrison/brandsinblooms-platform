'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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
      <DialogContent className="p-0 max-w-md overflow-hidden" showCloseButton={true}>
        <div className="p-6">
          {mode === 'signup' ? <SignUp /> : <SignIn />}
        </div>
      </DialogContent>
    </Dialog>
  )
}