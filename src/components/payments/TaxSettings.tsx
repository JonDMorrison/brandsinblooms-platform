'use client'

/**
 * Tax Settings Component
 *
 * Allows site owners to configure tax collection settings:
 * - Enable/disable tax collection
 * - Set default tax rate
 * - Tax inclusive vs. exclusive pricing
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
import { updateTaxSettings } from '@/app/actions/payment-settings'
import { Loader2, Percent } from 'lucide-react'
import { useRouter } from 'next/navigation'

const taxSettingsSchema = z.object({
  taxEnabled: z.boolean(),
  defaultTaxRate: z.number().min(0).max(100),
})

interface TaxSettingsProps {
  siteId: string
  settings: {
    taxEnabled: boolean
    defaultTaxRate: number
    taxByState: Record<string, number>
  }
  canManage: boolean
}

export function TaxSettings({ siteId, settings, canManage }: TaxSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof taxSettingsSchema>>({
    resolver: zodResolver(taxSettingsSchema),
    defaultValues: {
      taxEnabled: settings.taxEnabled,
      defaultTaxRate: settings.defaultTaxRate,
    },
  })

  const taxEnabled = watch('taxEnabled')

  // Save all settings
  const onSubmit = async (data: z.infer<typeof taxSettingsSchema>) => {
    if (!canManage) {
      toast.error('Permission Denied', {
        description: 'You do not have permission to modify payment settings',
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await updateTaxSettings(siteId, {
        ...data,
        taxByState: {},
      })

      if (result.success) {
        toast.success('Settings Saved', {
          description: 'Tax settings have been updated successfully',
        })
        router.refresh()
      } else {
        throw new Error(result.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Failed to save tax settings:', error)
      toast.error('Save Failed', {
        description: error instanceof Error ? error.message : 'Failed to save tax settings',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Settings</CardTitle>
        <CardDescription>
          Configure tax rates and collection preferences for your store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Enable Tax Collection */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tax-enabled">Enable Tax Collection</Label>
              <p className="text-sm text-muted-foreground">
                Collect sales tax on orders
              </p>
            </div>
            <Switch
              id="tax-enabled"
              checked={taxEnabled}
              onCheckedChange={(checked) => setValue('taxEnabled', checked)}
              disabled={!canManage}
            />
          </div>

          {/* Tax Rate */}
          <div className="space-y-2">
            <Label htmlFor="default-tax-rate">
              Tax Rate
            </Label>
            <div className="relative">
              <Input
                id="default-tax-rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="8.00"
                {...register('defaultTaxRate', { valueAsNumber: true })}
                disabled={!canManage || !taxEnabled}
                className="pr-10"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {errors.defaultTaxRate && (
              <p className="text-sm text-destructive">{errors.defaultTaxRate.message}</p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={!canManage || isLoading} className="btn-gradient-primary">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Tax Settings'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
