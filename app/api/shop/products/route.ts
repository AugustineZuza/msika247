import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'newest'

    // Build where clause
    const where: any = { isActive: true }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' }
    switch (sort) {
      case 'price-asc':
        orderBy = { price: 'asc' }
        break
      case 'price-desc':
        orderBy = { price: 'desc' }
        break
      case 'popular':
        orderBy = { soldCount: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // Get total count
    const total = await prisma.product.count({ where })

    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        discountPrice: true,
        stock: true,
        images: true,
        category: {
          select: {
            id: true,
            name: true
          }
        },
        seller: {
          select: {
            id: true,
            businessName: true,
            rating: true
          }
        },
        _count: {
          select: {
            reviews: true
          }
        },
        // Type assertion for new location fields
        ...(true as any) && {
          locationCity: true,
          locationDistrict: true,
          locationRegion: true,
          locationAddress: true,
        },
        courierAvailable: true,
        courierPrice: true,
        createdAt: true
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    })

    // Calculate average rating for each product
    const productsWithRatings = await Promise.all(
      products.map(async (product: any) => {
        const reviews = await prisma.review.findMany({
          where: { 
            productId: product.id,
            isApproved: true 
          },
          select: { rating: true }
        })

        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
          : 0

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice,
          stock: product.stock,
          images: product.images ? JSON.parse(product.images) : [],
          category: product.category,
          seller: product.seller,
          averageRating,
          reviewCount: reviews.length,
          isActive: product.isActive,
          courierAvailable: product.courierAvailable,
          courierPrice: product.courierPrice,
          createdAt: product.createdAt.toISOString(),
          location: product.locationCity || product.locationDistrict || product.locationRegion ? {
            city: product.locationCity,
            district: product.locationDistrict,
            region: product.locationRegion,
            address: product.locationAddress
          } : null
        }
      })
    )

    return NextResponse.json({
      products: productsWithRatings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
