'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Search, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

interface SubscriptionStats {
  totalPlans: number
  activeSubscriptions: number
  totalRevenue: number
  expiringSoon: number
}

interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  monthlyPrice: number
  yearlyPrice?: number | null
  maxProducts?: number | null
  features?: string | string[] | null
  _count?: {
    subscriptions: number
  }
}

interface ActiveSubscription {
  id: string
  status: string
  startDate: string
  endDate: string | null
  autoRenew: boolean
  plan: {
    name: string
    monthlyPrice: number
  }
  seller: {
    businessName: string
    user: {
      name: string
      email: string
    }
  }
}

interface SubscriptionsResponse {
  stats: SubscriptionStats
  plans: SubscriptionPlan[]
  subscriptions: ActiveSubscription[]
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    maximumFractionDigits: 0,
  }).format(value)

const parseFeatures = (features?: string | string[] | null): string[] => {
  if (!features) return []
  if (Array.isArray(features)) return features

  try {
    const parsed = JSON.parse(features)
    if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string')
  } catch (_error) {
    return features.split(',').map((item) => item.trim()).filter(Boolean)
  }

  return []
}

export default function AdminSubscriptionsPage() {
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/admin/subscriptions')

        if (!response.ok) {
          throw new Error('Failed to fetch subscriptions')
        }

        const data = (await response.json()) as SubscriptionsResponse
        setStats(data.stats)
        setPlans(data.plans)
        setSubscriptions(data.subscriptions)
      } catch (err) {
        console.error(err)
        setError('Unable to load subscriptions right now. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptions()
  }, [])

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription) => {
      const matchesSearch = `${subscription.seller.businessName} ${subscription.seller.user.name} ${subscription.seller.user.email}`
        .toLowerCase()
        .includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ? true : subscription.status === statusFilter.toUpperCase()

      return matchesSearch && matchesStatus
    })
  }, [subscriptions, search, statusFilter])

  const expiringSoon = useMemo(() => {
    const today = new Date()
    const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    return subscriptions.filter((subscription) => {
      if (!subscription.endDate) return false
      const endDate = new Date(subscription.endDate)
      return endDate >= today && endDate <= twoWeeksFromNow
    })
  }, [subscriptions])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-red-700">{error}</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600">Monitor seller plans, revenue, and subscription health.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.activeSubscriptions ?? 0}</div>
            <p className="text-xs text-gray-500">Sellers currently on paid plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalPlans ?? 0}</div>
            <p className="text-xs text-gray-500">Available subscription tiers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Subscription Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue ?? 0)}</div>
            <p className="text-xs text-gray-500">Lifetime recurring revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.expiringSoon ?? expiringSoon.length}</div>
            <p className="text-xs text-gray-500">Need attention in 14 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Subscription Plans</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{plan.name}</p>
                    <p className="text-sm text-gray-500">{plan.description || 'No description set'}</p>
                  </div>
                  <Badge variant="secondary" className="text-gray-700">
                    {plan._count?.subscriptions ?? 0} active
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(plan.monthlyPrice)}<span className="text-sm text-gray-500">/mo</span>
                  </p>
                  {plan.yearlyPrice && (
                    <p className="text-sm text-gray-500">{formatCurrency(plan.yearlyPrice)} yearly</p>
                  )}
                </div>
                {plan.maxProducts && (
                  <p className="text-sm text-gray-500">Up to {plan.maxProducts} products</p>
                )}
                <Separator />
                <ul className="space-y-2 text-sm text-gray-600">
                  {parseFeatures(plan.features).length === 0 ? (
                    <li className="text-gray-400">No features listed</li>
                  ) : (
                    parseFeatures(plan.features).map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {expiringSoon.length === 0 ? (
              <p className="text-sm text-gray-500">No subscriptions expiring in the next 14 days.</p>
            ) : (
              expiringSoon.map((subscription) => (
                <div key={subscription.id} className="rounded-lg border border-yellow-100 bg-yellow-50 p-3">
                  <p className="text-sm font-medium text-gray-900">{subscription.seller.businessName}</p>
                  <p className="text-xs text-gray-500">Plan: {subscription.plan.name}</p>
                  <p className="text-xs text-gray-500">
                    Expires on {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Active Subscriptions</CardTitle>
              <p className="text-sm text-gray-500">Search and monitor seller subscription details.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search sellers..."
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filteredSubscriptions.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">No subscriptions match your filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auto Renew</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{subscription.seller.businessName}</p>
                        <p className="text-sm text-gray-500">{subscription.seller.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{subscription.plan.name}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(subscription.plan.monthlyPrice)}/mo</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-800">{subscription.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {subscription.autoRenew ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm text-gray-600">
                          {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-900">
                        {new Date(subscription.startDate).toLocaleDateString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-900">
                        {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : '—'}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
