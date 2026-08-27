import { z } from 'zod'

// ===========================================
// HELPER: Ghana Phone Number Validation
// Ghana format: 0244 123 456 (10 digits with leading 0) or +233 244 123 456 (12 digits)
// Valid prefixes: 020, 023, 024, 026, 027, 028, 050, 053, 054, 055, 059, etc. (MTN, Vodafone, AirtelTigo, Glo)
// ===========================================
export const validateGhanaPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '')

  // +233 format: 233 + 9 digits = 12 digits total
  if (digits.startsWith('233')) {
    if (digits.length !== 12) return false
    const prefix = digits.substring(3, 5) // e.g., 24, 20, 54
    const validPrefixes = ['20', '23', '24', '25', '26', '27', '28', '50', '53', '54', '55', '59']
    return validPrefixes.includes(prefix)
  } 
  // 0 format: 0 + 9 digits = 10 digits
  else if (digits.startsWith('0')) {
    if (digits.length !== 10) return false
    const prefix = digits.substring(1, 3) // e.g., 24, 20, 54
    const validPrefixes = ['20', '23', '24', '25', '26', '27', '28', '50', '53', '54', '55', '59']
    return validPrefixes.includes(prefix)
  } 
  // 9 digits without leading 0 (e.g., 244123456)
  else if (digits.length === 9) {
    const prefix = digits.substring(0, 2)
    const validPrefixes = ['20', '23', '24', '25', '26', '27', '28', '50', '53', '54', '55', '59']
    return validPrefixes.includes(prefix)
  }

  return false
}

export const formatGhanaPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('233')) {
    return `+${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 9)} ${digits.substring(9)}`
  } else if (digits.startsWith('0') && digits.length === 10) {
    return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`
  }
  return phone
}

// ===========================================
// CONTACT/ENQUIRY FORM SCHEMA - WDS
// ===========================================
export const enquiryFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes and dots'),

  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email must be less than 254 characters')
    .toLowerCase(),

  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .refine(validateGhanaPhone, 'Please enter a valid Ghana phone number (e.g., 0244 123 456 or +233 244 123 456)'),

  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),

  agreedToTerms: z
    .boolean()
    .refine(val => val === true, 'You must agree to the terms and privacy policy'),
})

export type EnquiryFormData = z.infer<typeof enquiryFormSchema>

// ===========================================
// WDS BOOKING / ORDER FORM SCHEMA - Core delivery order
// ===========================================
export const bookingFormSchema = z.object({
  pickup_address: z
    .string()
    .min(5, 'Pickup address must be at least 5 characters')
    .max(300, 'Pickup address must be less than 300 characters'),

  dropoff_address: z
    .string()
    .min(5, 'Drop-off address must be at least 5 characters')
    .max(300, 'Drop-off address must be less than 300 characters'),

  package_type: z
    .enum(['parcel', 'food', 'grocery', 'medicine', 'document', 'other'], {
      message: 'Package type must be parcel, food, grocery, medicine, document, or other',
    }),

  description: z
    .string()
    .min(3, 'Description must be at least 3 characters')
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),

  recipient_name: z
    .string()
    .min(2, 'Recipient name must be at least 2 characters')
    .max(100, 'Recipient name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Recipient name can only contain letters, spaces, hyphens, apostrophes and dots')
    .optional()
    .or(z.literal('')),

  recipient_phone: z
    .string()
    .min(10, 'Recipient phone must be at least 10 digits')
    .max(20, 'Recipient phone must be less than 20 characters')
    .refine(validateGhanaPhone, 'Please enter a valid Ghana phone number for recipient')
    .optional()
    .or(z.literal('')),

  payment_method: z
    .enum(['momo_mtn', 'momo_vodafone', 'momo_airteltigo', 'card', 'cash', 'wallet', 'momo', 'cash'], {
      message: 'Payment method must be MoMo, Card, Cash, or Wallet',
    }),

  express: z
    .boolean()
    .optional()
    .default(false),
})

export type BookingFormData = z.infer<typeof bookingFormSchema>

// ===========================================
// AUTH SCHEMAS - WDS Ghana
// ===========================================
export const loginSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(20, 'Phone must be less than 20 characters')
    .refine(validateGhanaPhone, 'Please enter a valid Ghana phone number (e.g., 0244 123 456)'),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
})

export type LoginData = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes and dots'),

  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(20, 'Phone must be less than 20 characters')
    .refine(validateGhanaPhone, 'Please enter a valid Ghana phone number (e.g., 0244 123 456 or +233 244 123 456)'),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/, 'Password must contain at least one letter and one number'),

  role: z
    .enum(['customer', 'rider'], {
      message: 'Role must be customer or rider',
    }),

  vehicle_type: z
    .enum(['motor', 'bicycle', 'car', 'van'], {
      message: 'Vehicle must be motor, bicycle, car, or van',
    })
    .optional(),

  license_plate: z
    .string()
    .max(20, 'License plate must be less than 20 characters')
    .regex(/^[A-Z0-9\s\-]+$/i, 'License plate can only contain letters, numbers, spaces and hyphens')
    .optional()
    .or(z.literal('')),

  agreedToTerms: z
    .boolean()
    .refine(val => val === true, 'You must agree to terms and privacy policy'),
})

export type SignupData = z.infer<typeof signupSchema>

// ===========================================
// NEWSLETTER SCHEMA
// ===========================================
export const newsletterSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email must be less than 254 characters')
    .toLowerCase(),
})

export type NewsletterData = z.infer<typeof newsletterSchema>

// ===========================================
// RIDER ONBOARDING SCHEMA
// ===========================================
export const riderOnboardingSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),

  phone: z
    .string()
    .refine(validateGhanaPhone, 'Please enter a valid Ghana phone number'),

  vehicle_type: z
    .enum(['motor', 'bicycle', 'car', 'van']),

  license_plate: z
    .string()
    .min(3, 'License plate must be at least 3 characters')
    .max(20, 'License plate must be less than 20 characters')
    .regex(/^[A-Z0-9\s\-]+$/i, 'Invalid license plate format (e.g., AB 1234-23)'),

  momo_number: z
    .string()
    .refine(validateGhanaPhone, 'Please enter a valid MoMo number for payouts')
    .optional()
    .or(z.literal('')),

  id_number: z
    .string()
    .min(5, 'ID number must be at least 5 characters')
    .max(50, 'ID number must be less than 50 characters')
    .optional()
    .or(z.literal('')),
})

export type RiderOnboardingData = z.infer<typeof riderOnboardingSchema>

// ===========================================
// HELPER: Get first validation error message
// ===========================================
export const getFirstError = (error: z.ZodError): string => {
  return error.issues[0]?.message || 'Validation failed'
}

// ===========================================
// HELPER: Get all validation errors as object
// ===========================================
export const getFieldErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {}
  error.issues.forEach((err: z.ZodIssue) => {
    const path = err.path.join('.')
    if (!errors[path]) {
      errors[path] = err.message
    }
  })
  return errors
}
