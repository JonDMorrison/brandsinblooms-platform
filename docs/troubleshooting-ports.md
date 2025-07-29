# Troubleshooting Supabase Port Issues

## Quick Fix

If your site loads but Supabase API and Studio are not reachable, you likely have a port mismatch in your `.env.local` file.

## Understanding the Port Differences

### Supabase CLI Ports (Recommended - Default)
- **API**: `http://localhost:54321`
- **Studio**: `http://localhost:54323`
- **Database**: `localhost:54322`
- **Inbucket (email)**: `http://localhost:54324`
- **Storage**: `http://localhost:54325`
- **Edge Functions**: `http://localhost:54326`

### Docker Compose Ports (Legacy)
- **API**: `http://localhost:8000`
- **Studio**: `http://localhost:3000`
- **Database**: `localhost:5432`
- **Inbucket (email)**: `http://localhost:9000`

## How to Fix

1. **Check which method you're using:**
   ```bash
   # Check if Supabase CLI is installed and running (recommended)
   supabase --version
   supabase status
   
   # Check if legacy Docker Compose is running
   docker ps | grep supabase
   ```

2. **Update your `.env.local` accordingly:**
   
   For Supabase CLI (recommended):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
   
   For Docker Compose (legacy):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Restart your development environment:**
   ```bash
   # For Supabase CLI (recommended)
   supabase stop
   supabase start
   pnpm dev
   
   # For Docker Compose (legacy)
   docker-compose down
   docker-compose up -d
   pnpm dev
   ```

## The Smart `pnpm dev` Command

The `pnpm dev` command automatically detects which method is available and configures the ports accordingly. It will:

1. **Prioritize Supabase CLI** (recommended method)
2. Fall back to Docker Compose if CLI is not available (legacy)
3. Set the correct ports based on the detected method
4. Display the correct URLs in the success message

**Migration Recommendation:** If you're using Docker Compose, consider migrating to Supabase CLI for a better development experience.

## Common Issues

### "Failed to fetch" errors in the browser console
- **Cause**: Your app is trying to connect to the wrong Supabase port
- **Fix**: Update `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`

### Studio shows "Cannot connect to project"
- **Cause**: Studio is trying to connect to the wrong API port
- **Fix**: Make sure you're accessing Studio on the correct port (54323 for CLI, 3000 for Docker)

### Both methods installed but wrong one starting
- **Cause**: The dev script prioritizes Supabase CLI over Docker Compose
- **Recommended**: Use Supabase CLI (it's the preferred method)
- **Alternative**: If you must use Docker Compose, stop Supabase CLI first:
  ```bash
  # Use Supabase CLI (recommended)
  supabase start
  pnpm dev
  
  # Or use Docker Compose (legacy)
  supabase stop  # Stop CLI first
  docker-compose up -d
  pnpm dev
  ```

## Checking Connection

You can test if Supabase is accessible:

```bash
# Test Supabase CLI
curl http://localhost:54321/rest/v1/

# Test Docker Compose
curl http://localhost:8000/rest/v1/
```

If you get a response (even an error), the API is running on that port.