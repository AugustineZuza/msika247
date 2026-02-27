import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: token.sub,
        ...(unreadOnly && { isRead: false })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    // Get unread messages count
    const unreadMessages = await prisma.message.count({
      where: {
        OR: [
          {
            conversation: {
              buyerId: token.sub
            }
          },
          {
            conversation: {
              sellerId: token.sub
            }
          }
        ],
        senderId: { not: token.sub },
        read: false
      }
    })

    // Format notifications
    const formattedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        let formattedNotif = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt.toISOString()
        }

        // If this is a message notification, get sender info
        if (notification.type === 'MESSAGE' && notification.data) {
          const data = notification.data as any
          if (data.messageId) {
            const message = await prisma.message.findUnique({
              where: { id: data.messageId as string },
              include: {
                sender: {
                  select: {
                    name: true
                  }
                }
              }
            })

            if (message?.sender) {
              return {
                ...formattedNotif,
                title: 'New Message',
                message: message.content,
                senderName: message.sender.name,
                conversationId: data.conversationId as string
              }
            }
          }
        }

        return formattedNotif
      })
    )

    return NextResponse.json({ 
      notifications: formattedNotifications,
      unreadMessageCount: unreadMessages
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationIds, markAsRead } = body

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'Invalid notification IDs' }, { status: 400 })
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (markAsRead) {
      // Mark notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds as string[] },
          userId: token.sub
        },
        data: { isRead: true }
      })

      // Mark messages as read if these are message notifications
      const messageNotifications = await prisma.notification.findMany({
        where: {
          id: { in: notificationIds as string[] },
          type: 'MESSAGE',
          userId: token.sub
        }
      })

      for (const notif of messageNotifications) {
        const data = notif.data as any
        if (data.messageId) {
          await prisma.message.updateMany({
            where: {
              conversationId: data.conversationId as string,
              senderId: { not: token.sub },
              read: false
            },
            data: { read: true }
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update notifications:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
