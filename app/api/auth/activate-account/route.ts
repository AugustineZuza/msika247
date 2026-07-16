import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashToken } from '@/lib/tokens'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Activation token is required' },
        { status: 400 }
      )
    }

    const hashedToken = hashToken(token)

    const user = await prisma.user.findFirst({
      where: {
        activationToken: hashedToken,
        activationTokenExpires: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired activation token' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        activationToken: null,
        activationTokenExpires: null
      }
    })

    return NextResponse.json(
      { message: 'Account activated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Account activation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
