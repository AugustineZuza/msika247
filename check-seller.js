const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || "mysql://root:21chase%3F%3F@127.0.0.1:3306/market" } }
});

async function checkSeller() {
  try {
    await prisma.$connect();
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'augustinezuza21@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.email);
    console.log('   ID:', user.id);
    console.log('   Role:', user.role);
    
    // Check if seller profile exists
    const seller = await prisma.seller.findUnique({
      where: { userId: user.id },
      include: {
        subscription: {
          include: { plan: true }
        }
      }
    });
    
    if (!seller) {
      console.log('❌ Seller profile not found - this is the issue!');
      console.log('Creating seller profile...');
      
      // Create missing seller profile
      const newSeller = await prisma.seller.create({
        data: {
          userId: user.id,
          businessName: `${user.name}'s Store`,
          businessDescription: 'Welcome to my store!',
          verificationStatus: 'PENDING'
        },
        include: {
          subscription: {
            include: { plan: true }
          }
        }
      });
      
      console.log('✅ Seller profile created:', newSeller.businessName);
      console.log('   ID:', newSeller.id);
      console.log('   Business Name:', newSeller.businessName);
      
      // Create a basic subscription
      const basicPlan = await prisma.subscriptionPlan.findFirst({
        where: { name: 'Basic' }
      });
      
      if (basicPlan) {
        await prisma.subscription.create({
          data: {
            sellerId: newSeller.id,
            planId: basicPlan.id,
            status: 'ACTIVE',
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          }
        });
        console.log('✅ Basic subscription created');
      }
      
    } else {
      console.log('✅ Seller profile found:', seller.businessName);
      console.log('   ID:', seller.id);
      console.log('   Business Name:', seller.businessName);
      console.log('   Verification Status:', seller.verificationStatus);
      
      if (seller.subscription) {
        console.log('   Subscription:', seller.subscription.status);
        console.log('   Plan:', seller.subscription.plan.name);
      } else {
        console.log('   Subscription: None');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSeller();
