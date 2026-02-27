import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    console.log('Token:', token)

    if (!token?.sub) {
      return NextResponse.json({ 
        error: 'No token found',
        token: null 
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        token 
      }, { status: 404 })
    }

    let sellerProfile = null
    if (user.role === 'SELLER') {
      sellerProfile = await prisma.seller.findUnique({
        where: { userId: user.id },
        include: {
          subscription: {
            include: {
              plan: true
            }
          }
        }
      })
    }

    return NextResponse.json({
      user,
      sellerProfile,
      token
    })

  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: (error as Error).message 
    }, { status: 500 })
  }
}
