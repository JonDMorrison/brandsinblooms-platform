'use client'

/**
 * Shipping Settings Component
 *
 * Allows site owners to configure shipping settings:
 * - Enable/disable shipping charges
 * - Set free shipping threshold
 * - Configure flat rate shipping
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Switch } from '@/src/components/ui/switch'
import { toast } from 'sonner'
import { updateShippingSettings } from '@/app/actions/payment-settings'
import { Loader2, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'

const shippingSettingsSchema = z.object({
  shippingEnabled: z.boolean(),
  freeShippingThreshold: z.number().min(0),
  flatRateShipping: z.number().min(0),
})

interface ShippingSettingsProps {
  siteId: string
  settings: {
    shippingEnabled: boolean
    freeShippingThreshold: number
    flatRateShipping: number
    shippingByRegion: Array<{ region: string; rate: number }>
  }
  canManage: boolean
}

export function ShippingSettings({ siteId, settings, canManage }: ShippingSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof shippingSettingsSchema>>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: {
      shippingEnabled: settings.shippingEnabled,
      freeShippingThreshold: settings.freeShippingThreshold,
      flatRateShipping: settings.flatRateShipping,
    },
  })

  const shippingEnabled = watch('shippingEnabled')

  // Save all settings
  const onSubmit = async (data: z.infer<typeof shippingSettingsSchema>) => {
    if (!canManage) {
      toast.error('Permission Denied', {
        description: 'You do not have permission to modify payment settings',
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await updateShippingSettings(siteId, {
        ...data,
        shippingByRegion: [],
      })

      if (result.success) {
        toast.success('Settings Saved', {
          description: 'Shipping settings have been updated successfully',
        })
        router.refresh()
      } else {
        throw new Error(result.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Failed to save shipping settings:', error)
      toast.error('Save Failed', {
        description: error instanceof Error ? error.message : 'Failed to save shipping settings',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Settings</CardTitle>
        <CardDescription>
          Configure shipping rates and delivery options for your store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Enable Shipping */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="shipping-enabled">Enable Shipping Charges</Label>
              <p className="text-sm text-muted-foreground">
                Charge customers for shipping based on order value and location
              </p>
            </div>
            <Switch
              id="shipping-enabled"
              checked={shippingEnabled}
              onCheckedChange={(checked) => setValue('shippingEnabled', checked)}
              disabled={!canManage}
            />
          </div>

          {/* Free Shipping Threshold */}
          <div className="space-y-2">
            <Label htmlFor="free-shipping-threshold">
              Free Shipping Threshold
              <span className="text-muted-foreground ml-1">(orders over this amount ship free)</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="free-shipping-threshold"
                type="number"
                step="0.01"
                min="0"
                placeholder="100.00"
                {...register('freeShippingThreshold', { valueAsNumber: true })}
                disabled={!canManage || !shippingEnabled}
                className="pl-9"
              />
            </div>
            {errors.freeShippingThreshold && (
              <p className="text-sm text-destructive">{errors.freeShippingThreshold.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Set to 0 to disable free shipping threshold
            </p>
          </div>

          {/* Flat Rate Shipping */}
          <div className="space-y-2">
            <Label htmlFor="flat-rate-shipping">
              Flat Rate Shipping
              <span className="text-muted-foreground ml-1">(applied to orders under threshold)</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="flat-rate-shipping"
                type="number"
                step="0.01"
                min="0"
                placeholder="10.00"
                {...register('flatRateShipping', { valueAsNumber: true })}
                disabled={!canManage || !shippingEnabled}
                className="pl-9"
              />
            </div>
            {errors.flatRateShipping && (
              <p className="text-sm text-destructive">{errors.flatRateShipping.message}</p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={!canManage || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Shipping Settings'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
