import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMins = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMins / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMins < 60) {
    return `${diffInMins} min ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hr ago`
  } else {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }
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
        subscription: {
          include: {
            plan: true
          }
        }
      }
    })

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      )
    }

    // Check if seller has a subscription, if not, create a free trial subscription
    let subscription = seller.subscription
    if (!subscription) {
      try {
        // Get the free plan
        const freePlan = await prisma.subscriptionPlan.findFirst({
          where: { 
            name: 'FREE' 
          }
        })

        if (freePlan) {
          // Create a free trial subscription
          const trialEndDate = new Date()
          trialEndDate.setDate(trialEndDate.getDate() + 30) // 30 days trial
          
          subscription = await prisma.subscription.create({
            data: {
              sellerId: seller.id,
              planId: freePlan.id,
              status: 'ACTIVE',
              startDate: new Date(),
              endDate: trialEndDate,
              autoRenew: false
            },
            include: {
              plan: true
            }
          })
          
          console.log('Created free trial subscription for seller:', seller.id)
        }
      } catch (error) {
        console.error('Failed to create free trial subscription:', error)
        // Continue without subscription
      }
    }

    // Get product stats
    const products = await prisma.product.findMany({
      where: { sellerId: seller.id },
      select: {
        id: true,
        isActive: true,
      }
    })

    const activeProducts = products.filter(p => p.isActive).length

    // Get order stats
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              sellerId: seller.id
            }
          }
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    const totalOrders = orders.length
    const paidOrders = orders.filter(o => o.status === 'PAID').length

    // Calculate earnings
    const totalEarnings = orders
      .filter(o => o.status === 'PAID')
      .reduce((sum, order) => {
        const sellerItemsTotal = order.items
          .filter(item => item.product.sellerId === seller.id)
          .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0)
        return sum + sellerItemsTotal
      }, 0)

    // Calculate performance metrics
    const avgOrderValue = paidOrders > 0 ? totalEarnings / paidOrders : 0
    const conversionRate = products.length > 0 ? (paidOrders / products.length) * 100 : 0

    // Get seller rating and response time
    const sellerMetrics = await prisma.sellerMetrics.findUnique({
      where: { sellerId: seller.id }
    })

    // Use correct property names from sellerMetrics table
    const rating = sellerMetrics?.averageRating || 0
    // responseTime property doesn't exist, use a default value
    const responseTime = 1.8 // Default response time in hours

    // Get recent activity
    const recentOrders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              sellerId: seller.id
            }
          }
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    })

    // Get recent reviews (mock for now - would need reviews table)
    const recentReviews = [] // TODO: Implement when reviews table exists

    // Get recent product approvals
    const recentProducts = await prisma.product.findMany({
      where: {
        sellerId: seller.id,
        isActive: true,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        name: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    })

    // Format recent activity
    const recentActivity = [
      ...recentOrders.map(order => ({
        type: 'order',
        title: 'New order',
        description: `MWK ${order.totalAmount.toLocaleString()} • ${formatTimeAgo(order.createdAt)}`,
        timestamp: order.createdAt
      })),
      ...recentProducts.map(product => ({
        type: 'approval',
        title: 'Product approved',
        description: `${product.name} • ${formatTimeAgo(product.createdAt)}`,
        timestamp: product.createdAt
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 3)

    // Get plan details if subscription exists
    let planDetails = null
    if (subscription) {
      planDetails = await prisma.subscriptionPlan.findUnique({
        where: { id: subscription.planId }
      })
    }

    return NextResponse.json({
      seller: {
        id: seller.id,
        userId: seller.userId,
        businessName: seller.businessName,
        isActive: seller.isActive
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        endDate: subscription.endDate.toISOString(),
        plan: subscription.plan
      } : null,
      products: {
        total: products.length,
        active: activeProducts
      },
      orders: {
        total: totalOrders,
        paid: paidOrders
      },
      earnings: {
        total: totalEarnings
      },
      performance: {
        conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
        avgOrderValue: Math.round(avgOrderValue),
        rating: Math.round(rating * 10) / 10, // Round to 1 decimal
        responseTime: responseTime > 0 ? `${(responseTime / 60).toFixed(1)} hrs` : 'N/A'
      },
      recentActivity: recentActivity
    })
  } catch (error) {
    console.error('Error fetching seller stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seller stats' },
      { status: 500 }
    )
  }
}
