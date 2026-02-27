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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get buyer profile
    const buyer = await prisma.buyer.findUnique({
      where: { userId: token.sub }
    })

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer profile not found' },
        { status: 404 }
      )
    }

    // Get orders with items
    const orders = await prisma.order.findMany({
      where: { buyerId: buyer.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: {
                  select: {
                    id: true,
                    businessName: true
                  }
                }
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
      }
    })

    // Format response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      deliveryNotes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      itemCount: order._count.items,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.product.id,
          name: item.product.name,
          images: item.product.images ? JSON.parse(item.product.images) : [],
          seller: item.product.seller
        }
      }))
    }))

    return NextResponse.json({
      orders: formattedOrders,
      pagination: { page: 1, limit: 10, total: formattedOrders.length }
    })
  } catch (error) {
    console.error('Orders error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { items, shippingAddress, deliveryNotes, subtotal, shippingCost, totalAmount } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      )
    }

    // Get buyer profile
    const buyer = await prisma.buyer.findUnique({
      where: { userId: token.sub }
    })

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer profile not found' },
        { status: 404 }
      )
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Group items by seller to create separate orders for each seller
    const itemsBySeller = new Map()
    
    for (const item of items) {
      // Check product availability and get current price
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { 
          seller: {
            include: {
              user: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      })

      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`)
      }

      const sellerId = product.sellerId
      if (!itemsBySeller.has(sellerId)) {
        itemsBySeller.set(sellerId, {
          seller: product.seller,
          items: [],
          subtotal: 0
        })
      }
      
      itemsBySeller.get(sellerId).items.push({
        ...item,
        product
      })
      itemsBySeller.get(sellerId).subtotal += (item.price * item.quantity)
    }

    // Create separate orders for each seller
    const orders = await prisma.$transaction(async (tx) => {
      const createdOrders = []

      for (const [sellerId, sellerData] of itemsBySeller) {
        // Calculate shipping and totals for this seller's order
        const shippingCost = sellerData.items.reduce((sum: number, item: any) => {
          if (item.product.courierAvailable && item.product.courierPrice) {
            return sum + item.product.courierPrice
          }
          return sum
        }, 0)

        const orderTotal = sellerData.subtotal + shippingCost

        // Create order for this seller
        const newOrder = await tx.order.create({
          data: {
            orderNumber: `${orderNumber}-${sellerId.slice(-4)}`, // Make unique per seller
            buyerId: buyer.id,
            sellerId: sellerId,
            status: 'PENDING',
            currency: 'MWK',
            subtotal: sellerData.subtotal,
            taxAmount: 0,
            shippingAmount: shippingCost,
            discountAmount: 0,
            totalAmount: orderTotal,
            shippingAddress: JSON.stringify(shippingAddress),
            notes: deliveryNotes || null,
          }
        })

        // Create order items for this seller
        for (const item of sellerData.items) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
              productSnapshot: JSON.stringify({
                name: item.product.name,
                images: item.product.images ? JSON.parse(item.product.images) : [],
                seller: {
                  id: item.product.seller.id,
                  businessName: item.product.seller.businessName
                }
              })
            }
          })

          // Update product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        }

        // Create notification for seller
        await tx.notification.create({
          data: {
            userId: sellerData.seller.userId, // Use seller's user ID
            title: 'New Order Received',
            message: `You have a new order (${newOrder.orderNumber}) with ${sellerData.items.length} item(s) totaling MWK ${orderTotal.toFixed(2)}`,
            type: 'ORDER',
            data: JSON.stringify({
              orderId: newOrder.id,
              buyerId: buyer.id
            })
          }
        })

        createdOrders.push(newOrder)
      }

      return createdOrders
    })

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        orderId: order.id,
        orderNumber: order.orderNumber,
        sellerId: order.sellerId
      })),
      totalOrders: orders.length,
      message: orders.length > 1 
        ? `Successfully placed ${orders.length} orders with different sellers`
        : 'Order placed successfully'
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    
    // Handle specific errors
    if (error.message.includes('not found') || error.message.includes('Insufficient stock')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to place order' },
      { status: 500 }
    )
  }
}
