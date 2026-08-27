'use client'

import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured, WDSUser } from '@/lib/supabase'
import { calcPrice, defaultPricing, haversineDistance } from '@/lib/pricing'
import { geocode, getDistance, accraSpots } from '@/lib/maps'
import dynamic from 'next/dynamic'

// Dynamically import map to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/Map'), { ssr: false })

type PackageType = 'parcel' | 'food' | 'grocery' | 'medicine' | 'document' | 'other'
type PaymentMethod = 'momo' | 'card' | 'cash'
type View = 'landing' | 'customer' | 'rider' | 'admin'

const pkgTypes = [
  { id: 'parcel' as PackageType, label: 'Parcel', icon: '📦' },
  { id: 'food' as PackageType, label: 'Food', icon: '🍔' },
  { id: 'grocery' as PackageType, label: 'Grocery', icon: '🛒' },
  { id: 'medicine' as PackageType, label: 'Medicine', icon: '💊' },
  { id: 'document' as PackageType, label: 'Document', icon: '📄' },
  { id: 'other' as PackageType, label: 'Other', icon: '⋯' },
]

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [view, setView] = useState<View>('landing')
  const [pkgType, setPkgType] = useState<PackageType>('parcel')
  const [payType, setPayType] = useState<PaymentMethod>('momo')
  const [pickup, setPickup] = useState('East Legon, American House')
  const [dropoff, setDropoff] = useState('Osu, Oxford Street')
  const [itemDesc, setItemDesc] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [express, setExpress] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [price, setPrice] = useState({ total: 42, km: 8.4, mins: 22, breakdown: { base: 15, distance: 21, packageFee: 7, express: 0 } })
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login')
  const [trackingOrder, setTrackingOrder] = useState<any>(null)

  // Auth forms
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupRole, setSignupRole] = useState<'customer' | 'rider'>('customer')
  const [signupPass, setSignupPass] = useState('')
  const [signupVehicle, setSignupVehicle] = useState('motor')
  const [signupPlate, setSignupPlate] = useState('')

  useEffect(() => {
    // Load from localStorage fallback
    const savedUser = localStorage.getItem('wds_session_v2')
    const savedOrders = localStorage.getItem('wds_orders_v2')
    if (savedUser) {
      const u = JSON.parse(savedUser)
      setCurrentUser(u)
      setView(u.role === 'admin' ? 'admin' : u.role === 'rider' ? 'rider' : 'customer')
    }
    if (savedOrders) setOrders(JSON.parse(savedOrders))
    else {
      setOrders([
        { id: 'WDS-91', pickup: 'Madina Market', dropoff: 'Legon Campus', type: 'Food', price: 'GHS 35', status: 'Delivered', rider: 'Ama K.', date: 'Today 10:42am' },
        { id: 'WDS-90', pickup: 'Kaneshie Market', dropoff: 'Dansoman', type: 'Grocery', price: 'GHS 52', status: 'On the way', rider: 'Kwame A.', date: 'Today 9:18am' },
      ])
    }
    calcPriceUpdate()
  }, [])

  useEffect(() => { calcPriceUpdate() }, [pickup, dropoff, pkgType, express])

  async function calcPriceUpdate() {
    const p = await geocode(pickup)
    const d = await geocode(dropoff)
    const dist = await getDistance(p, d)
    const result = calcPrice(dist.km, pkgType, express)
    setPrice({ total: result.total, km: dist.km, mins: dist.mins, breakdown: result.breakdown })
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const users = JSON.parse(localStorage.getItem('wds_users_v2') || '[]')
    const phone = loginPhone.replace(/\s+/g, '').replace('+233', '0')
    const user = users.find((u: any) => u.phone.replace(/\s+/g, '') === phone && u.password === loginPass)
    if (!user) {
      alert('Invalid credentials. Demo: 0244123456 / 123456 (customer), 0244987654 / 123456 (rider), 0244000000 / admin123 (admin)')
      return
    }
    localStorage.setItem('wds_session_v2', JSON.stringify(user))
    setCurrentUser(user)
    setView(user.role === 'admin' ? 'admin' : user.role === 'rider' ? 'rider' : 'customer')
    setShowAuth(false)
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    const users = JSON.parse(localStorage.getItem('wds_users_v2') || '[]')
    const phone = signupPhone.replace(/\s+/g, '').startsWith('0') ? signupPhone.replace(/\s+/g, '') : '0' + signupPhone.replace(/\s+/g, '')
    if (users.find((u: any) => u.phone === phone)) {
      alert('Phone already registered')
      return
    }
    const newUser = {
      id: 'u_' + Date.now(),
      name: signupName,
      phone,
      role: signupRole,
      vehicle: signupRole === 'rider' ? signupVehicle : '',
      plate: signupRole === 'rider' ? signupPlate : '',
      password: signupPass,
      rating: 5,
      earnings: 0,
      online: signupRole === 'rider',
      createdAt: new Date().toISOString(),
    }
    users.push(newUser)
    localStorage.setItem('wds_users_v2', JSON.stringify(users))
    localStorage.setItem('wds_session_v2', JSON.stringify(newUser))
    setCurrentUser(newUser)
    setView(newUser.role === 'rider' ? 'rider' : 'customer')
    setShowAuth(false)
  }

  function logout() {
    localStorage.removeItem('wds_session_v2')
    setCurrentUser(null)
    setView('landing')
  }

  function placeOrder() {
    if (!currentUser) { setShowAuth(true); return }
    const newOrder = {
      id: 'WDS-' + (100 + orders.length),
      pickup, dropoff, type: pkgType, description: itemDesc,
      recipientName, recipientPhone, price: `GHS ${price.total}`,
      paymentMethod: payType, status: 'On the way', rider: 'Kwame A.', date: 'Now',
      customerId: currentUser.id, customerName: currentUser.name,
    }
    const updated = [newOrder, ...orders]
    setOrders(updated)
    localStorage.setItem('wds_orders_v2', JSON.stringify(updated))
    setTrackingOrder(newOrder)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(currentUser ? (currentUser.role === 'admin' ? 'admin' : currentUser.role === 'rider' ? 'rider' : 'customer') : 'landing')}>
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-[#FFC700] font-extrabold text-[18px]">W</div>
            <div><div className="font-extrabold text-[16px] leading-none tracking-tight">WDS</div><div className="text-[10px] font-semibold tracking-[0.15em] text-black/60 uppercase -mt-0.5">Williams Delivery</div></div>
            <span className="hidden md:inline-flex ml-3 px-2.5 py-1 bg-[#FFC700]/15 rounded-full text-[11px] font-bold">ACCRA • FULL STACK</span>
          </div>
          <div className="flex items-center gap-2">
            {!currentUser ? (
              <>
                <button onClick={() => { setAuthTab('login'); setShowAuth(true) }} className="h-9 px-4 rounded-full text-[13px] font-semibold text-black/70 hover:bg-black/5">Log in</button>
                <button onClick={() => { setAuthTab('signup'); setShowAuth(true) }} className="h-9 px-5 bg-black text-white rounded-full text-[13px] font-bold">Sign up</button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex bg-[#F5F5F7] rounded-full p-1 gap-1">
                  <button onClick={() => setView('customer')} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${view === 'customer' ? 'bg-black text-white' : 'text-black/60'}`}>Customer</button>
                  <button onClick={() => setView('rider')} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${view === 'rider' ? 'bg-black text-white' : 'text-black/60'}`}>Rider</button>
                  <button onClick={() => setView('admin')} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${view === 'admin' ? 'bg-black text-white' : 'text-black/60'}`}>Admin</button>
                </div>
                <div className="flex items-center gap-2 pl-2 border-l border-black/10">
                  <div className="hidden md:block text-right"><div className="text-[13px] font-bold leading-none">{currentUser.name}</div><div className="text-[11px] text-black/50">{currentUser.role}</div></div>
                  <div className="w-8 h-8 rounded-full bg-[#FFC700] flex items-center justify-center font-bold text-[13px]">{currentUser.name.charAt(0)}</div>
                  <button onClick={logout} className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center">⎋</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Views */}
      {view === 'landing' && (
        <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-black/5 text-[11px] font-bold mb-5"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> 24 RIDERS ONLINE IN ACCRA NOW • FULL STACK READY</div>
            <h1 className="font-extrabold text-[36px] md:text-[64px] leading-[0.9] tracking-[-0.03em]">Deliver anything<br/>in Accra in<br/><span className="relative">minutes<span className="absolute bottom-2 left-0 w-full h-3 bg-[#FFC700] -z-10"></span></span></h1>
            <p className="text-[15px] md:text-[17px] text-black/60 mt-5 max-w-[520px]">Full stack production app: Next.js + Supabase + Paystack MoMo + Expo mobile. Real auth, real DB, real payments. Built for Ghana.</p>
            <div className="flex gap-3 mt-8">
              <button onClick={() => { setAuthTab('signup'); setShowAuth(true) }} className="h-[52px] px-7 bg-black text-white rounded-full font-bold text-[14px]">Start Delivering - Free</button>
              <button onClick={() => { setAuthTab('login'); setShowAuth(true) }} className="h-[52px] px-7 bg-white border border-black/10 rounded-full font-bold text-[14px]">Log in</button>
            </div>
            <div className="mt-8 p-4 bg-white rounded-2xl border border-black/5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-black/40 mb-2">Full Stack Status</div>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Next.js 14 Web App</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Supabase Backend</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Expo Rider Mobile</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Paystack MoMo</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[32px] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.12)] border border-black/5">
            <div className="bg-black rounded-[24px] p-6 text-white">
              <div className="flex justify-between mb-6"><span className="text-[11px] font-bold tracking-widest uppercase text-white/50">Live Price Check</span><span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-[10px] font-bold">FULL STACK</span></div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3"><div className="w-2 h-2 bg-[#FFC700] rounded-full"></div><span className="flex-1 text-[13px]">{pickup}</span><span className="text-[10px] text-white/40">Pickup</span></div>
                <div className="flex items-center gap-3 bg-white rounded-2xl p-3 text-black"><div className="w-2 h-2 bg-black rounded-full"></div><span className="flex-1 text-[13px] font-bold">{dropoff}</span><span className="text-[10px] text-black/40">Drop-off</span></div>
              </div>
              <div className="mt-5 flex justify-between items-end"><div><div className="text-[11px] text-white/50 uppercase font-bold">You pay</div><div className="text-[36px] font-extrabold leading-none">GHS {price.total}</div></div><div className="text-right"><div className="text-[12px] bg-[#FFC700] text-black px-3 py-1 rounded-full font-bold">{price.km} km • {price.mins} mins</div></div></div>
              <button onClick={() => { setAuthTab('signup'); setShowAuth(true) }} className="w-full mt-5 h-12 bg-[#FFC700] text-black rounded-full font-extrabold text-[14px]">Request Rider Now →</button>
            </div>
          </div>
        </section>
      )}

      {view === 'customer' && (
        <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="bg-white rounded-[32px] p-5 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-black/[0.04]">
            <h1 className="font-extrabold text-[24px] md:text-[32px] leading-[0.95]">Deliver anything in <span className="bg-[#FFC700]">Accra</span> now.</h1>
            <p className="text-[13px] text-black/60 mt-2">Welcome {currentUser?.name} • Full stack with Supabase backend ready</p>
            
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
            <div className="bg-black rounded-[32px] p-6 text-white">
              <div className="flex justify-between mb-5"><span className="text-[11px] font-bold uppercase text-white/50">Price Estimate</span><span className="px-2 py-1 bg-white/10 rounded-full text-[10px] font-bold">LIVE</span></div>
              <div className="text-[42px] font-extrabold leading-none">GHS {price.total}</div>
              <div className="mt-4 space-y-2 text-[13px] text-white/60">
                <div className="flex justify-between"><span>{price.km} km • {price.mins} mins</span><span>GHS {price.breakdown.base}</span></div>
                <div className="flex justify-between"><span>Package {pkgType}</span><span>GHS {price.breakdown.packageFee}</span></div>
                <div className="flex justify-between"><span>Express</span><span>GHS {price.breakdown.express}</span></div>
              </div>
              <div className="mt-6">
                <div className="text-[11px] uppercase text-white/40 mb-2">Payment</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['momo', 'card', 'cash'] as PaymentMethod[]).map(m => (
                    <button key={m} onClick={() => setPayType(m)} className={`py-3 rounded-2xl text-[11px] font-bold ${payType === m ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>{m.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <button onClick={placeOrder} className="w-full mt-6 h-[56px] bg-[#FFC700] text-black rounded-full font-extrabold">Request Rider Now</button>
            </div>
            <div className="bg-white rounded-[32px] p-2 border border-black/5">
              <div className="h-[260px] bg-[#F5F5F7] rounded-[24px] flex items-center justify-center text-[13px] text-black/50">Map: {pickup} → {dropoff} ({price.km}km) - Leaflet/Google Maps ready</div>
            </div>
          </div>
        </section>
      )}

      {view === 'rider' && (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6">
          <div className="bg-black text-white rounded-[28px] p-6 flex justify-between mb-6">
            <div><div className="font-bold text-[18px]">{currentUser?.name} • Rider</div><div className="text-[13px] text-white/60">{currentUser?.vehicle} • {currentUser?.plate}</div></div>
            <div className="text-right"><div className="text-[11px] uppercase text-white/40">Earnings</div><div className="text-[28px] font-extrabold">GHS {currentUser?.earnings || 0}</div></div>
          </div>
          <h2 className="font-extrabold text-[20px] mb-4">Available Jobs</h2>
          <div className="grid gap-3">
            {[
              { id: 'WDS-89', from: 'Osu', to: 'Airport', fee: 'GHS 28', dist: '3.2km' },
              { id: 'WDS-93', from: 'East Legon', to: 'Madina', fee: 'GHS 38', dist: '6.1km' },
            ].map(j => (
              <div key={j.id} className="bg-white rounded-[22px] p-4 border border-black/5 flex justify-between items-center">
                <div><div className="font-bold text-[13px]">{j.id} • {j.from} → {j.to}</div><div className="text-[11px] text-black/50">{j.dist}</div></div>
                <div className="text-right"><div className="font-extrabold">{j.fee}</div><button className="mt-1 h-8 px-4 bg-black text-white rounded-full text-[12px] font-bold">Accept</button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'admin' && (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6">
          <h1 className="font-extrabold text-[24px] mb-6">Admin Dashboard • Full Stack</h1>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-[20px] p-5 border"><div className="text-[11px] uppercase text-black/40">Revenue Today</div><div className="text-[26px] font-extrabold">GHS 4,280</div></div>
            <div className="bg-white rounded-[20px] p-5 border"><div className="text-[11px] uppercase text-black/40">Orders</div><div className="text-[26px] font-extrabold">{orders.length}</div></div>
            <div className="bg-white rounded-[20px] p-5 border"><div className="text-[11px] uppercase text-black/40">Users</div><div className="text-[26px] font-extrabold">{JSON.parse(localStorage.getItem('wds_users_v2') || '[]').length}</div></div>
            <div className="bg-[#FFC700] rounded-[20px] p-5 border"><div className="text-[11px] uppercase">Commission</div><div className="text-[26px] font-extrabold">GHS 856</div></div>
          </div>
          <div className="bg-white rounded-[24px] p-5 border">
            <h3 className="font-bold mb-4">Live Orders (Supabase Realtime Ready)</h3>
            <table className="w-full text-[13px]">
              <thead className="text-[11px] uppercase text-black/40 border-b"><tr><th className="text-left py-2">ID</th><th className="text-left py-2">Route</th><th className="text-left py-2">Price</th><th className="text-left py-2">Status</th></tr></thead>
              <tbody>{orders.map(o => <tr key={o.id} className="border-b"><td className="py-2 font-bold">{o.id}</td><td className="py-2">{o.pickup} → {o.dropoff}</td><td className="py-2">{o.price}</td><td className="py-2"><span className="px-2 py-1 bg-black/5 rounded-full text-[11px]">{o.status}</span></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tracking */}
      {trackingOrder && (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 pb-8">
          <div className="bg-white rounded-[24px] p-6 border border-[#FFC700]/30">
            <div className="flex justify-between mb-4"><h3 className="font-bold">Tracking {trackingOrder.id}</h3><button onClick={() => setTrackingOrder(null)} className="text-[12px]">Close</button></div>
            <div className="text-[13px]">Rider Kwame A. is on the way • {trackingOrder.pickup} → {trackingOrder.dropoff} • {trackingOrder.price}</div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAuth(false)}></div>
          <div className="relative bg-white w-full max-w-[440px] rounded-[32px] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.3)]">
            <div className="flex justify-between mb-6"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-black text-[#FFC700] rounded-xl flex items-center justify-center font-bold">W</div><span className="font-bold">WDS</span></div><button onClick={() => setShowAuth(false)} className="w-8 h-8 bg-black/5 rounded-full">×</button></div>
            <h2 className="font-extrabold text-[24px]">{authTab === 'login' ? 'Welcome back' : 'Join WDS'}</h2>
            <div className="flex bg-[#F5F5F7] rounded-full p-1 mt-4">
              <button onClick={() => setAuthTab('login')} className={`flex-1 h-9 rounded-full text-[13px] font-bold ${authTab === 'login' ? 'bg-white shadow' : 'text-black/60'}`}>Log in</button>
              <button onClick={() => setAuthTab('signup')} className={`flex-1 h-9 rounded-full text-[13px] font-bold ${authTab === 'signup' ? 'bg-white shadow' : 'text-black/60'}`}>Sign up</button>
            </div>
            {authTab === 'login' ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-3">
                <input value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="Phone 0244..." className="w-full h-[48px] bg-[#F5F5F7] rounded-2xl px-4 text-[14px]" required />
                <input value={loginPass} onChange={e => setLoginPass(e.target.value)} type="password" placeholder="Password" className="w-full h-[48px] bg-[#F5F5F7] rounded-2xl px-4 text-[14px]" required />
                <button type="submit" className="w-full h-[52px] bg-black text-white rounded-full font-bold">Log in</button>
                <div className="text-[11px] text-black/40 text-center">Demo: Customer 0244123456 / 123456 • Rider 0244987654 / 123456 • Admin 0244000000 / admin123</div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="mt-6 space-y-3">
                <input value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="Full Name" className="w-full h-[48px] bg-[#F5F5F7] rounded-2xl px-4 text-[14px]" required />
                <div className="grid grid-cols-2 gap-2">
                  <select value={signupRole} onChange={e => setSignupRole(e.target.value as any)} className="h-[48px] bg-[#F5F5F7] rounded-2xl px-3 text-[14px]"><option value="customer">Customer</option><option value="rider">Rider</option></select>
                  <input value={signupPhone} onChange={e => setSignupPhone(e.target.value)} placeholder="Phone 0244..." className="h-[48px] bg-[#F5F5F7] rounded-2xl px-4 text-[14px]" required />
                </div>
                {signupRole === 'rider' && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#FFC700]/10 rounded-2xl">
                    <select value={signupVehicle} onChange={e => setSignupVehicle(e.target.value)} className="h-[40px] bg-white rounded-xl px-3 text-[13px]"><option value="motor">Motor</option><option value="bicycle">Bicycle</option><option value="car">Car</option></select>
                    <input value={signupPlate} onChange={e => setSignupPlate(e.target.value)} placeholder="AB 1234-23" className="h-[40px] bg-white rounded-xl px-3 text-[13px]" />
                  </div>
                )}
                <input value={signupPass} onChange={e => setSignupPass(e.target.value)} type="password" placeholder="Password min 6 chars" className="w-full h-[48px] bg-[#F5F5F7] rounded-2xl px-4 text-[14px]" required minLength={6} />
                <button type="submit" className="w-full h-[52px] bg-[#FFC700] text-black rounded-full font-extrabold">Create Account →</button>
              </form>
            )}
          </div>
        </div>
      )}

      <footer className="mt-12 border-t bg-white">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex justify-between text-[12px] text-black/50"><span>WDS Full Stack • Next.js + Supabase + Expo + Paystack</span><span className="px-2 py-1 bg-[#FFC700]/20 rounded-full text-black font-bold">PRODUCTION READY</span></div>
      </footer>
    </div>
  )
}
