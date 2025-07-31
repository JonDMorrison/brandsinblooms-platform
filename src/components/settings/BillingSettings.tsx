import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Separator } from '@/src/components/ui/separator'
import { toast } from 'sonner'
import { CreditCard, Download, Calendar, Check, Star, Zap, Crown, ArrowUpCircle } from 'lucide-react'

interface Invoice {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  description: string
  downloadUrl: string
}

interface Plan {
  id: string
  name: string
  price: number
  interval: string
  features: string[]
  popular?: boolean
  current?: boolean
  icon: React.ComponentType<{ className?: string }>
}

export function BillingSettings() {
  const [isLoading, setIsLoading] = useState(false)

  const currentPlan = {
    name: 'Pro Plan',
    price: 29,
    interval: 'month',
    nextBilling: '2024-02-15',
    status: 'active',
  }

  const paymentMethod = {
    type: 'card',
    last4: '4242',
    brand: 'Visa',
    expiry: '12/2028',
  }

  const mockInvoices: Invoice[] = [
    {
      id: 'inv_001',
      date: '2024-01-15',
      amount: 29.00,
      status: 'paid',
      description: 'Pro Plan - January 2024',
      downloadUrl: '#',
    },
    {
      id: 'inv_002',
      date: '2023-12-15',
      amount: 29.00,
      status: 'paid',
      description: 'Pro Plan - December 2023',
      downloadUrl: '#',
    },
    {
      id: 'inv_003',
      date: '2023-11-15',
      amount: 29.00,
      status: 'paid',
      description: 'Pro Plan - November 2023',
      downloadUrl: '#',
    },
    {
      id: 'inv_004',
      date: '2023-10-15',
      amount: 19.00,
      status: 'paid',
      description: 'Starter Plan - October 2023',
      downloadUrl: '#',
    },
  ]

  const availablePlans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 19,
      interval: 'month',
      icon: Star,
      features: [
        '5 Sites',
        '10GB Storage',
        'Basic Templates',
        'Email Support',
        'SSL Certificate',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      interval: 'month',
      icon: Zap,
      popular: true,
      current: true,
      features: [
        '25 Sites',
        '100GB Storage',
        'Premium Templates',
        'Priority Support',
        'SSL Certificate',
        'Custom Domain',
        'Advanced Analytics',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      interval: 'month',
      icon: Crown,
      features: [
        'Unlimited Sites',
        '1TB Storage',
        'All Templates',
        '24/7 Phone Support',
        'SSL Certificate',
        'Custom Domain',
        'Advanced Analytics',
        'White-label Solution',
        'API Access',
      ],
    },
  ]

  const downloadInvoice = (invoice: Invoice) => {
    // Mock download functionality
    console.log('Downloading invoice:', invoice.id)
    toast.success('Invoice download started')
  }

  const changePlan = async (planId: string) => {
    setIsLoading(true)
    try {
      // Here you would change the subscription plan
      console.log('Changing plan to:', planId)
      toast.success('Plan change request submitted!')
    } catch (error) {
      console.error('Plan change error:', error)
      toast.error('Failed to change plan. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const updatePaymentMethod = () => {
    // Mock payment method update
    toast.success('Redirecting to payment method update...')
  }

  const cancelSubscription = async () => {
    try {
      // Here you would cancel the subscription
      console.log('Cancelling subscription')
      toast.success('Subscription cancelled. You will retain access until the end of your billing period.')
    } catch (error) {
      console.error('Cancellation error:', error)
      toast.error('Failed to cancel subscription. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>
            Manage your current subscription and billing information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{currentPlan.name}</h3>
              <p className="text-sm text-muted-foreground">
                ${currentPlan.price}/{currentPlan.interval}
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <h4 className="font-medium mb-2">Next Billing Date</h4>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{currentPlan.nextBilling}</span>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Payment Method</h4>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {paymentMethod.brand} ending in {paymentMethod.last4}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={updatePaymentMethod}>
              Update Payment Method
            </Button>
            <Button variant="outline" onClick={cancelSubscription}>
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5" />
            Available Plans
          </CardTitle>
          <CardDescription>
            Upgrade or downgrade your subscription plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((plan) => {
              const Icon = plan.icon
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border p-6 ${
                    plan.popular ? 'border-primary shadow-md' : 'border-border'
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  
                  <div className="text-center mb-4">
                    <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <div className="text-3xl font-bold mt-2">
                      ${plan.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.interval}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={plan.current ? "secondary" : "default"}
                    disabled={plan.current || isLoading}
                    onClick={() => changePlan(plan.id)}
                  >
                    {plan.current ? 'Current Plan' : 'Select Plan'}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View and download your past invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.description}</TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadInvoice(invoice)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>
            Track your current usage against your plan limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Sites Created</span>
              <span className="text-sm text-muted-foreground">12 / 25</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '48%' }}></div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Storage Used</span>
              <span className="text-sm text-muted-foreground">34GB / 100GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '34%' }}></div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Monthly Page Views</span>
              <span className="text-sm text-muted-foreground">45,234 / Unlimited</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}