/**
 * Enable Edit Mode API
 * Activates edit mode for the current user on the current site
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { setEditModeSession } from '@/src/lib/site-editor/edit-session'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get site ID from request body or headers
    const body = await request.json()
    const siteId = body.siteId || request.headers.get('x-site-id')

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      )
    }

    // Set edit mode session
    const success = await setEditModeSession(user.id, siteId)

    if (!success) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this site' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Edit mode enabled'
    })
  } catch (error) {
    console.error('Error enabling edit mode:', error)
    return NextResponse.json(
      { error: 'Failed to enable edit mode' },
      { status: 500 }
    )
  }
}
