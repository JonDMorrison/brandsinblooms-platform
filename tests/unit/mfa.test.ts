import { 
  enrollMFA, 
  verifyMFAEnrollment, 
  challengeMFA, 
  verifyMFAChallenge,
  unenrollMFA,
  listMFAFactors,
  getAssuranceLevel
} from '@/lib/auth/mfa'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

describe('MFA Functions', () => {
  let mockSupabaseClient: any
  let mockAuth: any
  let mockMFA: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock MFA object
    mockMFA = {
      enroll: jest.fn(),
      verify: jest.fn(),
      challenge: jest.fn(),
      unenroll: jest.fn(),
    }
    
    // Setup mock auth object
    mockAuth = {
      getUser: jest.fn(),
      getSession: jest.fn(),
      mfa: mockMFA,
    }
    
    // Setup mock Supabase client
    mockSupabaseClient = {
      auth: mockAuth,
    }
    
    // Mock createClient to return our mock client
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
  })
  
  describe('enrollMFA', () => {
    it('should successfully enroll MFA for authenticated user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockEnrollData = {
        id: 'factor-123',
        totp: {
          qr_code: 'data:image/png;base64,mockQRCode',
          secret: 'MOCK_SECRET_KEY',
        },
      }
      
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockMFA.enroll.mockResolvedValue({ data: mockEnrollData, error: null })
      
      const result = await enrollMFA()
      
      expect(mockMFA.enroll).toHaveBeenCalledWith({
        factorType: 'totp',
        friendlyName: 'test@example.com - Authenticator App',
      })
      expect(result).toEqual({
        success: true,
        qrCode: 'data:image/png;base64,mockQRCode',
        secret: 'MOCK_SECRET_KEY',
        factorId: 'factor-123',
      })
    })
    
    it('should return error when user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({ data: { user: null } })
      
      const result = await enrollMFA()
      
      expect(result).toEqual({
        success: false,
        error: 'User not authenticated',
      })
      expect(mockMFA.enroll).not.toHaveBeenCalled()
    })
  })
  
  describe('verifyMFAEnrollment', () => {
    it('should verify MFA enrollment successfully', async () => {
      mockMFA.verify.mockResolvedValue({ data: {}, error: null })
      
      const result = await verifyMFAEnrollment('factor-123', '123456')
      
      expect(mockMFA.verify).toHaveBeenCalledWith({
        factorId: 'factor-123',
        code: '123456',
      })
      expect(result).toEqual({ success: true })
    })
    
    it('should return error for invalid code', async () => {
      mockMFA.verify.mockResolvedValue({ 
        data: null, 
        error: { message: 'Invalid code' } 
      })
      
      const result = await verifyMFAEnrollment('factor-123', '000000')
      
      expect(result).toEqual({
        success: false,
        error: 'Invalid code',
      })
    })
  })
  
  describe('challengeMFA', () => {
    it('should create MFA challenge successfully', async () => {
      mockMFA.challenge.mockResolvedValue({ 
        data: { id: 'challenge-123' }, 
        error: null 
      })
      
      const result = await challengeMFA('factor-123')
      
      expect(mockMFA.challenge).toHaveBeenCalledWith({
        factorId: 'factor-123',
      })
      expect(result).toEqual({
        success: true,
        challengeId: 'challenge-123',
        error: null,
      })
    })
  })
  
  describe('listMFAFactors', () => {
    it('should list user MFA factors', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        factors: [
          {
            id: 'factor-1',
            status: 'verified',
            friendly_name: 'My Phone',
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'factor-2',
            status: 'unverified',
            friendly_name: 'Backup Device',
            created_at: '2024-01-02T00:00:00Z',
          },
        ],
      }
      
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      const result = await listMFAFactors()
      
      expect(result).toEqual({
        success: true,
        factors: [
          {
            id: 'factor-1',
            status: 'verified',
            friendlyName: 'My Phone',
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'factor-2',
            status: 'unverified',
            friendlyName: 'Backup Device',
            createdAt: '2024-01-02T00:00:00Z',
          },
        ],
        error: null,
      })
    })
  })
  
  describe('getAssuranceLevel', () => {
    it('should return aal2 for MFA verified session', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { aal: 'aal2' } },
      })
      
      const result = await getAssuranceLevel()
      
      expect(result).toEqual({
        level: 'aal2',
        authenticated: true,
        mfaVerified: true,
      })
    })
    
    it('should return aal1 for non-MFA session', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { aal: 'aal1' } },
      })
      
      const result = await getAssuranceLevel()
      
      expect(result).toEqual({
        level: 'aal1',
        authenticated: true,
        mfaVerified: false,
      })
    })
    
    it('should return none for no session', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
      })
      
      const result = await getAssuranceLevel()
      
      expect(result).toEqual({
        level: 'none',
        authenticated: false,
      })
    })
  })
})