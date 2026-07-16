import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const plans = await prisma.subscriptionPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
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
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Plans error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      monthlyPrice, 
      yearlyPrice, 
      maxProducts, 
      maxOrders, 
      features,
      sortOrder = 0 
    } = body

    // Validate required fields
    if (!name || !monthlyPrice) {
      return NextResponse.json(
        { error: 'Name and monthly price are required' },
        { status: 400 }
      )
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        monthlyPrice: parseFloat(monthlyPrice),
        yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : null,
        maxProducts: maxProducts ? parseInt(maxProducts) : 100,
        maxOrders: maxOrders ? parseInt(maxOrders) : -1,
        features: Array.isArray(features) ? JSON.stringify(features) : features,
        isActive: true,
        sortOrder: parseInt(sortOrder),
      },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    )
  }
}
