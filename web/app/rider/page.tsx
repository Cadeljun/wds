import type { Metadata } from 'next'
import RiderClient from '@/components/views/RiderClient'

export const metadata: Metadata = {
  title: 'Rider Dashboard - WDS | Accept Jobs & Earn in Accra',
  description: 'WDS Rider dashboard. See nearby jobs, accept, navigate, earn 80% per delivery GHS 28-52, MoMo payout daily. Private - authenticated riders only.',
  alternates: {
    canonical: '/rider',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RiderPage() {
  return <RiderClient />
}
