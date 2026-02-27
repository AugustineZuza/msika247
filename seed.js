const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Create categories (using upsert to handle existing data)
    const electronics = await prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        isActive: true,
        sortOrder: 1,
      },
    });

    const clothing = await prisma.category.upsert({
      where: { slug: 'clothing' },
      update: {},
      create: {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        isActive: true,
        sortOrder: 2,
      },
    });

    const books = await prisma.category.upsert({
      where: { slug: 'books' },
      update: {},
      create: {
        name: 'Books',
        slug: 'books',
        description: 'Books and educational materials',
        isActive: true,
        sortOrder: 3,
      },
    });

    // Create subscription plans (using findOrCreate pattern)
    let basicPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'Basic' }
    });
    
    if (!basicPlan) {
      basicPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Basic',
          description: 'Perfect for beginners',
          monthlyPrice: 9.99,
          maxProducts: 10,
          maxOrders: 50,
          features: JSON.stringify(['Basic analytics', 'Email support']),
          isActive: true,
          sortOrder: 1,
        },
      });
    }

    let proPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'Professional' }
    });
    
    if (!proPlan) {
      proPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Professional',
          description: 'For growing businesses',
          monthlyPrice: 29.99,
          maxProducts: 100,
          maxOrders: 500,
          features: JSON.stringify(['Advanced analytics', 'Priority support', 'Marketing tools']),
          isActive: true,
          sortOrder: 2,
        },
      });
    }

    // Create test users (using upsert)
    const hashedPassword = await bcrypt.hash('password123', 12);

    const testBuyer = await prisma.user.upsert({
      where: { email: 'buyer@test.com' },
      update: {},
      create: {
        email: 'buyer@test.com',
        password: hashedPassword,
        name: 'Test Buyer',
        role: 'BUYER',
      },
    });

    await prisma.buyer.upsert({
      where: { userId: testBuyer.id },
      update: {},
      create: {
        userId: testBuyer.id,
      },
    });

    const testSeller = await prisma.user.upsert({
      where: { email: 'seller@test.com' },
      update: {},
      create: {
        email: 'seller@test.com',
        password: hashedPassword,
        name: 'Test Seller',
        role: 'SELLER',
      },
    });

    const sellerProfile = await prisma.seller.upsert({
      where: { userId: testSeller.id },
      update: {},
      create: {
        userId: testSeller.id,
        businessName: 'Test Store',
        businessDescription: 'A test store for demonstration',
        verificationStatus: 'VERIFIED',
      },
    });

    // Give seller a subscription (using upsert)
    await prisma.subscription.upsert({
      where: { sellerId: sellerProfile.id },
      update: {},
      create: {
        sellerId: sellerProfile.id,
        planId: basicPlan.id,
        status: 'ACTIVE',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // Create test products (using upsert on slug)
    await prisma.product.upsert({
      where: { slug: 'wireless-headphones' },
      update: {},
      create: {
        sellerId: sellerProfile.id,
        categoryId: electronics.id,
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 99.99,
        stock: 50,
        images: JSON.stringify(['https://images.unsplash.com/photo-1505740420928-5e560c06d30e']),
        isActive: true,
      },
    });

    await prisma.product.upsert({
      where: { slug: 'smartphone' },
      update: {},
      create: {
        sellerId: sellerProfile.id,
        categoryId: electronics.id,
        name: 'Smartphone',
        slug: 'smartphone',
        description: 'Latest smartphone with amazing features',
        price: 699.99,
        discountPrice: 599.99,
        stock: 25,
        images: JSON.stringify(['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9']),
        isActive: true,
      },
    });

    await prisma.product.upsert({
      where: { slug: 'cotton-t-shirt' },
      update: {},
      create: {
        sellerId: sellerProfile.id,
        categoryId: clothing.id,
        name: 'Cotton T-Shirt',
        slug: 'cotton-t-shirt',
        description: 'Comfortable 100% cotton t-shirt',
        price: 19.99,
        stock: 100,
        images: JSON.stringify(['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab']),
        isActive: true,
      },
    });

    await prisma.product.upsert({
      where: { slug: 'javascript-guide' },
      update: {},
      create: {
        sellerId: sellerProfile.id,
        categoryId: books.id,
        name: 'JavaScript Guide',
        slug: 'javascript-guide',
        description: 'Complete guide to JavaScript programming',
        price: 29.99,
        stock: 30,
        images: JSON.stringify(['https://images.unsplash.com/photo-1532012197267-da84d127e765']),
        isActive: true,
      },
    });

    console.log('✅ Database seeded successfully!');
    console.log('📧 Test accounts:');
    console.log('   Buyer: buyer@test.com / password123');
    console.log('   Seller: seller@test.com / password123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
