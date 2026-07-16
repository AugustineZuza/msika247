import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract search parameters
    const query = searchParams.get('query') || ''
    const category = searchParams.get('category') || 'all'
    const minPrice = parseInt(searchParams.get('minPrice') || '0')
    const maxPrice = parseInt(searchParams.get('maxPrice') || '1000000')
    const minRating = parseInt(searchParams.get('minRating') || '0')
    const verified = searchParams.get('verified') === 'true'
    const location = searchParams.get('location') || ''
    const sortBy = searchParams.get('sort') || 'relevant'
    const inStock = searchParams.get('inStock') !== 'false'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build where clause
    let whereClause: any = {
      isActive: true,
      seller: {
        isActive: true
      }
    }

    // Text search - temporarily disabled
    // if (query) {
    //   whereClause.name = { contains: query, mode: 'insensitive' }
    // }

    // Category filter
    if (category && category !== 'all') {
      whereClause.category = {
        name: { contains: category, mode: 'insensitive' }
      }
    }

    // Price range filter
    if (minPrice > 0 || maxPrice < 1000000) {
      whereClause.price = {}
      if (minPrice > 0) {
        whereClause.price.gte = minPrice
      }
      if (maxPrice < 1000000) {
        whereClause.price.lte = maxPrice
      }
    }

    // Location filter
    if (location && location !== 'All Malawi') {
      whereClause.seller = {
        ...whereClause.seller,
        city: { contains: location, mode: 'insensitive' }
      }
    }

    // Verified seller filter
    if (verified) {
      whereClause.seller = {
        ...whereClause.seller,
        verificationStatus: 'VERIFIED'
      }
    }

    // Execute query
    const products = await prisma.product.findMany({
      where: whereClause,
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
        reviews: {
          select: {
            rating: true
          }
        },
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Get total count
    const total = await prisma.product.count({ where: whereClause })

    // Format products with ratings
    const formattedProducts = products.map(product => {
      const reviews = product.reviews || []
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0

      // Filter by rating if needed
      if (minRating > 0 && averageRating < minRating) {
        return null
      }

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
        promotion: null,
        createdAt: product.createdAt
      }
    }).filter(product => product !== null)

    return NextResponse.json({
      products: formattedProducts,
      total: formattedProducts.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total
      },
      filters: {
        query,
        category,
        minPrice,
        maxPrice,
        minRating,
        verified,
        location,
        sortBy,
        inStock
      }
    })

  } catch (error) {
    console.error('Search failed:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
