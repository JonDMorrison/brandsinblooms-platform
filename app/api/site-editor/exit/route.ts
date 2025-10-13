import { NextResponse } from 'next/server'
import { clearEditModeSession } from '@/src/lib/site-editor/edit-session'

export async function POST() {
  try {
    await clearEditModeSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error exiting edit mode:', error)
    return NextResponse.json(
      { error: 'Failed to exit edit mode' },
      { status: 500 }
    )
  }
}
