# Supabase Migration System Documentation

## Overview

This document describes the automatic migration system that runs Supabase database migrations on container startup without blocking the Next.js application.

## Architecture

The migration system consists of three main components:

1. **Migration Scripts** - Handle the actual migration execution
2. **Docker Entrypoint** - Orchestrates parallel startup of migrations and application
3. **Supabase CLI/Node.js Runner** - Executes the SQL migrations

## Components

### 1. Docker Configuration (`Dockerfile`)

The production Docker image includes:
- **Supabase CLI** - Installed as a lightweight binary (v1.137.2)
- **PostgreSQL Client** - For direct database connections
- **Migration Scripts** - Copied to `/app/scripts/`
- **Migration Files** - Located in `/app/supabase/migrations/`

### 2. Docker Entrypoint (`scripts/docker-entrypoint.sh`)

Main orchestrator that:
- Starts migrations in the background (non-blocking)
- Launches the Next.js application in parallel
- Monitors both processes
- Handles graceful shutdown
- Reports health status

### 3. Migration Runners

#### Shell Script Runner (`scripts/run-migrations.sh`)
- Uses Supabase CLI directly
- Implements distributed locking via database
- Handles retries and timeouts
- Supports migration verification

#### Node.js Runner (`scripts/migrate.js`)
- Pure JavaScript implementation
- Uses Supabase client library
- Better error handling and logging
- Migration history tracking
- Checksum verification

## Configuration

### Environment Variables

```bash
# Database Configuration
SUPABASE_DB_URL=postgresql://user:pass@host:5432/db
DATABASE_URL=postgresql://user:pass@host:5432/db  # Alternative
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Migration Control
SKIP_MIGRATIONS=false              # Set to true to disable migrations
USE_NODE_MIGRATIONS=true           # Use Node.js runner (default) or shell
MIGRATION_TIMEOUT=300              # Timeout in seconds (default: 5 minutes)
MIGRATION_RETRY_COUNT=3            # Number of retry attempts
MIGRATION_RETRY_DELAY=10           # Delay between retries in seconds
MIGRATION_LOCK_TIMEOUT=60          # Lock acquisition timeout in seconds

# Monitoring
MONITORING_WEBHOOK=https://hooks.slack.com/your-webhook  # Optional

# Application
NODE_ENV=production               # Required for migrations to run
PORT=3000                        # Application port
APP_STARTUP_DELAY=2              # Delay before starting app (seconds)
```

## Migration Execution Flow

```mermaid
graph TD
    A[Container Start] --> B[Docker Entrypoint]
    B --> C{Check Environment}
    C -->|Production/Staging| D[Start Migrations Background]
    C -->|Development| E[Skip Migrations]
    D --> F[Acquire Lock]
    F -->|Success| G[Run Migrations]
    F -->|Failed| H[Wait/Retry]
    G --> I[Release Lock]
    B --> J[Start Next.js App]
    J --> K[Health Check]
    K --> L[Container Ready]
    I --> L
    H --> L
    E --> J
```

## Features

### 1. Non-Blocking Execution
- Migrations run in parallel with app startup
- Application starts immediately
- No container startup delays

### 2. Distributed Lock Management
- Prevents multiple containers from running migrations simultaneously
- Automatic stale lock cleanup
- Lock timeout protection

### 3. Error Resilience
- Continues container startup even if migrations fail
- Retry logic with exponential backoff
- Comprehensive error logging

### 4. Migration History
- Tracks executed migrations
- Prevents duplicate execution
- Checksum verification for integrity

### 5. Monitoring & Logging
- Detailed execution logs
- Optional webhook notifications
- Health check integration

## Database Tables

### Migration Lock Table
```sql
CREATE TABLE public.migration_locks (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    lock_id VARCHAR(255) NOT NULL,
    locked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    locked_by VARCHAR(255) NOT NULL,
    pid INTEGER
);
```

### Migration History Table
```sql
CREATE TABLE public.migration_history (
    id SERIAL PRIMARY KEY,
    version VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    execution_time_ms INTEGER,
    checksum VARCHAR(64),
    executed_by VARCHAR(255),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);
```

## Usage

### Local Development

Migrations are typically not run automatically in development. Use:

```bash
# Run migrations manually
pnpm supabase:migrate

# Or with Docker
docker build -t myapp .
docker run -e NODE_ENV=development -e SKIP_MIGRATIONS=true myapp
```

### Staging/Production

Migrations run automatically on container startup:

```bash
# Deploy to Railway (migrations run automatically)
railway up

# Or with Docker
docker run \
  -e NODE_ENV=production \
  -e SUPABASE_DB_URL=postgresql://... \
  -e NEXT_PUBLIC_SUPABASE_URL=https://... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  myapp
```

### Disable Migrations

To skip migrations for a specific deployment:

```bash
docker run -e SKIP_MIGRATIONS=true myapp
```

### Force Node.js Runner

By default, the Node.js runner is used. To force shell script runner:

```bash
docker run -e USE_NODE_MIGRATIONS=false myapp
```

## Troubleshooting

### Common Issues

1. **Migrations not running**
   - Check NODE_ENV is set to production/staging
   - Verify database URL is configured
   - Ensure migration files exist in `/app/supabase/migrations/`

2. **Lock acquisition timeout**
   - Check for stale locks in `migration_locks` table
   - Increase MIGRATION_LOCK_TIMEOUT if needed
   - Verify database connectivity

3. **Migration failures**
   - Check migration logs: `docker logs <container>`
   - Review `/tmp/migration.log` inside container
   - Verify SQL syntax in migration files

4. **Container startup delays**
   - Migrations run in background, shouldn't delay startup
   - Check health endpoint: `/api/health`
   - Review APP_STARTUP_DELAY setting

### Debugging

```bash
# View migration logs
docker exec <container> cat /tmp/migration.log

# Check migration history
docker exec <container> node -e "
  const { MigrationRunner } = require('./scripts/migrate.js');
  // Check migration status
"

# Manual migration run
docker exec <container> /app/scripts/run-migrations.sh

# Force unlock
docker exec <container> psql $DATABASE_URL -c "
  DELETE FROM public.migration_locks;
"
```

## Best Practices

1. **Migration Files**
   - Name with timestamp prefix: `20231201000000_description.sql`
   - Keep migrations idempotent when possible
   - Test in staging before production

2. **Performance**
   - Migrations run async, don't block startup
   - Use appropriate timeouts for large migrations
   - Monitor execution time in history table

3. **Safety**
   - Always backup database before major migrations
   - Use transactions for multi-statement migrations
   - Test rollback procedures

4. **Monitoring**
   - Configure webhook notifications for production
   - Review migration history regularly
   - Set up alerts for failed migrations

## Migration File Format

```sql
-- supabase/migrations/20231201000000_create_users_table.sql

-- Migration: Create users table
-- Description: Initial user table setup

BEGIN;

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own record" 
    ON public.users 
    FOR SELECT 
    USING (auth.uid() = id);

COMMIT;
```

## Security Considerations

1. **Service Role Key**
   - Required for migrations to bypass RLS
   - Never expose in client-side code
   - Rotate regularly

2. **Database URLs**
   - Use connection pooling for production
   - Implement SSL/TLS connections
   - Restrict IP access where possible

3. **Lock Management**
   - Locks prevent race conditions
   - Automatic cleanup of stale locks
   - Per-container identification

## Performance Optimization

1. **Parallel Execution**
   - Migrations don't block app startup
   - Health checks report readiness
   - Background process management

2. **Caching**
   - Migration history prevents re-execution
   - Checksum verification ensures integrity
   - Skip unchanged migrations

3. **Resource Usage**
   - Minimal memory footprint
   - Timeout protection
   - Graceful failure handling

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Deploy to Production
  env:
    NODE_ENV: production
    SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
  run: |
    docker build -t myapp .
    docker push myapp
    # Migrations run automatically on container start
```

### Railway

```toml
[deploy]
startCommand = "/app/scripts/docker-entrypoint.sh"

[env]
NODE_ENV = "production"
# Migrations run automatically
```

## Rollback Strategy

If migrations fail:

1. **Automatic Recovery**
   - Container continues running
   - Previous schema remains intact
   - Error logged for investigation

2. **Manual Rollback**
   ```sql
   -- Connect to database
   -- Review migration_history table
   -- Manually revert changes if needed
   ```

3. **Version Rollback**
   ```bash
   # Deploy previous container version
   railway deployments rollback
   ```

## Future Improvements

1. **Migration Rollback Support**
   - Down migrations
   - Automatic rollback on failure
   - Version targeting

2. **Blue-Green Deployments**
   - Zero-downtime migrations
   - Schema versioning
   - Gradual rollout

3. **Enhanced Monitoring**
   - Metrics collection
   - Performance tracking
   - Alert automation