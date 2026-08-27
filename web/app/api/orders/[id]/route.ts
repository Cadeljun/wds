import { NextRequest, NextResponse } from 'next/server'
import { verifyUser } from '@/lib/auth'
import { assertObjectAccess, ForbiddenError, NotFoundError } from '@/lib/access-control'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_ORIGINS = [
  'https://wds.com.gh',
  'https://www.wds.com.gh',
  'http://localhost:3000',
]

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: getCorsHeaders(request.headers.get('origin')) })
}

// BEFORE (BROKEN from guide):
// export async function DELETE(req, { params }) {
//   const user = await getUser(req)
//   if (!user) return 401
//   await db.documents.delete({ where: { id: params.id } }) // No ownership check!
//   return success
// }
// Any logged-in user can delete ANY document by ID - IDOR

// AFTER (FIXED):

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    // 1. Authentication - is this a real logged-in user?
    const user = await verifyUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    // 2. Authorization / Object-level access control - is THIS user allowed to touch THIS specific object?
    // This is the check that was missing above - different on every route, requires reasoning about data model
    try {
      await assertObjectAccess(user.id, user.role as any, params.id, 'order', 'view')
    } catch (e) {
      if (e instanceof ForbiddenError) {
        return NextResponse.json({ error: 'Forbidden - Not assigned to this order' }, { status: 403, headers: corsHeaders })
      }
      if (e instanceof NotFoundError) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders })
      }
      throw e
    }

    // Only reaches here if user owns, is assigned to, or is admin for this specific order
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('placeholder')) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders })
      }

      return NextResponse.json({ success: true, order }, { status: 200, headers: corsHeaders })
    }

    // Demo fallback
    const orders = JSON.parse('[]') // In real app from DB
    return NextResponse.json(
      { success: true, order: { id: params.id, message: 'Demo - would fetch from DB with ownership check passed' } },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('GET order error:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500, headers: getCorsHeaders(origin) })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const user = await verifyUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    // FIX: Check object-level access BEFORE mutating
    // This is high-impact - PATCH with no ownership check lets any user write to any record
    try {
      await assertObjectAccess(user.id, user.role as any, params.id, 'order', 'edit')
    } catch (e) {
      if (e instanceof ForbiddenError) {
        return NextResponse.json({ error: 'Forbidden - Not authorized to edit this order' }, { status: 403, headers: corsHeaders })
      }
      if (e instanceof NotFoundError) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders })
      }
      throw e
    }

    const body = await request.json()
    const allowedUpdates = ['status', 'proof_photo_url']
    const updates: any = {}
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    // Validate status enum
    const statusSchema = z.enum(['pending', 'accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled'])
    if (updates.status) {
      const parsed = statusSchema.safeParse(updates.status)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400, headers: corsHeaders })
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('placeholder')) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, order: data }, { status: 200, headers: corsHeaders })
    }

    return NextResponse.json(
      { success: true, message: `Order ${params.id} updated`, updates },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('PATCH order error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500, headers: getCorsHeaders(origin) })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const user = await verifyUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    // FIX: Highest-impact version of IDOR bug - DELETE with no ownership check is scriptable: iterate IDs 1..N, delete everything
    // Must check ownership BEFORE delete
    try {
      await assertObjectAccess(user.id, user.role as any, params.id, 'order', 'delete')
    } catch (e) {
      if (e instanceof ForbiddenError) {
        return NextResponse.json({ error: 'Forbidden - Not authorized to delete this order' }, { status: 403, headers: corsHeaders })
      }
      if (e instanceof NotFoundError) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders })
      }
      throw e
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('placeholder')) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { error } = await supabase.from('orders').delete().eq('id', params.id)

      if (error) throw error

      return NextResponse.json({ success: true, message: `Order ${params.id} deleted` }, { status: 200, headers: corsHeaders })
    }

    return NextResponse.json(
      { success: true, message: `Order ${params.id} deleted (demo)` },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('DELETE order error:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500, headers: getCorsHeaders(origin) })
  }
}
