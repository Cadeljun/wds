'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { RouteLoadingFallback, MapLoadingFallback } from '@/components/RouteLoadingFallback'

// Heavy dependencies - lazy loaded
const MapComponent = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <MapLoadingFallback />
})

const PriceCard = dynamic(() => import('@/components/PriceCard'), {
  loading: () => <div className="h-[400px] bg-black rounded-[32px] animate-pulse" />
})

type PackageType = 'parcel' | 'food' | 'grocery' | 'medicine' | 'document' | 'other'
type PaymentMethod = 'momo' | 'card' | 'cash'

const pkgTypes = [
  { id: 'parcel' as PackageType, label: 'Parcel', icon: '📦' },
  { id: 'food' as PackageType, label: 'Food', icon: '🍔' },
  { id: 'grocery' as PackageType, label: 'Grocery', icon: '🛒' },
  { id: 'medicine' as PackageType, label: 'Medicine', icon: '💊' },
  { id: 'document' as PackageType, label: 'Document', icon: '📄' },
  { id: 'other' as PackageType, label: 'Other', icon: '⋯' },
]

interface CustomerViewProps {
  currentUser: any
  orders: any[]
  onPlaceOrder: (data: any) => void
  onTrack: (order: any) => void
}

export default function CustomerView({ currentUser, orders, onPlaceOrder, onTrack }: CustomerViewProps) {
  const [pkgType, setPkgType] = useState<PackageType>('parcel')
  const [payType, setPayType] = useState<PaymentMethod>('momo')
  const [pickup, setPickup] = useState('East Legon, American House')
  const [dropoff, setDropoff] = useState('Osu, Oxford Street')
  const [itemDesc, setItemDesc] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [express, setExpress] = useState(false)

  // This would use real geocode + pricing in production
  const price = { total: 42, km: 8.4, mins: 22, breakdown: { base: 15, distance: 21, packageFee: 7, express: 0 } }

  function handleOrder() {
    onPlaceOrder({
      pickup, dropoff, type: pkgType, description: itemDesc,
      recipientName, recipientPhone, price: `GHS ${price.total}`,
      paymentMethod: payType,
    })
  }

  return (
    <div>
      <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="bg-white rounded-[32px] p-5 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-black/[0.04]">
          <h1 className="font-extrabold text-[24px] md:text-[32px] leading-[0.95]">Deliver anything in <span className="bg-[#FFC700]">Accra</span> now.</h1>
          <p className="text-[13px] text-black/60 mt-2">Welcome {currentUser?.name} • Code-split customer view • Map loads on demand</p>
          
          <div className="mt-6">
            <label className="text-[11px] font-bold uppercase text-black/50 mb-2 block">What are you sending?</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {pkgTypes.map(p => (
                <button key={p.id} onClick={() => setPkgType(p.id)} className={`rounded-2xl p-3 flex flex-col items-center gap-2 border ${pkgType === p.id ? 'bg-black text-white border-black' : 'bg-white border-black/10'}`}>
                  <span className="text-[18px]">{p.icon}</span><span className="text-[11px] font-semibold">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <input value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Pickup" className="w-full h-[52px] bg-[#F5F5F7] border border-black/5 rounded-2xl px-4 text-[14px] font-medium" />
            <input value={dropoff} onChange={e => setDropoff(e.target.value)} placeholder="Drop-off" className="w-full h-[52px] bg-white border-2 border-black rounded-2xl px-4 text-[14px] font-bold" />
            <div className="grid md:grid-cols-2 gap-3">
              <input value={itemDesc} onChange={e => setItemDesc(e.target.value)} placeholder="What exactly?" className="h-[48px] bg-[#F5F5F7] rounded-2xl px-4 text-[13px]" />
              <div className="flex gap-2">
                <input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Recipient name" className="h-[48px] bg-[#F5F5F7] rounded-2xl px-4 text-[13px] w-1/2" />
                <input value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder="0244..." className="h-[48px] bg-[#F5F5F7] rounded-2xl px-4 text-[13px] w-1/2" />
              </div>
            </div>
            <label className="flex items-center gap-2 mt-3"><input type="checkbox" checked={express} onChange={e => setExpress(e.target.checked)} /><span className="text-[13px] font-bold">Express +GHS 8 (35-50 mins)</span></label>
          </div>
        </div>

        <div className="space-y-6">
          <PriceCard 
            total={price.total} 
            km={price.km} 
            mins={price.mins} 
            breakdown={price.breakdown} 
            packageType={pkgType}
            payType={payType}
            onPayTypeChange={setPayType}
            onOrder={handleOrder}
          />
          <div className="bg-white rounded-[32px] p-2 border border-black/5">
            <MapComponent 
              pickup={{ lat: 5.6365, lng: -0.1645 }} 
              dropoff={{ lat: 5.5560, lng: -0.1760 }} 
              height="260px"
            />
          </div>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-4 md:px-8 pb-12">
        <h3 className="font-extrabold text-[18px] mb-4">Your Deliveries • Lazy loaded</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {orders.slice(0, 6).map((o: any) => (
            <div key={o.id} className="bg-white rounded-[20px] p-4 border border-black/5 hover:shadow-lg transition cursor-pointer" onClick={() => onTrack(o)}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/5">{o.status}</span>
                <span className="text-[11px] text-black/40">{o.date}</span>
              </div>
              <div className="text-[13px] font-bold">{o.pickup} → {o.dropoff}</div>
              <div className="text-[12px] text-black/50 mt-1">{o.type} • {o.price}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
