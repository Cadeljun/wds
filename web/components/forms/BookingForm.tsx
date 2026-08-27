'use client'

import { useState } from 'react'
import { bookingFormSchema, type BookingFormData } from '@/lib/validation'
import { sanitize, sanitizeAddress, sanitizeName, sanitizePhone } from '@/lib/sanitize'

const packageOptions = [
  { value: 'parcel', label: 'Parcel 📦' },
  { value: 'food', label: 'Food 🍔' },
  { value: 'grocery', label: 'Grocery 🛒' },
  { value: 'medicine', label: 'Medicine 💊' },
  { value: 'document', label: 'Document 📄' },
  { value: 'other', label: 'Other ⋯' },
]

const paymentOptions = [
  { value: 'momo_mtn', label: 'MTN MoMo' },
  { value: 'momo_vodafone', label: 'Vodafone Cash' },
  { value: 'momo_airteltigo', label: 'AirtelTigo Money' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash on Delivery' },
]

export function BookingForm({ onSuccess }: { onSuccess?: (order: any) => void }) {
  const [formData, setFormData] = useState({
    pickup_address: 'East Legon, American House',
    dropoff_address: 'Osu, Oxford Street',
    package_type: 'parcel',
    description: '',
    recipient_name: '',
    recipient_phone: '',
    payment_method: 'momo_mtn',
    express: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = (field: keyof BookingFormData, value: unknown) => {
    // @ts-ignore
    const fieldSchema = (bookingFormSchema.shape as any)[field]
    if (!fieldSchema) return
    const result = fieldSchema.safeParse(value)
    if (!result.success) {
      setErrors(prev => ({ ...prev, [field]: result.error.issues[0]?.message || 'Invalid' }))
    } else {
      setErrors(prev => {
        const ne = { ...prev }
        delete ne[field]
        return ne
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData(prev => ({ ...prev, [name]: newValue }))
    validateField(name as keyof BookingFormData, newValue)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = bookingFormSchema.safeParse(formData)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach(err => {
        const path = err.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = err.message
      })
      setErrors(fieldErrors)
      setIsSubmitting(false)
      return
    }

    const sanitized = {
      pickup_address: sanitizeAddress(result.data.pickup_address),
      dropoff_address: sanitizeAddress(result.data.dropoff_address),
      package_type: result.data.package_type,
      description: result.data.description ? sanitize(result.data.description) : '',
      recipient_name: result.data.recipient_name ? sanitizeName(result.data.recipient_name) : '',
      recipient_phone: result.data.recipient_phone ? sanitizePhone(result.data.recipient_phone) : '',
      payment_method: result.data.payment_method,
      express: result.data.express || false,
      customer_id: 'demo-customer-id', // In production from auth
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.errors) setErrors(data.errors)
        else alert(data.error)
        return
      }

      alert(`Order created! ${data.order.id} - GHS ${data.price} - ${data.message}`)
      setErrors({})
      if (onSuccess) onSuccess(data.order)
    } catch (err) {
      console.error(err)
      alert('Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-[24px] p-6 border">
      <h3 className="font-bold text-[16px]">Create Delivery • Validated & Secured</h3>

      <div>
        <label className="text-[11px] font-bold uppercase text-black/50 mb-1 block">Pickup Address</label>
        <input name="pickup_address" value={formData.pickup_address} onChange={handleChange} placeholder="East Legon, American House" className={`w-full h-[48px] bg-[#F5F5F7] border rounded-2xl px-4 text-[14px] ${errors.pickup_address ? 'border-red-500' : 'border-black/5'}`} />
        {errors.pickup_address && <p className="text-red-500 text-[11px] mt-1">{errors.pickup_address}</p>}
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase text-black/50 mb-1 block">Drop-off Address</label>
        <input name="dropoff_address" value={formData.dropoff_address} onChange={handleChange} placeholder="Osu, Oxford Street" className={`w-full h-[48px] bg-white border-2 rounded-2xl px-4 text-[14px] font-bold ${errors.dropoff_address ? 'border-red-500' : 'border-black'}`} />
        {errors.dropoff_address && <p className="text-red-500 text-[11px] mt-1">{errors.dropoff_address}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold uppercase text-black/50 mb-1 block">Package Type</label>
          <select name="package_type" value={formData.package_type} onChange={handleChange} className="w-full h-[48px] bg-[#F5F5F7] border border-black/5 rounded-2xl px-3 text-[14px]">
            {packageOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {errors.package_type && <p className="text-red-500 text-[11px] mt-1">{errors.package_type}</p>}
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase text-black/50 mb-1 block">Payment</label>
          <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="w-full h-[48px] bg-[#F5F5F7] border border-black/5 rounded-2xl px-3 text-[14px]">
            {paymentOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {errors.payment_method && <p className="text-red-500 text-[11px] mt-1">{errors.payment_method}</p>}
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase text-black/50 mb-1 block">Description (Optional)</label>
        <input name="description" value={formData.description} onChange={handleChange} placeholder="Small box with documents" className="w-full h-[48px] bg-[#F5F5F7] border border-black/5 rounded-2xl px-4 text-[13px]" />
        {errors.description && <p className="text-red-500 text-[11px] mt-1">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold uppercase text-black/50 mb-1 block">Recipient Name</label>
          <input name="recipient_name" value={formData.recipient_name} onChange={handleChange} placeholder="Kofi Mensah" className="w-full h-[48px] bg-[#F5F5F7] border border-black/5 rounded-2xl px-4 text-[13px]" />
          {errors.recipient_name && <p className="text-red-500 text-[11px] mt-1">{errors.recipient_name}</p>}
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase text-black/50 mb-1 block">Recipient Phone (Ghana)</label>
          <input name="recipient_phone" value={formData.recipient_phone} onChange={handleChange} placeholder="0244 123 456" className="w-full h-[48px] bg-[#F5F5F7] border border-black/5 rounded-2xl px-4 text-[13px]" />
          {errors.recipient_phone && <p className="text-red-500 text-[11px] mt-1">{errors.recipient_phone}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" name="express" checked={formData.express} onChange={handleChange} /> Express +GHS 8 (35-50 mins)</label>

      <button type="submit" disabled={isSubmitting} className="w-full h-[52px] bg-[#FFC700] text-black rounded-full font-extrabold disabled:opacity-50">
        {isSubmitting ? 'Creating securely...' : 'Create Order →'}
      </button>

      <div className="text-[10px] text-black/40 text-center">Zod validation + XSS sanitization + Ghana phone validation + Server re-validation + CORS</div>
    </form>
  )
}
