import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (query.length < 2) {
      return NextResponse.json({
        products: [],
        categories: [],
        sellers: []
      })
    }

    // Get product suggestions - simplified
    const productSuggestions = await prisma.product.findMany({
      where: {
        isActive: true
        // Temporarily disabled text search
        // name: {
        //   contains: query,
        //   mode: 'insensitive'
        // }
      },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        slug: true,
        category: {
          select: {
            name: true
          }
        },
        seller: {
          select: {
            businessName: true
          }
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    // Format suggestions
    const formattedProducts = productSuggestions.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: JSON.parse(product.images)[0] || '/placeholder-product.jpg',
      slug: product.slug,
      category: product.category.name,
      seller: product.seller.businessName,
      reviewCount: 0,
      type: 'product'
    }))

    return NextResponse.json({
      products: formattedProducts,
      categories: [],
      sellers: [],
      query
    })

  } catch (error) {
    console.error('Search suggestions failed:', error)
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    )
  }
}
