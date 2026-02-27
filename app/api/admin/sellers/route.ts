import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    let whereClause: any = {}

    if (search) {
      whereClause = {
        OR: [
          {
            businessName: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            user: {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          },
          {
            user: {
              email: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        ]
      }
    }

    // Apply status filters
    if (status === 'active') {
      whereClause.isActive = true
      whereClause.verificationStatus = 'VERIFIED'
    } else if (status === 'suspended') {
      whereClause.isActive = false
    } else if (status === 'pending') {
      whereClause.verificationStatus = 'PENDING'
    } else if (status === 'rejected') {
      whereClause.verificationStatus = 'REJECTED'
    }

    const [sellers, total] = await Promise.all([
      prisma.seller.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              createdAt: true
            }
          },
          subscription: {
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true
            }
          },
          _count: {
            select: {
              products: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.seller.count({ where: whereClause })
    ])

    // Get additional stats for each seller
    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        const [orderStats, productRevenue] = await Promise.all([
          prisma.order.aggregate({
            _count: { id: true },
            _sum: { totalAmount: true },
            where: {
              sellerId: seller.id
            }
          }),
          prisma.product.aggregate({
            _sum: { price: true },
            where: {
              sellerId: seller.id,
              isActive: true
            }
          })
        ])

        return {
          id: seller.id,
          businessName: seller.businessName,
          user: seller.user,
          subscription: seller.subscription,
          verificationStatus: seller.verificationStatus,
          isActive: seller.isActive,
          stats: {
            totalOrders: orderStats._count.id || 0,
            totalRevenue: orderStats._sum.totalAmount || 0,
            totalProducts: seller._count.products || 0,
            productValue: productRevenue._sum.price || 0
          },
          createdAt: seller.createdAt.toISOString()
        }
      })
    )

    return NextResponse.json({
      sellers: sellersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Sellers API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
