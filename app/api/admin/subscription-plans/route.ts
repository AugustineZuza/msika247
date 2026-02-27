import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const plans = [
      { id: '1', name: 'Starter', monthlyPrice: 9.99, features: ['10 products', 'Basic analytics'] },
      { id: '2', name: 'Pro', monthlyPrice: 29.99, features: ['100 products', 'Advanced analytics', 'Priority support'] },
      { id: '3', name: 'Enterprise', monthlyPrice: 99.99, features: ['Unlimited products', 'Full analytics', '24/7 support'] },
    ]

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
    const { name, description, monthlyPrice, maxProducts, maxOrders, features } = body

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        monthlyPrice,
        maxProducts,
        maxOrders,
        features: features || [],
        isActive: true,
      },
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
