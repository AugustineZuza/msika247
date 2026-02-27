import { prisma } from './prisma'
import { SubscriptionStatus } from '@prisma/client'

export async function checkAndUpdateSubscriptions() {
  const now = new Date()

  // Find all active subscriptions that have expired
  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      endDate: {
        lte: now,
      },
    },
  })

  // Update expired subscriptions and deactivate sellers
  for (const subscription of expiredSubscriptions) {
    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.EXPIRED },
    })

    // Deactivate seller
    await prisma.seller.update({
      where: { id: subscription.sellerId },
      data: { isActive: false },
    })

    // Deactivate all seller's products
    await prisma.product.updateMany({
      where: { sellerId: subscription.sellerId },
      data: { isActive: false },
    })
  }

  return expiredSubscriptions.length
}

export async function createSubscription(params: {
  sellerId: string
  planId: string
  stripeSubscriptionId: string
  endDate: Date
}) {
  return prisma.subscription.create({
    data: {
      sellerId: params.sellerId,
      planId: params.planId,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      endDate: params.endDate,
      autoRenew: true,
    },
  })
}

export async function getSellerSubscriptionStatus(sellerId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { sellerId },
    include: { plan: true },
  })

  return subscription
}

export async function isSellerSubscriptionActive(sellerId: string): Promise<boolean> {
  const subscription = await getSellerSubscriptionStatus(sellerId)
  return subscription?.status === SubscriptionStatus.ACTIVE
}
