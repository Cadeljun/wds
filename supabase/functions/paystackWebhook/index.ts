// Supabase Edge Function: paystackWebhook
// Verifies Paystack signature and updates payment status
// Deploy: supabase functions deploy paystackWebhook
// Set webhook URL in Paystack dashboard: https://your-project.supabase.co/functions/v1/paystackWebhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecret) throw new Error('PAYSTACK_SECRET_KEY not set')

    // Verify signature
    const signature = req.headers.get('x-paystack-signature')
    const bodyText = await req.text()
    
    // Create HMAC SHA512 hash
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(paystackSecret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    )
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText))
    const hashArray = Array.from(new Uint8Array(signatureBytes))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (hashHex !== signature) {
      console.error('Invalid Paystack signature')
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const event = JSON.parse(bodyText)
    console.log('Paystack webhook event:', event.event, event.data?.reference)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (event.event === 'charge.success') {
      const reference = event.data.reference
      const amount = event.data.amount / 100 // pesewas to GHS
      const metadata = event.data.metadata || {}
      const orderId = metadata.order_id

      // Update payment
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'success', amount })
        .eq('transaction_ref', reference)

      if (paymentError) console.error('Payment update error', paymentError)

      // Update order payment_status
      if (orderId) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({ payment_status: 'paid' })
          .eq('id', orderId)

        if (orderError) console.error('Order update error', orderError)
      }

      // Here you could also trigger notification via FCM
    } else if (event.event === 'charge.failed') {
      const reference = event.data.reference
      await supabase.from('payments').update({ status: 'failed' }).eq('transaction_ref', reference)
    }

    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Webhook error', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
