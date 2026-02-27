import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const orderId = url.searchParams.get('orderId')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    console.log('=== DEBUG ORDERS ===')

    if (orderId) {
      // Debug specific order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { 
          items: true,
          buyer: { include: { user: true } },
          seller: { include: { user: true } }
        }
      })

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      // Find related payments
      const payments = await prisma.payment.findMany({
        where: { 
          OR: [
            { orderId: order.id },
            { transactionId: { startsWith: `order_${order.id}` } }
          ]
        }
      })

      console.log('Order debug:', {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        payments: payments.map(p => ({
          id: p.id,
          status: p.status,
          amount: p.amount,
          transactionId: p.transactionId,
          orderId: p.orderId,
          createdAt: p.createdAt
        }))
      })

      return NextResponse.json({
        order,
        payments,
        debug: {
          hasPayment: payments.length > 0,
          hasSuccessfulPayment: payments.some(p => p.status === 'SUCCESS'),
          paymentLinked: payments.some(p => p.orderId === order.id)
        }
      })

    } else {
      // Debug recent orders
      const orders = await prisma.order.findMany({
        include: { 
          items: true,
          buyer: { include: { user: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      // Get all payments for these orders
      const orderIds = orders.map(o => o.id)
      const payments = await prisma.payment.findMany({
        where: { 
          OR: [
            { orderId: { in: orderIds } },
            { transactionId: { contains: 'order_' } }
          ]
        }
      })

      console.log('Recent orders debug:', {
        totalOrders: orders.length,
        totalPayments: payments.length,
        orders: orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          totalAmount: o.totalAmount,
          createdAt: o.createdAt,
          relatedPayments: payments.filter(p => 
            p.orderId === o.id || (p.transactionId && p.transactionId.includes(o.id))
          ).map(p => ({
            id: p.id,
            status: p.status,
            amount: p.amount,
            orderId: p.orderId
          }))
        }))
      })

      return NextResponse.json({
        orders,
        payments,
        summary: {
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === 'PENDING').length,
          paidOrders: orders.filter(o => o.status === 'PAID').length,
          totalPayments: payments.length,
          successfulPayments: payments.filter(p => p.status === 'SUCCESS').length,
          pendingPayments: payments.filter(p => p.status === 'PENDING').length
        }
      })
    }

  } catch (error) {
    console.error('Debug orders error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
