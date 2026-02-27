import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'
import { headers } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const reviews = await prisma.review.findMany({
      where: { productId: id },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      user: review.user,
      createdAt: review.createdAt
    }))

    return NextResponse.json({
      reviews: formattedReviews
    })

  } catch (error) {
    console.error('Product reviews API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('POST /api/products/[id]/reviews - Starting')
    const { id } = await params
    console.log('Product ID:', id)
    
    let userId = null
    
    // Try multiple authentication methods
    try {
      // Method 1: Try getToken
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET as string
      })
      console.log('Token method result:', token)
      
      if (token?.sub) {
        userId = token.sub
        console.log('User ID from token:', userId)
      }
    } catch (tokenError) {
      console.log('Token method failed:', tokenError)
    }
    
    // Method 2: Try to get from session cookie (fallback)
    if (!userId) {
      try {
        const cookies = request.cookies.get('next-auth.session-token')
        console.log('Session cookie:', cookies)
        
        if (cookies) {
          // For now, we'll skip detailed session parsing and use a simple approach
          console.log('Found session cookie, but token method failed')
        }
      } catch (cookieError) {
        console.log('Cookie method failed:', cookieError)
      }
    }

    if (!userId) {
      console.log('No authentication found')
      return NextResponse.json(
        { error: 'Authentication required - Please log in first' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Request body:', body)
    const { rating, comment } = body

    if (!rating || rating < 1 || rating > 5) {
      console.log('Invalid rating:', rating)
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (!comment || comment.trim().length === 0) {
      console.log('Empty comment')
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      )
    }

    console.log('Checking for existing review for user:', userId)
    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: id,
        userId: userId
      }
    })

    if (existingReview) {
      console.log('User already reviewed this product')
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    console.log('Creating new review...')
    // Check if user has purchased this product (optional - you can implement this logic)
    // For now, we'll allow any authenticated user to review

    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment.trim(),
        productId: id,
        userId: userId
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    })

    console.log('Review created:', review)

    // Send notification to seller about new review
    try {
      // Get product details to include in notification
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          seller: {
            select: { id: true, businessName: true }
          }
        }
      })

      if (product && product.sellerId !== userId) {
        // Create notification for seller
        await prisma.notification.create({
          data: {
            title: 'New Product Review',
            message: `${review.user.name} left a ${review.rating}-star review for your product "${product.name}"`,
            type: 'REVIEW',
            isRead: false,
            userId: product.sellerId,
            data: JSON.stringify({
              productId: id,
              reviewId: review.id,
              rating: review.rating,
              customerName: review.user.name
            })
          }
        })

        console.log('Notification sent to seller:', product.sellerId)
      }
    } catch (notificationError) {
      console.error('Failed to send seller notification:', notificationError)
      // Don't fail the review submission if notification fails
    }

    // Update product average rating
    const allReviews = await prisma.review.findMany({
      where: { productId: id }
    })

    const averageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length
    const reviewCount = allReviews.length

    await prisma.product.update({
      where: { id },
      data: {
        rating: averageRating,
        totalReviews: reviewCount
      }
    })

    console.log('Product rating updated')

    const formattedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      user: review.user,
      createdAt: review.createdAt
    }

    console.log('Returning success response')
    return NextResponse.json({
      review: formattedReview,
      message: 'Review submitted successfully'
    })

  } catch (error) {
    console.error('Product review submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit review: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
