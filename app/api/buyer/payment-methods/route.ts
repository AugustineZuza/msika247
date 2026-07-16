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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get buyer payment methods (placeholder for now)
    return NextResponse.json({
      paymentMethods: []
    })
  } catch (error) {
    console.error('Get payment methods error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { type, last4, expiryMonth, expiryYear, isDefault } = body

    // Validate required fields
    if (!type || !last4) {
      return NextResponse.json(
        { error: 'Payment type and last 4 digits are required' },
        { status: 400 }
      )
    }

    // For now, we'll store this in a simple way
    // In a real implementation, you'd create a PaymentMethod model
    const paymentMethod = {
      id: `pm_${Date.now()}`, // Temporary ID
      userId: token.sub,
      type,
      last4,
      expiryMonth,
      expiryYear,
      isDefault
    }

    return NextResponse.json({
      paymentMethod,
      message: 'Payment method added successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Add payment method error:', error)
    return NextResponse.json(
      { error: 'Failed to add payment method' },
      { status: 500 }
    )
  }
}
