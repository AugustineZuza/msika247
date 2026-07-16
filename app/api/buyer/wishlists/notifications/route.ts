import { NextRequest, NextResponse } from 'next/server'
import getServerSession from 'next-auth'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/buyer/wishlists/notifications - Get wishlist notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(auth)
    
    if (!session || !(session as any).user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: (session as any).user.email },
      include: { buyer: true }
    })

    if (!user || !user.buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Get all wishlist items with their products
    const wishlistItems = await prisma.wishlistItem.findMany({
      where: {
        wishlist: {
          buyerId: user.buyer.id
        }
      },
      include: {
        product: true
      }
    })

    const notifications = []

    for (const item of wishlistItems) {
      const product = item.product
      
      // Price drop notification
      if (product.discountPrice && product.discountPrice < product.price) {
        notifications.push({
          id: `price-drop-${item.id}`,
          type: 'PRICE_DROP',
          title: 'Price Drop Alert',
          message: `${product.name} price dropped from MWK ${product.price.toLocaleString()} to MWK ${product.discountPrice.toLocaleString()}`,
          productId: product.id,
          productName: product.name,
          oldPrice: product.price,
          newPrice: product.discountPrice,
          wishlistItemId: item.id,
          createdAt: product.updatedAt
        })
      }

      // Out of stock notification
      if (product.stock <= 0) {
        notifications.push({
          id: `out-of-stock-${item.id}`,
          type: 'OUT_OF_STOCK',
          title: 'Out of Stock',
          message: `${product.name} is now out of stock`,
          productId: product.id,
          productName: product.name,
          wishlistItemId: item.id,
          createdAt: product.updatedAt
        })
      }

      // Back in stock notification (if it was out of stock before)
      if (product.stock > 0) {
        notifications.push({
          id: `back-in-stock-${item.id}`,
          type: 'BACK_IN_STOCK',
          title: 'Back in Stock',
          message: `${product.name} is now back in stock`,
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          wishlistItemId: item.id,
          createdAt: product.updatedAt
        })
      }
    }

    // Sort by most recent
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      notifications,
      total: notifications.length
    })
  } catch (error) {
    console.error('Error fetching wishlist notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
