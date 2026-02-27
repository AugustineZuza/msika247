import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

function hasActiveSubscription(seller: { isActive: boolean; subscription: { status: string; endDate: Date } | null }) {
  if (!seller.isActive) return false
  if (!seller.subscription) return false

  const { status, endDate } = seller.subscription
  const now = new Date()
  return status === 'ACTIVE' && endDate.getTime() > now.getTime()
}

function inactiveResponse(subscription?: { status: string; endDate: Date | null }) {
  return NextResponse.json(
    {
      error: 'Active subscription required to manage orders',
      code: 'SUBSCRIPTION_INACTIVE',
      subscription: subscription
        ? {
            status: subscription.status,
            endDate: subscription.endDate ? subscription.endDate.toISOString() : null,
          }
        : null,
    },
    { status: 403 }
  )
}

export async function GET(request: NextRequest) {
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

    // Get seller profile
    const seller = await prisma.seller.findUnique({
      where: { userId: token.sub },
      include: {
        subscription: true,
      },
    })

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      )
    }

    if (!hasActiveSubscription(seller)) {
      return inactiveResponse(seller.subscription ?? undefined)
    }

    // Get orders where this seller is the seller
    const orders = await prisma.order.findMany({
      where: { sellerId: seller.id },
      include: {
        buyer: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get payments for these orders
    const orderIds = orders.map(order => order.id)
    const payments = await prisma.payment.findMany({
      where: {
        orderId: {
          in: orderIds
        }
      },
      select: {
        id: true,
        orderId: true,
        status: true,
        amount: true,
        paymentMethod: true,
        createdAt: true
      }
    })

    // Create a map of orderId to payment
    const paymentMap = new Map()
    payments.forEach(payment => {
      paymentMap.set(payment.orderId, payment)
    })

    return NextResponse.json({
      orders: orders.map(order => {
        const payment = paymentMap.get(order.id)
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          shippingAddress: order.shippingAddress,
          deliveryNotes: order.notes,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          itemCount: order.items.length,
          paymentStatus: payment ? payment.status : 'PENDING',
          paymentMethod: payment ? payment.paymentMethod : null,
          paidAmount: payment ? payment.amount : 0,
          paymentDate: payment ? payment.createdAt.toISOString() : null,
          items: order.items.map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            product: {
              id: item.product.id,
              name: item.product.name,
              images: item.product.images ? JSON.parse(item.product.images) : []
            },
            buyer: {
              id: order.buyer.id,
              name: order.buyer.user.name
            }
          }))
        }
      }),
      pagination: { page: 1, limit: 10, total: orders.length }
    })
  } catch (error) {
    console.error('Orders error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
