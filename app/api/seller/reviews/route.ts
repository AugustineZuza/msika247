import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get seller profile
    const seller = await prisma.seller.findUnique({
      where: { userId: token.sub }
    })

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      )
    }

    // Get reviews for seller's products
    const reviews = await prisma.review.findMany({
      where: {
        product: {
          sellerId: seller.id
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get user information separately to avoid relation issues
    const userIds = [...new Set(reviews.map(r => r.userId))]
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    // Create user lookup map
    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user
      return acc
    }, {} as Record<string, any>)

    // Format reviews for frontend
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      customer: {
        name: userMap[review.userId]?.name || 'Unknown',
        email: userMap[review.userId]?.email || ''
      },
      product: {
        id: review.productId,
        name: review.product?.name || 'Unknown Product',
        image: review.product?.images ? JSON.parse(review.product.images)[0] : null
      },
      order: {
        id: review.orderId || '',
        orderNumber: 'N/A' // Would need to fetch from Order table if needed
      },
      sellerResponse: (review as any).sellerResponse,
      status: (review as any).sellerResponse ? 'RESPONDED' : 'PENDING',
      helpful: review.helpfulCount || 0,
      notHelpful: 0 // This field doesn't exist in schema
    }))

    return NextResponse.json(formattedReviews)
  } catch (error) {
    console.error('Reviews API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
