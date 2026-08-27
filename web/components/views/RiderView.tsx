'use client'

import dynamic from 'next/dynamic'
import { RouteLoadingFallback } from '@/components/RouteLoadingFallback'

// Heavy map - lazy loaded only when rider view is needed
const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-[320px] bg-[#F5F5F7] rounded-[18px] animate-pulse flex items-center justify-center text-[12px] text-black/40">Loading rider map...</div>
})

const JobCard = dynamic(() => import('@/components/JobCard'), {
  loading: () => <div className="h-[100px] bg-white rounded-[22px] animate-pulse border" />
})

interface RiderViewProps {
  currentUser: any
  onAcceptJob: (job: any) => void
}

export default function RiderView({ currentUser, onAcceptJob }: RiderViewProps) {
  const jobs = [
    { id: 'WDS-89', from: 'Osu, Oxford St', to: 'Airport Residential', fee: 'GHS 28', dist: '3.2km', type: 'Document', urgent: true },
    { id: 'WDS-93', from: 'East Legon, Bawaleshie', to: 'Madina, Zongo', fee: 'GHS 38', dist: '6.1km', type: 'Parcel', urgent: false },
    { id: 'WDS-94', from: 'Kaneshie Market', to: 'Dansoman', fee: 'GHS 52', dist: '8.4km', type: 'Grocery', urgent: false },
  ]

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 grid lg:grid-cols-[1fr_380px] gap-6">
      <div>
        <div className="bg-black text-white rounded-[28px] p-6 flex justify-between mb-6">
          <div><div className="font-bold text-[18px]">{currentUser?.name} • Rider • Code-split</div><div className="text-[13px] text-white/60">{currentUser?.vehicle} • {currentUser?.plate} • 312 deliveries</div></div>
          <div className="text-right"><div className="text-[11px] uppercase text-white/40">Today</div><div className="text-[28px] font-extrabold">GHS {currentUser?.earnings || 286}</div></div>
        </div>
        <h2 className="font-extrabold text-[20px] mb-4">Available Jobs • Lazy loaded • Heavy map split</h2>
        <div className="space-y-3">
          {jobs.map(j => (
            <JobCard key={j.id} id={j.id} from={j.from} to={j.to} fee={j.fee} dist={j.dist} type={j.type} urgent={j.urgent} onAccept={() => onAcceptJob(j)} />
          ))}
        </div>
        <div className="mt-6 p-4 bg-[#FFC700]/10 rounded-2xl border border-[#FFC700]/20 text-[12px]">
          <span className="font-bold">Bundle Note:</span> This rider view with map (leaflet + react-leaflet ~80KB) only loads when you visit /rider, not on landing page. Before fix, it was in entry chunk.
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-white rounded-[24px] p-5 border"><h3 className="font-bold text-[15px] mb-3">My Active Delivery</h3><div className="text-[13px] text-black/50 text-center py-8 border border-dashed rounded-2xl">No active delivery. Accept a job.</div></div>
        <div className="bg-white rounded-[24px] p-2 border"><MapComponent height="320px" /></div>
      </div>
    </div>
  )
}
