import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { createPayoutRequestNotification } from '@/lib/notifications'

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
    const { amount, paymentMethod, paymentDetails } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    if (!paymentMethod || !['airtel_money', 'tnm_mpamba', 'bank_transfer'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Valid payment method is required' }, { status: 400 })
    }

    if (!paymentDetails) {
      return NextResponse.json({ error: 'Payment details are required' }, { status: 400 })
    }

    // Get seller profile
    const seller = await prisma.seller.findUnique({
      where: { userId: token.sub }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    // Get seller wallet
    const wallet = await prisma.sellerWallet.findUnique({
      where: { sellerId: seller.id }
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    // Check available balance
    if (amount > wallet.availableBalance) {
      return NextResponse.json({ 
        error: 'Insufficient balance', 
        availableBalance: wallet.availableBalance 
      }, { status: 400 })
    }

    // Check for pending payout requests
    const existingPendingRequest = await prisma.payoutRequest.findFirst({
      where: {
        walletId: wallet.id,
        status: 'PENDING'
      }
    })

    if (existingPendingRequest) {
      return NextResponse.json({ 
        error: 'You already have a pending payout request' 
      }, { status: 400 })
    }

    // Create payout request
    const payoutRequest = await prisma.payoutRequest.create({
      data: {
        walletId: wallet.id,
        amount,
        status: 'PENDING',
        paymentMethod,
        paymentDetails: JSON.stringify(paymentDetails)
      }
    })

    // Update wallet - deduct from available balance immediately
    await prisma.sellerWallet.update({
      where: { sellerId: seller.id },
      data: {
        availableBalance: {
          decrement: amount
        }
      }
    })

    // Create wallet transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        amount: -amount,
        balance: wallet.availableBalance - amount,
        description: `Payout request - ${paymentMethod}`,
        reference: payoutRequest.id,
        metadata: JSON.stringify({
          payoutRequestId: payoutRequest.id,
          paymentMethod,
          status: 'PENDING'
        })
      }
    })

    // Send notification to admin about new payout request
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    })

    await Promise.all(
      adminUsers.map(admin =>
        createPayoutRequestNotification({
          userId: admin.id,
          sellerName: seller.businessName,
          amount,
          payoutRequestId: payoutRequest.id
        })
      )
    )

    return NextResponse.json({
      success: true,
      payoutRequest: {
        id: payoutRequest.id,
        amount,
        status: payoutRequest.status,
        paymentMethod,
        createdAt: payoutRequest.createdAt
      }
    })

  } catch (error) {
    console.error('Payout request error:', error)
    return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get seller profile
    const seller = await prisma.seller.findUnique({
      where: { userId: token.sub }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    // Get wallet
    const wallet = await prisma.sellerWallet.findUnique({
      where: { sellerId: seller.id }
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    // Get payout requests
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'all'

    const whereClause: any = {
      walletId: wallet.id
    }

    if (status !== 'all') {
      whereClause.status = status
    }

    const [payoutRequests, total] = await Promise.all([
      prisma.payoutRequest.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.payoutRequest.count({ where: whereClause })
    ])

    return NextResponse.json({
      payoutRequests: payoutRequests.map(payout => ({
        id: payout.id,
        amount: payout.amount,
        status: payout.status,
        paymentMethod: payout.paymentMethod,
        paymentDetails: payout.paymentDetails ? JSON.parse(payout.paymentDetails) : null,
        reference: payout.reference,
        adminNotes: payout.adminNotes,
        createdAt: payout.createdAt,
        processedAt: payout.processedAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Payouts fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}
