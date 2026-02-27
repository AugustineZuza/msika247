import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date and 30 days ago for monthly growth
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Get seller statistics
    const [totalSellers, activeSellers, suspendedSellers, expiredSellers] = await Promise.all([
      prisma.seller.count(),
      prisma.seller.count({
        where: {
          isActive: true,
          verificationStatus: 'VERIFIED'
        }
      }),
      prisma.seller.count({
        where: {
          isActive: false
        }
      }),
      prisma.seller.count({
        where: {
          verificationStatus: 'REJECTED'
        }
      })
    ])

    // Get buyer statistics
    const totalBuyers = await prisma.buyer.count()

    // Get order statistics
    const [totalOrders, recentOrders, previousOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      })
    ])

    // Calculate monthly growth
    const monthlyGrowth = previousOrders > 0 
      ? Math.round(((recentOrders - previousOrders) / previousOrders) * 100)
      : 0

    // Get revenue statistics from Payment model
    const [subscriptionRevenue, commissionRevenue] = await Promise.all([
      prisma.payment.aggregate({
        _sum: {
          amount: true
        },
        where: {
          subscriptionId: {
            not: null
          },
          status: 'SUCCESS'
        }
      }),
      prisma.payment.aggregate({
        _sum: {
          amount: true
        },
        where: {
          orderId: {
            not: null
          },
          status: 'SUCCESS'
        }
      })
    ])

    // Get recent activity
    const recentSellers = await prisma.seller.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    const recentOrdersActivity = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        buyer: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Format recent activity
    const recentActivity = [
      ...recentSellers.map(seller => ({
        id: seller.id,
        type: 'seller' as const,
        message: `New seller registered: ${seller.user.name}`,
        timestamp: seller.createdAt.toISOString(),
        status: 'success' as const
      })),
      ...recentOrdersActivity.map(order => ({
        id: order.id,
        type: 'order' as const,
        message: `New order: ${order.orderNumber} by ${order.buyer.user.name}`,
        timestamp: order.createdAt.toISOString(),
        status: 'success' as const
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

    const stats = {
      totalRevenue: (subscriptionRevenue._sum.amount || 0) + (commissionRevenue._sum.amount || 0),
      activeSellers,
      suspendedSellers,
      expiredSellers,
      totalBuyers,
      totalOrders,
      monthlyGrowth,
      subscriptionRevenue: subscriptionRevenue._sum.amount || 0,
      commissionRevenue: commissionRevenue._sum.amount || 0
    }

    return NextResponse.json({
      stats,
      recentActivity
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
