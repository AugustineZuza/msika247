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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get seller profile
    const seller = await prisma.seller.findUnique({
      where: { userId: token.sub }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') || 'all'
    const unreadOnly = searchParams.get('unread') === 'true'

    const whereClause: any = {
      userId: token.sub
    }

    if (type !== 'all') {
      whereClause.type = type
    }

    if (unreadOnly) {
      whereClause.isRead = false
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where: whereClause })
    ])

    // Mark notifications as read when fetched
    if (unreadOnly) {
      await prisma.notification.updateMany({
        where: {
          userId: token.sub,
          isRead: false
        },
        data: {
          isRead: true
        }
      })
    }

    return NextResponse.json({
      notifications: notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data ? JSON.parse(notification.data) : null,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Seller notifications fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get seller profile
    const seller = await prisma.seller.findUnique({
      where: { userId: token.sub }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { notificationIds, markAsRead } = body

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'Notification IDs are required' }, { status: 400 })
    }

    const updateData: any = {}
    if (markAsRead !== undefined) {
      updateData.isRead = markAsRead
    }

    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: token.sub
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      updated: result.count
    })
  } catch (error) {
    console.error('Seller notification update error:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
