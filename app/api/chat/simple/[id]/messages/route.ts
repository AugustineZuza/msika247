import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// GET /api/chat/simple/[id]/messages - Get conversation messages
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
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const conversation = await prisma.conversation.findUnique({
      where: { id }
    })
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Verify user is part of this conversation
    const isParticipant = conversation.buyerId === token.sub || conversation.sellerId === token.sub
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id
      },
      include: {
        sender: {
          select: {
            name: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
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

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      conversationId: msg.conversationId,
      read: msg.read,
      createdAt: msg.createdAt.toISOString(),
      type: 'text',
      sender: {
        name: msg.sender.name,
        image: msg.sender.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender.name || 'User')}&background=random`
      }
    }))

    return NextResponse.json({
      messages: formattedMessages
    })
  } catch (error) {
    console.error('Simple chat messages API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
