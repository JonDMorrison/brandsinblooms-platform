/**
 * Cloudflare Service Layer Exports
 */

// Main service
export { CloudflareService } from './service';

// Client (for advanced usage)
export { CloudflareClient } from './client';

// Configuration
export {
  getCloudflareConfig,
  isCloudflareConfigured,
  getProxyUrl,
  getWorkerPattern,
} from './config';

// Types
export type {
  CloudflareConfig,
  SslStatus,
  SslValidationMethod,
  SslType,
  CustomHostnameSsl,
  OwnershipVerification,
  SslCertificate,
  CustomHostnameResult,
  WorkerRoute,
  WorkerRouteResult,
  DnsRecordsForCustomer,
  CloudflareApiResponse,
  CloudflareApiError,
  CreateCustomHostnameRequest,
  CreateWorkerRouteRequest,
  ServiceResult,
  CustomHostnameCreationResult,
  WorkerRouteCreationResult,
} from './types';

// Errors
export {
  CloudflareError,
  RateLimitError,
} from './types';

export {
  parseCloudflareErrors,
  formatCloudflareErrors,
  isRateLimitError,
  isCloudflareError,
  isCloudflareErrorCode,
  isAlreadyExistsError,
  isNotFoundError,
  isRetryableError,
  CloudflareErrorCodes,
} from './errors';