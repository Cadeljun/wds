import type { Metadata } from 'next'
import AuthClient from '@/components/views/AuthClient'

export const metadata: Metadata = {
  title: 'Login & Signup - WDS Williams Delivery | Accra',
  description: 'Join WDS in 30 seconds. Phone OTP login for customers and riders in Accra. MoMo, Card, Cash. Demo OTP 123456.',
  alternates: {
    canonical: '/auth',
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Join WDS - Accra Delivery',
    description: 'Phone OTP login for customers and riders. Demo OTP 123456.',
    url: 'https://wds.com.gh/auth',
    type: 'website',
  },
}

export default function AuthPage() {
  return <AuthClient />
}
