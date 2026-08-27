'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [phone, setPhone] = useState('')
  const [pass, setPass] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'customer' | 'rider'>('customer')
  const [vehicle, setVehicle] = useState('motor')
  const [plate, setPlate] = useState('')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const users = JSON.parse(localStorage.getItem('wds_users_v2') || '[]')
    const cleanPhone = phone.replace(/\s+/g, '').replace('+233', '0')
    const user = users.find((u: any) => u.phone.replace(/\s+/g, '') === cleanPhone && u.password === pass)
    if (!user) {
      alert('Invalid credentials. Demo: 0244123456 / 123456 (customer), 0244987654 / 123456 (rider), 0244000000 / admin123 (admin)')
      return
    }
    localStorage.setItem('wds_session_v2', JSON.stringify(user))
    router.push('/')
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    const users = JSON.parse(localStorage.getItem('wds_users_v2') || '[]')
    const cleanPhone = phone.replace(/\s+/g, '').startsWith('0') ? phone.replace(/\s+/g, '') : '0' + phone.replace(/\s+/g, '')
    if (users.find((u: any) => u.phone === cleanPhone)) {
      alert('Phone already exists')
      return
    }
    // Simulate OTP - in production this would be Supabase phone OTP
    const otp = prompt('Enter OTP sent to ' + cleanPhone + ' (demo: use 123456)')
    if (otp !== '123456' && otp !== '000000') {
      alert('Invalid OTP. Use 123456 for demo')
      return
    }
    const newUser = {
      id: 'u_' + Date.now(),
      name, phone: cleanPhone, role,
      vehicle: role === 'rider' ? vehicle : '',
      plate: role === 'rider' ? plate : '',
      password: pass, rating: 5, earnings: 0, online: role === 'rider',
      createdAt: new Date().toISOString(),
    }
    users.push(newUser)
    localStorage.setItem('wds_users_v2', JSON.stringify(users))
    localStorage.setItem('wds_session_v2', JSON.stringify(newUser))
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[440px] rounded-[32px] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-black text-[#FFC700] rounded-xl flex items-center justify-center font-bold">W</div>
          <span className="font-bold">WDS Williams Delivery</span>
        </div>
        <h1 className="font-extrabold text-[26px] leading-tight">{tab === 'login' ? 'Welcome back to WDS' : 'Join WDS in 30 seconds'}</h1>
        <p className="text-[13px] text-black/60 mt-2">Accra's fastest delivery • MoMo • Card • Cash</p>

        <div className="flex bg-[#F5F5F7] rounded-full p-1 mt-6">
          <button onClick={() => setTab('login')} className={`flex-1 h-9 rounded-full text-[13px] font-bold ${tab === 'login' ? 'bg-white shadow' : 'text-black/60'}`}>Log in</button>
          <button onClick={() => setTab('signup')} className={`flex-1 h-9 rounded-full text-[13px] font-bold ${tab === 'signup' ? 'bg-white shadow' : 'text-black/60'}`}>Sign up</button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone 0244 123 456" className="w-full h-[48px] bg-[#F5F5F7] rounded-2xl px-4 text-[14px]" required />
            <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="Password" className="w-full h-[48px] bg-[#F5F5F7] rounded-2xl px-4 text-[14px]" required />
            <button type="submit" className="w-full h-[52px] bg-black text-white rounded-full font-bold">Log in to WDS</button>
            <div className="text-[11px] text-black/40 text-center mt-3">
              Demo: Customer 0244123456 / 123456 • Rider 0244987654 / 123456 • Admin 0244000000 / admin123
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="mt-6 space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="w-full h-[48px] bg-[#F5F5F7] rounded-2xl px-4 text-[14px]" required />
            <div className="grid grid-cols-2 gap-2">
              <select value={role} onChange={e => setRole(e.target.value as any)} className="h-[48px] bg-[#F5F5F7] rounded-2xl px-3 text-[14px]">
                <option value="customer">Customer</option>
                <option value="rider">Rider</option>
              </select>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone 0244..." className="h-[48px] bg-[#F5F5F7] rounded-2xl px-4 text-[14px]" required />
            </div>
            {role === 'rider' && (
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#FFC700]/10 rounded-2xl border border-[#FFC700]/20">
                <select value={vehicle} onChange={e => setVehicle(e.target.value)} className="h-[40px] bg-white rounded-xl px-3 text-[13px]">
                  <option value="motor">Motorbike</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="car">Car</option>
                </select>
                <input value={plate} onChange={e => setPlate(e.target.value)} placeholder="AB 1234-23" className="h-[40px] bg-white rounded-xl px-3 text-[13px]" />
              </div>
            )}
            <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="Password min 6 chars" className="w-full h-[48px] bg-[#F5F5F7] rounded-2xl px-4 text-[14px]" required minLength={6} />
            <button type="submit" className="w-full h-[52px] bg-[#FFC700] text-black rounded-full font-extrabold">Create Account & Send OTP →</button>
            <div className="text-[10px] text-black/40 text-center">OTP for demo: 123456 • Supabase phone OTP in production</div>
          </form>
        )}
      </div>
    </div>
  )
}
