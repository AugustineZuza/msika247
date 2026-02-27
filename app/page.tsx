'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'
import Logo from '@/components/logo'
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Star,
  Shield,
  MessageCircle,
  Truck,
  CheckCircle,
  ChevronDown,
  Smartphone,
  Shirt,
  TreePine,
  Home,
  ShoppingCart as ShoppingCartIcon,
  Sun,
  Car,
  Heart,
  Send,
  Package,
  CreditCard,
  Users,
  Headphones,
  ArrowRight,
  Loader2,
  Store,
  Tag
} from 'lucide-react'
import { useSession } from 'next-auth/react'

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

const categories = [
  { name: 'all', icon: Smartphone, color: 'bg-gray-100 text-gray-600', label: 'All Categories' },
  { name: 'Electronics & Phones', icon: Smartphone, color: 'bg-blue-100 text-blue-600' },
  { name: 'Fashion & Clothing', icon: Shirt, color: 'bg-pink-100 text-pink-600' },
  { name: 'Agriculture & Farming', icon: TreePine, color: 'bg-green-100 text-green-600' },
  { name: 'Home & Furniture', icon: Home, color: 'bg-orange-100 text-orange-600' },
  { name: 'Groceries', icon: ShoppingCartIcon, color: 'bg-red-100 text-red-600' },
  { name: 'Solar & Energy', icon: Sun, color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Motor & Spare Parts', icon: Car, color: 'bg-gray-100 text-gray-600' },
  { name: 'Beauty & Personal Care', icon: Heart, color: 'bg-purple-100 text-purple-600' }
]

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
    city?: string // Added optional city property
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [cartCount, setCartCount] = useState(3) // Sample cart count
  const [products, setProducts] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [currentNewProductIndex, setCurrentNewProductIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [newProductsLoading, setNewProductsLoading] = useState(true)
  const [promotionsLoading, setPromotionsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const fetchProducts = async (category: string = 'all') => {
    try {
      setLoading(true)
      const url = category === 'all' 
        ? '/api/landing-products?limit=8'
        : `/api/landing-products?category=${encodeURIComponent(category)}&limit=8`
      
      const response = await fetch(url)
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
      console.log('Fetching new products...')
      const response = await fetch('/api/landing-products?new=true&limit=6')
      if (response.ok) {
        const data = await response.json()
        console.log('New products fetched:', data)
        console.log('Products array:', data.products)
        console.log('First product:', data.products?.[0])
        console.log('First product images:', data.products?.[0]?.images)
        console.log('Type of images:', typeof data.products?.[0]?.images)
        setNewProducts(data.products || [])
      } else {
        console.error('Failed to fetch new products:', response.status, response.statusText)
        // Try with regular products as fallback
        const fallbackResponse = await fetch('/api/landing-products?limit=6')
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          console.log('Using fallback products:', fallbackData.products?.[0])
          setNewProducts(fallbackData.products || [])
        }
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

  useEffect(() => {
    fetchProducts(selectedCategory)
    fetchNewProducts()
    fetchPromotions()
  }, [selectedCategory])

  useEffect(() => {
    // Only start auto-rotation when we have products
    if (newProducts.length > 0) {
      console.log('Starting auto-rotation for', newProducts.length, 'products')
      const interval = setInterval(() => {
        setCurrentNewProductIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % newProducts.length
          console.log('Auto-rotating to product index:', newIndex)
          return newIndex
        })
      }, 3000) // Change product every 3 seconds

      return () => {
        console.log('Clearing auto-rotation interval')
        clearInterval(interval)
      }
    }
  }, [newProducts.length]) // Dependency on newProducts.length to restart interval when products change

  const formatPrice = (price: number) => {
    return `MWK ${price.toLocaleString()}`
  }

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName)
    setIsCategoriesOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const getProductImage = (images: any) => {
    console.log('Getting image for:', images, 'Type:', typeof images)
    
    // Test with a known working image first
    const testImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop'
    
    // Handle different image formats
    if (Array.isArray(images) && images.length > 0) {
      console.log('Images is array, returning first:', images[0])
      return images[0] || testImage
    }
    
    if (typeof images === 'string') {
      // Try to parse as JSON array
      try {
        const imageArray = JSON.parse(images)
        if (Array.isArray(imageArray) && imageArray.length > 0) {
          console.log('Parsed JSON array, returning first:', imageArray[0])
          return imageArray[0] || testImage
        }
      } catch (e) {
        // If parsing fails, treat as direct URL
        if (images.trim() !== '') {
          console.log('Using string as direct URL:', images)
          return images
        }
      }
    }
    
    // Fallback to test image
    console.log('Using test image:', testImage)
    return testImage
  }

  const getSellerLocation = (city?: string) => {
    if (city) return city
    const cities = ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Kasungu']
    return cities[Math.floor(Math.random() * cities.length)]
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Logo size="md" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search products, brands, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </form>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {/* Categories Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center space-x-1 hover:bg-gray-100"
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                >
                  <span>Categories</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                
                {isCategoriesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-2">
                      {categories.map((category) => (
                        <button
                          key={category.name}
                          onClick={() => handleCategoryClick(category.name)}
                          className={`flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg w-full text-left ${
                            selectedCategory === category.name ? 'bg-green-50' : ''
                          }`}
                        >
                          <category.icon className={`h-5 w-5 ${category.color.split(' ')[1]}`} />
                          <span className="text-sm">{category.label || category.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/seller/register">
                <Button 
                  className="text-white hover:opacity-90"
                  style={{ backgroundColor: colors.accent }}
                >
                  Become a Seller
                </Button>
              </Link>

              {session ? (
                <Link href="/buyer/profile">
                  <Button variant="ghost">My Account</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
              )}

              <Link href="/cart" className="relative">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center text-white"
                      style={{ backgroundColor: colors.accent }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-3">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </form>
            </div>
            <div className="px-2 pb-3 space-y-1">
              <button
                onClick={() => handleCategoryClick('all')}
                className={`block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 ${
                  selectedCategory === 'all' ? 'bg-green-50' : ''
                }`}
              >
                All Products
              </button>
              {categories.slice(1).map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  className={`block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 ${
                    selectedCategory === category.name ? 'bg-green-50' : ''
                  }`}
                >
                  {category.name}
                </button>
              ))}
              <Link href="/seller/register" className="block px-3 py-2 rounded-lg hover:bg-gray-100">Become a Seller</Link>
              {session ? (
                <Link href="/buyer/profile" className="block px-3 py-2 rounded-lg hover:bg-gray-100">My Account</Link>
              ) : (
                <Link href="/login" className="block px-3 py-2 rounded-lg hover:bg-gray-100">Login</Link>
              )}
              <Link href="/cart" className="block px-3 py-2 rounded-lg hover:bg-gray-100">Cart ({cartCount})</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-yellow-50 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 px-3 py-1 text-sm" style={{ backgroundColor: colors.highlight, color: colors.primary }}>
                🇲🇼 Proudly Malawian
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Shop Malawi's Trusted
                <span className="block" style={{ color: colors.primary }}>
                  Online Marketplace
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Buy from verified local sellers across Lilongwe, Blantyre, Mzuzu and beyond. 
                Quality products, secure payments, nationwide delivery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/shop">
                  <Button 
                    size="lg" 
                    className="text-white hover:opacity-90 flex items-center gap-2"
                    style={{ backgroundColor: colors.accent }}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Start Shopping
                  </Button>
                </Link>
                <Link href="/seller/register">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Package className="h-5 w-5" />
                    Become a Seller
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="mt-8 flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">Verified Sellers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">Secure Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">Nationwide Delivery</span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img 
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop"
                    alt="Electronics"
                    className="rounded-lg shadow-lg w-full h-32 object-cover"
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop"
                    alt="Fashion"
                    className="rounded-lg shadow-lg w-full h-32 object-cover"
                  />
                </div>
                <div className="space-y-4 mt-8">
                  <img 
                    src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=200&h=200&fit=crop"
                    alt="Fashion"
                    className="rounded-lg shadow-lg w-full h-32 object-cover"
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop"
                    alt="Agriculture"
                    className="rounded-lg shadow-lg w-full h-32 object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exclusive Offers Section - New Products */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-50 via-yellow-50 to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4 px-4 py-2 text-sm font-bold animate-pulse" style={{ backgroundColor: colors.highlight, color: colors.primary }}>
              🔥 EXCLUSIVE OFFERS
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Just In! <span style={{ color: colors.primary }}>New Arrivals</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Fresh products uploaded by our verified sellers. Limited time offers!
            </p>
          </div>

          {/* Single Product Display - Fade In/Out */}
          <div className="relative h-96 flex items-center justify-center">
            {newProductsLoading ? (
              <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-xl mb-6"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ) : newProducts.length > 0 ? (
              <div className="relative w-full max-w-md">
                {newProducts.map((product, index) => {
                  const productImage = getProductImage(product.images)
                  console.log('Product', index, ':', product.name, 'Image:', productImage, 'Raw images:', product.images)
                  return (
                    <div
                      key={product.id}
                      className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                        index === currentNewProductIndex
                          ? 'opacity-100 scale-100 translate-y-0'
                          : 'opacity-0 scale-95 translate-y-4'
                      }`}
                    >
                      <Card className="h-full bg-white rounded-2xl shadow-2xl border-2 border-green-200 hover:border-green-400 transition-all duration-300 relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-transparent to-yellow-50 opacity-50"></div>
                        
                        <CardContent className="p-8 relative z-10">
                          {/* NEW Badge with Animation */}
                          <div className="absolute -top-3 -right-3 z-20">
                            <Badge className="bg-red-500 text-white text-sm font-bold animate-pulse shadow-lg px-3 py-1">
                              NEW
                            </Badge>
                          </div>
                          
                          {/* Recently Uploaded Badge */}
                          <div className="absolute -top-3 -left-3 z-20">
                            <Badge className="bg-green-600 text-white text-sm font-bold animate-bounce shadow-lg px-3 py-1">
                              🕐 RECENT
                            </Badge>
                          </div>
                          
                          {/* Product Image */}
                          <div className="relative mb-6">
                            <img
                              src={productImage}
                              alt={product.name}
                              className="w-full h-48 object-cover rounded-xl shadow-lg transform transition-transform duration-500 hover:scale-105"
                              onError={(e) => {
                                console.error('Image failed to load:', productImage)
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop'
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully:', productImage)
                              }}
                            />
                            {/* Discount and Promotion Badges */}
                            {product.discountPrice && (
                              <div className="absolute top-3 left-3">
                                <Badge className="bg-red-500 text-white text-sm font-bold shadow-lg px-3 py-1">
                                  -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                                </Badge>
                              </div>
                            )}
                            {product.promotion && (
                              <div className="absolute top-3 right-3">
                                <Badge 
                                  className="bg-purple-600 text-white text-xs font-bold shadow-lg px-2 py-1"
                                >
                                  {product.promotion.type === 'PERCENTAGE' ? `${product.promotion.value}% OFF` :
                                   product.promotion.type === 'FIXED_AMOUNT' ? `KSh ${product.promotion.value} OFF` :
                                   product.promotion.type === 'BOGO' ? 'BOGO' :
                                   'FREE SHIP'}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="space-y-4">
                            <h3 className="font-bold text-xl text-gray-900 line-clamp-2">
                              {product.name}
                            </h3>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {product.discountPrice ? (
                                  <>
                                    <span className="text-2xl font-bold text-green-600">
                                      {formatPrice(product.discountPrice)}
                                    </span>
                                    <span className="text-sm text-gray-400 line-through">
                                      {formatPrice(product.price)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-2xl font-bold text-green-600">
                                    {formatPrice(product.price)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Seller Info */}
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-green-600" />
                                {product.seller.businessName}
                              </span>
                              <span className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-green-600" />
                                {getSellerLocation(product.seller.city)}
                              </span>
                            </div>
                            
                            {/* Rating */}
                            {product.averageRating > 0 && (
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600">
                                  {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)
                                </span>
                              </div>
                            )}
                            
                            {/* Action Button */}
                            <Link href={`/shop/products/${product.slug}`}>
                              <Button 
                                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-lg transform transition-all duration-300 hover:scale-105"
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                View Product
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <p className="text-gray-500 text-xl">No new products available at the moment.</p>
                <p className="text-gray-400">Check back soon for fresh arrivals!</p>
              </div>
            )}
            
            {/* Progress Indicators */}
            {newProducts.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {newProducts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      console.log('Manual click to product index:', index)
                      setCurrentNewProductIndex(index)
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentNewProductIndex
                        ? 'bg-green-600 w-8'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Debug Info - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded text-xs">
                Current Index: {currentNewProductIndex} / {newProducts.length}
              </div>
            )}
          </div>
          
          {/* View All Button */}
          <div className="text-center mt-8">
            <Link href="/shop?new=true">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-lg transform transition-all duration-300 hover:scale-105"
              >
                <Package className="w-5 h-5 mr-2" />
                View All New Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Active Promotions Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Hot <span style={{ color: colors.accent }}>Deals & Promotions</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Limited time offers from our verified sellers. Don't miss out!
            </p>
          </div>

          {promotionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
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
                <div key={promotion.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <Badge 
                      className="px-3 py-1 text-sm font-semibold"
                      style={{ backgroundColor: colors.accent, color: 'white' }}
                    >
                      {promotion.type === 'PERCENTAGE' ? `${promotion.value}% OFF` :
                       promotion.type === 'FIXED_AMOUNT' ? `KSh ${promotion.value} OFF` :
                       promotion.type === 'BOGO' ? 'BUY 1 GET 1' :
                       'FREE SHIPPING'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {promotion.usageLimit ? `${promotion.usageCount}/${promotion.usageLimit} used` : `${promotion.usageCount} used`}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{promotion.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{promotion.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    {promotion.minOrderAmount > 0 && (
                      <p>Min order: KSh {promotion.minOrderAmount.toLocaleString()}</p>
                    )}
                    {promotion.maxDiscountAmount > 0 && (
                      <p>Max discount: KSh {promotion.maxDiscountAmount.toLocaleString()}</p>
                    )}
                    <p>Valid until: {new Date(promotion.endDate).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">By {promotion.seller.businessName}</p>
                  </div>
                  
                  <div className="mt-4">
                    <Link href="/shop">
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                        size="sm"
                      >
                        Shop This Deal
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <p className="text-gray-500 text-xl">No active promotions at the moment.</p>
              <p className="text-gray-400">Check back soon for amazing deals!</p>
            </div>
          )}
          
          {promotions.length > 0 && (
            <div className="text-center mt-8">
              <Link href="/shop?promotions=true">
                <Button 
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  View All Promotions
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {selectedCategory === 'all' ? 'Featured Products' : `${selectedCategory}`}
            </h2>
            <p className="text-xl text-gray-600">
              {selectedCategory === 'all' 
                ? 'Popular items from trusted Malawian sellers' 
                : `Browse ${selectedCategory.toLowerCase()} from local sellers`
              }
            </p>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => handleCategoryClick('all')}
                className="mt-2 text-sm text-green-600 hover:text-green-700 underline"
              >
                ← View all categories
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Loading products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found in this category.</p>
              <button
                onClick={() => handleCategoryClick('all')}
                className="mt-4 text-green-600 hover:text-green-700 underline"
              >
                Browse all products instead
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="group hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-4">
                    <div className="relative">
                      <img 
                        src={getProductImage(product.images)}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      {product.discountPrice && (
                        <Badge 
                          className="absolute top-2 right-12 px-2 py-1 text-xs font-semibold"
                          style={{ backgroundColor: colors.highlight, color: colors.primary }}
                        >
                          SALE
                        </Badge>
                      )}
                      {product.promotion && (
                        <Badge 
                          className="absolute top-2 right-2 px-2 py-1 text-xs font-bold bg-purple-600 text-white"
                        >
                          {product.promotion.type === 'PERCENTAGE' ? `${product.promotion.value}% OFF` :
                           product.promotion.type === 'FIXED_AMOUNT' ? `KSh ${product.promotion.value} OFF` :
                           product.promotion.type === 'BOGO' ? 'BOGO' :
                           'FREE'}
                        </Badge>
                      )}
                      {product.seller.verificationStatus === 'VERIFIED' && (
                        <Badge 
                          className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold bg-green-600 text-white"
                        >
                          ✓ Verified
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 mb-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{getSellerLocation(product.seller.city)}</span>
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {product.averageRating > 0 ? `${product.averageRating} (${product.reviewCount})` : 'New Product'}
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
                          {product.promotion && (
                            <Badge className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1">
                              {product.promotion.type === 'PERCENTAGE' ? `${product.promotion.value}% OFF` :
                               product.promotion.type === 'FIXED_AMOUNT' ? `KSh ${product.promotion.value} OFF` :
                               product.promotion.type === 'BOGO' ? 'BOGO' :
                               'FREE SHIP'}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(product.price)}
                          </span>
                          {product.promotion && (
                            <Badge className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1">
                              {product.promotion.type === 'PERCENTAGE' ? `${product.promotion.value}% OFF` :
                               product.promotion.type === 'FIXED_AMOUNT' ? `KSh ${product.promotion.value} OFF` :
                               product.promotion.type === 'BOGO' ? 'BOGO' :
                               'FREE SHIP'}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/shop/products/${product.slug}`} className="flex-1">
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
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="text-center mt-12">
              <Link href={`/shop${selectedCategory !== 'all' ? `?category=${encodeURIComponent(selectedCategory)}` : ''}`}>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  View All Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Why Choose Msika247?
            </h2>
            <p className="text-xl text-gray-600">
              The most trusted marketplace in Malawi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.primary }}>
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                🇲🇼 100% Local Sellers
              </h3>
              <p className="text-gray-600">
                Support Malawian businesses and buy from verified local sellers
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.primary }}>
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                🔐 Secure PayChangu Payments
              </h3>
              <p className="text-gray-600">
                Safe and secure payment processing with PayChangu
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.primary }}>
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                💬 Chat with Sellers
              </h3>
              <p className="text-gray-600">
                Communicate directly with sellers before making purchases
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.primary }}>
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                📦 Nationwide Delivery
              </h3>
              <p className="text-gray-600">
                Fast and reliable delivery across all Malawi regions
              </p>
            </div>
          </div>

          {/* PayChangu Badge */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg border border-gray-200">
              <Shield className="h-6 w-6 text-green-600" />
              <span className="font-semibold text-gray-900">Powered by PayChangu</span>
              <Badge className="px-3 py-1 text-xs" style={{ backgroundColor: colors.highlight, color: colors.primary }}>
                SECURE
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple and easy for everyone to get started
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* For Buyers */}
            <div className="relative">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: colors.primary }}>
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For Buyers</h3>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-start group">
                  <div className="flex-shrink-0 mr-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: colors.primary }}>
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Browse Products</h4>
                    <p className="text-gray-600 leading-relaxed">Search through thousands of products from verified local sellers across Malawi</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 mr-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: colors.primary }}>
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Chat with Seller</h4>
                    <p className="text-gray-600 leading-relaxed">Ask questions, negotiate prices, and get product details directly from sellers</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 mr-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: colors.primary }}>
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Pay Securely via PayChangu</h4>
                    <p className="text-gray-600 leading-relaxed">Safe payment processing with buyer protection and secure transactions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Sellers */}
            <div className="relative">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: colors.accent }}>
                  <Store className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For Sellers</h3>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-start group">
                  <div className="flex-shrink-0 mr-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: colors.accent }}>
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Subscribe</h4>
                    <p className="text-gray-600 leading-relaxed">Choose a subscription plan that fits your business needs and budget</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 mr-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: colors.accent }}>
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload Products</h4>
                    <p className="text-gray-600 leading-relaxed">List your products with photos, descriptions, and competitive pricing</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 mr-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: colors.accent }}>
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Receive Orders & Payments</h4>
                    <p className="text-gray-600 leading-relaxed">Get orders and secure payments directly, then arrange delivery efficiently</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 rounded-full border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">Get started in minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: colors.darkGreen }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Logo size="sm" showText={true} className="text-white" />
              </div>
              <p className="text-green-100 mb-4">
                Malawi's trusted online marketplace connecting local buyers and sellers.
              </p>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm">Powered by PayChangu</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-green-100 hover:text-white">About Us</Link></li>
                <li><Link href="/faq" className="text-green-100 hover:text-white">FAQ</Link></li>
                <li><Link href="/seller/plans" className="text-green-100 hover:text-white">Seller Plans</Link></li>
                <li><Link href="/how-it-works" className="text-green-100 hover:text-white">How It Works</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-green-100 hover:text-white">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="text-green-100 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/refund" className="text-green-100 hover:text-white">Refund Policy</Link></li>
                <li><Link href="/shipping" className="text-green-100 hover:text-white">Shipping Info</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-green-100">+265 999 123 456</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-green-100">support@msika247.mw</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-green-100">Lilongwe, Malawi</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-green-700 mt-8 pt-8 text-center">
            <p className="text-green-100">
              © 2024 Msika247 Malawi. All rights reserved. | 🇲🇼 Proudly Malawian
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp-style Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          style={{ backgroundColor: '#25D366' }}
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </div>
    </div>
  )
}
