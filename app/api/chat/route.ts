import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

// GET /api/chat - Get user's conversations
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const otherUserId = searchParams.get('otherUserId')

    let whereClause: any = {
      OR: [
        { buyerId: token.sub },
        { sellerId: token.sub }
      ]
    }

    // Filter by product if specified
    if (productId) {
      whereClause.productId = productId
    }

    // Filter by specific user if specified
    if (otherUserId) {
      whereClause.OR = [
        { buyerId: token.sub, sellerId: otherUserId },
        { buyerId: otherUserId, sellerId: token.sub }
      ]
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        buyer: {
          select: { id: true, name: true }
        },
        seller: {
          select: { id: true, name: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    console.log('Found conversations:', conversations.length)
    console.log('User ID:', token.sub)
    console.log('Where clause:', whereClause)

    return NextResponse.json({
      conversations: conversations.map(conv => ({
        id: conv.id,
        participant1: conv.buyer,
        participant2: conv.seller,
        lastMessage: conv.messages[conv.messages.length - 1],
        updatedAt: conv.updatedAt,
        unreadCount: conv.messages.filter(msg => 
          !msg.read && msg.senderId !== token.sub
        ).length,
        sellerId: conv.sellerId,
        buyerId: conv.buyerId,
        productId: conv.productId
      }))
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST /api/chat - Send a new message
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { message, recipientId, productId } = body

    if (!message?.trim() || !recipientId) {
      return NextResponse.json(
        { error: 'Message and recipient are required' },
        { status: 400 }
      )
    }

    // Get or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { buyerId: token.sub, sellerId: recipientId },
          { buyerId: recipientId, sellerId: token.sub }
        ]
      }
    })

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          buyerId: token.sub,
          sellerId: recipientId,
          productId: productId || null
        }
      })
    }

    // Create new message
    const newMessage = await prisma.message.create({
      data: {
        content: message.trim(),
        senderId: token.sub,
        conversationId: conversation.id,
        read: false
      }
    })

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        updatedAt: new Date()
      }
    })

    // Mark message as read for sender
    await prisma.message.updateMany({
      where: {
        id: { in: [newMessage.id] }
      },
      data: {
        read: true
      }
    })

    // Create notification for recipient
    try {
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId }
      })

      if (recipient && recipientId !== token.sub) {
        await prisma.notification.create({
          data: {
            title: 'New Message',
            message: `You have a new message regarding product: ${productId || 'general inquiry'}`,
            type: 'MESSAGE',
            userId: recipientId,
            data: JSON.stringify({
              senderId: token.sub,
              senderName: (await prisma.user.findUnique({
                where: { id: token.sub }
              }))?.name || 'Customer',
              productId: productId
            })
          }
        })
      }
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      messageId: newMessage.id,
      conversationId: conversation.id
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
