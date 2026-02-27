const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://root:21chase%3F%3F@127.0.0.1:3306/market"
    },
  },
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test query
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    // Test buyer query
    const buyerCount = await prisma.buyer.count();
    console.log(`✅ Found ${buyerCount} buyers in database`);
    
    // Test specific user
    const testBuyer = await prisma.user.findFirst({
      where: { email: 'buyer@test.com' }
    });
    
    if (testBuyer) {
      console.log(`✅ Test buyer found: ${testBuyer.email} (ID: ${testBuyer.id})`);
      
      const buyerProfile = await prisma.buyer.findUnique({
        where: { userId: testBuyer.id }
      });
      
      if (buyerProfile) {
        console.log(`✅ Buyer profile found: ${buyerProfile.id}`);
      } else {
        console.log('❌ Buyer profile not found for test user');
      }
    } else {
      console.log('❌ Test buyer not found');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
