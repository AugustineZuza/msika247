import { PrismaClient, SubscriptionStatus } from '@prisma/client'
import { checkAndUpdateSubscriptions } from '../lib/subscription'

const prisma = new PrismaClient()

async function runExpiryCheck() {
  console.log('🔔 Running subscription expiry check...')
  try {
    const expiredCount = await checkAndUpdateSubscriptions()
    console.log(`✅ Updated ${expiredCount} expired subscriptions`)
  } catch (error) {
    console.error('❌ Subscription expiry check failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  runExpiryCheck()
}

export { runExpiryCheck }
