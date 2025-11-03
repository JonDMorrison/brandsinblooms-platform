import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createUser, generateTempPassword } from '@/lib/supabase/service-client'
import { getAllUsers, validateEmail, validatePassword } from '@/lib/admin/users'
import { apiSuccess, apiError, ApiResult } from '@/lib/types/api'

/**
 * GET /api/admin/users
 * List all users with search, filtering, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Cookie setting is handled by the response
          },
        },
      }
    )

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError('Authentication required', 'AUTH_REQUIRED', 401)
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return apiError('Admin privileges required', 'ADMIN_REQUIRED', 403)
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || undefined
    const role = searchParams.get('role') as 'user' | 'site_owner' | 'admin' | undefined
    const statusParam = searchParams.get('status')
    const status = statusParam === 'true' ? true : statusParam === 'false' ? false : undefined
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const offset = (page - 1) * limit

    // Fetch users
    const result = await getAllUsers(supabase, {
      search,
      role,
      status,
      limit,
      offset,
    })

    return apiSuccess({
      users: result.users,
      pagination: {
        total: result.total,
        page: result.page,
        per_page: result.per_page,
        total_pages: Math.ceil(result.total / result.per_page),
      },
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return apiError('Failed to fetch users', 'FETCH_ERROR', 500)
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Cookie setting is handled by the response
          },
        },
      }
    )

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError('Authentication required', 'AUTH_REQUIRED', 401)
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return apiError('Admin privileges required', 'ADMIN_REQUIRED', 403)
    }

    // Parse request body
    const body = await request.json()
    const { email, full_name, role = 'user', generate_password = true } = body
    let { password } = body

    // Validate required fields
    if (!email) {
      return apiError('Email is required', 'VALIDATION_ERROR', 400)
    }

    // Validate email format
    if (!validateEmail(email)) {
      return apiError('Invalid email format', 'VALIDATION_ERROR', 400)
    }

    // Generate password if not provided or requested
    if (generate_password || !password) {
      password = generateTempPassword()
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return apiError(
        passwordValidation.message || 'Invalid password',
        'VALIDATION_ERROR',
        400
      )
    }

    // Validate role
    if (!['user', 'site_owner', 'admin'].includes(role)) {
      return apiError('Invalid role', 'VALIDATION_ERROR', 400)
    }

    // Create user using service role client
    const newUser = await createUser({
      email,
      password,
      full_name,
      role,
    })

    return NextResponse.json({
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name,
          role,
        },
        temp_password: generate_password ? password : undefined,
        message: 'User created successfully',
      },
      success: true,
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating user:', error)

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        return apiError('User with this email already exists', 'DUPLICATE_ERROR', 409)
      }
    }

    return apiError('Failed to create user', 'CREATE_ERROR', 500)
  }
}
