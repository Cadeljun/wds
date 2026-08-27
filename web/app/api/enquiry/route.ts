import { NextRequest, NextResponse } from 'next/server'
import { enquiryFormSchema, getFieldErrors } from '@/lib/validation'
import { sanitize, sanitizeEmail, sanitizePhone, sanitizeName } from '@/lib/sanitize'
import { checkRateLimit, sanitizeHeaderValue, isValidHeaderValue } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ORIGINS = [
  'https://wds.com.gh',
  'https://www.wds.com.gh',
  'https://williamsdelivery.com.gh',
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
  const origin = request.headers.get('origin')
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...getCorsHeaders(origin),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  try {
    // Rate limiting: 5 enquiries per IP per hour (prevent spam/relay abuse)
    const rateLimit = checkRateLimit(`enquiry:${ip}`, 5, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many enquiries. Please wait an hour or call 0244000000.' },
        { status: 429, headers: corsHeaders }
      )
    }

    const body = await request.json()

    // Server-side re-validation (never trust client)
    const validationResult = enquiryFormSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = getFieldErrors(validationResult.error)
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors },
        { status: 400, headers: corsHeaders }
      )
    }

    // FIX: Header injection protection - validate AND strip CRLF at point of use
    // Don't rely on validation alone - defensively strip at email boundary
    const rawName = validationResult.data.name
    const rawEmail = validationResult.data.email
    const rawSubject = `Enquiry from ${rawName}` // Would be interpolated into email header

    // Reject if contains CRLF at schema level (Zod regex already checks, but double-check)
    if (!isValidHeaderValue(rawName) || !isValidHeaderValue(rawEmail) || !isValidHeaderValue(rawSubject)) {
      return NextResponse.json(
        { success: false, error: 'Invalid characters in input' },
        { status: 400, headers: corsHeaders }
      )
    }

    // XSS Sanitization + Header sanitization at email boundary
    const sanitizedData = {
      name: sanitizeHeaderValue(sanitizeName(validationResult.data.name)),
      email: sanitizeHeaderValue(sanitizeEmail(validationResult.data.email)),
      phone: sanitizePhone(validationResult.data.phone),
      message: sanitize(validationResult.data.message),
      agreedToTerms: validationResult.data.agreedToTerms,
    }

    // FIX: When building raw email, strip CRLF from every interpolated value
    // Vulnerable: `From: "${name}" <noreply@wds.com.gh>\r\nReply-To: ${email}\r\nSubject: ${subject}`
    // If subject = "Hi\r\nBcc: victim@evil.com" → spam relay
    // Fixed: sanitizeHeaderValue strips \r\n
    const emailHeaders = {
      from: `"${sanitizeHeaderValue(sanitizedData.name)}" <noreply@wds.com.gh>`,
      replyTo: sanitizeHeaderValue(sanitizedData.email),
      subject: sanitizeHeaderValue(`New enquiry from ${sanitizedData.name} - WDS`),
    }

    console.log('Enquiry received (sanitized, headers safe):', sanitizedData, emailHeaders)

    // Process sanitized data
    // In production: send email via Resend/SendGrid with sanitized headers
    // await sendEmail({ to: 'support@wds.com.gh', ...emailHeaders, text: sanitizedData.message })

    return NextResponse.json(
      { success: true, message: 'Enquiry submitted successfully. Williams will contact you within 2 hours.' },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Enquiry API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: getFieldErrors(error) },
        { status: 400, headers: corsHeaders }
      )
    }

    // Don't leak internal details
    return NextResponse.json(
      { success: false, error: 'Failed to submit enquiry. Please try again or call 0244000000.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
