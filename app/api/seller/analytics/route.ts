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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    const sellerId = seller.id

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get seller's products
    const products = await prisma.product.findMany({
      where: { sellerId },
      include: {
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    })

    // Get orders in date range
    const orders = await prisma.order.findMany({
      where: {
        sellerId,
        createdAt: {
          gte: startDate
        }
      },
      include: {
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

    // Get previous period data for growth calculation
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    const previousOrders = await prisma.order.findMany({
      where: {
        sellerId,
        createdAt: {
          gte: previousStartDate,
          lt: startDate
        }
      }
    })

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    const totalOrders = orders.length
    const previousOrdersCount = previousOrders.length
    const ordersGrowth = previousOrdersCount > 0 ? ((totalOrders - previousOrdersCount) / previousOrdersCount) * 100 : 0

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get top products
    const productSales = new Map()
    orders.forEach(order => {
      order.items.forEach(item => {
        const current = productSales.get(item.productId) || { sales: 0, revenue: 0, name: item.productSnapshot.name }
        current.sales += item.quantity
        current.revenue += item.total
        productSales.set(item.productId, current)
      })
    })

    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        id: productId,
        name: data.name,
        sales: data.sales,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)

    // Generate monthly data for chart
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthOrders = orders.filter(order => 
        order.createdAt >= monthStart && order.createdAt < monthEnd
      )
      
      const monthRevenue = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0)
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        orders: monthOrders.length
      })
    }

    const analyticsData = {
      totalRevenue,
      totalOrders,
      totalProducts: products.length,
      averageOrderValue,
      revenueGrowth,
      ordersGrowth,
      topProducts,
      recentOrders: orders.slice(0, 10).map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt.toISOString()
      })),
      monthlyData
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
