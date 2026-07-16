import { NextRequest, NextResponse } from 'next/server'
import getServerSession from 'next-auth'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/buyer/wishlists/[id] - Get a specific wishlist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(auth)
    const { id } = await params

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

    const wishlist = await prisma.wishlist.findFirst({
      where: {
        id,
        OR: [
          { buyerId: user.buyer.id }, // Owner can access
          { isPublic: true } // Public wishlist can be accessed
        ]
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: true
              }
            }
          }
        },
        buyer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!wishlist) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 })
    }

    // Check if user is the owner
    const isOwner = wishlist.buyerId === user.buyer.id

    return NextResponse.json({
      wishlist: {
        id: wishlist.id,
        name: wishlist.name,
        isPublic: wishlist.isPublic,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt,
        itemCount: wishlist.items.length,
        isOwner,
        owner: {
          name: wishlist.buyer.user.name,
          email: wishlist.buyer.user.email
        },
        items: wishlist.items.map((item: any) => ({
          id: item.id,
          addedAt: item.createdAt,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            discountPrice: item.product.discountPrice,
            images: item.product.images ? JSON.parse(item.product.images) : [],
            slug: item.product.slug,
            stock: item.product.stock,
            seller: {
              id: item.product.seller.id,
              businessName: item.product.seller.businessName
            }
          }
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/buyer/wishlists/[id] - Update a wishlist
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(auth)
    const { id } = await params

    if (!session || !(session as any).user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, isPublic } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: (session as any).user.email },
      include: { buyer: true }
    })

    if (!user || !user.buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Check if user owns the wishlist
    const existingWishlist = await prisma.wishlist.findFirst({
      where: { id, buyerId: user.buyer.id }
    })

    if (!existingWishlist) {
      return NextResponse.json({ error: 'Wishlist not found or unauthorized' }, { status: 404 })
    }

    const wishlist = await prisma.wishlist.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(isPublic !== undefined && { isPublic })
      }
    })

    return NextResponse.json({
      wishlist: {
        id: wishlist.id,
        name: wishlist.name,
        description: null,
        isDefault: false,
        isPublic: wishlist.isPublic,
        shareToken: null,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt
      }
    })
  } catch (error) {
    console.error('Error updating wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/buyer/wishlists/[id] - Delete a wishlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(auth)
    const { id } = await params

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

    // Check if user owns the wishlist
    const existingWishlist = await prisma.wishlist.findFirst({
      where: { id, buyerId: user.buyer.id }
    })

    if (!existingWishlist) {
      return NextResponse.json({ error: 'Wishlist not found or unauthorized' }, { status: 404 })
    }

    // Don't allow deletion if it's the only wishlist
    const wishlistCount = await prisma.wishlist.count({
      where: { buyerId: user.buyer.id }
    })

    if (wishlistCount <= 1) {
      return NextResponse.json({ error: 'Cannot delete your only wishlist' }, { status: 400 })
    }

    await prisma.wishlist.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Wishlist deleted successfully' })
  } catch (error) {
    console.error('Error deleting wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
