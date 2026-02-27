import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '8')
    const isNew = searchParams.get('new') === 'true'
    
    // Build where clause for filtering
    const where: any = {
      isActive: true,
      seller: {
        isActive: true
      }
    }
    
    // Add category filter if provided
    if (category && category !== 'all') {
      where.category = {
        name: category
      }
    }
    
    // If fetching new products, filter by recent date (last 7 days)
    if (isNew) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      where.createdAt = {
        gte: sevenDaysAgo
      }
    }
    
    // Fetch products with seller information and promotions
    const products = await prisma.product.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            city: true,
            verificationStatus: true
          }
        },
        category: {
          select: {
            name: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: isNew ? limit : limit * 3 // Get more products so we can randomize
    })
    
    // Fetch active promotions for these products
    const productIds = products.map(p => p.id)
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        OR: [
          { applicableProducts: { contains: productIds.join(',') } },
          { applicableProducts: { equals: "[]" } } // Applies to all products
        ]
      },
      include: {
        seller: {
          select: {
            id: true,
            businessName: true
          }
        }
      }
    })
    
    // Create promotion lookup map
    const promotionMap = new Map()
    promotions.forEach((promo: any) => {
      const applicableProducts = promo.applicableProducts ? JSON.parse(promo.applicableProducts) : []
      if (applicableProducts.length === 0) {
        // Applies to all products from this seller
        products.forEach((product: any) => {
          if (product.sellerId === promo.sellerId) {
            promotionMap.set(product.id, promo)
          }
        })
      } else {
        // Applies to specific products
        applicableProducts.forEach((productId: string) => {
          promotionMap.set(productId, promo)
        })
      }
    })
    
    // Calculate average rating and add promotion for each product
    const productsWithRatings = products.map(product => {
      const reviews = product.reviews || []
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0
      
      const promotion = promotionMap.get(product.id)
      
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        images: product.images,
        slug: product.slug,
        seller: product.seller,
        category: product.category.name,
        averageRating: parseFloat(averageRating.toFixed(1)),
        reviewCount: reviews.length,
        createdAt: product.createdAt,
        promotion: promotion ? {
          id: promotion.id,
          name: promotion.name,
          type: promotion.type,
          value: promotion.value,
          minOrderAmount: promotion.minOrderAmount,
          maxDiscountAmount: promotion.maxDiscountAmount,
          endDate: promotion.endDate
        } : null
      }
    })
    
    // Randomize the products (only for regular products, not new ones)
    const finalProducts = isNew 
      ? productsWithRatings 
      : productsWithRatings.sort(() => 0.5 - Math.random()).slice(0, limit)
    
    return NextResponse.json({ 
      products: finalProducts,
      total: productsWithRatings.length
    })
    
  } catch (error) {
    console.error('Failed to fetch landing products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
