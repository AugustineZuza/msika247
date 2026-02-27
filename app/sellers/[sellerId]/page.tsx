'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from '@/lib/toast'
import Link from 'next/link'
import { 
  Building, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  Calendar,
  Users,
  Award,
  Star,
  Package,
  MessageSquare,
  ExternalLink,
  Check,
  Clock,
  Shield,
  TrendingUp,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Heart,
  ShoppingCart,
  X
} from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  discountPrice?: number
  images?: string
  rating: number
  totalReviews: number
  soldCount: number
}

interface SellerProfile {
  id: string
  businessName: string
  businessDescription?: string
  businessEmail?: string
  businessPhone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  country?: string
  district?: string
  postalCode?: string
  profileImage?: string
  bio?: string
  foundedYear?: number
  teamSize?: number
  businessType?: string
  specialties?: string[]
  certifications?: string[]
  returnPolicy?: string
  shippingInfo?: string
  socialLinks?: Record<string, string>
  showcaseImages?: string[]
  achievements?: string[]
  languages?: string[]
  workingHours?: Record<string, any>
  rating?: number
  totalReviews?: number
  verificationStatus?: string
  createdAt?: string
  user: {
    name: string
    profileImage?: string
  }
  products: Product[]
  _count: {
    products: number
    orders: number
  }
}

export default function SellerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [seller, setSeller] = useState<SellerProfile | null>(null)

  useEffect(() => {
    if (params.sellerId) {
      fetchSellerProfile()
    }
  }, [params.sellerId])

  const fetchSellerProfile = async () => {
    try {
      const response = await fetch(`/api/sellers/${params.sellerId}`)
      if (response.ok) {
        const data = await response.json()
        setSeller(data.seller)
      } else if (response.status === 404) {
        toast.error('Seller not found')
        router.push('/shop')
      } else {
        toast.error('Failed to load seller profile')
      }
    } catch (error) {
      console.error('Error fetching seller profile:', error)
      toast.error('Failed to load seller profile')
    } finally {
      setLoading(false)
    }
  }

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'PLATINUM': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'GOLD': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'SILVER': return 'bg-gray-100 text-gray-600 border-gray-300'
      case 'BRONZE': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED': return { color: 'bg-green-100 text-green-800', icon: Check, text: 'Verified' }
      case 'PENDING': return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' }
      case 'REJECTED': return { color: 'bg-red-100 text-red-800', icon: X, text: 'Not Verified' }
      default: return { color: 'bg-gray-100 text-gray-800', icon: Shield, text: 'Unknown' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Seller Not Found</h1>
          <p className="text-gray-600 mb-4">The seller profile you're looking for doesn't exist.</p>
          <Link
            href="/shop"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse Shop
          </Link>
        </div>
      </div>
    )
  }

  const verificationBadge = getVerificationBadge(seller.verificationStatus || 'PENDING')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Cover */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 h-32"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden border-4 border-white shadow-lg">
                {seller.profileImage || seller.user.profileImage ? (
                  <img
                    src={seller.profileImage || seller.user.profileImage}
                    alt={seller.businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {seller.businessName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {seller.verificationStatus === 'VERIFIED' && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Business Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{seller.businessName}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${verificationBadge.color}`}>
                  <verificationBadge.icon className="w-3 h-3 mr-1" />
                  {verificationBadge.text}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                {seller.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{seller.rating.toFixed(1)}</span>
                    <span>({seller.totalReviews || 0} reviews)</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span>{seller._count.products} products</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{seller._count.orders} orders</span>
                </div>
                {seller.businessType && (
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                    {seller.businessType}
                  </span>
                )}
              </div>

              {seller.bio && (
                <p className="text-gray-700 mb-3">{seller.bio}</p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  Contact Seller
                </button>
                {seller.website && (
                  <a
                    href={seller.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Visit Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-green-600" />
                Business Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seller.foundedYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Founded {seller.foundedYear}</span>
                  </div>
                )}
                {seller.teamSize && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{seller.teamSize} team members</span>
                  </div>
                )}
                {seller.businessEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${seller.businessEmail}`} className="text-sm text-blue-600 hover:underline">
                      {seller.businessEmail}
                    </a>
                  </div>
                )}
                {seller.businessPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{seller.businessPhone}</span>
                  </div>
                )}
                {(seller.district || seller.address || seller.country) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {[seller.district, seller.address, seller.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {seller.businessDescription && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-700">{seller.businessDescription}</p>
                </div>
              )}
            </div>

            {/* Specialties & Certifications */}
            {(seller.specialties?.length || seller.certifications?.length) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  Expertise & Certifications
                </h2>
                
                {seller.specialties && seller.specialties.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {seller.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {seller.certifications && seller.certifications.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Certifications</h3>
                    <div className="space-y-2">
                      {seller.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Products */}
            {seller.products.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    Products ({seller.products.length})
                  </h2>
                  <Link
                    href={`/shop?seller=${seller.id}`}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    View All Products
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {seller.products.slice(0, 6).map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images ? (
                            <img
                              src={JSON.parse(product.images)[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/product/${product.slug}`}
                            className="block font-medium text-gray-900 hover:text-green-600 truncate"
                          >
                            {product.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-gray-600">{product.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-600">{product.totalReviews} reviews</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div>
                              {product.discountPrice ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-green-600">
                                    ${product.discountPrice}
                                  </span>
                                  <span className="text-sm text-gray-500 line-through">
                                    ${product.price}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-gray-900">
                                  ${product.price}
                                </span>
                              )}
                            </div>
                            <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trust Indicators */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trust Indicators</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <span className="text-sm font-medium text-green-600">95%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-sm font-medium text-gray-900">Within 2 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">On-Time Delivery</span>
                  <span className="text-sm font-medium text-green-600">98%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium text-gray-900">
                    {seller.createdAt ? new Date(seller.createdAt).getFullYear() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            {seller.socialLinks && Object.keys(seller.socialLinks).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect</h3>
                <div className="grid grid-cols-2 gap-3">
                  {seller.socialLinks.facebook && (
                    <a
                      href={seller.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Facebook className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Facebook</span>
                    </a>
                  )}
                  {seller.socialLinks.instagram && (
                    <a
                      href={seller.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Instagram className="w-4 h-4 text-pink-600" />
                      <span className="text-sm">Instagram</span>
                    </a>
                  )}
                  {seller.socialLinks.twitter && (
                    <a
                      href={seller.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Twitter className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">Twitter</span>
                    </a>
                  )}
                  {seller.socialLinks.linkedin && (
                    <a
                      href={seller.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Linkedin className="w-4 h-4 text-blue-700" />
                      <span className="text-sm">LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Policies */}
            {(seller.returnPolicy || seller.shippingInfo) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Policies</h3>
                <div className="space-y-4">
                  {seller.returnPolicy && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Return Policy</h4>
                      <p className="text-sm text-gray-600">{seller.returnPolicy}</p>
                    </div>
                  )}
                  {seller.shippingInfo && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Shipping</h4>
                      <p className="text-sm text-gray-600">{seller.shippingInfo}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
