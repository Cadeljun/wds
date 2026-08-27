import { NextRequest, NextResponse } from 'next/server'
import { verifyUser } from '@/lib/auth'
import { assertObjectAccess, ForbiddenError, NotFoundError } from '@/lib/access-control'
import { createClient } from '@supabase/supabase-js'

function getCorsHeaders(origin: string | null) {
  const allowed = ['https://wds.com.gh', 'http://localhost:3000']
  const isAllowed = origin && allowed.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
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
      await assertObjectAccess(user.id, user.role as any, params.id, 'rider', 'view')
    } catch (e) {
      if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders })
      if (e instanceof NotFoundError) return NextResponse.json({ error: 'Rider not found' }, { status: 404, headers: corsHeaders })
      throw e
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('placeholder')) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: rider, error } = await supabase.from('riders').select('*, users!inner(full_name, phone, role)').eq('id', params.id).single()
      if (error || !rider) return NextResponse.json({ error: 'Rider not found' }, { status: 404, headers: corsHeaders })
      return NextResponse.json({ success: true, rider }, { status: 200, headers: corsHeaders })
    }

    return NextResponse.json({ success: true, rider: { id: params.id, message: 'Demo rider' } }, { status: 200, headers: corsHeaders })
  } catch (error) {
    console.error('GET rider error:', error)
    return NextResponse.json({ error: 'Failed to fetch rider' }, { status: 500, headers: corsHeaders })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const corsHeaders = getCorsHeaders(request.headers.get('origin'))

  try {
    const user = await verifyUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })

    try {
      await assertObjectAccess(user.id, user.role as any, params.id, 'rider', 'edit')
    } catch (e) {
      if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden - Can only edit own rider profile' }, { status: 403, headers: corsHeaders })
      throw e
    }

    const body = await request.json()
    const allowed = ['status', 'current_lat', 'current_lng', 'vehicle_type']
    const updates: any = {}
    for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k]

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('placeholder')) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data, error } = await supabase.from('riders').update(updates).eq('id', params.id).select().single()
      if (error) throw error
      return NextResponse.json({ success: true, rider: data }, { status: 200, headers: corsHeaders })
    }

    return NextResponse.json({ success: true, message: `Rider ${params.id} updated`, updates }, { status: 200, headers: corsHeaders })
  } catch (error) {
    console.error('PATCH rider error:', error)
    return NextResponse.json({ error: 'Failed to update rider' }, { status: 500, headers: corsHeaders })
  }
}
