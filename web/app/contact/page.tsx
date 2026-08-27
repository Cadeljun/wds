import type { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/components/JsonLd'
import { EnquiryForm } from '@/components/forms/EnquiryForm'

export const metadata: Metadata = {
  title: 'Contact WDS - Williams Delivery Service | Accra Ghana',
  description: 'Contact WDS Williams Delivery Service. Phone 0244000000, Accra Ghana, support@wds.com.gh, rider onboarding, business inquiries, East Legon Osu. Secured with Zod + XSS.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact WDS - Accra Delivery',
    description: 'Phone 0244000000, Accra Ghana, support@wds.com.gh, rider onboarding, 24 riders online. Validated & secured contact form.',
    url: 'https://wds.com.gh/contact',
    type: 'website',
  },
}

export default function ContactPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://wds.com.gh/' },
        { name: 'Contact', url: 'https://wds.com.gh/contact' },
      ]} />
      <div className="min-h-screen bg-[#F5F5F7]">
        <header className="h-[64px] bg-white border-b flex items-center px-4 md:px-8">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-black text-[#FFC700] rounded-xl flex items-center justify-center font-bold">W</div><span className="font-bold">WDS • Contact • Secured</span><span className="ml-2 px-2 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-bold border border-green-200">Zod + XSS + CORS</span></div>
        </header>
        <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-12 grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <div>
            <h1 className="font-extrabold text-[32px] md:text-[40px] leading-[0.9]">Get in touch • Accra • Validated</h1>
            <p className="text-[14px] text-black/60 mt-4">Contact Williams for delivery, rider onboarding, business partnership. Secured with Ghana phone validation, XSS sanitization, server re-validation, CORS whitelist, rate limiting.</p>
            
            <div className="mt-8 space-y-4">
              <div className="bg-white rounded-2xl p-5 border"><h3 className="font-bold text-[14px]">Williams • Owner</h3><p className="text-[13px] text-black/60 mt-2">Phone: 0244000000<br/>Email: support@wds.com.gh<br/>Location: Accra, Greater Accra, Ghana<br/>Hours: 6am-10pm (24/7 planned)<br/>Peak: 11am-2pm, 6pm-9pm</p><div className="mt-3 flex gap-2"><span className="px-3 py-1 bg-[#FFC700] rounded-full text-[11px] font-bold">24 Riders Online</span><span className="px-3 py-1 bg-black text-white rounded-full text-[11px]">Full Stack Ready</span></div></div>
              
              <div className="bg-black text-white rounded-2xl p-5"><h3 className="font-bold text-[14px]">For Riders • Join Team</h3><p className="text-[13px] text-white/60 mt-2">Requirements: Motorbike/bicycle/car/van, valid plate AB 1234-23, Ghana phone 0244/020/054, approved by admin. Earn 80% per delivery GHS 28-52, MoMo daily payout at 6pm. Apply via app with Ghana phone validation.</p></div>
              
              <div className="bg-white rounded-2xl p-5 border"><h3 className="font-bold text-[14px]">Business • Merchant Portal</h3><p className="text-[13px] text-black/60 mt-2">Restaurants, shops, pharmacies in East Legon, Osu, Kaneshie, Madina? Get merchant portal, auto-create deliveries, increase sales. Contact Williams for partnership. Pricing: GHS 15 base + distance*2.5.</p></div>

              <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-black/5 text-[11px]">
                <div className="font-bold uppercase tracking-wide text-black/40 mb-2">Security Implemented</div>
                <div className="space-y-1 text-black/60">
                  <div>✓ Zod Ghana phone validation (024,020,054 prefixes)</div>
                  <div>✓ XSS sanitization strips script/iframe</div>
                  <div>✓ Server re-validation never trust client</div>
                  <div>✓ CORS whitelist wds.com.gh + localhost only</div>
                  <div>✓ Rate limiting 5/hour per IP</div>
                  <div>✓ Header injection protection CRLF strip</div>
                  <div>✓ No stack trace leak</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <EnquiryForm />
            <div className="mt-4 bg-white rounded-2xl p-4 border text-[11px] text-black/50">
              <div className="font-bold text-black mb-1">Test Security:</div>
              <div>Try XSS: &lt;script&gt;alert('xss')&lt;/script&gt; in name → Zod regex blocks + xss strips</div>
              <div>Try invalid phone: 07900123456 (UK) → Ghana validation blocks, need 0244...</div>
              <div>Try spam: 6th enquiry in hour → 429 Too many enquiries</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
