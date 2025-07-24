import { 
  signUp, 
  resetPassword, 
  updatePassword, 
  verifyEmail,
  resendVerificationEmail,
  checkEmailVerified
} from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

describe('Auth Flow Functions', () => {
  let mockSupabaseClient: any
  let mockAuth: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockAuth = {
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      verifyOtp: jest.fn(),
      resend: jest.fn(),
      getUser: jest.fn(),
    }
    
    mockSupabaseClient = {
      auth: mockAuth,
    }
    
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
  })
  
  describe('signUp with email verification', () => {
    it('should indicate when email confirmation is needed', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        confirmed_at: null, // Not confirmed
      }
      
      mockAuth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      const result = await signUp('test@example.com', 'password123')
      
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/verify-email',
        },
      })
      expect(result).toEqual({
        success: true,
        user: mockUser,
        needsEmailConfirmation: true,
      })
    })
    
    it('should not require confirmation for already confirmed users', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        confirmed_at: '2024-01-01T00:00:00Z',
      }
      
      mockAuth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      const result = await signUp('test@example.com', 'password123')
      
      expect(result.needsEmailConfirmation).toBe(false)
    })
  })
  
  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      mockAuth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      })
      
      const result = await resetPassword('test@example.com')
      
      expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/reset-password',
        }
      )
      expect(result).toEqual({ success: true })
    })
    
    it('should handle errors', async () => {
      mockAuth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'User not found' },
      })
      
      const result = await resetPassword('nonexistent@example.com')
      
      expect(result).toEqual({
        success: false,
        error: 'User not found',
      })
    })
  })
  
  describe('updatePassword', () => {
    it('should update user password', async () => {
      mockAuth.updateUser.mockResolvedValue({
        error: null,
      })
      
      const result = await updatePassword('newSecurePassword123!')
      
      expect(mockAuth.updateUser).toHaveBeenCalledWith({
        password: 'newSecurePassword123!',
      })
      expect(result).toEqual({ success: true })
    })
  })
  
  describe('verifyEmail', () => {
    it('should verify email with OTP', async () => {
      mockAuth.verifyOtp.mockResolvedValue({
        error: null,
      })
      
      const result = await verifyEmail('123456', 'test@example.com')
      
      expect(mockAuth.verifyOtp).toHaveBeenCalledWith({
        token: '123456',
        type: 'email',
        email: 'test@example.com',
      })
      expect(result).toEqual({ success: true })
    })
  })
  
  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      mockAuth.resend.mockResolvedValue({
        error: null,
      })
      
      const result = await resendVerificationEmail('test@example.com')
      
      expect(mockAuth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/verify-email',
        },
      })
      expect(result).toEqual({ success: true })
    })
  })
  
  describe('checkEmailVerified', () => {
    it('should return verified status for confirmed user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z',
      }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })
      
      const result = await checkEmailVerified()
      
      expect(result).toEqual({
        verified: true,
        user: mockUser,
      })
    })
    
    it('should return unverified status for unconfirmed user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        email_confirmed_at: null,
      }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })
      
      const result = await checkEmailVerified()
      
      expect(result).toEqual({
        verified: false,
        user: mockUser,
      })
    })
    
    it('should handle no user case', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
      })
      
      const result = await checkEmailVerified()
      
      expect(result).toEqual({
        verified: false,
        user: null,
      })
    })
  })
})