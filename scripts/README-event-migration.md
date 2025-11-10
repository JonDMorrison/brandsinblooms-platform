# Event Storage Migration Scripts

## Quick Start

This directory contains scripts for migrating event files from Supabase Storage to Cloudflare R2 + CDN.

### Prerequisites

1. Set up your environment variables:
```bash
# Required for migration
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # Must be service role, not anon key

R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
NEXT_PUBLIC_CDN_URL=...
```

2. Apply the migration tracking schema:
```bash
pnpm supabase:migrate
```

### Migration Commands

```bash
# Check current status
pnpm migrate:event-storage:status

# Preview migration (dry run)
pnpm migrate:event-storage:dry

# Run migration with verbose logging
pnpm migrate:event-storage:verbose

# Run full migration
pnpm migrate:event-storage

# Resume failed migrations
pnpm migrate:event-storage --resume

# Migrate specific site only
pnpm migrate:event-storage --site-id=your-site-id
```

## Files

- `migrate-event-storage.ts` - Main migration script
- `check-migration-status.ts` - Status checking utility
- `migration-log.json` - Created during migration (gitignored)

## Migration Process

1. **Always start with a dry run** to preview changes
2. **Test with a small batch** to verify configuration
3. **Run the full migration** during off-peak hours
4. **Monitor progress** using the status command
5. **Verify CDN access** after migration
6. **Keep Supabase files** as backup (don't delete immediately)

## Troubleshooting

### Common Issues

1. **Authentication errors**: Ensure you're using `SUPABASE_SERVICE_ROLE_KEY`, not the anon key
2. **R2 upload failures**: Verify R2 credentials and bucket configuration
3. **Network timeouts**: Reduce batch size with `--batch-size=10`
4. **Missing files**: Check `migration-log.json` for failed items

### Recovery

If migration fails:
```bash
# Check what failed
cat migration-log.json | jq '.[] | select(.status == "failed")'

# Resume migration (retries failed items)
pnpm migrate:event-storage --resume
```

## Support

For detailed documentation, see: `/docs/event-storage-migration.md`