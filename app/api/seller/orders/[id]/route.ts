import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { createOrderNotification, createNewOrderNotification } from '@/lib/notifications'

export async function GET(
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

    // Get seller profile
    const seller = await prisma.seller.findUnique({
      where: { userId: token.sub }
    })

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      )
    }

    // Get order details
    const order = await prisma.order.findFirst({
      where: { 
        id,
        sellerId: seller.id 
      },
      include: {
        buyer: {
          include: {
            user: true
          }
        },
        items: {
          include: {
            product: true
          }
        },
        seller: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or you do not have permission to view it' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        currency: order.currency,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        shippingAmount: order.shippingAmount,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber,
        notes: order.notes,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        buyer: order.buyer,
        seller: order.seller,
        items: order.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          productSnapshot: item.productSnapshot,
          product: {
            id: item.product.id,
            name: item.product.name,
            images: item.product.images ? JSON.parse(item.product.images) : [],
            sku: item.product.sku
          }
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

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
    const { status, trackingNumber, notes } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get seller profile
    const seller = await prisma.seller.findUnique({
      where: { userId: token.sub }
    })

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      )
    }

    // Check if this seller owns this order
    const order = await prisma.order.findFirst({
      where: { 
        id,
        sellerId: seller.id 
      },
      include: {
        buyer: {
          include: {
            user: true
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or you do not have permission to update it' },
        { status: 404 }
      )
    }

    // Update order status
    const updateData: any = { status }
    
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber
    }
    
    if (notes) {
      updateData.notes = notes
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData
    })

    // Create order status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: status,
        changedBy: seller.userId,
        notes: `Order status updated to ${status} by seller`
      }
    })

    // If order is delivered, move earnings from pending to available balance
    if (status === 'DELIVERED') {
      const platformCommission = order.discountAmount || 0
      const sellerEarnings = order.subtotal - platformCommission

      // Get seller wallet
      const wallet = await prisma.sellerWallet.findUnique({
        where: { sellerId: seller.id }
      })

      if (wallet) {
        // Move earnings from pending to available
        await prisma.sellerWallet.update({
          where: { sellerId: seller.id },
          data: {
            pendingBalance: {
              decrement: sellerEarnings
            },
            availableBalance: {
              increment: sellerEarnings
            }
          }
        })

        // Create wallet transaction record
        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'EARNING',
            amount: sellerEarnings,
            balance: wallet.availableBalance + sellerEarnings,
            description: `Earnings from order ${order.orderNumber} - now available`,
            reference: order.id,
            metadata: JSON.stringify({
              orderId: order.id,
              orderNumber: order.orderNumber,
              status: 'DELIVERED',
              commission: platformCommission,
              netEarnings: sellerEarnings
            })
          }
        })
      }
    }

    // Create notification for buyer
    await createOrderNotification({
      userId: order.buyer.userId,
      orderNumber: order.orderNumber,
      status: status,
      orderId: id
    })

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
