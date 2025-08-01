import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database/types';

export type ApiRequest<T = unknown> = NextRequest & {
  json(): Promise<T>;
};

export type ApiResponse<T = unknown> = NextResponse<T>;

export type ApiHandler<TRequest = unknown, TResponse = unknown> = (
  req: ApiRequest<TRequest>
) => Promise<ApiResponse<TResponse>>;

// Type webhook payloads
export interface StripeWebhookPayload {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

// Common API response types
export interface ApiSuccessResponse<T = unknown> {
  data: T;
  success: true;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  success: false;
}

export type ApiResult<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Helper to create typed responses
export function apiSuccess<T>(data: T): ApiResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data, success: true });
}

export function apiError(
  error: string,
  code?: string,
  status = 500
): ApiResponse<ApiErrorResponse> {
  return NextResponse.json({ error, code, success: false }, { status });
}