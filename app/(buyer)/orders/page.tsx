'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Package, Truck, CheckCircle, Clock } from 'lucide-react'

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  total: number
  productSnapshot: {
    name: string
    images?: string
    slug: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  currency: string
  subtotal: number
  taxAmount: number
  shippingAmount: number
  totalAmount: number
  createdAt: string
  trackingNumber?: string
  items: OrderItem[]
  seller: {
    businessName: string
  }
}

const statusConfig = {
  PENDING: { color: 'secondary', icon: Clock, label: 'Pending' },
  PAID: { color: 'default', icon: CheckCircle, label: 'Paid' },
  PROCESSING: { color: 'default', icon: Package, label: 'Processing' },
  SHIPPED: { color: 'secondary', icon: Truck, label: 'Shipped' },
  DELIVERED: { color: 'default', icon: CheckCircle, label: 'Delivered' },
  CANCELLED: { color: 'destructive', icon: Clock, label: 'Cancelled' },
  REFUNDED: { color: 'secondary', icon: Clock, label: 'Refunded' }
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      return
    }

    if (status === 'authenticated') {
      fetchOrders()
    }
  }, [status])

  async function fetchOrders() {
    try {
      setError(null)
      const response = await fetch('/api/orders')
      
      if (!response.ok) {
        throw new Error('Failed to load orders')
      }

      const data = await response.json()
      setOrders(data.orders || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading orders...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Please Login</CardTitle>
            <CardDescription>
              You need to be logged in to view your orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchOrders}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-8">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Link href="/shop">
              <Button>Browse Products</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        <div className="space-y-6">
          {orders.map((order) => {
            const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.PENDING
            const StatusIcon = config.icon

            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                      <CardDescription>
                        Placed on {new Date(order.createdAt).toLocaleDateString()} • {order.seller.businessName}
                      </CardDescription>
                    </div>
                    <Badge variant={config.color as any} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                          {item.productSnapshot.images && (
                            <img
                              src={
                                typeof item.productSnapshot.images === 'string'
                                  ? JSON.parse(item.productSnapshot.images)[0]
                                  : item.productSnapshot.images[0]
                              }
                              alt={item.productSnapshot.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.productSnapshot.name}</h4>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity} × MWK {item.price.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-medium">
                          MWK {item.total.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Order Summary */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>MWK {order.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>MWK {order.taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>MWK {order.shippingAmount.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>MWK {order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {order.trackingNumber && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Truck className="h-4 w-4" />
                        <span className="font-medium">Tracking Number:</span>
                        <span>{order.trackingNumber}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {order.status === 'DELIVERED' && (
                      <Link href={`/orders/${order.id}/review`}>
                        <Button size="sm">Leave Review</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
