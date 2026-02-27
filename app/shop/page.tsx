'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/header'
import { useCart } from '@/hooks/useCart'
import { useSession } from 'next-auth/react'
import { 
  Star, 
  ShoppingCart, 
  Filter, 
  Search,
  SlidersHorizontal,
  Package,
  ArrowRight,
  MapPin,
  Loader2,
  X
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
  description: string
  stock: number
  images: string[]
  category: { id: string; name: string }
  seller: { 
    id: string; 
    businessName: string
    verificationStatus?: string
    district?: string
  }
  courierAvailable?: boolean
  courierPrice?: number | null
  averageRating?: number
  reviewCount?: number
  soldCount?: number
  isActive?: boolean
  createdAt?: string
}

interface Category {
  id: string
  name: string
  slug?: string
  description?: string
  _count?: { products: number }
}

function ShopPageComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToCart } = useCart()
  const { data: session } = useSession()
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, selectedCategory, sortBy, priceRange])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      params.append('sort', sortBy)
      
      if (priceRange.min > 0 || priceRange.max < 1000000) {
        if (priceRange.max >= 1000000) {
          params.append('priceRange', `${priceRange.min}+`)
        } else {
          params.append('priceRange', `${priceRange.min}-${priceRange.max}`)
        }
      }

      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const formattedCategories = data.categories.map((cat: any) => ({
          ...cat,
          _count: { products: cat.productCount }
        }))
        setCategories(formattedCategories)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleAddToCart = async (productId: string) => {
    if (!session?.user) {
      router.push('/login')
      return
    }

    try {
      await addToCart(productId, 1)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  const getDiscountPercentage = (price: number, discountPrice: number) => {
    return Math.round(((price - discountPrice) / price) * 100)
  }

  const formatPrice = (price: number) => {
    return `MWK ${price.toLocaleString()}`
  }

  const filteredProducts = products.filter(product => 
    product.isActive !== false && 
    product.stock > 0
  )

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <Header />
        <div className="max-w-9xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-8">
            {/* Loading Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3">
                <div className="w-4 h-4 rounded-full animate-bounce" style={{ backgroundColor: colors.primary }}></div>
                <h2 className="text-2xl font-bold text-gray-900" style={{ color: colors.primary }}>
                  Loading Malawi's Best Products
                </h2>
                <div className="w-4 h-4 rounded-full animate-bounce" style={{ backgroundColor: colors.accent, animationDelay: '0.2s' }}></div>
              </div>
            </div>
            
            {/* Loading Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="aspect-square bg-gray-200 relative">
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-gray-200 animate-shimmer"></div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded w-8"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Loading Tips */}
            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full" style={{ backgroundColor: colors.lightGreen }}>
                <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: colors.primary }}></div>
                <span style={{ color: colors.primary }} className="font-medium">Discovering the best products from Malawi...</span>
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
      
      <div className="max-w-9xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-6 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300" style={{ backgroundColor: colors.primary }}>
                <span className="text-white font-bold text-2xl">🇲🇼</span>
              </div>
              <div>
                <h1 className="text-6xl font-black text-gray-900 mb-3" style={{ color: colors.primary }}>
                  Malawi Marketplace
                </h1>
                <p className="text-gray-600 text-xl font-medium">Discover quality products from trusted local sellers</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Serving Lilongwe, Blantyre, Mzuzu and beyond</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for products, brands, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border-2 rounded-2xl focus:ring-4 shadow-lg transition-all duration-300 focus:ring-primary/20"
                style={{ borderColor: colors.primary + '30' }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-10">
          {/* Mobile Filters Button */}
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full rounded-2xl font-semibold shadow-md transition-all duration-300"
              style={{ backgroundColor: colors.lightGreen, borderColor: colors.primary, color: colors.primary }}
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters
            </Button>
          </div>
          
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-white rounded-2xl p-8 shadow-xl border" style={{ borderColor: colors.primary + '20' }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }}></span>
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 border-2 rounded-xl focus:ring-4 shadow-md transition-all duration-300 text-gray-900 focus:ring-primary/20"
                    style={{ borderColor: colors.primary + '30' }}
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}>
                        {category.name} ({category._count?.products || 0})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }}></span>
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-3 border-2 rounded-xl focus:ring-4 shadow-md transition-all duration-300 text-gray-900 focus:ring-accent/20"
                    style={{ borderColor: colors.accent + '30' }}
                  >
                    <option value="newest">🆕 Newest First</option>
                    <option value="oldest">📅 Oldest First</option>
                    <option value="price-low">💰 Price: Low to High</option>
                    <option value="price-high">💎 Price: High to Low</option>
                    <option value="rating">⭐ Highest Rated</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.highlight }}></span>
                    Price Range (MWK)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                      className="w-full p-3 border-2 rounded-xl focus:ring-4 shadow-md transition-all duration-300 text-gray-900 focus:ring-highlight/20"
                      style={{ borderColor: colors.highlight + '30' }}
                    />
                    <span className="text-gray-500 font-bold">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                      className="w-full p-3 border-2 rounded-xl focus:ring-4 shadow-md transition-all duration-300 text-gray-900 focus:ring-highlight/20"
                      style={{ borderColor: colors.highlight + '30' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: colors.primary }}></div>
            <p className="text-lg font-semibold text-gray-700">
              <span className="text-2xl font-black" style={{ color: colors.primary }}>{products.length}</span>
              <span className="text-gray-600"> quality products found</span>
            </p>
          </div>
          {products.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Showing</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }}></div>
                <span className="text-sm font-semibold" style={{ color: colors.primary }}>Best Matches</span>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid/List */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4">
                  <div className="relative">
                    <img 
                      src={product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop'}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    {product.discountPrice && (
                      <Badge 
                        className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold"
                        style={{ backgroundColor: colors.highlight, color: colors.primary }}
                      >
                        SALE
                      </Badge>
                    )}
                    <Badge 
                      className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold bg-green-600 text-white"
                    >
                      ✓ Verified
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="space-y-2 mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <Link 
                          href={`/sellers/${product.seller.id}`}
                          className="text-sm text-gray-600 hover:text-green-600 transition-colors"
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
                        <span>{product.seller.district}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {(product.averageRating || 0) > 0 ? `${product.averageRating} (${product.reviewCount || 0})` : 'New Product'}
                    </span>
                  </div>

                  <div className="mb-3">
                    {product.discountPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(product.discountPrice)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/shop/products/${product.id}`} className="flex-1">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="w-full border-gray-300 hover:border-green-600"
                      >
                        View
                      </Button>
                    </Link>
                    <Button 
                      size="sm"
                      className="text-white hover:opacity-90"
                      style={{ backgroundColor: colors.accent }}
                      onClick={() => handleAddToCart(product.id)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="max-w-2xl mx-auto">
              {/* Empty State Illustration */}
              <div className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 relative" style={{ backgroundColor: colors.lightGreen }}>
                <div className="absolute inset-0 rounded-full animate-pulse" style={{ backgroundColor: colors.primary + '20' }}></div>
                <Package className="w-16 h-16 text-gray-400 relative z-10" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center animate-bounce" style={{ backgroundColor: colors.highlight }}>
                  <span className="text-white font-bold text-sm">!</span>
                </div>
              </div>
              
              {/* Empty State Content */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border" style={{ borderColor: colors.primary + '20' }}>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                  <span className="text-4xl">🔍</span>
                  No Products Found
                </h3>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                  We couldn't find any products matching your criteria.<br />
                  Try adjusting your search terms or filters to discover amazing items from Malawi.
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('')
                      setPriceRange({ min: 0, max: 1000000 })
                    }}
                    className="text-white font-bold py-4 px-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <span className="flex items-center gap-2">
                      <span>🔄</span>
                      Clear All Filters
                    </span>
                  </Button>
                  <Button
                    onClick={() => setShowFilters(true)}
                    variant="outline"
                    className="font-semibold py-4 px-8 rounded-2xl transition-all duration-300"
                    style={{ borderColor: colors.primary + '30', color: colors.primary }}
                  >
                    <span className="flex items-center gap-2">
                      <span>⚙️</span>
                      Advanced Search
                    </span>
                  </Button>
                </div>
                
                {/* Helpful Tips */}
                <div className="mt-8 p-6 rounded-2xl border" style={{ backgroundColor: colors.lightGreen, borderColor: colors.primary + '30' }}>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    Shopping Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span style={{ color: colors.primary }} className="mt-1">•</span>
                      <span>Try broader search terms like "phone" instead of specific model numbers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: colors.primary }} className="mt-1">•</span>
                      <span>Check different categories to discover similar products</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: colors.primary }} className="mt-1">•</span>
                      <span>Adjust price range to include more options</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{ borderColor: colors.primary }}></div>
      </div>
    }>
      <ShopPageComponent />
    </Suspense>
  )
}
