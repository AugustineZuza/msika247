import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true }
        },
        seller: {
          select: { id: true, userId: true, businessName: true }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get reviews for this product
    const reviews = await prisma.review.findMany({
      where: { productId: id },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null

    const formattedProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      discountPrice: product.discountPrice,
      description: product.description,
      stock: product.stock || 0,
      images: product.images ? JSON.parse(product.images) : [],
      category: product.category,
      seller: product.seller,
      courierAvailable: product.courierAvailable,
      courierPrice: product.courierPrice,
      averageRating,
      reviewCount: reviews.length,
      isActive: product.isActive,
      createdAt: product.createdAt
    }

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      user: review.user,
      createdAt: review.createdAt
    }))

    return NextResponse.json({
      product: formattedProduct,
      reviews: formattedReviews
    })

  } catch (error) {
    console.error('Product detail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
