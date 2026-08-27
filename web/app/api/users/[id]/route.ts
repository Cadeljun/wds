import { NextRequest, NextResponse } from 'next/server'
import { verifyUser } from '@/lib/auth'
import { assertObjectAccess, ForbiddenError, NotFoundError } from '@/lib/access-control'
import { createClient } from '@supabase/supabase-js'

function getCorsHeaders(origin: string | null) {
  const allowed = ['https://wds.com.gh', 'http://localhost:3000']
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin || '') ? origin! : allowed[0],
    'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: getCorsHeaders(request.headers.get('origin')) })
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const corsHeaders = getCorsHeaders(request.headers.get('origin'))

  try {
    const user = await verifyUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })

    try {
      await assertObjectAccess(user.id, user.role as any, params.id, 'user', 'view')
    } catch (e) {
      if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden - Can only view own profile' }, { status: 403, headers: corsHeaders })
      throw e
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('placeholder')) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data, error } = await supabase.from('users').select('*').eq('id', params.id).single()
      if (error || !data) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders })
      return NextResponse.json({ success: true, user: data }, { status: 200, headers: corsHeaders })
    }

    return NextResponse.json({ success: true, user: { id: params.id, message: 'Demo user' } }, { status: 200, headers: corsHeaders })
  } catch (error) {
    console.error('GET user error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500, headers: corsHeaders })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const corsHeaders = getCorsHeaders(request.headers.get('origin'))

  try {
    const user = await verifyUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })

    try {
      await assertObjectAccess(user.id, user.role as any, params.id, 'user', 'edit')
    } catch (e) {
      if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden - Can only edit own profile' }, { status: 403, headers: corsHeaders })
      throw e
    }

    const body = await request.json()
    const allowed = ['full_name', 'phone']
    const updates: any = {}
    for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k]

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('placeholder')) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data, error } = await supabase.from('users').update(updates).eq('id', params.id).select().single()
      if (error) throw error
      return NextResponse.json({ success: true, user: data }, { status: 200, headers: corsHeaders })
    }

    return NextResponse.json({ success: true, message: `User ${params.id} updated`, updates }, { status: 200, headers: corsHeaders })
  } catch (error) {
    console.error('PATCH user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500, headers: corsHeaders })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const corsHeaders = getCorsHeaders(request.headers.get('origin'))

  try {
    const user = await verifyUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })

    try {
      await assertObjectAccess(user.id, user.role as any, params.id, 'user', 'delete')
    } catch (e) {
      if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden - Only admin can delete users or own account' }, { status: 403, headers: corsHeaders })
      throw e
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('placeholder')) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { error } = await supabase.from('users').delete().eq('id', params.id)
      if (error) throw error
      return NextResponse.json({ success: true, message: `User ${params.id} deleted` }, { status: 200, headers: corsHeaders })
    }

    return NextResponse.json({ success: true, message: `User ${params.id} deleted (demo)` }, { status: 200, headers: corsHeaders })
  } catch (error) {
    console.error('DELETE user error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500, headers: corsHeaders })
  }
}
