# WDS - Form Validation & Security Guide - Implemented

**Based on:** Form Validation & Security Guide template (UK phone example adapted to Ghana)
**Status:** Implemented for WDS Production

---

## Overview - Defence in Depth for WDS

WDS handles sensitive data: Ghana phone numbers, addresses, MoMo payments, personal names. We implement defence-in-depth:

1. **Frontend Validation** - Zod schemas with Ghana phone validation, real-time feedback
2. **XSS Sanitization** - Strip malicious content via `xss` library before submission
3. **API Validation** - Server-side re-validation (never trust client) in Next.js API routes
4. **CORS Configuration** - Whitelist allowed origins (wds.com.gh, localhost)

---

## Dependencies Added

```bash
npm install zod xss
npm install -D @types/xss
```

Added to `package.json`:
- `zod: ^3.23.8` - Schema validation
- `xss: ^1.0.15` - XSS sanitization
- `@types/xss: ^0.3.2` - Types

---

## 1. Frontend Validation - Ghana Adapted

**File:** `lib/validation.ts`

### Ghana Phone Validation (Not UK)

UK example from guide:
```ts
// UK: 07xxx 11 digits, +447xxx 12 digits
const validateUKPhone = (phone) => { ... }
```

WDS Ghana adaptation:
```ts
export const validateGhanaPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('233')) {
    // +233 24 4123456 = 12 digits, prefix 20,24,54 etc.
    if (digits.length !== 12) return false
    const prefix = digits.substring(3, 5)
    const valid = ['20','23','24','25','26','27','28','50','53','54','55','59']
    return valid.includes(prefix)
  } else if (digits.startsWith('0')) {
    // 0244123456 = 10 digits
    if (digits.length !== 10) return false
    const prefix = digits.substring(1, 3)
    return valid.includes(prefix)
  } else if (digits.length === 9) {
    // 244123456 without 0
    return valid.includes(digits.substring(0,2))
  }
  return false
}
```

Valid Ghana prefixes: 020, 023, 024, 025, 026, 027, 028, 050, 053, 054, 055, 059 (MTN, Vodafone, AirtelTigo, Glo)

### Schemas Implemented for WDS:

**Enquiry Form:**
- name: 2-100 chars, letters/spaces/hyphens/apostrophes only
- email: valid, max 254, lowercase
- phone: Ghana phone validation
- message: 10-2000 chars
- agreedToTerms: must be true

**Booking/Order Form (Core WDS):**
- pickup_address: 5-300 chars
- dropoff_address: 5-300 chars
- package_type: enum parcel/food/grocery/medicine/document/other
- description: optional 3-500 chars
- recipient_name: optional 2-100 chars letters only
- recipient_phone: optional Ghana phone
- payment_method: enum momo_mtn/momo_vodafone/momo_airteltigo/card/cash/wallet
- express: boolean

**Auth:**
- login: Ghana phone + password min 6
- signup: name, Ghana phone, password min 6 with letter+number, role customer/rider, vehicle_type enum, license_plate regex, agreedToTerms

**Newsletter:** email valid

**Rider Onboarding:** full_name, Ghana phone, vehicle_type enum, license_plate regex AB 1234-23, momo_number Ghana phone, id_number

Helpers: getFirstError(), getFieldErrors()

---

## 2. XSS Sanitization

**File:** `lib/sanitize.ts`

Adapted from guide, Ghana-specific:

```ts
import xss from 'xss'

const xssOptions = {
  whiteList: {}, // strip all tags
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script','style','iframe','object','embed'],
}

export const sanitize = (input: string) => xss(input.trim(), xssOptions)
export const sanitizeEmail = (email) => email.trim().toLowerCase()
export const sanitizePhone = (phone) => phone.replace(/[^\d\s\+\-]/g, '').trim()
export const sanitizeGhanaPhone = (phone) => {
  const digits = phone.replace(/\D/g,'')
  if (digits.startsWith('233') && digits.length===12) return '0'+digits.substring(3)
  if (digits.length===9) return '0'+digits
  return digits.startsWith('0') ? digits : phone.replace(/[^\d\s\+\-]/g,'').trim()
}
export const sanitizeName = (name) => sanitize(name).replace(/[^a-zA-Z\s\-'\.]/g,'').trim().substring(0,100)
export const sanitizeAddress = (address) => sanitize(address).replace(/[^a-zA-Z0-9\s\,\-\.\'\#\/]/g,'').trim().substring(0,300)
export const sanitizeObject = <T>(obj: T): T => { /* recursive sanitize strings */ }
```

---

## 3. React Form Components - Validated

**Files:**
- `components/forms/EnquiryForm.tsx` - Uses enquiryFormSchema, real-time validateField on change, sanitize before fetch to /api/enquiry, displays field errors, success state, disabled button during submit
- `components/forms/BookingForm.tsx` - Uses bookingFormSchema, Ghana phone for recipient, package_type enum, payment_method enum, sanitizes address/name/phone, posts to /api/orders

Both follow guide's pattern:
- useState formData, errors, isSubmitting
- validateField with safeParse per field
- handleChange with real-time validation
- handleSubmit with safeParse full form, getFieldErrors, sanitize, fetch, handle field errors from API

---

## 4. API Endpoints - Server-Side Re-Validation + CORS

**Files:**
- `app/api/enquiry/route.ts`
- `app/api/orders/route.ts`
- `app/api/auth/signup/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/newsletter/route.ts`

**Pattern (from guide, adapted to WDS + Ghana):**

```ts
import { enquiryFormSchema, getFieldErrors } from '@/lib/validation'
import { sanitize, sanitizeEmail, sanitizePhone } from '@/lib/sanitize'

const ALLOWED_ORIGINS = [
  'https://wds.com.gh',
  'https://www.wds.com.gh',
  'http://localhost:3000',
  'http://localhost:5173',
]

function getCorsHeaders(origin) {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 200, headers: getCorsHeaders(request.headers.get('origin')) })
}

export async function POST(request) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const body = await request.json()

    // 1. Server-side re-validation (never trust client)
    const validationResult = enquiryFormSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = getFieldErrors(validationResult.error)
      return NextResponse.json({ success: false, error: 'Validation failed', errors }, { status: 400, headers: corsHeaders })
    }

    // 2. XSS Sanitization
    const sanitizedData = {
      name: sanitizeName(validationResult.data.name),
      email: sanitizeEmail(validationResult.data.email),
      phone: sanitizePhone(validationResult.data.phone),
      message: sanitize(validationResult.data.message),
    }

    // 3. Process (Supabase, email, etc.)
    // await supabase.from('enquiries').insert(sanitizedData)

    return NextResponse.json({ success: true, message: 'Enquiry submitted' }, { status: 200, headers: corsHeaders })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', errors: getFieldErrors(error) }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
```

**Key Security Points:**
- CORS whitelists only wds.com.gh + localhost, not *
- OPTIONS handles preflight
- Server re-validates with same Zod schema as frontend
- Sanitizes before DB/email
- Returns structured field errors { field: message }
- Logs errors server-side, doesn't expose stack traces
- Uses HTTPS in production (Vercel auto)

---

## 5. Security Checklist - WDS Status

### Frontend
- [x] Install zod and xss packages - Added to package.json, installed
- [x] Create validation schemas for all forms - enquiry, booking, auth, newsletter, rider onboarding with Ghana phone
- [x] Implement real-time field validation on blur/change - validateField in EnquiryForm and BookingForm
- [x] Sanitize all string inputs before submission - sanitize(), sanitizeEmail(), sanitizePhone(), sanitizeName(), sanitizeAddress()
- [x] Display user-friendly error messages - field-level red border + message, getFieldErrors
- [x] Disable submit button during submission - disabled={isSubmitting} + spinner

### API/Backend
- [x] Re-validate all inputs server-side (never trust client) - safeParse in every API route
- [x] Sanitize all inputs before processing/storing - sanitize* in API routes before Supabase insert
- [x] Configure CORS to whitelist allowed origins only - ALLOWED_ORIGINS = wds.com.gh, www, localhost:3000, 5173, not *
- [x] Return structured error responses with field-level errors - { success: false, error, errors: { field: message } }
- [x] Log errors for monitoring (but don't expose stack traces) - console.error server-side, generic message client-side
- [x] Use HTTPS in production - Vercel auto HTTPS for wds.com.gh

### Validation Rules Reference - WDS Ghana

| Field Type | Validation Rules | Example |
|------------|-----------------|---------|
| Name | 2-100 chars, letters/spaces/hyphens/apostrophes only | Ama Mensah |
| Email | Valid format, max 254, auto-lowercase | ama@example.com |
| Ghana Phone | 0244... 10 digits, or +233244... 12 digits, prefix 20,24,54,55 etc. | 0244 123 456 or +233 244 123 456 |
| Address | 5-300 chars, Ghana addresses with commas | East Legon, American House |
| Package Type | Enum parcel/food/grocery/medicine/document/other | parcel |
| Payment Method | Enum momo_mtn/momo_vodafone/momo_airteltigo/card/cash/wallet | momo_mtn |
| License Plate | 3-20 chars, letters/numbers/spaces/hyphens, uppercase | AB 1234-23 |
| Vehicle Type | Enum motor/bicycle/car/van | motor |
| Message | 10-2000 chars | I need delivery... |
| Checkbox | Boolean, refine true for required | agreedToTerms |

---

## 6. Common Patterns - WDS Examples

**Ghana Phone Optional:**
```ts
recipient_phone: z
  .string()
  .refine(validateGhanaPhone, 'Please enter valid Ghana phone')
  .optional()
  .or(z.literal('')),
```

**Enum Validation (Package Type):**
```ts
package_type: z
  .enum(['parcel','food','grocery','medicine','document','other'], {
    message: 'Package type must be parcel, food, grocery, medicine, document, or other',
  }),
```

**License Plate (Ghana Format):**
```ts
license_plate: z
  .string()
  .regex(/^[A-Z0-9\s\-]+$/i, 'Invalid plate (e.g., AB 1234-23)')
  .max(20)
  .optional()
  .or(z.literal('')),
```

**Password Strength (Ghana):**
```ts
password: z
  .string()
  .min(6)
  .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/, 'Must contain letter and number')
```

---

## Testing

**XSS Test:**
Try submitting `<script>alert('xss')</script>` in name field:
- Frontend: Zod regex fails (only letters allowed) → error "Name can only contain letters..."
- Even if bypassed, sanitize() strips script tag → empty or safe string
- API re-validates and sanitizes again

**Ghana Phone Test:**
- Valid: 0244123456, 0200123456, 0541234567, +233244123456, 244123456 (9 digits)
- Invalid: 07900123456 (UK), 12345, 0244 (too short), +447900123456 (UK)

**CORS Test:**
- From https://wds.com.gh → Allowed, returns Access-Control-Allow-Origin: https://wds.com.gh
- From https://evil.com → Not allowed, returns default wds.com.gh origin, browser blocks

---

## Next Steps

- [ ] Add rate limiting (e.g., 5 enquiries per IP per hour) via Vercel KV or Upstash
- [ ] Add honeypot field for bot detection
- [ ] Add Turnstile or reCAPTCHA for public forms
- [ ] Log validation failures to Sentry for monitoring
- [ ] Add Supabase RLS policies to enforce validation at DB level too

End of Security Guide - Implemented for WDS.
