# Fixing Docker Compose Errors

## Error: "RLIMIT_NOFILE: unbound variable"

The realtime container needs the `RLIMIT_NOFILE` environment variable. This has been fixed by adding:

```yaml
RLIMIT_NOFILE: "65536"
```

## Error: "password authentication failed for user authenticator"

This happens when the database doesn't have the required Supabase roles. The fix involves:

1. **Creating an initialization script** that sets up all required database roles
2. **Mounting this script** in the postgres container

### Steps to Fix in Your Project

1. **Stop and clean up existing containers:**
   ```bash
   docker-compose down -v  # This removes volumes too
   ```

2. **Ensure you have the init script:**
   Check that `supabase/docker/volumes/db/init/00-initial-schema.sql` exists

3. **Start fresh:**
   ```bash
   docker-compose up -d
   ```

The init script creates these required roles:
- `authenticator` (with password 'authenticatorpass')
- `anon`
- `authenticated`
- `service_role`
- `supabase_admin`
- `supabase_auth_admin`
- `supabase_storage_admin`
- `supabase_realtime_admin`

## If Containers Still Exit

1. **Check logs:**
   ```bash
   docker-compose logs -f [service_name]
   ```

2. **Common issues:**
   - Port conflicts (use `lsof -i :[port]` to check)
   - Missing configuration files (kong.yml)
   - JWT secret mismatches

3. **Full reset:**
   ```bash
   docker-compose down -v
   docker system prune -f
   docker-compose pull
   docker-compose up -d
   ```

## Verifying Everything Works

After starting:

```bash
# Check all containers are running
docker-compose ps

# Test API endpoint
curl http://localhost:8000/rest/v1/

# Check Studio
open http://localhost:3000
```