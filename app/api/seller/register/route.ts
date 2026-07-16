import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

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
    const {
      businessName,
      businessEmail,
      businessPhone,
      businessAddress: address,
      businessCategory,
      businessDescription,
      firstName,
      lastName,
      email,
      phone
    } = body

    // Validate required fields
    if (!businessName || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already has a seller profile
    const existingSeller = await prisma.seller.findUnique({
      where: { userId: token.sub }
    })

    if (existingSeller) {
      return NextResponse.json(
        { error: 'Seller profile already exists' },
        { status: 400 }
      )
    }

    // Create seller profile
    const seller = await prisma.seller.create({
      data: {
        userId: token.sub,
        businessName,
        businessEmail: businessEmail || email,
        businessPhone: businessPhone || phone,
        address,
        businessDescription,
        isActive: true,
        verificationStatus: "PENDING",
        rating: 0,
        totalReviews: 0
      }
    })

    console.log('Seller profile created:', seller.id)

    return NextResponse.json({
      success: true,
      seller: {
        id: seller.id,
        businessName: seller.businessName,
        isActive: seller.isActive
      }
    })

  } catch (error) {
    console.error('Seller registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create seller profile' },
      { status: 500 }
    )
  }
}
