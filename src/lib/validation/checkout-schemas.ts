/**
 * Checkout Validation Schemas
 *
 * Zod schemas for validating checkout forms
 */

import { z } from 'zod'

// =============================================
// SHIPPING ADDRESS SCHEMA
// =============================================

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20),
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
  siteId: z.string().uuid(),
  cartItems: z.array(
    z.object({
      productId: z.string().uuid(),
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
  siteId: z.string().uuid(),
  stripePaymentIntentId: z.string().startsWith('pi_'),
  cartItems: z.array(
    z.object({
      productId: z.string().uuid(),
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
    phone: z.string(),
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
