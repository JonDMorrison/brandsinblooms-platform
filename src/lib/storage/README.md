# Storage Infrastructure - S3/CDN Migration

This directory contains the storage infrastructure for migrating from Supabase Storage to S3-compatible storage (MinIO for development, Cloudflare R2 for production).

## Architecture

The storage system provides a unified interface that supports:

- **Development**: MinIO (S3-compatible) running in Docker
- **Production**: Cloudflare R2 (S3-compatible)
- **Fallback**: Existing Supabase Storage patterns

## Files

### `/s3-client.ts`
S3 client configuration with environment-based setup:
- MinIO configuration for local development
- Cloudflare R2 configuration for production
- Environment validation and error handling
- Path-style routing for MinIO compatibility

### `/index.ts`
Storage abstraction layer providing:
- Unified upload/delete/URL generation interface
- File validation using existing STORAGE_CONFIG patterns
- Batch operations support
- Site-based file organization
- Proper TypeScript typing

### `docker-compose.minio.yml`
MinIO setup for local development:
- MinIO server on ports 9000 (API) and 9001 (console)
- Automatic bucket creation (`local-images`)
- Public access policy configuration
- Persistent storage volume

## Setup

### Development Setup

1. **Start MinIO**:
   ```bash
   docker-compose -f docker-compose.minio.yml up -d
   ```

2. **Environment Variables** (add to `.env.local`):
   ```env
   # MinIO (Development)
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_ENDPOINT=http://localhost:9000
   MINIO_REGION=us-east-1
   MINIO_BUCKET_NAME=local-images
   NEXT_PUBLIC_CDN_URL=http://localhost:9000
   ```

3. **Access MinIO Console**: http://localhost:9001
   - Username: `minioadmin`
   - Password: `minioadmin`

### Production Setup

1. **Cloudflare R2 Configuration**:
   ```env
   R2_ACCOUNT_ID=your-cloudflare-r2-account-id
   R2_ACCESS_KEY_ID=your-r2-access-key-id
   R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
   R2_BUCKET_NAME=your-production-bucket-name
   NEXT_PUBLIC_CDN_URL=https://your-cdn-domain.com
   ```

## Usage

### Basic File Upload

```typescript
import { uploadFile } from '@/lib/storage';

const result = await uploadFile(file, siteId, productId);
if (result.success) {
  console.log('File uploaded:', result.data?.url);
} else {
  console.error('Upload failed:', result.error);
}
```

### Multiple File Upload

```typescript
import { uploadMultipleFiles } from '@/lib/storage';

const result = await uploadMultipleFiles(
  files, 
  siteId, 
  productId,
  (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  }
);
```

### File Management

```typescript
import { deleteFile, fileExists, generateSignedUrl } from '@/lib/storage';

// Check if file exists
const exists = await fileExists('path/to/file.jpg');

// Delete file
const deleteResult = await deleteFile('path/to/file.jpg');

// Generate signed URL for private access
const signedUrlResult = await generateSignedUrl('path/to/file.jpg', 3600);
```

## File Organization

Files are organized with site isolation:

```
bucket/
├── site1/
│   ├── images/
│   │   ├── products/
│   │   │   └── product-id/
│   │   │       └── image_timestamp_random.jpg
│   │   └── general_timestamp_random.jpg
│   └── documents/
└── site2/
    └── images/
        └── ...
```

## Migration Strategy

The storage abstraction allows for gradual migration:

1. **Phase 1**: New uploads use S3 storage
2. **Phase 2**: Migrate existing Supabase files
3. **Phase 3**: Remove Supabase storage dependencies

## Error Handling

All storage operations return consistent `StorageResult<T>` objects:

```typescript
interface StorageResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
```

Errors are handled using the existing `handleError` utility from `/lib/types/error-handling.ts`.

## Configuration Validation

The system validates storage configuration on startup and provides fallbacks for graceful degradation when storage is misconfigured.

## Testing

- Use `isStorageConfigured()` to check if storage is properly set up
- MinIO provides a local S3-compatible environment for testing
- Console access at http://localhost:9001 for debugging

## Performance Considerations

- Files are served directly from CDN URLs
- Signed URLs are generated only when needed
- Metadata is stored with files for efficient operations
- Batch operations minimize API calls