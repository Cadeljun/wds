-- WDS Seed Data for Testing
-- Run after 001_initial_schema.sql
-- This creates sample data for demo

-- Insert pricing settings (already in 001, but ensure)
insert into public.settings (key, value) values 
('pricing', '{"base":15,"perKm":2.5,"fees":{"document":3,"food":5,"medicine":6,"parcel":7,"grocery":7,"other":7},"express":8,"commission":0.2}'::jsonb)
on conflict (key) do update set value = EXCLUDED.value;

-- Note: In production, users are created via Supabase Auth API
-- For this seed, we create placeholder UUIDs that match our localStorage demo
-- In real Supabase, you'd create auth users first via API, then insert into public.users

-- For local testing without auth, you can temporarily disable RLS or use service_role
-- This seed is for documentation - actual seeding should be done via API or with RLS disabled

-- Example: Insert sample orders (if you have users)
-- Replace customer_id and rider_id with real UUIDs from auth.users

/*
-- Sample orders (uncomment and replace IDs after creating users)
insert into public.orders (customer_id, rider_id, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, package_type, description, recipient_name, recipient_phone, distance_km, price, payment_method, payment_status, status, express) values
('customer-uuid-here', 'rider-uuid-here', 'East Legon, American House', 5.6365, -0.1645, 'Osu, Oxford Street', 5.5560, -0.1760, 'parcel', 'Small box with documents', 'Kofi Mensah', '0244123456', 8.4, 42, 'momo_mtn', 'paid', 'on_the_way', false),
('customer-uuid-here', null, 'Kaneshie Market', 5.5700, -0.2330, 'Dansoman', 5.5400, -0.2680, 'grocery', 'Groceries from market', 'Ama', '0244987654', 5.2, 35, 'cash', 'cash_on_delivery', 'pending', false);
*/

-- Insert sample rider locations (for testing map)
-- insert into public.rider_locations (rider_id, lat, lng, speed) values ...

-- Cleanup function for cron (set up in Supabase Dashboard > Database > Cron Jobs)
-- select cron.schedule('cleanup-locations', '0 * * * *', 'select cleanup_old_locations()');
