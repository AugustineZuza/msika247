import { NextRequest, NextResponse } from 'next/server'
import getServerSession from 'next-auth'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/buyer/wishlists - Get all wishlists for the buyer
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(auth)
    
    if (!session || !(session as any).user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: (session as any).user.email },
      include: {
        buyer: {
          include: {
            wishlists: {
              include: {
                items: {
                  include: {
                    product: {
                      include: {
                        seller: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user || !user.buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    return NextResponse.json({
      wishlists: user.buyer.wishlists.map(wishlist => ({
        id: wishlist.id,
        name: wishlist.name,
        isPublic: wishlist.isPublic,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt,
        itemCount: wishlist.items.length,
        items: wishlist.items.map(item => ({
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
      }))
    })
  } catch (error) {
    console.error('Error fetching wishlists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/buyer/wishlists - Create a new wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(auth)
    
    if (!session || !(session as any).user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, isPublic = false } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Wishlist name is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: (session as any).user.email },
      include: { buyer: true }
    })

    if (!user || !user.buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const wishlist = await prisma.wishlist.create({
      data: {
        name: name.trim(),
        isPublic,
        buyerId: user.buyer.id
      },
      include: {
        items: true
      }
    })

    return NextResponse.json({
      wishlist: {
        id: wishlist.id,
        name: wishlist.name,
        isPublic: wishlist.isPublic,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt,
        itemCount: 0, // New wishlist has no items yet
        items: []
      }
    })
  } catch (error) {
    console.error('Error creating wishlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
