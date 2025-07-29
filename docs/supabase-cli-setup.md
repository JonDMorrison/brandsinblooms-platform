# Supabase CLI Setup Guide

## Overview

The Supabase CLI provides a complete local development environment for your Supabase project. This is the recommended approach for local development, replacing the legacy Docker Compose setup.

## Prerequisites

- Node.js v18.0.0 or higher
- Git for version control
- Docker (for running the local Supabase services)

## Installation

### Install Supabase CLI

```bash
# Using npm
npm install -g supabase

# Using pnpm
pnpm add -g supabase

# Using Homebrew (macOS)
brew install supabase/tap/supabase

# Using Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Verify Installation

```bash
supabase --version
```

## Project Setup

### Initialize Supabase in Your Project

```bash
# Navigate to your project directory
cd your-project

# Initialize Supabase
supabase init
```

This creates a `supabase/` directory with:
- `config.toml` - Supabase configuration
- `migrations/` - Database migrations
- `functions/` - Edge Functions (optional)
- `seed.sql` - Seed data

### Start Local Development

```bash
# Start all Supabase services
supabase start
```

This will:
- Download and start PostgreSQL, PostgREST, Realtime, Storage, and other services
- Create a local database with auth schema
- Generate access keys for local development
- Display service URLs and credentials

### Expected Output

```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Environment Configuration

Update your `.env.local` file with the CLI URLs:

```env
# Supabase CLI (default for local development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Database URL
DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres

# Service role key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Development URLs
SUPABASE_STUDIO_URL=http://localhost:54323
MAILSERVER_URL=http://localhost:54324
```

## Port Configuration

The Supabase CLI uses the following default ports:

| Service | Port | URL |
|---------|------|-----|
| API Gateway | 54321 | http://localhost:54321 |
| Database | 54322 | postgres://postgres:postgres@localhost:54322/postgres |
| Studio | 54323 | http://localhost:54323 |
| Inbucket (Email) | 54324 | http://localhost:54324 |
| Storage | 54325 | http://localhost:54325 |
| Edge Functions | 54326 | http://localhost:54326 |

### Customizing Ports

You can customize ports in `supabase/config.toml`:

```toml
[api]
port = 54321

[db]
port = 54322

[studio]
port = 54323

[inbucket]
port = 54324
```

## Database Management

### Migrations

Create a new migration:
```bash
supabase migration new create_profiles_table
```

Apply migrations:
```bash
supabase db push
```

Reset database (useful for development):
```bash
supabase db reset
```

### Generate TypeScript Types

```bash
# Generate types from your database schema
supabase gen types typescript --local > src/lib/database/types.ts
```

## Essential Commands

### Starting and Stopping

```bash
# Start all services
supabase start

# Stop all services
supabase stop

# Stop and remove all data
supabase stop --no-backup
```

### Database Operations

```bash
# View database status
supabase status

# Connect to database
supabase db shell

# View logs
supabase logs db
supabase logs api
supabase logs storage
```

### Working with Remote Projects

```bash
# Link to a remote Supabase project
supabase link --project-ref your-project-ref

# Pull remote schema
supabase db pull

# Push local changes to remote
supabase db push
```

## Development Workflow

### Typical Development Session

```bash
# 1. Start Supabase services
supabase start

# 2. Start your application
pnpm dev

# 3. Make database changes
supabase migration new add_user_profiles

# 4. Apply changes locally
supabase db push

# 5. Generate updated types
supabase gen types typescript --local > src/lib/database/types.ts
```

### Testing Your Setup

1. **Check API connectivity:**
   ```bash
   curl http://localhost:54321/rest/v1/
   ```

2. **Access Supabase Studio:**
   Open http://localhost:54323 in your browser

3. **Check email server:**
   Open http://localhost:54324 to view test emails

## Advanced Configuration

### Custom Configuration

Edit `supabase/config.toml` to customize your local setup:

```toml
# Project settings
project_id = "your-project"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]

[db]
port = 54322
major_version = 15

[studio]
enabled = true
port = 54323

[inbucket]
enabled = true
port = 54324

[storage]
enabled = true
port = 54325

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
```

### Seed Data

Add seed data to `supabase/seed.sql`:

```sql
-- Example seed data
INSERT INTO public.profiles (id, username, avatar_url)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test_user', 'https://example.com/avatar.jpg');
```

Run seed data:
```bash
supabase db reset  # This runs migrations + seed data
```

## Troubleshooting

### Common Issues

1. **Services won't start:**
   ```bash
   # Check Docker is running
   docker ps
   
   # Check for port conflicts
   lsof -i :54321
   
   # Try stopping and restarting
   supabase stop --no-backup
   supabase start
   ```

2. **Permission errors:**
   ```bash
   # On Linux/macOS, you might need to fix Docker permissions
   sudo chown -R $USER:$USER ~/.docker
   ```

3. **Database connection issues:**
   ```bash
   # Check database is accessible
   supabase db shell
   
   # Reset if corrupted
   supabase db reset
   ```

### Logs and Debugging

View service logs:
```bash
# All services
supabase logs

# Specific service
supabase logs api
supabase logs db
supabase logs storage
supabase logs auth
```

### Migration Issues

```bash
# Check migration status
supabase migration list

# Apply specific migration
supabase migration up --version 20231201000000

# Rollback migration
supabase migration down --version 20231201000001
```

## Comparison with Docker Compose

| Feature | Supabase CLI | Docker Compose (Legacy) |
|---------|--------------|-------------------------|
| Setup | One command | Complex configuration |
| Updates | `supabase update` | Manual image updates |
| Ports | 54321-54326 | 8000, 3000, 5432, 9000 |
| Configuration | `config.toml` | `docker-compose.yml` |
| Migrations | Built-in support | Manual setup required |
| Type Generation | `supabase gen types` | Manual setup |
| Auth Schema | Auto-initialized | Requires init script |

## Best Practices

1. **Always use the CLI** for new projects
2. **Version control** your `supabase/` directory
3. **Use migrations** for all schema changes
4. **Generate types** after schema changes
5. **Test locally** before deploying to production
6. **Use seed data** for consistent development environment

## Getting Help

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- Check `supabase --help` for command reference
- Join the [Supabase Discord](https://discord.supabase.com) for community support