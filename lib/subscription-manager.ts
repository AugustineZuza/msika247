export interface SubscriptionPlan {
  id: string
  name: string
  monthlyPrice: number
  features: string[]
  maxProducts: number
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 9.99,
    features: ['10 products', 'Basic analytics', 'Email support'],
    maxProducts: 10,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 29.99,
    features: ['100 products', 'Advanced analytics', 'Priority support', 'Bulk uploads'],
    maxProducts: 100,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 99.99,
    features: ['Unlimited products', 'Full analytics', '24/7 support', 'API access'],
    maxProducts: 999999,
  },
]

export function getPlanById(id: string): SubscriptionPlan | undefined {
  return subscriptionPlans.find(p => p.id === id)
}

export function getSubscriptionExpiryDate(daysFromNow: number = 30): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date
}

export function isSubscriptionExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate
}

export function getDaysUntilExpiry(expiryDate: Date): number {
  const today = new Date()
  const diff = expiryDate.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 3600 * 24))
}

export function shouldSendExpiryWarning(expiryDate: Date): boolean {
  const daysLeft = getDaysUntilExpiry(expiryDate)
  return daysLeft <= 7 && daysLeft > 0
}
