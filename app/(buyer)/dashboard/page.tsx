'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import Logo from '@/components/logo'
import { 
  ShoppingCart, 
  Package, 
  MessageCircle, 
  Heart, 
  Settings, 
  User,
  Clock,
  CheckCircle,
  Truck,
  CreditCard,
  TrendingUp,
  Star,
  Bell,
  Search,
  Filter,
  ChevronRight,
  ShoppingBag,
  DollarSign
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

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  items: {
    product: {
      id: string
      name: string
      images: string[]
      price: number
    }
    quantity: number
  }[]
}

interface Chat {
  id: string
  sellerName: string
  sellerImage?: string
  lastMessage: string
  unreadCount: number
  isOnline: boolean
  updatedAt: string
}

export default function BuyerDashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  const [orders, setOrders] = useState<Order[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Mock data - replace with actual API calls
      const mockOrders: Order[] = [
        {
          id: 'order-1',
          status: 'delivered',
          total: 25000,
          createdAt: new Date().toISOString(),
          items: [
            {
              product: {
                id: 'prod-1',
                name: 'Premium Wireless Headphones',
                images: ['/api/placeholder/300/300'],
                price: 25000
              },
              quantity: 1
            }
          ]
        }
      ]

      const mockChats: Chat[] = [
        {
          id: 'chat-1',
          sellerName: 'TechStore Pro',
          sellerImage: '/api/placeholder/40/40',
          lastMessage: 'Yes, we can offer a 10% discount for bulk orders',
          unreadCount: 2,
          isOnline: true,
          updatedAt: new Date().toISOString()
        }
      ]

      setOrders(mockOrders)
      setChats(mockChats)
    } catch (error) {
      console.error('Dashboard data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'processing': return 'bg-blue-100 text-blue-700'
      case 'shipped': return 'bg-orange-100 text-orange-700'
      case 'pending': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Clock className="w-4 h-4" />
      case 'shipped': return <Truck className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Logo size="md" />
              
              <div className="hidden md:flex items-center gap-6">
                <Link href="/shop" className="font-medium text-sm transition-colors" style={{ color: colors.primary }}>
                  Shop
                </Link>
                <Link href="/buyer/dashboard" className="font-medium text-sm" style={{ color: colors.primary }}>
                  Dashboard
                </Link>
                <Link href="/buyer/orders" className="font-medium text-sm transition-colors" style={{ color: colors.primary }}>
                  Orders
                </Link>
                <Link href="/buyer/messages" className="font-medium text-sm transition-colors" style={{ color: colors.primary }}>
                  Messages
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F97316] text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </Button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">{session?.user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Manage your orders, chat with sellers, and discover amazing products.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-[#2563EB]" />
                </div>
                <span className="text-2xl font-bold text-gray-900">12</span>
              </div>
              <p className="text-sm text-gray-600">Total Orders</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg rounded-2xl hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/buyer/messages" className="block">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-[#F97316]" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">8</span>
                </div>
                <p className="text-sm text-gray-600">Active Chats</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="bg-white border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-[#22C55E]" />
                </div>
                <span className="text-2xl font-bold text-gray-900">24</span>
              </div>
              <p className="text-sm text-gray-600">Wishlist Items</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">MWK 45K</span>
              </div>
              <p className="text-sm text-gray-600">Total Spent</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders & Active Chats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <Card className="bg-white border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                <Link href="/buyer/orders">
                  <Button variant="ghost" size="sm" className="text-[#2563EB] hover:text-[#2563EB]">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        <img 
                          src={order.items[0]?.product?.images[0] || '/api/placeholder/64/64'} 
                          alt={order.items[0]?.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{order.items[0]?.product?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status}</span>
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">MWK {order.total.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{order.items.length} items</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Chats */}
          <Card className="bg-white border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Active Chats</h2>
                <Link href="/buyer/messages">
                  <Button variant="ghost" size="sm" className="text-[#2563EB] hover:text-[#2563EB]">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4">
                {chats.map((chat) => (
                  <div key={chat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                          <img 
                            src={chat.sellerImage || '/api/placeholder/48/48'} 
                            alt={chat.sellerName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {chat.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{chat.sellerName}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(chat.updatedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      </div>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="w-6 h-6 bg-[#F97316] text-white text-xs rounded-full flex items-center justify-center">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/shop">
              <Button className="w-full h-16 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white rounded-xl font-medium transition-colors">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Browse Shop
              </Button>
            </Link>
            <Link href="/buyer/wishlist">
              <Button variant="outline" className="w-full h-16 border-2 border-gray-300 hover:border-[#2563EB] text-gray-700 hover:text-[#2563EB] rounded-xl font-medium transition-colors">
                <Heart className="w-5 h-5 mr-2" />
                Wishlist
              </Button>
            </Link>
            <Link href="/buyer/messages">
              <Button variant="outline" className="w-full h-16 border-2 border-gray-300 hover:border-[#F97316] text-gray-700 hover:text-[#F97316] rounded-xl font-medium transition-colors">
                <MessageCircle className="w-5 h-5 mr-2" />
                Messages
              </Button>
            </Link>
            <Link href="/buyer/settings">
              <Button variant="outline" className="w-full h-16 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-xl font-medium transition-colors">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
