'use client'

/**
 * Shipping Form Component
 *
 * Collect shipping address and contact information for checkout
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { shippingAddressSchema, ShippingAddress, US_STATES } from '@/src/lib/validation/checkout-schemas'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'

interface ShippingFormProps {
  onSubmit: (data: ShippingAddress) => void
  defaultValues?: Partial<ShippingAddress>
  isSubmitting?: boolean
}

export function ShippingForm({ onSubmit, defaultValues, isSubmitting = false }: ShippingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ShippingAddress>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      country: 'US',
      ...defaultValues,
    },
  })

  const selectedState = watch('state')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          {...register('fullName')}
          placeholder="John Doe"
          disabled={isSubmitting}
        />
        {errors.fullName && (
          <p className="text-sm text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="john@example.com"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            placeholder="(555) 123-4567"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine1">Street Address *</Label>
        <Input
          id="addressLine1"
          {...register('addressLine1')}
          placeholder="123 Main St"
          disabled={isSubmitting}
        />
        {errors.addressLine1 && (
          <p className="text-sm text-red-500">{errors.addressLine1.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine2">Apartment, suite, etc. (optional)</Label>
        <Input
          id="addressLine2"
          {...register('addressLine2')}
          placeholder="Apt 4B"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            {...register('city')}
            placeholder="San Francisco"
            disabled={isSubmitting}
          />
          {errors.city && (
            <p className="text-sm text-red-500">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Select
            value={selectedState}
            onValueChange={(value) => setValue('state', value, { shouldValidate: true })}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-sm text-red-500">{errors.state.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Zip Code *</Label>
          <Input
            id="postalCode"
            {...register('postalCode')}
            placeholder="94102"
            disabled={isSubmitting}
          />
          {errors.postalCode && (
            <p className="text-sm text-red-500">{errors.postalCode.message}</p>
          )}
        </div>
      </div>

      <input type="hidden" {...register('country')} value="US" />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        Continue to Payment
      </Button>
    </form>
  )
}
