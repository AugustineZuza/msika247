'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Header } from '@/components/header'
import { useSession } from 'next-auth/react'
import { 
  ShoppingCart, 
  Truck, 
  Shield, 
  Package,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

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

// Add shimmer animation
const shimmerStyle = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`

interface CartItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    price: number
    discountPrice: number | null
    images: string[]
    seller: {
      id: string
      businessName: string
    }
  }
}

interface CartData {
  items: CartItem[]
  total: number
}

interface ShippingAddress {
  fullName: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
}

function CheckoutPageComponent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [cartData, setCartData] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: session?.user?.name || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Malawi'
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/shop/checkout')
      return
    }

    if (status === 'authenticated') {
      fetchCart()
    }
  }, [status, router])

  const fetchCart = async () => {
    try {
      setError('')
      const response = await fetch('/api/buyer/cart')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load cart')
      }

      const data = await response.json()
      setCartData(data)
    } catch (err) {
      console.error('Cart fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    if (!cartData) return { subtotal: 0, tax: 0, shipping: 0, total: 0 }
    
    const subtotal = cartData.total
    const tax = subtotal * 0.16 // 16% VAT
    const shipping = subtotal > 0 ? 5000 : 0 // Fixed shipping
    const total = subtotal + tax + shipping
    
    return { subtotal, tax, shipping, total }
  }

  const validateForm = () => {
    if (!shippingAddress.fullName.trim()) {
      setError('Please enter your full name')
      return false
    }
    if (!shippingAddress.phone.trim()) {
      setError('Please enter your phone number')
      return false
    }
    if (!shippingAddress.address.trim()) {
      setError('Please enter your address')
      return false
    }
    if (!shippingAddress.city.trim()) {
      setError('Please enter your city')
      return false
    }
    return true
  }

  const handleCheckout = async () => {
    if (!validateForm()) return
    if (!cartData || cartData.items.length === 0) {
      setError('Your cart is empty')
      return
    }

    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      const totals = calculateTotals()
      
      const requestData = {
        cartItems: cartData.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        shippingAddress,
        shippingAmount: totals.shipping
      }
      
      console.log('Sending checkout request:', JSON.stringify(requestData, null, 2))
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Checkout API error response:', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || 'Failed to process checkout' }
        }
        
        console.error('Parsed error data:', errorData)
        throw new Error(errorData.error || 'Failed to process checkout')
      }

      const data = await response.json()
      
      if (data.checkoutUrl) {
        setSuccess('Redirecting to payment...')
        setTimeout(() => {
          window.location.href = data.checkoutUrl
        }, 1000)
      } else {
        throw new Error('No payment URL received')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setProcessing(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <>
        <style jsx>{shimmerStyle}</style>
        <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
          <Header />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-shimmer">
              <div className="h-8 rounded w-64 mb-8" style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})` }}></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-64 rounded-lg" style={{ background: `linear-gradient(135deg, ${colors.lightGreen}, ${colors.background})` }}></div>
                  <div className="h-96 rounded-lg" style={{ background: `linear-gradient(135deg, ${colors.lightGreen}, ${colors.background})` }}></div>
                </div>
                <div className="space-y-6">
                  <div className="h-64 rounded-lg" style={{ background: `linear-gradient(135deg, ${colors.lightGreen}, ${colors.background})` }}></div>
                  <div className="h-48 rounded-lg" style={{ background: `linear-gradient(135deg, ${colors.lightGreen}, ${colors.background})` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error && !cartData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Cart</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={fetchCart}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4" style={{ color: colors.primary }} />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Cart is Empty</h2>
              <p className="text-gray-600 mb-6">
                Add some products to your cart before proceeding to checkout.
              </p>
              <Link href="/shop">
                <Button className="text-white" style={{ backgroundColor: colors.primary }}>
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totals = calculateTotals()

  return (
    <>
      <style jsx>{shimmerStyle}</style>
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 mb-8">
            <Link href="/cart" className="flex items-center transition-colors" style={{ color: colors.primary }}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Cart
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">Checkout</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    Shipping Information
                  </CardTitle>
                  <CardDescription>
                    Enter your shipping address for delivery
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={shippingAddress.fullName}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+265 999 123 456"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Main Street"
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Lilongwe"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                        placeholder="0000"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Order Items
                  </CardTitle>
                  <CardDescription>
                    Review your order before payment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cartData.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          {item.product.images && item.product.images.length > 0 ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                          <p className="text-sm text-gray-500">{item.product.seller.businessName}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            MWK {(item.product.discountPrice || item.product.price).toLocaleString()}
                          </p>
                          {item.product.discountPrice && (
                            <p className="text-sm text-gray-500 line-through">
                              MWK {item.product.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({cartData.items.length} items)</span>
                      <span>MWK {totals.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (16%)</span>
                      <span>MWK {totals.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>MWK {totals.shipping.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>MWK {totals.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span>Fast Delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="h-4 w-4 text-purple-600" />
                      <span>Quality Products</span>
                    </div>
                  </div>

                  {/* Error/Success Messages */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-800 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-800 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        {success}
                      </div>
                    </div>
                  )}

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    By completing this purchase, you agree to our Terms of Service and Privacy Policy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <CheckoutPageComponent />
    </Suspense>
  )
}
