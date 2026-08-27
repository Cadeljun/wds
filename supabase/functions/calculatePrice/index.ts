// Supabase Edge Function: calculatePrice
// Validates price server-side to prevent client tampering
// Deploy: supabase functions deploy calculatePrice

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PricingSettings {
  base: number
  perKm: number
  fees: Record<string, number>
  express: number
  commission: number
}

const defaultPricing: PricingSettings = {
  base: 15,
  perKm: 2.5,
  fees: { document: 3, food: 5, medicine: 6, parcel: 7, grocery: 7, other: 7 },
  commission: 0.2,
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, package_type, express } = await req.json()

    if (!pickup_lat || !pickup_lng || !dropoff_lat || !dropoff_lng) {
      return new Response(JSON.stringify({ error: 'Missing coordinates' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get pricing from DB or use default
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let pricing = defaultPricing
    const { data: settings } = await supabase.from('settings').select('value').eq('key', 'pricing').single()
    if (settings?.value) pricing = settings.value as PricingSettings

    const distance = haversineDistance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
    const km = Math.max(2, Math.min(35, Math.round(distance * 10) / 10))
    const mins = Math.round(km * 2.2 + 8)

    const base = pricing.base
    const distanceFee = km * pricing.perKm
    const packageFee = pricing.fees[package_type] || 7
    const expressFee = express ? pricing.express : 0
    const total = Math.round(base + distanceFee + packageFee + expressFee)

    return new Response(JSON.stringify({
      total,
      km,
      mins,
      breakdown: { base, distance: Math.round(distanceFee*10)/10, packageFee, express: expressFee },
      pricing,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
