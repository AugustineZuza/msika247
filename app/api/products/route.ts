import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'
    const sort = searchParams.get('sort') || 'newest'
    const priceRange = searchParams.get('priceRange') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const featured = searchParams.get('featured') === 'true'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isActive: true,
      stock: { gt: 0 }
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }

    // Add category filter
    if (category !== 'all') {
      // Map category slugs to actual category names
      const categoryMap: { [key: string]: string } = {
        'electronics-technology': 'Electronics & Technology',
        'fashion-clothing': 'Fashion & Clothing',
        'beauty-health-personal-care': 'Beauty, Health & Personal Care',
        'home-furniture-appliances': 'Home, Furniture & Appliances',
        'food-groceries-beverages': 'Food, Groceries & Beverages',
        'baby-kids-toys': 'Baby, Kids & Toys',
        'sports-fitness-outdoor': 'Sports, Fitness & Outdoor',
        'automotive-motor-accessories': 'Automotive & Motor Accessories',
        'tools-hardware-industrial': 'Tools, Hardware & Industrial',
        'books-education-stationery': 'Books, Education & Stationery',
        'agriculture-farming': 'Agriculture & Farming'
      }
      
      const categoryName = categoryMap[category] || category
      
      // Try multiple approaches to find the category
      where.category = {
        OR: [
          { name: { contains: categoryName } },
          { name: { equals: categoryName } },
          { slug: { contains: category } },
          { slug: { equals: category } }
        ]
      }
    }

    // Add price range filter
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(p => p.replace('+', ''))
      const minPrice = min ? parseFloat(min) : 0
      const maxPrice = max ? parseFloat(max) : 9999999
      
      if (minPrice > 0 || maxPrice < 9999999) {
        where.price = {
          gte: minPrice,
          lte: maxPrice
        }
      }
    }

    // Add featured filter
    if (featured) {
      // For now, let's consider products with rating >= 4.5 as featured
      where.averageRating = { gte: 4.5 }
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' }
    switch (sort) {
      case 'price-low':
        orderBy = { price: 'asc' }
        break
      case 'price-high':
        orderBy = { price: 'desc' }
        break
      case 'rating':
        orderBy = { averageRating: 'desc' }
        break
      case 'popular':
        orderBy = { reviewCount: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // Fetch products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true }
          },
          seller: {
            select: { id: true, businessName: true }
          },
          _count: {
            select: { reviews: true }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    // Calculate average rating for each product
    const productsWithRatings = await Promise.all(
      products.map(async (product) => {
        const reviews = await prisma.review.findMany({
          where: { productId: product.id },
          select: { rating: true }
        })

        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : null

        return {
          ...product,
          averageRating,
          reviewCount: reviews.length
        }
      })
    )

    // Format products
    const formattedProducts = productsWithRatings.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      discountPrice: product.discountPrice,
      description: product.description,
      stock: product.stock,
      images: product.images ? JSON.parse(product.images) : [],
      category: product.category,
      seller: product.seller,
      courierAvailable: product.courierAvailable,
      courierPrice: product.courierPrice,
      averageRating: product.rating,
      reviewCount: product.totalReviews,
      isActive: product.isActive,
      createdAt: product.createdAt
    }))

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })

  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
