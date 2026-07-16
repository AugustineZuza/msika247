'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  Heart, 
  ArrowLeft,
  ArrowRight,
  Truck,
  Shield,
  Store,
  Package,
  Minus,
  Plus,
  Send,
  CheckCircle,
  MessageSquare,
  MapPin
} from 'lucide-react'
import EnhancedProductChat from '@/components/chat/enhanced-product-chat'

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
    userId: string; 
    businessName: string; 
    businessImage?: string
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
  location?: {
    city: string
    district: string
    region: string
    address: string
  }
}

interface Review {
  id: string
  rating: number
  comment: string
  user: { name: string }
  createdAt: string
}

interface ProductData {
  product: Product
  reviews: Review[]
}

// Add shimmer animation
const shimmerStyle = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`

function ProductPageComponent() {
  const router = useRouter()
  const params = useParams()
  const { addToCart } = useCart()
  const { data: session } = useSession()
  const [productData, setProductData] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    successMessage: '',
    errorMessage: ''
  })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProductData(data)
      } else if (response.status === 404) {
        router.push('/shop')
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
      router.push('/shop')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!session?.user) {
      router.push('/login')
      return
    }

    if (!productData) return

    try {
      setAddingToCart(true)
      await addToCart(productData.product.id, quantity)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  const getDiscountPercentage = (price: number, discountPrice: number) => {
    return Math.round(((price - discountPrice) / price) * 100)
  }

  const getCurrentPrice = (product: Product) => {
    return product.discountPrice || product.price
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSubmitReview = async () => {
    if (!session?.user || !productData) return

    try {
      setSubmittingReview(true)
      
      const response = await fetch(`/api/products/${params.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: reviewForm.rating,
          comment: reviewForm.comment
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Refresh product data to show new review
        await fetchProduct()
        
        // Reset form
        setReviewForm({
          rating: 5,
          comment: '',
          successMessage: 'Review submitted successfully!',
          errorMessage: ''
        })
        
        // Refresh reviews in the product data
        setTimeout(() => {
          setReviewForm(prev => ({ ...prev, successMessage: '' }))
        }, 3000)
      } else {
        const error = await response.json()
        setReviewForm(prev => ({ 
          ...prev, 
          errorMessage: error.error || 'Failed to submit review',
          successMessage: ''
        }))
      }
    } catch (error) {
      console.error('Review submission error:', error)
      setReviewForm(prev => ({ 
        ...prev, 
        errorMessage: 'Failed to submit review. Please try again.',
        successMessage: ''
      }))
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <Header />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-12 rounded-2xl w-1/3" style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})` }}></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="aspect-square rounded-3xl" style={{ background: `linear-gradient(135deg, ${colors.lightGreen}, ${colors.background})` }}></div>
                <div className="grid grid-cols-4 gap-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="aspect-square rounded-2xl" style={{ background: `linear-gradient(135deg, ${colors.lightGreen}, ${colors.background})` }}></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 rounded-2xl w-3/4" style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.darkGreen})` }}></div>
                <div className="h-4 rounded-2xl w-1/2" style={{ backgroundColor: colors.primary + '30' }}></div>
                <div className="h-12 rounded-2xl w-1/3" style={{ background: `linear-gradient(to right, ${colors.accent}, ${colors.highlight})` }}></div>
                <div className="h-20 rounded-2xl" style={{ backgroundColor: colors.primary + '20' }}></div>
                <div className="h-12 rounded-2xl w-2/3" style={{ backgroundColor: colors.primary + '20' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!productData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <Header />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center py-20">
            <div className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: colors.lightGreen }}>
              <Package className="w-16 h-16" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h3>
            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Link href="/shop">
              <Button className="text-white font-semibold" style={{ backgroundColor: colors.primary }}>
                Back to Shop
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { product, reviews } = productData

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <Header />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/shop" className="flex items-center gap-2 transition-colors" style={{ color: colors.primary }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">Back to Shop</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-6">
            <div className="aspect-square rounded-3xl overflow-hidden" style={{ backgroundColor: colors.lightGreen }}>
              {product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24" style={{ color: colors.primary }} />
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                      selectedImage === index
                        ? 'shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ 
                      borderColor: selectedImage === index ? colors.primary : undefined 
                    }}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Title and Category */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="border-0 px-2 py-1 text-xs font-medium" style={{ backgroundColor: colors.lightGreen, color: colors.primary }}>
                  {product.category.name}
                </Badge>
                {product.discountPrice && (
                  <Badge className="text-white border-0 px-2 py-1 text-xs font-semibold" style={{ backgroundColor: colors.accent }}>
                    {getDiscountPercentage(product.price, product.discountPrice)}% OFF
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              {/* Seller & Location */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Store className="w-4 h-4" />
                    <span>Sold by </span>
                    <Link 
                      href={`/sellers/${product.seller.id}`}
                      className="hover:text-green-600 transition-colors font-medium"
                    >
                      {product.seller.businessName}
                    </Link>
                    {product.seller.verificationStatus === 'VERIFIED' && (
                      <span className="text-xs text-green-600">✓</span>
                    )}
                  </div>
                </div>
                {product.seller.district && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded">
                    <MapPin className="w-4 h-4" />
                    <span>{product.seller.district}</span>
                  </div>
                )}
                {product.location && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
                    <MapPin className="w-4 h-4" />
                    <span>{product.location.city}, {product.location.region}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rating */}
            {product.averageRating && (
              <div className="flex items-center gap-2">
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
                <span className="text-sm font-medium text-gray-900">
                  {product.averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-600">
                  ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                {product.discountPrice ? (
                  <>
                    <span className="text-2xl font-bold text-gray-900">
                      MWK {getCurrentPrice(product).toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      MWK {product.price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-gray-900">
                    MWK {product.price.toFixed(2)}
                  </span>
                )}
              </div>
              
              {product.stock > 0 ? (
                <div className="flex items-center gap-2" style={{ color: colors.primary }}>
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium text-sm">In Stock ({product.stock} available)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <span className="font-medium text-sm">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm text-gray-900">Quantity:</span>
                <div className="flex items-center gap-2 rounded-lg p-1" style={{ backgroundColor: colors.lightGreen }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-md hover:bg-gray-200"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-10 text-center font-semibold text-sm text-gray-900">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="w-8 h-8 rounded-md hover:bg-gray-200"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || addingToCart}
                  className="flex-1 text-white font-semibold py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: colors.accent }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                  </span>
                </Button>
                
                <Button
                  variant="outline"
                  className="rounded-lg hover:bg-gray-50 transition-all duration-300"
                  style={{ borderColor: colors.primary + '30' }}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.lightGreen }}>
                  <Truck className="w-5 h-5" style={{ color: colors.primary }} />
                </div>
                <div>
                  <p className="font-semibold">Fast Delivery</p>
                  <p className="text-sm text-gray-600">
                    {product.courierAvailable 
                      ? `MWK ${product.courierPrice || 0} - 2-3 business days`
                      : 'Standard delivery available'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.lightGreen }}>
                  <Shield className="w-5 h-5" style={{ color: colors.primary }} />
                </div>
                <div>
                  <p className="font-semibold">Secure Payment</p>
                  <p className="text-sm text-gray-600">100% secure payment processing</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description and Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          {/* Description */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white border-0 shadow-xl rounded-3xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {product.description || 'No description available for this product.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="bg-white border-0 shadow-xl rounded-3xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Customer Reviews ({reviews.length})
                </h2>
                
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">{review.user.name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.lightGreen }}>
                      <Star className="w-8 h-8" style={{ color: colors.primary }} />
                    </div>
                    <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Form */}
            {session?.user && (
              <Card className="bg-white border-0 shadow-xl rounded-3xl lg:col-span-3">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Write a Review</h3>
                  
                  <div className="space-y-4">
                    {/* Rating Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, rating }))}
                            className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 ${
                              reviewForm.rating === rating
                                ? 'text-white'
                                : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700'
                            }`}
                            style={{ 
                              borderColor: reviewForm.rating === rating ? colors.primary : undefined,
                              backgroundColor: reviewForm.rating === rating ? colors.primary : undefined
                            }}
                          >
                            <Star className={`w-4 h-4 ${
                              reviewForm.rating >= rating
                                ? 'fill-current text-current'
                                : 'text-current'
                            }`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="Share your experience with this product..."
                        rows={4}
                        className="w-full p-3 border-2 rounded-lg resize-none text-sm text-gray-900 placeholder-gray-400"
                        style={{ borderColor: colors.primary + '30' }}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmitReview}
                      disabled={submittingReview || !reviewForm.comment.trim()}
                      className="w-full text-white font-semibold py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </span>
                    </Button>
                  </div>

                  {/* Success Message */}
                  {reviewForm.successMessage && (
                    <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: colors.lightGreen, borderColor: colors.primary + '30' }}>
                      <p style={{ color: colors.primary }} className="font-medium text-sm">{reviewForm.successMessage}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {reviewForm.errorMessage && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 font-medium text-sm">{reviewForm.errorMessage}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Info */}
            <Card className="bg-white border-0 shadow-xl rounded-3xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Seller Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.lightGreen }}>
                      <Store className="w-5 h-5" style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <Link 
                        href={`/sellers/${product.seller.id}`}
                        className="font-semibold text-gray-900 hover:text-green-600 transition-colors"
                      >
                        {product.seller.businessName}
                      </Link>
                      <p className="text-sm text-gray-600">Verified Seller</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/sellers/${product.seller.id}`}>
                      <Button variant="outline" className="flex-1 rounded-xl" style={{ borderColor: colors.primary + '30' }}>
                        View Profile
                      </Button>
                    </Link>
                    <Link href={`/shop?seller=${product.seller.id}`}>
                      <Button variant="outline" className="flex-1 rounded-xl" style={{ borderColor: colors.primary + '30' }}>
                        More Products
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat with Seller */}
            <EnhancedProductChat 
              productId={product.id}
              sellerId={product.seller.userId}
              sellerName={product.seller.businessName}
              sellerImage={product.seller.businessImage}
              isOnline={true}
              showChat={showChat}
              setShowChat={setShowChat}
            />

            {/* Chat with Seller Button */}
            <Button
              onClick={() => setShowChat(true)}
              className="w-full text-white font-semibold py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
              style={{ backgroundColor: colors.accent }}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat with Seller
            </Button>

            {/* Product Details */}
            <Card className="bg-white border-0 shadow-xl rounded-3xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Product Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-semibold text-gray-900">{product.category.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock</span>
                    <span className="font-semibold text-gray-900">{product.stock} units</span>
                  </div>
                  {product.courierAvailable && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery</span>
                      <span className="font-semibold" style={{ color: colors.primary }}>Available</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Added</span>
                    <span className="font-semibold text-gray-900">
                      {product.createdAt ? formatDate(product.createdAt) : 'Recently'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductPage() {
  return (
    <>
      <style jsx>{shimmerStyle}</style>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
          <div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{ borderColor: colors.primary }}></div>
        </div>
      }>
        <ProductPageComponent />
      </Suspense>
    </>
  )
}
