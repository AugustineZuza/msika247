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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get buyer profile
    const buyer = await prisma.buyer.findUnique({
      where: { userId: token.sub }
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 })
    }

    // Fetch orders with items and seller info
    const orders = await prisma.order.findMany({
      where: { buyerId: buyer.id },
      include: {
        items: true,
        seller: {
          select: {
            businessName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      orders: orders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          productSnapshot: typeof item.productSnapshot === 'string' 
            ? JSON.parse(item.productSnapshot) 
            : item.productSnapshot
        }))
      }))
    })
  } catch (error) {
    console.error('Fetch orders error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
