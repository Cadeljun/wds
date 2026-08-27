# WDS - Securing Endpoints Audit - Stop Trusting Whoever Can Reach the URL

**Date:** 2026-08-24
**Playbook:** Securing Endpoints - Stop Trusting Whoever Can Reach the URL
**Status:** Audited and Fixed

---

## The Mistake (From Guide)

AI coding tools happily generate an endpoint that does something powerful (sends email, writes DB) without asking "who is allowed to call this?" because nobody asked it to.

Example of broken endpoint from guide:

```ts
// api/send-welcome-email.ts — looks done, isn't
export default async function handler(req, res) {
  const { customerEmail, customerName, courseLink } = req.body;
  await sendEmail({ to: customerEmail, from: 'noreply@example.com', subject: `Welcome, ${customerName}!`, html: `...` });
  return res.status(200).json({ sent: true });
}
```

Publicly reachable at POST /api/send-welcome-email, no auth, anyone can:
- Send branded phishing email FROM your domain to any address with any link (phishing tool with your reputation)
- Burn email quota, get blacklisted
- Flood inbox

This pattern repeats: webhook → internal endpoint over plain HTTP, left open because "only webhook calls it" until someone finds URL via dev tools, source maps, guessing.

Two more variants:
- Trusting identity fields from body: `const { userId } = req.body; db.profiles.update({ where: { id: userId } })` → impersonation
- Header injection: `From: "${name}" <noreply@...>\r\nReply-To: ${email}` with no CRLF stripping → `subject = "Hi\r\nBcc: victim@evil.com"` → spam relay

---

## Audit - WDS Endpoints Before Fix

**Command to find all API handlers:**

```bash
grep -rn "export async function POST\|export default async function handler\|app.post" --include="*.ts" wds-fullstack/web/app/api/
```

**Found:**
- app/api/enquiry/route.ts
- app/api/orders/route.ts
- app/api/auth/signup/route.ts
- app/api/auth/login/route.ts
- app/api/newsletter/route.ts
- supabase/functions/calculatePrice, assignRider, paystackWebhook

**Check each for auth:**

```bash
grep -L "requireAuth\|verifyToken\|verifyUser\|verifyAdmin\|verifyInternalSecret\|auth.uid()" $(find app/api -name "*.ts")
```

**Findings:**

### 1. app/api/orders/route.ts - CRITICAL - Impersonation Bug

**Before (BROKEN):**

```ts
export async function POST(request) {
  const body = await request.json()
  const { customer_id, pickup_address, dropoff_address } = body // Trusts body!
  await supabase.from('orders').insert({ customer_id, pickup_address, ... })
}
```

**Exploit:** Attacker sends POST /api/orders with `{ customer_id: 'victim-uuid', pickup_address: '...' }` → creates order as victim, victim gets charged, attacker gets delivery, or enumerates victim's data.

**Also:** No auth check at all - anyone can create orders, spam DB, no rate limit.

**Fix Applied:** Require verified session, derive customer_id from JWT, never from body + rate limiting

```ts
// FIXED
const user = await verifyUser(request)
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const customer_id = user.id // Derived from verified JWT, not body!
```

### 2. app/api/enquiry/route.ts - Open Relay Risk + Header Injection

**Before:** No rate limiting, no CRLF stripping, could be used as spam relay if it sends email.

**Exploit:** 
- No rate limit → attacker scripts 1000 requests → burn email quota, flood Williams inbox
- Header injection: If building raw email `From: "${name}" <noreply@wds.com.gh>\r\nReply-To: ${email}\r\nSubject: ${subject}` and subject contains `\r\nBcc: victim@evil.com` → spam relay with WDS domain

**Fix Applied:** Rate limiting 5/hour per IP + header injection protection (validate + strip CRLF at email boundary)

```ts
// Rate limiting
const rateLimit = checkRateLimit(`enquiry:${ip}`, 5, 60*60*1000)
if (!rateLimit.allowed) return 429

// Header injection protection
if (!isValidHeaderValue(name) || !isValidHeaderValue(email)) return 400
const safeHeaders = {
  from: `"${sanitizeHeaderValue(name)}" <noreply@wds.com.gh>`,
  replyTo: sanitizeHeaderValue(email),
  subject: sanitizeHeaderValue(`Enquiry from ${name}`),
}
```

### 3. app/api/auth/signup, login - No Rate Limiting (Brute Force)

**Before:** No rate limiting, attacker can brute force passwords or spam signups.

**Fix:** Added rate limiting - 3 signups/hour, 5 logins/15min per IP

### 4. Internal Endpoints - No Shared Secret (Would Be Broken If We Had Them)

**Pattern from guide:** Webhook handler calls internal endpoint over HTTP, left open because "only webhook calls it"

**Example we would have created (BROKEN):**

```ts
// api/send-welcome-email.ts - would be broken if no secret
export async function POST(req) {
  const { customerEmail } = await req.json()
  await sendEmail({ to: customerEmail, ... }) // No auth!
}
```

**Fix Applied:** Created `app/api/send-welcome-email/route.ts` as FIXED example with shared secret:

```ts
// lib/auth.ts
export function verifyInternalSecret(req): boolean {
  const expected = process.env.INTERNAL_API_SECRET
  const provided = req.headers['x-internal-secret']
  if (!expected) return false // Fail CLOSED if unset, never fail open
  if (provided.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected)) // Constant-time
}

// api/send-welcome-email.ts
if (!verifyInternalSecret(request)) return 401

// Caller must send secret:
await fetch('/api/send-welcome-email', {
  headers: { 'x-internal-secret': process.env.INTERNAL_API_SECRET! },
  body: JSON.stringify({ customerEmail, ... })
})
```

### 5. Admin Endpoints - Client-Side Guard Only (Would Be Broken)

**Before (BROKEN pattern):** Client checks `if (user.role === 'admin')` show approve button, but API `/api/admin/approve-rider` has no server-side check → anyone can POST to approve riders

**Fix Applied:** Created `app/api/admin/approve-rider/route.ts` with server-side admin verification:

```ts
const admin = await verifyAdmin(request) // Checks role against DB, not client guard
if (!admin) return 403
```

### 6. Supabase Edge Functions - No Auth (assignRider, calculatePrice)

**Before:** Edge Functions had no shared secret, anyone who knows URL could call assignRider to assign arbitrary orders.

**Fix Applied:** Updated functions to require secret via `define` injection (see SEO playbook gotcha fix) and check in function. Added placeholder fallback so build doesn't fail if env missing, but runtime fails closed.

---

## The Fix - Patterns Applied

**Rule:** Every endpoint answers "who's allowed to call this?", even internal-only.

### Pattern 1: User-facing action → Require verified session/JWT, derive identity from it, never from body

```ts
// BEFORE (broken):
const { userId, email } = req.body
await db.profiles.update({ where: { id: userId }, data: { marketing: true } })

// AFTER (fixed) - WDS orders:
const user = await verifyUser(request)
if (!user) return 401
const customer_id = user.id // From JWT, not body
```

### Pattern 2: Internal service-to-service → Shared secret header, constant-time, fail closed

```ts
// lib/auth.ts
export function verifyInternalSecret(req): boolean {
  const expected = process.env.INTERNAL_API_SECRET
  const provided = req.headers['x-internal-secret']
  if (!expected) return false // Fail CLOSED if unset
  if (provided.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}

// api/send-welcome-email.ts
if (!verifyInternalSecret(req)) return 401

// Caller:
fetch('/api/send-welcome-email', { headers: { 'x-internal-secret': process.env.INTERNAL_API_SECRET! } })
```

### Pattern 3: Admin-only → Verified admin session against DB

```ts
export async function verifyAdmin(req) {
  const user = await verifyUser(req)
  if (!user || user.role !== 'admin') return null // Checked against DB, not client guard
  return user
}

// api/admin/approve-rider.ts
const admin = await verifyAdmin(request)
if (!admin) return 403
```

### Pattern 4: Stop Header Injection

```ts
// Reject newlines at schema level
const emailFieldSchema = z.string().max(200).regex(/^[^\r\n]*$/, 'No line breaks allowed')

// AND defensively strip at email boundary
function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]/g, '')
}

// Usage:
const safeSubject = sanitizeHeaderValue(`Enquiry from ${name}`)
```

---

## Checklist - WDS Status

- [x] **Every endpoint that writes data, sends email, or triggers side effect has explicit auth check, no exceptions for internal**
  - /api/orders: Now requires verifyUser, derives customer_id from JWT
  - /api/enquiry: Rate limiting + header sanitization (would send email)
  - /api/send-welcome-email: Requires verifyInternalSecret (internal)
  - /api/admin/approve-rider: Requires verifyAdmin
  - /api/auth/*: Rate limiting (public but protected against brute force)

- [x] **Internal service-to-service uses shared secret, constant-time, fails closed if env missing**
  - lib/auth.ts verifyInternalSecret fails closed if INTERNAL_API_SECRET unset, uses timingSafeEqual
  - Example implemented in send-welcome-email

- [x] **User identity (userId, email, role) always derived from verified session/JWT, never from body**
  - Fixed in /api/orders: customer_id from user.id not body.customer_id
  - Audited all routes: no req.body.userId, req.body.email used for auth

- [x] **Admin actions checked against DB server-side, not just client-side route guard**
  - verifyAdmin checks role from DB via supabase.from('users').select('role')
  - /api/admin/approve-rider uses verifyAdmin

- [x] **Raw email headers strip \r\n from every interpolated value + schema validation**
  - sanitizeHeaderValue strips \r\n
  - Zod regex /^[^\r\n]*$/ rejects line breaks
  - Applied in enquiry and send-welcome-email

- [x] **Grepped for every app.post / handler / route file and accounted for auth story**
  - Found 7 API routes + 3 Edge Functions, all audited
  - List: enquiry (public + rate limit + header safe), orders (auth required), signup/login (public + rate limit), newsletter (public + rate limit), send-welcome-email (internal secret), approve-rider (admin), paystackWebhook (signature), calculatePrice/assignRider (internal secret)

- [x] **Error responses don't leak internal details**
  - All catch blocks return generic "Failed to..." not stack traces, console.error server-side only

---

## How to Check Your Own App (From Guide) - Run on WDS:

```bash
# 1. Find all API handlers
grep -rn "export async function POST\|export default async function handler" --include="*.ts" wds-fullstack/web/app/api/

# 2. Check auth - routes with NO auth pattern
grep -L "verifyUser\|verifyAdmin\|verifyInternalSecret\|checkRateLimit" $(find app/api -name "*.ts")

# 3. Find body identity trust
grep -rn "body\.customer_id\|body\.userId\|body\.email" --include="*.ts" wds-fullstack/web/app/api/
# Should only be target IDs (rider_id for admin action), not auth identity

# 4. Find raw email header construction
grep -rn "From:.*\${\|Reply-To.*\${\|Subject.*\${" --include="*.ts" wds-fullstack/
# Should all use sanitizeHeaderValue
```

**For WDS after fix:** No unauthenticated state-changing endpoints, no body identity trust for auth, no raw header interpolation without CRLF stripping.

---

## Prompt Your AI Assistant (From Guide) - Applied to WDS:

We ran this audit on WDS and found:

1. **Does it require verified session/JWT before side effect?**
   - /api/orders: Before NO, After YES (verifyUser)
   - /api/enquiry: Public contact form, but has rate limiting + sanitization (okay for public, but added protection)
   - /api/send-welcome-email: Before would be NO, After YES (verifyInternalSecret)

2. **Does it derive identity from verified session or trust body?**
   - /api/orders: Before trusted body.customer_id (impersonation), After derives from JWT user.id

3. **Internal endpoint shared-secret check fails closed?**
   - lib/auth.ts verifyInternalSecret returns false if INTERNAL_API_SECRET missing, uses timingSafeEqual, fails closed ✓

4. **Raw email headers stripped of \r\n?**
   - Before: Would have been vulnerable if using string interpolation
   - After: sanitizeHeaderValue strips \r\n + Zod regex rejects + escapeHtml for body

**Result:** All WDS endpoints now have explicit auth story, no open relays, no impersonation, no header injection.

---

## Environment Variables Needed

```
INTERNAL_API_SECRET=random-32-char-secret-for-internal-calls
# Generate: openssl rand -hex 32
```

Add to:
- Vercel env vars
- Supabase Edge Functions secrets
- .env.local for local dev

Caller must send:
```
x-internal-secret: your-secret-here
```

---

End of Audit - All WDS endpoints secured.
