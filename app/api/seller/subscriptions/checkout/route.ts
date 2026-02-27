import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { prisma } from '@/lib/prisma'
import { initiatePaychanguCheckout } from '@/lib/paychangu'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId } = body as { planId?: string }

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 })
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: token.sub },
      include: { user: true }
    })

    if (!seller || !seller.user) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    const plan = await prisma.subscriptionPlan.findFirst({
      where: {
        id: planId,
        isActive: true
      }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 })
    }

    const txRef = `sub_${seller.id}_${Date.now()}`
    const callbackUrl = `${APP_URL}/api/paychangu/callback`
    const returnUrl = `${APP_URL}/seller/subscription?status=success`
    const failedUrl = `${APP_URL}/seller/subscription?status=failed`
    
    console.log('Checkout URLs generated:')
    console.log('APP_URL:', APP_URL)
    console.log('Callback URL:', callbackUrl)
    console.log('Return URL:', returnUrl)
    console.log('Failed URL:', failedUrl)
    console.log('txRef:', txRef)

    const checkoutSession = await initiatePaychanguCheckout({
      amount: plan.monthlyPrice,
      currency: 'MWK',
      email: seller.user.email,
      firstName: seller.user.name?.split(' ')[0] || '',
      lastName: seller.user.name?.split(' ').slice(1).join(' ') || undefined,
      txRef,
      callbackUrl,
      returnUrl,
      failedUrl,
      customization: {
        title: `${plan.name} Subscription`,
        description: `Marketplace seller subscription - ${plan.name}`,
      },
      meta: {
        sellerId: seller.id,
        planId: plan.id,
        durationDays: 30,
      },
    })

    console.log('PayChangu checkout session created:', checkoutSession)

    await prisma.payment.create({
      data: {
        userId: seller.userId,
        amount: plan.monthlyPrice,
        currency: 'MWK',
        status: 'PENDING',
        paymentMethod: 'PAYCHANGU',
        transactionId: txRef,
        description: `${plan.name} subscription purchase`,
        gatewayResponse: JSON.stringify(checkoutSession),
      }
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession.checkout_url,
      txRef,
    })
  } catch (error) {
    console.error('Seller checkout error:', error)
    
    // Handle specific network errors
    if (error instanceof Error) {
      if (error.message.includes('Connect Timeout Error') || 
          error.message.includes('UND_ERR_CONNECT_TIMEOUT') ||
          error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { 
            error: 'Payment service is temporarily unavailable. Please try again in a few minutes.',
            code: 'NETWORK_ERROR'
          }, 
          { status: 503 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to start checkout' },
      { status: 500 }
    )
  }
}
