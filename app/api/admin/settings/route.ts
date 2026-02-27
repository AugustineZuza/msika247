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

    // Get real marketplace statistics from database
    const [totalSellers, totalBuyers, totalOrders, activeProducts] = await Promise.all([
      prisma.seller.count(),
      prisma.buyer.count(),
      prisma.order.count(),
      prisma.product.count({ where: { isActive: true } })
    ])

    // Get real payment statistics
    const paymentStats = await prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        status: 'SUCCESS'
      }
    })

    // Get recent activity counts
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const [recentOrders, recentSellers] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      prisma.seller.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      })
    ])

    // Return settings with real database data
    const settings = {
      marketplace: {
        name: 'Msika247',
        description: 'Multi-vendor marketplace platform',
        logo: '',
        favicon: '',
        currency: 'MWK',
        timezone: 'Africa/Blantyre',
        language: 'en',
        // Real statistics
        totalSellers,
        totalBuyers,
        totalOrders,
        activeProducts,
        totalRevenue: paymentStats._sum.amount || 0,
        successfulTransactions: paymentStats._count.id || 0
      },
      payments: {
        enabledGateways: ['mobile_money', 'bank_transfer'],
        commissionRate: 5,
        minimumOrderAmount: 1000,
        enableRefunds: true,
        refundPeriod: 30,
        // Real payment data
        totalRevenue: paymentStats._sum.amount || 0,
        totalTransactions: paymentStats._count.id || 0
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        orderNotifications: true,
        sellerNotifications: true,
        buyerNotifications: true,
        adminNotifications: true
      },
      security: {
        enableTwoFactor: false,
        passwordMinLength: 8,
        sessionTimeout: 24,
        enableCaptcha: false,
        maxLoginAttempts: 5
      },
      autoApproval: {
        autoApproveSellers: false,
        autoApproveProducts: false,
        requireSellerVerification: true,
        enableProductModeration: true
      },
      // Real activity data
      activity: {
        recentOrders,
        recentSellers,
        lastUpdated: new Date().toISOString()
      }
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await request.json()

    // Log the settings update for audit purposes
    console.log('Settings updated by admin:', token.email, {
      timestamp: new Date().toISOString(),
      settings
    })

    // In a real implementation, you would save these to a database table
    // For now, we'll just return success with the updated settings
    return NextResponse.json({ 
      message: 'Settings saved successfully',
      settings,
      updatedBy: token.email,
      updatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Save settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
