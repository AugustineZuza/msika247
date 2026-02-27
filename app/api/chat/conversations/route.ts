import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const productId = searchParams.get('productId')

    // Build where clause based on user role
    const whereClause: any = {
      OR: [
        { buyerId: token.sub },
        { sellerId: token.sub }
      ]
    }

    // Filter by order if specified
    if (orderId) {
      whereClause.orderId = orderId
    }

    // Filter by product if specified
    if (productId) {
      whereClause.productId = productId
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        buyer: {
          select: { id: true, name: true, profileImage: true }
        },
        seller: {
          select: { id: true, name: true, profileImage: true }
        },
        product: {
          select: { id: true, name: true, images: true }
        },
        order: {
          select: { id: true, status: true, totalAmount: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Get only the last message for preview
        },
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                senderId: { not: token.sub } // Count only unread messages from other user
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Format conversations
    const formattedConversations = conversations.map(conv => {
      const lastMessage = conv.messages[0]
      const isBuyer = conv.buyerId === token.sub
      const otherUser = isBuyer ? conv.seller : conv.buyer

      return {
        id: conv.id,
        orderId: conv.orderId,
        productId: conv.productId,
        status: conv.status,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        product: conv.product ? {
          id: conv.product.id,
          name: conv.product.name,
          image: conv.product.images?.[0] || '/placeholder-product.jpg'
        } : null,
        order: conv.order ? {
          id: conv.order.id,
          status: conv.order.status,
          total: conv.order.totalAmount
        } : null,
        otherUser: {
          id: otherUser?.id,
          name: otherUser?.name,
          image: otherUser?.profileImage || '/placeholder-avatar.jpg'
        },
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          type: lastMessage.type,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt
        } : null,
        unreadCount: conv._count.messages
      }
    })

    return NextResponse.json(formattedConversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, productId, recipientId, message } = body

    if (!recipientId || !message) {
      return NextResponse.json(
        { error: 'Recipient and message are required' },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { buyerId: token.sub, sellerId: recipientId },
          { buyerId: recipientId, sellerId: token.sub }
        ],
        ...(orderId && { orderId }),
        ...(productId && { productId })
      }
    })

    if (existingConversation) {
      return NextResponse.json(
        { error: 'Conversation already exists' },
        { status: 400 }
      )
    }

    // Determine user roles
    const currentUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true }
    })

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { role: true }
    })

    if (!currentUser || !recipient) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        buyerId: currentUser.role === 'BUYER' ? token.sub : recipientId,
        sellerId: currentUser.role === 'SELLER' ? token.sub : recipientId,
        ...(orderId && { orderId }),
        ...(productId && { productId })
      },
      include: {
        buyer: {
          select: { id: true, name: true, profileImage: true }
        },
        seller: {
          select: { id: true, name: true, profileImage: true }
        },
        product: {
          select: { id: true, name: true, images: true }
        },
        order: {
          select: { id: true, status: true, totalAmount: true }
        }
      }
    })

    // Create initial message
    const initialMessage = await prisma.message.create({
      data: {
        content: message,
        type: 'TEXT',
        senderId: token.sub,
        conversationId: conversation.id,
        read: false
      }
    })

    // Create notification for recipient
    const isBuyer = conversation.buyerId === token.sub
    const recipientUser = isBuyer ? conversation.seller : conversation.buyer

    await prisma.notification.create({
      data: {
        title: 'New Conversation',
        message: `Someone started a conversation with you`,
        type: 'MESSAGE',
        isRead: false,
        userId: recipientUser.id,
        data: JSON.stringify({
          conversationId: conversation.id,
          messageId: initialMessage.id,
          senderId: token.sub
        })
      }
    })

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        orderId: conversation.orderId,
        productId: conversation.productId,
        status: conversation.status,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        product: conversation.product ? {
          id: conversation.product.id,
          name: conversation.product.name,
          image: conversation.product.images?.[0] || '/placeholder-product.jpg'
        } : null,
        order: conversation.order ? {
          id: conversation.order.id,
          status: conversation.order.status,
          total: conversation.order.totalAmount
        } : null,
        otherUser: {
          id: recipientUser.id,
          name: recipientUser.name,
          image: recipientUser.profileImage || '/placeholder-avatar.jpg'
        }
      },
      message: initialMessage
    })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}
