import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub || token.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get current date and 30 days ago for monthly calculations
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch real data from database
    const [
      totalRevenue,
      monthlyRevenue,
      totalSellers,
      activeSellers,
      activeSubscriptions,
      totalOrders,
      paidOrders,
      totalUsers,
      buyers,
      subscriptionPayments
    ] = await Promise.all([
      // Total revenue from all paid orders
      prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true }
      }),
      
      // Monthly revenue from orders
      prisma.order.aggregate({
        where: { 
          status: 'PAID',
          createdAt: { gte: thirtyDaysAgo }
        },
        _sum: { totalAmount: true }
      }),
      
      // Total sellers
      prisma.seller.count(),
      
      // Active sellers
      prisma.seller.count({ where: { isActive: true } }),
      
      // Active subscriptions
      prisma.subscription.count({ 
        where: { 
          status: 'ACTIVE',
          endDate: { gte: now }
        }
      }),
      
      // Total orders
      prisma.order.count(),
      
      // Paid orders
      prisma.order.count({ where: { status: 'PAID' } }),
      
      // Total users
      prisma.user.count(),
      
      // Buyers (users who are not sellers)
      prisma.user.count({
        where: {
          seller: null
        }
      }),
      
      // Total subscription payments
      prisma.payment.aggregate({
        where: { 
          status: 'SUCCESS',
          subscriptionId: { not: null }
        },
        _sum: { amount: true }
      })
    ])

    const stats = {
      revenue: {
        total: (totalRevenue._sum.totalAmount || 0) + (subscriptionPayments._sum.amount || 0),
        thisMonth: (monthlyRevenue._sum.totalAmount || 0), // Add monthly subscription payments if needed
      },
      sellers: {
        total: totalSellers,
        active: activeSellers,
        inactive: totalSellers - activeSellers,
      },
      subscriptions: {
        active: activeSubscriptions,
      },
      orders: {
        total: totalOrders,
        paid: paidOrders,
      },
      users: {
        total: totalUsers,
        buyers: buyers,
        sellers: totalSellers,
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
