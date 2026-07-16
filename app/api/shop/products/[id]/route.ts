import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get product with seller and category info
    const product = await prisma.product.findUnique({
      where: { 
        id,
        isActive: true // Only return active products
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        seller: {
          select: {
            id: true,
            businessName: true,
          }
        },
        review: {
          select: {
            rating: true,
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate average rating
    const averageRating = product.review.length > 0 
      ? product.review.reduce((sum, review) => sum + review.rating, 0) / product.review.length
      : 0

    // Parse images JSON
    const images = product.images ? JSON.parse(product.images) : []

    // Format response
    const formattedProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      discountPrice: product.discountPrice,
      description: product.description,
      stock: product.stock,
      images: images,
      category: product.category,
      seller: product.seller,
      courierAvailable: product.courierAvailable,
      courierPrice: product.courierPrice,
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount: product.review.length,
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
    }

    return NextResponse.json(formattedProduct)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
