import type { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'WDS Pricing - Delivery Fees in Accra | GHS 15 Base + Distance',
  description: 'WDS pricing: GHS 15 base + GHS 2.5 per km + package fee. Document GHS 3, Food GHS 5, Parcel GHS 7. Express +GHS 8. Example East Legon to Osu 8.4km = GHS 43. 20% WDS / 80% rider.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'WDS Pricing - Simple GHS Fees',
    description: 'GHS 15 base + distance*2.5 + package fee. Example: East Legon → Osu 8.4km Parcel = GHS 43. MoMo, Card, Cash.',
    url: 'https://wds.com.gh/pricing',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'WDS Pricing' }],
  },
}

export default function PricingPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://wds.com.gh/' },
        { name: 'Pricing', url: 'https://wds.com.gh/pricing' },
      ]} />
      <div className="min-h-screen bg-[#F5F5F7]">
        <header className="h-[64px] bg-white border-b flex items-center px-4 md:px-8">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-black text-[#FFC700] rounded-xl flex items-center justify-center font-bold">W</div><span className="font-bold">WDS • Pricing</span></div>
        </header>
        <div className="max-w-[900px] mx-auto px-4 md:px-8 py-12">
          <h1 className="font-extrabold text-[36px] leading-[0.9]">Simple pricing. No hidden fees. GHS.</h1>
          <div className="mt-8 bg-white rounded-[24px] p-6 border">
            <code className="text-[14px] font-bold">Total = Base GHS 15 + Distance × 2.5 + PackageFee + Express GHS 8</code>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3 text-[13px]">
              <div className="bg-[#F5F5F7] rounded-xl p-3"><div className="font-bold">Document</div><div>GHS 3</div></div>
              <div className="bg-[#F5F5F7] rounded-xl p-3"><div className="font-bold">Food</div><div>GHS 5</div></div>
              <div className="bg-[#F5F5F7] rounded-xl p-3"><div className="font-bold">Medicine</div><div>GHS 6</div></div>
              <div className="bg-[#F5F5F7] rounded-xl p-3"><div className="font-bold">Parcel</div><div>GHS 7</div></div>
              <div className="bg-[#F5F5F7] rounded-xl p-3"><div className="font-bold">Grocery/Other</div><div>GHS 7</div></div>
              <div className="bg-[#FFC700] rounded-xl p-3"><div className="font-bold">Express (35-50m)</div><div>+GHS 8</div></div>
            </div>
            <div className="mt-6 p-4 bg-black text-white rounded-xl">
              <div className="font-bold">Example: East Legon → Osu (8.4km, Parcel)</div>
              <div className="text-[13px] text-white/70 mt-1">15 + (8.4×2.5=21) + 7 = <span className="font-bold text-[#FFC700]">GHS 43</span> → Rider GHS 34.4 (80%), WDS GHS 8.6 (20%)</div>
            </div>
          </div>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border"><h2 className="font-bold">Payment Methods • Ghana</h2><div className="flex gap-2 mt-3 text-[11px]"><span className="px-2 py-1 bg-[#FFC700] rounded-full font-bold">60% MoMo</span><span className="px-2 py-1 bg-black text-white rounded-full">25% Cash</span><span className="px-2 py-1 bg-white border rounded-full">15% Card</span></div><p className="text-[12px] text-black/60 mt-3">MTN MoMo most popular, then Vodafone Cash, AirtelTigo Money. Paystack handles all via one API. Insured up to GHS 2,000.</p></div>
            <div className="bg-black text-white rounded-2xl p-5"><h2 className="font-bold">Commission</h2><p className="text-[13px] text-white/60 mt-2">WDS keeps 20%, rider gets 80%. Daily payout via MoMo at 6pm via Paystack Transfer API. At 100 orders/day avg GHS 38 → WDS GHS 760/day = GHS 22,800/month.</p></div>
          </div>
        </div>
      </div>
    </>
  )
}
