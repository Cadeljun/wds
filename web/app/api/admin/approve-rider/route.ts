import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAdmin, checkRateLimit } from '@/lib/auth'
import { getFieldErrors } from '@/lib/validation'

const approveRiderSchema = z.object({
  rider_id: z.string().uuid().or(z.string().min(1)), // Allow demo IDs like u_123
  approved: z.boolean(),
})

const ALLOWED_ORIGINS = ['https://wds.com.gh']

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: getCorsHeaders(request.headers.get('origin')) })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  try {
    const rateLimit = checkRateLimit(`admin-approve:${ip}`, 20, 60000)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: corsHeaders })
    }

    // FIX: Admin-only action → require verified admin session checked server-side against DB, not just client-side route guard
    // Before (BROKEN): Client-side if (user.role === 'admin') show button, but API had no check - anyone could POST /api/admin/approve-rider
    // After (FIXED): Verify admin session server-side
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin only. Requires verified admin session.' },
        { status: 403, headers: corsHeaders }
      )
    }

    const body = await request.json()

    // Validate payload
    const parsed = approveRiderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', errors: getFieldErrors(parsed.error) },
        { status: 400, headers: corsHeaders }
      )
    }

    // FIX: Don't trust rider_id from body for authorization, but it's the target of action - that's okay as long as admin is verified
    // What would be BROKEN: trusting userId from body to authorize: const { userId } = req.body; if (userId === admin) approve
    // FIXED: Derive admin identity from verified session, use body only for target ID
    const { rider_id, approved } = parsed.data

    console.log(`Admin ${admin.id} ${approved ? 'approved' : 'rejected'} rider ${rider_id}`)

    // In production: Update Supabase
    // const supabase = createClient(...)
    // await supabase.from('riders').update({ is_approved: approved }).eq('id', rider_id)

    return NextResponse.json(
      { success: true, message: `Rider ${rider_id} ${approved ? 'approved' : 'rejected'} by admin ${admin.id}` },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Approve rider error:', error)
    return NextResponse.json(
      { error: 'Failed to approve rider' },
      { status: 500, headers: corsHeaders }
    )
  }
}
