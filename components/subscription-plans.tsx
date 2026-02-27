'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SubscriptionPlan } from '@prisma/client'

interface SubscriptionPlansProps {
  plans: SubscriptionPlan[]
  currentPlanId?: string
  onSelectPlan: (planId: string) => void
  isLoading?: boolean
}

export function SubscriptionPlans({
  plans,
  currentPlanId,
  onSelectPlan,
  isLoading = false,
}: SubscriptionPlansProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`relative ${currentPlanId === plan.id ? 'ring-2 ring-primary' : ''}`}
        >
          {currentPlanId === plan.id && (
            <Badge className="absolute top-4 right-4">Current Plan</Badge>
          )}

          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <div className="text-3xl font-bold">${plan.monthlyPrice}</div>
              <p className="text-sm text-muted-foreground">per month</p>
            </div>

            <div className="space-y-3">
              <p className="font-medium text-sm">Features:</p>
              <ul className="space-y-2">
                <li className="text-sm flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Max {plan.maxProducts} products</span>
                </li>
                {plan.maxOrders !== -1 && (
                  <li className="text-sm flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Max {plan.maxOrders} orders per month</span>
                  </li>
                )}
                {plan.maxOrders === -1 && (
                  <li className="text-sm flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Unlimited orders</span>
                  </li>
                )}
                {plan.features && Array.isArray(plan.features) ? (
                  plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))
                ) : null}
              </ul>
            </div>

            <Button
              onClick={() => onSelectPlan(plan.id)}
              disabled={isLoading || currentPlanId === plan.id}
              className="w-full"
              variant={currentPlanId === plan.id ? 'outline' : 'default'}
            >
              {currentPlanId === plan.id ? 'Current Plan' : 'Select Plan'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
