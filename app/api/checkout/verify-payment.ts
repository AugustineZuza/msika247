import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        buyer: { include: { user: true } }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if this order belongs to the current user
    if (order.buyer.userId !== token.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For testing, manually mark as paid
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Update payment status
    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: { status: 'SUCCESS' }
      })
    }

    // Update product stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Payment verified manually for testing'
    })

  } catch (error) {
    console.error('Manual payment verification error:', error)
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
  }
}
