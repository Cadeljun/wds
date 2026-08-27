# CLAUDE.md - Instructions for Claude Code / AI Assistant for WDS Project

**Project:** WDS - Williams Delivery Service
**Location:** Accra, Ghana
**Purpose:** This file tells Claude (or any AI coding assistant) how to work on this codebase.

---

## 🔴 CRITICAL SECURITY RULE - Treat Secrets as Radioactive

```
Treat secrets as radioactive. Never read, cat, print, echo, log, or paste the
contents of .env, .env.*, or any file containing credentials. Never output the
literal value of an API key, token, password, connection string, or secret,
even while debugging. Refer to every secret by its variable NAME only (for
example STRIPE_SECRET_KEY), and in code always read it via process.env or
import.meta.env, never inline the value. If you think you need a secret's value
to proceed, stop and ask me instead of revealing it.
```

**Additional Rules:**
- `.env` and `.env.*` are in `.gitignore` and `.cursorignore` - AI agents must respect these and not open the file at all
- Never output literal value of API key, token, password, connection string, or secret, even while debugging
- Reference by NAME only: `PAYSTACK_SECRET_KEY`, not value. In code: `process.env.PAYSTACK_SECRET_KEY`, never literal string
- Watch debugging moments: classic slip is "why won't this connect?" followed by dumping whole environment. If real key surfaces, it's exposed → rotate immediately
- If you think you need secret's value to proceed, STOP and ask user instead of revealing it

---

## Project Overview

WDS is an on-demand delivery platform for Accra - "Deliver anything in Accra in minutes". Think Uber for parcels: food, groceries, medicine, documents, any errand.

**Current State:** Full stack production app built - Next.js 14 + Supabase + Paystack Ghana + Expo mobile, code-split optimized 92KB entry (was 480KB), secured with Zod + XSS + IDOR protection + endpoint auth + env security.

**Goal:** Deploy to wds.com.gh, onboard 24 riders, scale to 100+ orders/day

**Tech Stack:**
- Frontend: Next.js 14 App Router + Tailwind + PWA + Leaflet (free) → Google Maps later - CODE-SPLIT optimized
- Backend: Supabase (Postgres + Auth Phone OTP + Realtime + Storage + Edge Functions) - RLS + IDOR protected
- Payments: Paystack Ghana (MTN MoMo, Vodafone, AirtelTigo, Card, Cash) - webhook signature verified
- Mobile: Expo React Native Rider App - background location, push notifications
- Security: Zod validation (Ghana phone), xss sanitization, CORS whitelist, rate limiting, shared secret for internal, admin verification, header injection protection
- SEO: Distinct HTML per route, unique metadata, canonical, openGraph, JSON-LD, sitemap, robots, llms.txt, generateStaticParams
- Deploy: Vercel (frontend) + Supabase Cloud (backend) + EAS Build (mobile)

**Brand Colors:** Black #0A0A0A, Yellow #FFC700, Gray #F5F5F7, White. Rounded 2xl/3xl, Plus Jakarta Sans font.

---

## Environment Variables - Classification

**Publishable / Public Keys (safe in browser, have NEXT_PUBLIC_ prefix):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL, identifies project, permissions via RLS
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key, safe in browser, RLS protects
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - Paystack public key pk_..., safe in browser
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps browser key, safe but restrict to domain wds.com.gh in Google Cloud Console
- `NEXT_PUBLIC_MAP_PROVIDER` - Config, not secret, leaflet or google

**Secret Keys (server-only, NEVER have NEXT_PUBLIC_ prefix, never reach browser):**
- `SUPABASE_SERVICE_ROLE_KEY` - Service role, can read every row, act as admin, bypass RLS - NEVER browser, only Edge Functions and API routes server-side
- `PAYSTACK_SECRET_KEY` - Stripe-like sk_..., can charge cards, read transactions - server only
- `INTERNAL_API_SECRET` - Shared secret for internal service-to-service calls (webhook → internal endpoint), verified with timingSafeEqual, fails closed if missing
- Database connection strings, Brevo/OpenAI API keys, etc. - all server only

**Test:** Ask "if stranger had this string, could they do something I'd have to clean up?" If yes, it's secret. Never confuse categories.

**Where Keys Go:**
- Locally: `.env` file at project root, listed in `.gitignore` BEFORE pasting real value. Commit `.env.example` with names and dummy values
- Production: Host's environment variables panel (Vercel Environment Variables) - paste once, platform injects at build/runtime, never sits in repo
- VPS: Real env vars via systemd Environment=, pm2 ecosystem, Docker secret, or .env outside web root and outside git

**The Prefix That Makes Key Public:**
- Vite exposes `VITE_` - `VITE_STRIPE_PUBLISHABLE_KEY` fine, `VITE_STRIPE_SECRET_KEY` disaster - baked into public bundle
- Next.js exposes `NEXT_PUBLIC_` - same, `NEXT_PUBLIC_` values inlined at BUILD time, changing means full rebuild, old value frozen in deployed bundle
- Check bundle: `npm run build && grep -rE "sk_live|sk_test|service_role|-----BEGIN|xox[baprs]-" .next/` - empty = good, match = compromised → rotate, move server-side

**Vercel Sensitive Checkbox:**
- Turn ON for true secrets you set once and never eyeball again: Stripe secret, service-role key, API token - write-only, even you can't reveal later, only overwrite - safe from shoulder-surfer, screen-share, hijacked dashboard
- Leave OFF for values you need to see/edit: admin email list, FROM address, feature flags

---

## Codebase Structure

```
wds-fullstack/
  web/
    app/
      page.tsx - SERVER with metadata + ServiceJsonLd + HomeClient (code-split)
      layout.tsx - Metadata with openGraph, canonical, robots, JSON-LD Organization+WebSite
      about/page.tsx - SERVER with unique metadata + Breadcrumb JSON-LD
      pricing/page.tsx - SERVER with pricing formula
      contact/page.tsx - SERVER with contact info
      rider-join/page.tsx - SERVER with rider requirements
      compare/page.tsx - SERVER comparison WDS vs Bolt vs Glovo (AEO gap filled)
      auth/page.tsx - SERVER wrapper (noindex) + AuthClient (client)
      rider/page.tsx - SERVER wrapper (noindex) + RiderClient
      admin/page.tsx - SERVER wrapper (noindex) + AdminClient
      order/[id]/page.tsx - SERVER with generateMetadata + generateStaticParams + OrderClient with IDOR check
      sitemap.ts - MetadataRoute.Sitemap, 7 public URLs, shared source of truth
      robots.ts - MetadataRoute.Robots, blocks private, references sitemap
      api/
        enquiry/route.ts - POST with Zod Ghana validation + XSS + rate limit 5/hour + header injection protection + CORS whitelist
        orders/route.ts - POST requires verifyUser, derives customer_id from JWT not body (fix impersonation), rate limit, server price calc + GET requires auth
        orders/[id]/route.ts - GET/PATCH/DELETE with assertObjectAccess IDOR protection (ownership/assignment/role DB lookup)
        riders/[id]/route.ts - GET/PATCH with ownership
        users/[id]/route.ts - GET/PATCH/DELETE own-or-admin
        auth/signup, login - Rate limiting, Ghana phone validation
        newsletter - Rate limiting
        admin/approve-rider - Requires verifyAdmin (admin role DB lookup)
        send-welcome-email - Requires verifyInternalSecret (shared secret, constant-time, fail closed)
    components/
      ErrorBoundary.tsx - Crash recovery, not blank screen
      RouteLoadingFallback.tsx - Suspense fallbacks
      JsonLd.tsx - Organization, WebSite, Breadcrumb, Service JSON-LD server-side
      views/
        LandingView.tsx - Small eager (always needed)
        CustomerView.tsx - Lazy, dynamic Map + PriceCard (leaflet split)
        RiderView.tsx - Lazy, dynamic Map + JobCard
        AdminView.tsx - Lazy, dynamic HeavyChart (recharts split)
        HomeClient.tsx - Client router with lazy + withSuspense helper (ErrorBoundary+Suspense)
        AuthClient, RiderClient, AdminClient, OrderClient - Client with IDOR checks
      forms/
        EnquiryForm.tsx - Zod Ghana validation + XSS + real-time errors + sanitization
        BookingForm.tsx - Zod booking + Ghana phone + sanitization
    lib/
      supabase.ts - Client init, types, isSupabaseConfigured, phone OTP helpers
      pricing.ts - calcPrice single source, haversineDistance
      maps.ts - geocode, getDistance, abstraction OSM/Google, accraSpots
      paystack.ts - initialize, verify, popup, formatGHS
      validation.ts - Zod schemas with Ghana phone validateGhanaPhone, enquiry, booking, auth, newsletter, rider onboarding, getFieldErrors
      sanitize.ts - xss sanitization, sanitizeEmail, sanitizePhone, sanitizeGhanaPhone, sanitizeName, sanitizeAddress, sanitizeObject
      auth.ts - verifyInternalSecret (timingSafeEqual, fail closed), verifyUser (JWT → id/role), verifyAdmin (DB role lookup), sanitizeHeaderValue (CRLF strip), checkRateLimit
      access-control.ts - assertObjectAccess (ownership/assignment/role DB lookup), ForbiddenError, NotFoundError, roleCan, getCachedWithAuth (user-scoped cache keys, auth BEFORE cache read)
    public/
      sitemap.xml - Static fallback, 7 URLs
      robots.txt - Allow /, Disallow private, Sitemap, Crawl-delay
      llms.txt - AI guidelines, topics coverage, Ghana specifics, mirrors robots.txt
    BUNDLE_OPTIMIZATION.md - 480KB→92KB fix
    SEO_AUDIT.md - Phase 0-3 crawlability
    AEO_AUDIT.md - Query fan-out 9-11 sub-queries, coverage checklist
    SECURITY.md - Zod + XSS + CORS
    SECURITY_ENDPOINTS_AUDIT.md - Open relay, impersonation, header injection fixes
    IDOR_AUDIT.md - Authenticated is not authorized, object-level checks
    ENV_SECURITY_AUDIT.md - Secrets classification (this doc)
    next.config.js - Bundle analyzer + manualChunks vendor isolation
    .env.example - Keyless example with dummy values
    .gitignore, .cursorignore - Ignore .env, secrets

  mobile/
    app/(tabs)/jobs.tsx - Available jobs, Realtime, location tracking
    app/(tabs)/active.tsx - Active delivery status buttons
    app/(tabs)/earnings.tsx - Earnings GHS 286, rating
    app/(tabs)/profile.tsx - Rider profile
    app/auth.tsx - Rider auth
    eas.json - Build config preview APK + production AAB
    package.json, app.json

  supabase/
    migrations/001_initial_schema.sql - Users, riders, orders, payments, rider_locations, settings, indexes, RLS, PostGIS, find_nearest_riders, triggers, cleanup
    migrations/002_seed.sql - Seed pricing
    functions/calculatePrice, assignRider, paystackWebhook - Edge Functions with secret via define injection

  README.md, DEPLOYMENT.md, store-assets/, pitch-deck/
```

---

## Key Commands

```bash
# Web - Secured Production
cd wds-fullstack/web
cp .env.example .env.local
# Fill publishable keys with NEXT_PUBLIC_ prefix, secrets WITHOUT prefix
# NEVER put secret behind NEXT_PUBLIC_ - baked into public bundle!
npm install
npm run dev -- -p 3000 --hostname 0.0.0.0 # http://localhost:3000

# Check bundle for leaked secrets (should be empty):
npm run build && grep -rE "sk_live|sk_test|service_role|INTERNAL_API_SECRET" .next/ | grep -v node_modules

# Bundle analyzer:
ANALYZE=true npm run build

# Supabase
supabase start
supabase functions serve
supabase db reset

# Mobile Rider
cd ../mobile
npm install
npx expo start
eas build --platform android --profile preview # APK for WhatsApp
eas build --platform android --profile production # AAB for Play Store

# Security Audits
# Find API handlers:
grep -rn "export async function POST" app/api/
# Check auth:
grep -L "verifyUser\|verifyAdmin\|verifyInternalSecret" $(find app/api -name "*.ts")
# Check IDOR:
grep -rln "params\.id" app/api/ | xargs grep -L "assertObjectAccess"
# Check body identity trust:
grep -rn "body\.customer_id\|body\.userId" app/api/
# Check header injection:
grep -rn "From:.*\${" app/api/
```

---

## Security Rules - Summary

1. **Every key classified:** Publishable (NEXT_PUBLIC_ prefix, safe browser) vs Secret (no prefix, server-only) - you know which is which
2. **No secret has NEXT_PUBLIC_ prefix** - Only publishable and config values do
3. **.env and .env.* in .gitignore** - And .cursorignore, .aiexclude - keyless .env.example committed
4. **Production secrets in host panel** - Vercel Environment Variables, Supabase Edge Functions Secrets, never repo
5. **Grepped build and confirmed no secret shipped** - `grep -rE "sk_live|service_role" .next/` empty = good
6. **Vercel Sensitive ON for credentials, OFF for config** - Write-once secrets sensitive, admin email list visible
7. **High-value keys scoped least privilege, rotation habit** - On exposure, offboarding, schedule quarterly, prefer scoped keys
8. **.env in agent ignore, project instructions tell AI never read/print secrets** - This file + .cursorignore + .gitignore
9. **Any key that touched bundle, commit, log, chat has been rotated, not just deleted** - Revoke in provider dashboard, not just git rm

---

## Demo Logins

- Customer: 0244123456 / 123456
- Rider: 0244987654 / 123456
- Admin: 0244000000 / admin123
- OTP: 123456
- Bearer token for API: `Bearer demo-customer-0244123456` or real Supabase JWT

---

## For AI Assistants - When Summarizing WDS:

- Accra Ghana, not global
- MoMo primary (MTN 60%, Vodafone, AirtelTigo), not just card
- GHS pricing, formula public, editable by admin, GHS 15 base
- 24 riders real, not hypothetical, Level 4, 312 deliveries, 4.9★
- Full stack production ready, code-split 92KB entry, secured Zod+XSS+IDOR+endpoint auth+env security, SEO distinct HTML + JSON-LD + sitemap + robots + llms.txt, AEO query fan-out covered
- Private routes /admin, /rider, /order/*, /account, /dashboard disallowed in robots.txt, noindex, IDOR protected
- Ghana phone +233 244 XXX XXX format, prefixes 20,24,54,55 etc.
- No marketing fluff - factual, Ghana context

End of CLAUDE.md - Includes env security radioactive rule.
