'use client'

interface JobCardProps {
  id: string
  from: string
  to: string
  fee: string
  dist: string
  type: string
  urgent?: boolean
  onAccept: () => void
}

export default function JobCard({ id, from, to, fee, dist, type, urgent, onAccept }: JobCardProps) {
  return (
    <div className={`bg-white rounded-[22px] p-4 border ${urgent ? 'border-[#FFC700]' : 'border-black/5'} flex gap-4 items-center`}>
      <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[11px] font-bold">{type[0]}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold">{id}</span>
          {urgent && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">URGENT</span>}
          <span className="text-[11px] text-black/40">{dist} • {type}</span>
        </div>
        <div className="text-[13px] font-semibold mt-1 leading-tight">{from} → {to}</div>
        <div className="text-[11px] text-black/50 mt-1">Customer: 0244 567 890 • Cash + MoMo</div>
      </div>
      <div className="text-right">
        <div className="font-extrabold text-[16px]">{fee}</div>
        <button onClick={onAccept} className="mt-2 h-8 px-4 bg-black text-white rounded-full text-[12px] font-bold hover:bg-black/80">Accept</button>
      </div>
    </div>
  )
}
