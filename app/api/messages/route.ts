import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { buyerId: token.sub },
          { sellerId: token.sub }
        ]
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
                profileImage: true
              }
            }
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const formattedMessages = conversation.messages.map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.sender.name,
      senderRole: msg.sender.role,
      receiverId: token.sub,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      isRead: msg.read,
      senderAvatar: msg.sender.profileImage
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, content } = body

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: 'Conversation ID and content required' }, { status: 400 })
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { buyerId: token.sub },
          { sellerId: token.sub }
        ]
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Create new message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: token.sub,
        content: content.trim(),
        read: false
      }
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    // Get sender info for response
    const sender = await prisma.user.findUnique({
      where: { id: token.sub },
      select: {
        id: true,
        name: true,
        role: true,
        profileImage: true
      }
    })

    const formattedMessage = {
      id: message.id,
      senderId: token.sub,
      senderName: sender?.name || 'Unknown',
      senderRole: sender?.role || 'BUYER',
      receiverId: conversation.buyerId === token.sub ? conversation.sellerId : conversation.buyerId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      isRead: false,
      senderAvatar: sender?.profileImage
    }

    return NextResponse.json({ message: formattedMessage })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId } = body

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mark all messages in conversation as read for this user
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: token.sub },
        read: false
      },
      data: { read: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark messages as read:', error)
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
  }
}
