# brands-and-blooms

Brands and Blooms platform

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8.15.0 or higher
- Supabase CLI (for local development)

### Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Start development**
   ```bash
   # Start Supabase locally
   pnpm supabase:start
   
   # Start Next.js dev server
   pnpm dev
   
   # Or start both together
   pnpm dev:all
   ```

4. **Open your app**
   - Frontend: http://localhost:3001
   - Supabase Studio: http://127.0.0.1:54323
   - Supabase API: http://127.0.0.1:54321

## Development

### Database Migrations

```bash
# Create new migration
supabase migration new <name>

# Apply migrations
pnpm supabase:migrate

# Generate TypeScript types
pnpm supabase:generate-types
```

### Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage
```

### Deployment

```bash
# Interactive deployment
pnpm deploy

# Deploy to specific environment
pnpm deploy:staging
pnpm deploy:production

# Check deployment status
pnpm deployment:status
```

## Project Structure

```
brands-and-blooms/
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
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Deployment**: Railway + Supabase Cloud
- **Testing**: Jest + React Testing Library

## Scripts

### Development
- `pnpm dev` - Start Next.js development server (port 3001)
- `pnpm dev:all` - Start both Next.js and Supabase
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Check TypeScript
- `pnpm analyze` - Analyze bundle size

### Supabase
- `pnpm supabase:start` - Start Supabase locally
- `pnpm supabase:stop` - Stop Supabase
- `pnpm supabase:reset` - Reset database
- `pnpm supabase:migrate` - Apply migrations
- `pnpm supabase:generate-types` - Generate TypeScript types

### Testing & Deployment
- `pnpm test` - Run all tests
- `pnpm test:unit` - Run unit tests
- `pnpm test:integration` - Run integration tests
- `pnpm deploy` - Interactive deployment
- `pnpm deploy:staging` - Deploy to staging
- `pnpm deploy:production` - Deploy to production

## License

Private - All rights reserved

---

Built with ❤️ using [Next.js](https://nextjs.org) and [Supabase](https://supabase.com)
