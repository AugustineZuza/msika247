'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSession } from 'next-auth/react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  data?: any
  isRead: boolean
  createdAt: string
}

interface MessageNotification {
  id: string
  title: string
  message: string
  senderName: string
  content: string
  conversationId: string
  createdAt: string
  isRead: boolean
  type: 'MESSAGE'
}

export function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<(Notification | MessageNotification)[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchNotifications()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=5')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.isRead).length || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
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
        return '📦'
      case 'PAYMENT':
        return '💳'
      case 'SUBSCRIPTION':
        return '🔄'
      case 'PAYOUT':
        return '💰'
      case 'MESSAGE':
        return '💬'
      default:
        return '🔔'
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

  if (!session?.user) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-4 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead([notification.id])
                  }
                  // Handle notification click based on type
                  if (notification.type === 'ORDER' && (notification as any).data?.orderId) {
                    window.location.href = `/orders/${(notification as any).data.orderId}`
                  } else if (notification.type === 'PAYOUT' && (notification as any).data?.payoutRequestId) {
                    window.location.href = `/seller/wallet`
                  } else if (notification.type === 'MESSAGE' && (notification as MessageNotification).conversationId) {
                    window.location.href = `/messages?conversationId=${(notification as MessageNotification).conversationId}`
                  }
                }}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="text-lg">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${!notification.isRead ? 'text-blue-600' : ''}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {notification.type === 'MESSAGE' 
                        ? `${(notification as MessageNotification).senderName}: ${(notification as MessageNotification).message}`
                        : notification.message
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            
            {notifications.length >= 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="p-4 justify-center">
                  <Button variant="ghost" size="sm" onClick={() => window.location.href = '/notifications'}>
                    View all notifications
                  </Button>
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
