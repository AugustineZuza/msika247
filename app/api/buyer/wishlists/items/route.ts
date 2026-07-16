import { NextRequest, NextResponse } from 'next/server'
import getServerSession from 'next-auth'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/buyer/wishlists/items - Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(auth)
    
    if (!session || !(session as any).user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, wishlistId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: (session as any).user.email },
      include: { buyer: true }
    })

    if (!user || !user.buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get or create default wishlist if no wishlistId provided
    let targetWishlistId = wishlistId
    if (!targetWishlistId) {
      let defaultWishlist = await prisma.wishlist.findFirst({
        where: { 
          buyerId: user.buyer.id
        }
      })

      if (!defaultWishlist) {
        defaultWishlist = await prisma.wishlist.create({
          data: {
            name: 'My Wishlist',
            buyerId: user.buyer.id
          }
        })
      }
      targetWishlistId = defaultWishlist.id
    } else {
      // Verify user owns the wishlist
      const wishlist = await prisma.wishlist.findFirst({
        where: { id: targetWishlistId, buyerId: user.buyer.id }
      })

      if (!wishlist) {
        return NextResponse.json({ error: 'Wishlist not found or unauthorized' }, { status: 404 })
      }
    }

    // Check if item already exists in the wishlist
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        productId,
        wishlistId: targetWishlistId
      }
    })

    if (existingItem) {
      return NextResponse.json({ error: 'Item already in wishlist' }, { status: 409 })
    }

    // Add item to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        productId,
        wishlistId: targetWishlistId
      },
      include: {
        product: {
          include: {
            seller: true
          }
        }
      }
    })

    return NextResponse.json({
      item: {
        id: wishlistItem.id,
        addedAt: wishlistItem.createdAt,
        product: {
          id: wishlistItem.product.id,
          name: wishlistItem.product.name,
          price: wishlistItem.product.price,
          discountPrice: wishlistItem.product.discountPrice,
          images: wishlistItem.product.images ? JSON.parse(wishlistItem.product.images) : [],
          slug: wishlistItem.product.slug,
          stock: wishlistItem.product.stock,
          seller: {
            id: wishlistItem.product.seller.id,
            businessName: wishlistItem.product.seller.businessName
          }
        }
      }
    })
  } catch (error) {
    console.error('Error adding item to wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/buyer/wishlists/items - Remove item from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(auth)
    
    if (!session || !(session as any).user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, wishlistId } = await request.json()

    if (!productId || !wishlistId) {
      return NextResponse.json({ error: 'Product ID and Wishlist ID are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: (session as any).user.email },
      include: { buyer: true }
    })

    if (!user || !user.buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Verify user owns the wishlist
    const wishlist = await prisma.wishlist.findFirst({
      where: { id: wishlistId, buyerId: user.buyer.id }
    })

    if (!wishlist) {
      return NextResponse.json({ error: 'Wishlist not found or unauthorized' }, { status: 404 })
    }

    // Find and delete the wishlist item
    const wishlistItem = await prisma.wishlistItem.findFirst({
      where: {
        productId,
        wishlistId
      }
    })

    if (!wishlistItem) {
      return NextResponse.json({ error: 'Item not found in wishlist' }, { status: 404 })
    }

    await prisma.wishlistItem.delete({
      where: { id: wishlistItem.id }
    })

    return NextResponse.json({ message: 'Item removed from wishlist successfully' })
  } catch (error) {
    console.error('Error removing item from wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
