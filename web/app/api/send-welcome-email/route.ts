import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyInternalSecret, sanitizeHeaderValue, isValidHeaderValue, checkRateLimit } from '@/lib/auth'
import { sanitizeName, sanitizeEmail } from '@/lib/sanitize'

// Schema for welcome email - validates at schema level no CRLF
const welcomeEmailSchema = z.object({
  customerEmail: z
    .string()
    .email()
    .max(254)
    .regex(/^[^\r\n]*$/, 'No line breaks allowed in email'),
  customerName: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[^\r\n]*$/, 'No line breaks allowed in name'),
  courseLink: z
    .string()
    .url()
    .max(500)
    .regex(/^[^\r\n]*$/, 'No line breaks allowed in link'),
})

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m))
}

const ALLOWED_ORIGINS = ['https://wds.com.gh']

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-internal-secret',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: getCorsHeaders() })
}

// BEFORE (BROKEN from guide):
// export default async function handler(req, res) {
//   const { customerEmail, customerName, courseLink } = req.body;
//   await sendEmail({ to: customerEmail, from: 'noreply@example.com', subject: `Welcome, ${customerName}!`, html: `...${courseLink}...` });
//   return res.status(200).json({ sent: true });
// }
// Publicly reachable, no auth, anyone can send branded phishing email from your domain, burn quota, get blacklisted

// AFTER (FIXED):
export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders()
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  // Rate limiting even for internal endpoints
  const rateLimit = checkRateLimit(`welcome-email:${ip}`, 10, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: corsHeaders })
  }

  // FIX 1: Require shared secret header for internal service-to-service calls
  // Fails CLOSED if secret not configured
  if (!verifyInternalSecret(request)) {
    console.warn(`Unauthorized attempt to send welcome email from IP ${ip}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  try {
    const body = await request.json()

    // FIX 2: Zod-validate structured payload, don't trust shape
    const parsed = welcomeEmailSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues }, { status: 400, headers: corsHeaders })
    }

    // FIX 3: Defensive CRLF stripping at email-sending boundary (even though schema already rejects \r\n)
    // Don't rely on validation alone - next person who calls function may skip it
    const safeEmail = sanitizeHeaderValue(sanitizeEmail(parsed.data.customerEmail))
    const safeName = sanitizeHeaderValue(sanitizeName(parsed.data.customerName))
    const safeLink = sanitizeHeaderValue(parsed.data.courseLink)

    if (!isValidHeaderValue(safeEmail) || !isValidHeaderValue(safeName) || !isValidHeaderValue(safeLink)) {
      return NextResponse.json({ error: 'Invalid characters in email fields' }, { status: 400, headers: corsHeaders })
    }

    // FIX 4: Use template that escapes interpolated values, don't string-interpolate raw into HTML
    // Vulnerable: html: `<p>Hi ${customerName}, here's your course: <a href="${courseLink}">${courseLink}</a></p>`
    // Fixed: escapeHtml or template engine
    const emailHtml = `<p>Hi ${escapeHtml(safeName)}, welcome to WDS! Track your delivery here: <a href="${escapeHtml(safeLink)}">${escapeHtml(safeLink)}</a></p>`

    // In production: await sendEmail({ to: safeEmail, from: 'noreply@wds.com.gh', subject: `Welcome, ${safeName}!`, html: emailHtml })

    console.log('Welcome email would be sent (sanitized, auth verified):', { to: safeEmail, name: safeName })

    return NextResponse.json({ sent: true, to: safeEmail }, { status: 200, headers: corsHeaders })
  } catch (error) {
    console.error('Welcome email error:', error)
    // Don't leak internal details
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500, headers: corsHeaders })
  }
}

// Example caller (webhook handler) - must send secret
// await fetch(`${INTERNAL_BASE_URL}/api/send-welcome-email`, {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json',
//     'x-internal-secret': process.env.INTERNAL_API_SECRET!,
//   },
//   body: JSON.stringify({ customerEmail, customerName, courseLink }),
// })
