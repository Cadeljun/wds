-- WDS - Fix Privilege Escalation via Unrestricted Column Writes
-- The UI Is Not the Security Boundary - RLS is row-scoped by default, not column-scoped
-- This migration locks down privileged columns separately from row-level policy

-- ===========================================
-- PROBLEM: 
-- CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id)
-- Looks safe: users can only touch row that matches own ID
-- BUT: Restricts which ROW, not which COLUMNS. If users.role lives on same table, any user can:
-- await supabase.from('users').update({ role: 'admin' }).eq('id', myOwnUserId) → succeeds!
-- Now admin, every admin-gated RLS policy opens up too (cascade = total compromise)
-- Meanwhile <AdminRoute> React component hides admin nav but never mattered - not security boundary
-- ===========================================

-- ===========================================
-- FIX 1: Lock down privileged columns on users table
-- ===========================================

-- First, revoke blanket UPDATE that was granted by default or previous migration
REVOKE UPDATE ON public.users FROM authenticated;
REVOKE UPDATE ON public.users FROM anon;

-- Grant back ONLY safe, self-editable columns
-- Users should be able to self-edit: full_name only (maybe phone with verification, but not role)
GRANT UPDATE (full_name) ON public.users TO authenticated;

-- Privileged columns that now require service-role key (server-side only):
-- role, phone (sensitive, needs verification), created_at
-- These now CANNOT be updated by authenticated role via anon key from browser console
-- To change role, must use service_role key server-side: supabaseAdmin.from('users').update({ role: 'admin' })

-- Note: If you want users to update phone, do it via Edge Function with OTP verification, not direct UPDATE

-- ===========================================
-- FIX 2: Lock down privileged columns on riders table
-- ===========================================

REVOKE UPDATE ON public.riders FROM authenticated;
REVOKE UPDATE ON public.riders FROM anon;

-- Safe self-editable columns for riders:
-- vehicle_type, license_plate, current_lat, current_lng, status (online/offline/delivering)
-- Rider should be able to update own vehicle, plate, location, online status
GRANT UPDATE (vehicle_type, license_plate, current_lat, current_lng, status) ON public.riders TO authenticated;

-- Privileged columns that now require service-role (server-side only):
-- is_approved (admin approves), rating (calculated from reviews), total_deliveries, total_earnings, last_seen (trigger updates)
-- Rider CANNOT do: await supabase.from('riders').update({ is_approved: true, rating: 5, total_earnings: 1000000 }).eq('id', myId)

-- ===========================================
-- FIX 3: Lock down privileged columns on orders table
-- ===========================================

REVOKE UPDATE ON public.orders FROM authenticated;
REVOKE UPDATE ON public.orders FROM anon;

-- Customers can only update own pending orders, but only safe columns?
-- For orders, we want customers to be able to cancel own pending? But not change price, rider, etc.
-- For simplicity, we revoke all direct UPDATE from authenticated and force updates via Edge Functions or RLS with check
-- However, we need to allow riders to update status of assigned orders (picked_up, on_the_way, delivered)

-- Grant customers ability to update only status to cancelled on own pending orders?
-- Actually, we should split: customers can update status to cancelled, riders can update status to picked_up/on_the_way/delivered

-- For now, grant minimal safe columns for each role via separate policies that check action
-- But column-level grants are per role, not per policy, so we need to be careful

-- Safe columns that authenticated can update (if RLS USING passes):
-- For customers: status (only to cancelled) - but we can't restrict value via GRANT, need WITH CHECK in policy
-- For riders: status, proof_photo_url

GRANT UPDATE (status, proof_photo_url) ON public.orders TO authenticated;

-- Privileged columns that require service-role:
-- price (server calculates), customer_id, rider_id, pickup_lat/lng, dropoff_lat/lng, distance_km, payment_status, paystack_ref, order_code, created_at, delivered_at
-- Customer CANNOT do: await supabase.from('orders').update({ price: 1, rider_id: 'attacker' }).eq('id', myOrderId)

-- Now add WITH CHECK to policies to restrict status values

DROP POLICY IF EXISTS "Customers can update own pending orders" ON public.orders;
CREATE POLICY "Customers can update own pending orders to cancelled"
ON public.orders FOR UPDATE
USING (auth.uid() = customer_id AND status = 'pending')
WITH CHECK (auth.uid() = customer_id AND status = 'cancelled');

DROP POLICY IF EXISTS "Riders can update assigned orders" ON public.orders;
CREATE POLICY "Riders can update assigned orders status"
ON public.orders FOR UPDATE
USING (auth.uid() = rider_id)
WITH CHECK (auth.uid() = rider_id AND status IN ('picked_up', 'on_the_way', 'delivered'));

-- ===========================================
-- FIX 4: Lock down payments table - no direct UPDATE from client at all
-- ===========================================

REVOKE UPDATE ON public.payments FROM authenticated;
REVOKE UPDATE ON public.payments FROM anon;
REVOKE INSERT ON public.payments FROM authenticated;
REVOKE INSERT ON public.payments FROM anon;

-- Payments should only be written via service_role (Edge Function paystackWebhook)
-- No direct client writes

-- Keep SELECT policies for customers to view own payments (already exists)
-- But ensure no UPDATE/INSERT via anon key

-- ===========================================
-- FIX 5: Lock down settings table - only service_role can update pricing
-- ===========================================

REVOKE UPDATE ON public.settings FROM authenticated;
REVOKE UPDATE ON public.settings FROM anon;
REVOKE INSERT ON public.settings FROM authenticated;
REVOKE INSERT ON public.settings FROM anon;
REVOKE DELETE ON public.settings FROM authenticated;
REVOKE DELETE ON public.settings FROM anon;

-- Settings (pricing, commission) should only be updated via service_role (admin dashboard server-side)
-- SELECT remains allowed for anyone to read pricing (already has policy "Anyone can read settings")

-- ===========================================
-- FIX 6: Rider locations - only insert own, no update
-- ===========================================

REVOKE UPDATE ON public.rider_locations FROM authenticated;
REVOKE UPDATE ON public.rider_locations FROM anon;
REVOKE DELETE ON public.rider_locations FROM authenticated;
REVOKE DELETE ON public.rider_locations FROM anon;

-- Only INSERT own location and SELECT own or assigned
-- Already have policies for INSERT and SELECT, but ensure no UPDATE/DELETE

-- ===========================================
-- FIX 7: Split privileged fields into separate table if grants get unwieldy (Alternative pattern)
-- ===========================================

-- For WDS, role is on users table, but we locked it down via column grants
-- Alternative simpler pattern: dedicated user_roles table that only service_role can write

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid primary key references public.users(id) on delete cascade,
  role text check (role in ('customer','rider','admin')) default 'customer',
  is_admin boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only service_role can write to user_roles, authenticated can read own
REVOKE ALL ON public.user_roles FROM authenticated;
REVOKE ALL ON public.user_roles FROM anon;

GRANT SELECT ON public.user_roles TO authenticated;

-- Policies for user_roles
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all roles" ON public.user_roles FOR SELECT USING (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- No INSERT/UPDATE/DELETE policies for authenticated - only service_role can write
-- To make someone admin: supabaseAdmin.from('user_roles').update({ role: 'admin', is_admin: true }).eq('user_id', targetId)

-- Migrate existing roles to user_roles
INSERT INTO public.user_roles (user_id, role, is_admin)
SELECT id, role, (role = 'admin') FROM public.users
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, is_admin = EXCLUDED.is_admin;

-- ===========================================
-- FIX 8: Enforce second factor at data layer (if you have MFA/OTP)
-- ===========================================

-- WDS uses phone OTP for auth. Supabase encodes AAL (Authenticator Assurance Level) into JWT:
-- aal1 = password only, aal2 = password + second factor (OTP/MFA) verified

-- Example: Require aal2 for sensitive reads, enforced at RLS layer, not just frontend redirect
-- If API and DB would both accept password-only session with no evidence second factor completed, second factor is UX not security

-- Create helper function to check if user is staff (for example)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = user_id AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Example policy requiring second factor for sensitive reads
-- Uncomment and adapt for your sensitive tables:

-- CREATE POLICY "Admin can read all users, second factor required"
-- ON public.users FOR SELECT
-- USING (
--   public.is_admin(auth.uid())
--   AND (auth.jwt() ->> 'aal') = 'aal2'  -- Require MFA verified session
-- );

-- For WDS, we require OTP for login, so JWT should already have aal2 if OTP flow completed
-- To enforce: In your API middleware AND RLS policies, check (auth.jwt() ->> 'aal') = 'aal2'
-- Not just a redirect in frontend router

-- ===========================================
-- VERIFICATION QUERIES (Run these to check fix)
-- ===========================================

-- 1. List every UPDATE policy and what it restricts
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE cmd = 'UPDATE' ORDER BY tablename;

-- 2. Check column-level grants on privileged columns - does authenticated have UPDATE on role/is_admin?
-- SELECT table_name, column_name, privilege_type, grantee FROM information_schema.column_privileges 
-- WHERE table_schema = 'public' AND column_name IN ('role', 'is_admin', 'is_approved', 'rating', 'total_earnings', 'price', 'payment_status') AND grantee IN ('authenticated', 'anon');
-- Expected after fix: No rows for privileged columns for authenticated/anon, only for safe columns like full_name, vehicle_type, etc.

-- 3. Confirm repo has policies checked in as SQL files
-- grep -rl "CREATE POLICY" --include="*.sql" .
-- Should find this file and 001_initial_schema.sql - if empty, real security rules only in dashboard = unreviewable debt

-- 4. Grep client code for privileged column in update payload
-- grep -rn "is_admin\|role:\|is_approved\|rating.*:" --include="*.tsx" --include="*.ts" src/ client/src/
-- Should find no client-side code sending role/is_admin/is_approved in update - if it does, risk highest even if column locked

-- ===========================================
-- DOCUMENTATION: Client-side guards are UX-only
-- ===========================================

-- Add comment to frontend components:

-- components/AdminRoute.tsx
-- // UX-only guard - hides admin nav link and redirects non-admins away from /admin
-- // Real enforcement is in RLS policies + column-level GRANTS + assertObjectAccess() server-side
-- // See supabase/migrations/003_rls_column_security.sql and lib/access-control.ts
-- // Never mistake this for security boundary

-- ===========================================
-- END OF FIX
-- ===========================================

-- After this migration, test privilege escalation attempt from browser console:

-- BEFORE (would succeed, now should fail):
-- await supabase.from('users').update({ role: 'admin' }).eq('id', myOwnUserId)
-- Expected after fix: Error "permission denied for table users" or "not allowed to update column role"

-- await supabase.from('riders').update({ is_approved: true, rating: 5, total_earnings: 1000000 }).eq('id', myId)
-- Expected after fix: Error permission denied for columns is_approved, rating, total_earnings

-- await supabase.from('orders').update({ price: 1 }).eq('id', myOrderId)
-- Expected after fix: Error permission denied for column price

-- Admin can still update via service_role key server-side:
-- supabaseAdmin.from('users').update({ role: 'admin' }).eq('id', targetId) - succeeds with service_role key
