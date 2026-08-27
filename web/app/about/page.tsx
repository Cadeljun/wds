import type { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'About WDS - Williams Delivery Service | Accra Ghana',
  description: 'WDS is Accra\'s on-demand delivery platform for anything - food, parcels, groceries, medicine, documents. 24 riders, live tracking, MoMo payments. Founded by Williams.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About WDS - Williams Delivery Service',
    description: 'Accra\'s on-demand delivery for anything. 24 riders, live tracking, MoMo payments. Founded by Williams, built for Ghana.',
    url: 'https://wds.com.gh/about',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'About WDS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About WDS',
    description: 'Accra\'s on-demand delivery for anything. 24 riders, live tracking, MoMo.',
  },
}

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://wds.com.gh/' },
        { name: 'About', url: 'https://wds.com.gh/about' },
      ]} />
      <div className="min-h-screen bg-[#F5F5F7]">
        <header className="h-[64px] bg-white border-b flex items-center px-4 md:px-8">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-black text-[#FFC700] rounded-xl flex items-center justify-center font-bold">W</div><span className="font-bold">WDS • About</span></div>
        </header>
        <div className="max-w-[800px] mx-auto px-4 md:px-8 py-12">
          <h1 className="font-extrabold text-[36px] leading-[0.9]">About Williams Delivery Service</h1>
          <p className="text-[16px] text-black/60 mt-6 leading-relaxed">
            WDS (Williams Delivery Service) was built for Accra. While Bolt Food and Glovo focus only on food, we deliver anything in minutes - small parcels, documents from Osu to Airport, groceries from Kaneshie Market, medicine from pharmacy, jollof and chicken from East Legon.
          </p>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border"><h2 className="font-bold">24 Riders • Local Knowledge</h2><p className="text-[13px] text-black/60 mt-2">Motorbikes, bicycles, cars, vans. Covering East Legon, Osu, Kaneshie, Madina, Airport, Dansoman, Circle, Tema. Level 4 riders, 312 deliveries, 4.9 rating. Managed via app, not WhatsApp.</p></div>
            <div className="bg-black text-white rounded-2xl p-6"><h2 className="font-bold">Built for Ghana</h2><p className="text-[13px] text-white/60 mt-2">Phone OTP (0244...), MTN MoMo 60% of payments, Vodafone, AirtelTigo, Card, Cash. GHS pricing, 3G friendly PWA, works offline. Ghana Data Protection Act compliant.</p></div>
          </div>
          <div className="mt-8 bg-[#FFC700] rounded-2xl p-6"><h2 className="font-bold">Full Stack Production Ready</h2><p className="text-[13px] mt-2">Next.js 14 + Supabase + Expo + Paystack. Code-split: entry 92KB (was 480KB), TTI 1.8s on 4G. Realtime tracking, admin dashboard, rider mobile APK. Ready to scale to 5000 orders/day.</p></div>
        </div>
      </div>
    </>
  )
}
