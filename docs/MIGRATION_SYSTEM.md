# Automated Migration System

## Overview

The Brands in Blooms platform now includes a robust automated migration system that runs database migrations in parallel with application startup, ensuring zero-downtime deployments while maintaining data consistency.

## Architecture

```mermaid
graph LR
    A[Container Start] --> B[Docker Entrypoint]
    B --> C[Migration Process]
    B --> D[Next.js App]
    C --> E[Distributed Lock]
    E --> F[Execute Migrations]
    F --> G[Update History]
    D --> H[Health Check]
    H --> I[Migration Status]
```

## Key Features

### ✅ **Non-blocking Execution**
- Migrations run in parallel with Next.js startup
- Application is available immediately
- Zero impact on startup time

### ✅ **Fault Tolerance**
- Migration failures don't crash the container
- Comprehensive error logging and retry logic
- Graceful degradation with health status reporting

### ✅ **Race Condition Safety**
- Distributed locking prevents concurrent execution
- Multiple container instances can start safely
- Automatic cleanup of stale locks

### ✅ **Production Ready**
- Resource-constrained execution (memory/CPU limits)
- Structured JSON logging for monitoring
- Health check integration with migration status

### ✅ **Flexible Configuration**
- Environment variable control
- Support for both Node.js and shell-based runners
- Configurable timeouts and retry logic

## Components

### 1. **Migration Runners**

#### Node.js Runner (`scripts/migrate.js`)
- **Recommended**: Pure JavaScript implementation
- Uses Supabase JavaScript client
- Better error handling and retry logic
- Checksum verification for migration integrity

#### Shell Runner (`scripts/run-migrations.sh`)
- **Fallback**: Uses Supabase CLI directly
- Simpler implementation
- Good for debugging and manual execution

### 2. **Docker Entrypoint (`scripts/docker-entrypoint.sh`)**
- Orchestrates parallel execution
- Handles process lifecycle and signals
- Provides structured logging
- Creates health check markers

### 3. **Health Check Integration**
- Enhanced `/api/health` endpoint
- Real-time migration status reporting
- HTTP status codes reflect system health
- Detailed error information for debugging

### 4. **Database Infrastructure**
- `migration_locks` table for distributed coordination
- `migration_history` table for tracking executed migrations
- `exec_sql` function for secure SQL execution via RPC
- Row-level security policies for access control

## Configuration

### Required Environment Variables

```bash
# Database Connection (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Optional: Alternative database URL
SUPABASE_DB_URL=postgresql://postgres:password@localhost:5432/postgres
```

### Optional Configuration

```bash
# Migration Control
MIGRATION_ENABLED=true              # Enable/disable migrations (default: true)
USE_NODE_MIGRATIONS=true            # Use Node.js runner vs shell (default: true)
SKIP_MIGRATIONS=false               # Force skip migrations (default: false)

# Timing Configuration
MIGRATION_TIMEOUT=300               # Migration timeout in seconds (default: 5 minutes)
MIGRATION_RETRY_COUNT=3             # Number of retry attempts (default: 3)
MIGRATION_RETRY_DELAY=5             # Delay between retries in seconds (default: 5)
MIGRATION_MAX_MEMORY_MB=256         # Memory limit for migration process (default: 256MB)

# Environment Control
NODE_ENV=production                 # Migrations only run in production/staging
```

## Usage

### Automatic Deployment
The system works automatically when:
1. `NODE_ENV=production` or `NODE_ENV=staging`
2. Required environment variables are set
3. Migration files exist in `supabase/migrations/`

### Manual Execution
```bash
# Using Node.js runner
node scripts/migrate.js --run

# Using shell runner
./scripts/run-migrations.sh

# Check migration status
curl http://localhost:3000/api/health
```

### Monitoring
```bash
# View container logs
docker logs <container-id>

# Check migration status file
docker exec <container-id> cat /tmp/check_migration_status.sh

# Monitor health endpoint
curl -s http://localhost:3000/api/health | jq '.migrations'
```

## Migration Files

### Naming Convention
```
supabase/migrations/YYYYMMDDHHMMSS_description.sql
```

### Best Practices
- **Idempotent**: Use `IF NOT EXISTS`, `IF EXISTS` clauses
- **Atomic**: Keep migrations small and focused
- **Reversible**: Consider rollback scenarios
- **Tested**: Validate on staging before production

### Example Migration
```sql
-- 20250813120000_add_user_preferences.sql

-- Add user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policy
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences" ON user_preferences
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
```

## Health Check Response

```json
{
  "status": "ok",
  "timestamp": "2025-08-13T15:30:00.000Z",
  "service": "brands-in-blooms",
  "environment": "production",
  "version": "1.0.0",
  "uptime": 3600,
  "migrations": {
    "status": "completed",
    "lastChecked": "2025-08-13T15:30:00.000Z"
  }
}
```

### Migration Status Values
- `completed`: All migrations executed successfully
- `running`: Migrations currently in progress
- `failed`: Migration execution failed (details in logs)
- `unknown`: Status could not be determined

## Troubleshooting

### Migrations Not Running
1. **Check Environment**: Verify `NODE_ENV=production` or `staging`
2. **Check Credentials**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
3. **Check Files**: Verify migration files exist in `supabase/migrations/`
4. **Check Logs**: Review container logs for error messages

### Migration Failures
1. **Check Database Access**: Verify connection to Supabase
2. **Check Permissions**: Ensure service role has necessary permissions
3. **Check SQL Syntax**: Validate migration file syntax
4. **Check Dependencies**: Ensure migrations are in correct order

### Performance Issues
1. **Memory Limits**: Increase `MIGRATION_MAX_MEMORY_MB` if needed
2. **Timeout Issues**: Increase `MIGRATION_TIMEOUT` for large migrations
3. **Lock Contention**: Check for stale locks in `migration_locks` table

### Manual Recovery
```bash
# Clear stale locks
DELETE FROM migration_locks WHERE locked_at < NOW() - INTERVAL '5 minutes';

# Check migration history
SELECT * FROM migration_history ORDER BY executed_at DESC;

# Force re-run specific migration (use with caution)
DELETE FROM migration_history WHERE filename = 'specific_migration.sql';
```

## Security Considerations

### Database Access
- Uses `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- Never expose service role key client-side
- Rotate keys regularly following security best practices

### Container Security
- Runs as non-root user (`nextjs`)
- Resource-constrained execution
- No sensitive data in container logs

### Migration Safety
- Distributed locks prevent race conditions
- Checksum verification ensures file integrity
- Row-level security on migration tables

## Performance Impact

### Resource Usage
- **Memory**: ~50MB for migration process
- **CPU**: Low priority (`nice -n 10`)
- **Startup**: Zero delay (parallel execution)
- **Network**: Minimal (only Supabase API calls)

### Scaling Considerations
- Designed for multi-container deployments
- Lock-based coordination prevents conflicts
- Automatic cleanup of stale processes

## Railway Deployment

The system is optimized for Railway deployment:

```dockerfile
# Dockerfile automatically includes:
# - Supabase CLI installation
# - Migration scripts and entrypoint
# - Proper signal handling with tini
```

### Railway Environment Variables
Set in Railway dashboard:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

## Development vs Production

### Development (Local)
- Migrations handled by `supabase start`
- Local Supabase instance
- Manual migration application

### Production (Railway)
- Automated migration on container startup
- Remote Supabase instance
- Distributed lock coordination

## Monitoring and Observability

### Structured Logging
All components produce structured JSON logs:
```json
{
  "timestamp": "2025-08-13T15:30:00.000Z",
  "level": "info",
  "message": "Migration completed successfully",
  "component": "migration-runner",
  "instanceId": "container-123-456",
  "duration": 1234,
  "filename": "20250813120000_add_feature.sql"
}
```

### Health Monitoring
- HTTP health checks via `/api/health`
- Migration status included in response
- Appropriate HTTP status codes (200/503)

### Error Tracking
- Comprehensive error logging
- Retry attempt tracking
- Failure reason reporting

## Future Enhancements

### Planned Improvements
- [ ] Webhook notifications for migration events
- [ ] Migration rollback automation
- [ ] Performance metrics collection
- [ ] Blue-green deployment integration
- [ ] Database schema drift detection

### Configuration Extensions
- [ ] Custom migration runners
- [ ] Environment-specific migration paths
- [ ] Advanced retry strategies
- [ ] Migration preview/dry-run mode

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review container logs for detailed error information
3. Consult the Supabase documentation for database-specific issues
4. Contact the development team for system-specific problems