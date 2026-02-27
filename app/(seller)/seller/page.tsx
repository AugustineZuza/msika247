'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Plus, 
  Settings, 
  Wallet, 
  MessageCircle, 
  TrendingUp,
  ArrowUpRight,
  Star,
  CheckCircle,
  Crown,
  CreditCard
} from 'lucide-react'

// Malawi Market Branding Colors
const colors = {
  primary: '#006B3F',        // Malawi Green
  secondary: '#6b7280',      // Gray-500
  accent: '#006B3F',         // Malawi Green (was blue)
  success: '#10b981',        // Emerald-500
  warning: '#f59e0b',        // Amber-500
  gold: '#eab308',           // Yellow-500
  light: '#f9fafb',         // Gray-50
  white: '#ffffff',          // White
  border: '#e5e7eb',        // Gray-200
  text: '#111827',          // Gray-900
  textSecondary: '#6b7280',   // Gray-500
  muted: '#9ca3af',         // Gray-400
}

interface SellerStats {
  seller: { id: string; businessName: string; isActive: boolean }
  subscription: { status: string; plan: { name: string }; endDate: string } | null
  products: { total: number; active: number }
  orders: { total: number; paid: number }
  earnings: { total: number }
  performance: {
    conversionRate: number
    avgOrderValue: number
    rating: number
    responseTime: string
  }
  recentActivity: Array<{
    type: string
    title: string
    description: string
    timestamp: Date
  }>
}

export default function SellerDashboard() {
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setError(null)
      const response = await fetch('/api/seller/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError('Failed to load data')
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.light }}>
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg p-4 border" style={{ borderColor: colors.border }}>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                    <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.light }}>
        <Card className="w-96 border" style={{ borderColor: colors.border }}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>Connection Error</h3>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>{error}</p>
            <Button onClick={fetchStats} style={{ backgroundColor: colors.accent, color: colors.white }}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.light }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500 mx-auto mb-3"></div>
          <p style={{ color: colors.textSecondary }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.light }}>
      {/* Simple Header */}
      <div className="bg-white border-b" style={{ borderColor: colors.border }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: colors.text }}>
                {stats.seller.businessName}
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Dashboard Overview
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/seller/products/new">
                <Button style={{ backgroundColor: colors.accent, color: colors.white }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Products */}
          <Card className="border" style={{ borderColor: colors.border }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-600">Products</span>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold" style={{ color: colors.text }}>
                  {stats.products.total}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: colors.textSecondary }}>
                    {stats.products.active} active
                  </span>
                  <span className="text-xs font-medium" style={{ color: colors.success }}>
                    {Math.round((stats.products.active / stats.products.total) * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders */}
          <Card className="border" style={{ borderColor: colors.border }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-600">Orders</span>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold" style={{ color: colors.text }}>
                  {stats.orders.total}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: colors.textSecondary }}>
                    {stats.orders.paid} paid
                  </span>
                  <span className="text-xs font-medium" style={{ color: colors.success }}>
                    {Math.round((stats.orders.paid / stats.orders.total) * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card className="border" style={{ borderColor: colors.border }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-600">Revenue</span>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold" style={{ color: colors.text }}>
                  MWK {stats.earnings.total.toLocaleString()}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: colors.textSecondary }}>This month</span>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                    <span className="text-xs font-medium text-green-600">+12%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className={`border ${
            stats.subscription?.status === 'ACTIVE' ? 'border-emerald-200' : ''
          }`} style={{ borderColor: colors.border }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  {stats.subscription?.status === 'ACTIVE' ? (
                    <Crown className="w-5 h-5 text-amber-600" />
                  ) : (
                    <CreditCard className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  stats.subscription?.status === 'ACTIVE' ? 'text-amber-600' : 'text-gray-600'
                }`}>
                  {stats.subscription?.status === 'ACTIVE' ? 'Premium' : 'Free'}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="text-lg font-semibold" style={{ color: colors.text }}>
                  {stats.subscription?.plan?.name || 'Basic Plan'}
                </div>
                
                {stats.subscription?.status !== 'ACTIVE' && (
                  <Link href="/seller/subscription">
                    <Button size="sm" className="w-full" style={{ backgroundColor: colors.accent, color: colors.white }}>
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Link href="/seller/products">
            <Card className="border hover:shadow-sm transition-shadow" style={{ borderColor: colors.border }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: colors.text }}>Products</div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>Manage inventory</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/seller/orders">
            <Card className="border hover:shadow-sm transition-shadow" style={{ borderColor: colors.border }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: colors.text }}>Orders</div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>View orders</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/seller/messages">
            <Card className="border hover:shadow-sm transition-shadow" style={{ borderColor: colors.border }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: colors.text }}>Messages</div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>Customer chat</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/seller/wallet">
            <Card className="border hover:shadow-sm transition-shadow" style={{ borderColor: colors.border }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: colors.text }}>Earnings</div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>View revenue</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Key Metrics */}
          <Card className="border" style={{ borderColor: colors.border }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium" style={{ color: colors.text }}>
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-green-600">{stats.performance.conversionRate}%</div>
                  <div className="text-xs text-gray-600">Conversion</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-green-600">MWK {stats.performance.avgOrderValue.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Avg Order</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-amber-600">{stats.performance.rating}</div>
                  <div className="text-xs text-gray-600">Rating</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-green-600">{stats.performance.responseTime}</div>
                  <div className="text-xs text-gray-600">Response</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border" style={{ borderColor: colors.border }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium" style={{ color: colors.text }}>
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'order' ? 'bg-green-500' : 
                        activity.type === 'review' ? 'bg-amber-500' : 
                        'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: colors.text }}>{activity.title}</p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{activity.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm" style={{ color: colors.textSecondary }}>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
