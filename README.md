# brands-in-blooms

Brands in Blooms platform - A modern e-commerce platform built with Next.js and Supabase.

## Quick Start

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **pnpm** 8.15.0 or higher (`npm install -g pnpm`)
- **Supabase CLI** ([Installation guide](https://supabase.com/docs/guides/cli/getting-started))
- **Docker** (required for Supabase CLI to run local services)

### Installation

1. **Install Supabase CLI** (if not already installed)
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # Windows/Linux
   npx supabase@latest --help
   ```

2. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd brands-in-blooms
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   The default configuration uses Supabase CLI ports:
   - API: `http://localhost:54321`
   - Database: `postgres://postgres:postgres@localhost:54322/postgres`
   - Studio: `http://localhost:54323`
   - Inbucket (Email): `http://localhost:54324`

4. **Initialize and start Supabase**
   ```bash
   # Initialize Supabase (first time only)
   supabase init
   
   # Start all Supabase services
   pnpm supabase:start
   ```
   
   This will start:
   - PostgreSQL database
   - Supabase API server
   - Supabase Studio (database management)
   - Inbucket (email testing)
   - Edge Runtime

5. **Start the development server**
   ```bash
   # Option 1: Start Next.js only (Supabase should already be running)
   pnpm dev
   
   # Option 2: Start both Supabase and Next.js together
   pnpm dev:all
   ```

6. **Open your application**
   - **Frontend**: http://localhost:3001
   - **Supabase Studio**: http://localhost:54323
   - **Supabase API**: http://localhost:54321
   - **Email testing**: http://localhost:54324

## Development

### Database Migrations

```bash
# Create new migration
supabase migration new <name>

# Apply migrations locally
pnpm supabase:migrate

# Reset local database (useful for development)
pnpm supabase:reset

# Generate TypeScript types from database schema
pnpm supabase:generate-types
```

### Environment Configuration

The project uses different ports depending on your setup:

#### Supabase CLI (Default - Recommended)
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres
SUPABASE_STUDIO_URL=http://localhost:54323
MAILSERVER_URL=http://localhost:54324
```

#### Legacy Docker Compose (If using custom setup)
```bash
# Alternative ports for custom Docker setup
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
DATABASE_URL=postgres://postgres:your-password@localhost:5432/postgres
SUPABASE_STUDIO_URL=http://localhost:3000
MAILSERVER_URL=http://localhost:9000
```

### Testing

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Run with coverage report
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### Deployment

The application supports multiple deployment targets:

```bash
# Interactive deployment wizard
pnpm deploy

# Deploy to specific environments
pnpm deploy:staging
pnpm deploy:production

# Deploy preview (temporary deployment)
pnpm deploy:preview

# Check deployment status
pnpm deployment:status

# Rollback if needed
pnpm deployment:rollback
```

## Project Structure

```
brands-in-blooms/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Authentication routes
│   ├── (dashboard)/    # Dashboard routes
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   └── layout.tsx      # Root layout
├── src/
│   ├── components/     # React components
│   │   ├── ui/         # shadcn/ui components
│   │   ├── auth/       # Auth components
│   │   └── layout/     # Layout components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   └── lib/            # Utilities and configs
├── supabase/
│   ├── migrations/     # Database migrations
│   ├── functions/      # Edge functions
│   └── seed.sql        # Seed data
├── public/             # Static assets
└── tests/              # Test files
```

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Local Development**: Supabase CLI + Docker
- **Deployment**: Railway (Docker) + Supabase Cloud
- **Testing**: Jest + React Testing Library
- **Package Manager**: pnpm
- **State Management**: React Query + React Context

## Production Deployment

### Railway Deployment (Docker)

The application includes Docker configuration for deployment to Railway:

```bash
# Build Docker image locally (optional - Railway builds automatically)
pnpm docker:build

# Run Docker container locally for testing
pnpm docker:run
```

The deployment process:
1. Railway automatically detects the Next.js application
2. Uses the optimized Next.js build process with `output: 'standalone'`
3. Connects to Supabase Cloud for production database and auth
4. Serves the application on Railway's provided domain

### Environment Variables for Production

Set these in your Railway dashboard:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://your-cloud-database-url
```

## Troubleshooting

### Common Issues

**Port conflicts**: If ports 54321-54324 are already in use:
```bash
# Stop Supabase and restart
pnpm supabase:stop
pnpm supabase:start
```

**Database connection issues**:
```bash
# Reset local database
pnpm supabase:reset

# Check Supabase status
supabase status
```

**Docker issues (for Supabase CLI)**:
```bash
# Ensure Docker is running
docker ps

# Restart Docker if needed
# Then restart Supabase
pnpm supabase:start
```

**TypeScript errors after schema changes**:
```bash
# Regenerate types
pnpm supabase:generate-types
```

## Available Scripts

### Development
- `pnpm dev` - Start Next.js development server (port 3001)
- `pnpm dev:all` - Start both Supabase and Next.js together
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - TypeScript type checking
- `pnpm analyze` - Analyze bundle size with webpack-bundle-analyzer

### Supabase Local Development
- `pnpm supabase:start` - Start all Supabase services locally
- `pnpm supabase:stop` - Stop all Supabase services
- `pnpm supabase:reset` - Reset local database (destroys data)
- `pnpm supabase:migrate` - Apply migrations to local database
- `pnpm supabase:generate-types` - Generate TypeScript types from schema

### Testing
- `pnpm test` - Run all tests
- `pnpm test:unit` - Run unit tests only
- `pnpm test:integration` - Run integration tests only
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:all` - Run both unit and integration tests sequentially

### Deployment & Production
- `pnpm deploy` - Interactive deployment wizard
- `pnpm deploy:staging` - Deploy to staging environment
- `pnpm deploy:production` - Deploy to production environment
- `pnpm deploy:preview` - Create preview deployment
- `pnpm deployment:status` - Check current deployment status
- `pnpm deployment:rollback` - Rollback to previous version

### Docker (Production)
- `pnpm docker:build` - Build Docker image
- `pnpm docker:run` - Run Docker container locally

### Utilities
- `pnpm shadcn` - Add shadcn/ui components
- `pnpm generate-types` - Generate database types (alias)
- `pnpm test:create-project` - Test project creation script

## Getting Started Checklist

For new developers joining the project:

- [ ] Install Node.js 18+ and pnpm
- [ ] Install Docker Desktop
- [ ] Install Supabase CLI
- [ ] Clone the repository
- [ ] Run `pnpm install`
- [ ] Copy `.env.example` to `.env.local`
- [ ] Run `pnpm supabase:start` (first time setup)
- [ ] Run `pnpm dev:all` to start development
- [ ] Open http://localhost:3001 to verify setup
- [ ] Access Supabase Studio at http://localhost:54323
- [ ] Run `pnpm test` to ensure tests pass

## Additional Resources

- **Documentation**: Check the `/docs` folder for detailed guides
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs

## License

Private - All rights reserved

---

**Built with:** [Next.js](https://nextjs.org) • [Supabase](https://supabase.com) • [TypeScript](https://typescriptlang.org) • [Tailwind CSS](https://tailwindcss.com) • [shadcn/ui](https://ui.shadcn.com)
