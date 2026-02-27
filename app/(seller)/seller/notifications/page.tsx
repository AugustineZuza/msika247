'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  DollarSign,
  User
} from 'lucide-react'

// Malawi-inspired color palette
const colors = {
  primary: '#006B3F',      // Deep Green
  accent: '#CE1126',       // Warm Red
  highlight: '#FCD116',    // Golden Yellow
  background: '#FAFAFA',   // Soft Off-White
  white: '#FFFFFF',
  darkGreen: '#004d2e',    // Darker green for accents
  lightGreen: '#e8f5e8'    // Very light green
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  data?: any
  isRead: boolean
  createdAt: string
}

export default function SellerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const url = filter === 'unread' ? '/api/seller/notifications?unread=true' : '/api/seller/notifications'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/seller/notifications', {
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
        return <Package className="w-5 h-5" style={{ color: colors.primary }} />
      case 'PAYMENT':
        return <CreditCard className="w-5 h-5" style={{ color: colors.primary }} />
      case 'SUBSCRIPTION':
        return <RefreshCw className="w-5 h-5" style={{ color: colors.highlight }} />
      case 'PAYOUT':
        return <TrendingUp className="w-5 h-5" style={{ color: colors.accent }} />
      case 'SELLER':
        return <User className="w-5 h-5" style={{ color: colors.primary }} />
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

  const getNotificationLink = (notification: Notification) => {
    if (notification.type === 'ORDER' && notification.data?.orderId) {
      return `/seller/orders/${notification.data.orderId}`
    }
    if (notification.type === 'PAYOUT' && notification.data?.payoutRequestId) {
      return `/seller/wallet`
    }
    if (notification.type === 'SUBSCRIPTION') {
      return '/seller/subscription'
    }
    return '#'
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'read') return n.isRead
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
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

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'unread', 'read'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterType)}
            >
              {filterType === 'all' && 'All Notifications'}
              {filterType === 'unread' && 'Unread'}
              {filterType === 'read' && 'Read'}
            </Button>
          ))}
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
              {filter === 'unread' ? (
                <>
                  <BellRing className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No unread notifications</h2>
                  <p className="text-muted-foreground mb-6">
                    You're all caught up! Check back later for new notifications.
                  </p>
                </>
              ) : (
                <>
                  <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    {filter === 'read' ? 'No read notifications' : 'No notifications yet'}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {filter === 'read' 
                      ? "You haven't read any notifications yet."
                      : "You'll see notifications here when you have orders, payments, or other updates."
                    }
                  </p>
                </>
              )}
              <Link href="/seller">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`hover:shadow-md transition-shadow ${!notification.isRead ? 'border-green-200 bg-green-50/50' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      !notification.isRead ? 'bg-green-100' : 'bg-muted'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${!notification.isRead ? 'text-green-600' : ''}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                        
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
                          
                          {getNotificationLink(notification) !== '#' && (
                            <Link href={getNotificationLink(notification)}>
                              <Button size="sm">
                                View
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
