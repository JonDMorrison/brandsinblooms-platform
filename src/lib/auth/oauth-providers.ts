import { Provider } from '@supabase/supabase-js'

export interface OAuthProvider {
  name: string
  provider: Provider
  icon: string
  bgColor: string
  textColor: string
}

export const oauthProviders: OAuthProvider[] = [
  {
    name: 'Google',
    provider: 'google',
    icon: '🔍', // In production, use proper SVG icons
    bgColor: 'bg-white hover:bg-gray-50',
    textColor: 'text-gray-900',
  },
  {
    name: 'GitHub',
    provider: 'github',
    icon: '🐙', // In production, use proper SVG icons
    bgColor: 'bg-gray-900 hover:bg-gray-800',
    textColor: 'text-white',
  },
]

export const getProviderByName = (name: string): OAuthProvider | undefined => {
  return oauthProviders.find(p => p.provider === name.toLowerCase())
}