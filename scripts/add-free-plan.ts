import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addFreePlan() {
  try {
    console.log('🌱 Adding FREE subscription plan...')

    // Check if FREE plan already exists
    const existingFreePlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'FREE' }
    })

    if (existingFreePlan) {
      console.log('✅ FREE plan already exists')
      return
    }

    // Create FREE plan
    const freePlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'FREE',
        description: 'Free trial plan for new sellers',
        monthlyPrice: 0,
        maxProducts: 5,
        maxOrders: 10,
        features: JSON.stringify(['Basic listing', 'Email support']),
        isActive: true,
        sortOrder: 0,
      },
    })

    console.log('✅ FREE plan created successfully!')
    console.log(`Plan ID: ${freePlan.id}`)

  } catch (error) {
    console.error('❌ Error adding FREE plan:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addFreePlan()
