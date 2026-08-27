# WDS Full Stack - Deployment Guide

## Quick Deploy (30 mins)

### 1. Supabase Backend (15 mins)

1. Go to supabase.com → New Project → Name: WDS Prod → Region: EU West (closest to Ghana) → Create
2. Wait 2 mins, then go to SQL Editor → New Query → Paste `supabase/migrations/001_initial_schema.sql` → Run
3. Go to Database → Realtime → Enable for `orders`, `rider_locations`, `riders`
4. Go to Authentication → Providers → Enable Phone → Twilio or use Supabase default SMS (for Ghana, configure Twilio with Ghana sender ID)
   - For MVP, you can keep email auth and use phone as custom field + OTP via Edge Function, or use Supabase phone OTP which works in Ghana with Twilio
5. Go to Edge Functions → Create secrets:
   - `PAYSTACK_SECRET_KEY` = sk_live_xxx from Paystack dashboard
   - `SUPABASE_URL` auto, `SUPABASE_SERVICE_ROLE_KEY` auto
6. Deploy functions via CLI:
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy calculatePrice
supabase functions deploy assignRider
supabase functions deploy paystackWebhook
```
7. Copy Project URL and Anon Key from Settings → API

### 2. Paystack Ghana Setup (10 mins)

1. Go to paystack.com → Sign up as Ghana business → Complete KYC
2. Get Test Keys first: Dashboard → Settings → API Keys → Test Public/Secret
3. Set webhook URL: Settings → Webhooks → Add: `https://your-project.supabase.co/functions/v1/paystackWebhook`
4. Enable channels: Mobile Money (MTN, Vodafone, AirtelTigo), Card, Bank
5. Test MoMo: Use Paystack test MoMo numbers (in docs)
6. When ready, switch to Live keys and update Supabase secrets + web/.env.local

### 3. Web App Deploy to Vercel (5 mins)

1. Push `wds-fullstack/web` to GitHub repo
2. Go to vercel.com → New Project → Import repo → Framework: Next.js
3. Add Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_MAP_PROVIDER=leaflet
```
4. Deploy → Get URL like wds-web.vercel.app
5. Add custom domain: Settings → Domains → Add wds.com.gh or williamsdelivery.com.gh
   - Buy domain at Namecheap or Ghana .com.gh registrar, add CNAME to Vercel

### 4. Mobile App Build (10 mins)

1. Install EAS: `npm install -g eas-cli`
2. `cd mobile && eas login && eas build:configure`
3. `eas build --platform android --profile preview` → Gives APK link in 10-15 mins
4. Share APK with Williams' 24 riders via WhatsApp
5. For Play Store: `eas build --platform android --profile production` → Upload AAB to Play Console
6. Create Play Store listing: WDS Rider, screenshots from web app, description

### 5. Test with Real Riders (Day 1)

1. Create admin user: In Supabase Auth, create user admin@wds.com.gh / admin123, then in public.users set role=admin
2. Create 2 rider test accounts via /auth page → Select Rider → Vehicle Motor → Plate AB 1234-23
3. In Supabase Dashboard → Table Editor → riders → Set is_approved=true, status=online, set current_lat/lng to East Legon (5.6365, -0.1645)
4. Create customer order from web → Should appear in rider mobile app Jobs tab via Realtime
5. Rider accepts → Customer tracking page shows live
6. Test MoMo payment with Paystack test mode

### 6. Go Live Checklist

- [ ] Supabase RLS policies tested (customer can't see other orders)
- [ ] Paystack webhook verified (test payment updates order to paid)
- [ ] Maps: If using Google, add API key and restrict to domain, enable Places, Directions, Distance Matrix, Geocoding
- [ ] Domain wds.com.gh pointing to Vercel
- [ ] APK shared with riders, installed
- [ ] Rider onboarding: 24 riders created, approved, online
- [ ] Pricing: Check settings table base 15, perKm 2.5, fees
- [ ] Commission: 20% WDS, 80% rider - test payout via Paystack Transfer
- [ ] SMS fallback: If push fails, send SMS via Nalo or Hubtel Ghana
- [ ] Backup: Supabase daily backups enabled (Pro plan)

## Cost at Scale

- Supabase Free: 500MB DB, 1GB storage, 50k MAU, 2GB bandwidth - enough for 0-500 orders/day
- Supabase Pro $25/mo: 8GB DB, 100GB storage, 100k MAU - enough for 500-5000 orders/day
- Vercel Free: 100GB bandwidth - enough for start, Pro $20/mo when scale
- Google Maps: $200 free credit = ~10k requests, then $5/1000 - use Leaflet free for MVP to save
- Paystack: 1.95% per transaction (Ghana) - no monthly fee
- EAS Build: Free tier 30 builds/mo

Total to start: $0-25/mo until 1000 orders/day.

## Monitoring

- Supabase Dashboard → Reports: DB size, API requests, Realtime connections
- Vercel Analytics: Page views, performance
- Paystack Dashboard: Successful/failed payments, MoMo vs Card split
- Add Sentry for error tracking (optional)

## Support

- Supabase Discord, Paystack support (Ghana Slack), Vercel support
- For Ghana-specific: Hubtel, Nalo for SMS, MTN MoMo API docs

End of deployment guide.
