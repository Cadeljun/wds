// Supabase Edge Function: assignRider
// Finds nearest online rider and assigns order
// Deploy: supabase functions deploy assignRider

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { order_id, pickup_lat, pickup_lng, auto_assign } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find nearest online riders within 5km
    const { data: riders, error: ridersError } = await supabase
      .from('riders')
      .select('id, current_lat, current_lng, rating, total_deliveries')
      .eq('status', 'online')
      .eq('is_approved', true)
      .not('current_lat', 'is', null)
      .not('current_lng', 'is', null)

    if (ridersError) throw ridersError

    if (!riders || riders.length === 0) {
      return new Response(JSON.stringify({ message: 'No online riders found', riders: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Calculate distance and sort
    const ridersWithDistance = riders.map(r => ({
      ...r,
      distance_km: haversineDistance(pickup_lat, pickup_lng, r.current_lat, r.current_lng)
    }))
    .filter(r => r.distance_km <= 5) // within 5km
    .sort((a, b) => a.distance_km - b.distance_km || b.rating - a.rating)
    .slice(0, 5)

    if (auto_assign && ridersWithDistance.length > 0 && order_id) {
      const nearest = ridersWithDistance[0]
      // Assign order to nearest rider
      const { error: updateError } = await supabase
        .from('orders')
        .update({ rider_id: nearest.id, status: 'accepted' })
        .eq('id', order_id)
        .eq('status', 'pending') // only if still pending

      if (updateError) throw updateError

      // Update rider status to delivering
      await supabase.from('riders').update({ status: 'delivering' }).eq('id', nearest.id)

      return new Response(JSON.stringify({ assigned: true, rider: nearest, riders: ridersWithDistance }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ assigned: false, riders: ridersWithDistance }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
