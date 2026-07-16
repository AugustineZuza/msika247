import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Function to generate placeholder image URLs
function getImageUrl(category: string, name: string): string {
  const colors: { [key: string]: string } = {
    electronics: '3b82f6',
    clothing: 'ec4899',
    books: '8b5cf6',
    'home-garden': '10b981',
    sports: 'f59e0b',
    beauty: 'f43f5e',
  }
  const color = colors[category] || '6b7280'
  const text = name.replace(/[^a-zA-Z0-9]/g, '+')
  return `https://placehold.co/400x400/${color}/white?text=${text}`
}

const productData = [
  // Electronics
  { name: 'Wireless Headphones', price: 79.99, category: 'electronics' },
  { name: 'Smart Watch', price: 299.99, category: 'electronics' },
  { name: '4K Smart TV 55"', price: 499.99, category: 'electronics' },
  { name: 'Laptop Pro 15"', price: 1299.99, category: 'electronics' },
  { name: 'Gaming Mouse', price: 49.99, category: 'electronics' },
  { name: 'Mechanical Keyboard', price: 129.99, category: 'electronics' },
  { name: 'Bluetooth Speaker', price: 59.99, category: 'electronics' },
  { name: 'Wireless Earbuds', price: 149.99, category: 'electronics' },
  { name: 'Webcam HD', price: 89.99, category: 'electronics' },
  { name: 'Power Bank 20000mAh', price: 44.99, category: 'electronics' },
  { name: 'Wireless Router', price: 79.99, category: 'electronics' },
  { name: 'External SSD 1TB', price: 119.99, category: 'electronics' },
  { name: 'Smart Light Bulb', price: 34.99, category: 'electronics' },
  { name: 'Tablet 10-inch', price: 329.99, category: 'electronics' },
  { name: 'Smartphone 128GB', price: 699.99, category: 'electronics' },
  
  // Clothing
  { name: 'Classic Jeans', price: 59.99, category: 'clothing' },
  { name: 'Polo Shirt', price: 34.99, category: 'clothing' },
  { name: 'Winter Hoodie', price: 49.99, category: 'clothing' },
  { name: 'Running Sneakers', price: 89.99, category: 'clothing' },
  { name: 'Casual Dress', price: 69.99, category: 'clothing' },
  { name: 'Denim Jacket', price: 79.99, category: 'clothing' },
  { name: 'Athletic Leggings', price: 39.99, category: 'clothing' },
  { name: 'Formal Blazer', price: 149.99, category: 'clothing' },
  { name: 'Summer Shorts', price: 29.99, category: 'clothing' },
  { name: 'Knit Sweater', price: 54.99, category: 'clothing' },
  { name: 'Canvas Sneakers', price: 59.99, category: 'clothing' },
  { name: 'Leather Belt', price: 24.99, category: 'clothing' },
  { name: 'Wool Scarf', price: 29.99, category: 'clothing' },
  { name: 'Baseball Cap', price: 19.99, category: 'clothing' },
  { name: 'Sunglasses', price: 44.99, category: 'clothing' },
  
  // Books
  { name: 'The Great Novel', price: 24.99, category: 'books' },
  { name: 'JavaScript Mastery', price: 39.99, category: 'books' },
  { name: 'Cooking Adventures', price: 29.99, category: 'books' },
  { name: 'History of Art', price: 49.99, category: 'books' },
  { name: 'Sci-Fi Collection', price: 34.99, category: 'books' },
  { name: 'Self-Help Guide', price: 19.99, category: 'books' },
  { name: 'Business Strategy', price: 44.99, category: 'books' },
  { name: 'Children Story', price: 14.99, category: 'books' },
  { name: 'Photography Basics', price: 29.99, category: 'books' },
  { name: 'Travel Diary', price: 22.99, category: 'books' },
  { name: 'Mystery Thriller', price: 27.99, category: 'books' },
  { name: 'Poetry Collection', price: 18.99, category: 'books' },
  { name: 'Fitness Guide', price: 24.99, category: 'books' },
  { name: 'Philosophy 101', price: 32.99, category: 'books' },
  { name: 'Gardening Tips', price: 21.99, category: 'books' },
  
  // Home & Garden
  { name: 'Coffee Table', price: 199.99, category: 'home-garden' },
  { name: 'Floor Lamp LED', price: 79.99, category: 'home-garden' },
  { name: 'Throw Pillows', price: 39.99, category: 'home-garden' },
  { name: 'Wall Art Canvas', price: 59.99, category: 'home-garden' },
  { name: 'Plant Pot', price: 24.99, category: 'home-garden' },
  { name: 'Area Rug 5x7', price: 149.99, category: 'home-garden' },
  { name: 'Storage Ottoman', price: 89.99, category: 'home-garden' },
  { name: 'Curtain Panels', price: 49.99, category: 'home-garden' },
  { name: 'Kitchen Organizer', price: 34.99, category: 'home-garden' },
  { name: 'Bed Sheet Set', price: 44.99, category: 'home-garden' },
  { name: 'Bath Towel Set', price: 29.99, category: 'home-garden' },
  { name: 'Shower Curtain', price: 19.99, category: 'home-garden' },
  { name: 'Laundry Hamper', price: 39.99, category: 'home-garden' },
  { name: 'Coat Rack', price: 59.99, category: 'home-garden' },
  { name: 'Wall Mirror', price: 69.99, category: 'home-garden' },
  
  // Sports
  { name: 'Yoga Mat', price: 39.99, category: 'sports' },
  { name: 'Dumbbell Set', price: 89.99, category: 'sports' },
  { name: 'Running Shoes', price: 129.99, category: 'sports' },
  { name: 'Basketball', price: 29.99, category: 'sports' },
  { name: 'Tennis Racket', price: 149.99, category: 'sports' },
  { name: 'Soccer Ball', price: 24.99, category: 'sports' },
  { name: 'Swimming Goggles', price: 19.99, category: 'sports' },
  { name: 'Camping Tent', price: 199.99, category: 'sports' },
  { name: 'Hiking Backpack', price: 79.99, category: 'sports' },
  { name: 'Bike Helmet', price: 44.99, category: 'sports' },
  { name: 'Fishing Rod', price: 69.99, category: 'sports' },
  { name: 'Golf Clubs', price: 399.99, category: 'sports' },
  { name: 'Boxing Gloves', price: 49.99, category: 'sports' },
  { name: 'Resistance Bands', price: 24.99, category: 'sports' },
  { name: 'Skateboard', price: 89.99, category: 'sports' },
  
  // Beauty
  { name: 'Face Moisturizer', price: 34.99, category: 'beauty' },
  { name: 'Lipstick Set', price: 29.99, category: 'beauty' },
  { name: 'Hair Dryer', price: 79.99, category: 'beauty' },
  { name: 'Perfume', price: 89.99, category: 'beauty' },
  { name: 'Makeup Brushes', price: 44.99, category: 'beauty' },
  { name: 'Nail Polish', price: 24.99, category: 'beauty' },
  { name: 'Body Lotion', price: 19.99, category: 'beauty' },
  { name: 'Shampoo Set', price: 29.99, category: 'beauty' },
  { name: 'Face Serum', price: 49.99, category: 'beauty' },
  { name: 'Hair Straightener', price: 69.99, category: 'beauty' },
  { name: 'Eye Shadow', price: 39.99, category: 'beauty' },
  { name: 'Sunscreen', price: 24.99, category: 'beauty' },
  { name: 'Body Scrub', price: 21.99, category: 'beauty' },
  { name: 'Hair Curler', price: 59.99, category: 'beauty' },
  { name: 'Razor Set', price: 34.99, category: 'beauty' },
]

async function main() {
  console.log('🌱 Seeding products...')
  
  // Get or create categories
  const categoryMap = new Map()
  for (const cat of ['electronics', 'clothing', 'books', 'home-garden', 'sports', 'beauty']) {
    const category = await prisma.category.upsert({
      where: { slug: cat },
      update: {},
      create: {
        name: cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        slug: cat,
        description: `${cat} products`,
        isActive: true,
        sortOrder: 1,
      },
    })
    categoryMap.set(cat, category.id)
  }
  
  // Create seller
  const hashedPassword = await bcrypt.hash('password123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'marketplace@test.com' },
    update: {},
    create: {
      email: 'marketplace@test.com',
      password: hashedPassword,
      name: 'Marketplace Seller',
      role: 'SELLER',
    },
  })
  
  const seller = await prisma.seller.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      businessName: 'Marketplace Store',
      businessDescription: 'Your one-stop shop for everything',
      verificationStatus: 'VERIFIED',
    },
  })
  
  // Delete existing products from this seller
  await prisma.product.deleteMany({
    where: { sellerId: seller.id }
  })
  
  // Create products
  let created = 0
  for (const product of productData) {
    const categoryId = categoryMap.get(product.category)
    if (!categoryId) continue
    
    const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    try {
      await prisma.product.create({
        data: {
          sellerId: seller.id,
          categoryId,
          name: product.name,
          slug,
          description: `High-quality ${product.name} for all your needs`,
          shortDescription: product.name,
          price: product.price,
          stock: Math.floor(Math.random() * 100) + 10,
          images: JSON.stringify([getImageUrl(product.category, product.name)]),
          isActive: true,
          isFeatured: Math.random() > 0.7,
          rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
          totalReviews: Math.floor(Math.random() * 100),
          soldCount: Math.floor(Math.random() * 50),
        },
      })
      created++
    } catch (e) {
      console.error('Error creating product:', product.name, e)
    }
  }
  
  console.log(`✅ Created ${created} products`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
