import { NextRequest, NextResponse } from 'next/server'
import { newsletterSchema, getFieldErrors } from '@/lib/validation'
import { sanitizeEmail } from '@/lib/sanitize'
import { checkRateLimit } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ORIGINS = [
  'https://wds.com.gh',
  'https://www.wds.com.gh',
  'http://localhost:3000',
]

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    const rateLimit = checkRateLimit(`newsletter:${ip}`, 3, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many subscriptions. Please wait an hour.' },
        { status: 429, headers: corsHeaders }
      )
    }

    const body = await request.json()
    const result = newsletterSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: getFieldErrors(result.error) },
        { status: 400, headers: corsHeaders }
      )
    }

    const email = sanitizeEmail(result.data.email)

    console.log('Newsletter signup (sanitized):', email)

    return NextResponse.json(
      { success: true, message: 'Subscribed to WDS updates!' },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Newsletter API error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: getFieldErrors(error) },
        { status: 400, headers: corsHeaders }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to subscribe.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
