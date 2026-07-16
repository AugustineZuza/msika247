import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '8')
    const isNew = searchParams.get('new') === 'true'
    
    // Fetch products with reviews for rating calculation
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        seller: { isActive: true }
      },
      select: {
        id: true,
        name: true,
        price: true,
        discountPrice: true,
        images: true,
        slug: true,
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
        review: {
          select: {
            rating: true
          }
        },
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    
    // Calculate ratings and format response
    const formattedProducts = products.map(product => {
      const reviews = product.review || []
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0
      
      // Parse images from JSON string
      let images = []
      try {
        images = product.images ? JSON.parse(product.images) : []
      } catch {
        images = []
      }
      
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        images,
        slug: product.slug,
        seller: product.seller,
        category: product.category.name,
        averageRating: parseFloat(averageRating.toFixed(1)),
        reviewCount: reviews.length,
        promotion: null, // TODO: Add promotions later
        createdAt: product.createdAt
      }
    })
    
    return NextResponse.json({ 
      products: formattedProducts,
      total: formattedProducts.length
    })
    
  } catch (error) {
    console.error('Failed to fetch landing products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
