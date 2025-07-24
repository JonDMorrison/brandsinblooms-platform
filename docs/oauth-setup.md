# OAuth Provider Setup Guide

This guide explains how to set up OAuth providers (Google and GitHub) for your Supabase application.

## Prerequisites

- A Supabase project
- Access to Google Cloud Console and/or GitHub Developer Settings
- Your application's public URL

## Google OAuth Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
     - `http://localhost:54321/auth/v1/callback` (for local development)

4. **Configure in Supabase**
   - Go to your Supabase project dashboard
   - Navigate to Authentication > Providers
   - Enable Google provider
   - Enter your Client ID and Client Secret

## GitHub OAuth Setup

1. **Create a GitHub OAuth App**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Click "New OAuth App"
   - Fill in the application details:
     - Application name: Your app name
     - Homepage URL: Your app URL
     - Authorization callback URL: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

2. **Configure in Supabase**
   - Go to your Supabase project dashboard
   - Navigate to Authentication > Providers
   - Enable GitHub provider
   - Enter your Client ID and Client Secret

## Environment Variables

For Vite applications, environment variables are handled differently. OAuth redirect URLs are typically constructed using `window.location.origin` for flexibility:

```typescript
// In your OAuth login function
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

This approach works for both development and production without needing environment variables.

## Implementation in React

Here's how to implement OAuth in your Vite + React app:

```typescript
// src/components/auth/OAuthButtons.tsx
import { supabase } from '@/lib/supabase/client'
import { Provider } from '@supabase/supabase-js'

function OAuthButtons() {
  const handleOAuthLogin = async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    if (error) {
      console.error('OAuth error:', error)
    }
  }
  
  return (
    <div className="oauth-buttons">
      <button onClick={() => handleOAuthLogin('google')}>
        Sign in with Google
      </button>
      <button onClick={() => handleOAuthLogin('github')}>
        Sign in with GitHub
      </button>
    </div>
  )
}
```

## Testing OAuth

1. Start your local development server with `pnpm dev`
2. Navigate to your login page
3. Click on the OAuth provider button
4. You should be redirected to the provider's login page
5. After authentication, you'll be redirected back to your app
6. Supabase will automatically handle the session creation

## Troubleshooting

### Common Issues

1. **Redirect URI mismatch**
   - Ensure the redirect URI in your provider settings exactly matches Supabase's callback URL
   - Check for trailing slashes or protocol differences (http vs https)

2. **Invalid client credentials**
   - Double-check that you've copied the correct Client ID and Secret
   - Ensure there are no extra spaces or characters

3. **Profile not created after OAuth login**
   - You can handle profile creation in your AuthContext:
   ```typescript
   // In AuthContext after successful OAuth login
   const { data: profile } = await supabase
     .from('profiles')
     .select()
     .eq('user_id', user.id)
     .single()
   
   if (!profile) {
     // Redirect to profile setup
     navigate('/setup-profile')
   }
   ```

### Security Considerations

1. **Always use HTTPS in production**
2. **Keep your Client Secrets secure** - never commit them to version control
3. **Implement proper CSRF protection** in your OAuth flow
4. **Validate and sanitize** all user data from OAuth providers

## Next Steps

After setting up OAuth:

1. Implement a profile setup page for new OAuth users
2. Add social login buttons to your UI
3. Handle edge cases (email already exists, etc.)
4. Consider implementing account linking for users with multiple auth methods