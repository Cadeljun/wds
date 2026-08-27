import { NextRequest, NextResponse } from 'next/server'
import { loginSchema, getFieldErrors } from '@/lib/validation'
import { sanitizeGhanaPhone } from '@/lib/sanitize'
import { checkRateLimit } from '@/lib/auth'
import { z } from 'zod'

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
    // Rate limiting: 5 login attempts per IP per 15 mins
    const rateLimit = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please wait 15 minutes.' },
        { status: 429, headers: corsHeaders }
      )
    }

    const body = await request.json()

    const result = loginSchema.safeParse(body)

    if (!result.success) {
      const errors = getFieldErrors(result.error)
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors },
        { status: 400, headers: corsHeaders }
      )
    }

    const sanitized = {
      phone: sanitizeGhanaPhone(result.data.phone),
      password: result.data.password,
    }

    console.log('Login attempt (sanitized):', { phone: sanitized.phone, password: '***' })

    const demoUsers = [
      { phone: '0244123456', password: '123456', role: 'customer', name: 'Ama Mensah' },
      { phone: '0244987654', password: '123456', role: 'rider', name: 'Kwame Asare' },
      { phone: '0244000000', password: 'admin123', role: 'admin', name: 'Williams Admin' },
    ]

    const user = demoUsers.find(u => u.phone === sanitized.phone && u.password === sanitized.password)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone or password. Demo: Customer 0244123456 / 123456, Rider 0244987654 / 123456, Admin 0244000000 / admin123' },
        { status: 401, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Login successful', user },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Login API error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: getFieldErrors(error) },
        { status: 400, headers: corsHeaders }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to login. Please try again.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
