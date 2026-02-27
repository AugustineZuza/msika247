'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { RefreshCcw, Globe, Shield, Bell, DollarSign } from 'lucide-react'

interface SettingsResponse {
  settings: SettingsData
}

interface SettingsData {
  marketplace: {
    name: string
    description: string
    logo: string
    favicon: string
    currency: string
    timezone: string
    language: string
    totalSellers: number
    totalBuyers: number
    totalOrders: number
    activeProducts: number
    totalRevenue: number
    successfulTransactions: number
  }
  payments: {
    enabledGateways: string[]
    commissionRate: number
    minimumOrderAmount: number
    enableRefunds: boolean
    refundPeriod: number
    totalRevenue: number
    totalTransactions: number
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    orderNotifications: boolean
    sellerNotifications: boolean
    buyerNotifications: boolean
    adminNotifications: boolean
  }
  security: {
    enableTwoFactor: boolean
    passwordMinLength: number
    sessionTimeout: number
    enableCaptcha: boolean
    maxLoginAttempts: number
  }
  autoApproval: {
    autoApproveSellers: boolean
    autoApproveProducts: boolean
    requireSellerVerification: boolean
    enableProductModeration: boolean
  }
  activity: {
    recentOrders: number
    recentSellers: number
    lastUpdated: string
  }
}

export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchSettings(signal?: AbortSignal) {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/settings', {
        cache: 'no-store',
        signal
      })

      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const result = (await response.json()) as SettingsResponse
      setData(result.settings)
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') {
        console.error(err)
        setError((err as Error).message || 'Unable to load settings')
        setData(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchSettings(controller.signal)
    return () => controller.abort()
  }, [])

  const marketplace = data?.marketplace
  const payments = data?.payments
  const notifications = data?.notifications
  const security = data?.security
  const autoApproval = data?.autoApproval
  const activity = data?.activity

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Live marketplace configuration powered by real database metrics.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchSettings()} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4 mr-2" />Refresh data
          </Button>
          <Button disabled>Save changes</Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Live marketplace stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Sellers" value={marketplace?.totalSellers} description="Active vendors" />
        <StatCard title="Buyers" value={marketplace?.totalBuyers} description="Registered customers" />
        <StatCard title="Orders" value={marketplace?.totalOrders} description="Lifetime orders" />
        <StatCard title="Active Products" value={marketplace?.activeProducts} description="Currently live" />
      </div>

      {/* Marketplace profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4" />Marketplace profile</CardTitle>
          <CardDescription>Update the public-facing identity of the marketplace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Marketplace name</label>
              <Input value={marketplace?.name ?? ''} readOnly className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Currency</label>
              <Input value={marketplace?.currency ?? 'MWK'} readOnly className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Timezone</label>
              <Input value={marketplace?.timezone ?? 'Africa/Blantyre'} readOnly className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Language</label>
              <Input value={marketplace?.language ?? 'en'} readOnly className="mt-2" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input value={marketplace?.description ?? ''} readOnly className="mt-2" />
          </div>
        </CardContent>
      </Card>

      {/* Payments overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" />Payments & Revenue</CardTitle>
          <CardDescription>Real performance metrics from successful transactions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard
              title="Total revenue"
              value={payments?.totalRevenue}
              description="MWK"
              hideBackground
            />
            <StatCard
              title="Transactions"
              value={payments?.totalTransactions}
              description="Successful payments"
              hideBackground
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Enabled gateways</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {payments?.enabledGateways.map((gateway) => (
                  <Badge key={gateway} variant="secondary">{gateway}</Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Commission rate</label>
                <Input value={`${payments?.commissionRate ?? 0}%`} readOnly className="mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium">Minimum order</label>
                <Input value={`MWK ${(payments?.minimumOrderAmount ?? 0).toLocaleString()}`} readOnly className="mt-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" />Notifications</CardTitle>
          <CardDescription>Toggle which teams receive alerts.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {notifications && (
            <>
              <ToggleRow label="Email notifications" enabled={notifications.emailNotifications} />
              <ToggleRow label="SMS notifications" enabled={notifications.smsNotifications} />
              <ToggleRow label="Order alerts" enabled={notifications.orderNotifications} />
              <ToggleRow label="Seller alerts" enabled={notifications.sellerNotifications} />
              <ToggleRow label="Buyer alerts" enabled={notifications.buyerNotifications} />
              <ToggleRow label="Admin alerts" enabled={notifications.adminNotifications} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Security & approvals */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" />Security</CardTitle>
            <CardDescription>Account-level protection controls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {security && (
              <>
                <ToggleRow label="Two-factor authentication" enabled={security.enableTwoFactor} />
                <ToggleRow label="Captcha on login" enabled={security.enableCaptcha} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Password length</label>
                    <Input value={security.passwordMinLength} readOnly className="mt-2" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Session timeout (hrs)"</label>
                    <Input value={security.sessionTimeout} readOnly className="mt-2" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Max login attempts</label>
                  <Input value={security.maxLoginAttempts} readOnly className="mt-2" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto-approvals</CardTitle>
            <CardDescription>Current moderation workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {autoApproval && (
              <>
                <ToggleRow label="Auto approve sellers" enabled={autoApproval.autoApproveSellers} />
                <ToggleRow label="Auto approve products" enabled={autoApproval.autoApproveProducts} />
                <ToggleRow label="Require seller verification" enabled={autoApproval.requireSellerVerification} />
                <ToggleRow label="Product moderation" enabled={autoApproval.enableProductModeration} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Snapshot of the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <StatCard title="Orders (30d)" value={activity?.recentOrders} description="Submitted" hideBackground />
          <StatCard title="New sellers" value={activity?.recentSellers} description="Joined (30d)" hideBackground />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Last synced</p>
            <p className="text-lg font-semibold">
              {activity?.lastUpdated ? new Date(activity.lastUpdated).toLocaleString() : '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading && !data && (
        <div className="text-sm text-muted-foreground">Loading settings...</div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  hideBackground
}: {
  title: string
  value: number | undefined
  description: string
  hideBackground?: boolean
}) {
  return (
    <Card className={hideBackground ? '' : 'bg-gradient-to-br from-white to-gray-50'}>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value !== undefined ? value.toLocaleString() : '—'}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function ToggleRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between border rounded-lg px-3 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{enabled ? 'Enabled' : 'Disabled'}</p>
      </div>
      <Switch checked={enabled} disabled />
    </div>
  )
}
