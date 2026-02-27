import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { quantity } = body

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      )
    }

    // Get buyer profile
    const buyer = await prisma.buyer.findUnique({
      where: { userId: token.sub }
    })

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer profile not found' },
        { status: 404 }
      )
    }

    // Get cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
        product: true
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const cart = await prisma.cart.findUnique({
      where: { id: cartItem.cartId }
    })

    if (!cart || cart.buyerId !== buyer.id) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Check if requested quantity is available
    if (quantity > cartItem.product.stock) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Update cart item
    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating cart item:', error)
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

    const { id } = await params

    // Get buyer profile
    const buyer = await prisma.buyer.findUnique({
      where: { userId: token.sub }
    })

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer profile not found' },
        { status: 404 }
      )
    }

    // Get cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
        product: true
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const cart = await prisma.cart.findUnique({
      where: { id: cartItem.cartId }
    })

    if (!cart || cart.buyerId !== buyer.id) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cart item:', error)
    return NextResponse.json(
      { error: 'Failed to delete cart item' },
      { status: 500 }
    )
  }
}
