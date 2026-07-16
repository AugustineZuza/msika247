'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Heart, 
  ShoppingCart, 
  TrendingDown,
  Eye,
  Plus,
  ArrowRight
} from 'lucide-react'
import { getWishlistStats, getPriceDropAlerts, type WishlistStats } from '@/lib/wishlist'

interface WishlistWidgetProps {
  className?: string
}

export function WishlistWidget({ className }: WishlistWidgetProps) {
  const [stats, setStats] = useState<WishlistStats | null>(null)
  const [priceDrops, setPriceDrops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWishlistData()
  }, [])

  const loadWishlistData = async () => {
    try {
      setLoading(true)
      const [wishlistStats, priceDropAlerts] = await Promise.all([
        getWishlistStats(),
        getPriceDropAlerts()
      ])
      
      setStats(wishlistStats)
      setPriceDrops(priceDropAlerts)
    } catch (error) {
      console.error('Failed to load wishlist data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Heart className="w-4 h-4" />
            My Wishlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.totalItems === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Heart className="w-4 h-4" />
            My Wishlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-3">Your wishlist is empty</p>
            <Link href="/shop">
              <Button size="sm" variant="outline" className="w-full">
                <Plus className="w-3 h-3 mr-1" />
                Browse Products
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            My Wishlist
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {stats.totalItems} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Value</span>
            <span className="font-medium">
              MWK {stats.totalValue.toLocaleString()}
            </span>
          </div>
          
          {stats.categories.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Categories</span>
              <span className="font-medium">{stats.categories.length}</span>
            </div>
          )}
          
          {stats.recentlyAdded > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Recently Added</span>
              <Badge variant="outline" className="text-xs">
                +{stats.recentlyAdded}
              </Badge>
            </div>
          )}
        </div>

        {/* Price Drops */}
        {priceDrops.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <TrendingDown className="w-4 h-4" />
              Price Drops ({priceDrops.length})
            </div>
            <div className="space-y-1">
              {priceDrops.slice(0, 2).map((item) => {
                const discount = Math.round(
                  ((item.product.price - item.product.discountPrice) / item.product.price) * 100
                )
                return (
                  <div key={item.id} className="text-xs space-y-1">
                    <p className="font-medium truncate">{item.product.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium">
                        MWK {item.product.discountPrice.toLocaleString()}
                      </span>
                      <span className="text-gray-500 line-through text-xs">
                        MWK {item.product.price.toLocaleString()}
                      </span>
                      <Badge className="text-xs bg-green-100 text-green-800">
                        -{discount}%
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Out of Stock Alert */}
        {stats.outOfStock > 0 && (
          <div className="p-2 bg-orange-50 rounded text-xs">
            <p className="text-orange-600 font-medium">
              {stats.outOfStock} {stats.outOfStock === 1 ? 'item' : 'items'} out of stock
            </p>
          </div>
        )}

        {/* Category Breakdown */}
        {stats.categories.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Categories</p>
            <div className="flex flex-wrap gap-1">
              {stats.categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
              {stats.categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{stats.categories.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <Link href="/my-wishlist">
            <Button size="sm" variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Eye className="w-3 h-3" />
                View Wishlist
              </span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
          
          {stats.totalItems > 0 && (
            <Button size="sm" className="w-full">
              <ShoppingCart className="w-3 h-3 mr-2" />
              Add All to Cart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
