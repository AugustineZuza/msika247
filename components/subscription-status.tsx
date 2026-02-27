'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Subscription, SubscriptionPlan } from '@prisma/client'

interface SubscriptionStatusProps {
  subscription: (Subscription & { plan: SubscriptionPlan }) | null
  isUpgradeAvailable?: boolean
  onUpgrade?: () => void
}

export function SubscriptionStatus({
  subscription,
  isUpgradeAvailable,
  onUpgrade,
}: SubscriptionStatusProps) {
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>No active subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onUpgrade}>Get Started</Button>
        </CardContent>
      </Card>
    )
  }

  const isActive = subscription.status === 'ACTIVE'
  const daysRemaining = Math.ceil(
    (subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{subscription.plan.name}</CardTitle>
            <CardDescription>Current subscription plan</CardDescription>
          </div>
          <Badge variant={isActive ? 'default' : 'destructive'}>
            {subscription.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-lg font-semibold">${subscription.plan.monthlyPrice}/month</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Expires in</p>
            <p className="text-lg font-semibold">{daysRemaining} days</p>
          </div>
        </div>

        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm font-medium mb-2">Plan Features:</p>
          <ul className="text-sm space-y-1">
            <li>• Max Products: {subscription.plan.maxProducts}</li>
            {subscription.plan.features && Array.isArray(subscription.plan.features) ? (
              subscription.plan.features.map((feature: string, idx: number) => (
                <li key={idx}>• {feature}</li>
              ))
            ) : null}
          </ul>
        </div>

        {isActive && isUpgradeAvailable && (
          <Button onClick={onUpgrade} variant="outline" className="w-full bg-transparent">
            Upgrade Plan
          </Button>
        )}

        {!isActive && (
          <Button onClick={onUpgrade} className="w-full">
            Renew Subscription
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
