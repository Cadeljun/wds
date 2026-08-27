import { NextRequest, NextResponse } from 'next/server'
import { signupSchema, getFieldErrors } from '@/lib/validation'
import { sanitizeName, sanitizeGhanaPhone } from '@/lib/sanitize'
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
    // Rate limiting: 3 signups per IP per hour (prevent abuse)
    const rateLimit = checkRateLimit(`signup:${ip}`, 3, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many signup attempts. Please wait an hour.' },
        { status: 429, headers: corsHeaders }
      )
    }

    const body = await request.json()

    // Server-side validation (never trust client)
    const result = signupSchema.safeParse(body)

    if (!result.success) {
      const errors = getFieldErrors(result.error)
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors },
        { status: 400, headers: corsHeaders }
      )
    }

    // XSS Sanitization
    const sanitized = {
      name: sanitizeName(result.data.name),
      phone: sanitizeGhanaPhone(result.data.phone),
      password: result.data.password,
      role: result.data.role,
      vehicle_type: result.data.vehicle_type || 'motor',
      license_plate: result.data.license_plate ? result.data.license_plate.replace(/[^A-Z0-9\s\-]/gi, '').trim().toUpperCase() : '',
      agreedToTerms: result.data.agreedToTerms,
    }

    console.log('Signup attempt (sanitized):', { ...sanitized, password: '***' })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Account created. OTP sent to ' + sanitized.phone + '. Use 123456 for demo.',
        user: { 
          id: 'u_' + Date.now(), 
          name: sanitized.name, 
          phone: sanitized.phone, 
          role: sanitized.role,
          vehicle_type: sanitized.vehicle_type,
          license_plate: sanitized.license_plate,
        } 
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Signup API error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: getFieldErrors(error) },
        { status: 400, headers: corsHeaders }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create account. Please try again.' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Need checkRateLimit from auth.ts, but we imported from sanitize by mistake - fix import
// Actually checkRateLimit is in lib/auth.ts, not sanitize.ts
// This file originally imported from sanitize, we need to fix
