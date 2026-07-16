import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/compare - Get comparison data for products
export async function GET(request: NextRequest) {
  try {

    // Get comparison items from session storage (client-side)
    // For now, we'll implement a simple server-side comparison using query params
    const { searchParams } = new URL(request.url)
    const productIds = searchParams.get('ids')?.split(',').filter(Boolean) || []

    if (productIds.length === 0) {
      return NextResponse.json({
        products: [],
        categories: [],
        specifications: {}
      })
    }

    // Fetch products with detailed information
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true
      },
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            city: true,
            verificationStatus: true,
            rating: true
          }
        },
        category: {
          select: {
            name: true
          }
        },
        reviews: {
          select: {
            rating: true,
            comment: true
          }
        }
      }
    })

    // Format products with ratings
    const formattedProducts = products.map(product => {
      const reviews = product.reviews || []
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        images: JSON.parse(product.images || '[]'),
        slug: product.slug,
        description: product.description,
        stock: product.stock,
        seller: product.seller,
        category: product.category.name,
        averageRating: parseFloat(averageRating.toFixed(1)),
        reviewCount: reviews.length,
        createdAt: product.createdAt,
        specifications: product.specifications || {}
      }
    })

    // Get unique categories
    const categories = [...new Set(formattedProducts.map(p => p.category))]

    // Get all unique specification keys
    const allSpecs = new Set<string>()
    formattedProducts.forEach(product => {
      Object.keys(product.specifications).forEach(key => allSpecs.add(key))
    })

    // Build specification comparison object
    const specifications: Record<string, Record<string, any>> = {}
    allSpecs.forEach(spec => {
      specifications[spec] = {}
      formattedProducts.forEach(product => {
        specifications[spec][product.id] = product.specifications[spec] || 'N/A'
      })
    })

    return NextResponse.json({
      products: formattedProducts,
      categories,
      specifications,
      comparisonFields: [
        'Price',
        'Rating',
        'Reviews',
        'Seller',
        'Stock',
        'Category',
        'Added Date'
      ]
    })

  } catch (error) {
    console.error('Failed to fetch comparison data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comparison data' },
      { status: 500 }
    )
  }
}

// POST /api/compare - Validate products for comparison
export async function POST(request: NextRequest) {
  try {
    const { productIds } = await request.json()

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      )
    }

    if (productIds.length > 4) {
      return NextResponse.json(
        { error: 'Cannot compare more than 4 products at once' },
        { status: 400 }
      )
    }

    // Validate products exist and are active
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        category: {
          select: {
            name: true
          }
        }
      }
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Some products are not available' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      products,
      canCompare: products.length >= 2
    })

  } catch (error) {
    console.error('Failed to validate comparison:', error)
    return NextResponse.json(
      { error: 'Failed to validate comparison' },
      { status: 500 }
    )
  }
}
