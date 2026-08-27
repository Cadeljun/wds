'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

export default function RiderPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeJob, setActiveJob] = useState<any>(null)
  const [earnings, setEarnings] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('wds_session_v2')
    if (!saved) { router.push('/auth'); return }
    const u = JSON.parse(saved)
    if (u.role !== 'rider' && u.role !== 'admin') { router.push('/'); return }
    setUser(u)
    setEarnings(u.earnings || 0)
  }, [])

  const jobs = [
    { id: 'WDS-89', from: 'Osu, Oxford St', to: 'Airport Residential', fee: 'GHS 28', dist: '3.2km', type: 'Document', urgent: true },
    { id: 'WDS-93', from: 'East Legon, Bawaleshie', to: 'Madina, Zongo', fee: 'GHS 38', dist: '6.1km', type: 'Parcel', urgent: false },
    { id: 'WDS-94', from: 'Kaneshie Market', to: 'Dansoman', fee: 'GHS 52', dist: '8.4km', type: 'Grocery', urgent: false },
  ]

  function acceptJob(job: any) {
    setActiveJob(job)
    const payout = Math.floor(parseInt(job.fee.replace(/\D/g, '')) * 0.8)
    const newEarnings = earnings + payout
    setEarnings(newEarnings)
    if (user) {
      const updated = { ...user, earnings: newEarnings }
      setUser(updated)
      localStorage.setItem('wds_session_v2', JSON.stringify(updated))
      const users = JSON.parse(localStorage.getItem('wds_users_v2') || '[]')
      localStorage.setItem('wds_users_v2', JSON.stringify(users.map((u: any) => u.id === user.id ? updated : u)))
    }
  }

  if (!user) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="h-[64px] bg-white border-b border-black/5 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-black text-[#FFC700] rounded-xl flex items-center justify-center font-bold">W</div><span className="font-bold">WDS Rider</span><span className="ml-2 px-2 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-bold">ONLINE</span></div>
        <div className="flex items-center gap-3"><span className="text-[13px] font-bold">{user.name}</span><button onClick={() => { localStorage.removeItem('wds_session_v2'); router.push('/'); }} className="w-8 h-8 bg-black/5 rounded-full">⎋</button></div>
      </header>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 grid lg:grid-cols-[1fr_380px] gap-6">
        <div>
          <div className="bg-black text-white rounded-[28px] p-6 flex justify-between mb-6">
            <div><div className="font-bold text-[18px]">{user.name} • Rider</div><div className="text-[13px] text-white/60">{user.vehicle} • {user.plate} • Level 4 • 312 deliveries</div></div>
            <div className="text-right"><div className="text-[11px] uppercase text-white/40">Today</div><div className="text-[28px] font-extrabold">GHS {earnings}</div></div>
          </div>
          <h2 className="font-extrabold text-[20px] mb-4">Available Jobs • {jobs.length} near you</h2>
          <div className="space-y-3">
            {jobs.map(j => (
              <div key={j.id} className="bg-white rounded-[22px] p-4 border border-black/5 flex justify-between items-center">
                <div><div className="font-bold text-[13px]">{j.id} • {j.from} → {j.to} {j.urgent && <span className="ml-2 text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">URGENT</span>}</div><div className="text-[11px] text-black/50">{j.dist} • {j.type}</div></div>
                <div className="text-right"><div className="font-extrabold">{j.fee}</div><button onClick={() => acceptJob(j)} className="mt-1 h-8 px-4 bg-black text-white rounded-full text-[12px] font-bold">Accept</button></div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] p-5 border">
            <h3 className="font-bold text-[15px] mb-3">My Active Delivery</h3>
            {activeJob ? (
              <div>
                <div className="text-[12px] font-bold px-2 py-1 bg-[#FFC700] rounded-full inline-block mb-2">{activeJob.id} • {activeJob.fee}</div>
                <div className="text-[13px] font-bold">{activeJob.from} → {activeJob.to}</div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button className="h-9 bg-black text-white rounded-full text-[11px] font-bold">Picked up</button>
                  <button className="h-9 bg-[#FFC700] text-black rounded-full text-[11px] font-bold">On the way</button>
                  <button className="h-9 bg-green-600 text-white rounded-full text-[11px] font-bold">Delivered</button>
                </div>
              </div>
            ) : (
              <div className="text-[13px] text-black/50 text-center py-8 border border-dashed rounded-2xl">No active delivery. Accept a job.</div>
            )}
          </div>
          <div className="bg-white rounded-[24px] p-2 border"><div className="h-[320px] bg-[#F5F5F7] rounded-[18px] flex items-center justify-center text-[12px] text-black/40">Rider Map • Live locations • Supabase Realtime</div></div>
        </div>
      </div>
    </div>
  )
}
