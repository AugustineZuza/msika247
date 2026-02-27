const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || "mysql://root:21chase%3F%3F@127.0.0.1:3306/market" } }
});

async function createSubscription() {
  try {
    await prisma.$connect();
    
    // Find the user first, then the seller
    const user = await prisma.user.findUnique({
      where: { email: 'augustinezuza21@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    const seller = await prisma.seller.findUnique({
      where: { userId: user.id }
    });
    
    if (!seller) {
      console.log('❌ Seller not found');
      return;
    }
    
    console.log('✅ Seller found:', seller.businessName);
    
    // Find the Basic plan
    const basicPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'Basic' }
    });
    
    if (!basicPlan) {
      console.log('❌ Basic plan not found');
      return;
    }
    
    console.log('✅ Basic plan found:', basicPlan.name);
    
    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { sellerId: seller.id }
    });
    
    if (existingSubscription) {
      console.log('✅ Subscription already exists');
      console.log('   Status:', existingSubscription.status);
      console.log('   Plan:', existingSubscription.planId);
      return;
    }
    
    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        sellerId: seller.id,
        planId: basicPlan.id,
        status: 'ACTIVE',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      include: {
        plan: true
      }
    });
    
    console.log('✅ Subscription created successfully!');
    console.log('   Plan:', subscription.plan.name);
    console.log('   Status:', subscription.status);
    console.log('   End Date:', subscription.endDate);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSubscription();
