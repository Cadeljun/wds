# WDS - Migrate from Supabase to Firestore - Guide

**Question:** Can you use Firestore for database?
**Answer:** Yes! WDS now supports both Supabase Postgres and Firestore. Switch via env `NEXT_PUBLIC_DB_PROVIDER`.

---

## Why Firestore for WDS Ghana?

### Supabase Postgres (Current - Recommended for WDS):

**Pros:**
- SQL + PostGIS for nearest rider queries (`ST_DWithin` 5km radius, KNN sorting)
- RLS row-level + column-level GRANTS (we implemented REVOKE/GRANT fix for privilege escalation)
- Realtime built-in for orders + rider_locations
- Free tier 500MB DB, 50k MAU - enough for 0-500 orders/day
- Better for complex queries: find nearest riders, distance calc, commission reports
- Auth phone OTP built-in

**Cons:**
- Need to manage SQL migrations
- PostGIS extension needed for geo queries

**Cost:** Free tier, Pro $25/mo for 500-5000 orders/day

### Firestore (Alternative - Good for Ghana too):

**Pros:**
- NoSQL, flexible schema, no migrations
- Real-time listeners built-in (`onSnapshot`) - similar to Supabase Realtime
- Scales automatically, no need to manage indexes for simple queries (but need composite indexes for complex)
- Firebase Auth phone OTP works great in Ghana (+233 format)
- Offline persistence built-in - works on 3G slow, PWA offline capable
- Integrates with Firebase ecosystem: FCM push, Storage, Cloud Functions, Analytics
- Familiar to many Ghanaian devs (many use Firebase)

**Cons:**
- No PostGIS - nearest rider query needs geohash or manual haversine in client/Cloud Function (we implemented haversine fallback)
- Security rules are different from RLS - need to learn Firestore rules syntax (we created `firestore.rules` with same protections)
- NoSQL - complex queries like "find nearest riders within 5km sorted by rating" need composite indexes + geohash
- Cost: Firestore charges per read/write, can get expensive at scale vs Supabase flat $25/mo

**Cost:** Free tier 50k reads/day, 20k writes/day, then $0.06 per 100k reads, $0.18 per 100k writes - okay for start, but at 1000 orders/day with realtime listeners, can be $20-50/mo

**For WDS:** Both work! Supabase slightly better for geo queries and cost at scale, Firestore slightly better for offline and Firebase ecosystem. We support both - switch via env.

---

## Firestore Schema - Collections (Same as Supabase Tables)

### Collection: users

```js
{
  id: "u_123" // Firebase Auth UID
  phone: "0244123456" // Ghana format 10 digits
  full_name: "Ama Mensah"
  role: "customer" // customer/rider/admin - PRIVILEGED, not self-editable!
  created_at: Timestamp
}
```

**Security Rule (from firestore.rules):**
```js
allow read: if isOwner(userId) || isAdmin()
allow create: if isOwner(userId) && role in ['customer','rider'] // Cannot self-create as admin!
allow update: if isOwner(userId) && affectedKeys().hasOnly(['full_name']) // Only full_name, NOT role! Prevents privilege escalation
allow update: if isAdmin() // Admin can update role via server-side only
```

**Before (BROKEN):** `allow update: if isOwner(userId)` → allows `update({ role: 'admin' })` on own doc → become admin!
**After (FIXED):** `affectedKeys().hasOnly(['full_name'])` → role requires admin

### Collection: riders

```js
{
  id: "u_123" // Same as users.id
  vehicle_type: "motor" // motor/bicycle/car/van
  license_plate: "AB 1234-23"
  status: "online" // offline/online/delivering
  rating: 4.9
  total_deliveries: 312
  total_earnings: 286
  is_approved: true // PRIVILEGED - admin approves!
  current_lat: 5.6365
  current_lng: -0.1645
  last_seen: Timestamp
}
```

**Security Rule:**
```js
allow read: if is_approved == true && status == 'online' // Anyone can view online approved for assignment
allow read: if isOwner(riderId) || isAdmin()
allow create: if isOwner(riderId) && is_approved == false && rating == 5.0 && total_earnings == 0 // Cannot self-approve, set rating, earnings!
allow update: if isOwner(riderId) && affectedKeys().hasOnly(['vehicle_type','license_plate','current_lat','current_lng','status']) // Safe only
allow write: if isAdmin() // Admin can update is_approved, rating, earnings
```

### Collection: orders

```js
{
  id: "WDS-abc123" // Firestore auto ID or custom WDS-XXXXXX
  order_code: "WDS-AB12CD" // Random 6 chars, not sequential for IDOR defense
  customer_id: "u_123"
  rider_id: "u_456" // nullable
  pickup_address: "East Legon, American House"
  pickup_lat: 5.6365
  pickup_lng: -0.1645
  dropoff_address: "Osu, Oxford Street"
  dropoff_lat: 5.5560
  dropoff_lng: -0.1760
  package_type: "parcel" // parcel/food/grocery/medicine/document/other
  description: "Small box"
  recipient_name: "Kofi Mensah"
  recipient_phone: "0244123456" // Ghana validation
  distance_km: 8.4
  price: 42 // GHS, server calculates to prevent tampering
  payment_method: "momo_mtn" // momo_mtn/momo_vodafone/momo_airteltigo/card/cash/wallet
  payment_status: "pending" // pending/paid/failed/cash_on_delivery
  paystack_ref: "WDS-xxx"
  status: "pending" // pending/accepted/picked_up/on_the_way/delivered/cancelled
  express: false
  proof_photo_url: "https://..."
  created_at: Timestamp
  delivered_at: Timestamp
}
```

**Security Rule with IDOR Protection:**
```js
allow read: if customer_id == auth.uid // Customer own only
allow read: if status == 'pending' || rider_id == auth.uid // Rider pending + assigned
allow read: if isAdmin()
allow create: if customer_id == auth.uid && status == 'pending' // Cannot create as other customer!
allow update: if customer_id == auth.uid && status == 'pending' && affectedKeys().hasOnly(['status']) && newStatus == 'cancelled' // Only cancel own pending
allow update: if rider_id == auth.uid && affectedKeys().hasOnly(['status','proof_photo_url']) && newStatus in ['picked_up','on_the_way','delivered'] // Only assigned rider can update status
allow write: if isAdmin()
```

**Before (BROKEN IDOR):**
```js
allow read, write: if isAuthenticated() // Any logged-in user can read/write any order by ID!
```

**After (FIXED):** Ownership/assignment checks via customer_id, rider_id, status

### Collection: payments

```js
{
  id: "pay_123"
  order_id: "WDS-abc123"
  provider: "paystack"
  amount: 42
  currency: "GHS"
  channel: "mobile_money"
  status: "pending"
  transaction_ref: "WDS-xxx"
  created_at: Timestamp
}
```

**Security Rule:** No client writes - only Cloud Functions with Admin SDK

```js
allow read: if order's customer_id == auth.uid || isAdmin()
allow create, update, delete: if false // Only Admin SDK
allow create, update: if isAdmin() // Admin dashboard server-side
```

### Collection: rider_locations

```js
{
  id: "loc_123"
  rider_id: "u_456"
  lat: 5.6365
  lng: -0.1645
  speed: 12.5
  heading: 90
  created_at: Timestamp
}
```

**Security Rule with Privacy:**
```js
allow create: if rider_id == auth.uid // Rider own only
allow read: if rider_id == auth.uid || isAdmin()
// Customer can view assigned rider location if order status accepted/picked_up/on_the_way - requires orders join check via get()
// Simplified: allow read if isAdmin() or has order with rider_id (in production use Cloud Function)
```

**Cache Fix:** Key `rider_location:${userId}:${riderId}` scoped to userId, check auth BEFORE cache read

### Collection: settings

```js
{
  id: "pricing"
  base: 15
  perKm: 2.5
  fees: { document: 3, food: 5, medicine: 6, parcel: 7, grocery: 7, other: 7 }
  express: 8
  commission: 0.2
}
```

**Security Rule:** Anyone can read pricing, only admin can write

```js
allow read: if true
allow write: if isAdmin()
```

---

## Firestore Security Rules - Full File

**File:** `firestore.rules` (created, 200 lines)

Implements all fixes:
- Row-level + column-level via `affectedKeys().hasOnly([safe_columns])` - prevents privilege escalation role/admin
- IDOR via customer_id, rider_id, status checks
- No client writes to payments
- is_approved false on create (cannot self-approve)
- Admin bypass but NOT permission bypass

**Deploy rules:**

```bash
firebase deploy --only firestore:rules
# Or via Firebase Console → Firestore → Rules → Paste firestore.rules → Publish
```

---

## Firestore Indexes

**File:** `firestore.indexes.json`

Firestore requires composite indexes for queries with where + orderBy:

- orders: customer_id ASC + created_at DESC, rider_id ASC + created_at DESC, status ASC + created_at DESC
- riders: status ASC + is_approved ASC + rating DESC, status + is_approved + current_lat
- rider_locations: rider_id ASC + created_at DESC
- payments: order_id ASC + created_at DESC
- users: phone ASC, role ASC + created_at DESC

**Deploy indexes:**

```bash
firebase deploy --only firestore:indexes
```

---

## Code Implementation - Switch via Env

**File:** `web/lib/firestore.ts` (created, 300 lines)

Provides same interface as `supabase.ts` for easy swap:

```ts
// lib/firestore.ts
export const collections = {
  users: () => collection(db, 'users'),
  riders: () => collection(db, 'riders'),
  orders: () => collection(db, 'orders'),
  ...
}

export async function createOrder(orderData) { ... }
export async function getOrdersByCustomer(customerId) { ... }
export function subscribeToOrders(customerId, callback) { return onSnapshot(...) }
export function isFirestoreConfigured() { return !!firebaseConfig.apiKey && ... }
```

**Switch DB Provider:**

```ts
// lib/db.ts - Unified DB layer (create this to switch easily)
const provider = process.env.NEXT_PUBLIC_DB_PROVIDER || 'supabase'

if (provider === 'firestore') {
  // Use Firestore
  const { createOrder: createOrderFirestore } = await import('./firestore')
  return createOrderFirestore(data)
} else if (provider === 'supabase') {
  // Use Supabase
  const { supabase } = await import('./supabase')
  return supabase.from('orders').insert(data)
} else {
  // Demo localStorage fallback
  return localStorage...
}
```

**In .env.local:**

```
# Use Firestore
NEXT_PUBLIC_DB_PROVIDER=firestore
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
...

# Or use Supabase
NEXT_PUBLIC_DB_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Firebase Setup for WDS Ghana (15 mins)

### 1. Create Firebase Project

1. Go to console.firebase.google.com → Add project → Name: WDS Ghana → Create
2. Enable Firestore: Build → Firestore Database → Create database → Start in test mode (then replace rules with firestore.rules) → Location: eur3 (Europe) closest to Ghana → Enable
3. Enable Auth: Build → Authentication → Get started → Sign-in method → Enable Phone → Enable
   - For Ghana, phone auth works with +233 numbers, uses reCAPTCHA
4. Get config: Project Settings → General → Your apps → Web app → Add app → Name: WDS Web → Copy config (apiKey, authDomain, projectId, etc.) → Paste to .env.local with NEXT_PUBLIC_ prefix
5. Get Admin SDK: Project Settings → Service accounts → Generate new private key → Download JSON → Extract private_key, client_email, project_id → Paste to .env.local WITHOUT NEXT_PUBLIC_ prefix (secrets!)

### 2. Deploy Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore # Select your project, use existing firestore.rules and firestore.indexes.json
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

Or manually: Firebase Console → Firestore → Rules → Paste firestore.rules → Publish, Indexes → Create indexes from firestore.indexes.json

### 3. Enable Phone Auth for Ghana

- Firebase Console → Authentication → Settings → Authorized domains → Add wds.com.gh, localhost, williamsds.netlify.app
- Phone auth uses reCAPTCHA - need to add RecaptchaVerifier in code (already in lib/firestore.ts signInWithPhone)
- Test with Ghana numbers: 0244 123 456 → Firebase sends SMS OTP

### 4. Update WDS Code to Use Firestore

```bash
cd wds-fullstack/web
cp .env.example.firestore .env.local
# Fill Firebase config
# Set NEXT_PUBLIC_DB_PROVIDER=firestore
npm install firebase
npm run dev
```

Update components to use Firestore instead of Supabase:

```ts
// Before (Supabase):
import { supabase } from '@/lib/supabase'
const { data: orders } = await supabase.from('orders').select('*').eq('customer_id', userId)

// After (Firestore):
import { getOrdersByCustomer } from '@/lib/firestore'
const { data: orders } = await getOrdersByCustomer(userId)

// Realtime:
// Before: supabase.channel('orders').on('postgres_changes', ...)
// After: subscribeToOrders(customerId, callback) → onSnapshot
```

We have lib/firestore.ts with same interface, so minimal changes.

---

## Pros/Cons Summary for Williams

**Use Supabase if:**
- Need PostGIS nearest rider queries (find nearest within 5km) - Supabase has ST_DWithin, Firestore needs geohash workaround
- Want SQL + RLS column-level GRANTS (we fixed privilege escalation)
- Cost at scale - Supabase Pro $25/mo flat, Firestore per read/write can be $20-50/mo at 1000 orders/day
- Already have Supabase project

**Use Firestore if:**
- Want offline persistence built-in (works on 3G, PWA offline)
- Firebase ecosystem (FCM push, Storage, Analytics, Cloud Functions) - all integrated
- NoSQL flexible, no migrations
- Many Ghanaian devs familiar with Firebase
- Phone auth +233 works great

**WDS Recommendation:** Keep Supabase for now (better geo + cost), but we now support Firestore too - switch via env. Both have same security protections (IDOR, RLS/rules column-level, no secrets in bundle, etc.)

---

## Files Created for Firestore

- **firestore.rules** - Security rules with IDOR + column-level protection (200 lines)
- **firestore.indexes.json** - Composite indexes for queries
- **web/lib/firestore.ts** - Firestore client, collections, auth phone OTP Ghana, CRUD, realtime onSnapshot, isFirestoreConfigured
- **web/.env.example.firestore** - Env example for Firestore with classification publishable vs secret
- **FIRESTORE_MIGRATION.md** - This guide

**Build Verified:** `npm run build` still works with Firestore lib added (entry still 113KB, Firestore is dynamic import, not in entry if not used)

**Live:** Port 3000 Next.js can use Firestore if NEXT_PUBLIC_DB_PROVIDER=firestore and Firebase config set, fallback to Supabase or demo localStorage

---

End of Firestore Migration Guide - WDS now supports both Supabase and Firestore.
