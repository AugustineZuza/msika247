import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCategories() {
  try {
    console.log('🌱 Starting to seed categories...')

    const categories = [
      {
        name: 'Electronics & Technology',
        slug: 'electronics-technology',
        description: 'Electronic devices, gadgets, and technology products'
      },
      {
        name: 'Fashion & Clothing',
        slug: 'fashion-clothing',
        description: 'Clothing, accessories, and fashion items'
      },
      {
        name: 'Beauty, Health & Personal Care',
        slug: 'beauty-health-personal-care',
        description: 'Beauty products, health items, and personal care essentials'
      },
      {
        name: 'Home, Furniture & Appliances',
        slug: 'home-furniture-appliances',
        description: 'Furniture, home decor, and household appliances'
      },
      {
        name: 'Food, Groceries & Beverages',
        slug: 'food-groceries-beverages',
        description: 'Food items, groceries, and beverages'
      },
      {
        name: 'Baby, Kids & Toys',
        slug: 'baby-kids-toys',
        description: 'Baby products, kids items, and toys'
      },
      {
        name: 'Sports, Fitness & Outdoor',
        slug: 'sports-fitness-outdoor',
        description: 'Sports equipment, fitness gear, and outdoor items'
      },
      {
        name: 'Automotive & Motor Accessories',
        slug: 'automotive-motor-accessories',
        description: 'Car parts, motor accessories, and automotive supplies'
      },
      {
        name: 'Tools, Hardware & Industrial',
        slug: 'tools-hardware-industrial',
        description: 'Tools, hardware, and industrial equipment'
      },
      {
        name: 'Books, Education & Stationery',
        slug: 'books-education-stationery',
        description: 'Books, educational materials, and stationery supplies'
      },
      {
        name: 'Agriculture & Farming',
        slug: 'agriculture-farming',
        description: 'Agricultural products, farming equipment, and supplies'
      }
    ]

    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category
      })
    }

    console.log(`✅ Created/updated ${categories.length} categories`)

  } catch (error) {
    console.error('❌ Error seeding categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCategories()
