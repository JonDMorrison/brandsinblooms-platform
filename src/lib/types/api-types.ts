/**
 * API Request and Response Types for Site Generation
 *
 * Defines type-safe interfaces for the site generation API endpoints.
 */

import type { BusinessInfo, JobStatus } from './site-generation-jobs';

/**
 * Request body for POST /api/sites/generate
 * Initiates async site generation
 */
export interface GenerateSiteRequest extends Partial<BusinessInfo> {
  /** Required: Main prompt describing the site to generate */
  prompt: string;
  /** Required: Business name */
  name: string;
  /** Optional: Industry/business type */
  industry?: string;
  /** Optional: Business location */
  location?: string;
  /** Optional: Business description */
  description?: string;
  /** Optional: Contact email */
  email?: string;
  /** Optional: Contact phone */
  phone?: string;
  /** Optional: Existing website URL */
  website?: string;
  /** Optional: Additional details */
  additionalDetails?: Record<string, unknown>;
}

/**
 * Response for POST /api/sites/generate
 * Returns immediately with job ID (202 Accepted)
 */
export interface GenerateSiteResponse {
  /** Job ID for tracking generation status */
  jobId: string;
  /** Current job status (will be 'pending' initially) */
  status: 'pending' | 'processing';
  /** URL to check job status */
  statusUrl: string;
  /** Estimated completion time in milliseconds */
  estimatedTime: number;
  /** Human-readable message */
  message: string;
}

/**
 * Token usage information
 */
export interface TokenUsageInfo {
  /** Number of tokens in the prompt */
  promptTokens: number;
  /** Number of tokens in the completion */
  completionTokens: number;
  /** Total tokens used */
  totalTokens: number;
}

/**
 * Response for GET /api/sites/generate/[jobId]
 * Returns current status of the generation job
 */
export interface GenerationStatusResponse {
  /** Job ID */
  jobId: string;
  /** Current job status */
  status: JobStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Created site ID (only when status is 'completed') */
  siteId?: string;
  /** Created site name (only when status is 'completed') */
  siteName?: string;
  /** URL to access the created site (only when status is 'completed') */
  siteUrl?: string;
  /** Error message (only when status is 'failed') */
  errorMessage?: string;
  /** Error code (only when status is 'failed') */
  errorCode?: string;
  /** Total cost of generation in cents */
  costCents?: number;
  /** Token usage details */
  tokenUsage?: TokenUsageInfo;
  /** Job creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Completion timestamp (only when status is 'completed' or 'failed') */
  completedAt?: string;
}

/**
 * Error codes for generation API
 */
export enum GenerationErrorCode {
  // Client errors (4xx)
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_PROMPT = 'INVALID_PROMPT',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  ADMIN_REQUIRED = 'ADMIN_REQUIRED',
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  JOB_OWNERSHIP_VIOLATION = 'JOB_OWNERSHIP_VIOLATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  LLM_API_FAILURE = 'LLM_API_FAILURE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONTENT_MODERATION_FAILED = 'CONTENT_MODERATION_FAILED',
  SITE_CREATION_FAILED = 'SITE_CREATION_FAILED',
  GENERATION_TIMEOUT = 'GENERATION_TIMEOUT',
}

/**
 * Error response structure
 */
export interface GenerationErrorResponse {
  /** Error message */
  error: string;
  /** Error code */
  code: GenerationErrorCode | string;
  /** Whether the operation was successful (always false for errors) */
  success: false;
  /** Additional error details (optional) */
  details?: string;
}