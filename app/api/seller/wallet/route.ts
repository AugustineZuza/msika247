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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get seller profile
    const seller = await prisma.seller.findUnique({
      where: { userId: token.sub }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    // Get or create seller wallet
    let wallet = await prisma.sellerWallet.findUnique({
      where: { sellerId: seller.id },
      include: {
        walletTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        payoutRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!wallet) {
      wallet = await prisma.sellerWallet.create({
        data: {
          sellerId: seller.id,
          availableBalance: 0,
          pendingBalance: 0,
          totalEarnings: 0,
          totalWithdrawn: 0
        },
        include: {
          walletTransactions: true,
          payoutRequests: true
        }
      })
    }

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        availableBalance: wallet.availableBalance,
        pendingBalance: wallet.pendingBalance,
        totalEarnings: wallet.totalEarnings,
        totalWithdrawn: wallet.totalWithdrawn,
        lastUpdated: wallet.lastUpdated
      },
      recentTransactions: wallet.walletTransactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        balance: tx.balance,
        description: tx.description,
        reference: tx.reference,
        metadata: tx.metadata ? JSON.parse(tx.metadata) : null,
        createdAt: tx.createdAt
      })),
      recentPayoutRequests: wallet.payoutRequests.map(payout => ({
        id: payout.id,
        amount: payout.amount,
        status: payout.status,
        paymentMethod: payout.paymentMethod,
        paymentDetails: payout.paymentDetails ? JSON.parse(payout.paymentDetails) : null,
        reference: payout.reference,
        adminNotes: payout.adminNotes,
        createdAt: payout.createdAt,
        processedAt: payout.processedAt
      }))
    })
  } catch (error) {
    console.error('Wallet fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }
}
