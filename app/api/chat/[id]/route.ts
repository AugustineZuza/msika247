import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// GET /api/chat/[id] - Get messages for a conversation
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get conversation to verify user has access
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: {
        buyerId: true,
        sellerId: true
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check if user is part of this conversation
    if (conversation.buyerId !== token.sub && conversation.sellerId !== token.sub) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId: id
      },
      include: {
        sender: {
          select: { id: true, name: true, profileImage: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit
    })

    // Get total count for pagination
    const totalMessages = await prisma.message.count({
      where: {
        conversationId: id
      }
    })

    // Mark messages as read for this user
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: token.sub }, // Only mark messages sent by others as read
        read: false
      },
      data: {
        read: true
      }
    })

    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        type: msg.type,
        senderId: msg.senderId,
        conversationId: msg.conversationId,
        read: msg.read,
        createdAt: msg.createdAt,
        sender: {
          id: msg.sender.id,
          name: msg.sender.name,
          avatar: msg.sender.profileImage || '/placeholder-avatar.jpg'
        }
      })),
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/chat/[id] - Send a message to a conversation
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params
    const body = await request.json()
    const { content, type = 'TEXT' } = body

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Get conversation to verify user has access
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: {
        buyerId: true,
        sellerId: true
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check if user is part of this conversation
    if (conversation.buyerId !== token.sub && conversation.sellerId !== token.sub) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        type: type,
        senderId: token.sub,
        conversationId: id,
        read: false
      },
      include: {
        sender: {
          select: { id: true, name: true, profileImage: true }
        }
      }
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id },
      data: {
        updatedAt: new Date()
      }
    })

    // Create notification for recipient
    const recipientId = conversation.buyerId === token.sub ? conversation.sellerId : conversation.buyerId
    const senderName = message.sender.name

    await prisma.notification.create({
      data: {
        title: 'New Message',
        message: `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        type: 'MESSAGE',
        isRead: false,
        userId: recipientId,
        data: JSON.stringify({
          conversationId: id,
          messageId: message.id,
          senderId: token.sub,
          senderName: senderName
        })
      }
    })

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        senderId: message.senderId,
        conversationId: message.conversationId,
        read: message.read,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          avatar: message.sender.profileImage || '/placeholder-avatar.jpg'
        }
      }
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
