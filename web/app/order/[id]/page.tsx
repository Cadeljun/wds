import type { Metadata } from 'next'
import OrderClient from '@/components/views/OrderClient'

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Tracking ${params.id} - WDS Delivery | Accra`,
    description: `Track your WDS delivery ${params.id} live in Accra. Rider location, ETA, proof of delivery. Private tracking page.`,
    alternates: {
      canonical: `/order/${params.id}`,
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: `Tracking ${params.id} - WDS`,
      description: `Track your delivery live in Accra. Rider on the way.`,
      url: `https://wds.com.gh/order/${params.id}`,
      type: 'website',
    },
  }
}

// For SSG where IDs are known, return sample IDs
export async function generateStaticParams() {
  return [
    { id: 'WDS-89' },
    { id: 'WDS-90' },
    { id: 'WDS-91' },
  ]
}

export default function OrderPage({ params }: Props) {
  return <OrderClient orderId={params.id} />
}
