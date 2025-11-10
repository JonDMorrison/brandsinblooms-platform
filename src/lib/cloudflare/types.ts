/**
 * Cloudflare API Types and Interfaces
 */

/**
 * Environment configuration for Cloudflare integration
 */
export interface CloudflareConfig {
  apiToken: string;
  zoneId: string;
  accountId: string;
  platformDomain: string;
  proxySubdomain: string;
  workerName: string;
  apiBaseUrl?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  requestsPerSecond?: number;
}

/**
 * SSL certificate status from Cloudflare
 */
export type SslStatus =
  | 'initializing'
  | 'pending_validation'
  | 'deleted'
  | 'pending_issuance'
  | 'pending_deployment'
  | 'pending_deletion'
  | 'pending_expiration'
  | 'expired'
  | 'active'
  | 'initializing_timed_out'
  | 'validation_timed_out'
  | 'issuance_timed_out'
  | 'deployment_timed_out'
  | 'deletion_timed_out'
  | 'pending_cleanup'
  | 'staging_deployment'
  | 'staging_active'
  | 'deactivating'
  | 'inactive'
  | 'backup_issued'
  | 'holding_deployment';

/**
 * SSL validation method
 */
export type SslValidationMethod = 'txt' | 'email' | 'cname';

/**
 * SSL certificate type
 */
export type SslType = 'dv';

/**
 * Custom hostname SSL configuration
 */
export interface CustomHostnameSsl {
  method: SslValidationMethod;
  type: SslType;
  settings?: {
    http2?: 'on' | 'off';
    min_tls_version?: '1.0' | '1.1' | '1.2' | '1.3';
    tls_1_3?: 'on' | 'off';
    ciphers?: string[];
  };
}

/**
 * Ownership verification details from Cloudflare
 */
export interface OwnershipVerification {
  type: 'txt';
  name: string;
  value: string;
}

/**
 * SSL certificate details
 */
export interface SslCertificate {
  id: string;
  status: SslStatus;
  validation_method: SslValidationMethod;
  validation_records?: Array<{
    txt_name?: string;
    txt_value?: string;
    cname_target?: string;
    cname?: string;
    emails?: string[];
  }>;
  bundle_method?: string;
  certificate_authority?: string;
  custom_certificate?: string;
  custom_key?: string;
  expires_on?: string;
  hosts?: string[];
  issuer?: string;
  serial_number?: string;
  signature?: string;
  uploaded_on?: string;
}

/**
 * Custom hostname result from Cloudflare API
 */
export interface CustomHostnameResult {
  id: string;
  hostname: string;
  ssl: SslCertificate;
  custom_origin_server?: string;
  custom_origin_sni?: string;
  status: 'active' | 'pending' | 'active_redeploying' | 'moved' | 'deleted';
  verification_errors?: string[];
  ownership_verification?: OwnershipVerification;
  ownership_verification_http?: {
    http_url: string;
    http_body: string;
  };
  created_at: string;
  updated_at?: string;
}

/**
 * Worker route configuration
 */
export interface WorkerRoute {
  pattern: string;
  script?: string;
  zone_id?: string;
  zone_name?: string;
}

/**
 * Worker route result from Cloudflare API
 */
export interface WorkerRouteResult extends WorkerRoute {
  id: string;
}

/**
 * DNS records for customer to configure
 */
export interface DnsRecordsForCustomer {
  cname: {
    type: 'CNAME';
    name: string;
    value: string;
    ttl: number;
  };
  txt: {
    type: 'TXT';
    name: string;
    value: string;
    ttl: number;
  };
}

/**
 * Generic Cloudflare API response wrapper
 */
export interface CloudflareApiResponse<T> {
  result: T | null;
  success: boolean;
  errors: CloudflareApiError[];
  messages: string[];
  result_info?: {
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
    total_count: number;
  };
}

/**
 * Cloudflare API error
 */
export interface CloudflareApiError {
  code: number;
  message: string;
  error_chain?: CloudflareApiError[];
}

/**
 * Cloudflare error with additional context
 */
export class CloudflareError extends Error {
  constructor(
    message: string,
    public code?: number,
    public errors?: CloudflareApiError[],
    public statusCode?: number
  ) {
    super(message);
    this.name = 'CloudflareError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Custom hostname creation request
 */
export interface CreateCustomHostnameRequest {
  hostname: string;
  ssl?: CustomHostnameSsl;
  custom_origin_server?: string;
  custom_origin_sni?: string;
}

/**
 * Worker route creation request
 */
export interface CreateWorkerRouteRequest {
  pattern: string;
  script: string;
}

/**
 * Service method result
 */
export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Custom hostname creation result
 */
export interface CustomHostnameCreationResult {
  hostnameId: string;
  txtName: string;
  txtValue: string;
  cnameTarget: string;
  sslStatus: SslStatus;
}

/**
 * Worker route creation result
 */
export interface WorkerRouteCreationResult {
  routeId: string;
  pattern: string;
}