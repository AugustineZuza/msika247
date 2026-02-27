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
    const status = searchParams.get('status') || 'all'
    const date = searchParams.get('date') || 'all'
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
            orderNumber: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            buyer: {
              user: {
                name: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          },
          {
            buyer: {
              user: {
                email: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          },
          {
            seller: {
              businessName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        ]
      }
    }

    // Status filter
    if (status !== 'all') {
      whereClause.status = status
    }

    // Date filter
    if (date !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (date) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = new Date(0)
      }

      whereClause.createdAt = {
        gte: startDate
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          buyer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
              paymentMethod: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true
                }
              }
            }
          },
          _count: {
            select: {
              items: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({ where: whereClause })
    ])

    // Get seller information for each order
    const ordersWithSeller = await Promise.all(
      orders.map(async (order) => {
        // Get seller from the first item's product
        const firstItem = order.items[0]
        if (!firstItem) {
          return {
            ...order,
            seller: null
          }
        }

        const product = await prisma.product.findUnique({
          where: { id: firstItem.productId },
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
        })

        return {
          ...order,
          seller: product?.seller || null
        }
      })
    )

    // Format orders
    const formattedOrders = ordersWithSeller.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      buyer: order.buyer,
      seller: order.seller,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        product: {
          name: item.product.name,
          images: item.product.images ? JSON.parse(item.product.images) : []
        }
      })),
      shippingAddress: order.shippingAddress,
      payment: order.payment
    }))

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
