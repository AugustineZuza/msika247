import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedProducts() {
  try {
    console.log('🌱 Starting to seed products...')

    // Check if we already have products
    const existingProducts = await prisma.product.count()
    if (existingProducts > 0) {
      console.log(`✅ Found ${existingProducts} existing products, skipping seeding`)
      return
    }

    // Get or create a sample category
    let category = await prisma.category.findFirst({
      where: { name: 'Electronics' }
    })

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic devices and accessories'
        }
      })
    }

    // Get or create a sample seller
    let seller = await prisma.seller.findFirst({
      include: { user: true }
    })

    if (!seller) {
      // Create a sample user first
      const user = await prisma.user.findFirst({
        where: { role: 'SELLER' }
      })

      if (user) {
        seller = await prisma.seller.create({
          data: {
            userId: user.id,
            businessName: 'Tech Store',
            verificationStatus: 'VERIFIED'
          },
          include: { user: true }
        })
      }
    }

    if (!seller) {
      console.log('❌ No seller found, please create a seller user first')
      return
    }

    // Create sample products
    const sampleProducts = [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium noise-cancelling wireless headphones with 30-hour battery life and superior sound quality.',
        price: 45000,
        discountPrice: 35000,
        stock: 15,
        images: JSON.stringify(['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400']),
        slug: 'wireless-bluetooth-headphones',
        categoryId: category.id,
        sellerId: seller.id,
        courierAvailable: true,
        courierPrice: 2000,
        isActive: true
      },
      {
        name: 'Smart Watch Pro',
        description: 'Advanced fitness tracking smartwatch with heart rate monitor, GPS, and 7-day battery life.',
        price: 85000,
        discountPrice: null,
        stock: 8,
        images: JSON.stringify(['https://images.unsplash.com/photo-1523275335684-e7893fc1069c?w=400']),
        slug: 'smart-watch-pro',
        categoryId: category.id,
        sellerId: seller.id,
        courierAvailable: true,
        courierPrice: 1500,
        isActive: true
      },
      {
        name: 'Laptop Backpack',
        description: 'Water-resistant laptop backpack with USB charging port and multiple compartments.',
        price: 25000,
        discountPrice: 18000,
        stock: 25,
        images: JSON.stringify(['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400']),
        slug: 'laptop-backpack',
        categoryId: category.id,
        sellerId: seller.id,
        courierAvailable: true,
        courierPrice: 1000,
        isActive: true
      },
      {
        name: 'Wireless Charging Pad',
        description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
        price: 12000,
        discountPrice: null,
        stock: 30,
        images: JSON.stringify(['https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400']),
        slug: 'wireless-charging-pad',
        categoryId: category.id,
        sellerId: seller.id,
        courierAvailable: true,
        courierPrice: 800,
        isActive: true
      },
      {
        name: 'Portable Bluetooth Speaker',
        description: 'Waterproof portable speaker with 360° sound and 12-hour battery life.',
        price: 18000,
        discountPrice: 15000,
        stock: 20,
        images: JSON.stringify(['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400']),
        slug: 'portable-bluetooth-speaker',
        categoryId: category.id,
        sellerId: seller.id,
        courierAvailable: true,
        courierPrice: 1200,
        isActive: true
      }
    ]

    // Create products
    for (const productData of sampleProducts) {
      await prisma.product.create({
        data: productData
      })
    }

    console.log(`✅ Created ${sampleProducts.length} sample products`)

    // Add some sample reviews
    const createdProducts = await prisma.product.findMany({
      take: 3,
      select: { id: true }
    })

    const sampleReviews = [
      { rating: 5, comment: 'Excellent product! Highly recommended.' },
      { rating: 4, comment: 'Good quality, exactly as described.' },
      { rating: 5, comment: 'Fast shipping and great customer service.' },
      { rating: 3, comment: 'Decent product for the price.' },
      { rating: 5, comment: 'Amazing quality, will buy again!' }
    ]

    for (const product of createdProducts) {
      for (let i = 0; i < 2; i++) {
        const review = sampleReviews[Math.floor(Math.random() * sampleReviews.length)]
        await prisma.review.create({
          data: {
            productId: product.id,
            userId: seller.userId, // Use seller as reviewer for demo
            rating: review.rating,
            comment: review.comment
          }
        })
      }
    }

    console.log('✅ Added sample reviews')

  } catch (error) {
    console.error('❌ Error seeding products:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedProducts()
