import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: {
            subscriptions: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    return NextResponse.json({ plans })

  } catch (error) {
    console.error('Subscription plans API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, price, duration, productLimit, features, isActive, yearlyPrice } = await request.json()

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description: '',
        monthlyPrice: price,
        yearlyPrice: yearlyPrice || null,
        maxProducts: productLimit || 100,
        features: features ? JSON.stringify(features) : null,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json({ plan })

  } catch (error) {
    console.error('Create subscription plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
