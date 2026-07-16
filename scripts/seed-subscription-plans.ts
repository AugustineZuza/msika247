import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedSubscriptionPlans() {
  try {
    console.log('🌱 Starting to seed subscription plans...')

    // Check if we already have plans
    const existingPlans = await prisma.subscriptionPlan.count()
    if (existingPlans > 0) {
      console.log(`✅ Found ${existingPlans} existing plans, skipping seeding`)
      return
    }

    const plans = [
      {
        name: 'Starter',
        description: 'Perfect for small businesses just getting started',
        monthlyPrice: 15000, // MWK 15,000
        yearlyPrice: 150000, // MWK 150,000 (save ~17%)
        maxProducts: 25,
        maxOrders: 50,
        features: JSON.stringify([
          'Up to 25 products',
          'Up to 50 orders per month',
          'Basic analytics dashboard',
          'Email support',
          'Mobile app access'
        ]),
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Professional',
        description: 'Ideal for growing businesses with more needs',
        monthlyPrice: 45000, // MWK 45,000
        yearlyPrice: 450000, // MWK 450,000 (save ~17%)
        maxProducts: 100,
        maxOrders: 500,
        features: JSON.stringify([
          'Up to 100 products',
          'Up to 500 orders per month',
          'Advanced analytics',
          'Priority email support',
          'Mobile app access',
          'Promotional tools',
          'Inventory management'
        ]),
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Enterprise',
        description: 'For large businesses with high volume needs',
        monthlyPrice: 120000, // MWK 120,000
        yearlyPrice: 1200000, // MWK 1,200,000 (save ~17%)
        maxProducts: -1, // Unlimited
        maxOrders: -1, // Unlimited
        features: JSON.stringify([
          'Unlimited products',
          'Unlimited orders',
          'Premium analytics & insights',
          '24/7 phone support',
          'Mobile app access',
          'Advanced promotional tools',
          'Inventory management',
          'API access',
          'Custom branding',
          'Dedicated account manager'
        ]),
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Trial',
        description: 'Try our platform with limited features',
        monthlyPrice: 0, // Free
        yearlyPrice: null,
        maxProducts: 5,
        maxOrders: 10,
        features: JSON.stringify([
          'Up to 5 products',
          'Up to 10 orders per month',
          'Basic dashboard',
          'Community support'
        ]),
        isActive: false, // Hidden by default
        sortOrder: 0
      }
    ]

    for (const plan of plans) {
      await prisma.subscriptionPlan.create({
        data: plan
      })
      console.log(`✅ Created plan: ${plan.name}`)
    }

    console.log(`🎉 Successfully created ${plans.length} subscription plans`)

  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedSubscriptionPlans()
