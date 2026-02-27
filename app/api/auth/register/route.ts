import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      name,
      role = 'BUYER',
      phone,
      businessName,
    } = body

    console.log('Registration attempt:', { email, name, role })

    // Validate input
    if (!email || !password || !name) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('User already exists:', email)
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    console.log('Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log('Password hashed successfully')

    // Create user
    console.log('Creating user...')
    const normalizedRole = role.toUpperCase() as 'BUYER' | 'SELLER' | 'ADMIN'

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: normalizedRole,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    })

    console.log('User created:', user.id)

    // Create role-specific profile
    if (normalizedRole === 'SELLER') {
      console.log('Creating seller profile...')

      if (!businessName) {
        return NextResponse.json(
          { error: 'Business name is required for seller accounts' },
          { status: 400 }
        )
      }

      await prisma.seller.create({
        data: {
          userId: user.id,
          businessName,
          businessPhone: phone ?? undefined,
          verificationStatus: 'PENDING',
          isActive: false,
        }
      })
    } else if (normalizedRole === 'BUYER') {
      console.log('Creating buyer profile...')
      await prisma.buyer.create({
        data: {
          userId: user.id,
        }
      })
    }

    console.log('Registration successful for:', email)

    return NextResponse.json(
      { 
        message: 'Registration successful',
        user
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
