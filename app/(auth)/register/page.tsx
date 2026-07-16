'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signIn, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Shield, Sparkles, Store, ShoppingBag, MapPin, User, Building } from 'lucide-react'

// Add custom scrollbar styles
const scrollbarStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    scrollbar-width: none;  /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Safari and Chrome */
  }
`

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

interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: 'BUYER' | 'SELLER'
  businessName?: string
}

function RegisterContent() {
  const router = useRouter()
  const { data: session } = useSession()
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'BUYER',
    businessName: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const message = urlParams.get('message')
    if (message) {
      setSuccessMessage(message)
      router.replace('/register')
    }
  }, [router])

  useEffect(() => {
    if (session?.user?.role) {
      const redirectPath = session.user.role === 'BUYER' ? '/shop' : 
                          session.user.role === 'SELLER' ? '/seller' : 
                          session.user.role === 'ADMIN' ? '/admin' : '/'
      router.replace(redirectPath)
    }
  }, [session, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('Registration successful! Please sign in.')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('An error occurred during registration')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style jsx>{scrollbarStyles}</style>
      <div className="h-screen flex bg-gray-50 relative overflow-hidden">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: 'url(/login-bg.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        </div>

        {/* Right Side - Register Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-green-200 to-green-300 rounded-full opacity-30 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-full opacity-25 blur-2xl"></div>
            <div className="absolute top-1/2 right-10 w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full opacity-20 blur-xl"></div>
          </div>

          <div className="w-full max-w-lg relative z-10 max-h-full overflow-y-auto scrollbar-hide">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="relative group">
                <Image 
                  src="/msika247- logo.png" 
                  alt="Msika247 Logo" 
                  width={60}
                  height={60}
                  className="object-contain transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full blur-2xl scale-150 opacity-0 group-hover:opacity-60 transition-all duration-500"></div>
              </div>
            </div>

            <Card className="border-0 shadow-2xl bg-white/98 backdrop-blur-sm transform transition-all duration-500 hover:shadow-3xl hover:scale-[1.01] w-full">
              <CardHeader className="space-y-4 pb-6 px-6 pt-8">
                <div className="text-center">
                  <div className="hidden lg:flex justify-center mb-4">
                    <div className="relative group">
                      <Image 
                        src="/msika247- logo.png" 
                        alt="Msika247 Logo" 
                        width={80}
                        height={80}
                        className="object-contain transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full blur-2xl scale-150 opacity-0 group-hover:opacity-60 transition-all duration-500"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Create Account</h2>
                    <p className="text-gray-600 text-lg font-medium">Join Msika247 marketplace</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 px-6 pb-8">
                {/* Success/Error Messages */}
                {successMessage && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-3 transform transition-all duration-500 animate-pulse">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    {successMessage}
                  </div>
                )}
                {error && (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-3 transform transition-all duration-500">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    {error}
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                      Full Name
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-all duration-300">
                        <User className="w-5 h-5" />
                      </div>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-12 pl-12 pr-4 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-2xl transition-all duration-300 text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm text-lg w-full"
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-all duration-300">
                        <Mail className="w-5 h-5" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-12 pl-12 pr-4 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-2xl transition-all duration-300 text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm text-lg w-full"
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Role Field */}
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                      Account Type
                    </label>
                    <div className="relative group">
                      <Select value={formData.role} onValueChange={(value: 'BUYER' | 'SELLER') => setFormData({ ...formData, role: value })}>
                        <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-2xl transition-all duration-300 text-gray-900 bg-white/50 backdrop-blur-sm">
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BUYER" className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" />
                            Buyer
                          </SelectItem>
                          <SelectItem value="SELLER" className="flex items-center gap-2">
                            <Store className="w-4 h-4" />
                            Seller
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Business Name Field (for Sellers) */}
                  {formData.role === 'SELLER' && (
                    <div className="space-y-2">
                      <label htmlFor="businessName" className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                        Shop Name
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-all duration-300">
                          <Building className="w-5 h-5" />
                        </div>
                        <Input
                          id="businessName"
                          type="text"
                          placeholder="My Shop"
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          required={formData.role === 'SELLER'}
                          disabled={isLoading}
                          className="h-12 pl-12 pr-4 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-2xl transition-all duration-300 text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm text-lg w-full"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-all duration-300">
                        <Lock className="w-5 h-5" />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-12 pl-12 pr-14 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-2xl transition-all duration-300 text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm text-lg w-full"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-all duration-300 p-2 rounded-lg hover:bg-green-50"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <div className="absolute right-12 top-1/2 transform -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-all duration-300">
                        <Lock className="w-5 h-5" />
                      </div>
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-12 pl-12 pr-14 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-2xl transition-all duration-300 text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm text-lg w-full"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-all duration-300 p-2 rounded-lg hover:bg-green-50"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <div className="absolute right-12 top-1/2 transform -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:via-green-800 hover:to-green-900 text-white font-bold shadow-xl transform transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] rounded-2xl text-lg relative overflow-hidden group" 
                    disabled={isLoading}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-5 h-5 transform transition-transform duration-300 group-hover:scale-110" />
                        Create Account
                      </div>
                    )}
                  </Button>
                </form>

                {/* Login Link */}
                <div className="text-center pt-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Already have an account?</span>
                    <Link 
                      href="/login" 
                      className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-bold transition-all duration-300 group relative"
                    >
                      <LogIn className="w-4 h-4 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                      <span className="underline underline-offset-2 group-hover:underline-offset-4 decoration-2">Sign In</span>
                    </Link>
                  </div>
                </div>

                {/* Footer Links */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-8 text-sm">
                    <Link 
                      href="/help" 
                      className="text-gray-500 hover:text-green-600 transition-all duration-300 font-medium hover:underline underline-offset-4"
                    >
                      Help Center
                    </Link>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <Link 
                      href="/privacy" 
                      className="text-gray-500 hover:text-green-600 transition-all duration-300 font-medium hover:underline underline-offset-4"
                    >
                      Privacy Policy
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Trust Badge */}
            <div className="lg:hidden mt-6 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full text-sm text-gray-700 font-medium shadow-lg">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Secure & Trusted Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    }>
      <RegisterContent />
    </React.Suspense>
  )
}
