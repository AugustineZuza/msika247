import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/buyer/wishlists/share/[token] - Access shared wishlist
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ error: 'Share token is required' }, { status: 400 })
    }

    const wishlist = await prisma.wishlist.findFirst({
      where: {
        isPublic: true
        // Note: Since schema doesn't have shareToken, we'll need to modify this
        // For now, we'll return all public wishlists
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
      return NextResponse.json({ error: 'Shared wishlist not found' }, { status: 404 })
    }

    return NextResponse.json({
      wishlist: {
        id: wishlist.id,
        name: wishlist.name,
        description: null,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt,
        itemCount: wishlist.items.length,
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
    console.error('Error accessing shared wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
