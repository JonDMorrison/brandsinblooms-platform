// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => jest.fn()),
  useLocation: jest.fn(() => ({ pathname: '/', search: '', hash: '' })),
  useSearchParams: jest.fn(() => [new URLSearchParams(), jest.fn()]),
}))

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'