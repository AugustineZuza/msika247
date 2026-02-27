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
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      )
    }

    console.log('Cart API - Token found:', {
      sub: token.sub,
      email: token.email,
      name: token.name,
      role: token.role
    })

    // Get user directly
    const user = await prisma.user.findUnique({
      where: { id: token.sub }
    })

    if (!user) {
      console.error('Cart API - User not found:', token.sub)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('Cart API - User found:', user.id)

    // Get buyer profile
    let buyer = await prisma.buyer.findUnique({
      where: { userId: user.id }
    })

    if (!buyer) {
      console.log('Cart API - Creating buyer profile for user:', user.id)
      buyer = await prisma.buyer.create({
        data: {
          userId: user.id,
        }
      })
      console.log('Cart API - Buyer profile created:', buyer.id)
    }

    // Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { buyerId: buyer.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: {
                  select: {
                    id: true,
                    businessName: true
                  }
                }
              }
            }
          }
        }
      }
    })

    console.log('Cart API - Cart found:', !!cart, 'Items:', cart?.items?.length || 0)

    if (!cart) {
      console.log('Cart API - No cart found, returning empty cart')
      return NextResponse.json({
        items: [],
        total: 0,
      })
    }

    // Calculate total
    const total = cart.items.reduce((sum: number, item: any) => {
      const price = item.product.discountPrice || item.product.price
      return sum + (price * item.quantity)
    }, 0)

    // Parse images JSON and format response
    const itemsWithParsedImages = cart.items.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        discountPrice: item.product.discountPrice,
        images: item.product.images ? JSON.parse(item.product.images) : [],
        seller: item.product.seller
      },
    }))

    console.log('Cart API - Returning cart with', itemsWithParsedImages.length, 'items')

    return NextResponse.json({
      items: itemsWithParsedImages,
      total,
    })
  } catch (error) {
    console.error('Cart API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { productId, quantity = 1 } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: token.sub }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get or create buyer
    let buyer = await prisma.buyer.findUnique({
      where: { userId: user.id }
    })

    if (!buyer) {
      buyer = await prisma.buyer.create({
        data: { userId: user.id }
      })
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { buyerId: buyer.id }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { buyerId: buyer.id }
      })
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    })

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          price: product.discountPrice || product.price,
        }
      })
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.discountPrice || product.price,
        }
      })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Add to cart error:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}
