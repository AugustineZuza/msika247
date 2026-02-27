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

    const [plans, activeSubscriptions, totalRevenue, expiringSoonCount] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: {
              subscriptions: {
                where: { status: 'ACTIVE' }
              }
            }
          }
        }
      }),
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: {
          plan: true,
          seller: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          subscriptionId: { not: null }
        }
      }),
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    const stats = {
      totalPlans: plans.length,
      activeSubscriptions: activeSubscriptions.length,
      totalRevenue: totalRevenue._sum.amount || 0,
      expiringSoon: expiringSoonCount
    }

    return NextResponse.json({ plans, subscriptions: activeSubscriptions, stats })
  } catch (error) {
    console.error('Subscriptions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
