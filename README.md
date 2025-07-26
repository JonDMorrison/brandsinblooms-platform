# brands-and-blooms

Brands and Blooms platform

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- pnpm

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
   # Start Supabase (CRITICAL: Use CLI, not Docker Compose)
   npx supabase start
   
   # Start dev server
   npm run dev:vite
   ```

4. **Open your app**
   - Frontend: http://localhost:3000
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
├── src/
│   ├── components/      # React components
│   ├── contexts/        # React contexts
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities and configs
│   ├── pages/          # Page components
│   └── main.tsx        # App entry point
├── supabase/
│   ├── migrations/     # Database migrations
│   ├── functions/      # Edge functions
│   └── seed.sql       # Seed data
├── public/             # Static assets
└── tests/             # Test files
```

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Deployment**: Railway + Supabase Cloud
- **Testing**: Jest + React Testing Library

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Check TypeScript
- `pnpm test` - Run tests
- `pnpm docker:up` - Start Supabase locally
- `pnpm docker:down` - Stop Supabase
- `pnpm deploy` - Deploy to production

## License

Private - All rights reserved

---

Built with ❤️ using [Supabase](https://supabase.com) and [Vite](https://vitejs.dev)
