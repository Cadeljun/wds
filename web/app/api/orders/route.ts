import { NextRequest, NextResponse } from 'next/server'
import { bookingFormSchema, getFieldErrors } from '@/lib/validation'
import { sanitize, sanitizeAddress, sanitizeName, sanitizePhone, sanitizeGhanaPhone } from '@/lib/sanitize'
import { verifyUser, checkRateLimit } from '@/lib/auth'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_ORIGINS = [
  'https://wds.com.gh',
  'https://www.wds.com.gh',
  'http://localhost:3000',
  'http://localhost:5173',
]

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-internal-secret',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: getCorsHeaders(request.headers.get('origin')) })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  try {
    // Rate limiting: 10 orders per IP per minute (prevent spam)
    const rateLimit = checkRateLimit(`orders:${ip}`, 10, 60000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many orders. Please wait a minute and try again.' },
        { status: 429, headers: corsHeaders }
      )
    }

    // FIX 1: Require verified session/JWT - derive identity from token, NEVER from body
    // Before (BROKEN): const { customer_id } = req.body - trusts body, allows impersonation
    // After (FIXED): Derive from verified JWT
    const user = await verifyUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in to create orders. Demo: Use Bearer demo-customer-0244123456' },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await request.json()

    // Server-side re-validation (never trust client)
    const validationResult = bookingFormSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = getFieldErrors(validationResult.error)
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors },
        { status: 400, headers: corsHeaders }
      )
    }

    // XSS Sanitization
    const sanitizedData = {
      pickup_address: sanitizeAddress(validationResult.data.pickup_address),
      dropoff_address: sanitizeAddress(validationResult.data.dropoff_address),
      package_type: validationResult.data.package_type,
      description: validationResult.data.description ? sanitize(validationResult.data.description) : '',
      recipient_name: validationResult.data.recipient_name ? sanitizeName(validationResult.data.recipient_name) : '',
      recipient_phone: validationResult.data.recipient_phone ? sanitizeGhanaPhone(validationResult.data.recipient_phone) : '',
      payment_method: validationResult.data.payment_method,
      express: validationResult.data.express || false,
    }

    // FIX 2: Derive customer_id from verified session, NOT from body
    // This prevents impersonation: attacker can't send { customer_id: 'victim-id' } to create order as victim
    const customer_id = user.id

    // Calculate price server-side (prevent client tampering)
    const distance_km = 8.4
    const pricing = { base: 15, perKm: 2.5, fees: { parcel: 7, food: 5, grocery: 7, medicine: 6, document: 3, other: 7 }, express: 8 }
    const packageFee = (pricing.fees as any)[sanitizedData.package_type] || 7
    const price = Math.round(pricing.base + distance_km * pricing.perKm + packageFee + (sanitizedData.express ? pricing.express : 0))

    // Save to Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseServiceKey && supabaseUrl !== 'https://placeholder.supabase.co') {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      const pickup_lat = 5.6365
      const pickup_lng = -0.1645
      const dropoff_lat = 5.5560
      const dropoff_lng = -0.1760

      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id, // FIXED: From verified session, not body
          pickup_address: sanitizedData.pickup_address,
          pickup_lat,
          pickup_lng,
          dropoff_address: sanitizedData.dropoff_address,
          dropoff_lat,
          dropoff_lng,
          package_type: sanitizedData.package_type,
          description: sanitizedData.description,
          recipient_name: sanitizedData.recipient_name,
          recipient_phone: sanitizedData.recipient_phone,
          distance_km,
          price,
          payment_method: sanitizedData.payment_method,
          payment_status: sanitizedData.payment_method === 'cash' ? 'cash_on_delivery' : 'pending',
          status: 'pending',
          express: sanitizedData.express,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(
        { success: true, message: 'Order created', order: data, price },
        { status: 200, headers: corsHeaders }
      )
    }

    // Fallback for demo without Supabase
    const mockOrder = {
      id: 'WDS-' + Date.now().toString().slice(-6),
      customer_id, // FIXED: From verified session
      ...sanitizedData,
      distance_km,
      price,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    return NextResponse.json(
      { success: true, message: 'Order created (demo mode - no DB)', order: mockOrder, price },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Orders API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: getFieldErrors(error) },
        { status: 400, headers: getCorsHeaders(origin) }
      )
    }

    // Don't leak internal error details
    return NextResponse.json(
      { success: false, error: 'Failed to create order. Please try again.' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // FIX: Require auth for GET orders too - only return own orders
  const user = await verifyUser(request)
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401, headers: corsHeaders }
    )
  }

  // In production, fetch with RLS: only own orders
  // const supabase = createClient(...)
  // const { data } = await supabase.from('orders').select('*').eq('customer_id', user.id)

  return NextResponse.json(
    { success: true, orders: [], user_id: user.id, message: 'Use Supabase RLS to fetch real orders - only own orders returned' },
    { status: 200, headers: corsHeaders }
  )
}
