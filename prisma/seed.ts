import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create categories
  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      isActive: true,
      sortOrder: 1,
    },
  })

  const clothing = await prisma.category.create({
    data: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      isActive: true,
      sortOrder: 2,
    },
  })

  const books = await prisma.category.create({
    data: {
      name: 'Books',
      slug: 'books',
      description: 'Books and educational materials',
      isActive: true,
      sortOrder: 3,
    },
  })

  // Create subscription plans
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

  const basicPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Basic',
      description: 'Perfect for beginners',
      monthlyPrice: 10000,
      maxProducts: 10,
      maxOrders: 50,
      features: JSON.stringify(['Basic analytics', 'Email support']),
      isActive: true,
      sortOrder: 1,
    },
  })

  const proPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Professional',
      description: 'For growing businesses',
      monthlyPrice: 25000,
      maxProducts: 100,
      maxOrders: 500,
      features: JSON.stringify(['Advanced analytics', 'Priority support', 'Marketing tools']),
      isActive: true,
      sortOrder: 2,
    },
  })

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 12)

  const testBuyer = await prisma.user.create({
    data: {
      email: 'buyer@test.com',
      password: hashedPassword,
      name: 'Test Buyer',
      role: 'BUYER',
    },
  })

  await prisma.buyer.create({
    data: {
      userId: testBuyer.id,
    },
  })

  const testSeller = await prisma.user.create({
    data: {
      email: 'seller@test.com',
      password: hashedPassword,
      name: 'Test Seller',
      role: 'SELLER',
    },
  })

  const sellerProfile = await prisma.seller.create({
    data: {
      userId: testSeller.id,
      businessName: 'Test Store',
      businessDescription: 'A test store for demonstration',
      verificationStatus: 'VERIFIED',
    },
  })

  // Give seller a subscription
  await prisma.subscription.create({
    data: {
      sellerId: sellerProfile.id,
      planId: freePlan.id,
      status: 'ACTIVE',
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  })

  // Create test products
  await prisma.product.createMany({
    data: [
      {
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
      {
        sellerId: sellerProfile.id,
        categoryId: electronics.id,
        name: 'Smartphone',
        slug: 'smartphone',
        description: 'Latest smartphone with amazing features',
        price: 300000,
        discountPrice: 599.99,
        stock: 25,
        images: JSON.stringify(['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9']),
        isActive: true,
      },
      {
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
      {
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
    ],
  })

  console.log('✅ Database seeded successfully!')
  console.log('📧 Test accounts:')
  console.log('   Buyer: buyer@test.com / password123')
  console.log('   Seller: seller@test.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
