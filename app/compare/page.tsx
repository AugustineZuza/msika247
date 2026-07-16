'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft, 
  ArrowRight, 
  X, 
  Star, 
  MapPin, 
  Shield, 
  ShoppingCart,
  Heart,
  Share2,
  Download,
  Trash2,
  Plus,
  Check,
  AlertCircle
} from 'lucide-react'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { WishlistButton } from '@/components/ui/wishlist-button'
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

interface Product {
  id: string
  name: string
  price: number
  discountPrice?: number
  images: string[]
  slug: string
  description: string
  stock: number
  seller: {
    id: string
    businessName: string
    city?: string
    verificationStatus: string
    rating?: number
  }
  category: string
  averageRating: number
  reviewCount: number
  createdAt: string
  specifications: Record<string, any>
}

interface ComparisonData {
  products: Product[]
  categories: string[]
  specifications: Record<string, Record<string, any>>
  comparisonFields: string[]
}

export default function ComparePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'Price', 'Rating', 'Reviews', 'Seller', 'Stock', 'Category'
  ])

  useEffect(() => {
    const ids = searchParams.get('ids')
    if (ids) {
      fetchComparisonData(ids.split(','))
    } else {
      // Try to get from localStorage
      const savedIds = localStorage.getItem('compareProducts')
      if (savedIds) {
        fetchComparisonData(savedIds.split(','))
      } else {
        setLoading(false)
      }
    }
  }, [searchParams])

  const fetchComparisonData = async (productIds: string[]) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/compare?ids=${productIds.join(',')}`)
      if (response.ok) {
        const data = await response.json()
        setComparisonData(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load comparison data",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to fetch comparison data:', error)
      toast({
        title: "Error",
        description: "Failed to load comparison data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const removeProduct = (productId: string) => {
    if (!comparisonData) return

    const newProducts = comparisonData.products.filter(p => p.id !== productId)
    if (newProducts.length === 0) {
      // Clear comparison and redirect
      localStorage.removeItem('compareProducts')
      router.push('/shop')
      return
    }

    const newIds = newProducts.map(p => p.id)
    const newUrl = `/compare?ids=${newIds.join(',')}`
    router.push(newUrl)
    
    // Update localStorage
    localStorage.setItem('compareProducts', newIds.join(','))
  }

  const addToComparison = async (productId: string) => {
    if (!comparisonData || comparisonData.products.length >= 4) {
      toast({
        title: "Limit Reached",
        description: "You can compare maximum 4 products at once",
        variant: "destructive"
      })
      return
    }

    const newIds = [...comparisonData.products.map(p => p.id), productId]
    const newUrl = `/compare?ids=${newIds.join(',')}`
    router.push(newUrl)
    localStorage.setItem('compareProducts', newIds.join(','))
  }

  const shareComparison = async () => {
    try {
      const url = window.location.href
      if (navigator.share) {
        await navigator.share({
          title: 'Product Comparison - Msika247',
          text: `Check out this comparison of ${comparisonData?.products.length} products`,
          url
        })
      } else {
        await navigator.clipboard.writeText(url)
        toast({
          title: "Link Copied",
          description: "Comparison link copied to clipboard"
        })
      }
    } catch (error) {
      console.error('Failed to share comparison:', error)
    }
  }

  const exportComparison = () => {
    if (!comparisonData) return

    const csvContent = generateComparisonCSV(comparisonData)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `product-comparison-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generateComparisonCSV = (data: ComparisonData): string => {
    const headers = ['Feature', ...data.products.map(p => p.name)]
    const rows = []

    // Basic comparison fields
    selectedFields.forEach(field => {
      const row = [field]
      data.products.forEach(product => {
        switch (field) {
          case 'Price':
            const price = product.discountPrice || product.price
            row.push(`MWK ${price.toLocaleString()}`)
            break
          case 'Rating':
            row.push(`${product.averageRating} (${product.reviewCount} reviews)`)
            break
          case 'Reviews':
            row.push(product.reviewCount.toString())
            break
          case 'Seller':
            row.push(`${product.seller.businessName} (${product.seller.city})`)
            break
          case 'Stock':
            row.push(product.stock > 0 ? `${product.stock} available` : 'Out of stock')
            break
          case 'Category':
            row.push(product.category)
            break
          case 'Added Date':
            row.push(new Date(product.createdAt).toLocaleDateString())
            break
          default:
            row.push('N/A')
        }
      })
      rows.push(row)
    })

    // Specifications
    Object.entries(data.specifications).forEach(([spec, values]) => {
      const row = [spec]
      data.products.forEach(product => {
        row.push(values[product.id] || 'N/A')
      })
      rows.push(row)
    })

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

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

  const toggleField = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comparison...</p>
        </div>
      </div>
    )
  }

  if (!comparisonData || comparisonData.products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="text-center p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Products to Compare</h2>
            <p className="text-gray-600 mb-6">
              Select products to compare and see their features side by side
            </p>
            <Link href="/shop">
              <Button className="bg-primary hover:bg-primary/90">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Browse Products
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/shop">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Shop
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Product Comparison</h1>
                <p className="text-sm text-gray-600">
                  Comparing {comparisonData.products.length} products
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareComparison}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportComparison}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              {comparisonData.products.length < 4 && (
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Product Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 border-b">
            <div className="p-4 bg-gray-50">
              <h3 className="font-semibold text-sm">Features</h3>
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFields([
                    'Price', 'Rating', 'Reviews', 'Seller', 'Stock', 'Category'
                  ])}
                >
                  Select All
                </Button>
              </div>
            </div>
            
            {comparisonData.products.map(product => (
              <div key={product.id} className="p-4 border-l relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => removeProduct(product.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
                
                <div className="pr-8">
                  <OptimizedImage
                    src={product.images[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  
                  <Link href={`/products/${product.slug}`}>
                    <h4 className="font-semibold text-sm hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h4>
                  </Link>
                  
                  <div className="flex items-center gap-1 mt-1">
                    {renderStars(product.averageRating)}
                    <span className="text-xs text-gray-500">
                      ({product.reviewCount})
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    {product.discountPrice ? (
                      <>
                        <span className="text-lg font-bold text-primary">
                          MWK {product.discountPrice.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500 line-through block">
                          MWK {product.price.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        MWK {product.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-1 mt-3">
                    <WishlistButton
                      productId={product.id}
                      productName={product.name}
                      size="sm"
                      variant="outline"
                    />
                    <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Features */}
          <div className="divide-y">
            {/* Basic Features */}
            {['Price', 'Rating', 'Reviews', 'Seller', 'Stock', 'Category', 'Added Date'].map(field => (
              <div key={field} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0">
                <div className="p-4 bg-gray-50 flex items-center gap-2">
                  <Checkbox
                    checked={selectedFields.includes(field)}
                    onCheckedChange={() => toggleField(field)}
                  />
                  <span className="font-medium text-sm">{field}</span>
                </div>
                
                {comparisonData.products.map(product => (
                  <div key={product.id} className="p-4 border-l">
                    {field === 'Price' && (
                      <div>
                        {product.discountPrice ? (
                          <>
                            <span className="font-semibold text-primary">
                              MWK {product.discountPrice.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-500 line-through block">
                              MWK {product.price.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold">
                            MWK {product.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {field === 'Rating' && (
                      <div className="flex items-center gap-1">
                        {renderStars(product.averageRating)}
                        <span className="text-sm text-gray-500">
                          ({product.reviewCount})
                        </span>
                      </div>
                    )}
                    
                    {field === 'Reviews' && (
                      <span className="font-semibold">{product.reviewCount} reviews</span>
                    )}
                    
                    {field === 'Seller' && (
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm">{product.seller.businessName}</span>
                          {product.seller.verificationStatus === 'VERIFIED' && (
                            <Shield className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          {product.seller.city}
                        </div>
                      </div>
                    )}
                    
                    {field === 'Stock' && (
                      <div className={`font-medium ${
                        product.stock > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                      </div>
                    )}
                    
                    {field === 'Category' && (
                      <Badge variant="secondary">{product.category}</Badge>
                    )}
                    
                    {field === 'Added Date' && (
                      <span className="text-sm">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Specifications */}
            {Object.entries(comparisonData.specifications).map(([spec, values]) => (
              <div key={spec} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0">
                <div className="p-4 bg-gray-50">
                  <span className="font-medium text-sm">{spec}</span>
                </div>
                
                {comparisonData.products.map(product => (
                  <div key={product.id} className="p-4 border-l">
                    <span className="text-sm">
                      {values[product.id] || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Add More Products */}
        {comparisonData.products.length < 4 && (
          <div className="mt-6 text-center">
            <Card className="p-6 bg-gray-50">
              <h3 className="font-semibold mb-2">Add More Products</h3>
              <p className="text-sm text-gray-600 mb-4">
                You can compare up to 4 products at once
              </p>
              <Link href="/shop">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Browse More Products
                </Button>
              </Link>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
