'use client'

import { useState } from 'react'
import { enquiryFormSchema, type EnquiryFormData } from '@/lib/validation'
import { sanitize, sanitizeEmail, sanitizePhone, sanitizeName } from '@/lib/sanitize'

export function EnquiryForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    agreedToTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const validateField = (field: keyof EnquiryFormData, value: unknown) => {
    // @ts-ignore - Zod shape access
    const fieldSchema = (enquiryFormSchema.shape as any)[field]
    if (!fieldSchema) return
    const result = fieldSchema.safeParse(value)

    if (!result.success) {
      setErrors(prev => ({
        ...prev,
        [field]: result.error.issues[0]?.message || 'Invalid'
      }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    setFormData(prev => ({ ...prev, [name]: newValue }))
    // Real-time validation on change/blur
    validateField(name as keyof EnquiryFormData, newValue)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccess(false)

    const result = enquiryFormSchema.safeParse(formData)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        const path = err.path.join('.')
        if (!fieldErrors[path]) {
          fieldErrors[path] = err.message
        }
      })
      setErrors(fieldErrors)
      setIsSubmitting(false)
      return
    }

    // XSS Sanitization before submission
    const sanitizedData = {
      name: sanitizeName(result.data.name),
      email: sanitizeEmail(result.data.email),
      phone: sanitizePhone(result.data.phone),
      message: sanitize(result.data.message),
      agreedToTerms: result.data.agreedToTerms,
    }

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors)
        } else {
          alert(data.error || 'Failed to submit')
        }
        return
      }

      setFormData({ name: '', email: '', phone: '', message: '', agreedToTerms: false })
      setErrors({})
      setSuccess(true)
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit. Please call 0244000000.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-[24px] p-6 border border-black/5">
      <h3 className="font-bold text-[18px]">Contact WDS • Validated & Secured</h3>
      {success && <div className="bg-green-50 text-green-700 border border-green-200 rounded-2xl p-3 text-[13px] font-semibold">✓ Enquiry submitted! Williams will contact you within 2 hours.</div>}
      
      <div>
        <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wide text-black/50 mb-1.5 block">Full Name</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ama Mensah" className={`w-full h-[48px] bg-[#F5F5F7] border rounded-2xl px-4 text-[14px] ${errors.name ? 'border-red-500 bg-red-50' : 'border-black/5'}`} />
        {errors.name && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.name}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wide text-black/50 mb-1.5 block">Email</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="ama@example.com" className={`w-full h-[48px] bg-[#F5F5F7] border rounded-2xl px-4 text-[14px] ${errors.email ? 'border-red-500 bg-red-50' : 'border-black/5'}`} />
          {errors.email && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-wide text-black/50 mb-1.5 block">Ghana Phone</label>
          <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="0244 123 456" className={`w-full h-[48px] bg-[#F5F5F7] border rounded-2xl px-4 text-[14px] ${errors.phone ? 'border-red-500 bg-red-50' : 'border-black/5'}`} />
          {errors.phone && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.phone}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="text-[11px] font-bold uppercase tracking-wide text-black/50 mb-1.5 block">Message</label>
        <textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="I need delivery from East Legon to Osu..." rows={4} className={`w-full bg-[#F5F5F7] border rounded-2xl px-4 py-3 text-[14px] ${errors.message ? 'border-red-500 bg-red-50' : 'border-black/5'}`} />
        {errors.message && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.message}</p>}
        <div className="text-[10px] text-black/40 mt-1">{formData.message.length}/2000 characters</div>
      </div>

      <div>
        <label className="flex items-start gap-2 text-[12px] text-black/60 cursor-pointer">
          <input type="checkbox" name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleChange} className="mt-1" />
          <span>I agree to WDS Terms, Privacy Policy, and Ghana Data Protection Act. My data is secured with XSS sanitization and Zod validation.</span>
        </label>
        {errors.agreedToTerms && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.agreedToTerms}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full h-[52px] bg-black text-white rounded-full font-bold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Submitting securely...
          </>
        ) : (
          'Submit Enquiry →'
        )}
      </button>

      <div className="text-[10px] text-black/40 text-center">Secured with Zod + xss + CORS + Server re-validation • Ghana phone validation</div>
    </form>
  )
}
