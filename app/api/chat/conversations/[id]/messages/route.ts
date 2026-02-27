import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

// GET /api/chat/conversations/[id]/messages - Get conversation messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: id,
        OR: [
          { buyerId: token.sub },
          { sellerId: token.sub }
        ]
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id
      },
      include: {
        sender: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset
    })

    // Mark messages as read for this user
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: token.sub },
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
        sender: msg.sender
      }))
    })
  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/chat/conversations/[id]/messages - Send message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { content, type = 'text' } = body

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Verify user is part of this conversation and check permissions
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: id,
        status: 'active'
      },
      include: {
        buyer: { select: { role: true } },
        seller: { select: { role: true } }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or inactive' },
        { status: 404 }
      )
    }

    const isBuyer = conversation.buyerId === token.sub
    const isSeller = conversation.sellerId === token.sub

    // Check permissions: buyers can always message, sellers can only reply
    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // For sellers, check if they're replying (not starting new conversation)
    if (isSeller) {
      const existingMessages = await prisma.message.count({
        where: {
          conversationId: id
        }
      })

      if (existingMessages === 0) {
        return NextResponse.json(
          { error: 'Sellers can only reply to existing conversations' },
          { status: 403 }
        )
      }
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
    const recipientId = isBuyer ? conversation.sellerId : conversation.buyerId
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
        sender: message.sender
      }
    })
  } catch (error) {
    console.error('Send message API error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// PUT /api/chat/conversations/[id]/read - Mark messages as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: id,
        OR: [
          { buyerId: token.sub },
          { sellerId: token.sub }
        ]
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // Mark all messages from other user as read
    const result = await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: token.sub },
        read: false
      },
      data: {
        read: true
      }
    })

    return NextResponse.json({
      success: true,
      messagesMarkedAsRead: result.count
    })
  } catch (error) {
    console.error('Mark as read API error:', error)
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}
