'use client'

interface PriceCardProps {
  total: number
  km: number
  mins: number
  breakdown: {
    base: number
    distance: number
    packageFee: number
    express: number
  }
  packageType: string
  payType: 'momo' | 'card' | 'cash'
  onPayTypeChange: (type: 'momo' | 'card' | 'cash') => void
  onOrder: () => void
}

export default function PriceCard({ total, km, mins, breakdown, packageType, payType, onPayTypeChange, onOrder }: PriceCardProps) {
  return (
    <div className="bg-black rounded-[32px] p-6 md:p-7 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-[#FFC700]/20 rounded-full blur-[40px] -mr-12 -mt-12 pointer-events-none"></div>
      <div className="flex items-center justify-between mb-5">
        <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/50">Price Estimate</div>
        <div className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>LIVE PRICING</div>
      </div>
      <div className="flex items-end gap-2">
        <div className="text-[42px] font-extrabold leading-none tracking-tight">GHS {total}</div>
        <div className="text-[13px] text-white/60 mb-2 font-medium">/ delivery</div>
      </div>
      <div className="mt-4 space-y-2 text-[13px]">
        <div className="flex justify-between text-white/60"><span>{km} km • {mins} mins</span><span>GHS {breakdown.base} base</span></div>
        <div className="flex justify-between text-white/60"><span>Package • {packageType}</span><span>GHS {breakdown.packageFee}</span></div>
        <div className="flex justify-between text-white/60"><span>Express fee</span><span>GHS {breakdown.express}</span></div>
        <div className="h-[1px] bg-white/10 my-3"></div>
        <div className="flex justify-between font-semibold text-white"><span>You pay</span><span>GHS {total}</span></div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-white/40 mb-3">Payment Method</div>
        <div className="grid grid-cols-3 gap-2">
          {(['momo', 'card', 'cash'] as const).map(m => (
            <button
              key={m}
              onClick={() => onPayTypeChange(m)}
              className={`rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 border-2 ${payType === m ? 'bg-white text-black border-white' : 'bg-white/10 border-white/10 hover:bg-white/15'}`}
            >
              <span className="text-[16px]">{m === 'momo' ? '📱' : m === 'card' ? '💳' : '💵'}</span>
              <span className="text-[10px] font-bold">{m.toUpperCase()}</span>
            </button>
          ))}
        </div>
        {payType === 'momo' && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <button className="text-[10px] bg-[#FFC700] text-black font-bold rounded-full py-1.5">MTN</button>
            <button className="text-[10px] bg-white/10 border border-white/10 rounded-full py-1.5 font-semibold">Vodafone</button>
            <button className="text-[10px] bg-white/10 border border-white/10 rounded-full py-1.5 font-semibold">AirtelTigo</button>
          </div>
        )}
      </div>

      <button onClick={onOrder} className="w-full mt-6 h-[56px] bg-[#FFC700] text-black rounded-full font-extrabold text-[15px] flex items-center justify-center gap-2 hover:brightness-110 transition">
        🏍️ Request Rider Now
      </button>
      <div className="text-[11px] text-white/40 text-center mt-3">Paystack secured • Insured up to GHS 2,000</div>
    </div>
  )
}
