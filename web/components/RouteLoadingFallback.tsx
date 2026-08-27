'use client'

export function RouteLoadingFallback({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 animate-pulse">
      <div className="w-12 h-12 bg-[#F5F5F7] rounded-2xl flex items-center justify-center mb-4">
        <div className="w-6 h-6 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
      </div>
      <div className="text-[13px] font-bold text-black/60">{label}</div>
      <div className="mt-3 flex gap-1">
        <div className="w-1.5 h-1.5 bg-black/20 rounded-full animate-bounce"></div>
        <div className="w-1.5 h-1.5 bg-black/20 rounded-full animate-bounce [animation-delay:0.1s]"></div>
        <div className="w-1.5 h-1.5 bg-black/20 rounded-full animate-bounce [animation-delay:0.2s]"></div>
      </div>
    </div>
  )
}

export function MapLoadingFallback() {
  return (
    <div className="h-[260px] bg-[#F5F5F7] rounded-[24px] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 mx-auto border-2 border-black/10 border-t-black rounded-full animate-spin mb-2"></div>
        <div className="text-[12px] font-bold text-black/40">Loading map...</div>
      </div>
    </div>
  )
}

export function PriceCardSkeleton() {
  return (
    <div className="bg-black rounded-[32px] p-6 animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded-full mb-5"></div>
      <div className="h-10 w-32 bg-white/10 rounded-xl"></div>
      <div className="mt-6 space-y-2">
        <div className="h-3 bg-white/5 rounded-full"></div>
        <div className="h-3 bg-white/5 rounded-full w-3/4"></div>
      </div>
      <div className="mt-6 h-12 bg-white/10 rounded-full"></div>
    </div>
  )
}
