/**
 * API endpoint for deleting files from R2 storage
 * Used by EventStorageAdapter to clean up uploaded files
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/lib/database/types';
import { s3Client } from '@/lib/storage/s3-client';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { handleError } from '@/lib/types/error-handling';
import { apiError, apiSuccess } from '@/lib/types/api';

interface DeleteRequest {
  key: string;
  siteId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with cookies for auth
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignore cookie setting errors in API routes
            }
          },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        apiError('Unauthorized', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as DeleteRequest;
    const { key, siteId } = body;

    if (!key || !siteId) {
      return NextResponse.json(
        apiError('Missing required fields: key and siteId', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Verify user has access to this site
    const { data: siteAccess, error: siteError } = await supabase
      .from('sites')
      .select('id')
      .eq('id', siteId)
      .eq('owner_id', user.id)
      .single();

    if (siteError || !siteAccess) {
      return NextResponse.json(
        apiError('Access denied to this site', 'FORBIDDEN'),
        { status: 403 }
      );
    }

    // Delete from R2
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    await s3Client.send(deleteCommand);

    return NextResponse.json(
      apiSuccess({ deleted: true }),
      { status: 200 }
    );
  } catch (error) {
    const handled = handleError(error);
    console.error('Failed to delete file from R2:', handled);

    return NextResponse.json(
      apiError('Failed to delete file', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}