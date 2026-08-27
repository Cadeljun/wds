'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function OrderTrackingPage({ orderId }: { orderId?: string }) {
  const params = useParams()
  const router = useRouter()
  const id = orderId || (params as any)?.id
  const [order, setOrder] = useState<any>(null)

  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem('wds_orders_v2') || '[]')
    const session = JSON.parse(localStorage.getItem('wds_session_v2') || 'null')
    const found = orders.find((o: any) => o.id === id)
    
    if (!found) {
      setOrder(null)
      return
    }

    // FIX: Object-level access control - check ownership/assignment, not just auth
    // Before (BROKEN): Any logged-in user could view any order by ID - IDOR
    // After (FIXED): Check if user owns, is assigned rider, or is admin
    if (session) {
      const userId = session.id
      const userRole = session.role
      const isOwner = found.customerId === userId || found.customer_id === userId
      const isAssignedRider = found.riderId === userId || found.rider_id === userId
      const isAdmin = userRole === 'admin'
      const isPending = found.status === 'pending'

      // Customer can view own, rider can view assigned or pending, admin all
      if (userRole === 'customer' && !isOwner && !isAdmin) {
        setForbidden(true)
        return
      }
      if (userRole === 'rider' && !isAssignedRider && !isPending && !isAdmin) {
        setForbidden(true)
        return
      }
    }

    setOrder(found)
  }, [id])

  if (forbidden) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-8">
        <div className="bg-white rounded-[24px] p-8 border border-red-200 text-center max-w-[400px]">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[20px]">🚫</div>
          <h2 className="font-bold text-[18px]">Forbidden - Not Your Order</h2>
          <p className="text-[13px] text-black/60 mt-2">You are authenticated but not authorized to view order {id}. Customers can only view own orders, riders only assigned or pending, admin all. This is IDOR protection.</p>
          <button onClick={() => router.push('/')} className="mt-4 h-9 px-4 bg-black text-white rounded-full text-[13px] font-bold">Go Home</button>
        </div>
      </div>
    )
  }

  if (!order) return <div className="p-8">Loading order {id}... Order not found or not authorized.</div>

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="h-[64px] bg-white border-b flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-black text-[#FFC700] rounded-xl flex items-center justify-center font-bold">W</div><span className="font-bold">WDS Tracking</span><span className="ml-2 px-2 py-1 bg-[#FFC700] rounded-full text-[11px] font-bold">{order.id}</span></div>
        <button onClick={() => router.push('/')} className="h-9 px-4 bg-black/5 rounded-full text-[13px] font-bold">Back</button>
      </header>

      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-8">
        <div className="bg-white rounded-[24px] p-6 border border-[#FFC700]/30">
          <div className="flex items-center gap-2 mb-6"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span><h1 className="font-bold text-[18px]">Tracking {order.id} • {order.status}</h1></div>
          
          <div className="grid md:grid-cols-[320px_1fr] gap-6">
            <div className="space-y-4">
              <div className="flex gap-3"><div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center">🏍️</div><div><div className="text-[13px] font-bold">Kwame A. • Rider</div><div className="text-[11px] text-black/60">Motor • AB 1234-23 • 4.9 ★</div><div className="text-[11px] font-semibold mt-1"><span className="px-2 py-0.5 bg-[#FFC700] rounded-full">On the way</span></div></div></div>
              
              <div className="relative pl-8">
                <div className="absolute left-2 top-2 bottom-2 w-[2px] bg-black/10"></div>
                <div className="space-y-6 text-[13px]">
                  <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">✓</div><div><div className="font-bold">Order confirmed</div><div className="text-black/50 text-[11px]">Just now • Rider assigned</div></div></div>
                  <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">✓</div><div><div className="font-bold">Picked up</div><div className="text-black/50 text-[11px]">{order.pickup} • 2 mins ago</div></div></div>
                  <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-[#FFC700] flex items-center justify-center"><div className="w-2 h-2 bg-black rounded-full animate-ping"></div></div><div><div className="font-bold">On the way • 8 mins away</div><div className="text-black/50 text-[11px]">Via N1 • Live traffic</div><button className="mt-2 text-[11px] bg-black text-white px-3 py-1 rounded-full">Call Rider</button></div></div>
                  <div className="flex gap-3 opacity-40"><div className="w-6 h-6 rounded-full border-2 border-black/20"></div><div><div className="font-bold">Delivered</div><div className="text-black/50 text-[11px]">Estimated 12:20 PM</div></div></div>
                </div>
              </div>

              <div className="bg-[#F5F5F7] rounded-2xl p-4">
                <div className="text-[11px] uppercase font-bold text-black/40 mb-2">Order Details</div>
                <div className="text-[13px] space-y-1">
                  <div><span className="text-black/50">From:</span> <span className="font-bold">{order.pickup}</span></div>
                  <div><span className="text-black/50">To:</span> <span className="font-bold">{order.dropoff}</span></div>
                  <div><span className="text-black/50">Type:</span> {order.type}</div>
                  <div><span className="text-black/50">Price:</span> <span className="font-bold">{order.price}</span></div>
                  <div><span className="text-black/50">Payment:</span> {order.paymentMethod || 'MoMo'}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#F5F5F7] rounded-2xl p-4">
              <div className="w-full h-[400px] bg-white rounded-xl flex items-center justify-center border border-black/5">
                <div className="text-center">
                  <div className="text-[14px] font-bold">Live Map • {order.pickup} → {order.dropoff}</div>
                  <div className="text-[12px] text-black/50 mt-1">Supabase Realtime: rider location updates every 10s</div>
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-[#FFC700] rounded-full text-[11px] font-bold">🏍️ Kwame is 1.2km away</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="bg-white rounded-xl p-3"><div className="font-bold text-[14px]">{order.price}</div><div className="text-black/50">Total</div></div>
                <div className="bg-white rounded-xl p-3"><div className="font-bold text-[14px]">8.4 km</div><div className="text-black/50">Distance</div></div>
                <div className="bg-white rounded-xl p-3"><div className="font-bold text-[14px]">22 mins</div><div className="text-black/50">ETA</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
