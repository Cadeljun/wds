import xss, { IFilterXSSOptions } from 'xss'

const xssOptions: IFilterXSSOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
}

export const sanitize = (input: string): string => {
  if (!input || typeof input !== 'string') return ''
  return xss(input.trim(), xssOptions)
}

export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitize(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitize(item) : item
      )
    } else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}

export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return ''
  return email.trim().toLowerCase()
}

export const sanitizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return ''
  // Keep only digits, spaces, plus, hyphen - Ghana format
  return phone.replace(/[^\d\s\+\-]/g, '').trim()
}

export const sanitizeGhanaPhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return ''
  const digits = phone.replace(/\D/g, '')
  // Normalize to 0 format for storage
  if (digits.startsWith('233') && digits.length === 12) {
    return '0' + digits.substring(3)
  } else if (digits.length === 9) {
    return '0' + digits
  }
  return digits.startsWith('0') ? digits : phone.replace(/[^\d\s\+\-]/g, '').trim()
}

export const sanitizeName = (name: string): string => {
  if (!name || typeof name !== 'string') return ''
  // Allow only letters, spaces, hyphens, apostrophes, dots - strip XSS
  const cleaned = sanitize(name)
  return cleaned.replace(/[^a-zA-Z\s\-'\.]/g, '').trim().substring(0, 100)
}

export const sanitizeAddress = (address: string): string => {
  if (!address || typeof address !== 'string') return ''
  // Allow letters, numbers, spaces, commas, hyphens, dots, apostrophes for Ghana addresses
  const cleaned = sanitize(address)
  return cleaned.replace(/[^a-zA-Z0-9\s\,\-\.\'\#\/]/g, '').trim().substring(0, 300)
}
