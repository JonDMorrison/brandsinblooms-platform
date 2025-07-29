# Supabase CLI Troubleshooting Guide

## Common Issues and Solutions

### 1. Services Won't Start

#### Error: "Docker is not running"
```
Error: Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solution:**
```bash
# Start Docker Desktop or Docker daemon
# On macOS/Windows: Start Docker Desktop
# On Linux:
sudo systemctl start docker

# Verify Docker is running
docker ps
```

#### Error: "Port already in use"
```
Error: port 54321 is already allocated
```

**Solution:**
```bash
# Check what's using the port
lsof -i :54321

# Stop conflicting services
supabase stop

# Or kill the process using the port
kill -9 <PID>

# Start Supabase again
supabase start
```

#### Error: "Failed to pull Docker image"
```
Error: pull access denied for supabase/postgres
```

**Solution:**
```bash
# Update Supabase CLI
npm update -g supabase

# Clear Docker cache and retry
docker system prune -f
supabase start
```

### 2. Database Connection Issues

#### Error: "Database connection failed"
```
Error: failed to connect to postgres://postgres:postgres@localhost:54322/postgres
```

**Possible Causes:**
1. PostgreSQL container not running
2. Wrong connection credentials
3. Port conflicts

**Solution:**
```bash
# Check service status
supabase status

# Restart database service
supabase stop
supabase start

# Connect directly to test
psql "postgres://postgres:postgres@localhost:54322/postgres"
```

#### Error: "Auth schema not found"
```
Error: relation "auth.users" does not exist
```

**Solution:**
```bash
# Reset database to restore auth schema
supabase db reset

# Or manually apply auth migrations
supabase migration up
```

### 3. API Gateway Issues

#### Error: "502 Bad Gateway"
```
HTTP/1.1 502 Bad Gateway
```

**Solution:**
```bash
# Check all services are running
supabase status

# Restart API gateway
supabase stop
supabase start

# Check logs for specific errors
supabase logs api
```

#### Error: "Invalid API key"
```
{"code":401,"message":"Invalid API key"}
```

**Solution:**
```bash
# Verify you're using the correct anon key
supabase status

# Update .env.local with the correct key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Studio Access Issues

#### Error: "Studio won't load"

**Solution:**
```bash
# Check Studio is running
curl http://localhost:54323

# Restart if needed
supabase stop
supabase start

# Check for browser cache issues
# Open Studio in incognito mode
open http://localhost:54323
```

#### Error: "Cannot connect to project"

**Solution:**
```bash
# Verify API is accessible from Studio
curl http://localhost:54321/rest/v1/

# Check Studio logs
supabase logs studio

# Restart if API gateway is down
supabase stop
supabase start
```

### 5. Migration Issues

#### Error: "Migration failed to apply"
```
Error: migration 20231201000000_create_profiles.sql failed
```

**Solution:**
```bash
# Check migration syntax
cat supabase/migrations/20231201000000_create_profiles.sql

# Reset and try again
supabase db reset

# Apply migrations one by one
supabase migration up --version 20231201000000
```

#### Error: "Migration already applied"
```
Error: migration 20231201000000 has already been applied
```

**Solution:**
```bash
# Check migration status
supabase migration list

# Skip if already applied, or rollback first
supabase migration down --version 20231201000001
supabase migration up --version 20231201000000
```

### 6. Edge Functions Issues

#### Error: "Function not found"
```
Error: Function hello-world not found
```

**Solution:**
```bash
# Check function exists
ls supabase/functions/

# Deploy function
supabase functions deploy hello-world

# Check function logs
supabase logs functions
```

### 7. Storage Issues

#### Error: "Storage bucket not accessible"
```
Error: The resource you requested could not be found
```

**Solution:**
```bash
# Check storage service
supabase status

# Reset storage if corrupted
supabase db reset

# Check storage logs
supabase logs storage
```

### 8. Email/Inbucket Issues

#### Error: "Emails not being sent"

**Solution:**
```bash
# Check Inbucket is running
curl http://localhost:54324

# Verify email settings in Studio
open http://localhost:54323

# Check auth service logs
supabase logs auth
```

## Performance Issues

### Slow Startup Times

**Solutions:**
```bash
# Use specific services only
supabase start --ignore-health-check

# Increase Docker resources
# Docker Desktop > Settings > Resources
# Increase CPU and Memory allocation

# Clean up unused Docker resources
docker system prune -f
```

### High Memory Usage

**Solutions:**
```bash
# Stop unused services
supabase stop

# Reduce PostgreSQL memory usage in config.toml
[db]
major_version = 15
max_connections = 100
```

## Configuration Issues

### Wrong Environment Variables

Common mistakes:
```bash
# Wrong (Docker Compose ports)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000

# Correct (Supabase CLI ports)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
```

### Custom Configuration Problems

**Issue:** Custom `config.toml` settings not applying

**Solution:**
```bash
# Restart after config changes
supabase stop
supabase start

# Validate config syntax
supabase status
```

## Debugging Steps

### 1. Check Service Status
```bash
# View all service status
supabase status

# Check specific service health
docker ps | grep supabase
```

### 2. View Logs
```bash
# All services
supabase logs

# Specific services
supabase logs db
supabase logs api
supabase logs auth
supabase logs storage
supabase logs functions
```

### 3. Test Connectivity
```bash
# Test API
curl -H "apikey: YOUR_ANON_KEY" http://localhost:54321/rest/v1/

# Test database
psql "postgres://postgres:postgres@localhost:54322/postgres" -c "SELECT version();"

# Test Studio
open http://localhost:54323
```

### 4. Reset Everything
```bash
# Nuclear option - reset everything
supabase stop --no-backup
docker system prune -f
supabase start
```

## Recovery Procedures

### Recover from Corrupted State

```bash
# 1. Stop all services
supabase stop --no-backup

# 2. Clean Docker resources
docker system prune -f

# 3. Remove Supabase volumes (CAUTION: loses all data)
docker volume ls | grep supabase | awk '{print $2}' | xargs docker volume rm

# 4. Start fresh
supabase start

# 5. Restore from backup if needed
supabase db reset
```

### Backup and Restore

```bash
# Create backup
pg_dump "postgres://postgres:postgres@localhost:54322/postgres" > backup.sql

# Restore backup
psql "postgres://postgres:postgres@localhost:54322/postgres" < backup.sql
```

## Getting Help

### Check CLI Version
```bash
supabase --version
supabase update  # Update if outdated
```

### Enable Debug Mode
```bash
# Set debug flag for verbose output
supabase start --debug

# Or set environment variable
export SUPABASE_DEBUG=true
supabase start
```

### Community Resources

- [Supabase CLI GitHub Issues](https://github.com/supabase/cli/issues)
- [Supabase Discord Community](https://discord.supabase.com)
- [Supabase Documentation](https://supabase.com/docs/guides/cli)

### Reporting Issues

When reporting issues, include:
1. CLI version (`supabase --version`)
2. Operating system
3. Docker version (`docker --version`)
4. Full error message
5. Output of `supabase status`
6. Relevant logs (`supabase logs [service]`)

## Prevention Tips

1. **Regular Updates:** Keep CLI updated with `supabase update`
2. **Resource Monitoring:** Monitor Docker resource usage
3. **Clean Restarts:** Occasionally restart with `supabase stop && supabase start`
4. **Port Management:** Use standard ports to avoid conflicts
5. **Backup Data:** Regular backups of important development data
6. **Version Control:** Keep `supabase/` directory in version control