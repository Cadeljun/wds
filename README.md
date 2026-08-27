# WDS - Williams Delivery Service - Full Stack Production App

**Stack:** Next.js 14 + Supabase + Paystack Ghana + Expo + Leaflet/Google Maps + Tailwind
**Status:** Production Ready - All-in-One Build
**Location:** Accra, Ghana

---

## What's Built (All-in-One)

This is the **full stack production codebase** for WDS, not a demo.

### Web App (Next.js 14 App Router) - `/web`
- **Customer:** Landing + booking + live price + MoMo/Card/Cash + tracking with map
- **Auth:** Phone OTP via Supabase Auth (OTP 123456 in dev), role selection (customer/rider), rider onboarding (vehicle, plate)
- **Rider:** Available jobs (nearest first), accept, update status (picked_up → on_the_way → delivered), earnings, background location tracking (ready)
- **Admin:** KPIs, live orders, rider fleet, all users, pricing settings, export CSV
- **Maps:** Leaflet OSM free wrapper (lib/maps.ts) → swap to Google Maps by changing env
- **Payments:** Paystack Ghana lib (lib/paystack.ts) - MoMo MTN/Vodafone/AirtelTigo, Card, Cash
- **Realtime:** Supabase Realtime for orders + rider_locations

### Mobile App (Expo React Native) - `/mobile`
- Rider app: Jobs, Active, Earnings, Profile tabs
- Uses same Supabase backend
- Background location tracking (expo-location)
- Push notifications (expo-notifications)
- Build APK: `eas build --platform android`

### Backend (Supabase) - `/supabase`
- **Schema:** users, riders, orders, payments, rider_locations, settings (with RLS policies)
- **Seed:** 24 riders, sample orders
- **Edge Functions:** calculatePrice (validates price server-side), assignRider (nearest rider), paystackWebhook (verifies signature, updates payment)
- **Auth:** Phone OTP, admin email+password

---

## Quick Start

### 1. Supabase Setup (15 mins)

```bash
# Create project at supabase.com
# Go to SQL Editor, run:
supabase/migrations/001_initial_schema.sql

# Enable Realtime for orders and rider_locations in Database → Realtime

# Set env in Supabase Dashboard → Edge Functions → Secrets:
PAYSTACK_SECRET_KEY=sk_test_xxx
FCM_SERVER_KEY=xxx (optional)

# Deploy functions:
supabase functions deploy calculatePrice
supabase functions deploy assignRider
supabase functions deploy paystackWebhook
```

### 2. Web App

```bash
cd web
cp .env.example .env.local
# Fill in:
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_MAP_PROVIDER=leaflet # or google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza... (optional)

npm install
npm run dev # http://localhost:3000
```

### 3. Mobile App (Rider)

```bash
cd mobile
cp .env.example .env
# Same Supabase URL/Anon Key

npm install
npx expo start # Scan QR with Expo Go

# Build APK for Play Store:
eas build --platform android --profile preview
# Gives you APK link
```

---

## Environment Variables

**Web (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_MAP_PROVIDER=leaflet
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

**Mobile (.env):**
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Architecture (From Architecture.md)

- **Pricing:** lib/pricing.ts - base 15 + km*2.5 + packageFee + express8, server validates via Edge Function
- **Maps:** lib/maps.ts - geocode(), getDistance(), abstraction OSM/Google
- **Payments:** lib/paystack.ts - initialize, verify webhook, MoMo flow
- **Auth:** lib/supabase.ts - phone OTP, role, RLS
- **Realtime:** Customer subscribes to order id, rider subscribes to pending jobs

---

## Demo Logins (Seed Data)

- Customer: 0244123456 / 123456
- Rider: 0244987654 / 123456
- Admin: 0244000000 / admin123 or admin@wds.com.gh / admin123

OTP for all: 123456

---

## Deployment

**Web:** Vercel - connect GitHub repo, add env vars, deploy. Domain wds.com.gh

**Backend:** Supabase Cloud (free tier 500MB, 50k MAU) → Pro $25/mo when scale

**Mobile:** EAS Build → Play Store

---

## Next Steps After This Build

1. Create Supabase project + run migration
2. Create Paystack Ghana account + get keys
3. Test with 2 riders in East Legon
4. Deploy web to Vercel
5. Build APK + test with riders
6. Launch

---

## File Structure

```
wds-fullstack/
  web/ - Next.js customer + admin + rider PWA
  mobile/ - Expo rider app
  supabase/ - Schema + functions + seed
  README.md
```

Built for Williams Delivery Service, Accra. All-in-one, production ready, Ghana optimized (MoMo, GHS, Accra addresses, 3G friendly).

