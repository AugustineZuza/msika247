import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { createPayoutNotification } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    const whereClause: any = {}

    if (status !== 'all') {
      whereClause.status = status
    }

    if (search) {
      whereClause.OR = [
        {
          wallet: {
            seller: {
              businessName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          wallet: {
            seller: {
              user: {
                email: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          }
        }
      ]
    }

    const [payoutRequests, total] = await Promise.all([
      prisma.payoutRequest.findMany({
        where: whereClause,
        include: {
          wallet: {
            include: {
              seller: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.payoutRequest.count({ where: whereClause })
    ])

    // Calculate total pending amount
    const pendingTotal = await prisma.payoutRequest.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true }
    })

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
        processedAt: payout.processedAt,
        processedBy: payout.processedBy,
        seller: {
          id: payout.wallet.seller.id,
          businessName: payout.wallet.seller.businessName,
          user: payout.wallet.seller.user
        }
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        pendingTotal: pendingTotal._sum.amount || 0,
        totalRequests: total
      }
    })

  } catch (error) {
    console.error('Admin payouts fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch payout requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { payoutRequestId, action, adminNotes, reference } = body

    if (!payoutRequestId) {
      return NextResponse.json({ error: 'Payout request ID is required' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Valid action is required (approve/reject)' }, { status: 400 })
    }

    // Get payout request
    const payoutRequest = await prisma.payoutRequest.findUnique({
      where: { id: payoutRequestId },
      include: {
        wallet: {
          include: {
            seller: true
          }
        }
      }
    })

    if (!payoutRequest) {
      return NextResponse.json({ error: 'Payout request not found' }, { status: 404 })
    }

    if (payoutRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Payout request already processed' }, { status: 400 })
    }

    const updateData: any = {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      adminNotes,
      processedAt: new Date(),
      processedBy: token.sub
    }

    if (action === 'approve' && reference) {
      updateData.reference = reference
    }

    // Update payout request
    const updatedPayout = await prisma.payoutRequest.update({
      where: { id: payoutRequestId },
      data: updateData,
      include: {
        wallet: {
          include: {
            seller: true
          }
        }
      }
    })

    if (action === 'approve') {
      // Update wallet total withdrawn
      await prisma.sellerWallet.update({
        where: { sellerId: payoutRequest.wallet.sellerId },
        data: {
          totalWithdrawn: {
            increment: payoutRequest.amount
          }
        }
      })

      // Create wallet transaction
      await prisma.walletTransaction.create({
        data: {
          walletId: payoutRequest.walletId,
          type: 'WITHDRAWAL',
          amount: -payoutRequest.amount,
          balance: payoutRequest.wallet.availableBalance,
          description: `Payout approved - ${payoutRequest.paymentMethod}`,
          reference: payoutRequest.id,
          metadata: JSON.stringify({
            payoutRequestId: payoutRequest.id,
            paymentMethod: payoutRequest.paymentMethod,
            status: 'APPROVED',
            reference
          })
        }
      })

      // Send notification to seller about approved payout
      await createPayoutNotification({
        userId: payoutRequest.wallet.seller.userId,
        amount: payoutRequest.amount,
        status: 'APPROVED',
        payoutRequestId: payoutRequest.id
      })
    } else {
      // Rejected - return amount to available balance
      await prisma.sellerWallet.update({
        where: { sellerId: payoutRequest.wallet.sellerId },
        data: {
          availableBalance: {
            increment: payoutRequest.amount
          }
        }
      })

      // Create wallet transaction
      await prisma.walletTransaction.create({
        data: {
          walletId: payoutRequest.walletId,
          type: 'WITHDRAWAL',
          amount: payoutRequest.amount,
          balance: payoutRequest.wallet.availableBalance + payoutRequest.amount,
          description: `Payout rejected - funds returned`,
          reference: payoutRequest.id,
          metadata: JSON.stringify({
            payoutRequestId: payoutRequest.id,
            status: 'REJECTED',
            reason: adminNotes
          })
        }
      })

      // Send notification to seller about rejected payout
      await createPayoutNotification({
        userId: payoutRequest.wallet.seller.userId,
        amount: payoutRequest.amount,
        status: 'REJECTED',
        payoutRequestId: payoutRequest.id
      })
    }

    return NextResponse.json({
      success: true,
      payoutRequest: {
        id: updatedPayout.id,
        amount: updatedPayout.amount,
        status: updatedPayout.status,
        processedAt: updatedPayout.processedAt
      }
    })

  } catch (error) {
    console.error('Admin payout processing error:', error)
    return NextResponse.json({ error: 'Failed to process payout request' }, { status: 500 })
  }
}
