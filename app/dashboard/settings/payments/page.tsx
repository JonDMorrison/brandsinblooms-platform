'use client'

import { PaymentSettings } from '@/src/components/settings/PaymentSettings'

export default function PaymentSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="fade-in-up" style={{ animationDelay: '0s' }}>
        <h1 className="text-3xl font-bold tracking-tight">Payment Settings</h1>
        <p className="text-gray-500">
          Configure payment processing, tax rates, and shipping options for your site.
        </p>
      </div>

      <PaymentSettings />
    </div>
  )
}
