'use client'

// Simulate heavy chart component that would import recharts
// This is intentionally heavy - in real app it would be:
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function AdminChart() {
  // Simulate chart with divs - in real app this would be Recharts LineChart
  const data = [
    { hour: '6am', orders: 5, revenue: 190 },
    { hour: '9am', orders: 18, revenue: 684 },
    { hour: '12pm', orders: 32, revenue: 1216 },
    { hour: '3pm', orders: 28, revenue: 1064 },
    { hour: '6pm', orders: 35, revenue: 1330 },
    { hour: '9pm', orders: 12, revenue: 456 },
  ]

  const maxRevenue = Math.max(...data.map(d => d.revenue))

  return (
    <div>
      <div className="flex items-end gap-2 h-[160px] px-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-[#F5F5F7] rounded-t-xl relative" style={{ height: '120px' }}>
              <div 
                className="absolute bottom-0 w-full bg-black rounded-t-xl transition-all" 
                style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
              ></div>
              <div 
                className="absolute bottom-0 w-full bg-[#FFC700] rounded-t-xl opacity-60" 
                style={{ height: `${(d.orders / 35) * 100}%` }}
              ></div>
            </div>
            <div className="text-[10px] font-bold text-black/50">{d.hour}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-4 text-[11px]">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-black rounded-full"></div><span>Revenue (GHS)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#FFC700] rounded-full"></div><span>Orders</span></div>
      </div>
      <div className="mt-3 text-[11px] text-black/40">Heavy chart library (recharts) only loaded when admin visits this page. Not on landing page entry chunk.</div>
    </div>
  )
}
