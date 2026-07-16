import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateActivationToken, hashToken } from '@/lib/tokens'
import { emailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'If an account with that email exists, an activation link has been sent.' },
        { status: 200 }
      )
    }

    if (user.isActive) {
      return NextResponse.json(
        { message: 'Account is already active' },
        { status: 200 }
      )
    }

    const activationToken = generateActivationToken()
    const hashedToken = hashToken(activationToken)
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        activationToken: hashedToken,
        activationTokenExpires: expiresAt
      }
    })

    const emailSent = await emailService.sendAccountActivation(email, activationToken)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send activation email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'If an account with that email exists, an activation link has been sent.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Account activation request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
