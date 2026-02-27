'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, ArrowRight, User } from 'lucide-react'
import Link from 'next/link'

// Malawi Market Branding Colors
const colors = {
  primary: '#006B3F',        // Malawi Green
  secondary: '#6b7280',      // Gray-500
  accent: '#006B3F',         // Malawi Green (was blue)
  success: '#10b981',        // Emerald-500
  warning: '#f59e0b',        // Amber-500
  gold: '#eab308',           // Yellow-500
  light: '#f9fafb',         // Gray-50
  white: '#ffffff',          // White
  border: '#e5e7eb',        // Gray-200
  text: '#111827',          // Gray-900
  textSecondary: '#6b7280',   // Gray-500
  muted: '#9ca3af',         // Gray-400
}

export default function SubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  
  const status = searchParams.get('status')
  const planId = searchParams.get('planId')
  const txRef = searchParams.get('txRef')

  useEffect(() => {
    // If no status parameter, redirect to subscription plans
    if (!status) {
      router.push('/seller/subscription/plans')
      return
    }

    // Auto-redirect after 5 seconds on success
    if (status === 'success') {
      const timer = setTimeout(() => {
        router.push('/seller/profile')
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [status, router])

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.light }}>
        <div className="max-w-md w-full mx-auto p-6">
          <Card className="border" style={{ borderColor: colors.border }}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h1 className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
                Subscription Successful!
              </h1>
              
              <p className="text-lg mb-6" style={{ color: colors.textSecondary }}>
                Your subscription has been activated successfully.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold mb-2" style={{ color: colors.success }}>
                  Next Step: Complete Your Profile
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  To maximize your marketplace success, complete your seller profile with:
                </p>
                <ul className="text-sm text-left mt-3 space-y-2" style={{ color: colors.text }}>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Business information and contact details</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Profile picture and business logo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Product categories and specialties</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>District and business location</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/seller/profile')}
                  className="w-full" 
                  style={{ backgroundColor: colors.accent, color: colors.white }}
                >
                  <User className="w-4 h-4 mr-2" />
                  Complete Profile Now
                </Button>
                
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  You'll be redirected automatically in 5 seconds...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.light }}>
        <div className="max-w-md w-full mx-auto p-6">
          <Card className="border" style={{ borderColor: colors.border }}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              
              <h1 className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
                Payment Failed
              </h1>
              
              <p className="text-lg mb-6" style={{ color: colors.textSecondary }}>
                We couldn't process your subscription payment.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold mb-2" style={{ color: colors.warning }}>
                  What You Can Do:
                </h3>
                <ul className="text-sm text-left mt-3 space-y-2" style={{ color: colors.text }}>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    <span>Check your payment method details</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    <span>Ensure sufficient funds are available</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    <span>Try again with a different payment method</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/seller/subscription/plans')}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                  
                  <Button 
                    onClick={() => router.push('/seller')}
                    className="w-full"
                    style={{ backgroundColor: colors.accent, color: colors.white }}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Fallback for invalid status
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.light }}>
      <div className="max-w-md w-full mx-auto p-6">
        <Card className="border" style={{ borderColor: colors.border }}>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-gray-600" />
            </div>
            
            <h1 className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
              Invalid Status
            </h1>
            
            <p className="text-lg mb-6" style={{ color: colors.textSecondary }}>
              Invalid subscription status. Please try again.
            </p>

            <Button 
              onClick={() => router.push('/seller/subscription/plans')}
              className="w-full"
              style={{ backgroundColor: colors.accent, color: colors.white }}
            >
              View Subscription Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
