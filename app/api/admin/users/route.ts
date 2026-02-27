import { NextRequest, NextResponse } from 'next/server'
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
    const role = searchParams.get('role') || 'all'
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    let whereClause: any = {}

    // Search filter
    if (search) {
      whereClause = {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      }
    }

    // Role filter
    if (role !== 'all') {
      whereClause.role = role
    }

    // Status filter
    if (status === 'active') {
      whereClause.isActive = true
    } else if (status === 'inactive') {
      whereClause.isActive = false
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          buyer: {
            select: {
              id: true
            }
          },
          seller: {
            select: {
              id: true,
              businessName: true,
              _count: {
                select: {
                  products: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ])

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        let profile: any = {}
        let lastLogin = undefined

        if (user.role === 'BUYER' && user.buyer) {
          const buyerStats = await prisma.order.aggregate({
            _count: { id: true },
            _sum: { totalAmount: true },
            where: {
              buyerId: user.buyer.id
            }
          })

          profile = {
            totalOrders: buyerStats._count.id || 0,
            totalSpent: buyerStats._sum.totalAmount || 0
          }
        }

        if (user.role === 'SELLER' && user.seller) {
          const sellerStats = await prisma.orderItem.aggregate({
            _count: { id: true },
            _sum: { total: true },
            where: {
              product: {
                sellerId: user.seller.id
              }
            }
          })

          profile = {
            businessName: user.seller.businessName,
            totalProducts: user.seller._count.products,
            totalRevenue: sellerStats._sum.total || 0
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt.toISOString(),
          lastLogin: user.lastLoginAt?.toISOString(),
          profile
        }
      })
    )

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
