'use client'

// Small, always needed, keep eager - this is the landing page
// No heavy dependencies

interface LandingViewProps {
  onSignup: () => void
  onLogin: () => void
  pickup: string
  dropoff: string
  price: { total: number; km: number; mins: number }
}

export default function LandingView({ onSignup, onLogin, pickup, dropoff, price }: LandingViewProps) {
  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-black/5 text-[11px] font-bold mb-5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> 24 RIDERS ONLINE IN ACCRA NOW • CODE-SPLIT
        </div>
        <h1 className="font-extrabold text-[36px] md:text-[64px] leading-[0.9] tracking-[-0.03em]">
          Deliver anything<br />in Accra in<br />
          <span className="relative">minutes<span className="absolute bottom-2 left-0 w-full h-3 bg-[#FFC700] -z-10"></span></span>
        </h1>
        <p className="text-[15px] md:text-[17px] text-black/60 mt-5 max-w-[520px]">
          Full stack production app: Next.js + Supabase + Paystack MoMo + Expo mobile. Now with code-splitting - landing loads only 150KB, not 480KB.
        </p>
        <div className="flex gap-3 mt-8">
          <button onClick={onSignup} className="h-[52px] px-7 bg-black text-white rounded-full font-bold text-[14px]">Start Delivering - Free</button>
          <button onClick={onLogin} className="h-[52px] px-7 bg-white border border-black/10 rounded-full font-bold text-[14px]">Log in</button>
        </div>
        <div className="mt-8 p-4 bg-white rounded-2xl border border-black/5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-black/40 mb-2">Bundle Optimized ✓</div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Landing: ~150KB gzipped</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Map loads on demand</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Admin charts split</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Rider calendar lazy</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-[32px] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.12)] border border-black/5">
        <div className="bg-black rounded-[24px] p-6 text-white">
          <div className="flex justify-between mb-6"><span className="text-[11px] font-bold tracking-widest uppercase text-white/50">Live Price Check</span><span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-[10px] font-bold">CODE-SPLIT</span></div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3"><div className="w-2 h-2 bg-[#FFC700] rounded-full"></div><span className="flex-1 text-[13px]">{pickup}</span><span className="text-[10px] text-white/40">Pickup</span></div>
            <div className="flex items-center gap-3 bg-white rounded-2xl p-3 text-black"><div className="w-2 h-2 bg-black rounded-full"></div><span className="flex-1 text-[13px] font-bold">{dropoff}</span><span className="text-[10px] text-black/40">Drop-off</span></div>
          </div>
          <div className="mt-5 flex justify-between items-end"><div><div className="text-[11px] text-white/50 uppercase font-bold">You pay</div><div className="text-[36px] font-extrabold leading-none">GHS {price.total}</div></div><div className="text-right"><div className="text-[12px] bg-[#FFC700] text-black px-3 py-1 rounded-full font-bold">{price.km} km • {price.mins} mins</div></div></div>
          <button onClick={onSignup} className="w-full mt-5 h-12 bg-[#FFC700] text-black rounded-full font-extrabold text-[14px]">Request Rider Now →</button>
        </div>
      </div>
    </section>
  )
}
