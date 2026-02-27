'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import Link from 'next/link'
import { BarChart3, Users, ShoppingBag, CreditCard, TrendingUp, Settings } from 'lucide-react'

interface Stats {
  revenue: { total: number; thisMonth: number }
  sellers: { total: number; active: number; inactive: number }
  subscriptions: { active: number }
  orders: { total: number; paid: number }
  users: { total: number; buyers: number; sellers: number }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (!stats) {
    return <div className="p-8">Failed to load statistics</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Platform Dashboard</h1>
          <p className="text-lg text-muted-foreground">Monitor marketplace activity and manage all operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-0 bg-gradient-to-br from-green-50 to-green-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-bold text-foreground">MWK {stats?.revenue?.total?.toLocaleString() || '0'}</div>
              <p className="text-xs text-green-600 font-medium">+MWK {stats?.revenue?.thisMonth?.toLocaleString() || '0'} this month</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sellers</CardTitle>
                <Users className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-bold text-foreground">{stats?.sellers?.active || 0}</div>
              <p className="text-xs text-blue-600 font-medium">Active out of {stats?.sellers?.total || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Subscriptions</CardTitle>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-bold text-foreground">{stats?.subscriptions?.active || 0}</div>
              <p className="text-xs text-purple-600 font-medium">Active plans</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-bold text-foreground">{stats?.orders?.total || 0}</div>
              <p className="text-xs text-orange-600 font-medium">{stats?.orders?.paid || 0} completed</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-red-50 to-red-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
                <Users className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-bold text-foreground">{stats?.users?.total || 0}</div>
              <p className="text-xs text-red-600 font-medium">{stats?.users?.buyers || 0} buyers</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Section */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-3 pb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Manage Sellers</CardTitle>
                <CardDescription>Review, activate, and manage all marketplace sellers</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/admin/sellers" className="block">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  View All Sellers
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-3 pb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Subscription Plans</CardTitle>
                <CardDescription>Create, edit, and manage seller subscription tiers</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/admin/subscription-plans" className="block">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Edit Plans
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-3 pb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Analytics</CardTitle>
                <CardDescription>View detailed marketplace insights and reports</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/admin/analytics" className="block">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
