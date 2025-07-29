# Docker Compose Setup Guide

## Important: JWT Secret Configuration

The Docker Compose setup uses pre-generated JWT keys that are signed with a specific secret. This is critical for the services to communicate properly.

### The Demo Keys

The following keys are used throughout the Docker Compose setup:

- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`

These keys are signed with the JWT secret: `super-secret-jwt-token-with-at-least-32-characters-long`

⚠️ **Important**: The JWT secret does NOT have "your-" at the beginning. This is a common mistake that causes authentication failures.

## Required Files

For Docker Compose to work properly, you need:

1. **`supabase/config/kong.yml`** - Kong API Gateway configuration
   - This file is required for Kong to route requests properly
   - Without it, Kong container will exit immediately

2. **Correct JWT Secret** - Must be exactly: `super-secret-jwt-token-with-at-least-32-characters-long`
   - Used in all services that validate JWT tokens
   - Must match the secret used to sign the demo keys

## Running with Docker Compose

### Option 1: Using `pnpm dev` (Recommended)

The smart dev script will detect Docker and start everything:

```bash
pnpm dev
```

This will:
- Detect Docker is available
- Start all services with Docker Compose
- Use port 8000 for API and port 3000 for Studio
- Configure Next.js to use port 3001 (to avoid conflict with Studio)

### Option 2: Manual Docker Compose

```bash
# Start services
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs if something goes wrong
docker-compose logs -f

# Stop services
docker-compose down
```

## Troubleshooting Docker Compose

### Containers Exit Immediately

**Symptom**: Containers start but then exit within a few seconds

**Common Causes**:

1. **Missing kong.yml**
   ```bash
   # Check if file exists
   ls -la supabase/config/kong.yml
   
   # If missing, the kong container will exit
   ```

2. **Wrong JWT Secret**
   - Check docker-compose.yml for any instance of `your-super-secret-jwt-token...`
   - Should be `super-secret-jwt-token...` (no "your-" prefix)

3. **Port Conflicts**
   ```bash
   # Check if ports are already in use
   lsof -i :5432  # PostgreSQL
   lsof -i :8000  # Kong API
   lsof -i :3000  # Studio
   ```

### Authentication Errors

**Symptom**: "Invalid API key" or authentication failures

**Cause**: JWT secret mismatch

**Fix**: Ensure all services use the same JWT secret:
- Auth service (GOTRUE_JWT_SECRET)
- Rest service (PGRST_JWT_SECRET)
- Realtime service (API_JWT_SECRET)
- Storage service (PGRST_JWT_SECRET)
- Edge Runtime (JWT_SECRET)

All must be set to: `super-secret-jwt-token-with-at-least-32-characters-long`

### Checking Service Health

```bash
# Check if API is responding
curl http://localhost:8000/rest/v1/

# Check if Auth is working
curl http://localhost:8000/auth/v1/health

# Check Studio
open http://localhost:3000
```

## Environment Variables for Docker Compose

When using Docker Compose, your `.env.local` should have:

```env
# For Docker Compose
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

## Security Note

These are demo keys and secrets suitable for local development only. Never use these in production!