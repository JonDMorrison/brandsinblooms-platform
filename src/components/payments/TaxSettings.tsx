'use client'

/**
 * Tax Settings Component
 *
 * Allows site owners to configure tax collection settings:
 * - Enable/disable tax collection
 * - Set default tax rate
 * - Configure state-specific tax rates
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
import { updateTaxSettings } from '@/app/actions/payment-settings'
import { Loader2, Plus, Trash2, Percent, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'

const taxSettingsSchema = z.object({
  taxEnabled: z.boolean(),
  defaultTaxRate: z.number().min(0).max(100),
  taxInclusive: z.boolean(),
})

interface TaxSettingsProps {
  siteId: string
  settings: {
    taxEnabled: boolean
    defaultTaxRate: number
    taxByState: Record<string, number>
    taxInclusive: boolean
  }
  canManage: boolean
}

export function TaxSettings({ siteId, settings, canManage }: TaxSettingsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [stateRates, setStateRates] = useState<Record<string, number>>(settings.taxByState)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newState, setNewState] = useState('')
  const [newRate, setNewRate] = useState('')

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
      taxInclusive: settings.taxInclusive,
    },
  })

  const taxEnabled = watch('taxEnabled')

  // Add new state rate
  const handleAddStateRate = () => {
    if (!newState.trim()) {
      toast({
        title: 'Invalid State',
        description: 'Please enter a state name',
        variant: 'destructive',
      })
      return
    }

    const rate = parseFloat(newRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        title: 'Invalid Rate',
        description: 'Tax rate must be between 0 and 100',
        variant: 'destructive',
      })
      return
    }

    setStateRates((prev) => ({
      ...prev,
      [newState.trim()]: rate,
    }))

    setNewState('')
    setNewRate('')
    setIsAddDialogOpen(false)
  }

  // Delete state rate
  const handleDeleteStateRate = (state: string) => {
    setStateRates((prev) => {
      const updated = { ...prev }
      delete updated[state]
      return updated
    })
  }

  // Save all settings
  const onSubmit = async (data: z.infer<typeof taxSettingsSchema>) => {
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
      const result = await updateTaxSettings(siteId, {
        ...data,
        taxByState: stateRates,
      })

      if (result.success) {
        toast({
          title: 'Settings Saved',
          description: 'Tax settings have been updated successfully',
        })
        router.refresh()
      } else {
        throw new Error(result.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Failed to save tax settings:', error)
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save tax settings',
        variant: 'destructive',
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

          {/* Tax Inclusive Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tax-inclusive">Prices Include Tax</Label>
              <p className="text-sm text-muted-foreground">
                Product prices already include tax (shown separately at checkout)
              </p>
            </div>
            <Switch
              id="tax-inclusive"
              checked={watch('taxInclusive')}
              onCheckedChange={(checked) => setValue('taxInclusive', checked)}
              disabled={!canManage || !taxEnabled}
            />
          </div>

          {/* Default Tax Rate */}
          <div className="space-y-2">
            <Label htmlFor="default-tax-rate">
              Default Tax Rate
              <span className="text-muted-foreground ml-1">(applies to all states unless overridden)</span>
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

          {/* State-Specific Rates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>State-Specific Rates</Label>
                <p className="text-sm text-muted-foreground">
                  Override the default rate for specific states or regions
                </p>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canManage || !taxEnabled}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add State
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add State Tax Rate</DialogTitle>
                    <DialogDescription>
                      Enter a state or region name and its tax rate
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="state-name">State/Region Name</Label>
                      <Input
                        id="state-name"
                        placeholder="e.g., California, CA, New York"
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state-rate">Tax Rate (%)</Label>
                      <div className="relative">
                        <Input
                          id="state-rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="9.50"
                          value={newRate}
                          onChange={(e) => setNewRate(e.target.value)}
                          className="pr-10"
                        />
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    <Button type="button" onClick={handleAddStateRate}>
                      Add Rate
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {Object.keys(stateRates).length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>State/Region</TableHead>
                      <TableHead>Tax Rate</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(stateRates)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([state, rate]) => (
                        <TableRow key={state}>
                          <TableCell className="font-medium">{state}</TableCell>
                          <TableCell>{rate.toFixed(2)}%</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStateRate(state)}
                              disabled={!canManage || !taxEnabled}
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
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No state-specific rates configured</p>
                <p className="text-xs">Default rate will apply to all locations</p>
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
                'Save Tax Settings'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
