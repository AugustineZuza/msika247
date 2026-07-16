'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingDown, 
  Package, 
  CheckCircle, 
  XCircle,
  Bell,
  RefreshCw,
  Eye
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

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

interface WishlistNotification {
  id: string
  type: 'PRICE_DROP' | 'OUT_OF_STOCK' | 'BACK_IN_STOCK'
  title: string
  message: string
  productId: string
  productName: string
  oldPrice?: number
  newPrice?: number
  currentStock?: number
  wishlistItemId: string
  createdAt: string
}

export default function WishlistNotificationsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<WishlistNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'price-drop' | 'stock'>('all')

  useEffect(() => {
    if (session?.user) {
      fetchNotifications()
    }
  }, [session, filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/buyer/wishlists/notifications')
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PRICE_DROP':
        return <TrendingDown className="w-5 h-5 text-green-600" />
      case 'OUT_OF_STOCK':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'BACK_IN_STOCK':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'PRICE_DROP':
        return 'border-green-200 bg-green-50'
      case 'OUT_OF_STOCK':
        return 'border-red-200 bg-red-50'
      case 'BACK_IN_STOCK':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
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

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'price-drop') return n.type === 'PRICE_DROP'
    if (filter === 'stock') return n.type === 'OUT_OF_STOCK' || n.type === 'BACK_IN_STOCK'
    return true
  })

  if (!session?.user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Please Login</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to view your wishlist notifications.</p>
            <Link href="/login">
              <Button style={{ backgroundColor: colors.primary }}>Login</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Wishlist Alerts</h1>
            <Badge variant="secondary">
              {filteredNotifications.length} alerts
            </Badge>
          </div>
          <Button variant="outline" onClick={fetchNotifications}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'price-drop', label: 'Price Drops' },
            { id: 'stock', label: 'Stock Updates' }
          ].map((filterType) => (
            <Button
              key={filterType.id}
              variant={filter === filterType.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterType.id as any)}
            >
              {filterType.label}
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
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {filter === 'all' ? 'No notifications yet' : 
                 filter === 'price-drop' ? 'No price drop alerts' : 'No stock updates'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {filter === 'all' 
                  ? "You'll see price drops and stock updates for your wishlist items here."
                  : filter === 'price-drop'
                  ? "Items in your wishlist will show here when their prices drop."
                  : "Items in your wishlist will show here when they go in or out of stock."
                }
              </p>
              <Link href="/my-wishlist">
                <Button style={{ backgroundColor: colors.primary }}>
                  Manage Wishlist
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`hover:shadow-md transition-shadow ${getNotificationColor(notification.type)}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          {/* Additional details based on type */}
                          {notification.type === 'PRICE_DROP' && notification.oldPrice && notification.newPrice && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500 line-through">
                                MWK {notification.oldPrice.toLocaleString()}
                              </span>
                              <span className="text-green-600 font-semibold">
                                MWK {notification.newPrice.toLocaleString()}
                              </span>
                              <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded">
                                Save MWK {(notification.oldPrice - notification.newPrice).toLocaleString()}
                              </span>
                            </div>
                          )}
                          
                          {notification.type === 'BACK_IN_STOCK' && notification.currentStock && (
                            <div className="text-sm text-blue-600">
                              {notification.currentStock} items available
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                        
                        <div className="flex gap-2">
                          <Link href={`/shop/products/${notification.productId}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              View Product
                            </Button>
                          </Link>
                          {notification.type === 'PRICE_DROP' && (
                            <Link href={`/shop/products/${notification.productId}`}>
                              <Button size="sm" style={{ backgroundColor: colors.primary }}>
                                Buy Now
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
