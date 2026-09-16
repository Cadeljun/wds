import type { Metadata } from 'next'
import LoginClient from '@/components/views/LoginClient'

export const metadata: Metadata = {
  title: 'Log in - WDS Williams Delivery | Accra Ghana',
  description: 'Log in to WDS Williams Delivery Service. Ghana phone OTP, 24 riders online, track deliveries live, MoMo payments. Demo: Customer 0244123456 / 123456, Rider 0244987654 / 123456, Admin 0244000000 / admin123.',
  alternates: { canonical: '/auth/login' },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Log in to WDS - Accra Delivery',
    description: 'Ghana phone OTP login, track deliveries live, 24 riders online.',
    url: 'https://wds.com.gh/auth/login',
    type: 'website',
  },
}

export default function LoginPage() {
  return <LoginClient />
}
