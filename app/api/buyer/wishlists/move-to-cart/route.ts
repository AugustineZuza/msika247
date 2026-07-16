import { NextRequest, NextResponse } from 'next/server'
import getServerSession from 'next-auth'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/buyer/wishlists/move-to-cart - Move wishlist items to cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(auth)
    
    if (!session || !(session as any).user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemIds, wishlistId } = await request.json()

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'Item IDs are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: (session as any).user.email },
      include: { buyer: true }
    })

    if (!user || !user.buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Verify user owns the wishlist if provided
    if (wishlistId) {
      const wishlist = await prisma.wishlist.findFirst({
        where: { id: wishlistId, buyerId: user.buyer.id }
      })

      if (!wishlist) {
        return NextResponse.json({ error: 'Wishlist not found or unauthorized' }, { status: 404 })
      }
    }

    // Get wishlist items with products
    const wishlistItems = await prisma.wishlistItem.findMany({
      where: {
        id: { in: itemIds },
        ...(wishlistId && { wishlist: { buyerId: user.buyer.id } })
      },
      include: {
        product: true
      }
    })

    if (wishlistItems.length === 0) {
      return NextResponse.json({ error: 'No valid items found' }, { status: 404 })
    }

    // Check if all items belong to user
    const userWishlistIds = await prisma.wishlist.findMany({
      where: { buyerId: user.buyer.id },
      select: { id: true }
    })

    const userWishlistIdSet = new Set(userWishlistIds.map(w => w.id))
    const invalidItems = wishlistItems.filter(item => !userWishlistIdSet.has(item.wishlistId))

    if (invalidItems.length > 0) {
      return NextResponse.json({ error: 'Some items are not in your wishlists' }, { status: 403 })
    }

    const movedItems = []
    const failedItems = []

    // Add each item to cart
    for (const item of wishlistItems) {
      try {
        // Check if product is in stock
        if (item.product.stock <= 0) {
          failedItems.push({
            itemId: item.id,
            productName: item.product.name,
            reason: 'Out of stock'
          })
          continue
        }

        // Check if item already in cart
        const existingCartItem = await prisma.cartItem.findFirst({
          where: {
            cart: {
              buyerId: user.buyer.id
            },
            productId: item.productId
          }
        })

        if (existingCartItem) {
          // Update quantity
          await prisma.cartItem.update({
            where: { id: existingCartItem.id },
            data: {
              quantity: existingCartItem.quantity + 1
            }
          })
        } else {
          // Get or create cart for buyer
          let cart = await prisma.cart.findFirst({
            where: { buyerId: user.buyer.id }
          })

          if (!cart) {
            cart = await prisma.cart.create({
              data: {
                buyerId: user.buyer.id
              }
            })
          }

          // Add to cart
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: item.productId,
              quantity: 1,
              price: item.product.discountPrice || item.product.price
            }
          })
        }

        movedItems.push({
          itemId: item.id,
          productName: item.product.name,
          price: item.product.discountPrice || item.product.price
        })

        // Remove from wishlist
        await prisma.wishlistItem.delete({
          where: { id: item.id }
        })

      } catch (error) {
        console.error(`Error moving item ${item.id} to cart:`, error)
        failedItems.push({
          itemId: item.id,
          productName: item.product.name,
          reason: 'Failed to add to cart'
        })
      }
    }

    return NextResponse.json({
      message: `Successfully moved ${movedItems.length} items to cart`,
      movedItems,
      failedItems,
      totalMoved: movedItems.length,
      totalFailed: failedItems.length
    })
  } catch (error) {
    console.error('Error moving items to cart:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
