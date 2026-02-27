import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Cart status test started')
    
    // Test auth
    const session = await auth()
    console.log('Session result:', session ? 'Session found' : 'No session')
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        message: 'No active session - user not logged in',
        cartCount: 0
      })
    }

    // Test database connection
    const buyerCount = await prisma.buyer.count()
    console.log('Total buyers in database:', buyerCount)

    // Test buyer profile for current user
    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id }
    })

    if (!buyer) {
      return NextResponse.json({
        success: true,
        message: 'User logged in but no buyer profile found',
        userEmail: session.user.email,
        userRole: session.user.role,
        cartCount: 0
      })
    }

    // Test cart for buyer
    const cart = await prisma.cart.findUnique({
      where: { buyerId: buyer.id },
      include: {
        _count: {
          select: { items: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Cart status retrieved successfully',
      userEmail: session.user.email,
      userRole: session.user.role,
      buyerId: buyer.id,
      cartExists: !!cart,
      cartCount: cart?._count.items || 0
    })
  } catch (error) {
    console.error('Cart status test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message,
        stack: (error as Error).stack 
      },
      { status: 500 }
    )
  }
}
