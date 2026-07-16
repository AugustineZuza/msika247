import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get buyer profile
    const buyer = await prisma.buyer.findUnique({
      where: { userId: token.sub }
    })

    console.log('Order API - Token user ID:', token.sub)
    console.log('Order API - Buyer found:', !!buyer)

    const orderId = id

    // If no buyer profile with current session, try to find order by ID first
    if (!buyer) {
      console.log('Order API - No buyer profile found, checking order directly')
      
      // Try to find the order first to see if it exists
      const orderExists = await prisma.order.findUnique({
        where: { id: orderId }
      })
      
      if (orderExists) {
        console.log('Order API - Order exists but user mismatch, returning limited info')
        return NextResponse.json({ 
          error: 'Access denied - This order belongs to a different account',
          code: 'USER_MISMATCH',
          orderId: orderId 
        }, { status: 403 })
      }
      
      return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 })
    }

    // Fetch specific order with all details
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        buyerId: buyer.id 
      },
      include: {
        items: true,
        seller: {
          select: {
            businessName: true,
            businessEmail: true,
            businessPhone: true
          }
        },
        buyer: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Parse JSON fields
    const parsedOrder = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        productSnapshot: typeof item.productSnapshot === 'string' 
          ? JSON.parse(item.productSnapshot) 
          : item.productSnapshot
      }))
    }

    return NextResponse.json({ order: parsedOrder })
  } catch (error) {
    console.error('Fetch order error:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}
