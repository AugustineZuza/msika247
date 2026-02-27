'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface SellerSubscriptionSummary {
  status?: string | null
  endDate?: string | null
}

interface SellerStatsResponse {
  subscription?: SellerSubscriptionSummary | null
}

const SUBSCRIPTION_EXEMPT_PATHS = ['/seller/subscription']

function isSubscriptionActive(subscription?: SellerSubscriptionSummary | null) {
  if (!subscription) return false
  if (subscription.status !== 'ACTIVE') return false
  if (!subscription.endDate) return false

  return new Date(subscription.endDate).getTime() > Date.now()
}

export function ActiveSubscriptionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<'checking' | 'allowed'>('checking')

  const isExemptRoute = useMemo(() => {
    if (!pathname) return false
    return SUBSCRIPTION_EXEMPT_PATHS.some((exemptPath) => pathname.startsWith(exemptPath))
  }, [pathname])

  useEffect(() => {
    if (isExemptRoute) {
      setStatus('allowed')
      return
    }

    let cancelled = false

    async function verifySubscription() {
      setStatus('checking')
      try {
        const response = await fetch('/api/seller/stats?scope=subscription', {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Unable to verify subscription')
        }

        const data = (await response.json()) as SellerStatsResponse
        const isActive = isSubscriptionActive(data.subscription)

        if (!isActive) {
          if (!cancelled) {
            const redirectTo = encodeURIComponent(pathname || '/seller')
            router.replace(`/seller/subscription?redirect=${redirectTo}`)
          }
          return
        }

        if (!cancelled) {
          setStatus('allowed')
        }
      } catch (error) {
        console.error('ActiveSubscriptionGuard error:', error)
        if (!cancelled) {
          const redirectTo = encodeURIComponent(pathname || '/seller')
          router.replace(`/seller/subscription?redirect=${redirectTo}`)
        }
      }
    }

    verifySubscription()

    return () => {
      cancelled = true
    }
  }, [isExemptRoute, pathname, router])

  if (status !== 'allowed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Checking subscription status...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
