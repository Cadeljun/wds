import type { Metadata } from 'next'
import AdminClient from '@/components/views/AdminClient'

export const metadata: Metadata = {
  title: 'Admin Dashboard - WDS Operations | Accra',
  description: 'WDS Admin dashboard. Revenue GHS 4,280/day, 127 orders, rider fleet, pricing control. Private - Williams only.',
  alternates: {
    canonical: '/admin',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminPage() {
  return <AdminClient />
}
