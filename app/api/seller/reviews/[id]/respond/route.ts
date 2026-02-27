import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const reviewId = params.id
    const body = await request.json()
    const { response } = body

    if (!response || response.trim().length === 0) {
      return NextResponse.json(
        { error: 'Response cannot be empty' },
        { status: 400 }
      )
    }

    // Verify review belongs to seller's product
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        product: {
          sellerId: seller.id
        }
      }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found or access denied' },
        { status: 404 }
      )
    }

    // Update review with seller response
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        sellerResponse: response.trim()
      } as any
    })

    return NextResponse.json({
      id: updatedReview.id,
      sellerResponse: (updatedReview as any).sellerResponse,
      message: 'Response added successfully'
    })
  } catch (error) {
    console.error('Review response error:', error)
    return NextResponse.json(
      { error: 'Failed to add response' },
      { status: 500 }
    )
  }
}
