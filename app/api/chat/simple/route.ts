import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

interface SimpleMessage {
  id: string
  content: string
  senderId: string
  conversationId: string
  read: boolean
  createdAt: string
  type: 'text' | 'image'
  sender: {
    name: string
    image?: string
  }
}

interface SimpleConversation {
  id: string
  buyerId: string
  sellerId: string
  productId?: string
  orderId?: string
  status: 'active' | 'closed' | 'reported'
  createdAt: string
  updatedAt: string
  lastMessage?: SimpleMessage
  messages?: SimpleMessage[]
}

// POST /api/chat/simple - Create conversation or send message
export async function POST(request: NextRequest) {
  try {
    console.log('API called: POST /api/chat/simple')
    
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    console.log('Token received:', { token: !!token, sub: token?.sub, name: token?.name })
    
    if (!token?.sub) {
      console.log('No token found, returning 401')
      return NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const { sellerId, productId, content, type = 'text', conversationId } = body

    if (!sellerId) {
      console.log('No sellerId provided')
      return NextResponse.json(
        { error: 'Seller ID is required' },
        { status: 400 }
      )
    }

    if (!content?.trim()) {
      console.log('No content provided')
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Get seller profile to verify
    const seller = await prisma.seller.findUnique({
      where: { userId: sellerId },
      include: { user: true }
    })

    if (!seller) {
      console.log('Seller not found for userId:', sellerId)
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      )
    }

    console.log('User authenticated:', { userId: token.sub, userName: token.name })
    console.log('Seller verified:', { sellerId: seller.id, sellerName: seller.businessName })

    console.log('Message request received:', {
      hasConversationId: !!conversationId,
      conversationId: conversationId,
      sellerId: sellerId,
      senderId: token.sub,
      senderName: token.name,
      isSenderSeller: token.sub === sellerId
    })

    let conversation = null
    
    // If conversationId is provided, try to find by ID first
    if (conversationId) {
      console.log('Looking for conversation by ID:', conversationId)
      const conversationById = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
      
      if (conversationById) {
        console.log('Found conversation by ID:', {
          id: conversationById.id,
          buyerId: conversationById.buyerId,
          sellerId: conversationById.sellerId
        })
        conversation = conversationById
      } else {
        console.log('Conversation not found by ID:', conversationId)
      }
    }
    
    // If no conversation found (either by ID or general search), try general search
    if (!conversation) {
      console.log('No conversation found by ID, trying general search')
      conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            {
              buyerId: token.sub,
              sellerId: sellerId
            },
            {
              buyerId: sellerId,
              sellerId: token.sub
            }
          ]
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
      console.log('Found conversation by general search:', conversation ? conversation.id : null)
    }
    
    if (!conversation) {
      console.log('No conversation found, creating new conversation')
      // Create new conversation
      try {
        // Determine who is buyer and who is seller based on the sellerId parameter
        const isSenderSeller = token.sub === sellerId
        const buyerId = isSenderSeller ? sellerId : token.sub
        const actualSellerId = isSenderSeller ? token.sub : sellerId
        
        console.log('Creating conversation with:', {
          buyerId,
          sellerId: actualSellerId,
          isSenderSeller
        })
        
        conversation = await prisma.conversation.create({
          data: {
            buyerId: buyerId,
            sellerId: actualSellerId,
            productId: productId || null
          },
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        })
        console.log('Created new conversation:', conversation.id)
        console.log('Conversation details:', {
          id: conversation.id,
          buyerId: conversation.buyerId,
          sellerId: conversation.sellerId,
          productId: conversation.productId
        })
      } catch (createError: any) {
        // If unique constraint violation, try to find the existing conversation
        if (createError.code === 'P2002') {
          console.log('Conversation already exists (constraint error), finding existing one')
          conversation = await prisma.conversation.findFirst({
            where: {
              OR: [
                {
                  buyerId: token.sub,
                  sellerId: sellerId
                },
                {
                  buyerId: sellerId,
                  sellerId: token.sub
                }
              ]
            },
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          })
          console.log('Found existing conversation after constraint error:', conversation?.id)
        } else {
          throw createError
        }
      }
    } else {
      console.log('Using existing conversation:', conversation.id)
    }

    // Ensure we have a conversation
    if (!conversation) {
      return NextResponse.json(
        { error: 'Failed to create or find conversation' },
        { status: 500 }
      )
    }

    // If content is provided, send a message
    if (content && content.trim()) {
      const message = await prisma.message.create({
        data: {
          content: content.trim(),
          senderId: token.sub,
          conversationId: conversation.id,
          read: false
        },
        include: {
          sender: {
            select: {
              name: true,
              profileImage: true
            }
          }
        }
      })

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          updatedAt: new Date()
        }
      })

      // Create notification for recipient (only if sender is not the recipient)
      try {
        let recipientId = sellerId
        let recipientName = seller.businessName
        
        console.log('Notification logic - Sender ID:', token.sub, 'Seller ID:', sellerId)
        
        // If sender is the seller, notify the buyer
        if (token.sub === sellerId) {
          recipientId = conversation.buyerId
          recipientName = 'Customer'
          console.log('Sender is seller, notifying buyer:', recipientId)
        } else {
          console.log('Sender is buyer, notifying seller:', recipientId)
        }
        
        // Only create notification if the sender is not the recipient
        if (token.sub !== recipientId) {
          console.log('Creating notification for recipient:', recipientId)
          await prisma.notification.create({
            data: {
              title: 'New Message',
              message: `You have a new message from ${token.name}`,
              type: 'MESSAGE',
              isRead: false,
              userId: recipientId,
              data: JSON.stringify({
                senderId: token.sub,
                senderName: token.name,
                productId: productId,
                conversationId: conversation.id
              })
            }
          })
          console.log('Successfully created notification for recipient:', recipientId, '(', recipientName, ')')
        } else {
          console.log('Sender is recipient, skipping notification')
        }
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError)
      }
      
      console.log('Message sent successfully:', message.id)
      console.log('Returning message response:', {
        success: true,
        messageId: message.id,
        conversationId: conversation.id,
        senderId: token.sub,
        content: message.content
      })
      
      return NextResponse.json({
        success: true,
        message: {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          conversationId: message.conversationId,
          read: message.read,
          createdAt: message.createdAt.toISOString(),
          type: type || 'text',
          sender: {
            name: message.sender.name,
            image: message.sender.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name || 'User')}&background=random`
          }
        },
        conversationId: conversation.id
      })
    }

    return NextResponse.json({
      conversation: conversation
    })
  } catch (error) {
    console.error('Simple chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
