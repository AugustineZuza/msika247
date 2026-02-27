'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, TrendingUp, Sparkles, ArrowRight, MapPin } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  discountPrice: number | null
  images: string[]
  category: { name: string }
  seller: { 
    businessName: string
    id: string
    verificationStatus?: string
    district?: string
  }
  averageRating?: number
  reviewCount?: number
  stock: number
}

interface FeaturedProductsProps {
  title?: string
  subtitle?: string
  limit?: number
}

export default function FeaturedProducts({ 
  title = "Featured Products", 
  subtitle = "Handpicked items our customers love",
  limit = 8 
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`/api/products?featured=true&limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to fetch featured products:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDiscountPercentage = (price: number, discountPrice: number) => {
    return Math.round(((price - discountPrice) / price) * 100)
  }

  if (loading) {
    return (
      <div className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-full bg-white border-0 shadow-sm overflow-hidden animate-pulse">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200"></div>
              <CardContent className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!products.length) {
    return null
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {products.map((product, index) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="group h-full bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Product Image */}
                <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-4xl text-gray-300">📦</div>
                    </div>
                  )}
                  
                  {/* Featured Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 text-xs font-bold px-3 py-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Featured
                    </Badge>
                  </div>

                  {/* Discount Badge */}
                  {product.discountPrice && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-red-600 text-white border-0 text-xs font-bold px-2 py-1">
                        {getDiscountPercentage(product.price, product.discountPrice)}% OFF
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <CardContent className="p-5 space-y-4">
                  {/* Seller & Location */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          product.seller.verificationStatus === 'VERIFIED' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <Link 
                          href={`/sellers/${product.seller.id}`}
                          className="text-sm text-gray-600 font-medium hover:text-green-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {product.seller.businessName}
                        </Link>
                        {product.seller.verificationStatus === 'VERIFIED' && (
                          <span className="text-xs text-green-600">✓</span>
                        )}
                      </div>
                    </div>
                    {product.seller.district && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        <MapPin className="w-3 h-3" />
                        <span>{product.seller.district}</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors text-lg">
                    {product.name}
                  </h3>

                  {/* Category */}
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200 w-fit">
                    {product.category.name}
                  </Badge>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    {product.averageRating ? (
                      <>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(product.averageRating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                          {product.averageRating.toFixed(1)} ({product.reviewCount})
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">No reviews</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">MWK {product.price.toFixed(2)}</span>
                      {product.discountPrice && (
                        <span className="text-lg text-gray-500 line-through">
                          MWK {product.discountPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm">
                      {product.stock > 0 ? (
                        <span className="text-green-600 font-medium flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {product.stock} in stock
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Out of stock
                        </span>
                      )}
                    </span>
                    
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={product.stock === 0}
                    >
                      {product.stock > 0 ? 'View Details' : 'Out of Stock'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            <Link href="/shop">
              View All Products
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
