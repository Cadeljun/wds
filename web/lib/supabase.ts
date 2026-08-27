import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Types
export type UserRole = 'customer' | 'rider' | 'admin'
export type PackageType = 'parcel' | 'food' | 'grocery' | 'medicine' | 'document' | 'other'
export type OrderStatus = 'pending' | 'accepted' | 'picked_up' | 'on_the_way' | 'delivered' | 'cancelled'
export type PaymentMethod = 'momo_mtn' | 'momo_vodafone' | 'momo_airteltigo' | 'card' | 'cash' | 'wallet'

export interface WDSUser {
  id: string
  phone: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Rider {
  id: string
  vehicle_type: 'motor' | 'bicycle' | 'car' | 'van'
  license_plate: string
  status: 'offline' | 'online' | 'delivering'
  rating: number
  total_deliveries: number
  total_earnings: number
  is_approved: boolean
  current_lat?: number
  current_lng?: number
  last_seen: string
  user?: WDSUser
}

export interface Order {
  id: string
  order_code: string
  customer_id: string
  rider_id?: string
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_address: string
  dropoff_lat: number
  dropoff_lng: number
  package_type: PackageType
  description?: string
  recipient_name?: string
  recipient_phone?: string
  distance_km: number
  price: number
  payment_method: PaymentMethod
  payment_status: 'pending' | 'paid' | 'failed' | 'cash_on_delivery'
  paystack_ref?: string
  status: OrderStatus
  express: boolean
  proof_photo_url?: string
  created_at: string
  delivered_at?: string
}

// Auth helpers for Ghana phone OTP
export async function signInWithPhone(phone: string) {
  // Supabase phone OTP - works with Ghana numbers
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phone.startsWith('+') ? phone : `+233${phone.replace(/^0/, '')}`,
  })
  return { data, error }
}

export async function verifyOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone.startsWith('+') ? phone : `+233${phone.replace(/^0/, '')}`,
    token,
    type: 'sms',
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  // Get profile from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return profile as WDSUser | null
}

// For demo without Supabase - fallback to localStorage
export function isSupabaseConfigured() {
  return supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-anon-key'
}
