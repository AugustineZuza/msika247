import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = React.use(params) as { id: string }
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: resolvedParams.id },
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

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Get plan error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = React.use(params) as { id: string }
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      name,
      description,
      monthlyPrice,
      yearlyPrice,
      maxProducts,
      maxOrders,
      features,
      isActive,
      sortOrder
    } = await request.json()

    // Validate required fields
    if (!name || !monthlyPrice) {
      return NextResponse.json(
        { error: 'Name and monthly price are required' },
        { status: 400 }
      )
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: {
        name,
        description,
        monthlyPrice: parseFloat(monthlyPrice),
        yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : null,
        maxProducts: maxProducts ? parseInt(maxProducts) : undefined,
        maxOrders: maxOrders ? parseInt(maxOrders) : undefined,
        features: Array.isArray(features) ? JSON.stringify(features) : features,
        isActive: isActive !== undefined ? isActive : undefined,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
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

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Update plan error:', error)
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = React.use(params) as { id: string }
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if plan has active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        planId: resolvedParams.id,
        status: 'ACTIVE'
      }
    })

    if (activeSubscriptions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plan with active subscriptions' },
        { status: 400 }
      )
    }

    await prisma.subscriptionPlan.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ message: 'Plan deleted successfully' })
  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    )
  }
}
