'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react'

interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  monthlyPrice: number
  yearlyPrice?: number | null
  maxProducts?: number | null
  features?: string | string[] | null
}

interface SubscriptionSummary {
  id: string
  status: string
  startDate: string
  endDate: string
  isActive: boolean
  plan: {
    id: string
    name: string
  }
}

interface PlansResponse {
  plans: SubscriptionPlan[]
  subscription: SubscriptionSummary | null
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value)

const parseFeatures = (features?: string | string[] | null): string[] => {
  if (!features) return []
  if (Array.isArray(features)) return features

  try {
    const parsed = JSON.parse(features)
    if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string')
  } catch (_error) {
    return features.split(',').map((item) => item.trim()).filter(Boolean)
  }

  return []
}

export default function SellerSubscriptionPage() {
  const searchParams = useSearchParams()
  const failureStatus = searchParams?.get('status') === 'failed'
  const successStatus = searchParams?.get('status') === 'success'

  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null)
  const [pendingTxRef, setPendingTxRef] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/seller/subscriptions/plans', { cache: 'no-store' })

      if (!response.ok) {
        throw new Error('Failed to load subscription plans')
      }

      const data = (await response.json()) as PlansResponse
      setPlans(data.plans)
      setSubscription(data.subscription)
    } catch (err) {
      console.error(err)
      setError((err as Error).message || 'Unable to load plans right now.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubscribe = async (planId: string) => {
    try {
      setCheckoutPlan(planId)
      const response = await fetch('/api/seller/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) {
        const data = await response.json()
        
        // Handle specific network errors
        if (data.code === 'NETWORK_ERROR') {
          throw new Error('Payment service is temporarily unavailable. Please try again in a few minutes.')
        }
        
        throw new Error(data.error || 'Failed to start checkout')
      }

      const data = await response.json()
      
      // In test mode, show manual verification option
      if (data.checkoutUrl && data.checkoutUrl.includes('test-checkout.paychangu.com')) {
        toast({
          title: 'Test Mode Detected',
          description: 'In test mode, please complete the payment and then click "Verify Payment" below.',
          variant: 'default',
        })
        
        // Store txRef for manual verification
        setPendingTxRef(data.txRef)
        window.open(data.checkoutUrl, '_blank')
        return
      }
      
      window.location.href = data.checkoutUrl
    } catch (err) {
      console.error(err)
      toast({
        title: 'Checkout failed',
        description: (err as Error).message || 'Unable to start payment session. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCheckoutPlan(null)
    }
  }

  const handleManualVerification = async () => {
    if (!pendingTxRef) {
      toast({
        title: 'No pending payment',
        description: 'Please start a subscription first.',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/paychangu/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txRef: pendingTxRef }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Payment verified',
          description: 'Your subscription has been activated successfully!',
          variant: 'default',
        })
        setPendingTxRef(null)
        // Refresh subscription status
        window.location.reload()
      } else {
        toast({
          title: 'Verification failed',
          description: data.error || 'Unable to verify payment. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Manual verification error:', err)
      toast({
        title: 'Verification failed',
        description: 'Unable to verify payment. Please contact support.',
        variant: 'destructive',
      })
    }
  }

  const sortedPlans = useMemo(() =>
    [...plans].sort((a, b) => a.monthlyPrice - b.monthlyPrice),
  [plans])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto py-16 px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-10 bg-slate-200 rounded" />
                  <div className="h-4 bg-slate-200 rounded" />
                  <div className="h-4 bg-slate-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Unable to load plans</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchData}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="space-y-3 text-center">
          <Badge className="px-3 py-1 bg-slate-900/90 text-white uppercase tracking-wide">Seller Subscription</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Choose a plan and unlock your storefront
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Active subscription is required to publish products, accept orders, and access full analytics. Pick the plan
            that fits your inventory and growth goals.
          </p>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            💡 <strong>Important:</strong> Your products will be hidden and orders paused if your subscription expires. Renew promptly to keep selling.
          </p>
        </div>

        {failureStatus && (
          <Alert variant="destructive">
            <AlertTitle>Payment failed</AlertTitle>
            <AlertDescription>
              Your last payment attempt didn’t complete. Please try again or contact support if the problem persists.
            </AlertDescription>
          </Alert>
        )}

        {successStatus && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <AlertTitle>Payment successful!</AlertTitle>
            <AlertDescription>
              Your subscription has been activated. You can now start selling on the marketplace.
            </AlertDescription>
          </Alert>
        )}

        {subscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-green-200 bg-green-50 p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-green-800 uppercase tracking-wide">Current plan</p>
              <p className="text-2xl font-bold text-green-900">{subscription.plan.name}</p>
              <p className="text-sm text-green-700">
                Renews on {new Date(subscription.endDate).toLocaleDateString()} · Status: {subscription.status}
              </p>
            </div>
            <Link href="/seller">
              <Button className="bg-green-700 text-white hover:bg-green-800">
                Go to dashboard
              </Button>
            </Link>
          </motion.div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {sortedPlans.map((plan, index) => {
            const features = parseFeatures(plan.features)
            const isCurrent = subscription?.plan?.id === plan.id

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full flex flex-col ${isCurrent ? 'border-slate-900 shadow-xl' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                        <CardDescription>{plan.description || 'Flexible plan for sellers of all sizes.'}</CardDescription>
                      </div>
                      {index === sortedPlans.length - 1 && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-0">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <div className="mt-6">
                      <p className="text-4xl font-extrabold tracking-tight text-slate-900">
                        {formatCurrency(plan.monthlyPrice)}
                        <span className="text-base font-medium text-slate-500">/month</span>
                      </p>
                      {plan.maxProducts && (
                        <p className="mt-2 text-sm text-slate-600">Up to {plan.maxProducts} products</p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <Separator className="my-4" />
                    <ul className="space-y-3 text-sm text-slate-600">
                      {features.length === 0 ? (
                        <li className="text-slate-400">No features listed</li>
                      ) : (
                        features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-slate-900" />
                            {feature}
                          </li>
                        ))
                      )}
                    </ul>
                    <div className="mt-6">
                      <Button
                        disabled={checkoutPlan === plan.id || isCurrent}
                        onClick={() => handleSubscribe(plan.id)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                      >
                        {isCurrent ? 'Current plan' : checkoutPlan === plan.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                          </>
                        ) : (
                          'Subscribe'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Manual Verification Section */}
        {pendingTxRef && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Manual Payment Verification</h3>
              <p className="text-green-700 mb-4">
                Complete your test payment and click the button below to verify and activate your subscription.
              </p>
              <Button
                onClick={handleManualVerification}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Verify Payment
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-800">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900">Why subscriptions?</h2>
              <p className="text-slate-600">
                Subscription fees cover marketplace operations, fraud protection, dedicated seller support, and new feature
                development. This keeps Markert sustainable while giving you best-in-class tools to sell with confidence.
              </p>
              <ul className="text-slate-600 space-y-1 text-sm">
                <li>• Products remain visible and purchasable only while your subscription is active.</li>
                <li>• Expired plans automatically pause your storefront until you renew.</li>
                <li>• You can upgrade or downgrade plans at any time — we’ll align billing on renewal.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
