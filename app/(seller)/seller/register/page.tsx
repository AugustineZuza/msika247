'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/header'
import { ArrowLeft, Mail, Lock, User, Building, Store } from 'lucide-react'

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

export default function SellerRegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    businessDescription: '',
    businessCategory: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' })
      return
    }

    if (!formData.agreeTerms) {
      setErrors({ agreeTerms: 'You must agree to the terms and conditions' })
      return
    }

    try {
      setLoading(true)
      setErrors({})

      // TODO: Implement actual registration logic
      console.log('Registration data:', formData)
      
      // For now, just redirect to seller dashboard
      setTimeout(() => {
        router.push('/seller/dashboard')
      }, 1000)

    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ submit: 'Registration failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Registration Form */}
          <div>
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-8">
                <div className="mx-auto w-48 h-48 flex items-center justify-center mb-4 relative">
                  <Image 
                    src="/msika247- logo.png" 
                    alt="Msika247 Logo" 
                    width={192}
                    height={192}
                    className="object-contain"
                    priority
                  />
                </div>
                <CardTitle className="text-2xl font-bold" style={{ color: colors.primary }}>
                  Create Seller Account
                </CardTitle>
                <p className="text-gray-600">
                  Join thousands of Malawian sellers on Msika247
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Business Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Store className="w-5 h-5" style={{ color: colors.primary }} />
                      Business Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessName">Business Name *</Label>
                        <Input
                          id="businessName"
                          type="text"
                          value={formData.businessName}
                          onChange={(e) => handleInputChange('businessName', e.target.value)}
                          placeholder="Enter your business name"
                          required
                        />
                        {errors.businessName && (
                          <p className="text-sm text-red-600 mt-1">{errors.businessName}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="businessEmail">Business Email *</Label>
                        <Input
                          id="businessEmail"
                          type="email"
                          value={formData.businessEmail}
                          onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                          placeholder="business@example.com"
                          required
                        />
                        {errors.businessEmail && (
                          <p className="text-sm text-red-600 mt-1">{errors.businessEmail}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessPhone">Business Phone</Label>
                        <Input
                          id="businessPhone"
                          type="tel"
                          value={formData.businessPhone}
                          onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                          placeholder="+265 999 123 456"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="businessAddress">Business Address</Label>
                        <Input
                          id="businessAddress"
                          type="text"
                          value={formData.businessAddress}
                          onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                          placeholder="Enter business address"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="businessCategory">Business Category</Label>
                      <select
                        id="businessCategory"
                        value={formData.businessCategory}
                        onChange={(e) => handleInputChange('businessCategory', e.target.value)}
                        className="w-full p-3 border-2 rounded-xl focus:ring-4 shadow-md transition-all duration-300"
                        style={{ borderColor: colors.primary + '30' }}
                      >
                        <option value="">Select a category</option>
                        <option value="electronics">Electronics & Technology</option>
                        <option value="fashion">Fashion & Clothing</option>
                        <option value="food">Food & Beverages</option>
                        <option value="home">Home & Furniture</option>
                        <option value="beauty">Beauty & Health</option>
                        <option value="agriculture">Agriculture & Farming</option>
                        <option value="automotive">Automotive</option>
                        <option value="services">Services</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="businessDescription">Business Description</Label>
                      <textarea
                        id="businessDescription"
                        value={formData.businessDescription}
                        onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                        placeholder="Describe your business..."
                        rows={4}
                        className="w-full p-3 border-2 rounded-xl focus:ring-4 shadow-md transition-all duration-300"
                        style={{ borderColor: colors.primary + '30' }}
                      />
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" style={{ color: colors.primary }} />
                      Personal Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          placeholder="Enter your first name"
                          required
                        />
                        {errors.firstName && (
                          <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          placeholder="Enter your last name"
                          required
                        />
                        {errors.lastName && (
                          <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="your@email.com"
                          required
                        />
                        {errors.email && (
                          <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+265 999 123 456"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Account Security */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5" style={{ color: colors.primary }} />
                      Account Security
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Create a strong password"
                          required
                        />
                        {errors.password && (
                          <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Confirm your password"
                          required
                        />
                        {errors.confirmPassword && (
                          <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-green-600"
                      />
                      <Label htmlFor="agreeTerms" className="text-sm">
                        I agree to the <Link href="/terms" className="text-primary hover:underline">Terms and Conditions</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                      </Label>
                    </div>
                    {errors.agreeTerms && (
                      <p className="text-sm text-red-600 mt-1">{errors.agreeTerms}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading}
                      className="w-full text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {loading ? 'Creating Account...' : 'Create Seller Account'}
                    </Button>
                  </div>

                  {/* Login Link */}
                  <div className="text-center mt-6">
                    <p className="text-gray-600">
                      Already have a seller account?{' '}
                      <Link href="/seller/login" className="text-primary hover:underline font-medium">
                        Sign In
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Section */}
          <div>
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold" style={{ color: colors.primary }}>
                  Why Sell on Msika247?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.lightGreen }}>
                      <Building className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Reach More Customers</h3>
                    <p className="text-gray-600">
                      Connect with thousands of buyers across Malawi looking for quality products
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.lightGreen }}>
                      <Store className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Easy Management</h3>
                    <p className="text-gray-600">
                      Simple tools to manage products, orders, and track your sales performance
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.lightGreen }}>
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Secure Payments</h3>
                    <p className="text-gray-600">
                      Get paid securely through PayChangu with buyer protection
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.lightGreen }}>
                      <Building className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Grow Your Business</h3>
                    <p className="text-gray-600">
                      Access analytics and insights to help your business grow and succeed
                    </p>
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
