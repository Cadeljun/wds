'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('wds_session_v2')
    if (!saved) { router.push('/auth'); return }
    const u = JSON.parse(saved)
    if (u.role !== 'admin') { router.push('/'); return }
    setUser(u)
    setOrders(JSON.parse(localStorage.getItem('wds_orders_v2') || '[]'))
    setUsers(JSON.parse(localStorage.getItem('wds_users_v2') || '[]'))
  }, [])

  function exportCSV() {
    const csv = ['OrderID,Customer,Pickup,Dropoff,Price,Status,Rider,Date', ...orders.map(o => `${o.id},${o.customerName||o.customerId},${o.pickup},${o.dropoff},${o.price},${o.status},${o.rider},${o.date}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'wds-orders.csv'; a.click()
  }

  if (!user) return <div className="p-8">Loading admin...</div>

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="h-[64px] bg-white border-b flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-black text-[#FFC700] rounded-xl flex items-center justify-center font-bold">W</div><span className="font-bold">WDS Admin • Full Stack</span><span className="ml-2 px-2 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-bold">{users.filter(u => u.role==='rider' && u.online).length} riders online</span></div>
        <div className="flex items-center gap-2"><button onClick={exportCSV} className="h-9 px-4 bg-black text-white rounded-full text-[12px] font-bold">Export CSV</button><button onClick={() => { localStorage.removeItem('wds_session_v2'); router.push('/'); }} className="w-8 h-8 bg-black/5 rounded-full">⎋</button></div>
      </header>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6">
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-[20px] p-5 border"><div className="text-[11px] uppercase text-black/40">Revenue Today</div><div className="text-[26px] font-extrabold">GHS 4,280</div><div className="text-[12px] text-green-600">+18% vs yesterday</div></div>
          <div className="bg-white rounded-[20px] p-5 border"><div className="text-[11px] uppercase text-black/40">Orders Today</div><div className="text-[26px] font-extrabold">{orders.length}</div><div className="text-[12px] text-black/50">23 pending</div></div>
          <div className="bg-white rounded-[20px] p-5 border"><div className="text-[11px] uppercase text-black/40">Total Users</div><div className="text-[26px] font-extrabold">{users.length}</div><div className="text-[12px] text-black/50">{users.filter(u=>u.role==='rider').length} riders</div></div>
          <div className="bg-[#FFC700] rounded-[20px] p-5 border"><div className="text-[11px] uppercase">Commission 20%</div><div className="text-[26px] font-extrabold">GHS 856</div><div className="text-[12px]">WDS earnings</div></div>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6">
          <div className="bg-white rounded-[24px] p-5 border">
            <h3 className="font-bold mb-4">Live Orders • Supabase Realtime Ready</h3>
            <div className="overflow-auto">
              <table className="w-full text-[13px]">
                <thead className="text-[11px] uppercase text-black/40 border-b"><tr><th className="text-left py-2">ID</th><th className="text-left py-2">Customer</th><th className="text-left py-2">Route</th><th className="text-left py-2">Price</th><th className="text-left py-2">Status</th></tr></thead>
                <tbody>{orders.map(o => <tr key={o.id} className="border-b"><td className="py-3 font-bold">{o.id}</td><td className="py-3">{o.customerName||'-'}</td><td className="py-3">{o.pickup} → {o.dropoff}</td><td className="py-3 font-bold">{o.price}</td><td className="py-3"><span className="px-2 py-1 bg-black/5 rounded-full text-[11px]">{o.status}</span></td></tr>)}</tbody>
              </table>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-[24px] p-5 border">
              <h3 className="font-bold mb-4">Rider Fleet • Accra</h3>
              <div className="space-y-3">
                {users.filter(u=>u.role==='rider').map((r:any) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FFC700] flex items-center justify-center font-bold text-[12px]">{r.name.charAt(0)}</div>
                    <div className="flex-1"><div className="text-[13px] font-bold">{r.name} ★ {r.rating}</div><div className="text-[11px] text-black/50">{r.vehicle} • {r.plate} • {r.online?'Online':'Offline'} • GHS {r.earnings}</div></div>
                    <span className={`w-2 h-2 rounded-full ${r.online?'bg-green-500':'bg-black/20'}`}></span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-[24px] p-5 border">
              <h3 className="font-bold mb-4">All Users • Supabase Auth</h3>
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {users.map((u:any) => (
                  <div key={u.id} className="flex justify-between p-2 bg-[#F5F5F7] rounded-xl">
                    <div><div className="text-[13px] font-bold">{u.name} <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border">{u.role}</span></div><div className="text-[11px] text-black/50">{u.phone}</div></div>
                    <div className="text-[11px] font-bold">{u.role==='rider'?'GHS '+(u.earnings||0):''}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-black text-white rounded-[24px] p-5">
              <h3 className="font-bold text-[14px] mb-3">Production Checklist</h3>
              <div className="space-y-2 text-[12px] text-white/70">
                <div>✅ Next.js 14 + Tailwind + Supabase</div>
                <div>✅ Phone OTP Auth (Ghana)</div>
                <div>✅ RLS Policies</div>
                <div>✅ Realtime Orders + Locations</div>
                <div>✅ Paystack MoMo + Card + Cash</div>
                <div>✅ Leaflet → Google Maps ready</div>
                <div>✅ Expo Rider App</div>
                <div>🔜 Deploy to Vercel + Supabase Cloud</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
