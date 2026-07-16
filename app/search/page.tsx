'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { 
  Search, 
  Filter, 
  X, 
  MapPin, 
  Star, 
  Heart, 
  ShoppingCart,
  SlidersHorizontal,
  Grid,
  List,
  ChevronDown,
  User,
  Shield
} from 'lucide-react'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { WishlistButton } from '@/components/ui/wishlist-button'
import { CompareButton } from '@/components/ui/compare-button'
import { UNIFIED_CATEGORIES } from '@/lib/categories'

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
  promotion?: any
  createdAt: string
}

interface SearchFilters {
  query: string
  category: string
  minPrice: number
  maxPrice: number
  minRating: number
  verified: boolean
  location: string
  sortBy: string
  inStock: boolean
}

export default function AdvancedSearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    minPrice: parseInt(searchParams.get('minPrice') || '0'),
    maxPrice: parseInt(searchParams.get('maxPrice') || '1000000'),
    minRating: parseInt(searchParams.get('minRating') || '0'),
    verified: searchParams.get('verified') === 'true',
    location: searchParams.get('location') || '',
    sortBy: searchParams.get('sort') || 'relevant',
    inStock: searchParams.get('inStock') !== 'false'
  })

  const categories = useMemo(() => [
    { value: 'all', label: 'All Categories', icon: Grid },
    ...UNIFIED_CATEGORIES.map(cat => ({
      value: cat.name.toLowerCase(),
      label: cat.name,
      icon: cat.icon
    }))
  ], [])

  const sortOptions = [
    { value: 'relevant', label: 'Most Relevant' },
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'reviews', label: 'Most Reviewed' }
  ]

  const malawiCities = [
    'All Malawi', 'Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Kasungu',
    'Mangochi', 'Karonga', 'Salima', 'Dedza', 'Nkhata Bay', 'Balaka'
  ]

  // Update URL when filters change
  const updateURL = (newFilters: SearchFilters) => {
    const params = new URLSearchParams()
    
    if (newFilters.query) params.set('q', newFilters.query)
    if (newFilters.category !== 'all') params.set('category', newFilters.category)
    if (newFilters.minPrice > 0) params.set('minPrice', newFilters.minPrice.toString())
    if (newFilters.maxPrice < 1000000) params.set('maxPrice', newFilters.maxPrice.toString())
    if (newFilters.minRating > 0) params.set('minRating', newFilters.minRating.toString())
    if (newFilters.verified) params.set('verified', 'true')
    if (newFilters.location) params.set('location', newFilters.location)
    if (newFilters.sortBy !== 'relevant') params.set('sort', newFilters.sortBy)
    if (!newFilters.inStock) params.set('inStock', 'false')

    const queryString = params.toString()
    const newUrl = queryString ? `/search?${queryString}` : '/search'
    router.push(newUrl)
  }

  // Search products
  const searchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.query) params.set('query', filters.query)
      if (filters.category !== 'all') params.set('category', filters.category)
      params.set('minPrice', filters.minPrice.toString())
      params.set('maxPrice', filters.maxPrice.toString())
      params.set('minRating', filters.minRating.toString())
      if (filters.verified) params.set('verified', 'true')
      if (filters.location) params.set('location', filters.location)
      params.set('sort', filters.sortBy)
      params.set('inStock', filters.inStock.toString())

      const response = await fetch(`/api/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-search when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts()
      updateURL(filters)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters])

  // Handle filter changes
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      query: filters.query, // Keep search query
      category: 'all',
      minPrice: 0,
      maxPrice: 1000000,
      minRating: 0,
      verified: false,
      location: '',
      sortBy: 'relevant',
      inStock: true
    })
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.category !== 'all') count++
    if (filters.minPrice > 0) count++
    if (filters.maxPrice < 1000000) count++
    if (filters.minRating > 0) count++
    if (filters.verified) count++
    if (filters.location) count++
    if (filters.sortBy !== 'relevant') count++
    if (!filters.inStock) count++
    return count
  }, [filters])

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

  const ProductCard = ({ product }: { product: Product }) => {
    const discount = product.discountPrice 
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0

    return (
      <Card className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden">
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
          
          <div className="absolute top-2 right-2">
            <WishlistButton
              productId={product.id}
              productName={product.name}
              variant="secondary"
              size="sm"
              className="bg-white/80 hover:bg-white"
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
              <CompareButton
                productId={product.id}
                productName={product.name}
                size="sm"
                variant="outline"
              />
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <ShoppingCart className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search for products, brands, or categories..."
                value={filters.query}
                onChange={(e) => updateFilter('query', e.target.value)}
                className="pl-10 pr-4 h-12 text-lg"
              />
              {filters.query && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => updateFilter('query', '')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Search Filters</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
                  {/* Category Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Category</label>
                    <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">
                      Price Range: MWK {filters.minPrice.toLocaleString()} - {filters.maxPrice.toLocaleString()}
                    </label>
                    <div className="space-y-3">
                      <Slider
                        value={[filters.minPrice]}
                        onValueChange={([value]) => updateFilter('minPrice', value)}
                        max={filters.maxPrice}
                        step={1000}
                        className="w-full"
                      />
                      <Slider
                        value={[filters.maxPrice]}
                        onValueChange={([value]) => updateFilter('maxPrice', value)}
                        min={filters.minPrice}
                        max={1000000}
                        step={1000}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Minimum Rating</label>
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3, 4].map(rating => (
                        <Button
                          key={rating}
                          variant={filters.minRating > rating ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateFilter('minRating', rating + 1)}
                          className="flex items-center gap-1"
                        >
                          {rating + 1}
                          <Star className="w-3 h-3" />
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Location</label>
                    <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {malawiCities.map(city => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Verified Sellers */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified"
                      checked={filters.verified}
                      onCheckedChange={(checked) => updateFilter('verified', checked)}
                    />
                    <label htmlFor="verified" className="text-sm font-medium">
                      Verified sellers only
                    </label>
                  </div>

                  {/* In Stock */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inStock"
                      checked={filters.inStock}
                      onCheckedChange={(checked) => updateFilter('inStock', checked)}
                    />
                    <label htmlFor="inStock" className="text-sm font-medium">
                      In stock only
                    </label>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Sort By</label>
                    <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Filters */}
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {filters.query ? `"${filters.query}"` : 'All Products'}
            </h1>
            <p className="text-gray-600 mt-1">
              {total} {total === 1 ? 'product' : 'products'} found
            </p>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              <div className="flex gap-1">
                {filters.category !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.category}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('category', 'all')} />
                  </Badge>
                )}
                {filters.verified && (
                  <Badge variant="secondary" className="gap-1">
                    Verified
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('verified', false)} />
                  </Badge>
                )}
                {filters.location && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.location}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('location', '')} />
                  </Badge>
                )}
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search terms
            </p>
            <Button onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
