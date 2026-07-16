'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import BannerCarousel from '@/components/ui/banner-carousel'
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  X, 
  MapPin, 
  Star,
  Shield,
  Truck,
  CheckCircle,
  ChevronDown,
  Smartphone,
  Shirt,
  Home,
  ShoppingCartIcon,
  Sun,
  Car,
  Heart,
  Package,
  CreditCard,
  Users,
  Store,
  Tag,
  ArrowRight,
  Baby,
  Book,
  Dumbbell,
  Wrench
} from 'lucide-react'

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

import { UNIFIED_CATEGORIES } from '@/lib/categories'

const categories = UNIFIED_CATEGORIES

interface Product {
  id: string
  name: string
  price: number
  discountPrice?: number
  images: string
  slug: string
  seller: {
    id: string
    businessName: string
    verificationStatus: string
    city?: string
  }
  category: string
  averageRating: number
  reviewCount: number
  promotion?: {
    id: string
    name: string
    type: string
    value: number
    minOrderAmount: number
    maxDiscountAmount: number
    endDate: string
  } | null
  createdAt: string
}

export default function MalawiMarketplaceLanding() {
  const { data: session } = useSession()
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(3)
  const [products, setProducts] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newProductsLoading, setNewProductsLoading] = useState(true)
  const [promotionsLoading, setPromotionsLoading] = useState(true)
  const [banners, setBanners] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/landing-products?limit=8')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNewProducts = async () => {
    try {
      setNewProductsLoading(true)
      const response = await fetch('/api/landing-products?new=true&limit=8')
      if (response.ok) {
        const data = await response.json()
        setNewProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to fetch new products:', error)
    } finally {
      setNewProductsLoading(false)
    }
  }

  const fetchPromotions = async () => {
    try {
      setPromotionsLoading(true)
      const response = await fetch('/api/promotions')
      if (response.ok) {
        const data = await response.json()
        setPromotions(data)
      }
    } catch (error) {
      console.error('Failed to fetch promotions:', error)
    } finally {
      setPromotionsLoading(false)
    }
  }

  const fetchBanners = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/banners')
      const data = await response.json()
      setBanners(data.banners || [])
    } catch (error) {
      console.error('Failed to fetch banners:', error)
      setBanners([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
    fetchProducts()
    fetchNewProducts()
    fetchPromotions()
  }, [])

  const formatPrice = (price: number) => {
    return `MWK ${price.toLocaleString()}`
  }

  const getProductImage = (images: any) => {
    const testImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop'
    
    if (Array.isArray(images) && images.length > 0) {
      return images[0] || testImage
    }
    
    if (typeof images === 'string') {
      try {
        const imageArray = JSON.parse(images)
        if (Array.isArray(imageArray) && imageArray.length > 0) {
          return imageArray[0] || testImage
        }
      } catch (e) {
        if (images.trim() !== '') {
          return images
        }
      }
    }
    
    return testImage
  }

  const getSellerLocation = (city?: string) => {
    if (city) return city
    const cities = ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Kasungu']
    return cities[Math.floor(Math.random() * cities.length)]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - Tambala Market Style */}
      <nav className="bg-red-600 border-b border-red-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-xl font-bold text-white">Msika247</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/auctions" className="text-white hover:text-red-100 font-medium">
                Auctions
              </Link>
              <Link href="/news" className="text-white hover:text-red-100 font-medium">
                News
              </Link>
              <div className="relative">
                <button
                  className="text-white hover:text-red-100 font-medium flex items-center"
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                >
                  Categories
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {isCategoriesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200">
                    <div className="p-2">
                      {categories.map((category) => (
                        <button
                          key={category.name}
                          className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg w-full text-left"
                        >
                          <category.icon className="h-5 w-5 text-gray-600" />
                          <span className="text-sm">{category.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link href="/sell-with-us" className="text-white hover:text-red-100 font-medium">
                Sell with Us
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search products..."
                    className="w-64 pl-10 pr-4 py-2 bg-white border border-white/30 rounded-lg focus:outline-none focus:border-white text-gray-900 placeholder-gray-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-red-100">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="ghost" className="text-white hover:text-red-100">
                  Register
                </Button>
              </Link>
              
              <Link href="/cart" className="relative">
                <Button variant="ghost" size="icon" className="text-white hover:text-red-100">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
              
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-700 hover:text-green-600"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Category Navigation - Tambala Market Style */}
      <section className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide">
              {categories.slice(1).map((category) => (
                <Link 
                  key={category.name} 
                  href={`/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`} 
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                >
                  <category.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{category.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Banner Carousel - Tambala Market Style */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 md:h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300"></div>
        </div>
      ) : (
        <BannerCarousel 
          autoPlay={true}
          interval={5000}
          showControls={true}
          showIndicators={true}
          banners={banners}
        />
      )}

      {/* New Arrivals Section - Tambala Style */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                New Arrivals
              </h2>
              <p className="text-gray-600">Fresh products uploaded by our sellers</p>
            </div>
            <Link href="/shop?new=true">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                See all
              </Button>
            </Link>
          </div>
          
          {newProductsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : newProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {newProducts.slice(0, 8).map((product) => (
                <div key={product.id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                  {/* Product Image */}
                  <div className="relative">
                    <Link href={`/shop/products/${product.slug}`}>
                      <img 
                        src={getProductImage(product.images)}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    </Link>
                    
                    {/* Badges - Top Right Only */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <Badge className="bg-red-500 text-white text-xs font-semibold px-2 py-1">
                        NEW
                      </Badge>
                      {product.discountPrice && (
                        <Badge className="bg-orange-500 text-white text-xs font-semibold px-2 py-1">
                          -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-3">
                    {/* Product Title */}
                    <Link href={`/shop/products/${product.slug}`}>
                      <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {/* Price */}
                    <div className="mb-2">
                      {product.discountPrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
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
                    
                    {/* Seller Info */}
                    <div className="flex items-center gap-1 mb-2">
                      <Shield className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-gray-600">{product.seller.businessName}</span>
                      {product.seller.verificationStatus === 'VERIFIED' && (
                        <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0.5 ml-1">
                          ✓
                        </Badge>
                      )}
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center gap-1 mb-2">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{getSellerLocation(product.seller.city)}</span>
                    </div>
                    
                    {/* Rating */}
                    {product.averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600">
                          {product.averageRating.toFixed(1)} ({product.reviewCount})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <p className="text-gray-500 text-xl">No new products available at the moment.</p>
              <p className="text-gray-400">Check back soon for fresh arrivals!</p>
            </div>
          )}
        </div>
      </section>

      {/* Shop by Category Section - Exact Tambala Market Style */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Shop by Category
            </h2>
            <p className="text-gray-600">Browse products by your preferred category</p>
          </div>
          
          {/* Categories Side by Side - Exact Tambala Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.slice(1, 7).map((category, index) => {
              const categoryProducts = products.filter(product => 
                product.category.toLowerCase().includes(category.name.toLowerCase().split(' ')[0])
              ).slice(0, 4)
              
              return (
                <div key={category.name} className="border border-gray-200 rounded-lg p-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${category.color.split(' ')[0]}`}>
                        <category.icon className="h-3 w-3" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-xs text-gray-500">Popular items</p>
                      </div>
                    </div>
                    <Link href={`/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 text-xs px-2 py-1">
                        See more
                      </Button>
                    </Link>
                  </div>
                  
                  {/* Products Grid - Exact Tambala Style */}
                  <div className="grid grid-cols-2 gap-2">
                    {categoryProducts.length > 0 ? (
                      categoryProducts.map((product) => (
                        <div key={product.id} className="group">
                          <div className="relative">
                            <Link href={`/shop/products/${product.slug}`}>
                              <img 
                                src={getProductImage(product.images)}
                                alt={product.name}
                                className="w-full h-24 object-cover rounded mb-2 group-hover:opacity-95 transition-opacity"
                              />
                            </Link>
                            
                            {/* Discount Badge - Top Right */}
                            {product.discountPrice && (
                              <div className="absolute top-1 right-1">
                                <Badge className="bg-red-500 text-white text-xs font-semibold px-1 py-0.5">
                                  -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info - Exact Tambala Style */}
                          <div className="space-y-1">
                            <Link href={`/shop/products/${product.slug}`}>
                              <h4 className="text-xs font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                                {product.name}
                              </h4>
                            </Link>
                            
                            {/* Price */}
                            <div className="flex items-center gap-1">
                              {product.discountPrice ? (
                                <>
                                  <span className="text-xs font-bold text-gray-900">
                                    {formatPrice(product.discountPrice)}
                                  </span>
                                  <span className="text-xs text-gray-400 line-through">
                                    {formatPrice(product.price)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs font-bold text-gray-900">
                                  {formatPrice(product.price)}
                                </span>
                              )}
                            </div>
                            
                            {/* Seller Info */}
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <Store className="h-2 w-2 text-gray-600" />
                              </div>
                              <span className="text-xs text-gray-500 truncate max-w-[80px]">{product.seller.businessName}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4">
                        <Package className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">No products</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* View All Categories Button */}
          <div className="text-center mt-8">
            <Link href="/categories">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                View All Categories
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Today's Deals Section - Tambala Style */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="mb-4 px-4 py-2 text-sm font-bold" style={{ backgroundColor: colors.accent, color: 'white' }}>
                � TODAY'S DEALS
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Today's Deals
              </h2>
              <p className="text-gray-600">Limited time offers from verified sellers</p>
            </div>
            <Link href="/shop?deals=true">
              <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                View all deals
              </Button>
            </Link>
          </div>
          
          {promotionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : promotions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.slice(0, 6).map((promotion) => (
                <div key={promotion.id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge 
                        className="px-3 py-1 text-sm font-semibold"
                        style={{ backgroundColor: colors.accent, color: 'white' }}
                      >
                        {promotion.type === 'PERCENTAGE' ? `${promotion.value}% OFF` :
                         promotion.type === 'FIXED_AMOUNT' ? `MWK ${promotion.value} OFF` :
                         promotion.type === 'BOGO' ? 'BUY 1 GET 1' :
                         'FREE SHIPPING'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {promotion.usageLimit ? `${promotion.usageCount}/${promotion.usageLimit} used` : `${promotion.usageCount} used`}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{promotion.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{promotion.description}</p>
                    
                    <div className="space-y-2 text-sm text-gray-500">
                      {promotion.minOrderAmount > 0 && (
                        <p>Min order: MWK {promotion.minOrderAmount.toLocaleString()}</p>
                      )}
                      {promotion.maxDiscountAmount > 0 && (
                        <p>Max discount: MWK {promotion.maxDiscountAmount.toLocaleString()}</p>
                      )}
                      <p>Valid until: {new Date(promotion.endDate).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">By {promotion.seller.businessName}</p>
                    </div>
                    
                    <div className="mt-4">
                      <Link href="/shop">
                        <Button 
                          className="w-full text-white hover:opacity-90"
                          style={{ backgroundColor: colors.accent }}
                        >
                          Shop This Deal
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <p className="text-gray-500 text-xl">No active deals at the moment.</p>
              <p className="text-gray-400">Check back soon for amazing offers!</p>
            </div>
          )}
          
          {promotions.length > 0 && (
            <div className="text-center mt-8">
              <Link href="/shop?deals=true">
                <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                  View All Deals
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
      {/* Featured Stores Section - Exact Tambala Market Style */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Featured Stores
            </h2>
            <p className="text-gray-600">Discover top-rated sellers and their best products</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from(new Set(products.slice(0, 8).map(p => p.seller.id))).map((sellerId, index) => {
              const sellerProducts = products.filter(p => p.seller.id === sellerId).slice(0, 4)
              const seller = sellerProducts[0]?.seller
              
              if (!seller) return null
              
              return (
                <div key={seller.id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                  <div className="p-4">
                    {/* Store Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Store className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{seller.businessName}</h3>
                        {seller.verificationStatus === 'VERIFIED' && (
                          <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0.5">
                            ✓
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Store Products Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {sellerProducts.map((product) => (
                        <div key={product.id} className="group">
                          <Link href={`/shop/products/${product.slug}`}>
                            <img 
                              src={getProductImage(product.images)}
                              alt={product.name}
                              className="w-full h-20 object-cover rounded mb-1 group-hover:opacity-90 transition-opacity"
                            />
                            <h4 className="text-xs font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-gray-900">
                                {formatPrice(product.discountPrice || product.price)}
                              </span>
                              {product.discountPrice && (
                                <span className="text-xs text-gray-400 line-through">
                                  {formatPrice(product.price)}
                                </span>
                              )}
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                    
                    {/* Store Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{getSellerLocation(seller.city)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span>{sellerProducts[0]?.averageRating?.toFixed(1) || 'New'}</span>
                      </div>
                    </div>
                    
                    {/* Visit Store Button */}
                    <Link href={`/sellers/${seller.id}`}>
                      <Button 
                        className="w-full text-white hover:opacity-90 text-sm"
                        style={{ backgroundColor: colors.primary }}
                      >
                        Visit Store
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="text-center mt-8">
            <Link href="/sellers">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                View All Stores
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-xl font-bold">Msika247</span>
              </div>
              <p className="text-gray-400 text-sm">Malawi's premier marketplace connecting buyers and sellers nationwide.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/shop" className="hover:text-white">All Products</Link></li>
                <li><Link href="/categories" className="hover:text-white">Categories</Link></li>
                <li><Link href="/deals" className="hover:text-white">Today's Deals</Link></li>
                <li><Link href="/auctions" className="hover:text-white">Auctions</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Sell</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/sell-with-us" className="hover:text-white">Start Selling</Link></li>
                <li><Link href="/seller/register" className="hover:text-white">Seller Registration</Link></li>
                <li><Link href="/seller/dashboard" className="hover:text-white">Seller Dashboard</Link></li>
                <li><Link href="/seller/support" className="hover:text-white">Seller Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Help</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Msika247. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
