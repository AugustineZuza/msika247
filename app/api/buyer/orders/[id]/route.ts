import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

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

    // Get specific order with items
    const order = await prisma.order.findFirst({
      where: { 
        id,
        buyerId: buyer.id 
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Format response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      deliveryNotes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      itemCount: order._count.items,
      seller: order.items[0]?.product.seller ? {
        id: order.items[0].product.seller.id,
        businessName: order.items[0].product.seller.businessName,
        user: order.items[0].product.seller.user
      } : null,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        productSnapshot: {
          name: item.product.name,
          images: item.product.images ? JSON.parse(item.product.images) : [],
          seller: {
            id: item.product.seller.id,
            businessName: item.product.seller.businessName
          }
        }
      }))
    }

    return NextResponse.json(formattedOrder)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
