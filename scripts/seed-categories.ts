import { PrismaClient } from '@prisma/client'
import { DATABASE_CATEGORIES } from '../lib/categories'

const prisma = new PrismaClient()

async function seedCategories() {
  try {
    console.log('🌱 Starting to seed categories...')

    for (const category of DATABASE_CATEGORIES) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          description: category.description,
          isActive: true
        },
        create: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          isActive: true
        }
      })
    }

    console.log(`✅ Created/updated ${DATABASE_CATEGORIES.length} categories`)

  } catch (error) {
    console.error('❌ Error seeding categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCategories()
