// WDS - Unified DB Layer - Switch between Supabase, Firestore, Demo via env
// NEXT_PUBLIC_DB_PROVIDER=firestore or supabase or demo

import type { Order, WDSUser, Rider } from './supabase'

export type DbProvider = 'supabase' | 'firestore' | 'demo'

export function getDbProvider(): DbProvider {
  return (process.env.NEXT_PUBLIC_DB_PROVIDER as DbProvider) || 'demo'
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && !url.includes('placeholder') && !key.includes('placeholder') && !url.includes('xxx'))
}

export function isFirestoreConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  return !!(apiKey && projectId && !apiKey.includes('xxx') && !apiKey.includes('placeholder'))
}

// Unified interface - same for all providers
export async function createOrderUnified(orderData: any): Promise<{ data: any; error: any }> {
  const provider = getDbProvider()

  if (provider === 'firestore' && isFirestoreConfigured()) {
    const { createOrder } = await import('./firestore')
    return createOrder(orderData)
  } else if (provider === 'supabase' && isSupabaseConfigured()) {
    const { supabase } = await import('./supabase')
    const { data, error } = await supabase.from('orders').insert(orderData).select().single()
    return { data, error }
  } else {
    // Demo localStorage fallback
    const orders = JSON.parse(localStorage.getItem('wds_orders_v2') || '[]')
    const newOrder = {
      id: 'WDS-' + Date.now().toString().slice(-6),
      order_code: 'WDS-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      ...orderData,
      created_at: new Date().toISOString(),
    }
    orders.unshift(newOrder)
    localStorage.setItem('wds_orders_v2', JSON.stringify(orders))
    return { data: newOrder, error: null }
  }
}

export async function getOrdersUnified(customerId: string): Promise<{ data: any[]; error: any }> {
  const provider = getDbProvider()

  if (provider === 'firestore' && isFirestoreConfigured()) {
    const { getOrdersByCustomer } = await import('./firestore')
    return getOrdersByCustomer(customerId)
  } else if (provider === 'supabase' && isSupabaseConfigured()) {
    const { supabase } = await import('./supabase')
    const { data, error } = await supabase.from('orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }).limit(50)
    return { data: data || [], error }
  } else {
    const orders = JSON.parse(localStorage.getItem('wds_orders_v2') || '[]')
    const filtered = orders.filter((o: any) => o.customerId === customerId || o.customer_id === customerId)
    return { data: filtered, error: null }
  }
}

export function subscribeToOrdersUnified(customerId: string, callback: (orders: any[]) => void): () => void {
  const provider = getDbProvider()

  if (provider === 'firestore' && isFirestoreConfigured()) {
    // Firestore realtime via onSnapshot
    import('./firestore').then(({ subscribeToOrders }) => {
      return subscribeToOrders(customerId, callback)
    })
    return () => {}
  } else if (provider === 'supabase' && isSupabaseConfigured()) {
    // Supabase realtime
    import('./supabase').then(({ supabase }) => {
      const channel = supabase
        .channel(`orders-${customerId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${customerId}` }, () => {
          // Refetch
          getOrdersUnified(customerId).then(({ data }) => callback(data))
        })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    })
    return () => {}
  } else {
    // Demo - no realtime, just call once
    getOrdersUnified(customerId).then(({ data }) => callback(data))
    return () => {}
  }
}

export async function getCurrentUserUnified(): Promise<WDSUser | null> {
  const provider = getDbProvider()

  if (provider === 'firestore' && isFirestoreConfigured()) {
    const { getCurrentUser } = await import('./firestore')
    return getCurrentUser()
  } else if (provider === 'supabase' && isSupabaseConfigured()) {
    const { getCurrentUser } = await import('./supabase')
    return getCurrentUser()
  } else {
    const session = localStorage.getItem('wds_session_v2')
    return session ? JSON.parse(session) : null
  }
}

export function getProviderInfo() {
  const provider = getDbProvider()
  const supabaseConfigured = isSupabaseConfigured()
  const firestoreConfigured = isFirestoreConfigured()

  return {
    provider,
    supabaseConfigured,
    firestoreConfigured,
    activeProvider: provider === 'firestore' && firestoreConfigured ? 'firestore' : provider === 'supabase' && supabaseConfigured ? 'supabase' : 'demo',
    message: provider === 'firestore' && firestoreConfigured ? 'Using Firestore' : provider === 'supabase' && supabaseConfigured ? 'Using Supabase' : 'Using Demo localStorage (no backend)',
  }
}
