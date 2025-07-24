# Vite Conversion Plan: Next.js to Vite + React

## Overview

This document outlines the complete conversion of the Supabase Starter from Next.js to Vite with React, Tailwind CSS, and shadcn/ui. The goal is to create an opinionated, reliable starter that uses familiar tools without the complexity of Next.js.

## Architecture Changes

### From (Next.js)
- Server-side rendering with App Router
- API routes in the application
- Next.js Image optimization
- Built-in routing with file-based routing
- Server and client components

### To (Vite)
- Client-side SPA with Vite
- Supabase Edge Functions for API needs
- Standard img tags or lazy loading library
- React Router for routing
- All client-side components

## Step-by-Step Conversion Plan

### Phase 1: Project Setup and Dependencies

#### 1.1 Remove Next.js Dependencies
```bash
pnpm remove next @next/eslint-plugin-next eslint-config-next
```

#### 1.2 Add Vite and Related Dependencies
```bash
# Core Vite setup
pnpm add -D vite @vitejs/plugin-react vite-tsconfig-paths

# React Router for routing
pnpm add react-router-dom
pnpm add -D @types/react-router-dom

# Development tools
pnpm add -D @types/node
```

#### 1.3 Add shadcn/ui Dependencies
```bash
# shadcn/ui prerequisites
pnpm add class-variance-authority clsx tailwind-merge
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slot

# Lucide icons (commonly used with shadcn/ui)
pnpm add lucide-react
```

### Phase 2: Configuration Files

#### 2.1 Create Vite Configuration
Create `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

#### 2.2 Update TypeScript Configuration
Modify `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

#### 2.3 Setup shadcn/ui Configuration
Create `components.json`:
```json
{
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

#### 2.4 Update Tailwind Configuration
The existing `tailwind.config.js` should be updated to:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### Phase 3: File Structure Migration

#### 3.1 Create New File Structure
```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Root component with router
├── index.css               # Global styles (renamed from globals.css)
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── auth/               # Authentication components
│   └── layout/             # Layout components
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser client only
│   │   └── auth.ts         # Auth helpers
│   ├── utils.ts            # cn() utility for shadcn/ui
│   └── database/
│       └── types.ts        # Generated types
├── pages/                  # Route components
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── Profile.tsx
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   └── useSupabase.ts
└── contexts/              # React contexts
    └── AuthContext.tsx
```

#### 3.2 Create Entry Point
Create `src/main.tsx`:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

#### 3.3 Create Root HTML
Create `index.html` in project root:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Supabase Vite Starter</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Phase 4: Core Implementation Changes

#### 4.1 Supabase Client (Client-Side Only)
Update `src/lib/supabase/client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database/types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
```

#### 4.2 Environment Variables
Create `.env.example`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Update `.env.local` to use VITE_ prefix for client-side variables.

#### 4.3 Authentication Context
Create `src/contexts/AuthContext.tsx`:
```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

#### 4.4 App Router Setup
Create `src/App.tsx`:
```typescript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { useAuth } from '@/contexts/AuthContext'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Profile from '@/pages/Profile'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
```

#### 4.5 Create cn() Utility
Create `src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Phase 5: Component Migration

#### 5.1 Convert Next.js Components to React
- Remove any `'use server'` directives
- Convert Server Components to regular React components
- Replace `next/image` with regular `img` tags
- Replace `next/link` with `react-router-dom` Link
- Update any Next.js specific imports

#### 5.2 Update Authentication Flow
- Remove server-side auth checks
- Implement client-side route protection
- Update callback URLs for OAuth providers

#### 5.3 API Routes Migration
For any existing API routes in `app/api`:
- Option 1: Move to Supabase Edge Functions
- Option 2: Create a separate Express/Fastify API
- Option 3: Use Supabase Database Functions/RPCs

### Phase 6: Scripts and Commands

#### 6.1 Update package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "generate-types": "supabase gen types typescript --local > src/lib/database/types.ts",
    "shadcn": "pnpm dlx shadcn-ui@latest"
  }
}
```

#### 6.2 Update ESLint Configuration
Create `.eslintrc.cjs`:
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
```

### Phase 7: Development Workflow

#### 7.1 Install shadcn/ui Components
```bash
# Install needed components
pnpm shadcn add button
pnpm shadcn add card
pnpm shadcn add form
pnpm shadcn add input
pnpm shadcn add toast
```

#### 7.2 Global Styles
Update `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Phase 8: Testing Updates

#### 8.1 Update Jest Configuration
Create `jest.config.js`:
```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
}
```

### Phase 9: Documentation Updates

#### 9.1 Update README.md
- Remove Next.js specific instructions
- Add Vite development commands
- Update deployment instructions for SPAs
- Add shadcn/ui component usage examples

#### 9.2 Update CLAUDE.md
- Remove Next.js specific patterns
- Add Vite + React patterns
- Include shadcn/ui component patterns
- Update routing examples

### Phase 10: Deployment Configuration

#### 10.1 Railway Configuration
Create `Dockerfile` for containerized deployment:
```dockerfile
# Build stage
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production stage
FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD serve -s dist -l tcp://0.0.0.0:${PORT:-3000}
```

Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

## Migration Checklist

- [ ] Backup current project
- [ ] Remove Next.js dependencies
- [ ] Install Vite and new dependencies
- [ ] Create new configuration files
- [ ] Setup new file structure
- [ ] Create entry point and root HTML
- [ ] Migrate components from Next.js to React
- [ ] Setup React Router
- [ ] Configure Supabase client for browser-only
- [ ] Setup authentication context
- [ ] Install and configure shadcn/ui
- [ ] Update all imports and paths
- [ ] Update environment variables
- [ ] Test authentication flow
- [ ] Test all routes
- [ ] Update documentation
- [ ] Configure deployment
- [ ] Run full test suite
- [ ] Deploy to staging

## Common Issues and Solutions

### Issue: Environment Variables Not Loading
**Solution**: Ensure all client-side env vars are prefixed with `VITE_`

### Issue: Routing Not Working in Production
**Solution**: Configure server to serve index.html for all routes (SPA fallback)

### Issue: Supabase Auth Callbacks Failing
**Solution**: Update redirect URLs in Supabase dashboard to match new routes

### Issue: Build Errors with Dependencies
**Solution**: Clear node_modules and pnpm-lock.yaml, then reinstall

### Issue: TypeScript Errors After Migration
**Solution**: Run `pnpm run type-check` and fix any path alias issues

## Post-Migration Improvements

1. Add proper error boundaries
2. Implement lazy loading for routes
3. Add PWA capabilities
4. Setup proper logging and monitoring
5. Implement proper loading states
6. Add animation libraries (Framer Motion)
7. Setup proper SEO with react-helmet-async

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)