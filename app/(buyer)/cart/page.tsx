'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/header'
import { useSession } from 'next-auth/react'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft,
  Truck,
  Shield,
  Store,
  Package,
  CreditCard
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

function CartPageComponent() {
  const router = useRouter()
  const { data: session } = useSession()
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user) {
      router.push('/login')
      return
    }
    fetchCart()
  }, [session])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/buyer/cart')
      if (response.ok) {
        const data = await response.json()
        setCart(data)
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    try {
      setUpdating(itemId)
      const response = await fetch(`/api/buyer/cart/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      })
      
      if (response.ok) {
        await fetchCart() // Refresh cart
      }
    } catch (error) {
      console.error('Failed to update quantity:', error)
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from your cart?')) return
    
    try {
      setUpdating(itemId)
      const response = await fetch(`/api/buyer/cart/${itemId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        await fetchCart() // Refresh cart
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
    } finally {
      setUpdating(null)
    }
  }

  const getDiscountPercentage = (price: number, discountPrice: number) => {
    return Math.round(((price - discountPrice) / price) * 100)
  }

  const getCurrentPrice = (product: any) => {
    return product.discountPrice || product.price
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <Header />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-12 rounded-2xl w-1/3" style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})` }}></div>
            <div className="space-y-6">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="bg-white rounded-3xl shadow-lg p-6">
                  <div className="flex gap-6">
                    <div className="w-24 h-24 rounded-2xl" style={{ background: `linear-gradient(135deg, ${colors.lightGreen}, ${colors.background})` }}></div>
                    <div className="flex-1 space-y-4">
                      <div className="h-4 rounded-2xl w-3/4" style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.darkGreen})` }}></div>
                      <div className="h-4 rounded-2xl w-1/2" style={{ backgroundColor: colors.primary + '30' }}></div>
                      <div className="h-8 rounded-2xl w-1/4" style={{ background: `linear-gradient(to right, ${colors.accent}, ${colors.highlight})` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <Header />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center py-20">
            <div className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 relative" style={{ backgroundColor: colors.lightGreen }}>
              <div className="absolute inset-0 rounded-full animate-pulse" style={{ backgroundColor: colors.primary + '20' }}></div>
              <ShoppingCart className="w-16 h-16 relative z-10" style={{ color: colors.primary }} />
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center animate-bounce" style={{ backgroundColor: colors.highlight }}>
                <span className="text-white font-bold text-sm">0</span>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                <span className="text-4xl">🛒</span>
                Your Cart is Empty
              </h3>
              <p className="text-gray-600 text-lg mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/shop">
                  <Button className="text-white font-bold py-4 px-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300" style={{ backgroundColor: colors.primary }}>
                    <span className="flex items-center gap-2">
                      <span>🛍️</span>
                      Start Shopping
                    </span>
                  </Button>
                </Link>
                <Link href="/buyer/dashboard">
                  <Button variant="outline" className="border-2 font-semibold py-4 px-8 rounded-2xl transition-all duration-300" style={{ borderColor: colors.primary + '30', color: colors.primary }}>
                    <span className="flex items-center gap-2">
                      <span>🏠</span>
                      Dashboard
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <Header />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/shop" className="flex items-center gap-2 transition-colors" style={{ color: colors.primary }}>
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Continue Shopping</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: colors.primary }}>
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-1" style={{ backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Shopping Cart
              </h1>
              <p className="text-gray-600 text-lg">
                {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <Card key={item.id} className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden">
                        {item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                      </div>
                      
                      {/* Discount Badge */}
                      {item.product.discountPrice && (
                        <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                          {getDiscountPercentage(item.product.price, item.product.discountPrice)}% OFF
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                            <Link 
                              href={`/shop/products/${item.product.id}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {item.product.name}
                            </Link>
                          </h3>
                          
                          {/* Seller */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Store className="w-4 h-4" />
                            <span>{item.product.seller.businessName}</span>
                          </div>
                        </div>
                        
                        {/* Remove Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={updating === item.id}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Price and Quantity */}
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="flex items-baseline gap-2">
                            {item.product.discountPrice ? (
                              <>
                                <span className="text-xl font-black text-gray-900">
                                  MWK {getCurrentPrice(item.product).toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                  MWK {item.product.price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-xl font-black text-gray-900">
                                MWK {item.product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            MWK {(getCurrentPrice(item.product) * item.quantity).toFixed(2)} total
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={updating === item.id || item.quantity <= 1}
                            className="w-8 h-8 rounded-lg hover:bg-gray-200"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold text-gray-900">
                            {updating === item.id ? '...' : item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updating === item.id}
                            className="w-8 h-8 rounded-lg hover:bg-gray-200"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal ({cart.items.length} items)</span>
                  <span className="font-semibold text-gray-900">MWK {cart.total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold text-gray-900">MWK 0.00</span>
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-black text-gray-900">Total</span>
                  <span className="text-2xl font-black text-blue-600">MWK {cart.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/shop/checkout">
                  <Button className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
                    <span className="flex items-center justify-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Proceed to Checkout
                    </span>
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button variant="outline" className="w-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold py-4 rounded-2xl transition-all duration-300">
                    <span className="flex items-center justify-center gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      Continue Shopping
                    </span>
                  </Button>
                </Link>
              </div>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Truck className="w-4 h-4 text-green-600" />
                  </div>
                  <span>Free delivery on all orders</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Secure payment processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CartPage() {
  return (
    <>
      <style jsx>{shimmerStyle}</style>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      }>
        <CartPageComponent />
      </Suspense>
    </>
  )
}
