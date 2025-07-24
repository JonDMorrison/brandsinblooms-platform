import { signIn, signUp, signOut, requireAuth, getUser } from '@/lib/auth/actions'
import { supabase } from '@/lib/supabase/client'
import { useNavigate } from 'react-router-dom'

// Mock the dependencies
jest.mock('@/lib/supabase/client')
jest.mock('react-router-dom')

describe('Auth Actions', () => {
  let mockAuth: any
  let mockNavigate: jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock navigate function
    mockNavigate = jest.fn()
    ;(useNavigate as jest.Mock).mockReturnValue(mockNavigate)
    
    // Setup mock auth object
    mockAuth = {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    }
    
    // Setup mock Supabase client
    ;(supabase as any).auth = mockAuth
  })
  
  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      const result = await signIn('test@example.com', 'password123')
      
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result).toEqual({ success: true, user: mockUser })
    })
    
    it('should return error when sign in fails', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      })
      
      const result = await signIn('test@example.com', 'wrongpassword')
      
      expect(result).toEqual({ success: false, error: 'Invalid credentials' })
    })
  })
  
  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = { id: '456', email: 'newuser@example.com' }
      mockAuth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      const result = await signUp('newuser@example.com', 'password123')
      
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      })
      expect(result).toEqual({ success: true, user: mockUser })
    })
    
    it('should return error when sign up fails', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already exists' },
      })
      
      const result = await signUp('existing@example.com', 'password123')
      
      expect(result).toEqual({ success: false, error: 'User already exists' })
    })
  })
  
  describe('signOut', () => {
    it('should sign out user', async () => {
      mockAuth.signOut.mockResolvedValue({})
      
      await signOut()
      
      expect(mockAuth.signOut).toHaveBeenCalled()
    })
  })
  
  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: '789', email: 'auth@example.com' }
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      const result = await requireAuth()
      
      expect(result).toEqual(mockUser)
    })
    
    it('should return null when not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })
      
      const result = await requireAuth()
      
      expect(result).toBeNull()
    })
  })
  
  describe('getUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: '999', email: 'current@example.com' }
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      const result = await getUser()
      
      expect(result).toEqual(mockUser)
    })
    
    it('should return null when no user is authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })
      
      const result = await getUser()
      
      expect(result).toBeNull()
    })
  })
})