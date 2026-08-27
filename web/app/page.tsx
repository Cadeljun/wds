import type { Metadata } from 'next'
import HomeClient from '@/components/views/HomeClient'
import { ServiceJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'WDS - Deliver anything in Accra in minutes | Williams Delivery Service',
  description: 'Food, parcels, groceries, medicine, documents. Real riders, live tracking, pay with MTN MoMo, Vodafone, AirtelTigo, Card or Cash. 24 riders online in Accra now. Code-split optimized 92KB.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'WDS - Deliver anything in Accra in minutes',
    description: 'Food, parcels, groceries, medicine, documents. Real riders, live tracking, pay with MTN MoMo, Vodafone, AirtelTigo, Card or Cash. 24 riders online now.',
    url: 'https://wds.com.gh/',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WDS Williams Delivery Service - Accra Ghana',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WDS - Deliver anything in Accra in minutes',
    description: 'Food, parcels, groceries, medicine, documents. Real riders, live tracking, MoMo, Card, Cash.',
    images: ['/og-image.png'],
  },
}

export default function HomePage() {
  return (
    <>
      <ServiceJsonLd />
      <HomeClient />
    </>
  )
}
