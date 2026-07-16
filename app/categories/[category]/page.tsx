'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
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
  X,
  Heart,
  Grid,
  List,
  ChevronDown,
  Shield
} from 'lucide-react'
import React from 'react'

// Malawi-inspired color palette
const colors = {
  primary: '#006B3F',      // Deep Green
  accent: '#CE1126',       // Warm Red
  highlight: '#FCD116',    // Golden Yellow
  background: '#FAFAFA',   // Soft Off-White
  white: '#FFFFFF',
  darkGreen: '#004d2e',    // Darker green for footer
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
  rating?: number
  reviewCount?: number
  isActive?: boolean
  slug: string
}

// Mock data - in production, this would come from your API
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Traditional Chitenje Fabric',
    price: 15000,
    discountPrice: null,
    description: 'Authentic Malawian fabric perfect for traditional attire',
    stock: 25,
    images: ['/api/placeholder/1.jpg'],
    category: { id: '1', name: 'Fashion & Textiles' },
    seller: { 
      id: 's1', 
      businessName: 'Lilongwe Fabrics',
      verificationStatus: 'VERIFIED',
      district: 'Lilongwe'
    },
    rating: 4.5,
    reviewCount: 128,
    isActive: true,
    slug: 'traditional-chitenje-fabric'
  },
  {
    id: '2',
    name: 'Handcrafted Wood Carving',
    price: 25000,
    discountPrice: 22000,
    description: 'Beautiful hand-carved wooden sculpture by local artisans',
    stock: 8,
    images: ['/api/placeholder/2.jpg'],
    category: { id: '2', name: 'Arts & Crafts' },
    seller: { 
      id: 's2', 
      businessName: 'Malawi Crafts',
      verificationStatus: 'VERIFIED',
      district: 'Blantyre'
    },
    rating: 4.8,
    reviewCount: 89,
    isActive: true,
    slug: 'handcrafted-wood-carving'
  },
  {
    id: '3',
    name: 'Fresh Nsima Package',
    price: 8500,
    discountPrice: null,
    description: 'Traditional Malawian food package with all essentials',
    stock: 50,
    images: ['/api/placeholder/3.jpg'],
    category: { id: '3', name: 'Food & Produce' },
    seller: { 
      id: 's3', 
      businessName: 'Taste of Malawi',
      verificationStatus: 'VERIFIED',
      district: 'Mzuzu'
    },
    rating: 4.2,
    reviewCount: 156,
    isActive: true,
    slug: 'fresh-nsima-package'
  },
  {
    id: '4',
    name: 'Agricultural Tools Set',
    price: 18000,
    discountPrice: null,
    description: 'Complete set of farming tools for small scale farmers',
    stock: 15,
    images: ['/api/placeholder/4.jpg'],
    category: { id: '4', name: 'Agriculture' },
    seller: { 
      id: 's4', 
      businessName: 'Farm Supply Malawi',
      verificationStatus: 'VERIFIED',
      district: 'Zomba'
    },
    rating: 4.6,
    reviewCount: 203,
    isActive: true,
    slug: 'agricultural-tools-set'
  },
  {
    id: '5',
    name: 'Mobile Phone Accessories',
    price: 5500,
    discountPrice: 4500,
    description: 'Quality phone accessories including cases, chargers, and more',
    stock: 100,
    images: ['/api/placeholder/5.jpg'],
    category: { id: '5', name: 'Electronics' },
    seller: { 
      id: 's5', 
      businessName: 'Tech Hub Malawi',
      verificationStatus: 'VERIFIED',
      district: 'Lilongwe'
    },
    rating: 4.0,
    reviewCount: 312,
    isActive: true,
    slug: 'mobile-phone-accessories'
  },
  {
    id: '6',
    name: 'Educational Books Collection',
    price: 12000,
    discountPrice: null,
    description: 'Collection of educational books for students and professionals',
    stock: 30,
    images: ['/api/placeholder/6.jpg'],
    category: { id: '6', name: 'Books & Education' },
    seller: { 
      id: 's6', 
      businessName: 'Knowledge Books',
      verificationStatus: 'VERIFIED',
      district: 'Blantyre'
    },
    rating: 4.7,
    reviewCount: 94,
    isActive: true,
    slug: 'educational-books-collection'
  }
]

function CategoryProductsPage({ params }: { params: { category: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { addToCart } = useCart()
  
  // Unwrap params for Next.js 16
  const resolvedParams = React.use(params) as { category: string }
  const category = resolvedParams.category
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Format category name for display
  const categoryName = category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')

  useEffect(() => {
    // Simulate API call to fetch products for this category
    const fetchCategoryProducts = async () => {
      setLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Filter products by category
      const categoryProducts = mockProducts.filter(product => 
        product.category.name.toLowerCase().includes(category.toLowerCase().replace('-', ' '))
      )
      
      setProducts(categoryProducts)
      setLoading(false)
    }

    fetchCategoryProducts()
  }, [category])

  const filteredProducts = products.filter(product => 
    product.isActive !== false && 
    product.stock > 0 &&
    product.price >= priceRange.min &&
    product.price <= priceRange.max
  )

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'newest':
      default:
        return 0 // Keep original order
    }
  })

  const formatPrice = (price: number) => {
    return `MWK ${price.toLocaleString()}`
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400' : 'fill-gray-300'}`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Loading {categoryName} products...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Category Header - Tambala Market Style */}
      <section className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
              >
                <ArrowRight className="w-3 h-3 rotate-180" />
                <span>Back to All Categories</span>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                <h1 className="text-lg font-semibold text-gray-900">{categoryName}</h1>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {sortedProducts.length} products found
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Controls Bar */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-3 h-3" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1.5 pr-6 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  style={{ borderColor: colors.primary + '30' }}
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
                <ChevronDown className="absolute right-2 top-2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>

              {/* Price Range */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                  className="w-20 px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  style={{ borderColor: colors.primary + '30' }}
                />
                <span className="text-gray-500 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  className="w-20 px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  style={{ borderColor: colors.primary + '30' }}
                />
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              onClick={() => {
                setPriceRange({ min: 0, max: 100000 })
                setSortBy('newest')
              }}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-md text-xs font-medium"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </section>

      {/* Products Section - Tambala Market Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sortedProducts.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3' : 'space-y-4'}>
            {sortedProducts.map((product) => (
              <div key={product.id} className={viewMode === 'grid' ? 'group bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200' : 'flex bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow'}>
                {viewMode === 'grid' ? (
                  // Grid View - Tambala Market Style
                  <>
                    <div className="relative">
                      <Link href={`/shop/products/${product.slug}`}>
                        <div className="aspect-square bg-gray-50 overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        </div>
                      </Link>
                      
                      {/* Discount Badge */}
                      {product.discountPrice && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-red-500 text-white text-xs font-semibold">
                            -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                          </Badge>
                        </div>
                      )}
                      
                      {/* Wishlist Button */}
                      <button
                        onClick={() => {
                          if (!session) {
                            router.push('/auth/login')
                            return
                          }
                          // Add to wishlist logic here
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
                      >
                        <Heart className="w-3 h-3 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>

                    <div className="p-3">
                      {/* Product Name */}
                      <Link href={`/shop/products/${product.slug}`}>
                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2 mb-2 leading-tight">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {product.discountPrice ? (
                            <>
                              <span className="text-sm font-bold text-green-600">
                                MWK {product.discountPrice.toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-400 line-through">
                                MWK {product.price.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-gray-900">
                              MWK {product.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      {product.rating && (
                        <div className="flex items-center gap-1 mb-2">
                          <div className="flex">
                            {renderStars(product.rating)}
                          </div>
                          <span className="text-xs text-gray-500">
                            ({product.reviewCount})
                          </span>
                        </div>
                      )}

                      {/* Seller Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{product.seller.district}</span>
                        </div>
                        {product.seller.verificationStatus === 'VERIFIED' && (
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Verified</span>
                          </div>
                        )}
                      </div>

                      {/* Stock and Add to Cart */}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${product.stock > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                          {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}
                        </span>
                        
                        <Button
                          onClick={() => {
                            if (!session) {
                              router.push('/auth/login')
                              return
                            }
                            addToCart(product.id, 1)
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  // List View
                  <>
                    <div className="w-32 h-32 flex-shrink-0">
                      <Link href={`/shop/products/${product.slug}`}>
                        <div className="w-full h-full bg-gray-50 rounded-l-lg overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        </div>
                      </Link>
                    </div>

                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Product Name */}
                          <Link href={`/shop/products/${product.slug}`}>
                            <h3 className="text-sm font-medium text-gray-900 hover:text-green-600 transition-colors mb-2 leading-tight">
                              {product.name}
                            </h3>
                          </Link>

                          {/* Rating */}
                          {product.rating && (
                            <div className="flex items-center gap-1 mb-2">
                              <div className="flex">
                                {renderStars(product.rating)}
                              </div>
                              <span className="text-xs text-gray-500">
                                ({product.reviewCount})
                              </span>
                            </div>
                          )}

                          {/* Seller Info */}
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <MapPin className="w-3 h-3" />
                            <span>{product.seller.district}</span>
                            {product.seller.verificationStatus === 'VERIFIED' && (
                              <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3 text-green-600" />
                                <span className="text-green-600 font-medium">Verified</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          {/* Discount Badge */}
                          {product.discountPrice && (
                            <div className="mb-2">
                              <Badge className="bg-red-500 text-white text-xs font-semibold">
                                -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                              </Badge>
                            </div>
                          )}
                          
                          {/* Price */}
                          <div className="mb-2">
                            {product.discountPrice ? (
                              <>
                                <div className="text-sm font-bold text-green-600">
                                  MWK {product.discountPrice.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-400 line-through">
                                  MWK {product.price.toLocaleString()}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm font-bold text-gray-900">
                                MWK {product.price.toLocaleString()}
                              </div>
                            )}
                          </div>

                          {/* Stock and Add to Cart */}
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${product.stock > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                              {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}
                            </span>
                            
                            <Button
                              onClick={() => {
                                if (!session) {
                                  router.push('/auth/login')
                                  return
                                }
                                addToCart(product.id, 1)
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                            >
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* No Products Found */
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No products found in {categoryName}
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                We couldn't find any products in this category.<br />
                Try browsing other categories or adjusting your filters.
              </p>
              
              <div className="space-y-4">
                <Link href="/">
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
                    Browse All Categories
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => router.push('/shop')}
                  className="border-green-600 text-green-600 hover:bg-green-50 px-6 py-3 rounded-lg font-semibold"
                >
                  View All Products
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CategoryPage(props: any) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </div>
    }>
      <CategoryProductsPage {...props} />
    </Suspense>
  )
}
