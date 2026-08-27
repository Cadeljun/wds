// Paystack Ghana integration - MoMo, Card, Cash
export type PaystackChannel = 'mobile_money' | 'card' | 'bank' | 'ussd'

export interface PaystackInitParams {
  amount: number // in GHS
  email: string
  phone?: string
  orderId: string
  channels?: PaystackChannel[]
  metadata?: Record<string, any>
}

export interface PaystackInitResponse {
  authorization_url: string
  access_code: string
  reference: string
}

// Initialize Paystack transaction (call from Edge Function, not client directly for security)
export async function initializePaystackTransaction(params: PaystackInitParams): Promise<PaystackInitResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY not set')
  
  const amountInPesewas = Math.round(params.amount * 100)
  
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountInPesewas,
      email: params.email,
      currency: 'GHS',
      reference: `WDS-${params.orderId}-${Date.now()}`,
      channels: params.channels || ['mobile_money', 'card', 'bank'],
      metadata: {
        order_id: params.orderId,
        ...params.metadata,
      },
      // For MoMo, Paystack needs phone
      ...(params.phone && { mobile_money: { phone: params.phone, provider: 'mtn' } }),
    }),
  })
  
  const data = await res.json()
  if (!data.status) throw new Error(data.message || 'Paystack init failed')
  
  return data.data
}

// Verify transaction (webhook or client callback)
export async function verifyPaystackTransaction(reference: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY not set')
  
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { 'Authorization': `Bearer ${secretKey}` },
  })
  
  const data = await res.json()
  return data
}

// Client-side Paystack Popup (for web)
export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).PaystackPop) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Paystack'))
    document.body.appendChild(script)
  })
}

export interface PaystackPopupOptions {
  key: string
  email: string
  amount: number // in pesewas
  currency: 'GHS'
  ref: string
  channels: PaystackChannel[]
  metadata: Record<string, any>
  onSuccess: (transaction: any) => void
  onCancel: () => void
}

export async function openPaystackPopup(options: PaystackPopupOptions) {
  await loadPaystackScript()
  
  const handler = (window as any).PaystackPop.setup({
    key: options.key,
    email: options.email,
    amount: options.amount,
    currency: options.currency,
    ref: options.ref,
    channels: options.channels,
    metadata: options.metadata,
    callback: options.onSuccess,
    onClose: options.onCancel,
  })
  
  handler.openIframe()
}

// For cash payments - no Paystack needed
export function isCashPayment(method: string): boolean {
  return method === 'cash'
}

// Format for display
export function formatGHS(amount: number): string {
  return `GHS ${amount.toFixed(2)}`
}
