'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from '@/components/ui/use-toast'
import { 
  Loader2, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard
} from 'lucide-react'

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
  shippingAddress?: string
  notes?: string
  items: OrderItem[]
  seller: {
    businessName: string
    businessEmail?: string
    businessPhone?: string
  }
  buyer: {
    user: {
      name: string
      email: string
    }
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

export default function OrderDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  const orderId = params.id as string
  const isSuccess = searchParams?.get('success') === 'true'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && orderId) {
      fetchOrder()
    }
  }, [status, orderId, router])

  async function fetchOrder() {
    try {
      setError(null)
      const response = await fetch(`/api/orders/${orderId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Order not found')
        } else {
          throw new Error('Failed to load order')
        }
        return
      }

      const data = await response.json()
      setOrder(data.order)
    } catch (err) {
      console.error(err)
      setError('Failed to load order details')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleManualVerify() {
    if (!order) return
    
    setVerifying(true)
    try {
      const response = await fetch('/api/checkout/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Payment verified:', data)
        await fetchOrder() // Refresh order data
        
        toast({
          title: "Payment Verified",
          description: "Your payment has been confirmed and order updated.",
        })
      }
    } catch (error) {
      console.error('Manual verification failed:', error)
      toast({
        title: "Verification Failed",
        description: "Failed to verify payment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setVerifying(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'Order not found'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={fetchOrder}>Try Again</Button>
            <Link href="/orders">
              <Button variant="outline" className="w-full">Back to Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.PENDING
  const StatusIcon = config.icon
  const shippingAddress = order.shippingAddress ? JSON.parse(order.shippingAddress) : null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Alert */}
        {isSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Payment Successful!</AlertTitle>
            <AlertDescription>
              Your order has been confirmed and will be processed soon.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-6">
          <Link href="/orders">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Order Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{order.orderNumber}</CardTitle>
                    <CardDescription>
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={config.color as any} className="flex items-center gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Manual Payment Verification for Pending Orders */}
            {order.status === 'PENDING' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Verification
                  </CardTitle>
                  <CardDescription>
                    If you've completed payment but the status is still pending, verify it manually.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Your order is pending payment confirmation. If you've already paid through PayChangu, 
                      click the button below to verify your payment manually.
                    </p>
                    <Button
                      onClick={handleManualVerify}
                      disabled={verifying}
                      className="w-full"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Verify Payment Manually
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
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
                        <h4 className="font-medium text-lg">{item.productSnapshot.name}</h4>
                        <p className="text-gray-500">
                          Quantity: {item.quantity} × MWK {item.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          MWK {item.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-medium">{shippingAddress.fullName}</p>
                    <p className="text-gray-600">{shippingAddress.address}</p>
                    <p className="text-gray-600">
                      {shippingAddress.city}, {shippingAddress.postalCode}
                    </p>
                    <p className="text-gray-600">{shippingAddress.country}</p>
                    <p className="text-gray-600">{shippingAddress.phone}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{order.seller.businessName}</p>
                  {order.seller.businessEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {order.seller.businessEmail}
                    </div>
                  )}
                  {order.seller.businessPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {order.seller.businessPhone}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
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
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>MWK {order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracking */}
            {order.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Tracking Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-800">{order.trackingNumber}</p>
                    <p className="text-sm text-green-600">
                      Track your package on the courier's website
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {order.status === 'DELIVERED' && (
                <Link href={`/orders/${order.id}/review`}>
                  <Button className="w-full">Leave Review</Button>
                </Link>
              )}
              <Link href="/contact">
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
