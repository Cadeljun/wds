import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'

// ===========================================
// INTERNAL SECRET VERIFICATION
// For service-to-service calls (webhook → internal endpoint)
// Fails CLOSED if secret not configured - never fail open
// ===========================================
export function verifyInternalSecret(request: Request): boolean {
  const expected = process.env.INTERNAL_API_SECRET
  const provided = request.headers.get('x-internal-secret')

  if (!expected) {
    console.error('INTERNAL_API_SECRET not configured - failing closed')
    return false // Fail CLOSED if unset, never fail open
  }

  if (typeof provided !== 'string') return false
  if (provided.length !== expected.length) return false

  try {
    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  } catch {
    return false
  }
}

// ===========================================
// USER SESSION VERIFICATION
// Derive identity from verified JWT, never from body
// ===========================================
export async function verifyUser(request: Request): Promise<{ id: string; email?: string; phone?: string; role?: string } | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    // Fallback for demo without Supabase - check Authorization header for demo token
    // In production, this should ALWAYS use Supabase Auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return null
    
    // Demo: Bearer token is base64 encoded JSON with user info (NOT secure, demo only)
    // In production: Use supabase.auth.getUser(token)
    try {
      const token = authHeader.replace('Bearer ', '')
      if (token.startsWith('demo-')) {
        // demo-customer-0244123456
        const parts = token.split('-')
        const role = parts[1] || 'customer'
        const phone = parts.slice(2).join('-') || '0244123456'
        return { id: `u_${phone}`, phone, role }
      }
    } catch {}
    return null
  }

  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return null

    const token = authHeader.replace('Bearer ', '')
    if (!token) return null

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      console.error('Auth verification failed:', error)
      return null
    }

    // Get role from public.users table
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role, phone, full_name')
      .eq('id', data.user.id)
      .single()

    return {
      id: data.user.id,
      email: data.user.email,
      phone: (profile as any)?.phone,
      role: (profile as any)?.role || 'customer',
    }
  } catch (error) {
    console.error('verifyUser error:', error)
    return null
  }
}

// ===========================================
// ADMIN VERIFICATION
// Check role against database, not just client-side guard
// ===========================================
export async function verifyAdmin(request: Request): Promise<{ id: string; role: string } | null> {
  const user = await verifyUser(request)
  if (!user) return null

  if (user.role !== 'admin') {
    console.warn(`Admin access denied for user ${user.id} with role ${user.role}`)
    return null
  }

  return { id: user.id, role: user.role }
}

// ===========================================
// HEADER INJECTION PROTECTION
// Strip CRLF from email header values
// ===========================================
export function sanitizeHeaderValue(value: string): string {
  if (!value || typeof value !== 'string') return ''
  // Remove \r and \n to prevent header injection
  // e.g., subject = "Hi\r\nBcc: victim@evil.com" → "HiBcc: victim@evil.com"
  return value.replace(/[\r\n]/g, '').trim()
}

export function isValidHeaderValue(value: string): boolean {
  // Reject if contains CRLF
  return !/[\r\n]/.test(value)
}

// ===========================================
// RATE LIMITING (Simple in-memory for demo, use Upstash/Redis in prod)
// ===========================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxRequests: number = 5, windowMs: number = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const key = identifier
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count }
}

// Cleanup old entries every 5 mins
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Array.from(rateLimitMap.entries()).forEach(([key, record]) => {
      if (now > record.resetTime) rateLimitMap.delete(key)
    })
  }, 5 * 60 * 1000)
}
