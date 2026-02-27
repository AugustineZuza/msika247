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

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { buyerId: token.sub },
          { sellerId: token.sub }
        ]
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            role: true,
            profileImage: true
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            role: true,
            profileImage: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Format conversations
    const formattedConversations = conversations.map((conv: any) => {
      const otherParticipant = conv.buyerId === token.sub ? conv.seller : conv.buyer
      const unreadCount = conv.messages.filter((m: any) => 
        m.senderId !== token.sub && !m.read
      ).length

      return {
        id: conv.id,
        participant: {
          id: otherParticipant.id,
          name: otherParticipant.name || 'Unknown',
          role: otherParticipant.role || 'BUYER',
          avatar: otherParticipant.profileImage || undefined
        },
        lastMessage: conv.messages[0] ? {
          content: conv.messages[0].content,
          createdAt: conv.messages[0].createdAt.toISOString(),
          isRead: conv.messages[0].read
        } : {
          content: 'No messages yet',
          createdAt: conv.createdAt.toISOString(),
          isRead: true
        },
        unreadCount,
        updatedAt: conv.updatedAt.toISOString()
      }
    })

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}
