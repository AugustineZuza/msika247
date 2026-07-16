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

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const paymentType = searchParams.get('type') || 'all' // Changed from 'type' to 'paymentType'
    const status = searchParams.get('status') || 'all'
    const date = searchParams.get('date') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    let whereClause: any = {}

    // Search filter
    if (search) {
      whereClause.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Payment type filter - FIXED: Use subscriptionId/orderId instead of type
    if (paymentType !== 'all') {
      if (paymentType === 'subscription') {
        whereClause.subscriptionId = { not: null }
      } else if (paymentType === 'order') {
        whereClause.orderId = { not: null }
      }
    }

    // Status filter
    if (status !== 'all') {
      whereClause.status = status
    }

    // Date filter
    if (date !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (date) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = new Date(0)
      }

      whereClause.createdAt = {
        gte: startDate
      }
    }

    // Get all payments with proper filtering
    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        subscription: {
          include: {
            seller: {
              select: {
                businessName: true
              }
            },
            plan: {
              select: {
                name: true
              }
            }
          }
        },
        order: {
          select: {
            orderNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Format payments based on their actual relationships
    const formattedPayments = payments.map((payment) => {
      const isSubscription = !!payment.subscriptionId
      const isOrder = !!payment.orderId
      
      return {
        id: payment.id,
        type: isSubscription ? 'SUBSCRIPTION' as const : 'ORDER' as const,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod || 'Unknown',
        createdAt: payment.createdAt.toISOString(),
        user: payment.user,
        relatedEntity: {
          id: isSubscription ? payment.subscriptionId || '' : payment.orderId || '',
          plan: isSubscription ? payment.subscription?.plan?.name || 'Unknown' : undefined,
          orderNumber: isOrder ? payment.order?.orderNumber || 'Unknown' : undefined
        }
      }
    })
      .map((payment, index) => ({
        ...payment,
        // Ensure unique key by combining type and id if needed
        key: payment.type === 'SUBSCRIPTION' 
          ? `sub_${payment.id}` 
          : `order_${payment.id}`
      }))

    // Calculate stats
    const stats = {
      totalRevenue: formattedPayments.reduce((sum, p) => sum + p.amount, 0),
      subscriptionRevenue: formattedPayments.filter(p => p.type === 'SUBSCRIPTION').reduce((sum, p) => sum + p.amount, 0),
      orderRevenue: formattedPayments.filter(p => p.type === 'ORDER').reduce((sum, p) => sum + p.amount, 0)
    }

    return NextResponse.json({
      payments: formattedPayments,
      stats,
      pagination: {
        page,
        limit,
        total: formattedPayments.length,
        pages: Math.ceil(formattedPayments.length / limit)
      }
    })

  } catch (error) {
    console.error('Payments API error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch payments',
        details: error instanceof Error ? error.message : 'Unknown server error'
      }, 
      { status: 500 }
    )
  }
}
