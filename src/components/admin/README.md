# Admin Authentication Components

This directory contains the admin authentication system components for the Brands in Blooms platform.

## Components

### AdminAuthContext
Context provider that manages admin authentication state and provides hooks for admin operations:
- `AdminAuthProvider`: Wrap your app with this provider
- `useAdminAuth()`: Hook to access admin auth state and functions

### AdminGuard
Route protection component that handles admin authentication flow:
- Shows InitialAdminSignup if no admin exists
- Shows AdminLoginForm if admin exists but user isn't authenticated
- Shows protected content if user is authenticated as admin

### InitialAdminSignup
Component for creating the first admin account when none exists.

### AdminLoginForm
Standard login form for admin users.

## Usage

### Basic Setup

```typescript
// app/layout.tsx or app/providers.tsx
import { AdminAuthProvider } from '@/src/contexts/AdminAuthContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AdminAuthProvider>
          {children}
        </AdminAuthProvider>
      </body>
    </html>
  )
}
```

### Protecting Admin Routes

```typescript
// app/admin/page.tsx
import { AdminGuard } from '@/src/components/admin'

export default function AdminPage() {
  return (
    <AdminGuard>
      <div>
        <h1>Admin Dashboard</h1>
        <p>This content is only visible to authenticated admins.</p>
      </div>
    </AdminGuard>
  )
}
```

### Using Admin Auth Hook

```typescript
// components/AdminHeader.tsx
import { useAdminAuth } from '@/src/contexts/AdminAuthContext'

export function AdminHeader() {
  const { adminProfile, signOut, isLoading } = useAdminAuth()

  if (isLoading) return <div>Loading...</div>

  return (
    <header>
      <h1>Welcome, {adminProfile?.full_name}</h1>
      <button onClick={signOut}>Sign Out</button>
    </header>
  )
}
```

## Features

- **Initial Admin Setup**: Creates first admin when none exists
- **Secure Authentication**: Uses Supabase auth with database functions
- **Role-Based Access**: Checks admin role in database
- **Error Handling**: Comprehensive error states and validation
- **Loading States**: Proper loading indicators throughout
- **TypeScript**: Full type safety with database types
- **React 19 Compatible**: Uses modern React patterns
- **Next.js 15 Compatible**: Works with App Router

## Database Functions Used

- `admin_exists()`: Checks if any admin exists
- `create_initial_admin(userId, fullName)`: Creates initial admin account

## Security

- Uses Supabase RLS (Row Level Security) policies
- Admin role is stored in database, not just auth metadata
- Initial admin creation is restricted to when no admin exists
- Proper error handling prevents information leakage