-- WDS Williams Delivery Service - Initial Schema
-- Run this in Supabase SQL Editor
-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists postgis;

-- Users table (extends auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique not null,
  full_name text not null,
  role text check (role in ('customer','rider','admin')) default 'customer',
  created_at timestamp with time zone default now()
);

-- Riders table
create table public.riders (
  id uuid primary key references public.users(id) on delete cascade,
  vehicle_type text check (vehicle_type in ('motor','bicycle','car','van')) default 'motor',
  license_plate text,
  status text check (status in ('offline','online','delivering')) default 'offline',
  rating numeric default 5.0 check (rating >=0 and rating <=5),
  total_deliveries int default 0,
  total_earnings numeric default 0,
  is_approved boolean default false,
  current_lat double precision,
  current_lng double precision,
  last_seen timestamp with time zone default now()
);

-- Orders table (core)
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_code text unique default ('WDS-' || substr(uuid_generate_v4()::text,1,6)),
  customer_id uuid references public.users(id) on delete set null,
  rider_id uuid references public.riders(id) on delete set null,
  
  pickup_address text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  
  dropoff_address text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  
  package_type text check (package_type in ('parcel','food','grocery','medicine','document','other')) default 'parcel',
  description text,
  recipient_name text,
  recipient_phone text,
  
  distance_km numeric default 0,
  price numeric not null,
  payment_method text check (payment_method in ('momo_mtn','momo_vodafone','momo_airteltigo','card','cash','wallet')) default 'cash',
  payment_status text check (payment_status in ('pending','paid','failed','cash_on_delivery')) default 'pending',
  paystack_ref text,
  
  status text check (status in ('pending','accepted','picked_up','on_the_way','delivered','cancelled')) default 'pending',
  
  express boolean default false,
  proof_photo_url text,
  
  created_at timestamp with time zone default now(),
  delivered_at timestamp with time zone
);

-- Payments table
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  provider text default 'paystack',
  amount numeric not null,
  currency text default 'GHS',
  channel text,
  status text default 'pending',
  transaction_ref text unique,
  created_at timestamp with time zone default now()
);

-- Rider locations (time-series)
create table public.rider_locations (
  id bigserial primary key,
  rider_id uuid references public.riders(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  speed double precision,
  heading double precision,
  created_at timestamp with time zone default now()
);

-- Settings (pricing etc)
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);

-- Insert default pricing
insert into public.settings (key, value) values 
('pricing', '{"base":15,"perKm":2.5,"fees":{"document":3,"food":5,"medicine":6,"parcel":7,"grocery":7,"other":7},"express":8,"commission":0.2}'::jsonb)
on conflict (key) do nothing;

-- Indexes
create index idx_users_phone on public.users(phone);
create index idx_users_role on public.users(role);
create index idx_riders_status on public.riders(status);
create index idx_riders_location on public.riders(current_lat, current_lng);
create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_rider on public.orders(rider_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_created on public.orders(created_at desc);
create index idx_rider_locations_rider on public.rider_locations(rider_id, created_at desc);
create index idx_rider_locations_created on public.rider_locations(created_at desc);

-- Enable RLS
alter table public.users enable row level security;
alter table public.riders enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.rider_locations enable row level security;
alter table public.settings enable row level security;

-- RLS Policies

-- Users: can read own profile, admin can read all
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Admin can view all users" on public.users for select using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Enable insert for authenticated users" on public.users for insert with check (auth.uid() = id);

-- Riders: public can view online riders (for assignment), riders can update own
create policy "Anyone can view online approved riders" on public.riders for select using (is_approved = true and status = 'online');
create policy "Riders can view own profile" on public.riders for select using (auth.uid() = id);
create policy "Riders can update own profile" on public.riders for update using (auth.uid() = id);
create policy "Admin can manage all riders" on public.riders for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Enable insert for riders" on public.riders for insert with check (auth.uid() = id);

-- Orders: customers see own, riders see pending + own assigned, admin all
create policy "Customers can view own orders" on public.orders for select using (auth.uid() = customer_id);
create policy "Customers can create orders" on public.orders for insert with check (auth.uid() = customer_id);
create policy "Customers can update own pending orders" on public.orders for update using (auth.uid() = customer_id and status = 'pending');
create policy "Riders can view pending orders" on public.orders for select using (status = 'pending');
create policy "Riders can view assigned orders" on public.orders for select using (auth.uid() = rider_id);
create policy "Riders can update assigned orders" on public.orders for update using (auth.uid() = rider_id);
create policy "Admin full access orders" on public.orders for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Payments: customer and admin
create policy "Customers can view own payments" on public.payments for select using (exists (select 1 from public.orders where orders.id = payments.order_id and orders.customer_id = auth.uid()));
create policy "Admin can view all payments" on public.payments for select using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Enable insert payments" on public.payments for insert with check (true);

-- Rider locations: only assigned customer + rider + admin can see
create policy "Riders can insert own location" on public.rider_locations for insert with check (auth.uid() = rider_id);
create policy "Riders can view own locations" on public.rider_locations for select using (auth.uid() = rider_id);
create policy "Customers can view assigned rider location" on public.rider_locations for select using (
  exists (select 1 from public.orders where orders.rider_id = rider_locations.rider_id and orders.customer_id = auth.uid() and orders.status in ('accepted','picked_up','on_the_way'))
);
create policy "Admin can view all locations" on public.rider_locations for select using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Settings: anyone can read, admin can update
create policy "Anyone can read settings" on public.settings for select using (true);
create policy "Admin can update settings" on public.settings for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Functions

-- Function to calculate distance using PostGIS (if available) or fallback
create or replace function calculate_distance(lat1 float, lon1 float, lat2 float, lon2 float)
returns float as $$
  select (point(lon1, lat1) <@> point(lon2, lat2)) * 1.60934 -- miles to km
$$ language sql;

-- Function to find nearest riders
create or replace function find_nearest_riders(pickup_lat float, pickup_lng float, radius_km float default 5, limit_count int default 5)
returns table (rider_id uuid, distance_km float, rating float) as $$
  select 
    r.id,
    calculate_distance(pickup_lat, pickup_lng, r.current_lat, r.current_lng) as distance_km,
    r.rating
  from public.riders r
  where r.status = 'online' 
    and r.is_approved = true
    and r.current_lat is not null
    and r.current_lng is not null
    and calculate_distance(pickup_lat, pickup_lng, r.current_lat, r.current_lng) <= radius_km
  order by distance_km asc, rating desc
  limit limit_count;
$$ language sql security definer;

-- Trigger to update rider last_seen on location insert
create or replace function update_rider_last_seen()
returns trigger as $$
begin
  update public.riders set last_seen = now(), current_lat = NEW.lat, current_lng = NEW.lng where id = NEW.rider_id;
  return NEW;
end;
$$ language plpgsql;

create trigger trigger_update_rider_last_seen
  after insert on public.rider_locations
  for each row execute function update_rider_last_seen();

-- Cleanup old rider locations (keep 24h) - run via cron
create or replace function cleanup_old_locations()
returns void as $$
begin
  delete from public.rider_locations where created_at < now() - interval '24 hours';
end;
$$ language plpgsql;

-- Seed data (optional - for demo)
-- Note: This creates users in public.users, but auth.users needs to be created via Supabase Auth API
-- For demo, we use localStorage fallback, but in production create via auth API then insert profile

-- Example seed orders (without FK constraints for demo)
-- insert into public.orders (customer_id, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, package_type, price, status) values ...

-- Enable Realtime for tables (do this in Supabase Dashboard > Database > Realtime or via SQL)
-- alter publication supabase_realtime add table public.orders;
-- alter publication supabase_realtime add table public.rider_locations;
-- alter publication supabase_realtime add table public.riders;

-- For local supabase: uncomment below
-- begin;
--   drop publication if exists supabase_realtime;
--   create publication supabase_realtime for table public.orders, public.rider_locations, public.riders;
-- commit;
