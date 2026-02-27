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

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || 'all'
    const unreadOnly = searchParams.get('unread') === 'true'

    const whereClause: any = {}

    if (type !== 'all') {
      whereClause.type = type
    }

    if (unreadOnly) {
      whereClause.isRead = false
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where: whereClause })
    ])

    return NextResponse.json({
      notifications: notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data ? JSON.parse(notification.data) : null,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
        user: notification.user
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Admin notifications fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, title, message, type, data } = body

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'User ID, title, and message are required' }, { status: 400 })
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'GENERAL',
        data: data ? JSON.stringify(data) : null
      }
    })

    return NextResponse.json({
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data ? JSON.parse(notification.data) : null,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Admin notification creation error:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
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

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
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
        id: { in: notificationIds }
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      updated: result.count
    })
  } catch (error) {
    console.error('Admin notification update error:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
