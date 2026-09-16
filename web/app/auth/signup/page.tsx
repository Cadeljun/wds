import type { Metadata } from 'next'
import SignupClient from '@/components/views/SignupClient'

export const metadata: Metadata = {
  title: 'Sign up - Join WDS in 30 seconds | Williams Delivery Accra',
  description: 'Join WDS Williams Delivery Service in 30 seconds. Customer or Rider, Ghana phone 0244..., vehicle AB 1234-23, MoMo payouts daily. OTP demo 123456, secured with Zod + XSS.',
  alternates: { canonical: '/auth/signup' },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Join WDS - Accra Delivery in 30 Seconds',
    description: 'Customer or Rider, Ghana phone, MoMo payouts daily, OTP demo 123456.',
    url: 'https://wds.com.gh/auth/signup',
    type: 'website',
  },
}

export default function SignupPage() {
  return <SignupClient />
}
