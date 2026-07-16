'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  ShoppingCart, 
  Share2, 
  Package,
  Store,
  User,
  ArrowLeft
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

interface Product {
  id: string
  name: string
  price: number
  discountPrice: number | null
  images: string[]
  slug: string
  stock: number
  seller: {
    id: string
    businessName: string
  }
}

interface WishlistItem {
  id: string
  addedAt: string
  product: Product
}

interface SharedWishlist {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  itemCount: number
  owner: {
    name: string
    email: string
  }
  items: WishlistItem[]
}

export default function SharedWishlistPage() {
  const params = useParams()
  const token = params.token as string
  
  const [wishlist, setWishlist] = useState<SharedWishlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      fetchSharedWishlist()
    }
  }, [token])

  const fetchSharedWishlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/buyer/wishlists/share/${token}`)
      
      if (response.ok) {
        const data = await response.json()
        setWishlist(data.wishlist)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load wishlist')
      }
    } catch (error) {
      console.error('Error fetching shared wishlist:', error)
      setError('Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId: string) => {
    try {
      const response = await fetch('/api/buyer/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1
        }),
      })

      if (response.ok) {
        // Show success message (you might want to add a toast notification here)
        alert('Product added to cart!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add to cart')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center p-8">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-bold mb-2">Wishlist Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/shop">
              <Button style={{ backgroundColor: colors.primary }}>
                Browse Products
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  if (!wishlist) {
    return null
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/shop" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>

        {/* Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-8 h-8" style={{ color: colors.primary }} />
                  <h1 className="text-3xl font-bold">{wishlist.name}</h1>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Share2 className="w-3 h-3" />
                    Shared
                  </Badge>
                </div>
                
                {wishlist.description && (
                  <p className="text-gray-600 mb-4 text-lg">{wishlist.description}</p>
                )}
                
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Created by {wishlist.owner.name}</span>
                  </div>
                  <span>{wishlist.itemCount} items</span>
                  <span>Created {new Date(wishlist.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-2">Share this wishlist</div>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    alert('Link copied to clipboard!')
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Grid */}
        {wishlist.items.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2">No items in this wishlist</h3>
              <p className="text-gray-600 mb-6">
                This wishlist doesn't have any items yet.
              </p>
              <Link href="/shop">
                <Button style={{ backgroundColor: colors.primary }}>
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.items.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {/* Product Image */}
                  <div className="relative mb-3">
                    <Link href={`/shop/products/${item.product.slug}`}>
                      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        {item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </Link>
                    {item.product.discountPrice && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {Math.round(((item.product.price - item.product.discountPrice) / item.product.price) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <Link 
                      href={`/shop/products/${item.product.slug}`}
                      className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2 block"
                    >
                      {item.product.name}
                    </Link>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Store className="w-3 h-3" />
                      {item.product.seller.businessName}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        {item.product.discountPrice ? (
                          <>
                            <span className="text-lg font-bold text-blue-600">
                              MWK {item.product.discountPrice.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-500 line-through ml-2">
                              MWK {item.product.price.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            MWK {item.product.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {item.product.stock > 0 ? (
                          <span className="text-green-600">In Stock</span>
                        ) : (
                          <span className="text-red-600">Out of Stock</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => addToCart(item.product.id)}
                        disabled={item.product.stock <= 0}
                        className="flex-1"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Link href={`/shop/products/${item.product.slug}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
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
