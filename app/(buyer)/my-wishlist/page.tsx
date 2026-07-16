'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  MapPin, 
  Shield,
  Search,
  Grid,
  List,
  Trash2,
  Share2,
  AlertCircle
} from 'lucide-react'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { toast } from '@/components/ui/use-toast'

// Malawi-inspired color palette
const colors = {
  primary: '#006B3F',
  accent: '#CE1126',
  highlight: '#FCD116',
  background: '#FAFAFA',
  white: '#FFFFFF',
  darkGreen: '#004d2e',
  lightGreen: '#e8f5e8'
}

interface WishlistItem {
  id: string
  productId: string
  addedAt: string
  product: {
    id: string
    name: string
    price: number
    discountPrice?: number
    images: string
    slug: string
    stock: number
    isActive: boolean
    seller: {
      id: string
      businessName: string
      city?: string
      verificationStatus: string
    }
    category: string
    averageRating: number
    reviewCount: number
    createdAt: string
  }
}

export default function MyWishlistPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Add error boundary
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Wishlist page error:', event.error)
      setError(`Error: ${event.error?.message || 'Unknown error'}`)
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  useEffect(() => {
    if (session) {
      fetchWishlist()
    }
  }, [session, sortBy])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/wishlist`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error)
      toast({
        title: "Error",
        description: "Failed to load wishlist",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (productId: string, itemId: string) => {
    try {
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setItems(prev => prev.filter(item => item.productId !== productId))
        setTotal(prev => prev - 1)
        toast({
          title: "Success",
          description: "Product removed from wishlist"
        })
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
      toast({
        title: "Error",
        description: "Failed to remove product",
        variant: "destructive"
      })
    }
  }

  const addToCart = async (product: any) => {
    try {
      // TODO: Implement cart functionality
      toast({
        title: "Added to Cart",
        description: `${product.name} added to your cart`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive"
      })
    }
  }

  const shareWishlist = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Wishlist - Msika247',
          text: `Check out my wishlist with ${total} items on Msika247!`,
          url: window.location.href
        })
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link Copied",
          description: "Wishlist link copied to clipboard"
        })
      }
    } catch (error) {
      console.error('Failed to share wishlist:', error)
    }
  }

  const selectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(item => item.id))
    }
  }

  const removeSelected = async () => {
    try {
      const promises = selectedItems.map(itemId => {
        const item = items.find(i => i.id === itemId)
        return item ? removeFromWishlist(item.productId, itemId) : Promise.resolve()
      })
      
      await Promise.all(promises)
      setSelectedItems([])
    } catch (error) {
      console.error('Failed to remove selected items:', error)
    }
  }

  const filteredItems = items.filter(item =>
    item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.seller.businessName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const ProductCard = ({ item }: { item: WishlistItem }) => {
    const product = item.product
    const discount = product.discountPrice 
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0

    return (
      <Card className="group hover:shadow-lg transition-shadow duration-300">
        <div className="relative">
          <Link href={`/products/${product.slug}`}>
            <OptimizedImage
              src={JSON.parse(product.images)[0] || '/placeholder-product.jpg'}
              alt={product.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
          
          {discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500">
              -{discount}%
            </Badge>
          )}
          
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/80 hover:bg-white"
              onClick={() => removeFromWishlist(product.id, item.id)}
            >
              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
            </Button>
            
            <Checkbox
              checked={selectedItems.includes(item.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedItems(prev => [...prev, item.id])
                } else {
                  setSelectedItems(prev => prev.filter(id => id !== item.id))
                }
              }}
            />
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <Link href={`/products/${product.slug}`}>
                <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </Link>
              
              <div className="flex items-center gap-1 mt-1">
                {renderStars(product.averageRating)}
                <span className="text-xs text-gray-500">
                  ({product.reviewCount})
                </span>
              </div>
            </div>
            
            {product.seller.verificationStatus === 'VERIFIED' && (
              <Shield className="w-4 h-4 text-blue-500" title="Verified Seller" />
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{product.seller.city}</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div>
              {product.discountPrice ? (
                <>
                  <span className="text-lg font-bold text-primary">
                    MWK {product.discountPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500 line-through ml-2">
                    MWK {product.price.toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-primary">
                  MWK {product.price.toLocaleString()}
                </span>
              )}
            </div>
            
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">
              by {product.seller.businessName}
            </span>
            
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => addToCart(product)}
              >
                <ShoppingCart className="w-3 h-3" />
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                View
              </Button>
            </div>
          </div>

          {!product.isActive && (
            <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Product no longer available
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to view and manage your wishlist
          </p>
          <Link href="/login">
            <Button className="w-full">
              Sign In
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-red-800">
              <strong>Error:</strong> {error}
            </p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-600 underline text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500" />
                My Wishlist
              </h1>
              <p className="text-gray-600 mt-1">
                {total} {total === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedItems.length > 0 && (
                <>
                  <span className="text-sm text-gray-500">
                    {selectedItems.length} selected
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={removeSelected}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove Selected
                  </Button>
                </>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={shareWishlist}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search wishlist items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {items.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={selectAll}
              >
                {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No items found' : 'Your wishlist is empty'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start adding items to your wishlist to see them here'
              }
            </p>
            <div className="flex gap-2 justify-center">
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
              <Link href="/shop">
                <Button>
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {filteredItems.map(item => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
            
            {/* Load More */}
            {filteredItems.length < total && (
              <div className="text-center mt-8">
                <Button variant="outline">
                  Load More Items
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
