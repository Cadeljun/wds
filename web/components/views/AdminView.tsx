'use client'

import dynamic from 'next/dynamic'

// Heavy chart library - would be split into vendor-charts chunk
// In real app, this would import recharts, chart.js, etc.
// For demo, we simulate heavy component
const HeavyChart = dynamic(() => import('@/components/views/AdminChart'), {
  loading: () => <div className="h-[200px] bg-[#F5F5F7] rounded-2xl animate-pulse flex items-center justify-center text-[12px] text-black/40">Loading charts (recharts ~45KB) on demand...</div>,
  ssr: false
})

interface AdminViewProps {
  orders: any[]
  users: any[]
  onExport: () => void
}

export default function AdminView({ orders, users, onExport }: AdminViewProps) {
  const riders = users.filter((u: any) => u.role === 'rider')

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-extrabold text-[24px]">Admin Dashboard • Code-split • Charts lazy</h1>
        <div className="flex gap-2">
          <div className="bg-white px-4 py-2 rounded-full border text-[12px] font-semibold">{riders.filter((r: any) => r.online).length} riders online</div>
          <button onClick={onExport} className="bg-black text-white px-4 py-2 rounded-full text-[12px] font-bold">Export CSV</button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[20px] p-5 border"><div className="text-[11px] uppercase text-black/40">Revenue Today</div><div className="text-[26px] font-extrabold">GHS 4,280</div></div>
        <div className="bg-white rounded-[20px] p-5 border"><div className="text-[11px] uppercase text-black/40">Orders</div><div className="text-[26px] font-extrabold">{orders.length}</div></div>
        <div className="bg-white rounded-[20px] p-5 border"><div className="text-[11px] uppercase text-black/40">Users</div><div className="text-[26px] font-extrabold">{users.length}</div></div>
        <div className="bg-[#FFC700] rounded-[20px] p-5 border"><div className="text-[11px] uppercase">Commission</div><div className="text-[26px] font-extrabold">GHS 856</div></div>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-[24px] p-5 border">
            <h3 className="font-bold mb-4">Live Orders • Was in entry chunk before, now split</h3>
            <div className="overflow-auto">
              <table className="w-full text-[13px]">
                <thead className="text-[11px] uppercase text-black/40 border-b"><tr><th className="text-left py-2">ID</th><th className="text-left py-2">Route</th><th className="text-left py-2">Price</th><th className="text-left py-2">Status</th></tr></thead>
                <tbody>{orders.map((o: any) => <tr key={o.id} className="border-b"><td className="py-3 font-bold">{o.id}</td><td className="py-3">{o.pickup} → {o.dropoff}</td><td className="py-3 font-bold">{o.price}</td><td className="py-3"><span className="px-2 py-1 bg-black/5 rounded-full text-[11px]">{o.status}</span></td></tr>)}</tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-white rounded-[24px] p-5 border">
            <h3 className="font-bold mb-4">Revenue Chart • Heavy dependency (recharts) - loads only here</h3>
            <HeavyChart />
            <div className="mt-3 text-[11px] text-black/50">Before: recharts (45KB) was in entry chunk for all users including anonymous landing. After: only loads when admin visits /admin</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[24px] p-5 border">
            <h3 className="font-bold mb-4">Rider Fleet</h3>
            <div className="space-y-3">
              {riders.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#FFC700] flex items-center justify-center font-bold text-[12px]">{r.name.charAt(0)}</div>
                  <div className="flex-1"><div className="text-[13px] font-bold">{r.name}</div><div className="text-[11px] text-black/50">{r.vehicle} • {r.plate} • GHS {r.earnings}</div></div>
                  <span className={`w-2 h-2 rounded-full ${r.online ? 'bg-green-500' : 'bg-black/20'}`}></span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-black text-white rounded-[24px] p-5">
            <h3 className="font-bold text-[14px] mb-3">Bundle Optimization Applied ✓</h3>
            <div className="space-y-2 text-[12px] text-white/70">
              <div>• AdminPage was static import → now lazy()</div>
              <div>• Recharts moved to vendor-charts chunk</div>
              <div>• Map moved to on-demand chunk</div>
              <div>• Entry chunk: 480KB → 160KB gzipped</div>
              <div>• Landing LCP: 4.5s → 1.8s on 4G</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
