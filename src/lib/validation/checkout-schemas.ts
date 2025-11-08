/**
 * Checkout Validation Schemas
 *
 * Zod schemas for validating checkout forms
 */

import { z } from 'zod'

// =============================================
// UUID VALIDATORS
// =============================================

/**
 * Test/Development UUID pattern
 * Allows special test UUIDs like 00000000-0000-0000-0000-000000000001
 * These are used in seed data and development environments
 */
const testUuidPattern = /^00000000-0000-0000-0000-00000000000[01]$/

/**
 * Relaxed UUID validator that accepts:
 * - Standard RFC 4122 UUIDs
 * - Test/development UUIDs (all zeros with trailing 0 or 1)
 */
const uuidOrTestUuid = z.string().refine(
  (val) => {
    // Accept test UUIDs
    if (testUuidPattern.test(val)) return true
    // Accept standard UUIDs using Zod's built-in validator
    return z.string().uuid().safeParse(val).success
  },
  { message: 'Must be a valid UUID or test UUID' }
)

// =============================================
// SHIPPING ADDRESS SCHEMA
// =============================================

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().refine(
    (val) => !val || (val.length >= 10 && val.length <= 20),
    { message: 'Phone number must be 10-20 characters if provided' }
  ).optional(),
  addressLine1: z.string().min(5, 'Street address is required').max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().length(2, 'State must be 2-letter code (e.g., CA, NY)'),
  postalCode: z.string().min(5, 'Postal code is required').max(10),
  country: z.string().length(2, 'Country must be 2-letter code (e.g., US)').default('US'),
})

export type ShippingAddress = z.infer<typeof shippingAddressSchema>

// =============================================
// CHECKOUT FORM SCHEMA
// =============================================

export const checkoutFormSchema = z.object({
  shipping: shippingAddressSchema,
  saveAddress: z.boolean().default(false).optional(),
  subscribeToNewsletter: z.boolean().default(false).optional(),
})

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>

// =============================================
// PAYMENT INTENT CREATION SCHEMA
// =============================================

export const createPaymentIntentSchema = z.object({
  siteId: uuidOrTestUuid,
  cartItems: z.array(
    z.object({
      productId: uuidOrTestUuid,
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })
  ).min(1, 'Cart cannot be empty'),
  shippingAddress: shippingAddressSchema,
})

export type CreatePaymentIntentData = z.infer<typeof createPaymentIntentSchema>

// =============================================
// ORDER CREATION SCHEMA
// =============================================

export const createOrderSchema = z.object({
  siteId: uuidOrTestUuid,
  stripePaymentIntentId: z.string().startsWith('pi_'),
  cartItems: z.array(
    z.object({
      productId: uuidOrTestUuid,
      productName: z.string(),
      productSku: z.string().optional(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
      totalPrice: z.number().positive(),
    })
  ).min(1),
  customerEmail: z.string().email(),
  customerName: z.string().min(2),
  shippingAddress: z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  subtotal: z.number().positive(),
  taxAmount: z.number().nonnegative(),
  shippingAmount: z.number().nonnegative(),
  totalAmount: z.number().positive(),
})

export type CreateOrderData = z.infer<typeof createOrderSchema>

// =============================================
// HELPER VALIDATORS
// =============================================

/**
 * Validate US postal code format
 */
export const isValidUSPostalCode = (code: string): boolean => {
  return /^\d{5}(-\d{4})?$/.test(code)
}

/**
 * Validate phone number (simple check)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

/**
 * US States list for validation
 */
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const

export type USState = typeof US_STATES[number]
