# Platform Admin Implementation Plan

## Overview
Implement a platform admin system that intercepts `/admin` routes regardless of domain and provides secure admin authentication with one-off initial admin signup capability.

## Core Requirements
- `/admin` routes bypass domain-based routing and serve platform admin panel
- Initial admin signup available only when no admin users exist
- Backend security checks prevent unauthorized admin account creation
- Admin authentication integrated with existing Supabase auth system

## Implementation Plan

### 1. Database Schema Changes

#### Profiles Table Extension
Add `role` field to existing `profiles` table:
```sql
ALTER TABLE public.profiles 
ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'site_owner', 'admin'));

-- Create index for efficient admin queries
CREATE INDEX idx_profiles_role ON public.profiles(role);
```

#### RLS Policies for Admin Role
```sql
-- Admin users can read all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Prevent role escalation except through controlled functions
CREATE POLICY "Users cannot modify their own role" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id AND 
  (OLD.role = NEW.role OR auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  ))
);
```

### 2. Middleware Routing Updates

#### Path Priority Check
Modify `middleware.ts` to check for `/admin` paths before domain resolution:

```typescript
// In middleware.ts
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Admin routes bypass domain checking
  if (pathname.startsWith('/admin')) {
    return handleAdminRoute(request);
  }
  
  // Existing domain-based routing continues here
  // ... current domain logic
}

async function handleAdminRoute(request: NextRequest) {
  const response = NextResponse.next();
  
  // Set admin context headers
  response.headers.set('x-admin-route', 'true');
  
  return response;
}
```

### 3. Admin Authentication System

#### Admin Route Layout
Create `app/admin/layout.tsx`:
```typescript
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { AdminGuard } from '@/components/admin/AdminGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminGuard>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </AdminGuard>
    </AdminAuthProvider>
  );
}
```

#### Admin Authentication Context
Create `src/contexts/AdminAuthContext.tsx`:
```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AdminAuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  canCreateInitialAdmin: boolean;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [canCreateInitialAdmin, setCanCreateInitialAdmin] = useState(false);

  useEffect(() => {
    // Check initial auth state and admin status
    checkAdminStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await checkUserAdminRole(session.user);
        } else {
          setUser(null);
          setIsAdmin(false);
          await checkInitialAdminAvailability();
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdminStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await checkUserAdminRole(user);
    } else {
      await checkInitialAdminAvailability();
    }
    setIsLoading(false);
  }

  async function checkUserAdminRole(user: User) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    setUser(user);
    setIsAdmin(profile?.role === 'admin');
    setCanCreateInitialAdmin(false);
  }

  async function checkInitialAdminAvailability() {
    const { data: adminExists } = await supabase.rpc('admin_exists');
    setCanCreateInitialAdmin(!adminExists);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        canCreateInitialAdmin,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
```

### 4. Database Functions for Security

#### Admin Existence Check
```sql
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE role = 'admin'
  );
END;
$$;
```

#### Secure Initial Admin Creation
```sql
CREATE OR REPLACE FUNCTION public.create_initial_admin(
  user_id UUID,
  email TEXT,
  full_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Check if any admin already exists
  SELECT COUNT(*) INTO admin_count 
  FROM public.profiles 
  WHERE role = 'admin';
  
  -- Only allow if no admins exist
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'Admin user already exists';
  END IF;
  
  -- Create admin profile
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    email,
    full_name,
    'admin',
    NOW(),
    NOW()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;
```

### 5. Admin Authentication Components

#### Admin Guard Component
Create `src/components/admin/AdminGuard.tsx`:
```typescript
'use client';

import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { AdminLoginForm } from './AdminLoginForm';
import { InitialAdminSignup } from './InitialAdminSignup';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading, canCreateInitialAdmin } = useAdminAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return canCreateInitialAdmin ? <InitialAdminSignup /> : <AdminLoginForm />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            You do not have admin privileges.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

#### Initial Admin Signup Component
Create `src/components/admin/InitialAdminSignup.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function InitialAdminSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Create admin profile using secure function
      const { data, error: profileError } = await supabase.rpc(
        'create_initial_admin',
        {
          user_id: authData.user.id,
          email,
          full_name: fullName,
        }
      );

      if (profileError || !data) {
        throw new Error('Admin creation failed - admin may already exist');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Platform Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This is a one-time setup for the platform administrator
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Admin Full Name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="admin@company.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Strong password"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Admin...' : 'Create Admin Account'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

#### Admin Login Form
Create `src/components/admin/AdminLoginForm.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Platform Admin Login
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="admin@company.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

### 6. Admin Dashboard Pages

#### Main Admin Page
Create `app/admin/page.tsx`:
```typescript
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function AdminPage() {
  return <AdminDashboard />;
}
```

#### Admin Dashboard Component
Create `src/components/admin/AdminDashboard.tsx`:
```typescript
'use client';

import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';

export function AdminDashboard() {
  const { user, signOut } = useAdminAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Platform Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Welcome, {user?.email}
          </span>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Sites Management</h2>
          <p className="text-gray-600 mb-4">
            View and manage all tenant sites
          </p>
          <Button>View Sites</Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <p className="text-gray-600 mb-4">
            Manage site owners and permissions
          </p>
          <Button>Manage Users</Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Platform Settings</h2>
          <p className="text-gray-600 mb-4">
            Configure platform-wide settings
          </p>
          <Button>Settings</Button>
        </div>
      </div>
    </div>
  );
}
```

## Implementation Sequence

1. **Database Migration**: Add role column and create secure functions
2. **Middleware Update**: Implement admin route priority checking
3. **Authentication System**: Build admin auth context and components
4. **Admin Pages**: Create admin layout and dashboard
5. **Testing**: Verify security and functionality
6. **Documentation**: Update API docs and deployment notes

## Security Considerations

- All admin role changes go through database functions with security checks
- Initial admin signup is only available when no admins exist
- Admin routes are completely isolated from tenant routing
- RLS policies prevent unauthorized access to admin features
- No client-side role elevation possible

## Testing Strategy

- Unit tests for admin auth context and components
- Integration tests for admin signup and login flows  
- E2E tests for admin route isolation
- Security tests for unauthorized access attempts
- Database function tests for admin creation logic

This implementation provides a secure, complete platform admin system that integrates seamlessly with the existing Supabase auth and multi-tenant architecture.