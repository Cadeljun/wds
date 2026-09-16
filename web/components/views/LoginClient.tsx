'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginSchema, getFieldErrors } from '@/lib/validation'
import { sanitizeGhanaPhone } from '@/lib/sanitize'

export default function LoginClient() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpPhone, setOtpPhone] = useState('')

  function formatPhone(value: string) {
    // Format Ghana phone as 0244 123 456
    const digits = value.replace(/\D/g, '').substring(0, 10)
    if (digits.length <= 4) return digits
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
    if (errors.phone) {
      setErrors(prev => {
        const ne = { ...prev }
        delete ne.phone
        return ne
      })
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    // Zod validation with Ghana phone
    const result = loginSchema.safeParse({ phone, password })
    if (!result.success) {
      setErrors(getFieldErrors(result.error))
      setIsLoading(false)
      return
    }

    const sanitizedPhone = sanitizeGhanaPhone(result.data.phone)

    // Try API first (with validation, rate limiting, CORS)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sanitizedPhone, password: result.data.password }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors)
        } else {
          setErrors({ phone: data.error || 'Login failed' })
        }
        setIsLoading(false)
        return
      }

      // Success - save session
      const allUsers = JSON.parse(localStorage.getItem('wds_users_v2') || '[]')
      let user = allUsers.find((u: any) => u.phone === sanitizedPhone && u.password === result.data.password)
      
      // If not in localStorage but API returned demo user, create it
      if (!user && data.user) {
        user = {
          id: 'u_' + Date.now(),
          name: data.user.name,
          phone: sanitizedPhone,
          role: data.user.role,
          password: result.data.password,
          rating: 5,
          earnings: data.user.role === 'rider' ? 286 : 0,
          online: data.user.role === 'rider',
          createdAt: new Date().toISOString(),
        }
        allUsers.push(user)
        localStorage.setItem('wds_users_v2', JSON.stringify(allUsers))
      }

      if (user) {
        localStorage.setItem('wds_session_v2', JSON.stringify(user))
        router.push('/')
      }
    } catch (err) {
      console.error(err)
      // Fallback to localStorage only
      const allUsers = JSON.parse(localStorage.getItem('wds_users_v2') || '[]')
      const user = allUsers.find((u: any) => u.phone === sanitizedPhone && u.password === result.data.password)
      if (user) {
        localStorage.setItem('wds_session_v2', JSON.stringify(user))
        router.push('/')
      } else {
        setErrors({ phone: 'Invalid phone or password. Try demo logins below.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleOtpLogin() {
    const result = loginSchema.shape.phone.safeParse(phone)
    if (!result.success) {
      setErrors({ phone: result.error.issues[0].message })
      return
    }
    setOtpPhone(phone)
    setShowOtp(true)
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`)
      if (next) (next as HTMLInputElement).focus()
    }

    // Auto-verify when 6 digits
    if (newOtp.join('').length === 6) {
      verifyOtp(newOtp.join(''))
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`)
      if (prev) (prev as HTMLInputElement).focus()
    }
  }

  function verifyOtp(code: string) {
    if (code === '123456' || code === '000000') {
      // Find user by phone or create demo
      const allUsers = JSON.parse(localStorage.getItem('wds_users_v2') || '[]')
      const cleanPhone = sanitizeGhanaPhone(otpPhone)
      let user = allUsers.find((u: any) => u.phone === cleanPhone)
      
      if (!user) {
        // Create demo customer for OTP login
        user = {
          id: 'u_' + Date.now(),
          name: 'Ama Mensah',
          phone: cleanPhone,
          role: 'customer',
          password: '123456',
          rating: 5,
          earnings: 0,
          createdAt: new Date().toISOString(),
        }
        allUsers.push(user)
        localStorage.setItem('wds_users_v2', JSON.stringify(allUsers))
      }

      localStorage.setItem('wds_session_v2', JSON.stringify(user))
      router.push('/')
    } else {
      alert('Invalid OTP. Use 123456 for demo.')
      setOtp(['', '', '', '', '', ''])
    }
  }

  function fillDemo(role: 'customer' | 'rider' | 'admin') {
    if (role === 'customer') {
      setPhone('0244 123 456')
      setPassword('123456')
    } else if (role === 'rider') {
      setPhone('0244 987 654')
      setPassword('123456')
    } else {
      setPhone('0244 000 000')
      setPassword('admin123')
    }
    setErrors({})
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[440px]">
          <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-black/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black text-[#FFC700] rounded-xl flex items-center justify-center font-extrabold text-[18px]">W</div>
                <div><div className="font-extrabold text-[16px] leading-none">WDS</div><div className="text-[10px] font-bold tracking-widest uppercase text-black/50">Williams Delivery</div></div>
              </div>
              <div className="text-[11px] px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>24 ONLINE</div>
            </div>

            {!showOtp ? (
              <>
                <h1 className="font-extrabold text-[28px] leading-[1.1] tracking-tight">Welcome back to WDS</h1>
                <p className="text-[13px] text-black/60 mt-2">Log in to track deliveries, request riders, manage fleet. Ghana phone validation, secured.</p>

                <form onSubmit={handleLogin} className="mt-8 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-black/50 mb-1.5 block">Ghana Phone Number</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-black">+233</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="244 123 456"
                        className={`w-full h-[52px] bg-[#F5F5F7] border rounded-2xl pl-14 pr-4 text-[15px] font-medium focus:bg-white focus:border-black transition ${errors.phone ? 'border-red-500 bg-red-50' : 'border-black/5'}`}
                        required
                      />
                    </div>
                    {errors.phone ? (
                      <p className="text-red-500 text-[11px] mt-1.5 font-semibold flex items-center gap-1">⚠️ {errors.phone}</p>
                    ) : (
                      <p className="text-[10px] text-black/40 mt-1.5">Valid prefixes: 020, 023, 024, 026, 027, 050, 053, 054, 055, 059 (MTN, Vodafone, AirtelTigo, Glo)</p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wide text-black/50">Password</label>
                      <a href="#" className="text-[11px] font-bold underline">Forgot?</a>
                    </div>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full h-[52px] bg-[#F5F5F7] border rounded-2xl px-4 pr-12 text-[15px] font-medium focus:bg-white focus:border-black transition ${errors.password ? 'border-red-500 bg-red-50' : 'border-black/5'}`}
                        required
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center border border-black/5 text-[12px]">
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-[11px] mt-1.5 font-semibold">⚠️ {errors.password}</p>}
                  </div>

                  <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-black/70">Remember me on this device</span>
                  </label>

                  <button type="submit" disabled={isLoading} className="w-full h-[56px] bg-black text-white rounded-full font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-black/90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Verifying securely...
                      </>
                    ) : (
                      <>🔐 Log in to WDS</>
                    )}
                  </button>

                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-[1px] bg-black/10"></div>
                    <span className="text-[11px] font-bold text-black/30 uppercase">Or</span>
                    <div className="flex-1 h-[1px] bg-black/10"></div>
                  </div>

                  <button type="button" onClick={handleOtpLogin} className="w-full h-[52px] bg-[#FFC700]/15 border border-[#FFC700]/30 text-black rounded-full font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-[#FFC700]/20 transition">
                    📱 Log in with OTP (SMS)
                  </button>
                </form>

                <div className="mt-8">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-black/40 mb-3">Quick Demo Logins (Click to Fill)</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => fillDemo('customer')} className="h-12 bg-[#F5F5F7] border border-black/5 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-black/5 transition">
                      <span className="text-[16px]">👤</span><span className="text-[10px] font-bold">Customer</span><span className="text-[9px] text-black/50">0244 123 456</span>
                    </button>
                    <button onClick={() => fillDemo('rider')} className="h-12 bg-[#FFC700]/20 border border-[#FFC700]/30 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-[#FFC700]/30 transition">
                      <span className="text-[16px]">🏍️</span><span className="text-[10px] font-bold">Rider</span><span className="text-[9px] text-black/50">0244 987 654</span>
                    </button>
                    <button onClick={() => fillDemo('admin')} className="h-12 bg-black text-white rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-black/80 transition">
                      <span className="text-[16px]">👑</span><span className="text-[10px] font-bold">Admin</span><span className="text-[9px] text-white/60">0244 000 000</span>
                    </button>
                  </div>
                  <div className="mt-3 text-[10px] text-black/40 text-center">Password: Customer/Rider 123456, Admin admin123 • All validated with Zod Ghana phone</div>
                </div>

                <div className="mt-6 text-center text-[13px]">
                  <span className="text-black/60">Don't have account?</span> <a href="/auth/signup" className="font-bold underline">Sign up in 30 seconds →</a>
                </div>
              </>
            ) : (
              <>
                <h1 className="font-extrabold text-[24px] leading-tight">Enter OTP Code</h1>
                <p className="text-[13px] text-black/60 mt-2">We sent 6-digit code to <span className="font-bold text-black">+233 {otpPhone}</span>. Demo code: <span className="font-bold bg-[#FFC700] px-1.5 py-0.5 rounded">123456</span></p>
                
                <div className="mt-8">
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className="w-12 h-14 bg-[#F5F5F7] border-2 border-black/5 rounded-2xl text-center text-[20px] font-bold focus:border-[#FFC700] focus:bg-white transition"
                      />
                    ))}
                  </div>
                  <button onClick={() => verifyOtp(otp.join(''))} className="w-full mt-6 h-[52px] bg-black text-white rounded-full font-bold">Verify OTP →</button>
                  <div className="text-center mt-4 text-[12px]"><button onClick={() => setShowOtp(false)} className="font-bold underline">← Back to password login</button></div>
                </div>
              </>
            )}

            <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-between text-[11px] text-black/40">
              <span className="flex items-center gap-1.5">🛡️ Secured with Zod + XSS + RLS</span>
              <span>🇬🇭 GHS • Accra • 2026</span>
            </div>
          </div>

          <div className="mt-4 text-center text-[11px] text-black/30">
            By logging in, you agree to WDS Terms, Privacy, Ghana Data Protection Act
          </div>
        </div>
      </div>

      {/* Right - Branding */}
      <div className="hidden lg:flex flex-1 bg-black text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FFC700]/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div>
          <div className="w-12 h-12 bg-[#FFC700] text-black rounded-2xl flex items-center justify-center font-extrabold text-[22px]">W</div>
          <h2 className="font-extrabold text-[40px] leading-[0.9] mt-12">Deliver anything<br/>in Accra in<br/><span className="text-[#FFC700]">minutes</span></h2>
          <p className="text-[15px] text-white/60 mt-6 max-w-[400px]">Join 24 riders online now. Food, parcels, groceries, medicine, documents. MoMo, Card, Cash. Insured GHS 2000.</p>
        </div>
        <div className="bg-white/5 rounded-[24px] p-6 border border-white/10">
          <div className="flex items-center gap-3"><img src="https://i.pravatar.cc/100?img=12" className="w-10 h-10 rounded-full" /><div><div className="font-bold text-[13px]">Kwame Asare • Rider</div><div className="text-[11px] text-white/50">Motor AB 1234-23 • 4.9★ • GHS 286 today</div></div><span className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></span></div>
          <div className="mt-4 text-[12px] text-white/70">"WDS changed my hustle. I see jobs near me in East Legon, accept in 1 tap, earn 80% via MoMo daily. No more WhatsApp calls from dispatch."</div>
        </div>
      </div>
    </div>
  )
}
