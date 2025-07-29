# Authentication Troubleshooting

## Sign-up Database Error

### Problem
Getting a 500 error during sign-up with the message:
```json
{
    "code": 500,
    "msg": "Database error finding user",
    "error_id": "..."
}
```

### Root Cause
The error occurs when the `auth.identities` table doesn't exist or is not accessible. This typically happens when:

1. Using legacy Docker Compose setup instead of the recommended Supabase CLI
2. Incorrect Supabase URL in environment variables
3. Database not properly initialized with auth schema

### Solution

1. **Stop any running Docker services (if using legacy setup):**
   ```bash
   docker-compose down
   ```

2. **Start Supabase using CLI (recommended):**
   ```bash
   supabase start
   ```

3. **Update your `.env.local` file:**
   ```bash
   # Use the CLI URL (default for local development)
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

### Verification

Test the auth endpoint directly:
```bash
curl -s http://localhost:54321/auth/v1/signup \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}'
```

Should return a JSON response with `access_token` instead of an error.

### Important Notes

- **Use Supabase CLI** (`supabase start`) as the recommended method for local development
- **Port 54321** is the correct API port when using Supabase CLI
- **Port 8000** was used by the legacy Docker Compose setup and causes this error
- The Supabase CLI properly initializes all auth tables including `auth.identities`

### Development Commands

```bash
# Start Supabase (recommended)
supabase start

# Start the development server (after Supabase is running)
pnpm dev

# Or use the smart dev command that starts both
pnpm dev  # (automatically detects and starts Supabase CLI)
```