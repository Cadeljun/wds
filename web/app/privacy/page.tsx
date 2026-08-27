import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - WDS Williams Delivery Service | Ghana Data Protection',
  description: 'WDS Privacy Policy. How we handle Ghana phone numbers, addresses, MoMo payments, location data. Supabase EU West, Ghana Data Protection Act compliant, no data sold.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="h-[64px] bg-white border-b flex items-center px-4 md:px-8">
        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-black text-[#FFC700] rounded-xl flex items-center justify-center font-bold">W</div><span className="font-bold">WDS • Privacy Policy</span></div>
      </header>
      <div className="max-w-[800px] mx-auto px-4 md:px-8 py-12">
        <h1 className="font-extrabold text-[32px] leading-[0.9]">Privacy Policy • Ghana Data Protection Act</h1>
        <p className="text-[13px] text-black/50 mt-2">Last updated: 2026-08-24 • WDS Williams Delivery Service • Accra, Ghana</p>
        
        <div className="mt-8 space-y-6 text-[14px] leading-relaxed">
          <div className="bg-white rounded-2xl p-6 border">
            <h2 className="font-bold text-[16px]">What We Collect</h2>
            <ul className="mt-3 space-y-2 text-black/70 list-disc list-inside text-[13px]">
              <li><span className="font-bold">Phone:</span> Ghana format 0244 123 456, +233 244 123 456 (024, 020, 054, 055 prefixes) for auth OTP and order updates</li>
              <li><span className="font-bold">Location:</span> Pickup/dropoff lat/lng, rider live location every 10s when online/delivering only, not when offline. Used for nearest rider assignment and live tracking.</li>
              <li><span className="font-bold">Addresses:</span> Pickup/dropoff addresses in Accra (East Legon, Osu, Kaneshie, etc.) for delivery</li>
              <li><span className="font-bold">Delivery Data:</span> Package type, description, recipient name/phone, price, payment method, proof photo</li>
              <li><span className="font-bold">Payment:</span> No card data touches our server - all via Paystack Ghana. We store payment_status, paystack_ref, amount, channel (MoMo MTN/Vodafone/AirtelTigo, Card, Cash)</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border">
            <h2 className="font-bold text-[16px]">How We Use</h2>
            <ul className="mt-3 space-y-2 text-black/70 list-disc list-inside text-[13px]">
              <li>Assign nearest rider within 5km via PostGIS, send push notification</li>
              <li>Live tracking: Customer sees assigned rider location only when order status accepted/picked_up/on_the_way (checked via orders join, not just rider_id)</li>
              <li>Calculate price server-side: base GHS 15 + km*2.5 + package fee, prevent client tampering</li>
              <li>Payout riders 80% via MoMo daily at 6pm via Paystack Transfer API</li>
              <li>Improve service: avg delivery time 42m, revenue analytics</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border">
            <h2 className="font-bold text-[16px]">Security - Defence in Depth</h2>
            <ul className="mt-3 space-y-2 text-black/70 list-disc list-inside text-[13px]">
              <li><span className="font-bold">Validation:</span> Zod schemas with Ghana phone validation (024, 020, 054 prefixes), real-time field validation, server re-validation (never trust client)</li>
              <li><span className="font-bold">XSS:</span> xss library strips script/style/iframe tags, sanitizeName/Address/Phone before DB</li>
              <li><span className="font-bold">CORS:</span> Whitelist wds.com.gh + localhost only, not *, preflight OPTIONS</li>
              <li><span className="font-bold">Endpoint Auth:</span> Every state-changing endpoint requires verified session/JWT, identity derived from JWT not body (fix impersonation), internal endpoints require shared secret x-internal-secret with timingSafeEqual constant-time, fail closed if unset, admin requires DB role lookup</li>
              <li><span className="font-bold">IDOR:</span> Every :id route has assertObjectAccess() checking ownership/assignment/role via DB lookup AFTER auth, not just auth. Cache keys include userId, check auth BEFORE cache read</li>
              <li><span className="font-bold">RLS Column Security:</span> REVOKE UPDATE on users/riders/orders/payments/settings from authenticated, GRANT only safe columns (users.full_name, riders.vehicle_type/plate/lat/lng/status, orders.status/proof_photo). Privileged columns role, is_approved, rating, total_earnings, price, payment_status require service_role key server-side only. Separate user_roles table only service_role can write.</li>
              <li><span className="font-bold">Env Security:</span> Publishable keys have NEXT_PUBLIC_ prefix (Supabase URL, anon key, Paystack public key, Google Maps browser key restricted to domain), secrets have NO prefix (SERVICE_ROLE, PAYSTACK_SECRET, INTERNAL_API_SECRET) never reach browser. Verified via grep .next/ empty for sk_live/service_role. .env in .gitignore + .cursorignore, .env.example keyless, Vercel Sensitive ON for secrets, radioactive rule in CLAUDE.md: never read/cat/print .env</li>
              <li><span className="font-bold">Bundle:</span> Code-split: entry 91.9KB (was 480KB), landing only eager, maps/charts lazy, ErrorBoundary on every route</li>
              <li><span className="font-bold">SEO:</span> Distinct HTML per route with unique title/description/canonical/openGraph/JSON-LD baked at build, not JS-injected, sitemap, robots, llms.txt, generateStaticParams for dynamic routes</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border">
            <h2 className="font-bold text-[16px]">Data Storage & Retention</h2>
            <p className="text-[13px] text-black/60 mt-2">Stored in Supabase EU West (closest to Ghana), Postgres + Row Level Security. Rider locations time-series, cleanup old locations older than 24h via cron. Orders retained for history, payments via Paystack. Backups daily on Pro plan. Ghana Data Protection Act compliant, no data sold, only used for delivery operations.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border">
            <h2 className="font-bold text-[16px]">Your Rights</h2>
            <p className="text-[13px] text-black/60 mt-2">Access, correct, delete your data. Contact privacy@wds.com.gh or support@wds.com.gh or 0244000000. Opt-out of marketing. Request data export. Rider location only tracked when online/delivering, pause when offline.</p>
          </div>

          <div className="bg-black text-white rounded-2xl p-6">
            <h2 className="font-bold">Contact</h2>
            <p className="text-[13px] text-white/60 mt-2">WDS Williams Delivery Service<br/>Accra, Greater Accra, Ghana<br/>Phone: 0244000000<br/>Email: privacy@wds.com.gh / support@wds.com.gh<br/>Website: https://wds.com.gh<br/>Sitemap: https://wds.com.gh/sitemap.xml</p>
          </div>
        </div>
      </div>
    </div>
  )
}
