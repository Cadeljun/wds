import type { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Join WDS Rider Team - Earn with MoMo in Accra | Williams Delivery',
  description: 'Join WDS rider team in Accra. Earn 80% per delivery GHS 28-52, daily MoMo payout, motorbike/bicycle/car. Requirements: Ghana phone, plate, approval. 24 riders online.',
  alternates: {
    canonical: '/rider-join',
  },
  openGraph: {
    title: 'Join WDS Rider Team - Earn in Accra',
    description: 'Earn 80% per delivery GHS 28-52, daily MoMo payout, motorbike/bicycle/car. 24 riders online now.',
    url: 'https://wds.com.gh/rider-join',
    type: 'website',
  },
}

export default function RiderJoinPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://wds.com.gh/' },
        { name: 'Join Rider Team', url: 'https://wds.com.gh/rider-join' },
      ]} />
      <div className="min-h-screen bg-[#F5F5F7]">
        <header className="h-[64px] bg-white border-b flex items-center px-4 md:px-8">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-black text-[#FFC700] rounded-xl flex items-center justify-center font-bold">W</div><span className="font-bold">WDS • Join Rider Team</span></div>
        </header>
        <div className="max-w-[900px] mx-auto px-4 md:px-8 py-12">
          <h1 className="font-extrabold text-[36px] md:text-[48px] leading-[0.9]">Earn with WDS in Accra.<br/>Motor, bicycle, car, van.</h1>
          <p className="text-[15px] text-black/60 mt-4 max-w-[600px]">Join 24 riders already delivering in East Legon, Osu, Kaneshie, Madina. Accept jobs near you, navigate via Google Maps, earn 80% per delivery, MoMo payout daily at 6pm.</p>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border"><div className="text-[24px]">🏍️</div><h2 className="font-bold mt-2">See Nearby Jobs</h2><p className="text-[12px] text-black/60 mt-1">Sorted by nearest, urgent first. GHS 28-52 per trip. First to accept wins.</p></div>
            <div className="bg-white rounded-2xl p-5 border"><div className="text-[24px]">💰</div><h2 className="font-bold mt-2">Earn 80% + MoMo</h2><p className="text-[12px] text-black/60 mt-1">Example: GHS 43 order → you get GHS 34.4, WDS GHS 8.6. Payout daily via MTN MoMo, Vodafone, AirtelTigo.</p></div>
            <div className="bg-white rounded-2xl p-5 border"><div className="text-[24px]">⭐</div><h2 className="font-bold mt-2">Build Rating</h2><p className="text-[12px] text-black/60 mt-1">4.9 star system, Level 4, 312 deliveries. Higher rating = more jobs, level up.</p></div>
          </div>
          <div className="mt-8 bg-black text-white rounded-[24px] p-6">
            <h2 className="font-bold">Requirements to Join</h2>
            <ul className="text-[13px] text-white/70 mt-3 space-y-2 list-disc list-inside">
              <li>Vehicle: Motorbike (most common), bicycle, car or van</li>
              <li>Valid license plate: e.g., AB 1234-23, GR 567-21</li>
              <li>Ghana phone: 0244, 020, 054, 027 (MTN, Vodafone, AirtelTigo)</li>
              <li>Approved by Williams Admin (is_approved=true)</li>
              <li>Location permission: for job assignment + live tracking when delivering</li>
              <li>Available in East Legon, Osu, Kaneshie, Madina, Airport, Dansoman, etc.</li>
            </ul>
            <button className="mt-6 h-12 px-6 bg-[#FFC700] text-black rounded-full font-bold">Apply Now via App →</button>
          </div>
          <div className="mt-6 text-[12px] text-black/40">Download Rider APK: eas build --platform android --profile preview → Share via WhatsApp. Log in with phone + password, toggle Online.</div>
        </div>
      </div>
    </>
  )
}
