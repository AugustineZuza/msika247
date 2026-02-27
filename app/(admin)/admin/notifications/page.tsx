'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Header } from '@/components/header'
import { 
  Bell, 
  Package, 
  CreditCard, 
  RefreshCw, 
  Check,
  BellRing,
  TrendingUp,
  Settings,
  User,
  Search,
  Filter
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  data?: any
  isRead: boolean
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })

  useEffect(() => {
    fetchNotifications()
  }, [filter, typeFilter, searchQuery, pagination.page])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filter === 'unread' && { unread: 'true' }),
        ...(typeFilter !== 'all' && { type: typeFilter })
      })

      const response = await fetch(`/api/admin/notifications?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds,
          markAsRead: true
        }),
      })

      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }

  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length > 0) {
      markAsRead(unreadIds)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <Package className="w-5 h-5 text-blue-600" />
      case 'PAYMENT':
        return <CreditCard className="w-5 h-5 text-green-600" />
      case 'SUBSCRIPTION':
        return <RefreshCw className="w-5 h-5 text-purple-600" />
      case 'PAYOUT':
        return <TrendingUp className="w-5 h-5 text-orange-600" />
      case 'SELLER':
        return <User className="w-5 h-5 text-indigo-600" />
      case 'ADMIN':
        return <Settings className="w-5 h-5 text-red-600" />
      case 'SYSTEM':
        return <Bell className="w-5 h-5 text-gray-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'SELLER':
        return 'bg-blue-100 text-blue-800'
      case 'BUYER':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'read') return n.isRead
    return true
  }).filter(n => {
    if (typeFilter !== 'all') return n.type === typeFilter
    return true
  }).filter(n => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return n.title.toLowerCase().includes(query) || 
             n.message.toLowerCase().includes(query) ||
             n.user.name.toLowerCase().includes(query) ||
             n.user.email.toLowerCase().includes(query)
    }
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="secondary">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <Check className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
            )}
            <Button variant="outline" onClick={fetchNotifications}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            {(['all', 'unread', 'read'] as const).map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterType)}
              >
                {filterType === 'all' && 'All'}
                {filterType === 'unread' && 'Unread'}
                {filterType === 'read' && 'Read'}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ORDER">Orders</SelectItem>
                <SelectItem value="PAYMENT">Payments</SelectItem>
                <SelectItem value="SUBSCRIPTION">Subscriptions</SelectItem>
                <SelectItem value="PAYOUT">Payouts</SelectItem>
                <SelectItem value="SELLER">Sellers</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="pt-16 pb-16 text-center">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No notifications found</h2>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'Try adjusting your search or filters.' : 'No notifications match your current filters.'}
              </p>
              <Button variant="outline" onClick={() => { setFilter('all'); setTypeFilter('all'); setSearchQuery('') }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`hover:shadow-md transition-shadow ${!notification.isRead ? 'border-blue-200 bg-blue-50/50' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        !notification.isRead ? 'bg-blue-100' : 'bg-muted'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold ${!notification.isRead ? 'text-blue-600' : ''}`}>
                                {notification.title}
                              </h3>
                              <Badge className={getRoleColor(notification.user.role)}>
                                {notification.user.role}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {notification.user.name} ({notification.user.email})
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {getTimeAgo(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsRead([notification.id])}
                            >
                              Mark as read
                            </Button>
                          )}
                          
                          {notification.user.role === 'SELLER' && (
                            <Link href={`/admin/sellers/${notification.user.id}`}>
                              <Button size="sm" variant="outline">
                                View Seller
                              </Button>
                            </Link>
                          )}
                          
                          {notification.type === 'ORDER' && notification.data?.orderId && (
                            <Link href={`/admin/orders/${notification.data.orderId}`}>
                              <Button size="sm" variant="outline">
                                View Order
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
