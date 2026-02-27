import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { quantity } = await request.json()

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      )
    }

    // Get user
    let user = await prisma.user.findUnique({
      where: { id: token.sub }
    })

    if (!user) {
      // Try to find user by email
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: token.email || '' }
      })
      
      if (existingUserByEmail) {
        user = existingUserByEmail
      } else {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    }

    // Get buyer
    let buyer = await prisma.buyer.findUnique({
      where: { userId: user.id }
    })

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer profile not found' },
        { status: 404 }
      )
    }

    // Update cart item
    const cartItem = await prisma.cartItem.update({
      where: {
        id: id,
        cart: {
          buyerId: buyer.id
        }
      },
      data: {
        quantity
      },
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
    })

    return NextResponse.json({
      id: cartItem.id,
      quantity: cartItem.quantity,
      price: cartItem.price,
      product: {
        id: cartItem.product.id,
        name: cartItem.product.name,
        price: cartItem.product.price,
        discountPrice: cartItem.product.discountPrice,
        images: cartItem.product.images ? JSON.parse(cartItem.product.images) : [],
        seller: cartItem.product.seller
      },
    })

  } catch (error) {
    console.error('Update cart item error:', error)
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get user
    let user = await prisma.user.findUnique({
      where: { id: token.sub }
    })

    if (!user) {
      // Try to find user by email
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: token.email || '' }
      })
      
      if (existingUserByEmail) {
        user = existingUserByEmail
      } else {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    }

    // Get buyer
    let buyer = await prisma.buyer.findUnique({
      where: { userId: user.id }
    })

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer profile not found' },
        { status: 404 }
      )
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: {
        id: id,
        cart: {
          buyerId: buyer.id
        }
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete cart item error:', error)
    return NextResponse.json(
      { error: 'Failed to delete cart item' },
      { status: 500 }
    )
  }
}
