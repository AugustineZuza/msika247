import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

// GET /api/wishlist - Get user's wishlist items
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      )
    }

    // Debug: Log the token and buyerId
    console.log('Wishlist GET - Token:', token)
    console.log('Wishlist GET - BuyerId (token.sub):', token.sub)

    // ALWAYS ensure user exists in database, create if not
    console.log('Wishlist GET - Checking if user exists in database...')
    let user = await prisma.user.findUnique({
      where: { id: token.sub }
    })

    if (!user) {
      console.log('Wishlist GET - User not found in database, creating:', token.sub)
      try {
        user = await prisma.user.create({
          data: {
            id: token.sub,
            email: token.email!,
            name: token.name!,
            role: token.role as any || 'BUYER',
            password: '', // Empty password for OAuth users
            isActive: true
          }
        })
        console.log('Wishlist GET - User created successfully:', user.id)
      } catch (createError) {
        console.error('Wishlist GET - Failed to create user:', createError)
        return NextResponse.json(
          { 
            error: 'Failed to create user account',
            details: createError instanceof Error ? createError.message : 'Unknown error'
          },
          { status: 500 }
        )
      }
    } else {
      console.log('Wishlist GET - User found in database:', user.id)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get the user's default wishlist or create one
    console.log('GET - Looking for wishlist for buyerId:', token.sub)
    let userWishlist = await prisma.wishlist.findFirst({
      where: {
        buyerId: token.sub,
        name: 'My Wishlist' // Default wishlist name
      }
    })

    console.log('GET - Found wishlist:', userWishlist?.id || 'None')

    // If no default wishlist exists, create one
    if (!userWishlist) {
      console.log('GET - Creating wishlist for buyerId:', token.sub)
      try {
        userWishlist = await prisma.wishlist.create({
          data: {
            buyerId: token.sub,
            name: 'My Wishlist',
            isPublic: false
          }
        })
        console.log('GET - Wishlist created successfully:', userWishlist.id)
      } catch (error) {
        console.error('GET - Failed to create wishlist:', error)
        throw error
      }
    }

    // Get wishlist items with product details
    const wishlistItems = await prisma.wishlistItem.findMany({
      where: {
        wishlistId: userWishlist.id
      },
      include: {
        product: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.wishlistItem.count({
      where: {
        wishlistId: userWishlist.id
      }
    })

    // Format the response to match expected structure
    const formattedItems = wishlistItems.map(item => {
      const reviews = item.product.reviews || []
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
        : 0

      return {
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        price: item.product.price,
        discountPrice: item.product.discountPrice,
        images: JSON.parse(item.product.images || '[]'),
        slug: item.product.slug,
        description: item.product.description,
        stock: item.product.stock,
        seller: item.product.seller,
        category: item.product.category.name,
        averageRating: parseFloat(averageRating.toFixed(1)),
        reviewCount: reviews.length,
        createdAt: item.createdAt,
        specifications: item.product.specifications || {}
      }
    })

    return NextResponse.json({
      items: formattedItems,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Failed to fetch wishlist:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch wishlist',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/wishlist - Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      )
    }

    // Debug: Log the token and buyerId
    console.log('Wishlist POST - Token:', token)
    console.log('Wishlist POST - BuyerId (token.sub):', token.sub)

    // ALWAYS ensure user exists in database, create if not
    console.log('Wishlist POST - Checking if user exists in database...')
    let user = await prisma.user.findUnique({
      where: { id: token.sub }
    })

    if (!user) {
      console.log('Wishlist POST - User not found in database, creating:', token.sub)
      try {
        user = await prisma.user.create({
          data: {
            id: token.sub,
            email: token.email!,
            name: token.name!,
            role: token.role as any || 'BUYER',
            password: '', // Empty password for OAuth users
            isActive: true
          }
        })
        console.log('Wishlist POST - User created successfully:', user.id)
      } catch (createError) {
        console.error('Wishlist POST - Failed to create user:', createError)
        return NextResponse.json(
          { 
            error: 'Failed to create user account',
            details: createError instanceof Error ? createError.message : 'Unknown error'
          },
          { status: 500 }
        )
      }
    } else {
      console.log('Wishlist POST - User found in database:', user.id)
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get or create user's default wishlist
    console.log('POST - Looking for wishlist for buyerId:', token.sub)
    let userWishlist = await prisma.wishlist.findFirst({
      where: {
        buyerId: token.sub,
        name: 'My Wishlist'
      }
    })

    console.log('POST - Found wishlist:', userWishlist?.id || 'None')

    if (!userWishlist) {
      console.log('POST - Creating wishlist for buyerId:', token.sub)
      try {
        userWishlist = await prisma.wishlist.create({
          data: {
            buyerId: token.sub,
            name: 'My Wishlist',
            isPublic: false
          }
        })
        console.log('POST - Wishlist created successfully:', userWishlist.id)
      } catch (error) {
        console.error('POST - Failed to create wishlist:', error)
        throw error
      }
    }

    // Check if item already exists in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: userWishlist.id,
          productId: productId
        }
      }
    })

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item already in wishlist' },
        { status: 409 }
      )
    }

    // Add item to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        wishlistId: userWishlist.id,
        productId: productId
      },
      include: {
        product: {
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
        }
      }
    })

    return NextResponse.json({
      message: 'Item added to wishlist successfully',
      item: {
        id: wishlistItem.id,
        productId: wishlistItem.productId,
        name: wishlistItem.product.name,
        price: wishlistItem.product.price,
        discountPrice: wishlistItem.product.discountPrice,
        images: JSON.parse(wishlistItem.product.images || '[]'),
        slug: wishlistItem.product.slug,
        seller: wishlistItem.product.seller,
        category: wishlistItem.product.category.name,
        createdAt: wishlistItem.createdAt
      }
    })

  } catch (error) {
    console.error('Failed to add to wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    )
  }
}

// DELETE /api/wishlist - Remove item from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const itemId = searchParams.get('itemId')

    if (!productId && !itemId) {
      return NextResponse.json(
        { error: 'Product ID or Item ID is required' },
        { status: 400 }
      )
    }

    // Get user's default wishlist
    const userWishlist = await prisma.wishlist.findFirst({
      where: {
        buyerId: token.sub,
        name: 'My Wishlist'
      }
    })

    if (!userWishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      )
    }

    let deletedItem

    if (itemId) {
      // Delete by item ID
      deletedItem = await prisma.wishlistItem.delete({
        where: { 
          id: itemId,
          wishlistId: userWishlist.id // Ensure user owns this item
        }
      })
    } else if (productId) {
      // Delete by product ID
      deletedItem = await prisma.wishlistItem.delete({
        where: {
          wishlistId_productId: {
            wishlistId: userWishlist.id,
            productId: productId
          }
        }
      })
    }

    return NextResponse.json({
      message: 'Item removed from wishlist successfully',
      deletedItemId: deletedItem.id
    })

  } catch (error) {
    console.error('Failed to remove from wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    )
  }
}
