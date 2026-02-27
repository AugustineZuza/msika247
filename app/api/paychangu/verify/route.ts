import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { verifyPaychanguTransaction } from '@/lib/paychangu'

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
    const { txRef } = body

    if (!txRef) {
      return NextResponse.json({ error: 'Transaction reference is required' }, { status: 400 })
    }

    // Verify the transaction
    const verification = await verifyPaychanguTransaction(txRef)
    const verificationStatus = verification?.data?.payment_status || verification?.data?.status || verification?.status || ''
    const isSuccessful = ['successful', 'success', 'paid'].some((status) => verificationStatus.toLowerCase().includes(status))

    if (!isSuccessful) {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 })
    }

    // Find the payment record
    const payment = await prisma.payment.findFirst({ where: { transactionId: txRef } })
    
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        gatewayResponse: JSON.stringify(verification),
      },
    })

    // Get payment metadata
    const meta = verification?.data?.meta || {}
    const paymentType = meta.type || 'subscription'

    if (paymentType === 'subscription') {
      const sellerId = meta.sellerId || meta.seller_id
      const planId = meta.planId || meta.plan_id
      const durationDaysRaw = meta.durationDays || meta.duration_days

      if (!sellerId || !planId) {
        return NextResponse.json({ error: 'Invalid payment metadata' }, { status: 400 })
      }

      const seller = await prisma.seller.findUnique({ where: { id: sellerId } })
      if (!seller) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
      }

      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      }

      const durationDays = Number(durationDaysRaw) || 30
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + (Number.isFinite(durationDays) && durationDays > 0 ? durationDays : 30))

      // Create or update subscription
      await prisma.subscription.upsert({
        where: { sellerId: seller.id },
        update: {
          planId: plan.id,
          status: 'ACTIVE',
          startDate,
          endDate,
          cancelledAt: null,
        },
        create: {
          sellerId: seller.id,
          planId: plan.id,
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      })

      // Activate seller and products
      await prisma.seller.update({
        where: { id: seller.id },
        data: { isActive: true },
      })

      await prisma.product.updateMany({
        where: { sellerId: seller.id },
        data: { isActive: true },
      })

      return NextResponse.json({
        success: true,
        message: 'Subscription activated successfully',
        subscription: {
          sellerId: seller.id,
          planId: plan.id,
          status: 'ACTIVE',
          startDate,
          endDate
        }
      })
    }

    return NextResponse.json({ success: true, message: 'Payment verified successfully' })
  } catch (error) {
    console.error('Manual payment verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
