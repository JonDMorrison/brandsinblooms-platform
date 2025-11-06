'use client'

/**
 * Shipping Settings Component
 *
 * Allows site owners to configure shipping settings:
 * - Enable/disable shipping charges
 * - Set free shipping threshold
 * - Configure flat rate shipping
 * - Set region-specific shipping rates
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { useToast } from '@/src/components/ui/use-toast'
import { updateShippingSettings } from '@/app/actions/payment-settings'
import { Loader2, Plus, Trash2, DollarSign, Info, Truck } from 'lucide-react'
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
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [regionalRates, setRegionalRates] = useState<Array<{ region: string; rate: number }>>(
    settings.shippingByRegion
  )
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newRegion, setNewRegion] = useState('')
  const [newRate, setNewRate] = useState('')

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

  // Add new regional rate
  const handleAddRegionalRate = () => {
    if (!newRegion.trim()) {
      toast({
        title: 'Invalid Region',
        description: 'Please enter a region name',
        variant: 'destructive',
      })
      return
    }

    const rate = parseFloat(newRate)
    if (isNaN(rate) || rate < 0) {
      toast({
        title: 'Invalid Rate',
        description: 'Shipping rate must be 0 or greater',
        variant: 'destructive',
      })
      return
    }

    // Check if region already exists
    if (regionalRates.some((r) => r.region.toLowerCase() === newRegion.trim().toLowerCase())) {
      toast({
        title: 'Duplicate Region',
        description: 'This region already has a rate configured',
        variant: 'destructive',
      })
      return
    }

    setRegionalRates((prev) => [...prev, { region: newRegion.trim(), rate }])
    setNewRegion('')
    setNewRate('')
    setIsAddDialogOpen(false)
  }

  // Delete regional rate
  const handleDeleteRegionalRate = (region: string) => {
    setRegionalRates((prev) => prev.filter((r) => r.region !== region))
  }

  // Save all settings
  const onSubmit = async (data: z.infer<typeof shippingSettingsSchema>) => {
    if (!canManage) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to modify payment settings',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await updateShippingSettings(siteId, {
        ...data,
        shippingByRegion: regionalRates,
      })

      if (result.success) {
        toast({
          title: 'Settings Saved',
          description: 'Shipping settings have been updated successfully',
        })
        router.refresh()
      } else {
        throw new Error(result.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Failed to save shipping settings:', error)
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save shipping settings',
        variant: 'destructive',
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

          {/* Regional Rates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Regional Rates (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Override flat rate for specific regions (e.g., Alaska, Hawaii, International)
                </p>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canManage || !shippingEnabled}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Region
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Regional Shipping Rate</DialogTitle>
                    <DialogDescription>
                      Enter a region name and its shipping rate
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="region-name">Region Name</Label>
                      <Input
                        id="region-name"
                        placeholder="e.g., Alaska, Hawaii, International"
                        value={newRegion}
                        onChange={(e) => setNewRegion(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region-rate">Shipping Rate ($)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="region-rate"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="25.00"
                          value={newRate}
                          onChange={(e) => setNewRate(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleAddRegionalRate}>
                      Add Rate
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {regionalRates.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead>Shipping Rate</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regionalRates
                      .sort((a, b) => a.region.localeCompare(b.region))
                      .map((item) => (
                        <TableRow key={item.region}>
                          <TableCell className="font-medium">{item.region}</TableCell>
                          <TableCell>${item.rate.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRegionalRate(item.region)}
                              disabled={!canManage || !shippingEnabled}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No regional rates configured</p>
                <p className="text-xs">Flat rate will apply to all locations</p>
              </div>
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
