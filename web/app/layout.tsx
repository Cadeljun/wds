import type { Metadata, Viewport } from 'next'
import './globals.css'
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/JsonLd'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://wds.com.gh'),
  title: {
    default: 'WDS - Williams Delivery Service | Accra Fastest Delivery',
    template: '%s | WDS Williams Delivery',
  },
  description: 'Deliver anything in Accra in minutes. Food, parcels, groceries, medicine, documents. Real riders, live tracking, MoMo, Card, Cash. 24 riders online.',
  keywords: ['delivery', 'Accra', 'Ghana', 'MoMo', 'Williams Delivery', 'WDS', 'parcels', 'food delivery', 'courier', 'East Legon', 'Osu', 'Kaneshie'],
  authors: [{ name: 'Williams Delivery Service' }],
  creator: 'WDS',
  publisher: 'WDS',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://wds.com.gh',
    siteName: 'WDS - Williams Delivery Service',
    title: 'WDS - Deliver anything in Accra in minutes',
    description: 'Food, parcels, groceries, medicine, documents. Real riders, live tracking, pay with MTN MoMo, Vodafone, AirtelTigo, Card or Cash.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WDS Williams Delivery Service - Accra',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WDS - Deliver anything in Accra in minutes',
    description: 'Food, parcels, groceries, medicine, documents. Real riders, live tracking, MoMo, Card, Cash.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <OrganizationJsonLd />
        <WebsiteJsonLd />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
